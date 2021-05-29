const { body, validationResult } = require('express-validator');
const Post = require('../models/postModel');

module.exports.getAllPosts = (req, res, next) => {
	try {
		return res.json();
	} catch (error) {
		return next(error);
	}
};

module.exports.getPost = (req, res, next) => {
	try {
		return res.json();
	} catch (error) {
		return next(error);
	}
};

module.exports.postCreatedPost = (req, res, next) => {
	try {
		return res.json();
	} catch (error) {
		return next(error);
	}
};

module.exports.putUpdatePost = (req, res, next) => {
	try {
		return res.json();
	} catch (error) {
		return next(error);
	}
};

module.exports.putDeletePost = (req, res, next) => {
	try {
		return res.json();
	} catch (error) {
		return next(error);
	}
};
