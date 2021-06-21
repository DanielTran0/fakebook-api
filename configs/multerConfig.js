const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		if (file.fieldname === 'postImage') return cb(null, 'public/images/posts');

		return cb(null, 'public/images/users');
	},
	filename: (req, file, cb) => {
		cb(
			null,
			`${file.fieldname}-${req.user._id}-${Date.now()}${path.extname(
				file.originalname
			)}`
		);
	},
});

const checkFileType = (req, file, cb) => {
	const fileTypes = /jpeg|jpg|png|gif/;
	const validExtname = fileTypes.test(
		path.extname(file.originalname).toLowerCase()
	);
	const validMimetype = fileTypes.test(file.mimetype);

	if (validExtname && validMimetype) return cb(null, true);

	return cb({ msg: 'Only upload images.', param: 'general' });
};

const upload = (imageFieldname) => {
	return multer({
		storage,
		limits: { fileSize: 1500000 },
		fileFilter: (req, file, cb) => {
			checkFileType(req, file, cb);
		},
	}).single(imageFieldname);
};

module.exports = upload;
