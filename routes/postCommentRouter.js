const express = require('express');
const postCommentController = require('../controllers/postCommentController');
const authenticateRoute = require('../configs/passportAuthenticate');

const router = express.Router();

router.post('/:postId', authenticateRoute, postCommentController.postComment);
router.put(
	'/:commentId',
	authenticateRoute,
	postCommentController.putChangeComment
);
router.delete(
	'/:commentId',
	authenticateRoute,
	postCommentController.deleteComment
);

module.exports = router;
