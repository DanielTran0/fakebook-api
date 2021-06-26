const { body, validationResult } = require('express-validator');
const validator = require('validator');
const Post = require('../models/postModel');

const decodeAllComments = (commentsArray) => {
	if (commentsArray === 0) return [];
	return commentsArray.map((comment) => ({
		_id: comment._id,
		user: comment.user,
		text: validator.unescape(comment.text),
		date: comment.date,
		likes: comment.likes,
	}));
};

module.exports.postComment = [
	body('text', 'Minimum length is 1').trim().isLength({ min: 1 }).escape(),
	async (req, res, next) => {
		const formErrors = validationResult(req);
		const { text } = req.body;

		if (!formErrors.isEmpty()) {
			res.status(400);
			return res.json({ comment: req.body, errors: formErrors.array() });
		}

		try {
			const post = await Post.findById(req.params.postId, 'comments');
			post.comments.push({ text, user: req.user._id });

			await post.save();

			const updatedPost = await Post.findById(
				req.params.postId,
				'comments'
			).populate('comments.user', 'firstName lastName profileImageUrl');

			return res.json({
				post: {
					_id: post._id,
					comments: decodeAllComments(updatedPost.comments),
				},
			});
		} catch (error) {
			return next(error);
		}
	},
];

module.exports.putChangeComment = [
	body('text', 'Minimum length is 1.').trim().isLength({ min: 1 }).escape(),
	body('postId', 'Post id is required.').trim().escape().not().isEmpty(),
	async (req, res, next) => {
		const formErrors = validationResult(req);
		const { text, postId } = req.body;

		if (!formErrors.isEmpty()) {
			res.status(400);
			return res.json({ comment: req.body, errors: formErrors.array() });
		}

		try {
			const post = await Post.findById(postId, 'comments');

			const postCommentIndex = post.comments.findIndex((comment) =>
				comment._id.equals(req.params.commentId)
			);

			if (postCommentIndex < 0) {
				res.status(400);
				return res.json({
					errors: [
						{ msg: 'Could not find comment to edit.', param: 'general' },
					],
				});
			}
			if (!post.comments[postCommentIndex].user.equals(req.user._id)) {
				res.status(400);
				return res.json({
					errors: [
						{
							msg: 'Only user who made the comment can edit it.',
							param: 'general',
						},
					],
				});
			}

			post.comments[postCommentIndex] = {
				text,
				user: req.user._id,
				date: post.comments[postCommentIndex].date,
			};

			await post.save();

			const updatedPost = await Post.findById(postId, 'comments').populate(
				'comments.user',
				'firstName lastName profileImageUrl'
			);

			return res.json({
				post: {
					_id: updatedPost._id,
					comments: decodeAllComments(updatedPost.comments),
				},
			});
		} catch (error) {
			return next(error);
		}
	},
];

module.exports.deleteComment = [
	body('postId', 'Post id is required').trim().escape().not().isEmpty(),
	async (req, res, next) => {
		const formErrors = validationResult(req);
		const { postId } = req.body;

		if (!formErrors.isEmpty()) {
			res.status(400);
			return res.json({ postId, errors: formErrors.array() });
		}

		try {
			const post = await Post.findById(postId, 'comments').populate(
				'comments.user',
				'firstName lastName profileImageUrl'
			);

			const postCommentIndex = post.comments.findIndex((comment) =>
				comment._id.equals(req.params.commentId)
			);

			if (postCommentIndex < 0) {
				res.status(400);
				return res.json({
					errors: [
						{ msg: 'Could not find comment to delete.', param: 'general' },
					],
				});
			}
			if (!post.comments[postCommentIndex].user.equals(req.user._id)) {
				res.status(400);
				return res.json({
					errors: [
						{
							msg: 'Only user who made the comment can delete it.',
							param: 'general',
						},
					],
				});
			}

			post.comments.splice(postCommentIndex, 1);
			await post.save();

			return res.json({
				post: { _id: post._id, comments: decodeAllComments(post.comments) },
			});
		} catch (error) {
			return next(error);
		}
	},
];
