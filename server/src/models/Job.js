const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, trim: true },
        description: { type: String, required: true },
        responsibilities: { type: [String], default: [] },
        requirements: { type: [String], default: [] },
        skills: { type: [String], default: [], index: true },

        experience: {
            min: { type: Number, default: 0 },
            max: { type: Number, default: 0 },
        },
        salary: {
            min: { type: Number },
            max: { type: Number },
            currency: { type: String, default: 'INR' },
            isDisclosed: { type: Boolean, default: true },
        },

        location: { type: String, trim: true, default: '' },
        workMode: { type: String, enum: ['Remote', 'Hybrid', 'On-site'], default: 'On-site' },
        jobType: {
            type: String,
            enum: ['Full Time', 'Part Time', 'Internship', 'Contract'],
            default: 'Full Time',
        },
        deadline: { type: Date },

        // Recruiter-controlled lifecycle (spec section 8.2)
        status: {
            type: String,
            enum: ['draft', 'active', 'closed'],
            default: 'draft',
        },
        // Admin moderation, tracked separately so a recruiter closing a job
        // doesn't erase its moderation state and vice versa (spec section 8.2)
        moderationStatus: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending',
        },

        company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

        applicationCount: { type: Number, default: 0 },
        viewCount: { type: Number, default: 0 },
        isDeleted: { type: Boolean, default: false },
    },
    { timestamps: true }
);

// Spec section 27: indexes driven by the real search query patterns
jobSchema.index({ status: 1, createdAt: -1 });
jobSchema.index({ location: 1 });
jobSchema.index({ workMode: 1, jobType: 1 });
jobSchema.index({ company: 1 });
jobSchema.index({ createdBy: 1 });
jobSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Job', jobSchema);
