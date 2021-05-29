const request = require('supertest');
const app = require('../configs/appConfig');
const sessionRouter = require('../routes/sessionRouter');
const userRouter = require('../routes/userRouter');
const { dbConnect, dbDisconnect } = require('../configs/mongoTestingConfig');
const userData = require('./userData');
require('../configs/passportStrategyConfig');

const { sampleUser1, sampleUser2, passwordConfirmation } = userData;

app.use('/session', sessionRouter);
app.use('/users', userRouter);

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

describe('successful login', () => {
	test('status 200', async () => {
		const data = await request(app).post('/session').send({
			email: sampleUser1.email,
			password: sampleUser1.password,
		});
		expect(data.status).toEqual(200);
	});

	test('receive user data and token', async () => {
		const data = await request(app).post('/session').send({
			email: sampleUser1.email,
			password: sampleUser1.password,
		});
		const { friends, password, ...otherFields } = sampleUser1;

		expect(data.body).toEqual({
			user: {
				...otherFields,
				_id: data.body?.user?._id,
			},
			token: data.body?.token,
		});
	});
});

describe('wrong login', () => {
	test('status 400', async () => {
		const data = await request(app).post('/session').send({
			email: sampleUser1.email,
			password: '2',
		});
		expect(data.status).toEqual(400);
	});

	test('wrong username', async () => {
		const data = await request(app).post('/session').send({
			email: sampleUser2.email,
			password: sampleUser1.password,
		});
		expect(data.body).toEqual({ errors: [{ msg: 'Incorrect username' }] });
	});

	test('wrong password', async () => {
		const data = await request(app).post('/session').send({
			email: sampleUser1.email,
			password: '2',
		});
		expect(data.body).toEqual({
			errors: [
				{
					msg: 'Incorrect password (Min Length: 8, 1 Capital Letter, 1 Number)',
				},
			],
		});
	});
});
