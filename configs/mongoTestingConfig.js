const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const mongoServer = new MongoMemoryServer();

module.exports.dbConnect = async () => {
	const uri = await mongoServer.getUri();
	const mongooseOpts = {
		useNewUrlParser: true,
		useUnifiedTopology: true,
		useFindAndModify: false,
	};
	await mongoose.connect(uri, mongooseOpts, (err) => {
		if (err) console.log(err);
	});
};

module.exports.dbDisconnect = async () => {
	await mongoose.connection.close();
	await mongoServer.stop();
};
