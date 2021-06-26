const multer = require('multer');
const path = require('path');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
	const fileTypes = /jpeg|jpg|png|gif/;
	const validExtension = fileTypes.test(
		path.extname(file.originalname).toLowerCase()
	);
	const validMimetype = fileTypes.test(file.mimetype);

	if (validExtension && validMimetype) return cb(null, true);

	return cb({ msg: 'Only upload images.', param: 'general' });
};

const upload = (imageFieldname) => {
	return multer({
		storage,
		fileFilter,
		limits: { fileSize: 5000000 },
	}).single(imageFieldname);
};

module.exports = upload;
