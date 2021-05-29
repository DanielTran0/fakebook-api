const request = require('supertest');
const app = require('../configs/appConfig');
const userRouter = require('../routes/userRouter');
const sessionRouter = require('../routes/sessionRouter');
const postRouter = require('../routes/postRouter');
const { dbConnect, dbDisconnect } = require('../configs/mongoTestingConfig');
const userData = require('./userData');
require('../configs/passportStrategyConfig');

const { sampleUser1, passwordConfirmation } = userData;

app.use('/users', userRouter);
app.use('/session', sessionRouter);
app.use('/posts', postRouter);

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

// const tokenData = await request(app).post('/session').send({
//   email: sampleUser1.email,
//   password: sampleUser1.password,
// });
// const users = await request(app)
//   .get('/users')
//   .set('Authorization', `Bearer ${tokenData.body.token}`);
// const data = await request(app)
//   .post(`/friends/${users.body.users?.[1]?._id}`)
//   .set('Authorization', `Bearer ${tokenData.body.token}`);

// expect(data.status).toEqual(200);

describe('POST created post', () => {
	describe('succuss', () => {
		test('recieve post array with new post', async () => {
			const tokenData = await request(app).post('/session').send({
				email: sampleUser1.email,
				password: sampleUser1.password,
			});
			const data = await request(app)
				.post(`/posts`)
				.set('Authorization', `Bearer ${tokenData.body.token}`);

			expect(data.body).toEqual(200);
		});
	});

	describe('fail', () => {});
});

describe('GET all posts', () => {
	describe('succuss', () => {});

	describe('fail', () => {});
});

describe('GET a specific post', () => {
	describe('succuss', () => {});

	describe('fail', () => {});
});

describe('PUT update a post', () => {
	describe('succuss', () => {});

	describe('fail', () => {});
});

describe('Delete a post', () => {
	describe('succuss', () => {});

	describe('fail', () => {});
});
