const router = require('express').Router();
const { body, param } = require('express-validator');  // ← add this
const authController = require('../../controllers/authController');
const { requireAuth } = require('../../middleware/auth');
const { loginLimiter, apiLimiter } = require('../../middleware/rateLimit');
const { handleValidationErrors } = require('../../middleware/validation');
const csrfProtection = require('../../middleware/security').csrfProtection;

router.post('/login', loginLimiter, [
    body('email').isEmail(),
    body('password').notEmpty()
], handleValidationErrors, authController.login);
router.post('/logout', authController.logout);
router.get('/auth/me', requireAuth, apiLimiter, authController.me);
router.post('/auth/forgot-password', apiLimiter, [
    body('email').isEmail()
], handleValidationErrors, authController.forgotPassword);
router.post('/auth/reset-password', apiLimiter, [
    body('token').isLength({ min: 64, max: 64 }),
    body('password').isLength({ min: 8 })
], handleValidationErrors, authController.resetPassword);
router.post('/auth/change-password', requireAuth, apiLimiter, csrfProtection, [
    body('currentPassword').notEmpty(),
    body('newPassword').isLength({ min: 8 })
], handleValidationErrors, authController.changePassword);
router.post('/auth/send-verification', requireAuth, apiLimiter, csrfProtection, authController.sendVerificationEmail);
router.get('/auth/verify-email/:token', apiLimiter, [
    param('token').isLength({ min: 64, max: 64 })
], handleValidationErrors, authController.verifyEmail);

module.exports = router;