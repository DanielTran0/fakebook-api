const request = require('supertest');
const app = require('../configs/appConfig');
const userRouter = require('../routes/userRouter');
const sessionRouter = require('../routes/sessionRouter');
const postRouter = require('../routes/postRouter');
const friendRouter = require('../routes/friendRouter');
const { dbConnect, dbDisconnect } = require('../configs/mongoTestingConfig');
const userData = require('./userData');
require('../configs/passportStrategyConfig');

const { sampleUser1, sampleUser2, sampleUser3, passwordConfirmation } =
	userData;

app.use('/users', userRouter);
app.use('/session', sessionRouter);
app.use('/posts', postRouter);
app.use('/friends', friendRouter);

beforeAll(async () => {
	try {
		await dbConnect();
		// create 3 users
		await request(app)
			.post('/users')
			.send({ ...sampleUser1, passwordConfirmation });
		await request(app)
			.post('/users')
			.send({ ...sampleUser2, passwordConfirmation });
		await request(app)
			.post('/users')
			.send({ ...sampleUser3, passwordConfirmation });

		// sign in users
		const userData1 = await request(app).post('/session').send({
			email: sampleUser1.email,
			password: sampleUser1.password,
		});
		const userData2 = await request(app).post('/session').send({
			email: sampleUser2.email,
			password: sampleUser2.password,
		});

		// user 1 adds user 2, user 2 accepts
		await request(app)
			.post(`/friends/${userData2.body.user._id}`)
			.set('Authorization', `Bearer ${userData1.body.token}`);
		await request(app)
			.put(`/friends/${userData1.body.user._id}`)
			.set('Authorization', `Bearer ${userData2.body.token}`)
			.send({ option: 'accept' });
	} catch (error) {
		console.log(error);
	}
});

afterAll(() => {
	dbDisconnect();
});

describe('POST created post', () => {
	describe('succuss', () => {
		test('create and receive new post', async () => {
			const tokenData = await request(app).post('/session').send({
				email: sampleUser1.email,
				password: sampleUser1.password,
			});

			const data = await request(app)
				.post(`/posts`)
				.set('Authorization', `Bearer ${tokenData.body.token}`)
				.field({ text: 'hello' });

			expect(data.body).toEqual({
				post: {
					_id: data.body.post?._id,
					user: tokenData.body.user?._id,
					text: 'hello',
					postImage: '',
					date: data.body.post?.date,
					likes: [],
					comments: [],
				},
			});
		});

		test('create with image and receive new post', async () => {
			const tokenData = await request(app).post('/session').send({
				email: sampleUser1.email,
				password: sampleUser1.password,
			});

			const data = await request(app)
				.post(`/posts`)
				.set('Authorization', `Bearer ${tokenData.body.token}`)
				.field({ text: 'dogs are nice' })
				.attach('postImage', './tests/test-image1.jpg');

			expect(data.body).toEqual({
				post: {
					_id: data.body.post?._id,
					user: tokenData.body.user?._id,
					text: 'dogs are nice',
					postImage: data.body.post?.postImage,
					date: data.body.post?.date,
					likes: [],
					comments: [],
				},
			});
		});
	});

	describe('fail', () => {
		test('error text under 2 characters with image', async () => {
			const tokenData = await request(app).post('/session').send({
				email: sampleUser1.email,
				password: sampleUser1.password,
			});

			const data = await request(app)
				.post(`/posts`)
				.set('Authorization', `Bearer ${tokenData.body.token}`)
				.field({ text: 'a' })
				.attach('postImage', './tests/test-image1.jpg');

			expect(data.body).toEqual({
				post: { text: 'a' },
				errors: [
					{
						location: 'body',
						msg: 'Minimum length is 2',
						param: 'text',
						value: 'a',
					},
				],
			});
		});

		test('error text under 2 characters without image', async () => {
			const tokenData = await request(app).post('/session').send({
				email: sampleUser1.email,
				password: sampleUser1.password,
			});

			const data = await request(app)
				.post(`/posts`)
				.set('Authorization', `Bearer ${tokenData.body.token}`)
				.field({ text: '1' });

			expect(data.body).toEqual({
				post: { text: '1' },
				errors: [
					{
						location: 'body',
						msg: 'Minimum length is 2',
						param: 'text',
						value: '1',
					},
				],
			});
		});

		test('error file is not an image', async () => {
			const tokenData = await request(app).post('/session').send({
				email: sampleUser1.email,
				password: sampleUser1.password,
			});

			const data = await request(app)
				.post(`/posts`)
				.set('Authorization', `Bearer ${tokenData.body.token}`)
				.field({ text: 'hello there' })
				.attach('postImage', './tests/userData.js');

			expect(data.body).toEqual({
				errors: [
					{
						msg: 'Only upload images ',
						storageErrors: [],
					},
				],
			});
		});

		test('error file too large', async () => {
			const tokenData = await request(app).post('/session').send({
				email: sampleUser1.email,
				password: sampleUser1.password,
			});

			const data = await request(app)
				.post(`/posts`)
				.set('Authorization', `Bearer ${tokenData.body.token}`)
				.field({ text: 'cats are better' })
				.attach('postImage', './tests/test-image-error.jpg');

			expect(data.body).toEqual({
				errors: [
					{
						code: 'LIMIT_FILE_SIZE',
						field: 'postImage',
						message: 'File too large',
						name: 'MulterError',
						storageErrors: [],
					},
				],
			});
		});
	});
});

