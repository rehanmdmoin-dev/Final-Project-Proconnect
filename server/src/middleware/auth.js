const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');


const authenticate = asyncHandler(async (req, res, next) => {
    let token;
    const header = req.headers.authorization;

    if (header && header.startsWith('Bearer ')) {
        token = header.split(' ')[1];
    } else if (req.cookies && req.cookies.accessToken) {
        token = req.cookies.accessToken;
    }

    if (!token) {
        throw new ApiError(401, 'Not authorized. No token provided.');
    }

    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    } catch (err) {
        throw new ApiError(401, 'Not authorized. Invalid or expired token.');
    }

    const user = await User.findOne({ _id: decoded.id, isDeleted: false });
    if (!user) {
        throw new ApiError(401, 'Not authorized. User no longer exists.');
    }
    if (user.status === 'blocked') {
        throw new ApiError(403, 'Your account has been blocked. Contact support.');
    }

    req.user = user;
    next();
});


const optionalAuth = asyncHandler(async (req, res, next) => {
    const header = req.headers.authorization;
    const token = header && header.startsWith('Bearer ')
        ? header.split(' ')[1]
        : req.cookies?.accessToken;
    if (!token) return next();

    try {
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        const user = await User.findOne({ _id: decoded.id, isDeleted: false });
        if (user && user.status !== 'blocked') req.user = user;
    } catch (err) {
        
    }
    next();
});

module.exports = { authenticate, optionalAuth };
