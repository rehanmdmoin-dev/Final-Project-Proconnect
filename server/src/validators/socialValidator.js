const Joi = require('joi');

const createPost = Joi.object({
    content: Joi.string().trim().min(1).max(3000).required(),
    company: Joi.string().hex().length(24).allow(null, ''),
});

const updatePost = Joi.object({
    content: Joi.string().trim().min(1).max(3000).required(),
});

const createComment = Joi.object({
    content: Joi.string().trim().min(1).max(1000).required(),
});

const sendMessage = Joi.object({
    receiver: Joi.string().hex().length(24).required(),
    message: Joi.string().trim().min(1).max(2000).required(),
});

const createReport = Joi.object({
    targetType: Joi.string().valid('user', 'job', 'post', 'comment', 'company').required(),
    targetId: Joi.string().hex().length(24).required(),
    reason: Joi.string().trim().min(3).max(200).required(),
    description: Joi.string().trim().max(1000).allow(''),
});

const resolveReport = Joi.object({
    status: Joi.string().valid('open', 'under_review', 'resolved', 'dismissed').required(),
    resolutionNote: Joi.string().trim().max(1000).allow(''),
});

module.exports = { createPost, updatePost, createComment, sendMessage, createReport, resolveReport };
