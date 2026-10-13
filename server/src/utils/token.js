const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const generateAccessToken = (user) =>
    jwt.sign({ id: user._id, role: user.role }, process.env.JWT_ACCESS_SECRET, {
        expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m',
    });

const generateRefreshToken = (user) =>
    jwt.sign({ id: user._id, role: user.role }, process.env.JWT_REFRESH_SECRET, {
        expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d',
    });

/**
 * Password reset token. The RAW token goes in the email; only its SHA-256
 * hash is stored, so a leaked database cannot be used to reset accounts.
 */
const generateResetToken = () => {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    return { rawToken, hashedToken };
};

const hashResetToken = (rawToken) =>
    crypto.createHash('sha256').update(rawToken).digest('hex');

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    generateResetToken,
    hashResetToken,
};
