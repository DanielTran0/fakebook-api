const request = require('supertest');
const app = require('../configs/appConfig');
const userRouter = require('../routes/userRouter');
const sessionRouter = require('../routes/sessionRouter');
const friendRouter = require('../routes/friendRouter');
const { dbConnect, dbDisconnect } = require('../configs/mongoTestingConfig');
const userData = require('./userData');
require('../configs/passportStrategyConfig');

const { sampleUser1, sampleUser2, sampleUser3, passwordConfirmation } =
	userData;

const { friends, password, ...otherFields } = sampleUser1;
const { friends: friends2, password: password2, ...otherFields2 } = sampleUser2;
const { friends: friends3, password: password3, ...otherFields3 } = sampleUser3;

app.use('/users', userRouter);
app.use('/session', sessionRouter);
app.use('/friends', friendRouter);

beforeAll(async () => {
	try {
		await dbConnect();
		await request(app)
			.post('/users')
			.send({ ...sampleUser1, passwordConfirmation });
		await request(app)
			.post('/users')
			.send({ ...sampleUser2, passwordConfirmation });
		await request(app)
			.post('/users')
			.send({ ...sampleUser3, passwordConfirmation });
	} catch (error) {
		console.log(error);
	}
});

afterAll(() => {
	dbDisconnect();
});

describe('Post outgoing friend request', () => {
	describe('succuss', () => {
		test('status 200', async () => {
			const tokenData = await request(app).post('/session').send({
				email: sampleUser1.email,
				password: sampleUser1.password,
			});
			const users = await request(app)
				.get('/users')
				.set('Authorization', `Bearer ${tokenData.body.token}`);
			const data = await request(app)
				.post(`/friends/${users.body.users?.[1]?._id}`)
				.set('Authorization', `Bearer ${tokenData.body.token}`);
			expect(data.status).toEqual(200);
		});

		test('receive updated friends array', async () => {
			const tokenData = await request(app).post('/session').send({
				email: sampleUser1.email,
				password: sampleUser1.password,
			});
			const users = await request(app)
				.get('/users')
				.set('Authorization', `Bearer ${tokenData.body.token}`);
			const data = await request(app)
				.post(`/friends/${users.body.users?.[2]?._id}`)
				.set('Authorization', `Bearer ${tokenData.body.token}`);

			expect(data.body).toEqual({
				friends: [
					{
						user: { ...otherFields2, _id: users.body.users?.[1]?._id },
						status: 'outgoing',
					},
					{
						user: { ...otherFields3, _id: users.body.users?.[2]?._id },
						status: 'outgoing',
					},
				],
			});
		});
	});

	describe('failure', () => {
		test('status 400', async () => {
			const tokenData = await request(app).post('/session').send({
				email: sampleUser1.email,
				password: sampleUser1.password,
			});
			const users = await request(app)
				.get('/users')
				.set('Authorization', `Bearer ${tokenData.body.token}`);
			const data = await request(app)
				.post(`/friends/${users.body.users?.[2]?._id}`)
				.set('Authorization', `Bearer ${tokenData.body.token}`);

			expect(data.status).toEqual(400);
		});

		test('cancel if already friends or pending', async () => {
			const tokenData = await request(app).post('/session').send({
				email: sampleUser1.email,
				password: sampleUser1.password,
			});
			const users = await request(app)
				.get('/users')
				.set('Authorization', `Bearer ${tokenData.body.token}`);
			const data = await request(app)
				.post(`/friends/${users.body.users?.[2]?._id}`)
				.set('Authorization', `Bearer ${tokenData.body.token}`);

			expect(data.body).toEqual({
				errors: [{ msg: 'Already friends or pending' }],
			});
		});

		test('cannot add self as friend', async () => {
			const tokenData = await request(app).post('/session').send({
				email: sampleUser1.email,
				password: sampleUser1.password,
			});
			const users = await request(app)
				.get('/users')
				.set('Authorization', `Bearer ${tokenData.body.token}`);
			const data = await request(app)
				.post(`/friends/${users.body.users?.[0]?._id}`)
				.set('Authorization', `Bearer ${tokenData.body.token}`);

			expect(data.body).toEqual({
				errors: [
					{
						msg: 'Can not add yourself as a friend',
					},
				],
			});
		});
	});
});

