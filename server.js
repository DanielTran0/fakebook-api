const logger = require('morgan');
const createError = require('http-errors');
const cors = require('cors');
const app = require('./configs/appConfig');
require('dotenv').config();
require('./configs/mongoConfig');

const port = process.env.PORT || 3000;

app.use(logger('dev'));
app.use(cors());

app.use((req, res, next) => {
	next(createError(404));
});

app.listen(port, () => {
	console.log(`listening on http://localhost:${port}`);
});
