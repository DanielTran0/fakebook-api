const express = require('express');
const sessionController = require('../controllers/sessionController');
const authenticateRoute = require('../configs/passportAuthenticate');

const router = express.Router();

router.post('/email', sessionController.postNewSession);
router.post(
	'/facebook',
	authenticateRoute,
	sessionController.postFacebookSession
);

module.exports = router;
