const request = require('supertest');
const app = require('../configs/appConfig');
const userRouter = require('../routes/userRouter');
const sessionRouter = require('../routes/sessionRouter');
const postRouter = require('../routes/postRouter');
const postLikeRouter = require('../routes/postLikeRouter');
const friendRouter = require('../routes/friendRouter');
const postCommentRouter = require('../routes/postCommentRouter');
const { dbConnect, dbDisconnect } = require('../configs/mongoTestingConfig');
const userData = require('./userData');
require('../configs/passportStrategyConfig');

const { sampleUser1, sampleUser2, passwordConfirmation } = userData;

app.use('/users', userRouter);
app.use('/session', sessionRouter);
app.use('/posts', postRouter);
app.use('/posts-likes', postLikeRouter);
app.use('/posts-comments', postCommentRouter);
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

describe('POST new Comment', () => {
	test('receive post with updated comments', async () => {
		const user2 = await request(app).post('/session').send({
			email: sampleUser2.email,
			password: sampleUser2.password,
		});
		const posts = await request(app)
			.get(`/posts`)
			.set('Authorization', `Bearer ${user2.body.token}`);
		const result = await request(app)
			.post(`/posts-comments/${posts.body.posts?.[0]?._id}`)
			.set('Authorization', `Bearer ${user2.body.token}`)
			.send({ text: 'nice post' });

		expect(result.body).toEqual({
			post: {
				_id: result.body.post?._id,
				comments: [
					{
						_id: result.body.post?.comments?.[0]?._id,
						user: user2.body.user?._id,
						text: 'nice post',
						date: result.body.post?.comments?.[0]?.date,
					},
				],
			},
		});
	});

	test('works with apostrophes', async () => {
		const user2 = await request(app).post('/session').send({
			email: sampleUser2.email,
			password: sampleUser2.password,
		});
		const posts = await request(app)
			.get(`/posts`)
			.set('Authorization', `Bearer ${user2.body.token}`);
		const result = await request(app)
			.post(`/posts-comments/${posts.body.posts?.[0]?._id}`)
			.set('Authorization', `Bearer ${user2.body.token}`)
			.send({ text: '"sup"' });

		expect(result.body).toEqual({
			post: {
				_id: result.body.post?._id,
				comments: [
					{
						_id: result.body.post?.comments?.[0]?._id,
						user: user2.body.user?._id,
						text: 'nice post',
						date: result.body.post?.comments?.[0]?.date,
					},
					{
						_id: result.body.post?.comments?.[1]?._id,
						user: user2.body.user?._id,
						text: '"sup"',
						date: result.body.post?.comments?.[1]?.date,
					},
				],
			},
		});
	});

	test('error from empty text', async () => {
		const user2 = await request(app).post('/session').send({
			email: sampleUser2.email,
			password: sampleUser2.password,
		});
		const posts = await request(app)
			.get(`/posts`)
			.set('Authorization', `Bearer ${user2.body.token}`);
		const result = await request(app)
			.post(`/posts-comments/${posts.body.posts?.[0]?._id}`)
			.set('Authorization', `Bearer ${user2.body.token}`)
			.send({ text: '' });

		expect(result.body).toEqual({
			comment: { text: '' },
			errors: [
				{
					location: 'body',
					msg: 'Minimum length is 1',
					param: 'text',
					value: '',
				},
			],
		});
	});
});

describe('PUT change comments', () => {
	describe('succuss', () => {
		test('receive post with updated comments', async () => {
			const user2 = await request(app).post('/session').send({
				email: sampleUser2.email,
				password: sampleUser2.password,
			});
			const posts = await request(app)
				.get(`/posts`)
				.set('Authorization', `Bearer ${user2.body.token}`);
			const result = await request(app)
				.put(`/posts-comments/${posts.body.posts?.[0]?.comments?.[0]._id}`)
				.set('Authorization', `Bearer ${user2.body.token}`)
				.send({ text: '"great"', postId: posts.body.posts?.[0]?._id });

			expect(result.body).toEqual({
				post: {
					_id: result.body.post?._id,
					comments: [
						{
							_id: result.body.post?.comments?.[0]?._id,
							user: user2.body.user?._id,
							text: '"great"',
							date: result.body.post?.comments?.[0]?.date,
						},
						{
							_id: result.body.post?.comments?.[1]?._id,
							user: user2.body.user?._id,
							text: '"sup"',
							date: result.body.post?.comments?.[1]?.date,
						},
					],
				},
			});
		});
	});

	describe('fail', () => {
		test('no post id given', async () => {
			const user2 = await request(app).post('/session').send({
				email: sampleUser2.email,
				password: sampleUser2.password,
			});
			const posts = await request(app)
				.get(`/posts`)
				.set('Authorization', `Bearer ${user2.body.token}`);
			const result = await request(app)
				.put(`/posts-comments/${posts.body.posts?.[0]?.comments?.[0]._id}`)
				.set('Authorization', `Bearer ${user2.body.token}`)
				.send({ text: 'bye' });

			expect(result.body).toEqual({
				comment: { postId: '', text: 'bye' },
				errors: [
					{
						location: 'body',
						msg: 'Post id is required',
						param: 'postId',
						value: '',
					},
				],
			});
		});

		test('comment does not exist', async () => {
			const user2 = await request(app).post('/session').send({
				email: sampleUser2.email,
				password: sampleUser2.password,
			});
			const posts = await request(app)
				.get(`/posts`)
				.set('Authorization', `Bearer ${user2.body.token}`);
			const result = await request(app)
				.put(`/posts-comments/2`)
				.set('Authorization', `Bearer ${user2.body.token}`)
				.send({ text: 'bye', postId: posts.body.posts?.[0]?._id });

			expect(result.body).toEqual({
				errors: [
					{
						msg: 'Could not find comment to edit',
					},
				],
			});
		});

		test('cannot edit another users comment', async () => {
			const user1 = await request(app).post('/session').send({
				email: sampleUser1.email,
				password: sampleUser1.password,
			});
			const posts = await request(app)
				.get(`/posts`)
				.set('Authorization', `Bearer ${user1.body.token}`);
			const result = await request(app)
				.put(`/posts-comments/${posts.body.posts?.[0]?.comments?.[0]._id}`)
				.set('Authorization', `Bearer ${user1.body.token}`)
				.send({ text: 'im better', postId: posts.body.posts?.[0]?._id });

			expect(result.body).toEqual({
				errors: [
					{
						msg: 'Only user who made the comment can edit it',
					},
				],
			});
		});
	});
});

describe('delete comments', () => {
	test('receive post with updated comments', async () => {
		const user2 = await request(app).post('/session').send({
			email: sampleUser2.email,
			password: sampleUser2.password,
		});
		const posts = await request(app)
			.get(`/posts`)
			.set('Authorization', `Bearer ${user2.body.token}`);
		const result = await request(app)
			.delete(`/posts-comments/${posts.body.posts?.[0]?.comments?.[0]._id}`)
			.set('Authorization', `Bearer ${user2.body.token}`)
			.send({ postId: posts.body.posts?.[0]?._id });

		expect(result.body).toEqual({
			post: {
				_id: result.body.post?._id,
				comments: [
					{
						_id: result.body.post?.comments?.[0]?._id,
						user: user2.body.user?._id,
						text: '"sup"',
						date: result.body.post?.comments?.[0]?.date,
					},
				],
			},
		});
	});
});
