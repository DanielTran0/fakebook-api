const cors = require('cors');
const createError = require('http-errors');
const logger = require('morgan');
const http = require('http');
const { Server } = require('socket.io');

const app = require('./configs/appConfig');
const friendRouter = require('./routes/friendRouter');
const postCommentRouter = require('./routes/postCommentRouter');
const postLikeRouter = require('./routes/postLikeRouter');
const postRouter = require('./routes/postRouter');
const sessionRouter = require('./routes/sessionRouter');
const userRouter = require('./routes/userRouter');
require('./configs/mongoConfig');
require('./configs/passportStrategyConfig');
require('dotenv').config();

const server = http.createServer(app);
const io = new Server(server, {
	// TODO change origin to frontend url
	cors: {
		origin: 'http://localhost:3000',
	},
});

io.on('connection', (socket) => {
	socket.emit('welcome', `you have entered the chat, ${socket.id}`);

	socket.broadcast.emit('user', `A user has joined the chat ${socket.id}`);

	socket.on('disconnect', () => {
		io.emit('user', 'A user has left the chat');
	});

	socket.on('send message', (message) => {
		io.emit('message', message);
	});
});

const port = process.env.PORT || 5000;

app.use(logger('dev'));
app.use(cors());

app.get('/', (req, res) => {
	res.json({ msg: 'This is a api server, use /api/resource' });
});

app.use('/api/friends', friendRouter);
app.use('/api/comments', postCommentRouter);
app.use('/api/likes', postLikeRouter);
app.use('/api/posts', postRouter);
app.use('/api/sessions', sessionRouter);
app.use('/api/users', userRouter);

app.use((req, res, next) => {
	next(createError(404));
});

server.listen(port, () => {
	console.log(`Server running on port ${port}`);
});
