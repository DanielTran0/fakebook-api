const cors = require('cors');
const createError = require('http-errors');
const logger = require('morgan');
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

const port = process.env.PORT || 3000;

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

app.listen(port, () => {
	console.log(`listening on http://localhost:${port}`);
});
