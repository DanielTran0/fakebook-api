const passport = require('passport');

const authenticateRoute = passport.authenticate(['jwt', 'facebook-token'], {
	session: false,
});

module.exports = authenticateRoute;
