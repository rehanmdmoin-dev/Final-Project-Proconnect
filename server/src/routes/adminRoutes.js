const express = require('express');
const adminController = require('../controllers/adminController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const validate = require('../middleware/validate');
const v = require('../validators/socialValidator');

const router = express.Router();

// Every admin route is gated twice: authenticated AND role === 'admin'.
router.use(authenticate, authorize('admin'));

router.get('/analytics', adminController.getAnalytics);

router.get('/users', adminController.getUsers);
router.patch('/users/:id/status', adminController.toggleUserStatus);
router.patch('/users/:id/verify', adminController.verifyUser);
router.delete('/users/:id', adminController.deleteUser);

router.get('/companies', adminController.getCompanies);
router.patch('/companies/:id/verification', adminController.setCompanyVerification);

router.get('/jobs', adminController.getJobs);
router.patch('/jobs/:id/moderate', adminController.moderateJob);
router.delete('/jobs/:id', adminController.removeJob);

router.get('/reports', adminController.getReports);
router.patch('/reports/:id', validate(v.resolveReport), adminController.resolveReport);

router.delete('/posts/:id', adminController.removePost);

module.exports = router;
