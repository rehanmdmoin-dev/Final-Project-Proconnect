const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ApiError = require('../utils/ApiError');

// Multer needs this directory to exist before the first upload, and it
// won't create it itself - a fresh clone/deploy would otherwise fail.
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `${unique}${path.extname(file.originalname)}`);
    },
});

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const DOC_TYPES = ['application/pdf', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

const buildFilter = (allowed) => (req, file, cb) => {
    if (allowed.includes(file.mimetype)) return cb(null, true);
    cb(new ApiError(400, `Invalid file type. Allowed: ${allowed.join(', ')}`));
};

const uploadImage = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: buildFilter(IMAGE_TYPES),
});

const uploadResume = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: buildFilter(DOC_TYPES),
});

module.exports = { uploadImage, uploadResume, uploadDir };
