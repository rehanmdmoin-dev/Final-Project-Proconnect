const ApiError = require('../utils/ApiError');

/**
 * Runs a Joi schema against a part of the request.
 * Spec section 34 response shape: { success:false, message, errors:[...] }
 */
const validate = (schema, property = 'body') => (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
        abortEarly: false,
        stripUnknown: true,
    });

    if (error) {
        const errors = error.details.map((d) => ({
            field: d.path.join('.'),
            message: d.message,
        }));
        return next(new ApiError(400, 'Validation failed', errors));
    }

    req[property] = value;
    next();
};

module.exports = validate;
