const express = require('express');
const profileController = require('../controllers/profileController');
const jobController = require('../controllers/jobController');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const validate = require('../middleware/validate');
const { uploadImage, uploadResume } = require('../middleware/upload');
const v = require('../validators/profileValidator');

const router = express.Router();

// Recruiter talent search - must be declared before '/:id' so "candidates"
// isn't swallowed as a user id.
router.get(
    '/candidates/search',
    authenticate,
    authorize('recruiter', 'admin'),
    profileController.searchCandidates
);

router.get('/saved-jobs', authenticate, jobController.getSavedJobs);

router.get('/me', authenticate, profileController.getMyProfile);
router.patch('/me', authenticate, validate(v.updateProfile), profileController.updateProfile);

router.post('/me/profile-image', authenticate, uploadImage.single('image'), profileController.uploadProfileImage);
router.post('/me/resume', authenticate, uploadResume.single('resume'), profileController.uploadResume);
router.delete('/me/resume', authenticate, profileController.deleteResume);

// Repeatable profile sections
router.post('/me/experience', authenticate, validate(v.experience), profileController.addExperience);
router.patch('/me/experience/:entryId', authenticate, validate(v.experience), profileController.updateExperience);
router.delete('/me/experience/:entryId', authenticate, profileController.deleteExperience);

router.post('/me/education', authenticate, validate(v.education), profileController.addEducation);
router.patch('/me/education/:entryId', authenticate, validate(v.education), profileController.updateEducation);
router.delete('/me/education/:entryId', authenticate, profileController.deleteEducation);

router.post('/me/certifications', authenticate, validate(v.certification), profileController.addCertification);
router.patch('/me/certifications/:entryId', authenticate, validate(v.certification), profileController.updateCertification);
router.delete('/me/certifications/:entryId', authenticate, profileController.deleteCertification);

router.post('/me/skills', authenticate, validate(v.skill), profileController.addSkill);
router.patch('/me/skills/:entryId', authenticate, validate(v.skill), profileController.updateSkill);
router.delete('/me/skills/:entryId', authenticate, profileController.deleteSkill);

// Public profile view last, so it doesn't shadow the static paths above.
router.get('/:id', optionalAuth, profileController.getPublicProfile);

module.exports = router;
