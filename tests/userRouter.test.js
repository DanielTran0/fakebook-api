const request = require('supertest');
const app = require('../configs/appConfig');
const userRouter = require('../routes/userRouter');
const sessionRouter = require('../routes/sessionRouter');
const { dbConnect, dbDisconnect } = require('../configs/mongoTestingConfig');
const userData = require('./userData');
require('../configs/passportStrategyConfig');

const { sampleUser1, sampleUser3, passwordConfirmation } = userData;
const { friends, password, ...otherFields } = sampleUser1;
const { friends: friends3, password: password3, ...otherFields3 } = sampleUser3;

app.use('/users', userRouter);
app.use('/session', sessionRouter);

beforeAll(async () => {
	try {
		await dbConnect();
		await request(app)
			.post('/users')
			.send({ ...sampleUser1, passwordConfirmation });
	} catch (error) {
		console.log(error);
	}
});

afterAll(() => {
	dbDisconnect();
});

describe('GET all users', () => {
	test('receive array of users', async () => {
		const tokenData = await request(app).post('/session').send({
			email: sampleUser1.email,
			password: sampleUser1.password,
		});
		const data = await request(app)
			.get('/users')
			.set('Authorization', `Bearer ${tokenData.body.token}`);

		expect(data.body).toEqual({
			users: [
				{
					...otherFields,
					_id: data.body.users[0]?._id,
				},
			],
		});
	});
});

describe('GET a single user', () => {
	test('receive a particular user', async () => {
		const tokenData = await request(app).post('/session').send({
			email: sampleUser1.email,
			password: sampleUser1.password,
		});
		const users = await request(app)
			.get('/users')
			.set('Authorization', `Bearer ${tokenData.body.token}`);
		const data = await request(app)
			.get(`/users/${users.body.users[0]?._id}`)
			.set('Authorization', `Bearer ${tokenData.body.token}`);

		expect(data.body).toEqual({
			user: {
				...otherFields,
				_id: data.body.user?._id,
			},
		});
	});
});

describe('Post created user', () => {
	describe('succuss', () => {
		test('received user back with id', async () => {
			const data = await request(app)
				.post('/users')
				.send({ ...sampleUser3, passwordConfirmation });

			expect(data.body).toEqual({
				user: {
					...otherFields3,
					_id: data.body.user?._id,
				},
			});
		});

		test('check if user is saved in db', async () => {
			const tokenData = await request(app).post('/session').send({
				email: sampleUser1.email,
				password: sampleUser1.password,
			});
			const data = await request(app)
				.get('/users')
				.set('Authorization', `Bearer ${tokenData.body.token}`);

			expect(data.body).toEqual({
				users: [
					{
						...otherFields,
						_id: data.body.users[0]._id,
					},

					{
						...otherFields3,
						_id: data.body.users[1]._id,
					},
				],
			});
		});
	});

	describe('fail', () => {
		test('incorrect email', async () => {
			const data = await request(app)
				.post('/users')
				.send({
					...userData.incorrectEmail,
					passwordConfirmation,
				});
			expect(data.body).toEqual({
				user: {
					...userData.incorrectEmail,
					email: '@',
					passwordConfirmation,
				},
				errors: [
					{
						location: 'body',
						msg: 'Invalid email format',
						param: 'email',
						value: '',
					},
				],
			});
		});

		test('incorrect first name', async () => {
			const data = await request(app)
				.post('/users')
				.send({
					...userData.incorrectFirstName,
					passwordConfirmation,
				});
			expect(data.body).toEqual({
				user: {
					...userData.incorrectFirstName,
					passwordConfirmation,
				},
				errors: [
					{
						location: 'body',
						msg: 'Minimum length of 2',
						param: 'firstName',
						value: '1',
					},
					{
						location: 'body',
						msg: 'Contains non-alphabetical characters',
						param: 'firstName',
						value: '1',
					},
				],
			});
		});

		test('incorrect last name', async () => {
			const data = await request(app)
				.post('/users')
				.send({
					...userData.incorrectLastName,
					passwordConfirmation,
				});
			expect(data.body).toEqual({
				user: {
					...userData.incorrectLastName,
					passwordConfirmation,
				},
				errors: [
					{
						location: 'body',
						msg: 'Minimum length of 2',
						param: 'lastName',
						value: '1',
					},
					{
						location: 'body',
						msg: 'Contains non-alphabetical characters',
						param: 'lastName',
						value: '1',
					},
				],
			});
		});

		test('incorrect password', async () => {
			const data = await request(app)
				.post('/users')
				.send({
					...userData.incorrectPassword,
					passwordConfirmation: '',
				});
			expect(data.body).toEqual({
				user: {
					...userData.incorrectPassword,
					passwordConfirmation: '',
				},
				errors: [
					{
						location: 'body',
						msg: 'Minimum length is 8',
						param: 'password',
						value: '',
					},
					{
						location: 'body',
						msg: 'Must contain a number',
						param: 'password',
						value: '',
					},
					{
						location: 'body',
						msg: 'Must contain a capital letter',
						param: 'password',
						value: '',
					},
				],
			});
		});

		test('incorrect password confirmation', async () => {
			const data = await request(app)
				.post('/users')
				.send({
					...userData.incorrectPasswordConfirmation,
					passwordConfirmation: 'passwordd123',
				});
			expect(data.body).toEqual({
				user: {
					...userData.incorrectPasswordConfirmation,
					passwordConfirmation: 'passwordd123',
				},
				errors: [
					{
						location: 'body',
						msg: 'Must be identical to password',
						param: 'passwordConfirmation',
						value: 'passwordd123',
					},
				],
			});
		});

		test('used email that is taken', async () => {
			const data = await request(app)
				.post('/users')
				.send({
					...sampleUser1,
					passwordConfirmation,
				});
			expect(data.body).toEqual({
				user: {
					...sampleUser1,
					passwordConfirmation,
				},
				errors: [
					{
						location: 'body',
						msg: 'Email is already taken',
						param: 'email',
						value: sampleUser1.email,
					},
				],
			});
		});
	});
});

