const Joi = require('joi');

const scheduleInterview = Joi.object({
    application: Joi.string().hex().length(24).required(),
    scheduledAt: Joi.date().greater('now').required().messages({
        'date.greater': 'Interview must be scheduled for a future date/time',
    }),
    durationMinutes: Joi.number().integer().min(5).max(480).default(30),
    mode: Joi.string().valid('Online', 'Offline', 'Phone').default('Online'),
    meetingLink: Joi.string().uri().allow(''),
    address: Joi.string().trim().max(300).allow(''),
    notes: Joi.string().trim().max(1000).allow(''),
}).custom((value, helpers) => {
    if (value.mode === 'Online' && !value.meetingLink) {
        return helpers.message('meetingLink is required for an Online interview');
    }
    if (value.mode === 'Offline' && !value.address) {
        return helpers.message('address is required for an Offline interview');
    }
    return value;
});

const updateInterview = Joi.object({
    scheduledAt: Joi.date().greater('now'),
    durationMinutes: Joi.number().integer().min(5).max(480),
    mode: Joi.string().valid('Online', 'Offline', 'Phone'),
    meetingLink: Joi.string().uri().allow(''),
    address: Joi.string().trim().max(300).allow(''),
    notes: Joi.string().trim().max(1000).allow(''),
    status: Joi.string().valid('Scheduled', 'Completed', 'Cancelled', 'Rescheduled'),
}).min(1);

module.exports = { scheduleInterview, updateInterview };
