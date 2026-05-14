const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { randomUUID } = require('crypto');
const env = require('../config/env');
const constants = require('../config/constants');
const { validateFilePath } = require('../utils/file');

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, env.UPLOADS_DIR),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        if (!constants.ALLOWED_EXTENSIONS.includes(ext)) return cb(new Error('Invalid file type'));
        cb(null, randomUUID() + ext);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: env.MAX_FILE_SIZE },
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        if (!constants.ALLOWED_EXTENSIONS.includes(ext)) return cb(new Error('Invalid extension'));
        cb(null, true);
    }
}).single('file');

exports.uploadImage = async (req, res, next) => {
    upload(req, res, async (err) => {
        if (err) return res.status(400).json({ error: err.message });
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
        try {
            const { fileTypeFromFile } = await import('file-type');
            const fileType = await fileTypeFromFile(req.file.path);
            if (!fileType || !constants.ALLOWED_MIME_TYPES.includes(fileType.mime)) {
                await fs.unlink(req.file.path);
                return res.status(400).json({ error: 'Invalid file type' });
            }
            const ext = path.extname(req.file.filename).toLowerCase();
            const expectedExt = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif' };
            if (expectedExt[fileType.mime] !== ext) {
                await fs.unlink(req.file.path);
                return res.status(400).json({ error: 'Extension does not match file type' });
            }
            res.json({ url: `/uploads/${req.file.filename}` });
        } catch (e) {
            if (req.file.path) await fs.unlink(req.file.path).catch(() => {});
            next(e);
        }
    });
};