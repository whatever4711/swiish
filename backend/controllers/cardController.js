const Card = require('../models/Card');
const OrganisationSetting = require('../models/OrganisationSetting');
const { invalidateCache } = require('../services/previewCacheService');
const { slugify } = require('../utils/slugify');
const sanitize = require('validator');

exports.getPublicCard = async (req, res, next) => {
    try {
        let card;
        if (req.params.shortCode) {
            card = await Card.findByShortCode(req.params.shortCode);
        } else if (req.params.orgSlug && req.params.cardSlug) {
            card = await Card.findByOrgSlugAndCardSlug(req.params.orgSlug, req.params.cardSlug);
        } else if (req.params.slug) {
            // fallback legacy: find first by slug (no org)
            const db = require('../config/database');
            card = await db.getAsync("SELECT c.data, c.short_code FROM cards c WHERE c.slug = ? LIMIT 1", [req.params.slug]);
            if (card) card.orgSlug = null;
        }
        if (!card) return res.status(404).json({ error: 'Card not found' });
        const cardData = JSON.parse(card.data);
        cardData._shortCode = card.short_code;
        if (card.orgSlug) cardData._orgSlug = card.orgSlug;
        res.json(cardData);
    } catch (err) { next(err); }
};

exports.saveCard = async (req, res, next) => {
    try {
        const slug = req.params.slug.toLowerCase();
        let targetUserId = req.user.id;
        if (req.body.userId && req.user.role === 'owner') {
            const db = require('../config/database');
            const targetUser = await db.getAsync("SELECT id, organisation_id FROM users WHERE id = ?", [req.body.userId]);
            if (!targetUser || targetUser.organisation_id !== req.user.organisationId) {
                return res.status(403).json({ error: 'Cannot create card for user outside your organisation' });
            }
            targetUserId = req.body.userId;
        }

        // Apply organisation overrides
        const orgSettings = await OrganisationSetting.getAll(req.user.organisationId);
        let sanitizedData = { ...req.body };
        if (orgSettings.default_organisation) {
            sanitizedData.personal = sanitizedData.personal || {};
            sanitizedData.personal.company = orgSettings.default_organisation;
        }
        if (!orgSettings.allow_theme_customisation && sanitizedData.theme?.color) {
            const allowedColors = orgSettings.theme_colors || [];
            const colorExists = allowedColors.some(c => c.name === sanitizedData.theme.color);
            if (!colorExists) sanitizedData.theme.color = allowedColors[0]?.name || 'indigo';
        }
        if (!orgSettings.allow_image_customisation) {
            sanitizedData.images = { avatar: '', banner: '' };
        }
        if (!orgSettings.allow_links_customisation) {
            sanitizedData.links = [];
        }
        if (!orgSettings.allow_privacy_customisation) {
            // keep existing privacy settings
            const existingCard = await Card.findBySlugAndUserId(slug, targetUserId);
            if (existingCard) {
                const existingData = JSON.parse(existingCard.data);
                sanitizedData.privacy = existingData.privacy || { requireInteraction: true, clientSideObfuscation: false, blockRobots: false };
            } else {
                sanitizedData.privacy = { requireInteraction: true, clientSideObfuscation: false, blockRobots: false };
            }
        }

        const shortCode = await Card.createOrUpdate(slug, targetUserId, sanitizedData);
        await invalidateCache(slug, shortCode);
        res.json({ success: true, slug, shortCode });
    } catch (err) { next(err); }
};

exports.deleteCard = async (req, res, next) => {
    try {
        const slug = req.params.slug.toLowerCase();
        let targetUserId = req.user.id;
        const requestedUserId = req.query.userId;
        if (req.user.role === 'owner' && requestedUserId && requestedUserId !== req.user.id) {
            const db = require('../config/database');
            const user = await db.getAsync("SELECT id FROM users WHERE id = ? AND organisation_id = (SELECT organisation_id FROM users WHERE id = ?)", [requestedUserId, req.user.id]);
            if (!user) return res.status(404).json({ error: 'User not found in your organisation' });
            targetUserId = requestedUserId;
        }
        const card = await Card.findBySlugAndUserId(slug, targetUserId);
        if (!card) return res.status(404).json({ error: 'Card not found' });
        await Card.delete(slug, targetUserId);
        await invalidateCache(slug, card.short_code);
        res.json({ success: true });
    } catch (err) { next(err); }
};

exports.getAllCardsForDashboard = async (req, res, next) => {
    try {
        const isOwner = req.user.role === 'owner';
        if (isOwner && req.user.organisationId) {
            const rows = await Card.getAllForOrganisation(req.user.organisationId);
            const list = rows.map(row => {
                let name = '', title = '', avatar = null, email = '';
                if (row.data) {
                    try {
                        const parsed = JSON.parse(row.data);
                        const prefix = parsed.personal?.prefix ? parsed.personal.prefix + ' ' : '';
                        const suffix = parsed.personal?.suffix ? ' ' + parsed.personal.suffix : '';
                        const first = (parsed.personal?.firstName || '').trim();
                        const middle = parsed.personal?.middleName ? ' ' + parsed.personal.middleName : '';
                        const last = (parsed.personal?.lastName || '').trim();
                        name = `${prefix}${first}${middle}${last}${suffix}`.trim();
                        title = parsed.personal?.title || '';
                        avatar = parsed.images?.avatar || null;
                        email = (parsed.contact?.email || '').toLowerCase();
                    } catch(e) { name = 'Invalid data'; }
                }
                return {
                    userId: row.user_id,
                    userEmail: row.user_email,
                    userRole: row.user_role,
                    userCreatedAt: row.user_created_at,
                    slug: row.slug,
                    shortCode: row.short_code,
                    name, title, avatar, email
                };
            });
            res.json(list);
        } else {
            const db = require('../config/database');
            let query, params;
            if (isOwner) {
                query = `SELECT c.slug, c.short_code, c.data, o.slug as org_slug FROM cards c JOIN users u ON c.user_id = u.id LEFT JOIN organisations o ON u.organisation_id = o.id WHERE c.user_id = ? ORDER BY c.created_at DESC`;
                params = [req.user.id];
            } else {
                query = `SELECT c.slug, c.short_code, c.data, o.slug as org_slug FROM cards c JOIN users u ON c.user_id = u.id LEFT JOIN organisations o ON u.organisation_id = o.id WHERE c.user_id = ?`;
                params = [req.user.id];
            }
            const rows = await db.allAsync(query, params);
            const list = rows.map(row => {
                try {
                    const parsed = JSON.parse(row.data);
                    const prefix = parsed.personal?.prefix ? parsed.personal.prefix + ' ' : '';
                    const suffix = parsed.personal?.suffix ? ' ' + parsed.personal.suffix : '';
                    const first = (parsed.personal?.firstName || '').trim();
                    const middle = parsed.personal?.middleName ? ' ' + parsed.personal.middleName : '';
                    const last = (parsed.personal?.lastName || '').trim();
                    const name = `${prefix}${first}${middle}${last}${suffix}`.trim();
                    return {
                        slug: row.slug,
                        shortCode: row.short_code,
                        orgSlug: row.org_slug,
                        name,
                        title: parsed.personal?.title || '',
                        avatar: parsed.images?.avatar || null,
                        email: (parsed.contact?.email || '').toLowerCase()
                    };
                } catch(e) {
                    return { slug: row.slug, shortCode: row.short_code, orgSlug: row.org_slug, name: 'Invalid data' };
                }
            });
            res.json(list);
        }
    } catch (err) { next(err); }
};