const request = require('supertest');
const app = require('../configs/appConfig');
const userRouter = require('../routes/userRouter');
const sessionRouter = require('../routes/sessionRouter');
const postRouter = require('../routes/postRouter');
const postLikeRouter = require('../routes/postLikeRouter');
const friendRouter = require('../routes/friendRouter');
const { dbConnect, dbDisconnect } = require('../configs/mongoTestingConfig');
const userData = require('./userData');
require('../configs/passportStrategyConfig');

const { sampleUser1, sampleUser2, passwordConfirmation } = userData;

app.use('/users', userRouter);
app.use('/session', sessionRouter);
app.use('/posts', postRouter);
app.use('/posts-likes', postLikeRouter);
app.use('/friends', friendRouter);

beforeAll(async () => {
	try {
		await dbConnect();
		// create 2 users
		await request(app)
			.post('/users')
			.send({ ...sampleUser1, passwordConfirmation });
		await request(app)
			.post('/users')
			.send({ ...sampleUser2, passwordConfirmation });

		// sign in users
		const user1 = await request(app).post('/session').send({
			email: sampleUser1.email,
			password: sampleUser1.password,
		});
		const user2 = await request(app).post('/session').send({
			email: sampleUser2.email,
			password: sampleUser2.password,
		});

		// user 1 adds user 2, user 2 accepts
		await request(app)
			.post(`/friends/${user2.body.user._id}`)
			.set('Authorization', `Bearer ${user1.body.token}`);
		await request(app)
			.put(`/friends/${user1.body.user._id}`)
			.set('Authorization', `Bearer ${user2.body.token}`)
			.send({ option: 'accept' });

		// user 1 creates a new post
		await request(app)
			.post(`/posts`)
			.set('Authorization', `Bearer ${user1.body.token}`)
			.field({ text: 'hello there, first post' });
	} catch (error) {
		console.log(error);
	}
});

afterAll(() => {
	dbDisconnect();
});

describe('put change like on post', () => {
	test('add like, receive post with updated likes', async () => {
		const user2 = await request(app).post('/session').send({
			email: sampleUser2.email,
			password: sampleUser2.password,
		});
		const posts = await request(app)
			.get(`/posts`)
			.set('Authorization', `Bearer ${user2.body.token}`);
		const result = await request(app)
			.put(`/posts-likes/${posts.body.posts?.[0]?._id}`)
			.set('Authorization', `Bearer ${user2.body.token}`);

		expect(result.body).toEqual({
			post: {
				_id: result.body.post?._id,
				likes: [
					{
						_id: result.body.post?.likes?.[0]?._id,
						user: user2.body.user?._id,
					},
				],
			},
		});
	});

	test('delete like, receive post with updated likes', async () => {
		const user2 = await request(app).post('/session').send({
			email: sampleUser2.email,
			password: sampleUser2.password,
		});
		const posts = await request(app)
			.get(`/posts`)
			.set('Authorization', `Bearer ${user2.body.token}`);
		const result = await request(app)
			.put(`/posts-likes/${posts.body.posts?.[0]?._id}`)
			.set('Authorization', `Bearer ${user2.body.token}`);

		console.log(result);

		expect(result.body).toEqual({
			post: {
				_id: result.body.post?._id,
				likes: [],
			},
		});
	});
});
