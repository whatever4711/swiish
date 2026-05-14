const User = require('../models/User');
const Organisation = require('../models/Organisation');
const OrganisationSetting = require('../models/OrganisationSetting');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const constants = require('../config/constants');
const slugify = require('../utils/slugify');
const jwt = require('jsonwebtoken');
const env = require('../config/env');

exports.setupStatus = async (req, res, next) => {
    try {
        const db = require('../config/database');
        const row = await db.getAsync("SELECT COUNT(*) as count FROM users");
        res.json({ setupComplete: row.count > 0, userCount: row.count, demoMode: env.DEMO_MODE });
    } catch (err) { next(err); }
};

exports.initialize = async (req, res, next) => {
    try {
        const db = require('../config/database');
        const row = await db.getAsync("SELECT COUNT(*) as count FROM users");
        if (row.count > 0) return res.status(403).json({ error: 'Setup already completed' });
        const { organisationName, adminEmail, adminPassword } = req.body;
        let slug = slugify(organisationName) || 'organisation';
        let finalSlug = slug;
        let counter = 0;
        while (await Organisation.findBySlug(finalSlug)) {
            counter++;
            finalSlug = `${slug}-${counter}`;
        }
        const orgId = crypto.randomUUID();
        await Organisation.create({ id: orgId, name: organisationName, slug: finalSlug, subscriptionTier: 'individual' });
        const passwordHash = await bcrypt.hash(adminPassword, 10);
        const userId = crypto.randomUUID();
        await User.create({ id: userId, email: adminEmail.toLowerCase(), passwordHash, organisationId: orgId, role: 'owner', emailVerified: 0 });
        await OrganisationSetting.set(orgId, 'default_organisation', organisationName);
        await OrganisationSetting.set(orgId, 'theme_colors', JSON.stringify(constants.DEFAULT_THEME_COLORS));
        await OrganisationSetting.set(orgId, 'allow_theme_customisation', 'true');
        await OrganisationSetting.set(orgId, 'allow_image_customisation', 'true');
        await OrganisationSetting.set(orgId, 'allow_links_customisation', 'true');
        await OrganisationSetting.set(orgId, 'allow_privacy_customisation', 'true');
        const token = jwt.sign({ user_id: userId, organisation_id: orgId, role: 'owner' }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
        res.cookie('authToken', token, { httpOnly: true, secure: env.NODE_ENV === 'production', sameSite: 'strict', maxAge: 24*60*60*1000 });
        res.json({ success: true, userId, email: adminEmail.toLowerCase(), role: 'owner' });
    } catch (err) { next(err); }
};