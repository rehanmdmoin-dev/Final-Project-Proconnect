const ApiError = require('../utils/ApiError');

/**
 * Spec section 4.3: authorize("recruiter"), authorize("admin"), etc.
 * Admin is NOT automatically granted every role's routes - where the spec
 * intends admin access, 'admin' is listed explicitly on that route.
 */
const authorize = (...allowedRoles) => (req, res, next) => {
    if (!req.user) {
        return next(new ApiError(401, 'Not authenticated'));
    }
    if (!allowedRoles.includes(req.user.role)) {
        return next(new ApiError(403, `Access denied. Requires role: ${allowedRoles.join(' or ')}`));
    }
    next();
};

module.exports = { authorize };
