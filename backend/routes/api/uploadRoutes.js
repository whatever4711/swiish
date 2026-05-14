const router = require('express').Router();
const uploadController = require('../../controllers/uploadController');
const { requireAuth } = require('../../middleware/auth');
const { uploadLimiter } = require('../../middleware/rateLimit');
const csrfProtection = require('../../middleware/security').csrfProtection;

router.post('/upload', requireAuth, uploadLimiter, csrfProtection, uploadController.uploadImage);

module.exports = router;