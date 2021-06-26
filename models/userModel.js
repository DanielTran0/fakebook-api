const mongoose = require('mongoose');

const { Schema } = mongoose;
const userSchema = new Schema({
	email: { type: String, required: true },
	password: { type: String },
	firstName: { type: String, required: true },
	lastName: { type: String, required: true },
	profileImage: { type: String, default: '' },
	profileImageUrl: { type: String, default: '' },
	backgroundImage: { type: String, default: '' },
	backgroundImageUrl: { type: String, default: '' },
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
	isAdmin: { type: Boolean, default: false },
	isTest: { type: Boolean, default: false },
});

userSchema.virtual('coreDetails').get(function getCoreDetails() {
	return {
		_id: this._id,
		firstName: this.firstName,
		lastName: this.lastName,
		email: this.email,
		profileImageUrl: this.profileImageUrl,
		backgroundImageUrl: this.backgroundImageUrl,
		facebookId: this.facebookId,
	};
});

module.exports = mongoose.model('User', userSchema);
