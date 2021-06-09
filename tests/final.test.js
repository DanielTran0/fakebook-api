const request = require('supertest');
const app = require('../configs/appConfig');
const userRouter = require('../routes/userRouter');
const sessionRouter = require('../routes/sessionRouter');
const postRouter = require('../routes/postRouter');
const friendRouter = require('../routes/friendRouter');
const postLikeRouter = require('../routes/postLikeRouter');
const postCommentRouter = require('../routes/postCommentRouter');
const { dbConnect, dbDisconnect } = require('../configs/mongoTestingConfig');
const userData = require('./userData');
require('../configs/passportStrategyConfig');

const { sampleUser1, sampleUser2, sampleUser3, passwordConfirmation } =
	userData;

app.use('/users', userRouter);
app.use('/session', sessionRouter);
app.use('/posts', postRouter);
app.use('/friends', friendRouter);
app.use('/likes', postLikeRouter);
app.use('/comments', postCommentRouter);

beforeAll(async () => {
	try {
		await dbConnect();

		// create users
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
		const userData3 = await request(app).post('/session').send({
			email: sampleUser3.email,
			password: sampleUser3.password,
		});

		// users add each others as friends
		await request(app)
			.post(`/friends/${userData2.body.user._id}`)
			.set('Authorization', `Bearer ${userData1.body.token}`);
		await request(app)
			.put(`/friends/${userData1.body.user._id}`)
			.set('Authorization', `Bearer ${userData2.body.token}`)
			.send({ option: 'accept' });
		await request(app)
			.post(`/friends/${userData3.body.user._id}`)
			.set('Authorization', `Bearer ${userData1.body.token}`);
		await request(app)
			.put(`/friends/${userData1.body.user._id}`)
			.set('Authorization', `Bearer ${userData3.body.token}`)
			.send({ option: 'accept' });
		await request(app)
			.post(`/friends/${userData3.body.user._id}`)
			.set('Authorization', `Bearer ${userData2.body.token}`);
		await request(app)
			.put(`/friends/${userData2.body.user._id}`)
			.set('Authorization', `Bearer ${userData3.body.token}`)
			.send({ option: 'accept' });

		// users make a post
		const user2Post = await request(app)
			.post('/posts')
			.field({ text: 'User 2 post' })
			.set('Authorization', `Bearer ${userData2.body.token}`);
		const user1Post = await request(app)
			.post('/posts')
			.field({ text: 'User 1 post' })
			.attach('postImage', './tests/test-image2.jpg')
			.set('Authorization', `Bearer ${userData1.body.token}`);
		const user3Post = await request(app)
			.post('/posts')
			.field({ text: 'User 3 post' })
			.set('Authorization', `Bearer ${userData3.body.token}`);

		// user 1 likes other user's posts
		await request(app)
			.put(`/likes/${user2Post.body.post._id}`)
			.set('Authorization', `Bearer ${userData1.body.token}`);
		await request(app)
			.put(`/likes/${user3Post.body.post._id}`)
			.set('Authorization', `Bearer ${userData1.body.token}`);

		// user 1 comments on all posts
		await request(app)
			.post(`/comments/${user1Post.body.post._id}`)
			.send({ text: 'Hello world' })
			.set('Authorization', `Bearer ${userData1.body.token}`);
		await request(app)
			.post(`/comments/${user2Post.body.post._id}`)
			.send({ text: 'Saying hi to user 2' })
			.set('Authorization', `Bearer ${userData1.body.token}`);
		await request(app)
			.post(`/comments/${user3Post.body.post._id}`)
			.send({ text: 'Saying hi to user 3' })
			.set('Authorization', `Bearer ${userData1.body.token}`);

		// user 1 profile image, test to ensure images are deleted
		await request(app)
			.put(`/users/${userData1.body.user?._id}`)
			.field({
				...sampleUser1,
			})
			.attach('userImage', './tests/test-image1.jpg')
			.set('Authorization', `Bearer ${userData1.body.token}`);
	} catch (error) {
		console.log(error);
	}
});

afterAll(() => {
	dbDisconnect();
});

