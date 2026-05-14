const router = require('express').Router();
const authRoutes = require('./api/authRoutes');
const cardRoutes = require('./api/cardRoutes');
const organisationRoutes = require('./api/organisationRoutes');
const adminRoutes = require('./api/adminRoutes');
const uploadRoutes = require('./api/uploadRoutes');
const previewRoutes = require('./api/previewRoutes');
const qrRoutes = require('./api/qrRoutes');
const exportRoutes = require('./api/exportRoutes');
const setupRoutes = require('./api/setupRoutes');

router.use('/api', authRoutes);
router.use('/api', cardRoutes);
router.use('/api', organisationRoutes);
router.use('/api', adminRoutes);
router.use('/api', uploadRoutes);
router.use('/api', previewRoutes);
router.use('/api', qrRoutes);
router.use('/api', exportRoutes);
router.use('/api', setupRoutes);

// CSRF token endpoint
const csrfProtection = require('../middleware/security').csrfProtection;
router.get('/api/csrf-token', csrfProtection, (req, res) => {
    res.json({ csrfToken: req.csrfToken() });
});

// Demo status endpoint
const env = require('../config/env');
router.get('/api/demo/status', (req, res) => {
    res.json({ demoMode: env.DEMO_MODE, resetInterval: 60 });
});

module.exports = router;