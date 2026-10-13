const express = require('express');
const interviewController = require('../controllers/interviewController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const validate = require('../middleware/validate');
const v = require('../validators/interviewValidator');

const router = express.Router();

router.use(authenticate);

router.get('/', interviewController.getInterviews);
router.post('/', authorize('recruiter', 'admin'), validate(v.scheduleInterview), interviewController.scheduleInterview);

router.get('/:id', interviewController.getInterviewById);
router.patch('/:id', authorize('recruiter', 'admin'), validate(v.updateInterview), interviewController.updateInterview);
router.delete('/:id', authorize('recruiter', 'admin'), interviewController.cancelInterview);

module.exports = router;
