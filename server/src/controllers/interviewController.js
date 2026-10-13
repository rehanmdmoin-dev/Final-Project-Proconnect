const Interview = require('../models/Interview');
const Application = require('../models/Application');
const ApiError = require('../utils/ApiError');
const { bindController } = require('../utils/asyncHandler');
const { success } = require('../utils/response');
const getPagination = require('../utils/pagination');
const { createNotification } = require('../services/notificationService');
const emailService = require('../services/emailService');

class InterviewController {
    async scheduleInterview(req, res) {
        const application = await Application.findById(req.body.application)
            .populate('candidate', 'name email')
            .populate('job', 'title');

        if (!application) throw new ApiError(404, 'Application not found');

        if (req.user.role !== 'admin' && String(application.recruiter) !== String(req.user._id)) {
            throw new ApiError(403, 'You can only schedule interviews for your own jobs');
        }
        if (['Rejected', 'Withdrawn'].includes(application.status)) {
            throw new ApiError(400, `Cannot schedule an interview for a ${application.status} application`);
        }

        const interview = await Interview.create({
            ...req.body,
            job: application.job._id,
            candidate: application.candidate._id,
            scheduledBy: req.user._id,
        });

        if (application.status !== 'Interview') {
            application.status = 'Interview';
            application.statusHistory.push({
                status: 'Interview',
                changedBy: req.user._id,
                changedAt: new Date(),
                note: 'Interview scheduled',
            });
            await application.save();
        }

        await createNotification({
            recipient: application.candidate._id,
            sender: req.user._id,
            type: 'interview_scheduled',
            message: `An interview has been scheduled for ${application.job.title}`,
            data: { interviewId: interview._id, applicationId: application._id },
        });

        emailService.sendInterviewInvitation(application.candidate, application.job, interview);

        return success(res, 201, 'Interview scheduled successfully', interview);
    }

    async getInterviews(req, res) {
        const { limit, skip, buildMeta } = getPagination(req.query);

        const filter = {};
        if (req.user.role === 'jobseeker') filter.candidate = req.user._id;
        else if (req.user.role === 'recruiter') filter.scheduledBy = req.user._id;

        if (req.query.status) filter.status = req.query.status;
        if (req.query.upcoming === 'true') {
            filter.scheduledAt = { $gte: new Date() };
            filter.status = 'Scheduled';
        }

        const [interviews, total] = await Promise.all([
            Interview.find(filter)
                .populate('candidate', 'name email profileImage headline')
                .populate('job', 'title')
                .populate('scheduledBy', 'name')
                .sort({ scheduledAt: 1 })
                .skip(skip)
                .limit(limit),
            Interview.countDocuments(filter),
        ]);

        return success(res, 200, 'Interviews fetched', interviews, buildMeta(total));
    }

  
    async getInterviewById(req, res) {
        const interview = await Interview.findById(req.params.id)
            .populate('candidate', 'name email profileImage headline')
            .populate('job', 'title')
            .populate('scheduledBy', 'name email');

        if (!interview) throw new ApiError(404, 'Interview not found');

        const isCandidate = String(interview.candidate._id) === String(req.user._id);
        const isRecruiter = String(interview.scheduledBy._id) === String(req.user._id);
        if (!isCandidate && !isRecruiter && req.user.role !== 'admin') {
            throw new ApiError(403, 'You are not authorized to view this interview');
        }

        return success(res, 200, 'Interview fetched', interview);
    }

   
    async updateInterview(req, res) {
        const interview = await Interview.findById(req.params.id)
            .populate('candidate', 'name email')
            .populate('job', 'title');

        if (!interview) throw new ApiError(404, 'Interview not found');
        if (req.user.role !== 'admin' && String(interview.scheduledBy) !== String(req.user._id)) {
            throw new ApiError(403, 'You can only manage interviews you scheduled');
        }

        const isReschedule = req.body.scheduledAt
            && new Date(req.body.scheduledAt).getTime() !== new Date(interview.scheduledAt).getTime();

        Object.assign(interview, req.body);
        if (isReschedule && !req.body.status) interview.status = 'Rescheduled';
        await interview.save();

        if (isReschedule) {
            await createNotification({
                recipient: interview.candidate._id,
                sender: req.user._id,
                type: 'interview_scheduled',
                message: `Your interview for ${interview.job.title} has been rescheduled`,
                data: { interviewId: interview._id },
            });
            emailService.sendInterviewInvitation(interview.candidate, interview.job, interview);
        }

        return success(res, 200, 'Interview updated', interview);
    }

    async cancelInterview(req, res) {
        const interview = await Interview.findById(req.params.id)
            .populate('candidate', 'name')
            .populate('job', 'title');

        if (!interview) throw new ApiError(404, 'Interview not found');
        if (req.user.role !== 'admin' && String(interview.scheduledBy) !== String(req.user._id)) {
            throw new ApiError(403, 'You can only manage interviews you scheduled');
        }

        interview.status = 'Cancelled';
        await interview.save();

        await createNotification({
            recipient: interview.candidate._id,
            sender: req.user._id,
            type: 'interview_scheduled',
            message: `Your interview for ${interview.job.title} has been cancelled`,
            data: { interviewId: interview._id },
        });

        return success(res, 200, 'Interview cancelled');
    }
}

module.exports = bindController(new InterviewController());
