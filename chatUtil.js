const users = [];

const userJoin = (user) => {
	users.push(user);
};

const userLeave = (chatId) => {
	const userIndex = users.findIndex((user) => user.chatId === chatId);

	if (userIndex === -1) return null;

	return users.splice(userIndex, 1);
};

const getAllUsers = () => {
	return users;
};

module.exports = {
	userJoin,
	userLeave,
	getAllUsers,
};
