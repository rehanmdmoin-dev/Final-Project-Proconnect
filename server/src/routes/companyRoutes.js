const express = require('express');
const companyController = require('../controllers/companyController');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const validate = require('../middleware/validate');
const { uploadImage } = require('../middleware/upload');
const v = require('../validators/companyValidator');

const router = express.Router();

router.get('/my', authenticate, authorize('recruiter', 'admin'), companyController.getMyCompanies);

router.get('/', optionalAuth, companyController.getCompanies);
router.get('/:id', optionalAuth, companyController.getCompanyById);
router.get('/:id/followers', authenticate, companyController.getFollowers);

router.post('/', authenticate, authorize('recruiter', 'admin'), validate(v.createCompany), companyController.createCompany);
router.patch('/:id', authenticate, authorize('recruiter', 'admin'), validate(v.updateCompany), companyController.updateCompany);
router.post('/:id/logo', authenticate, authorize('recruiter', 'admin'), uploadImage.single('logo'), companyController.uploadLogo);
router.delete('/:id', authenticate, authorize('recruiter', 'admin'), companyController.deleteCompany);

router.post('/:id/follow', authenticate, companyController.followCompany);
router.delete('/:id/follow', authenticate, companyController.unfollowCompany);

module.exports = router;
