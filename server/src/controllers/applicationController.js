const mongoose = require('mongoose');
const Application = require('../models/Application');
const Job = require('../models/Job');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { bindController } = require('../utils/asyncHandler');
const { success } = require('../utils/response');
const getPagination = require('../utils/pagination');
const { createNotification } = require('../services/notificationService');
const emailService = require('../services/emailService');

class ApplicationController {
   
    async applyToJob(req, res) {
        const job = await Job.findOne({ _id: req.params.jobId, isDeleted: false }).populate('company', 'name');
        if (!job) throw new ApiError(404, 'Job not found');

        if (job.status !== 'active') {
            throw new ApiError(400, 'This job is not accepting applications');
        }
        if (job.deadline && new Date(job.deadline) < new Date()) {
            throw new ApiError(400, 'The application deadline for this job has passed');
        }

        const alreadyApplied = await Application.findOne({ job: job._id, candidate: req.user._id });
        if (alreadyApplied) {
            throw new ApiError(400, 'You have already applied to this job');
        }

        if (!req.user.resume?.url) {
            throw new ApiError(400, 'Please upload a resume to your profile before applying');
        }

        const application = await Application.create({
            job: job._id,
            candidate: req.user._id,
            recruiter: job.createdBy,
            company: job.company._id,
            resume: { url: req.user.resume.url, originalName: req.user.resume.originalName },
            coverLetter: req.body.coverLetter || '',
            statusHistory: [{ status: 'Applied', changedBy: req.user._id, changedAt: new Date() }],
        });

        await Job.updateOne({ _id: job._id }, { $inc: { applicationCount: 1 } });

        await createNotification({
            recipient: job.createdBy,
            sender: req.user._id,
            type: 'application_submitted',
            message: `${req.user.name} applied for ${job.title}`,
            data: { jobId: job._id, applicationId: application._id },
        });

        emailService.sendApplicationConfirmation(req.user, job);

        return success(res, 201, 'Application submitted successfully', application);
    }

    async getMyApplications(req, res) {
        const { limit, skip, buildMeta } = getPagination(req.query);

        const filter = { candidate: req.user._id };
        if (req.query.status) filter.status = req.query.status;

        const [applications, total] = await Promise.all([
            Application.find(filter)
                .populate({ path: 'job', select: 'title location workMode jobType status' })
                .populate({ path: 'company', select: 'name logo' })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Application.countDocuments(filter),
        ]);

        return success(res, 200, 'Applications fetched', applications, buildMeta(total));
    }

    
    async getJobApplicants(req, res) {
        const job = await Job.findOne({ _id: req.params.jobId, isDeleted: false });
        if (!job) throw new ApiError(404, 'Job not found');

        if (req.user.role !== 'admin' && String(job.createdBy) !== String(req.user._id)) {
            throw new ApiError(403, 'You can only view applicants for jobs you created');
        }

        const { limit, skip, buildMeta } = getPagination(req.query);
        const { status, keyword, skills } = req.query;

        const match = { job: new mongoose.Types.ObjectId(req.params.jobId) };
        if (status) match.status = status;

        const pipeline = [
            { $match: match },
            {
                $lookup: {
                    from: 'users',
                    localField: 'candidate',
                    foreignField: '_id',
                    as: 'candidate',
                },
            },
            { $unwind: '$candidate' },
        ];

        
        const candidateMatch = {};
        if (keyword) {
            candidateMatch.$or = [
                { 'candidate.name': { $regex: keyword, $options: 'i' } },
                { 'candidate.headline': { $regex: keyword, $options: 'i' } },
            ];
        }
        if (skills) {
            const list = skills.split(',').map((s) => s.trim()).filter(Boolean);
            if (list.length) {
                candidateMatch['candidate.skills.name'] = { $in: list.map((s) => new RegExp(`^${s}$`, 'i')) };
            }
        }
        if (Object.keys(candidateMatch).length) pipeline.push({ $match: candidateMatch });

        pipeline.push({
            $project: {
                status: 1, coverLetter: 1, resume: 1, recruiterNotes: 1, createdAt: 1,
                'candidate._id': 1, 'candidate.name': 1, 'candidate.email': 1,
                'candidate.headline': 1, 'candidate.location': 1, 'candidate.profileImage': 1,
                'candidate.skills': 1, 'candidate.experience': 1, 'candidate.education': 1,
            },
        });

        const [result] = await Application.aggregate([
            ...pipeline,
            {
                $facet: {
                    data: [{ $sort: { createdAt: -1 } }, { $skip: skip }, { $limit: limit }],
                    totalCount: [{ $count: 'count' }],
                },
            },
        ]);

        const total = result.totalCount[0]?.count || 0;
        return success(res, 200, 'Applicants fetched', result.data, buildMeta(total));
    }

