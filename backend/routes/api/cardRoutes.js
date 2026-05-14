const router = require('express').Router();
const cardController = require('../../controllers/cardController');
const { requireAuth, requireRole } = require('../../middleware/auth');
const { slugValidation, cardDataValidation, handleValidationErrors, identifierValidation } = require('../../middleware/validation');
const { apiLimiter, cardReadLimiter, shortCodeLimiter } = require('../../middleware/rateLimit');
const {param} = require("express-validator");
const csrfProtection = require('../../middleware/security').csrfProtection;

// Public
router.get('/cards/short/:shortCode', cardReadLimiter, cardController.getPublicCard);
router.get('/cards/:orgSlug/:cardSlug', cardReadLimiter, cardController.getPublicCard);
router.get('/cards/:slug', cardReadLimiter, slugValidation, cardController.getPublicCard); // legacy

// Authenticated
router.get('/admin/cards', requireAuth, apiLimiter, cardController.getAllCardsForDashboard);
router.get('/admin/cards/:userId/:slug', requireAuth, requireRole('owner'), apiLimiter, [
    param('userId').isUUID(),
    slugValidation
], handleValidationErrors, cardController.getPublicCard); // reuse

router.post('/cards/:slug', requireAuth, apiLimiter, csrfProtection, slugValidation, cardDataValidation, handleValidationErrors, cardController.saveCard);
router.delete('/cards/:slug', requireAuth, apiLimiter, csrfProtection, slugValidation, handleValidationErrors, cardController.deleteCard);

module.exports = router;