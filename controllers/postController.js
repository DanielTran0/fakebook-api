const { body, validationResult } = require('express-validator');
const validator = require('validator');

const { streamUpload, cloudinary } = require('../configs/cloudinaryConfig');
const upload = require('../configs/multerConfig');
const Post = require('../models/postModel');
const User = require('../models/userModel');

const getPostCoreDetails = (postsArray) => {
	if (postsArray.length === 0) return [];
	return postsArray.map((post) => post.coreDetails);
};

const decodePostComments = (commentsArray) => {
	return commentsArray.map((comment) => {
		return {
			_id: comment.id,
			text: validator.unescape(comment.text),
			user: comment.user,
			date: comment.date,
			likes: comment.likes,
		};
	});
};

const decodePostsText = (postsArray) => {
	if (postsArray.length === 0) return [];
	return postsArray.map((post) => ({
		...post,
		text: validator.unescape(post.text),
		comments: decodePostComments(post.comments),
	}));
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
			.skip(Number(req.query.skip))
			.populate('user', 'firstName lastName profileImageUrl')
			.populate('comments.user', 'firstName lastName profileImageUrl')
			.populate('likes.user', 'firstName lastName');

		return res.json({ posts: decodePostsText(getPostCoreDetails(posts)) });
	} catch (error) {
		return next(error);
	}
};

// TODO skip
module.exports.getPost = async (req, res, next) => {
	try {
		const posts = await Post.find({ user: req.params.userId })
			.sort({ date: 'desc' })
			.limit(10)
			.populate('user', 'firstName lastName profileImageUrl')
			.populate('comments.user', 'firstName lastName profileImageUrl')
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
				return res.json({ errors: [{ ...err, param: 'general' }] });
			}

			return next();
		});
	},
	body('text').trim().escape().optional({ nullable: true }),
	async (req, res, next) => {
		const formErrors = validationResult(req);
		const {
			file,
			user,
			body: { text },
		} = req;

		if (!formErrors.isEmpty()) {
			res.status(400);
			return res.json({ post: req.body, errors: formErrors.array() });
		}
		if (!file && !text) {
			res.status(400);
			return res.json({
				errors: [
					{
						msg: 'Need either text or an image to create a post.',
						param: 'general',
					},
				],
			});
		}

		try {
			let cloudinaryResponse = null;

			if (file) cloudinaryResponse = await streamUpload(req);

			const post = new Post({
				text,
				user: user._id,
				postImage: cloudinaryResponse?.public_id || '',
				postImageUrl: cloudinaryResponse?.secure_url || '',
			});

			await post.save();

			const newPost = await Post.findById(post._id).populate(
				'user',
				'firstName lastName profileImageUrl'
			);

			return res.json({
				post: {
					...newPost.coreDetails,
					text: validator.unescape(newPost.text),
				},
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
				return res.json({ errors: [{ ...err, param: 'general' }] });
			}

			return next();
		});
	},
	body('text').trim().escape().optional({ nullable: true }),
	body('lastImage').trim().escape().optional({ nullable: true }),
	async (req, res, next) => {
		const formErrors = validationResult(req);
		const {
			file,
			user,
			body: { text, lastImage },
		} = req;

		if (!formErrors.isEmpty()) {
			res.status(400);
			return res.json({ post: req.body, errors: formErrors.array() });
		}

		try {
			const oldPost = await Post.findById(
				req.params.postId,
				'user postImage postImageUrl'
			);
			const { postImage, postImageUrl, user: postUser } = oldPost;

			if (
				(!text && !file && !postImage) ||
				(!text && !file && postImage && lastImage !== 'keep')
			) {
				res.status(400);
				return res.json({
					errors: [
						{
							msg: 'Need either text or an image to edit post.',
							param: 'general',
						},
					],
				});
			}
			if (!postUser.equals(user._id)) {
				res.status(400);
				return res.json({
					errors: [
						{
							msg: "You can not edit another user's post.",
							param: 'general',
						},
					],
				});
			}

			let cloudinaryResponse = null;
			let newPostImage = '';
			let newPostImageUrl = '';

			if (lastImage === 'keep') {
				newPostImage = postImage;
				newPostImageUrl = postImageUrl;
			}
			if (file) {
				cloudinaryResponse = await streamUpload(req);
				newPostImage = cloudinaryResponse.public_id;
				newPostImageUrl = cloudinaryResponse.secure_url;
			}
			if ((file || lastImage !== 'keep') && postImage !== '')
				await cloudinary.uploader.destroy(postImage);

			const updatedPostFields = {
				text,
				postImage: newPostImage,
				postImageUrl: newPostImageUrl,
			};

			await Post.findByIdAndUpdate(req.params.postId, updatedPostFields);

			const updatedPost = await Post.findById(req.params.postId)
				.populate('user', 'firstName lastName profileImageUrl')
				.populate('comments.user', 'firstName lastName profileImageUrl')
				.populate('likes.user', 'firstName lastName');

			return res.json({
				post: {
					...updatedPost.coreDetails,
					text: validator.unescape(updatedPost.text),
				},
			});
		} catch (error) {
			return next(error);
		}
	},
];

module.exports.deletePost = async (req, res, next) => {
	try {
		const oldPost = await Post.findById(req.params.postId);
		const { postImage, user: postUser } = oldPost;

		if (!oldPost) {
			res.status(400);
			return res.json({
				errors: [{ msg: 'There is no post to delete.', param: 'general' }],
			});
		}
		if (!postUser.equals(req.user._id)) {
			res.status(400);
			return res.json({
				errors: [
					{
						msg: 'Need to be message creator to delete message.',
						param: 'general',
					},
				],
			});
		}
		if (postImage !== '') await cloudinary.uploader.destroy(postImage);

		await Post.findByIdAndDelete(req.params.postId);

		const updatedPosts = await Post.find({ user: req.user._id });

		return res.json({
			posts: decodePostsText(getPostCoreDetails(updatedPosts)),
		});
	} catch (error) {
		return next(error);
	}
};
