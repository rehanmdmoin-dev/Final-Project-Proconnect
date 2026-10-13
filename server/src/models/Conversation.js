const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema(
    {
        participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
        lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message', default: null },
        // Per-user unread counts, keyed by userId. Avoids counting unread
        // messages with a query on every conversation-list render.
        unreadCounts: {
            type: Map,
            of: Number,
            default: {},
        },
    },
    { timestamps: true }
);

conversationSchema.index({ participants: 1, updatedAt: -1 });

module.exports = mongoose.model('Conversation', conversationSchema);