    async getApplicationById(req, res) {
        const application = await Application.findById(req.params.id)
            .populate('candidate', 'name email headline location profileImage skills experience education resume')
            .populate('job', 'title location workMode jobType createdBy')
            .populate('company', 'name logo');

        if (!application) throw new ApiError(404, 'Application not found');

        const isCandidate = String(application.candidate._id) === String(req.user._id);
        const isRecruiter = String(application.recruiter) === String(req.user._id);
        if (!isCandidate && !isRecruiter && req.user.role !== 'admin') {
            throw new ApiError(403, 'You are not authorized to view this application');
        }

        return success(res, 200, 'Application fetched', application);
    }

   
    async updateStatus(req, res) {
        const { status, note } = req.body;

        const application = await Application.findById(req.params.id)
            .populate('candidate', 'name email')
            .populate('job', 'title');

        if (!application) throw new ApiError(404, 'Application not found');

        if (req.user.role !== 'admin' && String(application.recruiter) !== String(req.user._id)) {
            throw new ApiError(403, 'You can only manage applications for your own jobs');
        }
        if (application.status === 'Withdrawn') {
            throw new ApiError(400, 'This application was withdrawn by the candidate');
        }

        application.status = status;
        application.statusHistory.push({
            status,
            changedBy: req.user._id,
            changedAt: new Date(),
            note: note || '',
        });
        await application.save();

        await createNotification({
            recipient: application.candidate._id,
            sender: req.user._id,
            type: 'application_status_changed',
            message: `Your application for ${application.job.title} is now: ${status}`,
            data: { applicationId: application._id, jobId: application.job._id, status },
        });

        emailService.sendApplicationStatusEmail(application.candidate, application.job, status);

        return success(res, 200, 'Application status updated', application);
    }

    async updateNotes(req, res) {
        const application = await Application.findById(req.params.id);
        if (!application) throw new ApiError(404, 'Application not found');

        if (req.user.role !== 'admin' && String(application.recruiter) !== String(req.user._id)) {
            throw new ApiError(403, 'You can only annotate applications for your own jobs');
        }

        application.recruiterNotes = req.body.recruiterNotes;
        await application.save();

        return success(res, 200, 'Notes saved', { recruiterNotes: application.recruiterNotes });
    }

    
    async withdraw(req, res) {
        const application = await Application.findById(req.params.id);
        if (!application) throw new ApiError(404, 'Application not found');

        if (String(application.candidate) !== String(req.user._id)) {
            throw new ApiError(403, 'You can only withdraw your own applications');
        }
        if (['Selected', 'Rejected', 'Withdrawn'].includes(application.status)) {
            throw new ApiError(400, `Cannot withdraw an application that is already ${application.status}`);
        }

        application.status = 'Withdrawn';
        application.statusHistory.push({
            status: 'Withdrawn',
            changedBy: req.user._id,
            changedAt: new Date(),
        });
        await application.save();

        return success(res, 200, 'Application withdrawn');
    }

 
    async getStats(req, res) {
        const match = req.user.role === 'recruiter'
            ? { recruiter: req.user._id }
            : { candidate: req.user._id };

        const byStatus = await Application.aggregate([
            { $match: match },
            { $group: { _id: '$status', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
        ]);

        const total = byStatus.reduce((sum, row) => sum + row.count, 0);

        return success(res, 200, 'Application statistics', {
            total,
            byStatus: byStatus.reduce((acc, row) => ({ ...acc, [row._id]: row.count }), {}),
        });
    }
}

module.exports = bindController(new ApplicationController());