describe('PUT update a user', () => {
	describe('succuss', () => {
		test('change detail and add image, receive updated user', async () => {
			const user1 = await request(app).post('/session').send({
				email: sampleUser1.email,
				password: sampleUser1.password,
			});
			const result = await request(app)
				.put(`/users/${user1.body.user?._id}`)
				.field({
					...sampleUser1,
					firstName: 'Daniel',
					lastName: 'Tran',
				})
				.attach('userImage', './tests/test-image1.jpg')
				.set('Authorization', `Bearer ${user1.body.token}`);

			expect(result.body).toEqual({
				user: {
					...otherFields,
					firstName: 'Daniel',
					lastName: 'Tran',
					_id: result.body?.user?._id,
					profileImage: result.body?.user?.profileImage,
				},
			});
		});

		test('change detail but keep last used image, receive updated user', async () => {
			const user1 = await request(app).post('/session').send({
				email: sampleUser1.email,
				password: sampleUser1.password,
			});
			const result = await request(app)
				.put(`/users/${user1.body.user?._id}`)
				.field({
					...sampleUser1,
					lastImage: 'keep',
				})
				.set('Authorization', `Bearer ${user1.body.token}`);

			expect(result.body).toEqual({
				user: {
					...otherFields,
					_id: result.body?.user?._id,
					profileImage: result.body?.user?.profileImage,
				},
			});
		});

		test('change detail use new image, receive updated user', async () => {
			const user1 = await request(app).post('/session').send({
				email: sampleUser1.email,
				password: sampleUser1.password,
			});
			const result = await request(app)
				.put(`/users/${user1.body.user?._id}`)
				.field({
					...sampleUser1,
					lastImage: '',
				})
				.attach('userImage', './tests/test-image2.jpg')
				.set('Authorization', `Bearer ${user1.body.token}`);

			expect(result.body).toEqual({
				user: {
					...otherFields,
					_id: result.body?.user?._id,
					profileImage: result.body?.user?.profileImage,
				},
			});
		});

		test('change detail and remove image, receive updated user', async () => {
			const user1 = await request(app).post('/session').send({
				email: sampleUser1.email,
				password: sampleUser1.password,
			});
			const result = await request(app)
				.put(`/users/${user1.body.user?._id}`)
				.field({
					...sampleUser1,
					email: 'hello@hotmail.com',
					lastImage: '',
				})
				.set('Authorization', `Bearer ${user1.body.token}`);

			expect(result.body).toEqual({
				user: {
					...otherFields,
					email: 'hello@hotmail.com',
					_id: result.body?.user?._id,
					profileImage: '',
				},
			});
		});

		test('change password then change email', async () => {
			const user3 = await request(app).post('/session').send({
				email: sampleUser3.email,
				password: sampleUser3.password,
			});
			await request(app)
				.put(`/users/${user3.body.user?._id}`)
				.field({
					...sampleUser3,
					newPassword: 'Dog12345',
					newPasswordConfirmation: 'Dog12345',
				})
				.set('Authorization', `Bearer ${user3.body.token}`);
			const result = await request(app)
				.put(`/users/${user3.body.user?._id}`)
				.field({
					...sampleUser3,
					password: 'Dog12345',
					email: 'sad@live.ca',
				})
				.set('Authorization', `Bearer ${user3.body.token}`);

			expect(result.body).toEqual({
				user: {
					...otherFields3,
					email: 'sad@live.ca',
					_id: result.body?.user?._id,
				},
			});
		});
	});

	describe('fail', () => {
		test('wrong name length', async () => {
			const user3 = await request(app).post('/session').send({
				email: 'sad@live.ca',
				password: 'Dog12345',
			});

			const result = await request(app)
				.put(`/users/${user3.body.user?._id}`)
				.field({
					...sampleUser3,
					firstName: 'a',
				})
				.set('Authorization', `Bearer ${user3.body.token}`);

			expect(result.body).toEqual({
				user: { ...otherFields3, password: password3, firstName: 'a' },
				errors: [
					{
						location: 'body',
						msg: 'Minimum length of 2',
						param: 'firstName',
						value: 'a',
					},
				],
			});
		});

		test('cannot edit another users profile', async () => {
			const user1 = await request(app).post('/session').send({
				email: 'hello@hotmail.com',
				password: sampleUser1.password,
			});
			const users = await request(app)
				.get('/users')
				.set('Authorization', `Bearer ${user1.body.token}`);
			const result = await request(app)
				.put(`/users/${users.body.users[1]?._id}`)
				.field({
					...sampleUser1,
				})
				.set('Authorization', `Bearer ${user1.body.token}`);

			expect(result.body).toEqual({
				errors: [
					{
						msg: "You can not edit another user's profile",
					},
				],
			});
		});
	});
});
