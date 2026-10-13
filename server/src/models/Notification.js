const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
    {
        recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
        type: {
            type: String,
            enum: [
                'connection_request',
                'connection_accepted',
                'application_submitted',
                'application_status_changed',
                'interview_scheduled',
                'new_message',
                'post_liked',
                'post_commented',
                'company_new_job',
            ],
            required: true,
        },
        message: { type: String, required: true },
        // Free-form payload so the frontend can deep-link (e.g. { jobId, applicationId })
        data: { type: mongoose.Schema.Types.Mixed, default: {} },
        isRead: { type: Boolean, default: false },
    },
    { timestamps: true }
);

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
