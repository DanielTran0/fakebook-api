const logger = require('morgan');
const createError = require('http-errors');
const cors = require('cors');
const app = require('./configs/appConfig');
const postRouter = require('./routes/postRouter');
require('dotenv').config();
require('./configs/mongoConfig');

const port = process.env.PORT || 3000;

app.use(logger('dev'));
app.use(cors());

app.get('/', (req, res) => {
	res.send('hello');
});

app.use('/posts', postRouter);

app.use((req, res, next) => {
	next(createError(404));
});

app.listen(port, () => {
	console.log(`listening on http://localhost:${port}`);
});
