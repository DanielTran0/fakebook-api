const express = require('express');
const friendController = require('../controllers/friendController');
const authenticateRoute = require('../configs/passportAuthenticate');

const router = express.Router();

router.get('/', authenticateRoute, friendController.getUserFriends);
router.get(
	'/:userId',
	authenticateRoute,
	friendController.getAnotherUserFriends
);
router.post(
	'/:userId',
	authenticateRoute,
	friendController.postOutgoingRequest
);
router.put(
	'/:userId',
	authenticateRoute,
	friendController.putAcceptOrRejectFriendRequest
);
router.delete(
	'/:userId',
	authenticateRoute,
	friendController.deleteUserFriendOrRequest
);

module.exports = router;
