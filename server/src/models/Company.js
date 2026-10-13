const mongoose = require('mongoose');

const companySchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        logo: { type: String, default: '' },
        logoPublicId: { type: String, default: '' },
        description: { type: String, trim: true, default: '' },
        industry: { type: String, trim: true, default: '' },
        website: { type: String, trim: true, default: '' },
        location: { type: String, trim: true, default: '' },
        companySize: {
            type: String,
            enum: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'],
            default: '1-10',
        },
        foundedYear: { type: Number },
        socialLinks: {
            linkedin: { type: String, default: '' },
            twitter: { type: String, default: '' },
            facebook: { type: String, default: '' },
        },

        // Recruiters authorized to manage this company (spec section 7)
        owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        recruiters: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

        followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

        verificationStatus: {
            type: String,
            enum: ['pending', 'verified', 'rejected', 'suspended'],
            default: 'pending',
        },
        isDeleted: { type: Boolean, default: false },
    },
    { timestamps: true }
);

companySchema.index({ name: 'text', description: 'text', industry: 'text' });
companySchema.index({ owner: 1 });

module.exports = mongoose.model('Company', companySchema);
