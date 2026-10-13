const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { bindController } = require('../utils/asyncHandler');
const { success } = require('../utils/response');
const {
    generateAccessToken,
    generateRefreshToken,
    generateResetToken,
    hashResetToken,
} = require('../utils/token');
const emailService = require('../services/emailService');

const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
};

const clearAuthCookies = (res) => {
    res.clearCookie('accessToken', cookieOptions);
    res.clearCookie('refreshToken', cookieOptions);
};

const publicUser = (user) => ({
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    headline: user.headline,
    profileImage: user.profileImage,
    company: user.company,
    isVerified: user.isVerified,
});

const hashVerificationCode = (code) => crypto.createHash('sha256').update(code).digest('hex');

const issueVerificationCode = async (user) => {
    const code = crypto.randomInt(0, 1000000).toString().padStart(6, '0');
    user.emailVerificationCodeHash = hashVerificationCode(code);
    user.emailVerificationCodeExpires = Date.now() + 10 * 60 * 1000;
    await user.save();
    await emailService.sendEmailVerificationCode(user, code);
};

class AuthController {
    async register(req, res) {
        const { name, email, password, role } = req.body;

        const existing = await User.findOne({ email });
        if (existing) {
            throw new ApiError(400, 'An account with this email already exists');
        }

        const hashedPassword = await bcrypt.hash(password, 10);

      
        const safeRole = role === 'recruiter' ? 'recruiter' : 'jobseeker';

        const user = await User.create({ name, email, password: hashedPassword, role: safeRole, emailVerified: false });
        await issueVerificationCode(user);

        return success(res, 201, 'Registration successful. A verification code has been sent to your email.', publicUser(user));
    }

    async verifyEmail(req, res) {
        const { email, code } = req.body;
        const user = await User.findOne({ email: email.toLowerCase(), isDeleted: false })
            .select('+emailVerificationCodeHash +emailVerificationCodeExpires');

        if (!user || user.emailVerified || !user.emailVerificationCodeHash ||
            !user.emailVerificationCodeExpires || user.emailVerificationCodeExpires <= Date.now()) {
            throw new ApiError(400, 'Verification code is invalid or has expired. Request a new code.');
        }

        const expected = Buffer.from(user.emailVerificationCodeHash, 'hex');
        const received = Buffer.from(hashVerificationCode(code), 'hex');
        if (!crypto.timingSafeEqual(expected, received)) {
            throw new ApiError(400, 'Verification code is invalid or has expired. Request a new code.');
        }

        user.emailVerified = true;
        user.emailVerificationCodeHash = null;
        user.emailVerificationCodeExpires = null;
        await user.save();
        await emailService.sendWelcomeEmail(user);

        return success(res, 200, 'Email verified. You can now sign in.', publicUser(user));
    }

    async resendVerification(req, res) {
        const user = await User.findOne({ email: req.body.email.toLowerCase(), isDeleted: false })
            .select('+emailVerificationCodeHash +emailVerificationCodeExpires');

        if (user && !user.emailVerified) await issueVerificationCode(user);

        return success(res, 200, 'If the account needs verification, a new code has been sent.');
    }

   
    async login(req, res) {
        const { email, password } = req.body;

        const user = await User.findOne({ email, isDeleted: false }).select('+password');

        if (!user) throw new ApiError(401, 'Invalid email or password');

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) throw new ApiError(401, 'Invalid email or password');

        if (user.status === 'blocked') {
            throw new ApiError(403, 'Your account has been blocked. Contact support.');
        }
        if (!user.emailVerified) {
            throw new ApiError(403, 'Please verify your email address before signing in.');
        }

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        user.refreshToken = await bcrypt.hash(refreshToken, 10);
        await user.save();

        res.cookie('accessToken', accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
        res.cookie('refreshToken', refreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });

        return success(res, 200, 'Login successful', publicUser(user));
    }


    async refreshToken(req, res) {
        const incoming = req.cookies?.refreshToken || req.body?.refreshToken;
        if (!incoming) {
            clearAuthCookies(res);
            throw new ApiError(401, 'No refresh token provided');
        }

        let decoded;
        try {
            decoded = jwt.verify(incoming, process.env.JWT_REFRESH_SECRET);
        } catch (err) {
            clearAuthCookies(res);
            throw new ApiError(401, 'Invalid or expired refresh token. Please log in again.');
        }

        const user = await User.findOne({ _id: decoded.id, isDeleted: false }).select('+refreshToken');
        if (!user || !user.refreshToken) {
            clearAuthCookies(res);
            throw new ApiError(401, 'Session not found. Please log in again.');
        }

        const isMatch = await bcrypt.compare(incoming, user.refreshToken);
        if (!isMatch) {
            clearAuthCookies(res);
            throw new ApiError(403, 'Refresh token mismatch. Please log in again.');
        }

        const newAccessToken = generateAccessToken(user);
        const newRefreshToken = generateRefreshToken(user);
        user.refreshToken = await bcrypt.hash(newRefreshToken, 10);
        await user.save();

        res.cookie('accessToken', newAccessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
        res.cookie('refreshToken', newRefreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });

        return success(res, 200, 'Token refreshed');
    }

    async logout(req, res) {
        const incoming = req.cookies?.refreshToken;
        if (incoming) {
            try {
                const decoded = jwt.verify(incoming, process.env.JWT_REFRESH_SECRET);
                const user = await User.findOne({ _id: decoded.id, isDeleted: false }).select('+refreshToken');
                if (user?.refreshToken && await bcrypt.compare(incoming, user.refreshToken)) {
                    user.refreshToken = null;
                    await user.save();
                }
            } catch {
                
            }
        }
        clearAuthCookies(res);
        return success(res, 200, 'Logged out successfully');
    }

    async me(req, res) {
        return success(res, 200, 'Current user', publicUser(req.user));
    }

    async forgotPassword(req, res) {
        const { email } = req.body;
        const user = await User.findOne({ email, isDeleted: false });

        const genericMessage = 'If an account exists for that email, a reset link has been sent.';
        if (!user) return success(res, 200, genericMessage);

        const { rawToken, hashedToken } = generateResetToken();
        user.resetPasswordToken = hashedToken;
        user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 minutes
        await user.save();

        const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${rawToken}`;
        await emailService.sendPasswordResetEmail(user, resetUrl);

        return success(res, 200, genericMessage);
    }


    async resetPassword(req, res) {
        const { token, password } = req.body;

        const hashedToken = hashResetToken(token);
        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: Date.now() },
            isDeleted: false,
        }).select('+resetPasswordToken +resetPasswordExpires');

        if (!user) {
            throw new ApiError(400, 'Reset link is invalid or has expired. Please request a new one.');
        }

        user.password = await bcrypt.hash(password, 10);
        user.resetPasswordToken = null;
        user.resetPasswordExpires = null;
        user.refreshToken = null;
        await user.save();

        return success(res, 200, 'Password reset successfully. Please log in.');
    }

    async changePassword(req, res) {
        const { currentPassword, newPassword } = req.body;

        const user = await User.findById(req.user._id).select('+password');
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) throw new ApiError(401, 'Current password is incorrect');

        user.password = await bcrypt.hash(newPassword, 10);
        user.refreshToken = null;
        await user.save();

        return success(res, 200, 'Password changed successfully. Please log in again.');
    }
}

module.exports = bindController(new AuthController());
