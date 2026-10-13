const express = require('express');
const applicationController = require('../controllers/applicationController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const validate = require('../middleware/validate');
const v = require('../validators/applicationValidator');

const router = express.Router();

router.use(authenticate);

router.get('/my', authorize('jobseeker'), applicationController.getMyApplications);
router.get('/stats', applicationController.getStats);

router.get('/:id', applicationController.getApplicationById);
router.patch('/:id/status', authorize('recruiter', 'admin'), validate(v.updateStatus), applicationController.updateStatus);
router.patch('/:id/notes', authorize('recruiter', 'admin'), validate(v.recruiterNotes), applicationController.updateNotes);
router.patch('/:id/withdraw', authorize('jobseeker'), applicationController.withdraw);

module.exports = router;
