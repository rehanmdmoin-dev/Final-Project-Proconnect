const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
    {
        author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        // A post can be published on behalf of a company (spec section 16)
        company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', default: null },

        content: { type: String, required: true, trim: true },
        media: {
            url: { type: String, default: '' },
            publicId: { type: String, default: '' },
            type: { type: String, enum: ['image', 'video', 'none'], default: 'none' },
        },

        // Denormalized counters so the feed doesn't need a $lookup per post
        // just to display "12 likes". Kept in sync by the like/comment controllers.
        likeCount: { type: Number, default: 0 },
        commentCount: { type: Number, default: 0 },
        shareCount: { type: Number, default: 0 },

        isDeleted: { type: Boolean, default: false },
    },
    { timestamps: true }
);

postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Post', postSchema);
