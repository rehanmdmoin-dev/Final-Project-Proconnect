/**
 * Consistent response envelope (spec section 34).
 */
const success = (res, statusCode, message, data = undefined, extra = {}) => {
    const body = { success: true, message, ...extra };
    if (data !== undefined) body.data = data;
    return res.status(statusCode).json(body);
};

module.exports = { success };
