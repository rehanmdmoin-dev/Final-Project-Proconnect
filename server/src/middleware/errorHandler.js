const ApiError = require('../utils/ApiError');

const notFound = (req, res, next) => {
    next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal server error';
    let errors = err.errors || [];

    if (err.name === 'ValidationError') {
        statusCode = 400;
        errors = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
        message = 'Validation failed';
    }

    if (err.code === 11000) {
        statusCode = 400;
        const field = Object.keys(err.keyValue || {})[0];
        // Duplicate-key errors back the spec's "prevent duplicate application /
        // duplicate saved job / duplicate connection" rules, so give a clear message.
        message = `Duplicate value for ${field}. This record already exists.`;
    }

    if (err.name === 'CastError') {
        statusCode = 400;
        message = `Invalid ${err.path}: ${err.value}`;
    }

    if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid token';
    }
    if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Token expired';
    }

    if (process.env.NODE_ENV !== 'production' && statusCode >= 500) {
        console.error(err);
    }

    const body = { success: false, message };
    if (errors.length) body.errors = errors;
    // Spec section 33: never leak stack traces in production
    if (process.env.NODE_ENV !== 'production' && err.stack) body.stack = err.stack;

    res.status(statusCode).json(body);
};

module.exports = { notFound, errorHandler };