describe('GET user friends', () => {
	test('status 200', async () => {
		const tokenData = await request(app).post('/session').send({
			email: sampleUser1.email,
			password: sampleUser1.password,
		});
		const data = await request(app)
			.get('/friends')
			.set('Authorization', `Bearer ${tokenData.body.token}`);

		expect(data.status).toEqual(200);
	});

	test('receive array of friends', async () => {
		const tokenData = await request(app).post('/session').send({
			email: sampleUser1.email,
			password: sampleUser1.password,
		});
		const users = await request(app)
			.get('/users')
			.set('Authorization', `Bearer ${tokenData.body.token}`);
		const data = await request(app)
			.get('/friends')
			.set('Authorization', `Bearer ${tokenData.body.token}`);

		expect(data.body).toEqual({
			friends: [
				{
					user: { ...otherFields2, _id: users.body.users?.[1]?._id },
					status: 'outgoing',
				},
				{
					user: { ...otherFields3, _id: users.body.users?.[2]?._id },
					status: 'outgoing',
				},
			],
		});
	});
});

describe('PUT accept or reject friend request', () => {
	describe('accept friend request', () => {
		test('received updated friends array from accepting user', async () => {
			const tokenData = await request(app).post('/session').send({
				email: sampleUser3.email,
				password: sampleUser3.password,
			});
			const users = await request(app)
				.get('/users')
				.set('Authorization', `Bearer ${tokenData.body.token}`);
			const data = await request(app)
				.put(`/friends/${users.body.users?.[0]?._id}`)
				.set('Authorization', `Bearer ${tokenData.body.token}`)
				.send({ option: 'accept' });

			expect(data.body).toEqual({
				friends: [
					{
						user: { ...otherFields, _id: users.body.users?.[0]?._id },
						status: 'friends',
					},
				],
			});
		});

		test('check data base for requesting user has new friend', async () => {
			const tokenData = await request(app).post('/session').send({
				email: sampleUser1.email,
				password: sampleUser1.password,
			});
			const users = await request(app)
				.get('/users')
				.set('Authorization', `Bearer ${tokenData.body.token}`);
			const data = await request(app)
				.get(`/friends`)
				.set('Authorization', `Bearer ${tokenData.body.token}`);

			expect(data.body).toEqual({
				friends: [
					{
						user: { ...otherFields2, _id: users.body.users?.[1]?._id },
						status: 'outgoing',
					},
					{
						user: { ...otherFields3, _id: users.body.users?.[2]?._id },
						status: 'friends',
					},
				],
			});
		});
	});

	describe('reject friend request', () => {
		test('received updated friends request from accepting user', async () => {
			const tokenData = await request(app).post('/session').send({
				email: sampleUser2.email,
				password: sampleUser2.password,
			});
			const users = await request(app)
				.get('/users')
				.set('Authorization', `Bearer ${tokenData.body.token}`);
			const data = await request(app)
				.put(`/friends/${users.body.users?.[0]?._id}`)
				.set('Authorization', `Bearer ${tokenData.body.token}`)
				.send({ option: 'reject' });

			expect(data.body).toEqual({
				friends: [],
			});
		});
	});

	describe('fail', () => {
		test('status 400', async () => {
			const tokenData = await request(app).post('/session').send({
				email: sampleUser2.email,
				password: sampleUser2.password,
			});
			const users = await request(app)
				.get('/users')
				.set('Authorization', `Bearer ${tokenData.body.token}`);
			await request(app)
				.post(`/friends/${users.body.users?.[2]?._id}`)
				.set('Authorization', `Bearer ${tokenData.body.token}`);
			const data = await request(app)
				.put(`/friends/${users.body.users?.[2]?._id}`)
				.set('Authorization', `Bearer ${tokenData.body.token}`)
				.send({});

			expect(data.status).toEqual(400);
		});

		test('error from no option on request', async () => {
			const tokenData = await request(app).post('/session').send({
				email: sampleUser2.email,
				password: sampleUser2.password,
			});
			const users = await request(app)
				.get('/users')
				.set('Authorization', `Bearer ${tokenData.body.token}`);
			const data = await request(app)
				.put(`/friends/${users.body.users?.[2]?._id}`)
				.set('Authorization', `Bearer ${tokenData.body.token}`)
				.send({});

			expect(data.body).toEqual({
				errors: [{ msg: 'Invalid option (accept or reject request)' }],
			});
		});

		test('error from no friend request to begin with', async () => {
			const tokenData = await request(app).post('/session').send({
				email: sampleUser2.email,
				password: sampleUser2.password,
			});
			const users = await request(app)
				.get('/users')
				.set('Authorization', `Bearer ${tokenData.body.token}`);
			const data = await request(app)
				.put(`/friends/${users.body.users?.[0]?._id}`)
				.set('Authorization', `Bearer ${tokenData.body.token}`)
				.send({ option: 'accept' });

			expect(data.body).toEqual({
				errors: [{ msg: 'No friend request to begin with' }],
			});
		});

		test('error from rejecting or accepting user that is already friend', async () => {
			const tokenData = await request(app).post('/session').send({
				email: sampleUser1.email,
				password: sampleUser1.password,
			});
			const users = await request(app)
				.get('/users')
				.set('Authorization', `Bearer ${tokenData.body.token}`);
			const data = await request(app)
				.put(`/friends/${users.body.users?.[2]?._id}`)
				.set('Authorization', `Bearer ${tokenData.body.token}`)
				.send({ option: 'reject' });

			expect(data.body).toEqual({
				errors: [
					{
						msg: 'Can not accept reject user that is already a friend',
					},
				],
			});
		});
	});
});

