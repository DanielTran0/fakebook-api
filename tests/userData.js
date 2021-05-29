// correct users
const sampleUser1 = {
	email: 'dan@live.ca',
	password: 'passworD123',
	firstName: 'Dan',
	lastName: 'Man',
	profileImage: '',
	friends: [],
};
const sampleUser2 = {
	email: 'sam@live.ca',
	password: 'passworD123',
	firstName: 'Sam',
	lastName: 'Bad',
	profileImage: '',
	friends: [],
};
const sampleUser3 = {
	email: 'kim@live.ca',
	password: 'passworD123',
	firstName: 'Kim',
	lastName: 'Loud',
	profileImage: '',
	friends: [],
};

// incorrect users
const incorrectEmail = {
	email: '',
	password: 'passworD123',
	firstName: 'Adam',
	lastName: 'Live',
	profileImage: '',
	friends: [],
};
const incorrectFirstName = {
	email: 'adam@live.ca',
	password: 'passworD123',
	firstName: '1',
	lastName: 'Live',
	profileImage: '',
	friends: [],
};
const incorrectLastName = {
	email: 'adam@live.ca',
	password: 'passworD123',
	firstName: 'Adam',
	lastName: '1',
	profileImage: '',
	friends: [],
};
const incorrectPassword = {
	email: 'adam@live.ca',
	password: '',
	firstName: 'Adam',
	lastName: 'Live',
	profileImage: '',
	friends: [],
};
const incorrectPasswordConfirmation = {
	email: 'adam@live.ca',
	password: 'passworD123',
	firstName: 'Adam',
	lastName: 'Live',
	profileImage: '',
	friends: [],
};

module.exports = {
	sampleUser1,
	sampleUser2,
	sampleUser3,
	incorrectEmail,
	incorrectFirstName,
	incorrectLastName,
	incorrectPassword,
	incorrectPasswordConfirmation,
	passwordConfirmation: 'passworD123',
};
