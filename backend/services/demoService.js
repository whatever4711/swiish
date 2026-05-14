const db = require('../config/database');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const env = require('../config/env');
const constants = require('../config/constants');
const User = require('../models/User');
const Organisation = require('../models/Organisation');
const OrganisationSetting = require('../models/OrganisationSetting');
const Card = require('../models/Card');

let DEMO_USER_ID = null;

async function seedDemoData() {
    if (!env.DEMO_MODE) return;

    console.log('[DEMO MODE] Seeding fresh demo data...');

    // Clean existing demo data (by email domain)
    await db.runAsync(`DELETE FROM cards WHERE user_id IN (SELECT id FROM users WHERE email LIKE ?)`, ['%@demonstraight.com']);
    await db.runAsync(`DELETE FROM user_settings WHERE user_id IN (SELECT id FROM users WHERE email LIKE ?)`, ['%@demonstraight.com']);
    await db.runAsync(`DELETE FROM users WHERE email LIKE ?`, ['%@demonstraight.com']);
    await db.runAsync(`DELETE FROM organisation_settings WHERE organisation_id IN (SELECT id FROM organisations WHERE slug = ?)`, ['demon-straight']);
    await db.runAsync(`DELETE FROM organisations WHERE slug = ?`, ['demon-straight']);

    // Create organisation
    const orgId = crypto.randomUUID();
    await Organisation.create({ id: orgId, name: 'Demon Straight', slug: 'demon-straight', subscriptionTier: 'individual' });

    // Settings
    await OrganisationSetting.set(orgId, 'default_organisation', 'Demon Straight');
    await OrganisationSetting.set(orgId, 'theme_colors', JSON.stringify(constants.DEFAULT_THEME_COLORS));
    await OrganisationSetting.set(orgId, 'theme_variant', 'swiish');
    await OrganisationSetting.set(orgId, 'allow_theme_customisation', 'true');
    await OrganisationSetting.set(orgId, 'allow_image_customisation', 'true');
    await OrganisationSetting.set(orgId, 'allow_links_customisation', 'true');
    await OrganisationSetting.set(orgId, 'allow_privacy_customisation', 'true');

    const passwordHash = await bcrypt.hash('demo123', 10);
    const demoUsers = [
        { email: 'alex@demonstraight.com', role: 'owner' },
        { email: 'maria@demonstraight.com', role: 'member' },
        { email: 'james@demonstraight.com', role: 'member' },
        { email: 'sarah@demonstraight.com', role: 'member' },
        { email: 'david@demonstraight.com', role: 'member' },
        { email: 'emma@demonstraight.com', role: 'member' }
    ];
    const userIds = [];
    for (const user of demoUsers) {
        const userId = crypto.randomUUID();
        await User.create({
            id: userId,
            email: user.email,
            passwordHash,
            organisationId: orgId,
            role: user.role,
            emailVerified: 1
        });
        userIds.push(userId);
    }
    DEMO_USER_ID = userIds[0];

    // Demo cards data (simplified for brevity, same as original)
    const demoCards = [
        { userId: userIds[0], slug: 'alex-ruler', shortCode: 'RULER01', personal: { firstName: 'Alex', lastName: 'Ruler', title: 'Chief Straightness Officer', company: 'Demon Straight' }, avatar: '/demo/avatar-1.jpg' },
        { userId: userIds[1], slug: 'maria-lines', shortCode: 'LINES02', personal: { firstName: 'Maria', lastName: 'Lines', title: 'Director of Design', company: 'Demon Straight' }, avatar: '/demo/avatar-2.jpg' },
        // ... include all 6 cards from original (shortened for example)
    ];
    for (const card of demoCards) {
        await Card.createOrUpdate(card.slug, card.userId, {
            personal: card.personal,
            contact: {},
            social: {},
            theme: { color: 'indigo' },
            images: { avatar: card.avatar },
            links: [],
            privacy: { requireInteraction: false, clientSideObfuscation: false, blockRobots: false }
        }, card.shortCode);
    }

    console.log('[DEMO MODE] Seeding complete.');
    return DEMO_USER_ID;
}

function getDemoUserId() {
    return DEMO_USER_ID;
}

async function resetDemoData() {
    if (!env.DEMO_MODE) return;
    console.log('[DEMO MODE] Hourly reset starting...');
    await seedDemoData();
    console.log('[DEMO MODE] Reset complete.');
}

module.exports = { seedDemoData, resetDemoData, getDemoUserId };