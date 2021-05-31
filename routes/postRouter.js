const express = require('express');
const postController = require('../controllers/postController');
const authenticateRoute = require('../configs/passportAuthenticate');

const router = express.Router();

router.get('/', authenticateRoute, postController.getAllPosts);
router.get('/:userId', authenticateRoute, postController.getPost);
router.post('/', authenticateRoute, postController.postCreatedPost);
router.put('/:postId', authenticateRoute, postController.putUpdatePost);
router.delete('/:postId', authenticateRoute, postController.putDeletePost);

module.exports = router;
