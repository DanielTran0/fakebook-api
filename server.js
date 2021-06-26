const cors = require('cors');
const createError = require('http-errors');
const logger = require('morgan');
const http = require('http');
const { Server } = require('socket.io');
const compression = require('compression');
const helmet = require('helmet');

const app = require('./configs/appConfig');
const friendRouter = require('./routes/friendRouter');
const postCommentRouter = require('./routes/postCommentRouter');
const postLikeRouter = require('./routes/postLikeRouter');
const postRouter = require('./routes/postRouter');
const tokenRouter = require('./routes/tokenRouter');
const userRouter = require('./routes/userRouter');
const { userJoin, userLeave, getAllUsers } = require('./chatUtil');
require('./configs/mongoConfig');
require('./configs/passportStrategyConfig');
require('./configs/cloudinaryConfig');
require('dotenv').config();

const server = http.createServer(app);
const io = new Server(server, {
	// TODO change origin to frontend url
	cors: {
		origin: true,
	},
});

io.on('connection', (socket) => {
	socket.on('joinRoom', (user) => {
		userJoin({ ...user, chatId: socket.id });
		io.emit('currentUsers', getAllUsers());
	});

	socket.on('send message', (message) => {
		io.emit('message', message);
	});

	socket.on('disconnect', () => {
		userLeave(socket.id);
		io.emit('currentUsers', getAllUsers());
	});
});

const port = process.env.PORT || 5000;

app.use(logger('dev'));
app.use(cors());
app.use(compression());
app.use(helmet());

app.get('/', (req, res) => {
	res.json({ msg: 'This is a api server, use /api/resource' });
});

app.use('/api/friends', friendRouter);
app.use('/api/comments', postCommentRouter);
app.use('/api/likes', postLikeRouter);
app.use('/api/posts', postRouter);
app.use('/api/tokens', tokenRouter);
app.use('/api/users', userRouter);

app.use((req, res, next) => {
	next(createError(404));
});

server.listen(port, () => {
	console.log(`Server running on port ${port}`);
});
