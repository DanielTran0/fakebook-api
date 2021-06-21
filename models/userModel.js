const mongoose = require('mongoose');

const { Schema } = mongoose;
const userSchema = new Schema({
	email: { type: String, required: true },
	password: { type: String },
	firstName: { type: String, required: true },
	lastName: { type: String, required: true },
	profileImage: { type: String, default: '' },
	backgroundImage: { type: String, default: '' },
	friends: [
		{
			user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
			status: {
				type: String,
				required: true,
				enum: ['friends', 'incoming', 'outgoing'],
			},
		},
	],
	facebookId: { type: String, default: '' },
});

userSchema.virtual('coreDetails').get(function getCoreDetails() {
	return {
		_id: this._id,
		firstName: this.firstName,
		lastName: this.lastName,
		email: this.email,
		profileImage: this.profileImage,
		backgroundImage: this.backgroundImage,
		facebookId: this.facebookId,
	};
});

module.exports = mongoose.model('User', userSchema);
