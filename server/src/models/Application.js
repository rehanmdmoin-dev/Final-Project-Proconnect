const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema(
    {
        job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
        candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        recruiter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },

        // Snapshot of the resume AT APPLY TIME - if the candidate later replaces
        // their resume, this application still reflects what was actually submitted.
        resume: {
            url: { type: String, default: '' },
            originalName: { type: String, default: '' },
        },
        coverLetter: { type: String, default: '' },

        status: {
            type: String,
            enum: ['Applied', 'Under Review', 'Shortlisted', 'Interview', 'Selected', 'Rejected', 'Withdrawn'],
            default: 'Applied',
        },

        // Audit-friendly trail of every status change (spec section 12)
        statusHistory: [
            {
                status: String,
                changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
                changedAt: { type: Date, default: Date.now },
                note: String,
            },
        ],

        recruiterNotes: { type: String, default: '' },
    },
    { timestamps: true }
);

// Spec section 27: compound uniqueness prevents duplicate applications
applicationSchema.index({ job: 1, candidate: 1 }, { unique: true });
applicationSchema.index({ candidate: 1, createdAt: -1 });
applicationSchema.index({ recruiter: 1, status: 1 });

module.exports = mongoose.model('Application', applicationSchema);
