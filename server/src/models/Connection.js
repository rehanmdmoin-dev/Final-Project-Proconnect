const mongoose = require('mongoose');

const connectionSchema = new mongoose.Schema(
    {
        requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        status: {
            type: String,
            enum: ['pending', 'accepted', 'rejected', 'blocked'],
            default: 'pending',
        },
        respondedAt: { type: Date },
    },
    { timestamps: true }
);

// Spec section 27 + section 14 business rules: one connection record per pair,
// in one direction. The controller additionally checks the reverse direction
// so A->B and B->A can't both exist.
connectionSchema.index({ requester: 1, recipient: 1 }, { unique: true });
connectionSchema.index({ recipient: 1, status: 1 });
connectionSchema.index({ requester: 1, status: 1 });

module.exports = mongoose.model('Connection', connectionSchema);
