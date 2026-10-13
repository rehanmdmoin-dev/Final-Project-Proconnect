const Joi = require('joi');

const applyToJob = Joi.object({
    coverLetter: Joi.string().trim().max(3000).allow(''),
});

const updateStatus = Joi.object({
    status: Joi.string()
        .valid('Applied', 'Under Review', 'Shortlisted', 'Interview', 'Selected', 'Rejected')
        .required(),
    note: Joi.string().trim().max(500).allow(''),
});

const recruiterNotes = Joi.object({
    recruiterNotes: Joi.string().trim().max(2000).allow(''),
});

module.exports = { applyToJob, updateStatus, recruiterNotes };
