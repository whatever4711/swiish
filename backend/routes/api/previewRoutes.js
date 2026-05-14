const router = require('express').Router();
const { body, param } = require('express-validator');   // ← This line is critical
const previewController = require('../../controllers/previewController');
const { cardReadLimiter } = require('../../middleware/rateLimit');
const { identifierValidation, handleValidationErrors } = require('../../middleware/validation');

router.get('/cards/:identifier/preview.png', cardReadLimiter, identifierValidation, handleValidationErrors, previewController.generatePreview);

module.exports = router;