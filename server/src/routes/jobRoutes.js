const express = require('express');
const jobController = require('../controllers/jobController');
const applicationController = require('../controllers/applicationController');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const validate = require('../middleware/validate');
const jv = require('../validators/jobValidator');
const av = require('../validators/applicationValidator');

const router = express.Router();

// Static path first so it isn't matched as '/:id'
router.get('/my', authenticate, authorize('recruiter', 'admin'), jobController.getMyJobs);

router.get('/', optionalAuth, jobController.getJobs);
router.get('/:id', optionalAuth, jobController.getJobById);

router.post('/', authenticate, authorize('recruiter', 'admin'), validate(jv.createJob), jobController.createJob);
router.patch('/:id', authenticate, authorize('recruiter', 'admin'), validate(jv.updateJob), jobController.updateJob);
router.patch('/:id/status', authenticate, authorize('recruiter', 'admin'), validate(jv.changeJobStatus), jobController.changeStatus);
router.delete('/:id', authenticate, authorize('recruiter', 'admin'), jobController.deleteJob);

// Saved jobs - jobseeker bookmarks
router.post('/:jobId/save', authenticate, authorize('jobseeker'), jobController.saveJob);
router.delete('/:jobId/save', authenticate, authorize('jobseeker'), jobController.unsaveJob);

// Applying + recruiter applicant list live under the job they belong to
router.post('/:jobId/apply', authenticate, authorize('jobseeker'), validate(av.applyToJob), applicationController.applyToJob);
router.get('/:jobId/applicants', authenticate, authorize('recruiter', 'admin'), applicationController.getJobApplicants);

module.exports = router;
