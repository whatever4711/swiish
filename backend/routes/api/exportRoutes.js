const router = require('express').Router();
const { param, query } = require('express-validator');   // ← This line is critical
const exportController = require('../../controllers/exportController');
const { publicReadLimiter } = require('../../middleware/rateLimit');
const { handleValidationErrors } = require('../../middleware/validation');

router.post('/cards/:shortCode/export-pdf', publicReadLimiter, [
    param('shortCode').matches(/^[a-zA-Z0-9]{7}$/),
    query('format').optional().isIn(['pdf','tex']),
    query('layout').optional().isIn(['single','a4'])
], handleValidationErrors, exportController.exportPdf);

module.exports = router;