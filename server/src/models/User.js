const mongoose = require('mongoose');

/**
 * Education / Experience / Certification are EMBEDDED rather than referenced.
 * Spec section 25 calls this out explicitly: small, low-volume profile
 * subdocuments are embedded; high-volume relationships (applications,
 * messages, likes) live in their own collections.
 */
const experienceSchema = new mongoose.Schema(
    {
        company: { type: String, required: true, trim: true },
        position: { type: String, required: true, trim: true },
        employmentType: {
            type: String,
            enum: ['Full Time', 'Part Time', 'Internship', 'Contract', 'Freelance'],
            default: 'Full Time',
        },
        location: { type: String, trim: true },
        startDate: { type: Date, required: true },
        endDate: { type: Date },
        currentlyWorking: { type: Boolean, default: false },
        description: { type: String, trim: true },
    },
    { _id: true, timestamps: false }
);

const educationSchema = new mongoose.Schema(
    {
        institution: { type: String, required: true, trim: true },
        degree: { type: String, required: true, trim: true },
        fieldOfStudy: { type: String, trim: true },
        startDate: { type: Date },
        endDate: { type: Date },
        grade: { type: String, trim: true },
        description: { type: String, trim: true },
    },
    { _id: true }
);

const certificationSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        issuer: { type: String, trim: true },
        issueDate: { type: Date },
        credentialUrl: { type: String, trim: true },
    },
    { _id: true }
);

const skillSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        proficiency: {
            type: String,
            enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
            default: 'Intermediate',
        },
        endorsements: { type: Number, default: 0 },
    },
    { _id: true }
);

const userSchema = new mongoose.Schema(
    {
        name: { type: String, required: [true, 'Name is required'], trim: true },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: 8,
            select: false,
        },
        role: {
            type: String,
            enum: ['jobseeker', 'recruiter', 'admin'],
            default: 'jobseeker',
            required: true,
        },

        // --- Basic professional identity (spec section 5) ---
        headline: { type: String, trim: true, default: '' },
        about: { type: String, trim: true, default: '' },
        location: { type: String, trim: true, default: '' },
        phone: { type: String, trim: true, default: '' },
        profileImage: { type: String, default: '' },
        profileImagePublicId: { type: String, default: '' },

        // --- Repeatable profile sections ---
        skills: { type: [skillSchema], default: [] },
        experience: { type: [experienceSchema], default: [] },
        education: { type: [educationSchema], default: [] },
        certifications: { type: [certificationSchema], default: [] },

        resume: {
            url: { type: String, default: '' },
            publicId: { type: String, default: '' },
            originalName: { type: String, default: '' },
            uploadedAt: { type: Date },
        },

        links: {
            portfolio: { type: String, default: '' },
            github: { type: String, default: '' },
            linkedin: { type: String, default: '' },
            twitter: { type: String, default: '' },
        },

        // --- Recruiter association (spec section 7) ---
        company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', default: null },

        // --- Platform state (spec section 22) ---
        status: { type: String, enum: ['active', 'blocked'], default: 'active' },
        isVerified: { type: Boolean, default: false },
        emailVerified: { type: Boolean, default: true },
        isDeleted: { type: Boolean, default: false },

        // --- Auth state ---
        refreshToken: { type: String, select: false, default: null },
        resetPasswordToken: { type: String, select: false, default: null },
        resetPasswordExpires: { type: Date, select: false, default: null },
        emailVerificationCodeHash: { type: String, select: false, default: null },
        emailVerificationCodeExpires: { type: Date, select: false, default: null },
    },
    { timestamps: true }
);

// Spec section 27: unique index on email + search-oriented indexes
userSchema.index({ location: 1 });
userSchema.index({ 'skills.name': 1 });
userSchema.index({ name: 'text', headline: 'text', about: 'text' });

module.exports = mongoose.model('User', userSchema);
