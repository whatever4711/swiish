const router = require('express').Router();
const organisationController = require('../../controllers/organisationController');
const { requireAuth, requireRole } = require('../../middleware/auth');
const { apiLimiter } = require('../../middleware/rateLimit');
const csrfProtection = require('../../middleware/security').csrfProtection;

router.get('/settings', apiLimiter, organisationController.getSettings);
router.get('/admin/settings', requireAuth, requireRole('owner'), apiLimiter, organisationController.getAdminSettings);
router.post('/admin/settings', requireAuth, requireRole('owner'), apiLimiter, csrfProtection, organisationController.updateAdminSettings);

module.exports = router;