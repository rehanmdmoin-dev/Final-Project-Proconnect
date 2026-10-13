const mongoose = require('mongoose');
const Job = require('../models/Job');
const Company = require('../models/Company');
const SavedJob = require('../models/SavedJob');
const ApiError = require('../utils/ApiError');
const { bindController } = require('../utils/asyncHandler');
const { success } = require('../utils/response');
const getPagination = require('../utils/pagination');
const { createManyNotifications } = require('../services/notificationService');

const assertCanManageJob = (job, user) => {
    if (user.role === 'admin') return;
    if (String(job.createdBy) !== String(user._id)) {
        throw new ApiError(403, 'You can only manage jobs you created');
    }
};

const assertCanPostForCompany = async (companyId, user) => {
    const company = await Company.findOne({ _id: companyId, isDeleted: false });
    if (!company) throw new ApiError(404, 'Company not found');
    if (user.role === 'admin') return company;

    const isOwner = String(company.owner) === String(user._id);
    const isRecruiter = company.recruiters.some((r) => String(r) === String(user._id));
    if (!isOwner && !isRecruiter) {
        throw new ApiError(403, 'You are not authorized to post jobs for this company');
    }
    return company;
};

class JobController {

    async createJob(req, res) {
        const company = await assertCanPostForCompany(req.body.company, req.user);

        const job = await Job.create({
            ...req.body,
            createdBy: req.user._id,
        });


        if (job.status === 'active' && company.followers?.length) {
            await createManyNotifications(company.followers, {
                sender: req.user._id,
                type: 'company_new_job',
                message: `${company.name} posted a new job: ${job.title}`,
                data: { jobId: job._id, companyId: company._id },
            });
        }

        return success(res, 201, 'Job created successfully', job);
    }

    async getJobs(req, res) {
        const {
            keyword, location, workMode, jobType, skills, company,
            minExperience, maxExperience, minSalary, maxSalary,
            postedWithinDays, status, sort,
        } = req.query;
        const { limit, skip, buildMeta } = getPagination(req.query);

        const match = { isDeleted: false };


        match.status = status && req.user?.role === 'admin' ? status : 'active';
        if (req.user?.role !== 'admin') match.moderationStatus = 'approved';

        if (keyword) {
            match.$or = [
                { title: { $regex: keyword, $options: 'i' } },
                { description: { $regex: keyword, $options: 'i' } },
                { skills: { $regex: keyword, $options: 'i' } },
            ];
        }
        if (location) match.location = { $regex: location, $options: 'i' };
        if (workMode) match.workMode = { $in: workMode.split(',').map((s) => s.trim()) };
        if (jobType) match.jobType = { $in: jobType.split(',').map((s) => s.trim()) };
        if (company) match.company = new mongoose.Types.ObjectId(company);

        if (skills) {
            const list = skills.split(',').map((s) => s.trim()).filter(Boolean);
            if (list.length) match.skills = { $in: list.map((s) => new RegExp(`^${s}$`, 'i')) };
        }

        if (minExperience) match['experience.min'] = { $lte: Number(minExperience) };
        if (maxExperience) match['experience.max'] = { $gte: Number(maxExperience) };

        if (minSalary) match['salary.max'] = { $gte: Number(minSalary) };
        if (maxSalary) match['salary.min'] = { $lte: Number(maxSalary) };

        if (postedWithinDays) {
            const since = new Date();
            since.setDate(since.getDate() - Number(postedWithinDays));
            match.createdAt = { $gte: since };
        }

        const sortStage = {
            newest: { createdAt: -1 },
            oldest: { createdAt: 1 },
            salaryHigh: { 'salary.max': -1 },
            salaryLow: { 'salary.min': 1 },
        }[sort] || { createdAt: -1 };

        const [result] = await Job.aggregate([
            { $match: match },
            {
                $lookup: {
                    from: 'companies',
                    localField: 'company',
                    foreignField: '_id',
                    as: 'company',
                },
            },
            { $unwind: '$company' },
            {
                $project: {
                    title: 1, location: 1, workMode: 1, jobType: 1, skills: 1,
                    experience: 1, salary: 1, deadline: 1, status: 1,
                    applicationCount: 1, createdAt: 1,
                    'company._id': 1, 'company.name': 1, 'company.logo': 1, 'company.industry': 1,
                },
            },
            {
                $facet: {
                    data: [{ $sort: sortStage }, { $skip: skip }, { $limit: limit }],
                    totalCount: [{ $count: 'count' }],
                },
            },
        ]);

        const total = result.totalCount[0]?.count || 0;
        return success(res, 200, 'Jobs fetched', result.data, buildMeta(total));
    }

