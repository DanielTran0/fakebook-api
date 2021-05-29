const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const passportJWT = require('passport-jwt');
const bcrypt = require('bcrypt');
const User = require('../models/userModel');
require('dotenv').config();

const JWTStrategy = passportJWT.Strategy;
const ExtractJWT = passportJWT.ExtractJwt;

passport.use(
	new LocalStrategy(
		{ usernameField: 'email' },
		async (email, password, done) => {
			try {
				const user = await User.findOne({ email });

				if (!user) return done(null, false, { msg: 'Incorrect username' });

				const isPasswordCorrect = await bcrypt.compare(password, user.password);

				if (!isPasswordCorrect)
					return done(null, false, {
						msg: 'Incorrect password (Min Length: 8, 1 Capital Letter, 1 Number)',
					});

				return done(null, user);
			} catch (error) {
				return done(error);
			}
		}
	)
);

passport.use(
	new JWTStrategy(
		{
			jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
			secretOrKey: process.env.JWT_SECRET,
		},
		async (jwtPayload, done) => {
			try {
				const user = await User.findById(jwtPayload._id);

				if (!user) return done(null, false, { message: 'No user' });

				return done(null, user);
			} catch (error) {
				return done(error);
			}
		}
	)
);
