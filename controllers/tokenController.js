const passport = require('passport');
const jwt = require('jsonwebtoken');
const { body } = require('express-validator');
require('dotenv').config();

module.exports.postNewSession = [
	body('email').normalizeEmail(),
	(req, res, next) => {
		passport.authenticate('local', { session: false }, (err, user, info) => {
			if (err) return next(err);
			if (!user) return res.status(400).json({ errors: [info] });

			req.login(user, { session: false }, (error) => {
				if (error) next(error);
			});

			const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);

			return res.json({ user: user.coreDetails, token });
		})(req, res, next);
	},
];

module.exports.postFacebookSession = (req, res) => {
	const { profileImageUrl, email, facebookId, _id, firstName, lastName } =
		req.user;

	res.send({
		user: { profileImageUrl, email, facebookId, _id, firstName, lastName },
	});
};
