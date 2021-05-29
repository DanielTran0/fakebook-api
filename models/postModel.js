const mongoose = require('mongoose');

const { Schema } = mongoose;
const postSchema = new Schema({
	user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
	text: { type: String, required: true },
	postImage: { type: String },
	date: { type: Date, default: Date.now() },
	likes: [
		{
			user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
		},
	],
	comments: [
		{
			user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
			text: { type: String, required: true },
			date: { type: Date, default: Date.now() },
		},
	],
});

module.exports = mongoose.model('Post', postSchema);
