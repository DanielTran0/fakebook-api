const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const passportJWT = require('passport-jwt');
const FacebookTokenStrategy = require('passport-facebook-token');
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

				if (!user)
					return done(null, false, { msg: 'Email Not Found.', param: 'email' });

				const isPasswordCorrect = await bcrypt.compare(password, user.password);

				if (!isPasswordCorrect)
					return done(null, false, {
						msg: 'Incorrect Password (Min Length: 5, 1 Capital Letter, 1 Number).',
						param: 'password',
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

passport.use(
	new FacebookTokenStrategy(
		{
			clientID: process.env.FACEBOOK_APP_ID,
			clientSecret: process.env.FACEBOOK_APP_SECRET,
			fbGraphVersion: 'v3.0',
		},
		async (accessToken, refreshToken, profile, done) => {
			const {
				id,
				email,
				last_name: lastName,
				first_name: firstName,
			} = profile._json;

			try {
				const userExists = await User.findOne({ facebookId: id });

				if (userExists) return done(null, userExists);

				const newUser = new User({
					email,
					firstName,
					lastName,
					profileImage: 'facebook',
					profileImageUrl: profile.photos[0].value,
					facebookId: id,
				});

				await newUser.save();

				const baseUsers = await User.find({
					$or: [{ isAdmin: true }, { isTest: true }],
				});

				if (baseUsers[0]) {
					await User.findByIdAndUpdate(baseUsers[0]._id, {
						$push: { friends: { user: newUser._id, status: 'friends' } },
					});
					await User.findByIdAndUpdate(newUser._id, {
						$push: { friends: { user: baseUsers[0]._id, status: 'friends' } },
					});
				}
				if (baseUsers[1]) {
					await User.findByIdAndUpdate(baseUsers[1]._id, {
						$push: { friends: { user: newUser._id, status: 'friends' } },
					});
					await User.findByIdAndUpdate(newUser._id, {
						$push: { friends: { user: baseUsers[1]._id, status: 'friends' } },
					});
				}

				return done(null, newUser);
			} catch (error) {
				return done(error);
			}
		}
	)
);
