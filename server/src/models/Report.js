const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
    {
        reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        targetType: {
            type: String,
            enum: ['user', 'job', 'post', 'comment', 'company'],
            required: true,
        },
        targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
        reason: { type: String, required: true },
        description: { type: String, default: '' },

        status: {
            type: String,
            enum: ['open', 'under_review', 'resolved', 'dismissed'],
            default: 'open',
        },
        // Traceability of admin action (spec section 23)
        resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
        resolvedAt: { type: Date },
        resolutionNote: { type: String, default: '' },
    },
    { timestamps: true }
);

reportSchema.index({ status: 1, createdAt: -1 });
reportSchema.index({ targetType: 1, targetId: 1 });

module.exports = mongoose.model('Report', reportSchema);