describe('GET all posts', () => {
	test('get current user and friends posts', async () => {
		const tokenData = await request(app).post('/session').send({
			email: sampleUser2.email,
			password: sampleUser2.password,
		});

		const user1Data = await request(app).post('/session').send({
			email: sampleUser1.email,
			password: sampleUser1.password,
		});

		const data = await request(app)
			.get(`/posts`)
			.set('Authorization', `Bearer ${tokenData.body.token}`);

		expect(data.body).toEqual({
			posts: [
				{
					_id: data.body.posts?.[0]?._id,
					user: user1Data.body.user?._id,
					text: 'hello',
					postImage: data.body.posts?.[0]?.postImage,
					date: data.body.posts?.[0]?.date,
					comments: [],
					likes: [],
				},
				{
					_id: data.body.posts?.[1]?._id,
					user: user1Data.body.user?._id,
					text: 'dogs are nice',
					postImage: data.body.posts?.[1]?.postImage,
					date: data.body.posts?.[1]?.date,
					comments: [],
					likes: [],
				},
			],
		});
	});
});

describe('GET a specific post', () => {
	test('get another users posts', async () => {
		const tokenData = await request(app).post('/session').send({
			email: sampleUser3.email,
			password: sampleUser3.password,
		});

		const user1Data = await request(app).post('/session').send({
			email: sampleUser1.email,
			password: sampleUser1.password,
		});

		await request(app)
			.post(`/posts`)
			.set('Authorization', `Bearer ${tokenData.body.token}`)
			.field({ text: 'User 3 says goodbye' });

		const data = await request(app)
			.get(`/posts/${user1Data.body.user?._id}`)
			.set('Authorization', `Bearer ${tokenData.body.token}`);

		expect(data.body).toEqual({
			posts: [
				{
					_id: data.body.posts?.[0]?._id,
					user: user1Data.body.user?._id,
					text: 'hello',
					postImage: data.body.posts?.[0]?.postImage,
					date: data.body.posts?.[0]?.date,
					comments: [],
					likes: [],
				},
				{
					_id: data.body.posts?.[1]?._id,
					user: user1Data.body.user?._id,
					text: 'dogs are nice',
					postImage: data.body.posts?.[1]?.postImage,
					date: data.body.posts?.[1]?.date,
					comments: [],
					likes: [],
				},
			],
		});
	});
});

describe('PUT update a post', () => {
	describe('succuss', () => {
		test('receive updated post (remove image)', async () => {
			const tokenData = await request(app).post('/session').send({
				email: sampleUser1.email,
				password: sampleUser1.password,
			});
			const posts = await request(app)
				.get(`/posts/${tokenData.body.user?._id}`)
				.set('Authorization', `Bearer ${tokenData.body.token}`);
			const data = await request(app)
				.put(`/posts/${posts.body.posts?.[1]?._id}`)
				.set('Authorization', `Bearer ${tokenData.body.token}`)
				.field({ text: 'cats are better' });

			expect(data.body).toEqual({
				post: {
					_id: data.body.post?._id,
					user: tokenData.body.user?._id,
					text: 'cats are better',
					postImage: '',
					date: data.body.post?.date,
					likes: [],
					comments: [],
				},
			});
		});

		test('receive updated post (add image)', async () => {
			const tokenData = await request(app).post('/session').send({
				email: sampleUser1.email,
				password: sampleUser1.password,
			});
			const posts = await request(app)
				.get(`/posts/${tokenData.body.user?._id}`)
				.set('Authorization', `Bearer ${tokenData.body.token}`);
			const data = await request(app)
				.put(`/posts/${posts.body.posts?.[0]?._id}`)
				.set('Authorization', `Bearer ${tokenData.body.token}`)
				.field({ text: 'nature is nice' })
				.attach('postImage', './tests/test-image2.jpg');

			expect(data.body).toEqual({
				post: {
					_id: data.body.post?._id,
					user: tokenData.body.user?._id,
					text: 'nature is nice',
					postImage: data.body.post?.postImage,
					date: data.body.post?.date,
					likes: [],
					comments: [],
				},
			});
		});
	});
});

describe('Delete a post', () => {
	describe('succuss', () => {
		test('receive updated deleted posts', async () => {
			const tokenData = await request(app).post('/session').send({
				email: sampleUser1.email,
				password: sampleUser1.password,
			});
			const posts = await request(app)
				.get(`/posts/${tokenData.body.user?._id}`)
				.set('Authorization', `Bearer ${tokenData.body.token}`);
			const data = await request(app)
				.delete(`/posts/${posts.body.posts?.[0]?._id}`)
				.set('Authorization', `Bearer ${tokenData.body.token}`);
			expect(data.body).toEqual({
				posts: [
					{
						_id: data.body.posts?.[0]?._id,
						user: tokenData.body.user?._id,
						text: 'cats are better',
						postImage: data.body.posts?.[0]?.postImage,
						date: data.body.posts?.[0]?.date,
						comments: [],
						likes: [],
					},
				],
			});
		});
	});

	describe('fail', () => {
		test('error deleting another users  post', async () => {
			const tokenData = await request(app).post('/session').send({
				email: sampleUser2.email,
				password: sampleUser2.password,
			});
			const user1Data = await request(app).post('/session').send({
				email: sampleUser1.email,
				password: sampleUser1.password,
			});
			const posts = await request(app)
				.get(`/posts/${user1Data.body.user?._id}`)
				.set('Authorization', `Bearer ${tokenData.body.token}`);
			const data = await request(app)
				.delete(`/posts/${posts.body.posts?.[0]?._id}`)
				.set('Authorization', `Bearer ${tokenData.body.token}`);

			expect(data.body).toEqual({
				errors: [
					{
						msg: 'Need to be message creator to delete message',
					},
				],
			});
		});
	});
});
