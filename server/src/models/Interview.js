const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema(
    {
        application: { type: mongoose.Schema.Types.ObjectId, ref: 'Application', required: true },
        job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
        candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        scheduledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

        scheduledAt: { type: Date, required: true },
        durationMinutes: { type: Number, default: 30 },
        mode: { type: String, enum: ['Online', 'Offline', 'Phone'], default: 'Online' },
        meetingLink: { type: String, default: '' },
        address: { type: String, default: '' },
        notes: { type: String, default: '' },

        status: {
            type: String,
            enum: ['Scheduled', 'Completed', 'Cancelled', 'Rescheduled'],
            default: 'Scheduled',
        },
    },
    { timestamps: true }
);

interviewSchema.index({ candidate: 1, scheduledAt: -1 });
interviewSchema.index({ job: 1 });

module.exports = mongoose.model('Interview', interviewSchema);
