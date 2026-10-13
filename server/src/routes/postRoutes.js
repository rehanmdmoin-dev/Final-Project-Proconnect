const express = require('express');
const postController = require('../controllers/postController');
const { authenticate, optionalAuth } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { uploadImage } = require('../middleware/upload');
const v = require('../validators/socialValidator');

const router = express.Router();

router.get('/feed', authenticate, postController.getFeed);
router.get('/user/:userId', optionalAuth, postController.getUserPosts);

router.post('/', authenticate, uploadImage.single('media'), validate(v.createPost), postController.createPost);

router.get('/:id', optionalAuth, postController.getPostById);
router.patch('/:id', authenticate, validate(v.updatePost), postController.updatePost);
router.delete('/:id', authenticate, postController.deletePost);

router.post('/:id/like', authenticate, postController.toggleLike);

router.get('/:id/comments', optionalAuth, postController.getComments);
router.post('/:id/comments', authenticate, validate(v.createComment), postController.addComment);
router.delete('/comments/:commentId', authenticate, postController.deleteComment);

module.exports = router;
