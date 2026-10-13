const mongoose = require('mongoose');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { bindController } = asyncHandler;
const { success } = require('../utils/response');
const getPagination = require('../utils/pagination');
const { uploadToCloudinary, destroyFromCloudinary } = require('../services/uploadService');


const PRIVATE_FIELDS = '-password -refreshToken -resetPasswordToken -resetPasswordExpires';

const addSubdoc = (field) =>
    asyncHandler(async (req, res) => {
        const user = await User.findById(req.user._id);
        user[field].push(req.body);
        await user.save();
        return success(res, 201, `${field} entry added`, user[field]);
    });

const updateSubdoc = (field) =>
    asyncHandler(async (req, res) => {
        const user = await User.findById(req.user._id);
        const entry = user[field].id(req.params.entryId);
        if (!entry) throw new ApiError(404, `${field} entry not found`);

        Object.assign(entry, req.body);
        await user.save();
        return success(res, 200, `${field} entry updated`, user[field]);
    });

const deleteSubdoc = (field) =>
    asyncHandler(async (req, res) => {
        const user = await User.findById(req.user._id);
        const entry = user[field].id(req.params.entryId);
        if (!entry) throw new ApiError(404, `${field} entry not found`);

        entry.deleteOne();
        await user.save();
        return success(res, 200, `${field} entry removed`, user[field]);
    });

class ProfileController {
    async getMyProfile(req, res) {
        const user = await User.findById(req.user._id).select(PRIVATE_FIELDS).populate('company', 'name logo');
        return success(res, 200, 'Profile fetched', user);
    }

    async getPublicProfile(req, res) {
        const user = await User.findOne({ _id: req.params.id, isDeleted: false })
            .select(`${PRIVATE_FIELDS} -phone -resume.publicId`)
            .populate('company', 'name logo industry');

        if (!user) throw new ApiError(404, 'User not found');
        if (user.status === 'blocked') throw new ApiError(404, 'User not found');

        return success(res, 200, 'Profile fetched', user);
    }

    async updateProfile(req, res) {
        const user = await User.findById(req.user._id);

        const allowed = ['name', 'headline', 'about', 'location', 'phone'];
        allowed.forEach((field) => {
            if (req.body[field] !== undefined) user[field] = req.body[field];
        });
        if (req.body.links) {
            user.links = { ...user.links.toObject?.() ?? user.links, ...req.body.links };
        }

        await user.save();
        return success(res, 200, 'Profile updated', user);
    }

    async uploadProfileImage(req, res) {
        if (!req.file) throw new ApiError(400, 'No image file uploaded');

        const user = await User.findById(req.user._id);
        const { url, publicId } = await uploadToCloudinary(req.file.path, 'profile-images', 'image');

        if (user.profileImagePublicId) {
            await destroyFromCloudinary(user.profileImagePublicId, 'image');
        }

        user.profileImage = url;
        user.profileImagePublicId = publicId;
        await user.save();

        return success(res, 200, 'Profile image updated', { profileImage: url });
    }

    async uploadResume(req, res) {
        if (!req.file) throw new ApiError(400, 'No resume file uploaded');

        const user = await User.findById(req.user._id);
        const { url, publicId } = await uploadToCloudinary(req.file.path, 'resumes', 'raw');

        if (user.resume?.publicId) {
            await destroyFromCloudinary(user.resume.publicId, 'raw');
        }

        user.resume = {
            url,
            publicId,
            originalName: req.file.originalname,
            uploadedAt: new Date(),
        };
        await user.save();

        return success(res, 200, 'Resume uploaded', user.resume);
    }

    async deleteResume(req, res) {
        const user = await User.findById(req.user._id);
        if (!user.resume?.url) throw new ApiError(404, 'No resume on file');

        await destroyFromCloudinary(user.resume.publicId, 'raw');
        user.resume = { url: '', publicId: '', originalName: '', uploadedAt: null };
        await user.save();

        return success(res, 200, 'Resume removed');
    }

    addExperience = addSubdoc('experience');
    updateExperience = updateSubdoc('experience');
    deleteExperience = deleteSubdoc('experience');

    addEducation = addSubdoc('education');
    updateEducation = updateSubdoc('education');
    deleteEducation = deleteSubdoc('education');

    addCertification = addSubdoc('certifications');
    updateCertification = updateSubdoc('certifications');
    deleteCertification = deleteSubdoc('certifications');

    addSkill = addSubdoc('skills');
    updateSkill = updateSubdoc('skills');
    deleteSkill = deleteSubdoc('skills');

    async searchCandidates(req, res) {
        const { keyword, skills, location, minExperience, jobTitle } = req.query;
        const { limit, skip, buildMeta } = getPagination(req.query);

        const match = { role: 'jobseeker', isDeleted: false, status: 'active' };

        if (location) match.location = { $regex: location, $options: 'i' };
        if (skills) {
            const skillList = skills.split(',').map((s) => s.trim()).filter(Boolean);
            if (skillList.length) {
                match['skills.name'] = { $in: skillList.map((s) => new RegExp(`^${s}$`, 'i')) };
            }
        }
        if (keyword) {
            match.$or = [
                { name: { $regex: keyword, $options: 'i' } },
                { headline: { $regex: keyword, $options: 'i' } },
                { about: { $regex: keyword, $options: 'i' } },
            ];
        }

        const pipeline = [{ $match: match }];

        if (jobTitle || minExperience) {
            pipeline.push({ $unwind: { path: '$experience', preserveNullAndEmptyArrays: false } });

            const expMatch = {};
            if (jobTitle) expMatch['experience.position'] = { $regex: jobTitle, $options: 'i' };
            if (Object.keys(expMatch).length) pipeline.push({ $match: expMatch });

            if (minExperience) {
                pipeline.push({
                    $addFields: {
                        entryYears: {
                            $divide: [
                                {
                                    $subtract: [
                                        { $ifNull: ['$experience.endDate', new Date()] },
                                        '$experience.startDate',
                                    ],
                                },
                                1000 * 60 * 60 * 24 * 365,
                            ],
                        },
                    },
                });
            }

            pipeline.push({
                $group: {
                    _id: '$_id',
                    doc: { $first: '$$ROOT' },
                    totalYears: { $sum: { $ifNull: ['$entryYears', 0] } },
                },
            });
            pipeline.push({ $replaceRoot: { newRoot: { $mergeObjects: ['$doc', { totalYears: '$totalYears' }] } } });

            if (minExperience) {
                pipeline.push({ $match: { totalYears: { $gte: Number(minExperience) } } });
            }
        }

        pipeline.push({
            $project: {
                name: 1, headline: 1, location: 1, profileImage: 1,
                skills: 1, education: 1, totalYears: 1, createdAt: 1,
                experience: 1,
            },
        });

        const [result] = await User.aggregate([
            ...pipeline,
            {
                $facet: {
                    data: [{ $sort: { createdAt: -1 } }, { $skip: skip }, { $limit: limit }],
                    totalCount: [{ $count: 'count' }],
                },
            },
        ]);

        const total = result.totalCount[0]?.count || 0;
        return success(res, 200, 'Candidates fetched', result.data, buildMeta(total));
    }
}

module.exports = bindController(new ProfileController());
