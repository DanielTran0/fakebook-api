const express = require('express');
const userController = require('../controllers/userController');
const authenticateRoute = require('../configs/passportAuthenticate');

const router = express.Router();

router.get('/', authenticateRoute, userController.getAllUsers);
router.get('/:userId', authenticateRoute, userController.getSingleUser);
router.post('/', userController.postCreatedUser);
router.put('/:userId', authenticateRoute, userController.putUpdateUser);

module.exports = router;
