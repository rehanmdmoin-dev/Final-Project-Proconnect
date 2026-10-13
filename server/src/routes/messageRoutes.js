const express = require('express');
const messageController = require('../controllers/messageController');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const v = require('../validators/socialValidator');

const router = express.Router();

router.use(authenticate);

router.post('/', validate(v.sendMessage), messageController.sendMessage);
router.get('/unread-count', messageController.getUnreadCount);

module.exports = router;