describe('view all generated resources and test delete', () => {
	test('comments and likes are fully populated', async () => {
		const userData2 = await request(app).post('/session').send({
			email: sampleUser2.email,
			password: sampleUser2.password,
		});
		const posts = await request(app)
			.get(`/posts`)
			.set('Authorization', `Bearer ${userData2.body.token}`);

		expect(posts.body.posts?.[0]).toEqual({
			_id: posts.body.posts?.[0]?._id,
			comments: [
				{
					_id: posts.body.posts?.[0]?.comments?.[0]?._id,
					date: posts.body.posts?.[0]?.comments?.[0]?.date,
					text: 'Saying hi to user 2',
					user: {
						_id: posts.body.posts?.[0]?.comments?.[0]?.user?._id,
						firstName: 'Dan',
						lastName: 'Man',
						profileImage:
							posts.body.posts?.[0]?.comments?.[0]?.user?.profileImage,
					},
				},
			],
			date: posts.body.posts?.[0]?.date,
			likes: [
				{
					_id: posts.body.posts?.[0]?.likes?.[0]?._id,
					user: {
						_id: posts.body.posts?.[0]?.likes?.[0]?.user?._id,
						firstName: 'Dan',
						lastName: 'Man',
					},
				},
			],
			postImage: '',
			text: 'User 2 post',
			user: posts.body.posts?.[0]?.user,
		});
	});

	test('delete user, all posts comments and likes are gone', async () => {
		const userData1 = await request(app).post('/session').send({
			email: sampleUser1.email,
			password: sampleUser1.password,
		});
		const userData2 = await request(app).post('/session').send({
			email: sampleUser2.email,
			password: sampleUser2.password,
		});
		await request(app)
			.delete(`/users`)
			.set('Authorization', `Bearer ${userData1.body.token}`)
			.send({ password: sampleUser1.password });
		const posts = await request(app)
			.get(`/posts`)
			.set('Authorization', `Bearer ${userData2.body.token}`);

		expect(posts.body).toEqual({
			posts: [
				{
					_id: posts.body.posts?.[0]?._id,
					comments: [],
					date: posts.body.posts?.[0]?.date,
					likes: [],
					postImage: '',
					text: 'User 2 post',
					user: posts.body.posts?.[0]?.user,
				},
				{
					_id: posts.body.posts?.[1]?._id,
					comments: [],
					date: posts.body.posts?.[1]?.date,
					likes: [],
					postImage: '',
					text: 'User 3 post',
					user: posts.body.posts?.[1]?.user,
				},
			],
		});
	});

	test('delete user, gone off other users friends list', async () => {
		const userData2 = await request(app).post('/session').send({
			email: sampleUser2.email,
			password: sampleUser2.password,
		});
		const friends = await request(app)
			.get(`/friends`)
			.set('Authorization', `Bearer ${userData2.body.token}`);

		expect(friends.body).toEqual({
			friends: [
				{
					user: {
						_id: friends.body.friends?.[0]?.user?._id,
						email: 'kim@live.ca',
						firstName: 'Kim',
						lastName: 'Loud',
						profileImage: '',
					},
					status: 'friends',
				},
			],
		});
	});

	test('delete user, user gone', async () => {
		const userData2 = await request(app).post('/session').send({
			email: sampleUser2.email,
			password: sampleUser2.password,
		});
		const allUsers = await request(app)
			.get(`/users`)
			.set('Authorization', `Bearer ${userData2.body.token}`);

		expect(allUsers.body).toEqual({
			users: [
				{
					_id: allUsers.body.users?.[0]?._id,
					email: 'sam@live.ca',
					firstName: 'Sam',
					lastName: 'Bad',
					profileImage: '',
				},
				{
					_id: allUsers.body.users?.[1]?._id,
					email: 'kim@live.ca',
					firstName: 'Kim',
					lastName: 'Loud',
					profileImage: '',
				},
			],
		});
	});

	test('user 1 can no longer sign in', async () => {
		const userData1 = await request(app).post('/session').send({
			email: sampleUser1.email,
			password: sampleUser1.password,
		});

		expect(userData1.body).toEqual({
			errors: [{ msg: 'Incorrect Email', param: 'email' }],
		});
	});

	test('error can not delete if password is wrong', async () => {
		const userData2 = await request(app).post('/session').send({
			email: sampleUser2.email,
			password: sampleUser2.password,
		});
		const result = await request(app)
			.delete(`/users`)
			.set('Authorization', `Bearer ${userData2.body.token}`)
			.send({ password: 'D213123dog' });

		expect(result.body).toEqual({
			user: { password: 'D213123dog' },
			errors: [
				{
					location: 'body',
					msg: 'Incorrect original password',
					param: 'password',
					value: 'D213123dog',
				},
			],
		});
	});
});
