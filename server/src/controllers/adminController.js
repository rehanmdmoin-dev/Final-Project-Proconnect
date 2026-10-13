const User = require('../models/User');
const Company = require('../models/Company');
const Job = require('../models/Job');
const Application = require('../models/Application');
const Post = require('../models/Post');
const Report = require('../models/Report');
const ApiError = require('../utils/ApiError');
const { bindController } = require('../utils/asyncHandler');
const { success } = require('../utils/response');
const getPagination = require('../utils/pagination');

class AdminController {
    
    async getUsers(req, res) {
        const { limit, skip, buildMeta } = getPagination(req.query);
        const { role, status, keyword } = req.query;

        const filter = { isDeleted: false };
        if (role) filter.role = role;
        if (status) filter.status = status;
        if (keyword) {
            filter.$or = [
                { name: { $regex: keyword, $options: 'i' } },
                { email: { $regex: keyword, $options: 'i' } },
            ];
        }

        const [users, total] = await Promise.all([
            User.find(filter)
                .select('name email role status isVerified headline createdAt')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            User.countDocuments(filter),
        ]);

        return success(res, 200, 'Users fetched', users, buildMeta(total));
    }


    async toggleUserStatus(req, res) {
        const user = await User.findOne({ _id: req.params.id, isDeleted: false });
        if (!user) throw new ApiError(404, 'User not found');

     
        if (String(user._id) === String(req.user._id)) {
            throw new ApiError(400, 'You cannot block your own account');
        }

        user.status = user.status === 'active' ? 'blocked' : 'active';
        
        if (user.status === 'blocked') user.refreshToken = null;
        await user.save();

        return success(res, 200, `User ${user.status === 'blocked' ? 'blocked' : 'unblocked'}`, {
            id: user._id,
            status: user.status,
        });
    }

    
    async deleteUser(req, res) {
        const user = await User.findOne({ _id: req.params.id, isDeleted: false });
        if (!user) throw new ApiError(404, 'User not found');
        if (String(user._id) === String(req.user._id)) {
            throw new ApiError(400, 'You cannot delete your own account');
        }

        user.isDeleted = true;
        user.refreshToken = null;
        await user.save();

        return success(res, 200, 'User deleted');
    }

    
    async verifyUser(req, res) {
        const user = await User.findOne({ _id: req.params.id, isDeleted: false });
        if (!user) throw new ApiError(404, 'User not found');

        user.isVerified = !user.isVerified;
        await user.save();

        return success(res, 200, `User ${user.isVerified ? 'verified' : 'unverified'}`, {
            id: user._id,
            isVerified: user.isVerified,
        });
    }

 
    async getCompanies(req, res) {
        const { limit, skip, buildMeta } = getPagination(req.query);
        const filter = { isDeleted: false };
        if (req.query.verificationStatus) filter.verificationStatus = req.query.verificationStatus;

        const [companies, total] = await Promise.all([
            Company.find(filter)
                .populate('owner', 'name email')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Company.countDocuments(filter),
        ]);

        return success(res, 200, 'Companies fetched', companies, buildMeta(total));
    }


    async setCompanyVerification(req, res) {
        const { verificationStatus } = req.body;
        const allowed = ['pending', 'verified', 'rejected', 'suspended'];
        if (!allowed.includes(verificationStatus)) {
            throw new ApiError(400, `verificationStatus must be one of: ${allowed.join(', ')}`);
        }

        const company = await Company.findOne({ _id: req.params.id, isDeleted: false });
        if (!company) throw new ApiError(404, 'Company not found');

        company.verificationStatus = verificationStatus;
        await company.save();

        if (verificationStatus === 'suspended') {
            await Job.updateMany({ company: company._id, isDeleted: false }, { status: 'closed' });
        }

        return success(res, 200, `Company ${verificationStatus}`, company);
    }


    async getJobs(req, res) {
        const { limit, skip, buildMeta } = getPagination(req.query);
        const filter = { isDeleted: false };
        if (req.query.moderationStatus) filter.moderationStatus = req.query.moderationStatus;
        if (req.query.status) filter.status = req.query.status;

        const [jobs, total] = await Promise.all([
            Job.find(filter)
                .populate('company', 'name logo')
                .populate('createdBy', 'name email')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Job.countDocuments(filter),
        ]);

        return success(res, 200, 'Jobs fetched', jobs, buildMeta(total));
    }

