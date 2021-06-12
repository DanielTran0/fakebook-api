const express = require('express');
const postLikeController = require('../controllers/postLikeController');
const authenticateRoute = require('../configs/passportAuthenticate');

const router = express.Router();

router.put(
	'/posts/:postId',
	authenticateRoute,
	postLikeController.putChangeLikeOnPost
);

router.put(
	'/comments/:commentId',
	authenticateRoute,
	postLikeController.putChangeLikeOnComment
);

module.exports = router;
