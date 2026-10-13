const Joi = require('joi');

const updateProfile = Joi.object({
    name: Joi.string().trim().min(2).max(80),
    headline: Joi.string().trim().max(160).allow(''),
    about: Joi.string().trim().max(2000).allow(''),
    location: Joi.string().trim().max(120).allow(''),
    phone: Joi.string().trim().max(20).allow(''),
    links: Joi.object({
        portfolio: Joi.string().uri().allow(''),
        github: Joi.string().uri().allow(''),
        linkedin: Joi.string().uri().allow(''),
        twitter: Joi.string().uri().allow(''),
    }),
}).min(1);

const experience = Joi.object({
    company: Joi.string().trim().required(),
    position: Joi.string().trim().required(),
    employmentType: Joi.string().valid('Full Time', 'Part Time', 'Internship', 'Contract', 'Freelance'),
    location: Joi.string().trim().allow(''),
    startDate: Joi.date().required(),
    endDate: Joi.date().allow(null).min(Joi.ref('startDate'))
        .message('endDate must be after startDate'),
    currentlyWorking: Joi.boolean(),
    description: Joi.string().trim().max(1000).allow(''),
});

const education = Joi.object({
    institution: Joi.string().trim().required(),
    degree: Joi.string().trim().required(),
    fieldOfStudy: Joi.string().trim().allow(''),
    startDate: Joi.date(),
    endDate: Joi.date().allow(null),
    grade: Joi.string().trim().allow(''),
    description: Joi.string().trim().max(1000).allow(''),
});

const certification = Joi.object({
    name: Joi.string().trim().required(),
    issuer: Joi.string().trim().allow(''),
    issueDate: Joi.date(),
    credentialUrl: Joi.string().uri().allow(''),
});

const skill = Joi.object({
    name: Joi.string().trim().required(),
    proficiency: Joi.string().valid('Beginner', 'Intermediate', 'Advanced', 'Expert'),
});

module.exports = { updateProfile, experience, education, certification, skill };
