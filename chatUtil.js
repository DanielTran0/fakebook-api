const users = [];

const userJoin = (user) => {
	users.push(user);
};

const userLeave = (id) => {
	const userIndex = users.findIndex((user) => user.id === id);

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
