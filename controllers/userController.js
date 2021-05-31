const { body, validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const fsPromises = require('fs/promises');
const fs = require('fs');
const User = require('../models/userModel');
const upload = require('../configs/multerConfig');

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
			const isEmailUsed = await User.findOne({ email }, 'email');

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
	(req, res, next) => {
		upload('userImage')(req, res, (err) => {
			if (err) {
				res.status(400);
				return res.json({ errors: [err] });
			}

			return next();
		});
	},
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
	body('lastImage').trim().escape().optional({ nullable: true }),
	async (req, res, next) => {
		const formErrors = validationResult(req);
		const { email, firstName, lastName, password, newPassword, lastImage } =
			req.body;

		try {
			if (!formErrors.isEmpty()) {
				if (req.file && fs.existsSync(req.file.path))
					await fsPromises.unlink(req.file.path);

				res.status(400);
				return res.json({ user: req.body, errors: formErrors.array() });
			}

			const isEmailUsed = await User.findOne({ email }, 'email');
			const oldUser = await User.findById(
				req.params.userId,
				'email password profileImage'
			);
			const isPasswordMatching = await bcrypt.compare(
				password,
				oldUser.password
			);

			if (!oldUser._id.equals(req.user._id)) {
				res.status(400);
				return res.json({
					errors: [
						{
							msg: "You can not edit another user's profile",
						},
					],
				});
			}
			if (isEmailUsed && oldUser.email !== email) {
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

			let profileImage = '';

			if (lastImage === 'keep') profileImage = oldUser.profileImage;
			if (req.file) profileImage = req.file.filename;
			if (
				lastImage !== 'keep' &&
				oldUser.profileImage !== '' &&
				fs.existsSync(`./public/images/users/${oldUser.profileImage}`)
			)
				await fsPromises.unlink(
					`./public/images/users/${oldUser.profileImage}`
				);

			const hashedPassword = await bcrypt.hash(newPassword || password, 10);

			const updatedUserFields = {
				email,
				firstName,
				lastName,
				password: hashedPassword,
				profileImage,
			};

			await User.findByIdAndUpdate(req.params.userId, updatedUserFields);

			const updatedUser = await User.findById(req.user._id);

			return res.json({ user: updatedUser.coreDetails });
		} catch (error) {
			return next(error);
		}
	},
];

// TODO delete user
