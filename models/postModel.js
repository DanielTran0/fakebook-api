const mongoose = require('mongoose');

const { Schema } = mongoose;
const postSchema = new Schema({
	user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
	text: { type: String, default: '' },
	postImage: { type: String },
	date: { type: Date, default: Date.now },
	likes: [
		{
			user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
		},
	],
	comments: [
		{
			user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
			text: { type: String, required: true },
			date: { type: Date, default: Date.now },
			likes: [
				{
					user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
				},
			],
		},
	],
});

postSchema.virtual('coreDetails').get(function getCoreDetails() {
	return {
		_id: this._id,
		user: this.user,
		text: this.text,
		postImage: this.postImage,
		date: this.date,
		likes: this.likes,
		comments: this.comments,
	};
});

module.exports = mongoose.model('Post', postSchema);
