const Joi = require('joi');

const createCompany = Joi.object({
    name: Joi.string().trim().min(2).max(120).required(),
    description: Joi.string().trim().max(3000).allow(''),
    industry: Joi.string().trim().max(120).allow(''),
    website: Joi.string().uri().allow(''),
    location: Joi.string().trim().max(160).allow(''),
    companySize: Joi.string().valid('1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'),
    foundedYear: Joi.number().integer().min(1800).max(new Date().getFullYear()),
    socialLinks: Joi.object({
        linkedin: Joi.string().uri().allow(''),
        twitter: Joi.string().uri().allow(''),
        facebook: Joi.string().uri().allow(''),
    }),
});

const updateCompany = createCompany.fork(['name'], (s) => s.optional()).min(1);

module.exports = { createCompany, updateCompany };
