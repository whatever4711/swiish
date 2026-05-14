const router = require('express').Router();
const { body, param } = require('express-validator');   // ← This line is critical
const qrController = require('../../controllers/qrController');
const { publicReadLimiter } = require('../../middleware/rateLimit');
const { handleValidationErrors } = require('../../middleware/validation');

router.get('/qr/:identifier', publicReadLimiter, [
    param('identifier').matches(/^[a-zA-Z0-9-]+$/)
], handleValidationErrors, qrController.generateQR);
router.post('/qr/:identifier', publicReadLimiter, [
    param('identifier').matches(/^[a-zA-Z0-9-]+$/),
    body('payload').optional().isString().isLength({ max: 5000 })
], handleValidationErrors, qrController.generateQR);

module.exports = router;