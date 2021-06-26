const { body, validationResult } = require('express-validator');
const bcrypt = require('bcrypt');

const { streamUpload, cloudinary } = require('../configs/cloudinaryConfig');
const upload = require('../configs/multerConfig');
const User = require('../models/userModel');
const Post = require('../models/postModel');

module.exports.getAllUsers = async (req, res, next) => {
	try {
		const users = await User.find(
			{},
			'firstName lastName profileImageUrl backgroundImageUrl'
		)
			.collation({ locale: 'en' })
			.sort('lastName');

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
			'firstName lastName profileImageUrl backgroundImageUrl'
		);

		return res.json({ user: user.coreDetails });
	} catch (error) {
		return next(error);
	}
};

module.exports.postCreatedUser = [
	body('email', 'Invalid email format.')
		.isEmail()
		.trim()
		.escape()
		.normalizeEmail(),
	body('firstName')
		.trim()
		.isLength({ min: 1 })
		.withMessage('Minimum length of 1.')
		.escape()
		.isAlpha()
		.withMessage('Contains non-alphabetical characters.'),
	body('lastName')
		.trim()
		.isLength({ min: 1 })
		.withMessage('Minimum length of 1.')
		.escape()
		.isAlpha()
		.withMessage('Contains non-alphabetical characters.'),
	body('password')
		.isLength({ min: 5 })
		.withMessage('Minimum length is 5.')
		.matches('[0-9]')
		.withMessage('Must contain a number.')
		.matches('[A-Z]')
		.withMessage('Must contain a capital letter.'),
	body('passwordConfirmation', 'Must be identical to password.').custom(
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
							msg: 'Email is already taken.',
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
			});

			await user.save();

			const baseUsers = await User.find({
				$or: [{ isAdmin: true }, { isTest: true }],
			});

			if (baseUsers[0]) {
				await User.findByIdAndUpdate(baseUsers[0]._id, {
					$push: { friends: { user: user._id, status: 'friends' } },
				});
				await User.findByIdAndUpdate(user._id, {
					$push: { friends: { user: baseUsers[0]._id, status: 'friends' } },
				});
			}
			if (baseUsers[1]) {
				await User.findByIdAndUpdate(baseUsers[1]._id, {
					$push: { friends: { user: user._id, status: 'friends' } },
				});
				await User.findByIdAndUpdate(user._id, {
					$push: { friends: { user: baseUsers[1]._id, status: 'friends' } },
				});
			}

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
				return res.json({ errors: [{ ...err, param: 'general' }] });
			}

			return next();
		});
	},
	body('email', 'Invalid email format.')
		.isEmail()
		.trim()
		.escape()
		.normalizeEmail(),
	body('firstName')
		.trim()
		.isLength({ min: 1 })
		.withMessage('Minimum length of 1.')
		.escape()
		.isAlpha()
		.withMessage('Contains non-alphabetical characters.'),
	body('lastName')
		.trim()
		.isLength({ min: 1 })
		.withMessage('Minimum length of 1.')
		.escape()
		.isAlpha()
		.withMessage('Contains non-alphabetical characters.'),
	body('password')
		.isLength({ min: 5 })
		.withMessage('Minimum length is 5.')
		.matches('[0-9]')
		.withMessage('Must contain a number.')
		.matches('[A-Z]')
		.withMessage('Must contain a capital letter.')
		.optional({ checkFalsy: true }),
	body('newPassword')
		.isLength({ min: 5 })
		.withMessage('Minimum length is 5.')
		.matches('[0-9]')
		.withMessage('Must contain a number.')
		.matches('[A-Z]')
		.withMessage('Must contain a capital letter.')
		.optional({ checkFalsy: true }),
	body('newPasswordConfirmation', 'Must be identical to password.').custom(
		(value, { req }) => value === req.body.newPassword
	),
	body('lastImage').trim().escape().optional({ checkFalsy: true }),
	body('isBackground').trim().escape().optional({ checkFalsy: true }),
	async (req, res, next) => {
		const formErrors = validationResult(req);
		const {
			email,
			firstName,
			lastName,
			password,
			newPassword,
			newPasswordConfirmation,
			lastImage,
			isBackground,
		} = req.body;
		const { file } = req;

		if (!formErrors.isEmpty()) {
			res.status(400);
			return res.json({ user: req.body, errors: formErrors.array() });
		}

		try {
			const isEmailUsed = await User.findOne({ email }, 'email');
			const oldUser = await User.findById(
				req.params.userId,
				'email password facebookId profileImage profileImageUrl backgroundImage backgroundImageUrl isTest'
			);
			let isPasswordMatching = false;

			if (oldUser.isTest) {
				res.status(400);
				return res.json({
					errors: [
						{ msg: "Test User settings can't be changed", param: 'general' },
					],
				});
			}
			if (!oldUser.facebookId)
				isPasswordMatching = await bcrypt.compare(password, oldUser.password);
			if (!oldUser._id.equals(req.user._id)) {
				res.status(400);
				return res.json({
					errors: [
						{
							msg: "You can not edit another user's profile.",
							param: 'general',
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
							msg: 'Email is already taken.',
							param: 'email',
							value: email,
						},
					],
				});
			}
			if (!isPasswordMatching && password !== '') {
				res.status(400);
				return res.json({
					user: req.body,
					errors: [
						{
							location: 'body',
							msg: 'Incorrect original password.',
							param: 'password',
							value: password,
						},
					],
				});
			}
			if (password && (!newPassword || !newPasswordConfirmation)) {
				res.status(400);
				return res.json({
					user: req.body,
					errors: [
						{ param: 'newPassword', msg: 'Required Field' },
						{ param: 'newPasswordConfirmation', msg: 'Required Field' },
					],
				});
			}

			if (!file && isBackground === 'true') {
				res.status(400);
				return res.json({
					user: req.body,
					errors: [{ param: 'general', msg: 'Need a image file' }],
				});
			}

			if (isBackground === 'true' && file) {
				if (oldUser.backgroundImage)
					await cloudinary.uploader.destroy(oldUser.backgroundImage);

				const cloudinaryBackgroundResponse = await streamUpload(req);

				await User.findByIdAndUpdate(req.params.userId, {
					backgroundImage: cloudinaryBackgroundResponse.public_id,
					backgroundImageUrl: cloudinaryBackgroundResponse.secure_url,
				});

				return res.json({
					backgroundImageUrl: cloudinaryBackgroundResponse.secure_url,
				});
			}

			let cloudinaryResponse = null;
			let profileImage = '';
			let profileImageUrl = '';

			if (lastImage === 'keep') {
				profileImage = oldUser.profileImage;
				profileImageUrl = oldUser.profileImageUrl;
			}
			if (file) {
				cloudinaryResponse = await streamUpload(req);

				profileImage = cloudinaryResponse.public_id;
				profileImageUrl = cloudinaryResponse.secure_url;
			}
			if ((file || lastImage !== 'keep') && oldUser.profileImage !== '')
				await cloudinary.uploader.destroy(oldUser.profileImage);

			let hashedPassword = oldUser.password;

			if (password !== '')
				hashedPassword = await bcrypt.hash(newPassword || password, 10);

			const updatedUserFields = {
				email,
				firstName,
				lastName,
				password: hashedPassword,
				profileImage,
				profileImageUrl,
			};

			await User.findByIdAndUpdate(req.params.userId, updatedUserFields);

			const updatedUser = await User.findById(req.user._id);

			return res.json({ user: updatedUser.coreDetails });
		} catch (error) {
			return next(error);
		}
	},
];

