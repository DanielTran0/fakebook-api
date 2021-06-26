const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

require('dotenv').config();

cloudinary.config({
	cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET,
	secure: true,
});

const generateImageFolder = (req) => {
	if (req.file.fieldname === 'postImage') return 'posts';

	return 'users';
};

const generateImageName = (req) => {
	const { _id, firstName, lastName } = req.user;

	return `${firstName}-${lastName}-${_id}-${Date.now()}`;
};

const streamUpload = (req) => {
	return new Promise((resolve, reject) => {
		const stream = cloudinary.uploader.upload_stream(
			{ folder: generateImageFolder(req), public_id: generateImageName(req) },
			(error, result) => {
				if (result) resolve(result);

				reject(error);
			}
		);

		streamifier.createReadStream(req.file.buffer).pipe(stream);
	});
};

module.exports = { streamUpload, cloudinary };
