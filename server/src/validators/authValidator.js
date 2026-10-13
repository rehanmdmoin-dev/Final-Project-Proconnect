const Joi = require('joi');

const objectId = Joi.string().hex().length(24);

const register = Joi.object({
    name: Joi.string().trim().min(2).max(80).required(),
    email: Joi.string().trim().email({ tlds: { deny: [] } }).required(),
    password: Joi.string().min(8).max(128).required()
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .message('Password must contain an uppercase letter, a lowercase letter and a number'),
    // Only jobseeker/recruiter may be self-selected. 'admin' is intentionally
    // NOT accepted here - see authController.register.
    role: Joi.string().valid('jobseeker', 'recruiter').default('jobseeker'),
});

const login = Joi.object({
    email: Joi.string().trim().email({ tlds: { deny: [] } }).required(),
    password: Joi.string().required(),
});

const verifyEmail = Joi.object({
    email: Joi.string().trim().email({ tlds: { deny: [] } }).required(),
    code: Joi.string().pattern(/^\d{6}$/).required(),
});

const resendVerification = Joi.object({
    email: Joi.string().trim().email({ tlds: { deny: [] } }).required(),
});

const forgotPassword = Joi.object({
    email: Joi.string().trim().email({ tlds: { deny: [] } }).required(),
});

const resetPassword = Joi.object({
    token: Joi.string().required(),
    password: Joi.string().min(8).max(128).required()
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .message('Password must contain an uppercase letter, a lowercase letter and a number'),
});

const changePassword = Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().min(8).max(128).required()
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .message('Password must contain an uppercase letter, a lowercase letter and a number'),
});

module.exports = { register, login, verifyEmail, resendVerification, forgotPassword, resetPassword, changePassword, objectId };
