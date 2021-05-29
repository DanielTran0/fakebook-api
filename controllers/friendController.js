const User = require('../models/userModel');

const getFriendsCoreDetails = (user) => {
	return user.friends.map((friend) => ({
		user: friend.user.coreDetails,
		status: friend.status,
	}));
};

module.exports.getUserFriends = async (req, res, next) => {
	try {
		const user = await User.findById(req.user._id, 'friends').populate(
			'friends.user',
			'email firstName lastName profileImage'
		);

		return res.json({ friends: getFriendsCoreDetails(user) });
	} catch (error) {
		return next(error);
	}
};

module.exports.getAnotherUserFriends = async (req, res, next) => {
	try {
		const user = await User.findById(req.params.userId, 'friends').populate(
			'friends.user',
			'email firstName lastName profileImage'
		);

		return res.json({ friends: getFriendsCoreDetails(user) });
	} catch (error) {
		return next(error);
	}
};

module.exports.postOutgoingRequest = async (req, res, next) => {
	if (req.user._id.equals(req.params.userId)) {
		res.status(400);
		return res.json({
			errors: [{ msg: 'Can not add yourself as a friend' }],
		});
	}

	try {
		const currentUser = await User.findById(req.user._id, 'friends');
		const newUserFriend = await User.findById(req.params.userId, 'friends');

		const pendingRequestOrAlreadyFriends = newUserFriend.friends.some(
			(friend) => friend.user.equals(currentUser._id)
		);

		if (pendingRequestOrAlreadyFriends) {
			res.status(400);
			return res.json({ errors: [{ msg: 'Already friends or pending' }] });
		}

		const outgoingFriendRequest = {
			user: newUserFriend._id,
			status: 'outgoing',
		};
		const incomingFriendRequest = { user: req.user._id, status: 'incoming' };

		currentUser.friends.push(outgoingFriendRequest);
		newUserFriend.friends.push(incomingFriendRequest);

		await newUserFriend.save();
		await currentUser.save();

		const updateCurrentUser = await User.findById(
			req.user._id,
			'friends'
		).populate('friends.user');

		return res.json({
			friends: getFriendsCoreDetails(updateCurrentUser),
		});
	} catch (error) {
		return next(error);
	}
};

module.exports.putAcceptOrRejectFriendRequest = async (req, res, next) => {
	const { option } = req.body;

	if (option !== 'accept' && option !== 'reject') {
		res.status(400);
		return res.json({
			errors: [{ msg: 'Invalid option (accept or reject request)' }],
		});
	}

	try {
		const currentUser = await User.findById(req.user._id, 'friends');
		const requestingUser = await User.findById(req.params.userId, 'friends');

		const currentUserFriendArrayIndex = currentUser.friends.findIndex(
			(friend) => friend.user.equals(requestingUser._id)
		);
		const requestingUserFriendArrayIndex = requestingUser.friends.findIndex(
			(friend) => friend.user.equals(currentUser._id)
		);

		if (currentUserFriendArrayIndex < 0 || requestingUserFriendArrayIndex < 0) {
			res.status(400);
			return res.json({ errors: [{ msg: 'No friend request to begin with' }] });
		}
		if (currentUser.friends[currentUserFriendArrayIndex].status === 'friends') {
			res.status(400);
			return res.json({
				errors: [
					{
						msg: 'Can not accept reject user that is already a friend',
					},
				],
			});
		}
		if (option === 'accept') {
			currentUser.friends[currentUserFriendArrayIndex] = {
				user: requestingUser._id,
				status: 'friends',
			};
			requestingUser.friends[requestingUserFriendArrayIndex] = {
				user: currentUser._id,
				status: 'friends',
			};
		} else {
			currentUser.friends.splice(currentUserFriendArrayIndex, 1);
			requestingUser.friends.splice(requestingUserFriendArrayIndex, 1);
		}

		await currentUser.save();
		await requestingUser.save();

		const updatedUser = await User.findById(req.user._id, 'friends').populate(
			'friends.user',
			'email firstName lastName profileImage'
		);

		return res.json({ friends: getFriendsCoreDetails(updatedUser) });
	} catch (error) {
		return next(error);
	}
};

module.exports.deleteUserFriendOrRequest = async (req, res, next) => {
	try {
		const currentUser = await User.findById(req.user._id, 'friends');
		const friendUser = await User.findById(req.params.userId, 'friends');

		const currentUserFriendArrayIndex = currentUser.friends.findIndex(
			(friend) => friend.user.equals(friendUser._id)
		);
		const friendUserFriendArrayIndex = friendUser.friends.findIndex((friend) =>
			friend.user.equals(currentUser._id)
		);

		if (currentUserFriendArrayIndex < 0 || friendUserFriendArrayIndex < 0) {
			res.status(400);
			return res.json({
				errors: { msg: 'That user is already not a friend' },
			});
		}

		currentUser.friends.splice(currentUserFriendArrayIndex, 1);
		friendUser.friends.splice(friendUserFriendArrayIndex, 1);

		await currentUser.save();
		await friendUser.save();

		const updatedUser = await User.findById(req.user._id, 'friends').populate(
			'friends.user',
			'email firstName lastName profileImage'
		);

		return res.json({ friends: getFriendsCoreDetails(updatedUser) });
	} catch (error) {
		return next(error);
	}
};
