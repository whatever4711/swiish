const router = require('express').Router();
const { body, param } = require('express-validator');   // ← This line is critical
const setupController = require('../../controllers/setupController');
const { apiLimiter } = require('../../middleware/rateLimit');
const csrfProtection = require('../../middleware/security').csrfProtection;
const { handleValidationErrors } = require('../../middleware/validation');

router.get('/setup/status', apiLimiter, setupController.setupStatus);
router.post('/setup/initialize', apiLimiter, csrfProtection, [
    body('organisationName').trim().isLength({ min: 1, max: 200 }),
    body('adminEmail').isEmail(),
    body('adminPassword').isLength({ min: 8 })
], handleValidationErrors, setupController.initialize);

module.exports = router;