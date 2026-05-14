const jwt = require('jsonwebtoken');
const env = require('../config/env');
const db = require('../config/database');
const { getDemoUserId } = require('../services/demoService');

const requireAuth = (req, res, next) => {
    // Demo mode auto-login
    if (env.DEMO_MODE) {
        const demoUserId = getDemoUserId();
        if (demoUserId) {
            db.get('SELECT id, role, organisation_id FROM users WHERE id = ?', [demoUserId], (err, row) => {
                if (err || !row) return res.status(401).json({ error: 'Demo user not found' });
                req.user = { id: row.id, organisationId: row.organisation_id, role: row.role };
                next();
            });
            return;
        }
    }

    const token = req.cookies.authToken || (req.headers.authorization && req.headers.authorization.replace('Bearer ', ''));
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    try {
        const decoded = jwt.verify(token, env.JWT_SECRET);
        if (decoded.user_id) {
            req.user = {
                id: decoded.user_id,
                organisationId: decoded.organisation_id || null,
                role: decoded.role || 'member'
            };
        } else if (decoded.admin) {
            req.user = { id: null, organisationId: null, role: 'admin' };
        } else {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
};

const requireRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
        if (!allowedRoles.includes(req.user.role)) return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
        next();
    };
};

module.exports = { requireAuth, requireRole };