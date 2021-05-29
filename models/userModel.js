const mongoose = require('mongoose');

const { Schema } = mongoose;
const userSchema = new Schema({
	email: { type: String, required: true },
	password: { type: String, required: true },
	firstName: { type: String, required: true },
	lastName: { type: String, required: true },
	profileImage: { type: String },
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
});

userSchema.virtual('coreDetails').get(function getCoreDetails() {
	return {
		_id: this._id,
		email: this.email,
		firstName: this.firstName,
		lastName: this.lastName,
		profileImage: this.profileImage,
	};
});

module.exports = mongoose.model('User', userSchema);
