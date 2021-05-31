const Post = require('../models/postModel');

module.exports.putChangeLikeOnPost = async (req, res, next) => {
	try {
		const post = await Post.findById(req.params.postId, 'likes');

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

		return res.json({ post: { _id: post._id, likes: post.likes } });
	} catch (error) {
		return next(error);
	}
};
