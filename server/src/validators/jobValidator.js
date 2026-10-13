const Joi = require('joi');

const createJob = Joi.object({
    title: Joi.string().trim().min(3).max(140).required(),
    description: Joi.string().trim().min(20).required(),
    responsibilities: Joi.array().items(Joi.string().trim()).default([]),
    requirements: Joi.array().items(Joi.string().trim()).default([]),
    skills: Joi.array().items(Joi.string().trim()).default([]),
    experience: Joi.object({
        min: Joi.number().min(0).default(0),
        max: Joi.number().min(0).default(0),
    }).custom((value, helpers) => {
        if (value.max && value.min > value.max) {
            return helpers.message('experience.min cannot be greater than experience.max');
        }
        return value;
    }),
    salary: Joi.object({
        min: Joi.number().min(0),
        max: Joi.number().min(0),
        currency: Joi.string().default('INR'),
        isDisclosed: Joi.boolean().default(true),
    }).custom((value, helpers) => {
        if (value.min != null && value.max != null && value.min > value.max) {
            return helpers.message('salary.min cannot be greater than salary.max');
        }
        return value;
    }),
    location: Joi.string().trim().max(160).allow(''),
    workMode: Joi.string().valid('Remote', 'Hybrid', 'On-site'),
    jobType: Joi.string().valid('Full Time', 'Part Time', 'Internship', 'Contract'),
    deadline: Joi.date().greater('now').messages({
        'date.greater': 'deadline must be a future date',
    }),
    company: Joi.string().hex().length(24).required(),
    status: Joi.string().valid('draft', 'active'),
});

const updateJob = createJob
    .fork(['title', 'description', 'company'], (s) => s.optional())
    .min(1);

const changeJobStatus = Joi.object({
    status: Joi.string().valid('draft', 'active', 'closed').required(),
});

module.exports = { createJob, updateJob, changeJobStatus };