// TODO
module.exports.deleteUser = [
	body('password')
		.isLength({ min: 8 })
		.withMessage('Minimum length is 8.')
		.matches('[0-9]')
		.withMessage('Must contain a number.')
		.matches('[A-Z]')
		.withMessage('Must contain a capital letter.')
		.optional({ checkFalsy: true }),
	async (req, res, next) => {
		const formErrors = validationResult(req);
		const { password } = req.body;

		if (!formErrors.isEmpty()) {
			res.status(400);
			return res.json({ user: req.body, errors: formErrors.array() });
		}

		try {
			const user = await User.findById(
				req.user._id,
				'password profileImage facebookId backgroundImage'
			);

			if (user.facebookId === '' && !password) {
				res.status(400);
				return res.json({
					user: req.body,
					errors: [
						{
							location: 'body',
							msg: 'Need to enter password to delete account.',
							param: 'password',
							value: password,
						},
					],
				});
			}

			let isPasswordMatching = false;

			if (user.facebookId !== '') isPasswordMatching = true;
			if (user.facebookId === '')
				isPasswordMatching = await bcrypt.compare(password, user.password);

			if (!isPasswordMatching) {
				res.status(400);
				return res.json({
					user: req.body,
					errors: [
						{
							location: 'body',
							msg: 'Incorrect original password.',
							param: 'password',
							value: password,
						},
					],
				});
			}

			// const allPosts = await Post.find({ user: user._id }, 'postImage');
			// const allPostsWithImages = allPosts.filter(
			// 	(post) => post.postImage !== ''
			// );
			// allPostsWithImages.forEach(async (post) => {
			// 	if (fs.existsSync(`./public/images/posts/${post.postImage}`))
			// 		await fsPromises.unlink(`./public/images/posts/${post.postImage}`);
			// });

			// if (
			// 	user.profileImage !== '' &&
			// 	fs.existsSync(`./public/images/users/${user.profileImage}`)
			// )
			// 	await fsPromises.unlink(`./public/images/users/${user.profileImage}`);
			// if (
			// 	user.backgroundImage !== '' &&
			// 	fs.existsSync(`./public/images/users/${user.backgroundImage}`)
			// )
			// 	await fsPromises.unlink(
			// 		`./public/images/users/${user.backgroundImage}`
			// 	);

			await Post.updateMany(
				{
					'comments.user': user._id,
				},
				{ $pull: { comments: { user: user._id } } }
			);
			await Post.updateMany(
				{
					'comments.likes.user': user._id,
				},
				{ $pull: { 'comments.likes.user': { user: user._id } } }
			);
			await Post.updateMany(
				{
					'likes.user': user._id,
				},
				{ $pull: { likes: { user: user._id } } }
			);
			await Post.remove({ user: user._id });
			await User.updateMany(
				{
					'friends.user': user._id,
				},
				{ $pull: { friends: { user: user._id } } }
			);
			await User.remove({ _id: user._id });

			return res.json({ message: 'successful delete' });
		} catch (error) {
			return next(error);
		}
	},
];
