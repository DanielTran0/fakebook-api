const request = require('supertest');
const app = require('../configs/appConfig');
const userRouter = require('../routes/userRouter');
const sessionRouter = require('../routes/sessionRouter');
const { dbConnect, dbDisconnect } = require('../configs/mongoTestingConfig');
const userData = require('./userData');
require('../configs/passportStrategyConfig');

const { sampleUser1, sampleUser2, sampleUser3, passwordConfirmation } =
	userData;

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
	test('status  200', async () => {
		const tokenData = await request(app).post('/session').send({
			email: sampleUser1.email,
			password: sampleUser1.password,
		});
		const data = await request(app)
			.get('/users')
			.set('Authorization', `Bearer ${tokenData.body.token}`);

		expect(data.status).toEqual(200);
	});

	test('receive array of users', async () => {
		const tokenData = await request(app).post('/session').send({
			email: sampleUser1.email,
			password: sampleUser1.password,
		});
		const data = await request(app)
			.get('/users')
			.set('Authorization', `Bearer ${tokenData.body.token}`);
		const { friends, password, ...otherFields } = sampleUser1;

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
	test('status 200', async () => {
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

		expect(data.status).toEqual(200);
	});

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
		const { friends, password, ...otherFields } = sampleUser1;

		expect(data.body).toEqual({
			user: {
				...otherFields,
				_id: data.body.user?._id,
			},
		});
	});
});

describe('Post created user', () => {
	describe('all fields filled correctly', () => {
		test('status  200', async () => {
			const data = await request(app)
				.post('/users')
				.send({ ...sampleUser2, passwordConfirmation });

			expect(data.status).toEqual(200);
		});

		test('received user back with id', async () => {
			const data = await request(app)
				.post('/users')
				.send({ ...sampleUser3, passwordConfirmation });
			const { friends, password, ...otherFields } = sampleUser3;

			expect(data.body).toEqual({
				user: {
					...otherFields,
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
			const { friends, password, ...otherFields1 } = sampleUser1;
			const {
				friends: friends2,
				password: password2,
				...otherFields2
			} = sampleUser2;
			const {
				friends: friends3,
				password: password3,
				...otherFields3
			} = sampleUser3;

			expect(data.body).toEqual({
				users: [
					{
						...otherFields1,
						_id: data.body.users[0]._id,
					},
					{
						...otherFields2,
						_id: data.body.users[1]._id,
					},
					{
						...otherFields3,
						_id: data.body.users[2]._id,
					},
				],
			});
		});
	});

	describe('incorrect fields', () => {
		test('any mistake status 400', async () => {
			const data = await request(app)
				.post('/users')
				.send({
					...userData.incorrectEmail,
					passwordConfirmation,
				});
			expect(data.statusCode).toEqual(400);
		});

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
	describe('same user', () => {
		describe('correct fields', () => {
			test('status 200', async () => {
				const tokenData = await request(app).post('/session').send({
					email: sampleUser1.email,
					password: sampleUser1.password,
				});

				const data = await request(app)
					.put(`/users/${tokenData.body.user?._id}`)
					.send({
						...sampleUser1,
						firstName: 'Daniel',
					})
					.set('Authorization', `Bearer ${tokenData.body.token}`);
				expect(data.status).toEqual(200);
			});

			test('receive updated user', async () => {
				const tokenData = await request(app).post('/session').send({
					email: sampleUser1.email,
					password: sampleUser1.password,
				});
				const data = await request(app)
					.put(`/users/${tokenData.body.user?._id}`)
					.send({
						...sampleUser1,
						lastName: 'Tran',
					})
					.set('Authorization', `Bearer ${tokenData.body.token}`);
				const { friends, password, ...otherFields } = sampleUser1;

				expect(data.body).toEqual({
					user: { ...otherFields, lastName: 'Tran', _id: data.body?.user?._id },
				});
			});

			test('updated user is saved', async () => {
				const tokenData = await request(app).post('/session').send({
					email: sampleUser1.email,
					password: sampleUser1.password,
				});
				const data = await request(app)
					.get(`/users/${tokenData.body.user?._id}`)
					.set('Authorization', `Bearer ${tokenData.body.token}`);
				const { friends, password, ...otherFields } = sampleUser1;

				expect(data.body).toEqual({
					user: { ...otherFields, lastName: 'Tran', _id: data.body?.user?._id },
				});
			});

			test('change password then change email', async () => {
				const tokenData = await request(app).post('/session').send({
					email: sampleUser1.email,
					password: sampleUser1.password,
				});
				await request(app)
					.put(`/users/${tokenData.body.user?._id}`)
					.send({
						...sampleUser1,
						newPassword: 'Dog12345',
						newPasswordConfirmation: 'Dog12345',
					})
					.set('Authorization', `Bearer ${tokenData.body.token}`);
				const data = await request(app)
					.put(`/users/${tokenData.body.user?._id}`)
					.send({
						...sampleUser1,
						password: 'Dog12345',
						email: 'sad@live.ca',
					})
					.set('Authorization', `Bearer ${tokenData.body.token}`);
				const { friends, password, ...otherFields } = sampleUser1;

				expect(data.body).toEqual({
					user: {
						...otherFields,
						email: 'sad@live.ca',
						_id: data.body?.user?._id,
					},
				});
			});
		});

		describe('incorrect fields', () => {
			test('status 400', async () => {
				const tokenData = await request(app).post('/session').send({
					email: sampleUser2.email,
					password: sampleUser2.password,
				});

				const data = await request(app)
					.put(`/users/${tokenData.body.user?._id}`)
					.send({
						...sampleUser2,
						firstName: 's',
					})
					.set('Authorization', `Bearer ${tokenData.body.token}`);

				expect(data.status).toEqual(400);
			});

			test('error array', async () => {
				const tokenData = await request(app).post('/session').send({
					email: sampleUser2.email,
					password: sampleUser2.password,
				});

				const data = await request(app)
					.put(`/users/${tokenData.body.user?._id}`)
					.send({
						...sampleUser2,
						firstName: 's',
					})
					.set('Authorization', `Bearer ${tokenData.body.token}`);

				expect(data.body.errors).toEqual([
					{
						location: 'body',
						msg: 'Minimum length of 2',
						param: 'firstName',
						value: 's',
					},
				]);
			});
		});
	});

	describe('user trying to update another user', () => {
		test('status 400', async () => {
			const tokenData = await request(app).post('/session').send({
				email: sampleUser2.email,
				password: sampleUser2.password,
			});
			const users = await request(app)
				.get('/users')
				.set('Authorization', `Bearer ${tokenData.body.token}`);
			const data = await request(app)
				.put(`/users/${users.body.users[0]?._id}`)
				.send({
					...sampleUser2,
					password: '12345678Q',
				})
				.set('Authorization', `Bearer ${tokenData.body.token}`);

			expect(data.status).toEqual(400);
		});

		test('error array', async () => {
			const tokenData = await request(app).post('/session').send({
				email: sampleUser2.email,
				password: sampleUser2.password,
			});
			const users = await request(app)
				.get('/users')
				.set('Authorization', `Bearer ${tokenData.body.token}`);
			const data = await request(app)
				.put(`/users/${users.body.users[0]?._id}`)
				.send({
					...sampleUser2,
					password: '12345678Q',
				})
				.set('Authorization', `Bearer ${tokenData.body.token}`);

			expect(data.body.errors).toEqual([
				{
					location: 'body',
					msg: 'Incorrect original password',
					param: 'password',
					value: '12345678Q',
				},
			]);
		});
	});
});