    async moderateJob(req, res) {
        const { moderationStatus } = req.body;
        if (!['pending', 'approved', 'rejected'].includes(moderationStatus)) {
            throw new ApiError(400, 'moderationStatus must be pending, approved or rejected');
        }

        const job = await Job.findOne({ _id: req.params.id, isDeleted: false });
        if (!job) throw new ApiError(404, 'Job not found');

        job.moderationStatus = moderationStatus;
        if (moderationStatus === 'rejected') job.status = 'closed';
        await job.save();

        return success(res, 200, `Job ${moderationStatus}`, job);
    }

    async removeJob(req, res) {
        const job = await Job.findOne({ _id: req.params.id, isDeleted: false });
        if (!job) throw new ApiError(404, 'Job not found');

        job.isDeleted = true;
        await job.save();

        return success(res, 200, 'Job removed');
    }


    async getReports(req, res) {
        const { limit, skip, buildMeta } = getPagination(req.query);
        const filter = {};
        if (req.query.status) filter.status = req.query.status;
        if (req.query.targetType) filter.targetType = req.query.targetType;

        const [reports, total] = await Promise.all([
            Report.find(filter)
                .populate('reporter', 'name email')
                .populate('resolvedBy', 'name')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Report.countDocuments(filter),
        ]);

        return success(res, 200, 'Reports fetched', reports, buildMeta(total));
    }

    
    async resolveReport(req, res) {
        const report = await Report.findById(req.params.id);
        if (!report) throw new ApiError(404, 'Report not found');

        report.status = req.body.status;
        report.resolutionNote = req.body.resolutionNote || '';
        // Spec section 23: admin actions must be traceable.
        if (['resolved', 'dismissed'].includes(req.body.status)) {
            report.resolvedBy = req.user._id;
            report.resolvedAt = new Date();
        }
        await report.save();

        return success(res, 200, 'Report updated', report);
    }

    async removePost(req, res) {
        const post = await Post.findOne({ _id: req.params.id, isDeleted: false });
        if (!post) throw new ApiError(404, 'Post not found');

        post.isDeleted = true;
        await post.save();

        return success(res, 200, 'Post removed');
    }


    async getAnalytics(req, res) {
        const now = new Date();
        const trendStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11, 1));
        const [
            usersByRole,
            jobsByStatus,
            applicationsByStatus,
            monthlySignups,
            monthlyApplications,
            topCompanies,
            counts,
        ] = await Promise.all([
            User.aggregate([
                { $match: { isDeleted: false, createdAt: { $gte: trendStart } } },
                { $group: { _id: '$role', count: { $sum: 1 } } },
            ]),
            Job.aggregate([
                { $match: { isDeleted: false } },
                { $group: { _id: '$status', count: { $sum: 1 } } },
            ]),
            Application.aggregate([
                { $match: { createdAt: { $gte: trendStart } } },
                { $group: { _id: '$status', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
            ]),
            
            User.aggregate([
                { $match: { isDeleted: false } },
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
                        count: { $sum: 1 },
                    },
                },
                { $sort: { _id: -1 } },
                { $limit: 12 },
                { $sort: { _id: 1 } },
            ]),
            Application.aggregate([
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
                        count: { $sum: 1 },
                    },
                },
                { $sort: { _id: -1 } },
                { $limit: 12 },
                { $sort: { _id: 1 } },
            ]),
       
            Job.aggregate([
                { $match: { isDeleted: false } },
                { $group: { _id: '$company', jobCount: { $sum: 1 }, applications: { $sum: '$applicationCount' } } },
                { $sort: { jobCount: -1 } },
                { $limit: 10 },
                {
                    $lookup: {
                        from: 'companies',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'company',
                    },
                },
                { $unwind: '$company' },
                {
                    $project: {
                        _id: 0,
                        companyId: '$company._id',
                        name: '$company.name',
                        jobCount: 1,
                        applications: 1,
                    },
                },
            ]),
            Promise.all([
                User.countDocuments({ isDeleted: false }),
                Company.countDocuments({ isDeleted: false }),
                Job.countDocuments({ isDeleted: false }),
                Application.countDocuments(),
                Post.countDocuments({ isDeleted: false }),
                Report.countDocuments({ status: { $in: ['open', 'under_review'] } }),
            ]),
        ]);

        const [totalUsers, totalCompanies, totalJobs, totalApplications, totalPosts, openReports] = counts;
        const toMap = (rows) => rows.reduce((acc, r) => ({ ...acc, [r._id]: r.count }), {});

        return success(res, 200, 'Analytics fetched', {
            totals: { totalUsers, totalCompanies, totalJobs, totalApplications, totalPosts, openReports },
            usersByRole: toMap(usersByRole),
            jobsByStatus: toMap(jobsByStatus),
            applicationsByStatus: toMap(applicationsByStatus),
            monthlySignups,
            monthlyApplications,
            topCompanies,
        });
    }
}

module.exports = bindController(new AdminController());
