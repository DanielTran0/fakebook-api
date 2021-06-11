const { body, validationResult } = require('express-validator');
const fsPromises = require('fs/promises');
const fs = require('fs');
const decode = require('unescape');
const Post = require('../models/postModel');
const User = require('../models/userModel');
const upload = require('../configs/multerConfig');

const getPostCoreDetails = (postsArray) => {
	if (postsArray.length === 0) return [];
	return postsArray.map((post) => post.coreDetails);
};

const decodePostsText = (postsArray) => {
	if (postsArray.length === 0) return [];
	return postsArray.map((post) => ({ ...post, text: decode(post.text) }));
};

module.exports.getAllPosts = async (req, res, next) => {
	try {
		const user = await User.findById(req.user._id, 'friends');
		const userAcceptedFriends = user.friends.filter(
			(friend) => friend.status === 'friends'
		);
		const friendIds = userAcceptedFriends.map((friend) => friend.user);
		friendIds.push(user._id);

		const posts = await Post.find({ user: { $in: friendIds } })
			.limit(10)
			.sort({ date: 'desc' })
			.populate('user', 'firstName lastName profileImage')
			.populate('comments.user', 'firstName lastName profileImage')
			.populate('likes.user', 'firstName lastName');

		return res.json({ posts: decodePostsText(getPostCoreDetails(posts)) });
	} catch (error) {
		return next(error);
	}
};

module.exports.getPost = async (req, res, next) => {
	try {
		const posts = await Post.find({ user: req.params.userId })
			.sort({ date: 'desc' })

			.populate('user', 'firstName lastName profileImage')
			.populate('comments.user', 'firstName lastName profileImage')
			.populate('likes.user', 'firstName lastName');

		return res.json({ posts: decodePostsText(getPostCoreDetails(posts)) });
	} catch (error) {
		return next(error);
	}
};

module.exports.postCreatedPost = [
	(req, res, next) => {
		upload('postImage')(req, res, (err) => {
			if (err) {
				res.status(400);
				return res.json({ errors: [err] });
			}

			return next();
		});
	},
	body('text', 'Minimum length is 2').trim().isLength({ min: 2 }).escape(),
	async (req, res, next) => {
		const formErrors = validationResult(req);
		const { text } = req.body;
		try {
			if (!formErrors.isEmpty()) {
				if (req.file && fs.existsSync(req.file.path))
					await fsPromises.unlink(req.file.path);

				res.status(400);
				return res.json({ post: req.body, errors: formErrors.array() });
			}

			const post = new Post({
				text,
				user: req.user._id,
				postImage: req.file?.filename || '',
				likes: [],
				comments: [],
			});

			await post.save();

			return res.json({
				post: { ...post.coreDetails, text: decode(post.text) },
			});
		} catch (error) {
			return next(error);
		}
	},
];

module.exports.putUpdatePost = [
	(req, res, next) => {
		upload('postImage')(req, res, (err) => {
			if (err) {
				res.status(400);
				return res.json({ errors: [err] });
			}

			return next();
		});
	},
	body('text', 'Minimum length is 2').trim().isLength({ min: 2 }).escape(),
	body('lastImage').trim().escape().optional({ nullable: true }),
	async (req, res, next) => {
		const formErrors = validationResult(req);
		const { text, lastImage } = req.body;

		try {
			if (!formErrors.isEmpty()) {
				if (req.file && fs.existsSync(req.file.path))
					await fsPromises.unlink(req.file.path);

				res.status(400);
				return res.json({ post: req.body, errors: formErrors.array() });
			}

			const oldPost = await Post.findById(req.params.postId, 'user postImage');

			if (!oldPost.user.equals(req.user._id)) {
				if (req.file && fs.existsSync(req.file.path))
					await fsPromises.unlink(req.file.path);

				res.status(400);
				return res.json({
					errors: [
						{
							msg: "You can not edit another user's post",
						},
					],
				});
			}

			let postImage = '';

			if (lastImage === 'keep') postImage = oldPost.postImage;
			if (req.file) postImage = req.file.filename;
			if (
				req.file &&
				oldPost.postImage !== '' &&
				fs.existsSync(`./public/images/posts/${oldPost.postImage}`)
			)
				await fsPromises.unlink(`./public/images/posts/${oldPost.postImage}`);

			const updatedPostFields = {
				text,
				postImage,
			};

			await Post.findByIdAndUpdate(req.params.postId, updatedPostFields);

			const updatedPost = await Post.findById(req.params.postId)
				.populate('user', 'firstName lastName profileImage')
				.populate('comments.user', 'firstName lastName profileImage')
				.populate('likes.user', 'firstName lastName');

			return res.json({
				post: { ...updatedPost.coreDetails, text: decode(updatedPost.text) },
			});
		} catch (error) {
			return next(error);
		}
	},
];

module.exports.deletePost = async (req, res, next) => {
	try {
		const oldPost = await Post.findById(req.params.postId);

		if (!oldPost) {
			res.status(400);
			return res.json({
				errors: [{ msg: 'There is no post to delete' }],
			});
		}

		if (!oldPost.user.equals(req.user._id)) {
			res.status(400);
			return res.json({
				errors: [{ msg: 'Need to be message creator to delete message' }],
			});
		}

		if (
			oldPost.postImage !== '' &&
			fs.existsSync(`./public/images/posts/${oldPost.postImage}`)
		)
			await fsPromises.unlink(`./public/images/posts/${oldPost.postImage}`);

		await Post.findByIdAndDelete(req.params.postId);

		const updatedPosts = await Post.find({ user: req.user._id });

		return res.json({
			posts: decodePostsText(getPostCoreDetails(updatedPosts)),
		});
	} catch (error) {
		return next(error);
	}
};
