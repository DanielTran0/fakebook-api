const { body, validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const User = require('../models/userModel');

module.exports.getAllUsers = async (req, res, next) => {
	try {
		const users = await User.find({}, 'email firstName lastName profileImage');

		return res.json({ users });
	} catch (error) {
		res.send(error);
		return next(error);
	}
};

module.exports.getSingleUser = async (req, res, next) => {
	try {
		const user = await User.findById(
			req.params.userId,
			'email firstName lastName profileImage'
		);

		return res.json({ user: user.coreDetails });
	} catch (error) {
		return next(error);
	}
};

module.exports.postCreatedUser = [
	body('email', 'Invalid email format')
		.isEmail()
		.trim()
		.escape()
		.normalizeEmail(),
	body('firstName')
		.trim()
		.isLength({ min: 2 })
		.withMessage('Minimum length of 2')
		.escape()
		.isAlpha()
		.withMessage('Contains non-alphabetical characters'),
	body('lastName')
		.trim()
		.isLength({ min: 2 })
		.withMessage('Minimum length of 2')
		.escape()
		.isAlpha()
		.withMessage('Contains non-alphabetical characters'),
	body('password')
		.isLength({ min: 8 })
		.withMessage('Minimum length is 8')
		.matches('[0-9]')
		.withMessage('Must contain a number')
		.matches('[A-Z]')
		.withMessage('Must contain a capital letter'),
	body('passwordConfirmation', 'Must be identical to password').custom(
		(value, { req }) => value === req.body.password
	),
	async (req, res, next) => {
		const formErrors = validationResult(req);
		const { email, password, firstName, lastName } = req.body;

		if (!formErrors.isEmpty()) {
			res.status(400);
			return res.json({ user: req.body, errors: formErrors.array() });
		}

		try {
			const isEmailUsed = await User.findOne({ email });

			if (isEmailUsed) {
				res.status(400);
				return res.json({
					user: req.body,
					errors: [
						{
							location: 'body',
							msg: 'Email is already taken',
							param: 'email',
							value: email,
						},
					],
				});
			}
			const hashedPassword = await bcrypt.hash(password, 10);
			const user = new User({
				email,
				firstName,
				lastName,
				password: hashedPassword,
				profileImage: '',
				friends: [],
			});

			await user.save();

			return res.json({ user: user.coreDetails });
		} catch (error) {
			return next(error);
		}
	},
];

module.exports.putUpdateUser = [
	body('email', 'Invalid email format')
		.isEmail()
		.trim()
		.escape()
		.normalizeEmail(),
	body('firstName')
		.trim()
		.isLength({ min: 2 })
		.withMessage('Minimum length of 2')
		.escape()
		.isAlpha()
		.withMessage('Contains non-alphabetical characters'),
	body('lastName')
		.trim()
		.isLength({ min: 2 })
		.withMessage('Minimum length of 2')
		.escape()
		.isAlpha()
		.withMessage('Contains non-alphabetical characters'),
	body('password')
		.isLength({ min: 8 })
		.withMessage('Minimum length is 8')
		.matches('[0-9]')
		.withMessage('Must contain a number')
		.matches('[A-Z]')
		.withMessage('Must contain a capital letter'),
	body('newPassword')
		.isLength({ min: 8 })
		.withMessage('Minimum length is 8')
		.matches('[0-9]')
		.withMessage('Must contain a number')
		.matches('[A-Z]')
		.withMessage('Must contain a capital letter')
		.optional({ nullable: true }),
	body('newPasswordConfirmation', 'Must be identical to newPassword').custom(
		(value, { req }) => value === req.body.newPassword
	),
	async (req, res, next) => {
		const formErrors = validationResult(req);
		const { email, password, newPassword, firstName, lastName } = req.body;

		if (!formErrors.isEmpty()) {
			res.status(400);
			return res.json({ user: req.body, errors: formErrors.array() });
		}

		try {
			const isEmailUsed = await User.findOne({ email });

			if (isEmailUsed && req.user.email !== email) {
				res.status(400);
				return res.json({
					user: req.body,
					errors: [
						{
							location: 'body',
							msg: 'Email is already taken',
							param: 'email',
							value: email,
						},
					],
				});
			}

			const isPasswordMatching = await bcrypt.compare(
				password,
				req.user.password
			);

			if (!isPasswordMatching) {
				res.status(400);
				return res.json({
					user: req.body,
					errors: [
						{
							location: 'body',
							msg: 'Incorrect original password',
							param: 'password',
							value: password,
						},
					],
				});
			}

			const hashedPassword = await bcrypt.hash(newPassword || password, 10);

			const updatedUserFields = {
				email,
				firstName,
				lastName,
				password: hashedPassword,
			};

			await User.findByIdAndUpdate(req.user._id, updatedUserFields);

			const updatedUser = await User.findById(req.user._id);

			return res.json({ user: updatedUser.coreDetails });
		} catch (error) {
			return next(error);
		}
	},
];
