const router = require('express').Router();
const { body, param } = require('express-validator');   // ← This line is critical
const adminController = require('../../controllers/adminController');
const invitationController = require('../../controllers/invitationController'); // separate for public accept
const { requireAuth, requireRole } = require('../../middleware/auth');
const { apiLimiter, publicReadLimiter } = require('../../middleware/rateLimit');
const csrfProtection = require('../../middleware/security').csrfProtection;
const { handleValidationErrors } = require('../../middleware/validation');

// User management
router.get('/admin/users', requireAuth, requireRole('owner'), apiLimiter, adminController.getAllUsers);
router.post('/admin/users', requireAuth, requireRole('owner'), apiLimiter, csrfProtection, [
    body('email').isEmail(),
    body('password').isLength({ min: 8 }),
    body('role').isIn(['owner','member'])
], handleValidationErrors, adminController.createUser);
router.patch('/admin/users/:userId', requireAuth, requireRole('owner'), apiLimiter, csrfProtection, [
    param('userId').isUUID(),
    body('role').isIn(['owner','member'])
], handleValidationErrors, adminController.updateUserRole);
router.delete('/admin/users/:userId', requireAuth, requireRole('owner'), apiLimiter, csrfProtection, [
    param('userId').isUUID()
], handleValidationErrors, adminController.deleteUser);

// Invitations
router.get('/admin/invitations', requireAuth, requireRole('owner'), apiLimiter, adminController.listInvitations);
router.post('/admin/invitations', requireAuth, requireRole('owner'), apiLimiter, csrfProtection, [
    body('email').isEmail(),
    body('role').isIn(['owner','member'])
], handleValidationErrors, adminController.createInvitation);
router.post('/admin/invitations/:invitationId/retry', requireAuth, requireRole('owner'), apiLimiter, csrfProtection, [
    param('invitationId').isUUID()
], handleValidationErrors, adminController.retryInvitation);
router.delete('/admin/invitations/:invitationId', requireAuth, requireRole('owner'), apiLimiter, csrfProtection, [
    param('invitationId').isUUID()
], handleValidationErrors, adminController.deleteInvitation);

// Public invitation acceptance
router.get('/invitations/:token', publicReadLimiter, [
    param('token').isLength({ min: 64, max: 64 })
], handleValidationErrors, invitationController.getInvitation);
router.post('/invitations/:token/accept', publicReadLimiter, [
    param('token').isLength({ min: 64, max: 64 }),
    body('password').isLength({ min: 8 })
], handleValidationErrors, invitationController.acceptInvitation);

// Logs
router.get('/admin/logs', requireAuth, apiLimiter, adminController.getLogs);

module.exports = router;