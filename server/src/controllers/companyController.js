const Company = require('../models/Company');
const Job = require('../models/Job');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { bindController } = require('../utils/asyncHandler');
const { success } = require('../utils/response');
const getPagination = require('../utils/pagination');
const { uploadToCloudinary, destroyFromCloudinary } = require('../services/uploadService');


const assertCanManage = (company, user) => {
    if (user.role === 'admin') return;
    const isOwner = String(company.owner) === String(user._id);
    const isRecruiter = company.recruiters.some((r) => String(r) === String(user._id));
    if (!isOwner && !isRecruiter) {
        throw new ApiError(403, 'You are not authorized to manage this company');
    }
};

class CompanyController {
    async createCompany(req, res) {
        const company = await Company.create({
            ...req.body,
            owner: req.user._id,
            recruiters: [req.user._id],
        });

        if (!req.user.company) {
            await User.findByIdAndUpdate(req.user._id, { company: company._id });
        }

        return success(res, 201, 'Company created successfully', company);
    }

    async getCompanies(req, res) {
        const { keyword, industry, location } = req.query;
        const { limit, skip, buildMeta } = getPagination(req.query);

        const filter = { isDeleted: false };
        if (industry) filter.industry = { $regex: industry, $options: 'i' };
        if (location) filter.location = { $regex: location, $options: 'i' };
        if (keyword) filter.name = { $regex: keyword, $options: 'i' };

        const [companies, total] = await Promise.all([
            Company.find(filter)
                .select('name logo industry location companySize followers verificationStatus')
                .skip(skip)
                .limit(limit)
                .sort({ createdAt: -1 })
                .lean(),
            Company.countDocuments(filter),
        ]);

        const shaped = companies.map((c) => ({
            ...c,
            followerCount: c.followers?.length || 0,
            followers: undefined,
        }));

        return success(res, 200, 'Companies fetched', shaped, buildMeta(total));
    }

    async getCompanyById(req, res) {
        const company = await Company.findOne({ _id: req.params.id, isDeleted: false })
            .populate('owner', 'name email profileImage')
            .lean();

        if (!company) throw new ApiError(404, 'Company not found');

        const activeJobCount = await Job.countDocuments({
            company: company._id,
            status: 'active',
            isDeleted: false,
        });

        return success(res, 200, 'Company fetched', {
            ...company,
            followerCount: company.followers?.length || 0,
            isFollowing: req.user
                ? company.followers?.some((f) => String(f) === String(req.user._id))
                : false,
            followers: undefined,
            activeJobCount,
        });
    }

    async updateCompany(req, res) {
        const company = await Company.findOne({ _id: req.params.id, isDeleted: false });
        if (!company) throw new ApiError(404, 'Company not found');
        assertCanManage(company, req.user);

        Object.assign(company, req.body);
        await company.save();

        return success(res, 200, 'Company updated successfully', company);
    }

    async uploadLogo(req, res) {
        if (!req.file) throw new ApiError(400, 'No image file uploaded');

        const company = await Company.findOne({ _id: req.params.id, isDeleted: false });
        if (!company) throw new ApiError(404, 'Company not found');
        assertCanManage(company, req.user);

        const { url, publicId } = await uploadToCloudinary(req.file.path, 'company-logos', 'image');
        if (company.logoPublicId) await destroyFromCloudinary(company.logoPublicId, 'image');

        company.logo = url;
        company.logoPublicId = publicId;
        await company.save();

        return success(res, 200, 'Company logo updated', { logo: url });
    }

    async deleteCompany(req, res) {
        const company = await Company.findOne({ _id: req.params.id, isDeleted: false });
        if (!company) throw new ApiError(404, 'Company not found');
        assertCanManage(company, req.user);

        company.isDeleted = true;
        await company.save();

        await Job.updateMany({ company: company._id, isDeleted: false }, { status: 'closed' });

        return success(res, 200, 'Company deleted successfully');
    }

    async followCompany(req, res) {
        const company = await Company.findOne({ _id: req.params.id, isDeleted: false });
        if (!company) throw new ApiError(404, 'Company not found');

        await Company.updateOne({ _id: company._id }, { $addToSet: { followers: req.user._id } });

        return success(res, 200, 'Company followed');
    }

    async unfollowCompany(req, res) {
        const company = await Company.findOne({ _id: req.params.id, isDeleted: false });
        if (!company) throw new ApiError(404, 'Company not found');

        await Company.updateOne({ _id: company._id }, { $pull: { followers: req.user._id } });

        return success(res, 200, 'Company unfollowed');
    }

    async getFollowers(req, res) {
        const { limit, skip, buildMeta } = getPagination(req.query);

        const company = await Company.findOne({ _id: req.params.id, isDeleted: false })
            .populate({
                path: 'followers',
                select: 'name headline profileImage location',
                options: { skip, limit },
            });

        if (!company) throw new ApiError(404, 'Company not found');

        const total = await Company.aggregate([
            { $match: { _id: company._id } },
            { $project: { count: { $size: '$followers' } } },
        ]);

        return success(res, 200, 'Followers fetched', company.followers, buildMeta(total[0]?.count || 0));
    }

    async getMyCompanies(req, res) {
        const companies = await Company.find({
            isDeleted: false,
            $or: [{ owner: req.user._id }, { recruiters: req.user._id }],
        }).sort({ createdAt: -1 });

        return success(res, 200, 'Companies fetched', companies);
    }
}

module.exports = bindController(new CompanyController());
