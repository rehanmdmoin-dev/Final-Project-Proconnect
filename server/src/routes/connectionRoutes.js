const express = require('express');
const connectionController = require('../controllers/connectionController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/pending', connectionController.getPendingRequests);
router.get('/', connectionController.getConnections);

router.post('/:userId', connectionController.sendRequest);
router.patch('/:id/accept', connectionController.acceptRequest);
router.patch('/:id/reject', connectionController.rejectRequest);
router.patch('/:userId/block', connectionController.blockUser);
router.delete('/:id', connectionController.removeConnection);

module.exports = router;
