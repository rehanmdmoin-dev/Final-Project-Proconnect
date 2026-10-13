const express = require('express');
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const v = require('../validators/authValidator');

const router = express.Router();

// Spec section 33: tighter rate limiting on login + password reset specifically,
// since these are the endpoints worth brute-forcing.
const strictLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { success: false, message: 'Too many attempts. Please try again in 15 minutes.' },
});

const verificationLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { success: false, message: 'Too many verification attempts. Please try again in 15 minutes.' },
});

router.post('/register', verificationLimiter, validate(v.register), authController.register);
router.post('/verify-email', verificationLimiter, validate(v.verifyEmail), authController.verifyEmail);
router.post('/resend-verification', verificationLimiter, validate(v.resendVerification), authController.resendVerification);
router.post('/login', strictLimiter, validate(v.login), authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/forgot-password', strictLimiter, validate(v.forgotPassword), authController.forgotPassword);
router.post('/reset-password', strictLimiter, validate(v.resetPassword), authController.resetPassword);
router.post('/logout', authController.logout);

router.use(authenticate);
router.get('/me', authController.me);
router.patch('/change-password', validate(v.changePassword), authController.changePassword);

module.exports = router;
