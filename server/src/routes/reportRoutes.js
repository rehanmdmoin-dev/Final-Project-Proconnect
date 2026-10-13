const express = require('express');
const reportController = require('../controllers/reportController');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const v = require('../validators/socialValidator');

const router = express.Router();

router.use(authenticate);

router.post('/', validate(v.createReport), reportController.createReport);
router.get('/my', reportController.getMyReports);

module.exports = router;
