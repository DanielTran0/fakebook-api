const { body, validationResult } = require('express-validator');
const Post = require('../models/postModel');

module.exports.putChangeLikeOnPost = async (req, res, next) => {
	try {
		const post = await Post.findById(req.params.postId, 'likes').populate(
			'likes.user',
			'firstName lastName'
		);
		const likedPostIndex = post.likes.findIndex((like) =>
			like.user.equals(req.user._id)
		);

		if (likedPostIndex > -1) {
			post.likes.splice(likedPostIndex, 1);
			post.save();

			return res.json({ post: { _id: post._id, likes: post.likes } });
		}

		post.likes.push({ user: req.user._id });
		await post.save();

		const updatedPost = await Post.findById(
			req.params.postId,
			'likes'
		).populate('likes.user', 'firstName lastName');

		return res.json({
			post: { _id: updatedPost._id, likes: updatedPost.likes },
		});
	} catch (error) {
		return next(error);
	}
};

module.exports.putChangeLikeOnComment = [
	body('postId', 'Post id is required').trim().escape().not().isEmpty(),
	async (req, res, next) => {
		const formErrors = validationResult(req);
		const { postId } = req.body;

		if (!formErrors.isEmpty()) {
			res.status(400);
			return res.json({ errors: formErrors.array() });
		}

		try {
			const post = await Post.findById(postId, 'comments');

			const commentIndex = post.comments.findIndex((comment) =>
				comment._id.equals(req.params.commentId)
			);

			if (commentIndex <= -1) {
				res.status(400);
				return res.json({
					errors: [
						{
							msg: 'Could not find comment on post to like.',
							param: 'general',
						},
					],
				});
			}

			const likedCommentIndex = post.comments[commentIndex].likes.findIndex(
				(like) => like.user.equals(req.user._id)
			);

			if (likedCommentIndex > -1) {
				post.comments[commentIndex].likes.splice(likedCommentIndex, 1);
				post.save();

				return res.json({
					comment: {
						likes: post.comments[commentIndex].likes,
					},
				});
			}

			post.comments[commentIndex].likes.push({ user: req.user._id });
			await post.save();

			const updatedPost = await Post.findById(postId, 'comments');

			return res.json({
				comment: {
					likes: updatedPost.comments[commentIndex].likes,
				},
			});
		} catch (error) {
			return next(error);
		}
	},
];