describe('delete users friend or request', () => {
	describe('succuss', () => {
		test('receive update friends array', async () => {
			const tokenData = await request(app).post('/session').send({
				email: sampleUser1.email,
				password: sampleUser1.password,
			});
			const users = await request(app)
				.get('/users')
				.set('Authorization', `Bearer ${tokenData.body.token}`);
			const data = await request(app)
				.delete(`/friends/${users.body.users?.[2]?._id}`)
				.set('Authorization', `Bearer ${tokenData.body.token}`);

			expect(data.body).toEqual({
				friends: [],
			});
		});

		test('delete outgoing friend request', async () => {
			const tokenData = await request(app).post('/session').send({
				email: sampleUser1.email,
				password: sampleUser1.password,
			});
			const users = await request(app)
				.get('/users')
				.set('Authorization', `Bearer ${tokenData.body.token}`);
			await request(app)
				.post(`/friends/${users.body.users?.[2]._id}`)
				.set('Authorization', `Bearer ${tokenData.body.token}`);
			await request(app)
				.post(`/friends/${users.body.users?.[1]._id}`)
				.set('Authorization', `Bearer ${tokenData.body.token}`);
			const data = await request(app)
				.delete(`/friends/${users.body.users?.[2]?._id}`)
				.set('Authorization', `Bearer ${tokenData.body.token}`);

			expect(data.body).toEqual({
				friends: [
					{
						user: { ...otherFields2, _id: users.body.users?.[1]?._id },
						status: 'outgoing',
					},
				],
			});
		});
	});

	describe('fail', () => {
		test('error deleting user that is not a friend', async () => {
			const tokenData = await request(app).post('/session').send({
				email: sampleUser1.email,
				password: sampleUser1.password,
			});
			const users = await request(app)
				.get('/users')
				.set('Authorization', `Bearer ${tokenData.body.token}`);
			const data = await request(app)
				.delete(`/friends/${users.body.users?.[2]?._id}`)
				.set('Authorization', `Bearer ${tokenData.body.token}`);
			expect(data.body).toEqual({
				errors: { msg: 'That user is already not a friend' },
			});
		});
	});
});

describe('GET another user friends', () => {
	test('receive another users friends', async () => {
		const user1 = await request(app).post('/session').send({
			email: sampleUser1.email,
			password: sampleUser1.password,
		});

		const users = await request(app)
			.get('/users')
			.set('Authorization', `Bearer ${user1.body.token}`);
		await request(app)
			.put(`/friends/${users.body.users?.[1]?._id}`)
			.set('Authorization', `Bearer ${user1.body.token}`)
			.send({ option: 'accept' });

		const result = await request(app)
			.get(`/friends/${users.body.users?.[1]?._id}`)
			.set('Authorization', `Bearer ${user1.body.token}`);

		expect(result.body).toEqual({
			friends: [
				{
					user: { ...otherFields, _id: users.body.users?.[0]?._id },
					status: 'friends',
				},
			],
		});
	});
});