    async getJobById(req, res) {
        const job = await Job.findOne({ _id: req.params.id, isDeleted: false })
            .populate('company', 'name logo industry location website companySize')
            .populate('createdBy', 'name headline profileImage')
            .lean();

        if (!job) throw new ApiError(404, 'Job not found');

        Job.updateOne({ _id: job._id }, { $inc: { viewCount: 1 } }).catch(() => { });

        let isSaved = false;
        if (req.user) {
            isSaved = !!(await SavedJob.exists({ user: req.user._id, job: job._id }));
        }

        return success(res, 200, 'Job fetched', { ...job, isSaved });
    }

    async getMyJobs(req, res) {
        const { limit, skip, buildMeta } = getPagination(req.query);
        const filter = { createdBy: req.user._id, isDeleted: false };
        if (req.query.status) filter.status = req.query.status;

        const [jobs, total] = await Promise.all([
            Job.find(filter)
                .populate('company', 'name logo')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Job.countDocuments(filter),
        ]);

        return success(res, 200, 'Jobs fetched', jobs, buildMeta(total));
    }

    async updateJob(req, res) {
        const job = await Job.findOne({ _id: req.params.id, isDeleted: false });
        if (!job) throw new ApiError(404, 'Job not found');
        assertCanManageJob(job, req.user);

        if (req.body.company && String(req.body.company) !== String(job.company)) {
            await assertCanPostForCompany(req.body.company, req.user);
        }

        Object.assign(job, req.body);
        await job.save();

        return success(res, 200, 'Job updated successfully', job);
    }

    async changeStatus(req, res) {
        const job = await Job.findOne({ _id: req.params.id, isDeleted: false });
        if (!job) throw new ApiError(404, 'Job not found');
        assertCanManageJob(job, req.user);

        job.status = req.body.status;
        await job.save();

        return success(res, 200, `Job status changed to ${job.status}`, job);
    }

    async deleteJob(req, res) {
        const job = await Job.findOne({ _id: req.params.id, isDeleted: false });
        if (!job) throw new ApiError(404, 'Job not found');
        assertCanManageJob(job, req.user);

        job.isDeleted = true;
        await job.save();

        return success(res, 200, 'Job deleted successfully');
    }


    async saveJob(req, res) {
        const job = await Job.findOne({ _id: req.params.jobId, isDeleted: false });
        if (!job) throw new ApiError(404, 'Job not found');


        const existing = await SavedJob.findOne({ user: req.user._id, job: job._id });
        if (existing) throw new ApiError(400, 'Job already saved');

        await SavedJob.create({ user: req.user._id, job: job._id });
        return success(res, 201, 'Job saved');
    }


    async unsaveJob(req, res) {
        const removed = await SavedJob.findOneAndDelete({ user: req.user._id, job: req.params.jobId });
        if (!removed) throw new ApiError(404, 'Job was not saved');
        return success(res, 200, 'Job removed from saved list');
    }


    async getSavedJobs(req, res) {
        const { limit, skip, buildMeta } = getPagination(req.query);

        const [saved, total] = await Promise.all([
            SavedJob.find({ user: req.user._id })
                .populate({
                    path: 'job',
                    match: { isDeleted: false },
                    populate: { path: 'company', select: 'name logo' },
                })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            SavedJob.countDocuments({ user: req.user._id }),
        ]);

        const jobs = saved.filter((s) => s.job).map((s) => s.job);

        return success(res, 200, 'Saved jobs fetched', jobs, buildMeta(total));
    }
}

module.exports = bindController(new JobController());
