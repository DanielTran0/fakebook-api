const express = require('express');
const postLikeController = require('../controllers/postLikeController');
const authenticateRoute = require('../configs/passportAuthenticate');

const router = express.Router();

router.put(
	'/:postId',
	authenticateRoute,
	postLikeController.putChangeLikeOnPost
);

module.exports = router;
