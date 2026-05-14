const OrganisationSetting = require('../models/OrganisationSetting');
const constants = require('../config/constants');

exports.getSettings = async (req, res, next) => {
    try {
        const orgSlug = req.query.orgSlug || 'default';
        const db = require('../config/database');
        const rows = await db.allAsync(`
      SELECT os.key, os.value 
      FROM organisation_settings os
      JOIN organisations o ON os.organisation_id = o.id
      WHERE o.slug = ? AND os.key IN ('theme_colors', 'theme_variant', 'default_organisation')
    `, [orgSlug]);
        const settings = {};
        for (const row of rows) {
            if (row.key === 'theme_colors') settings.theme_colors = JSON.parse(row.value);
            else if (row.key === 'theme_variant') settings.theme_variant = row.value;
            else settings[row.key] = row.value;
        }
        settings.theme_colors = settings.theme_colors || constants.DEFAULT_THEME_COLORS;
        settings.theme_variant = settings.theme_variant || 'swiish';
        settings.default_organisation = settings.default_organisation || 'My Organisation';
        res.json(settings);
    } catch (err) { next(err); }
};

exports.getAdminSettings = async (req, res, next) => {
    try {
        if (!req.user.organisationId) return res.status(401).json({ error: 'Unauthorized' });
        const settings = await OrganisationSetting.getAll(req.user.organisationId);
        settings.default_organisation = settings.default_organisation || 'My Organisation';
        settings.theme_colors = settings.theme_colors || constants.DEFAULT_THEME_COLORS;
        settings.theme_variant = settings.theme_variant || 'swiish';
        settings.allow_theme_customisation = settings.allow_theme_customisation !== undefined ? settings.allow_theme_customisation : true;
        settings.allow_image_customisation = settings.allow_image_customisation !== undefined ? settings.allow_image_customisation : true;
        settings.allow_links_customisation = settings.allow_links_customisation !== undefined ? settings.allow_links_customisation : true;
        settings.allow_privacy_customisation = settings.allow_privacy_customisation !== undefined ? settings.allow_privacy_customisation : true;
        res.json(settings);
    } catch (err) { next(err); }
};

exports.updateAdminSettings = async (req, res, next) => {
    try {
        if (!req.user.organisationId) return res.status(401).json({ error: 'Unauthorized' });
        const { default_organisation, theme_colors, theme_variant, allow_theme_customisation, allow_image_customisation, allow_links_customisation, allow_privacy_customisation } = req.body;
        if (default_organisation !== undefined) {
            await OrganisationSetting.set(req.user.organisationId, 'default_organisation', default_organisation.trim().substring(0,200));
        }
        if (theme_colors !== undefined && Array.isArray(theme_colors)) {
            await OrganisationSetting.set(req.user.organisationId, 'theme_colors', JSON.stringify(theme_colors));
        }
        if (theme_variant !== undefined) {
            await OrganisationSetting.set(req.user.organisationId, 'theme_variant', theme_variant.trim().substring(0,50));
        }
        const toggles = ['allow_theme_customisation', 'allow_image_customisation', 'allow_links_customisation', 'allow_privacy_customisation'];
        for (const toggle of toggles) {
            if (req.body[toggle] !== undefined && typeof req.body[toggle] === 'boolean') {
                await OrganisationSetting.set(req.user.organisationId, toggle, req.body[toggle] ? 'true' : 'false');
            }
        }
        res.json({ success: true });
    } catch (err) { next(err); }
};