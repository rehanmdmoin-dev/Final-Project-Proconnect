const express = require('express');
const messageController = require('../controllers/messageController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/', messageController.getConversations);
router.get('/:id/messages', messageController.getMessages);
router.patch('/:id/read', messageController.markAsRead);

module.exports = router;
