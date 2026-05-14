const { body, param, validationResult } = require('express-validator');
const validator = require('validator');

const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const firstError = errors.array()[0];
        return res.status(400).json({ error: firstError.msg });
    }
    next();
};

const slugValidation = param('slug')
    .trim()
    .matches(/^[a-z0-9-]+$/)
    .withMessage('Slug must contain only lowercase letters, numbers, and hyphens')
    .isLength({ min: 1, max: 50 });

const identifierValidation = param('slug')
    .trim()
    .matches(/^[a-zA-Z0-9-]+$/)
    .withMessage('Identifier must contain only letters, numbers, and hyphens')
    .isLength({ min: 1, max: 50 });

const cardDataValidation = [
    body('personal.firstName').optional().trim().isLength({ max: 100 }),
    body('personal.lastName').optional().trim().isLength({ max: 100 }),
    body('personal.title').optional().trim().isLength({ max: 200 }),
    body('personal.company').optional().trim().isLength({ max: 200 }),
    body('contact.email').optional().trim().custom(value => {
        if (value && !validator.isEmail(value)) throw new Error('Invalid email');
        return true;
    }),
    body('contact.phone').optional().trim().isLength({ max: 50 }),
    body('contact.website').optional().trim().custom(value => {
        if (value && !validator.isURL(value, { protocols: ['http','https'] })) throw new Error('Invalid URL');
        return true;
    }),
    body('links').optional().isArray(),
    body('images.avatar').optional().isString().isLength({ max: 500 }),
    body('privacy.requireInteraction').optional().isBoolean(),
    body('privacy.clientSideObfuscation').optional().isBoolean(),
    body('privacy.blockRobots').optional().isBoolean()
];

module.exports = {
    handleValidationErrors,
    slugValidation,
    identifierValidation,
    cardDataValidation
};