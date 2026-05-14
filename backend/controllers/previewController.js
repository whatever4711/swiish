const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const Card = require('../models/Card');
const { getCachedPreview, writeToCache, invalidateCache } = require('../services/previewCacheService');
const { getThemeColorHex, escapeXml } = require('../utils/themeColors');
const env = require('../config/env');

async function fetchAvatarImage(avatarUrl) {
    if (!avatarUrl) return null;
    if (avatarUrl.startsWith('/uploads/')) {
        const filename = path.basename(avatarUrl);
        const safePath = path.resolve(env.UPLOADS_DIR, filename);
        if (!safePath.startsWith(path.resolve(env.UPLOADS_DIR))) return null;
        return fs.readFile(safePath).catch(() => null);
    }
    if (avatarUrl.startsWith('/demo/')) {
        const filename = path.basename(avatarUrl);
        const safePath = path.resolve(__dirname, '..', 'public', 'demo', filename);
        const resolvedDemo = path.resolve(__dirname, '..', 'public', 'demo');
        if (!safePath.startsWith(resolvedDemo)) return null;
        return fs.readFile(safePath).catch(() => null);
    }
    return null;
}

async function generatePreviewImage(cardData, themeColor) {
    const prefix = cardData.personal?.prefix ? cardData.personal.prefix + ' ' : '';
    const suffix = cardData.personal?.suffix ? ' ' + cardData.personal.suffix : '';
    const first = (cardData.personal?.firstName || '').trim();
    const middle = cardData.personal?.middleName ? ' ' + cardData.personal.middleName : '';
    const last = (cardData.personal?.lastName || '').trim();
    const fullName = `${prefix}${first}${middle}${last}${suffix}`.trim();
    const title = cardData.personal?.title || '';
    const company = cardData.personal?.company || '';
    const avatarUrl = cardData.images?.avatar || '';
    const colorHex = getThemeColorHex(themeColor);
    const width = 1200, height = 630;

    const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${colorHex}" stop-opacity="1" />
        <stop offset="100%" stop-color="${colorHex}" stop-opacity="0.7" />
      </linearGradient></defs>
      <rect width="${width}" height="${height}" fill="#ffffff"/>
      <rect x="0" y="0" width="400" height="${height}" fill="url(#grad)"/>
      <text x="500" y="260" font-family="Atkinson Hyperlegible" font-size="56" font-weight="bold" fill="#3d3d3d">${escapeXml(fullName)}</text>
      <text x="500" y="330" font-family="Atkinson Hyperlegible" font-size="28" fill="#6b7280">${escapeXml(title)}</text>
      <rect x="500" y="358" width="100" height="6" fill="${colorHex}"/>
      <text x="500" y="408" font-family="Atkinson Hyperlegible" font-size="28" fill="#6b7280">${escapeXml(company)}</text>
    </svg>`;

    let image = await sharp(Buffer.from(svg)).png().toBuffer();
    let imageSharp = sharp(image);

    if (avatarUrl) {
        const avatarBuffer = await fetchAvatarImage(avatarUrl);
        if (avatarBuffer) {
            const avatarSize = 250;
            const avatarLeft = Math.round((400 - avatarSize) / 2);
            const avatarTop = Math.round((height - avatarSize) / 2);
            const circleMask = `
        <svg width="${avatarSize}" height="${avatarSize}">
          <mask id="m"><rect width="${avatarSize}" height="${avatarSize}" fill="black"/><circle cx="${avatarSize/2}" cy="${avatarSize/2}" r="${avatarSize/2}" fill="white"/></mask>
          <rect width="${avatarSize}" height="${avatarSize}" mask="url(#m)" fill="white"/>
        </svg>`;
            const maskedAvatar = await sharp(avatarBuffer)
                .resize(avatarSize, avatarSize, { fit: 'cover' })
                .composite([{ input: Buffer.from(circleMask), blend: 'dest-in' }])
                .png().toBuffer();
            imageSharp = imageSharp.composite([{ input: maskedAvatar, left: avatarLeft, top: avatarTop }]);
        }
    }
    return imageSharp.png().toBuffer();
}

async function generateGenericPreviewImage() {
    const svg = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg"><rect width="1200" height="630" fill="#f3f4f6"/><text x="600" y="315" font-family="Arial" font-size="48" text-anchor="middle" fill="#6b7280">Card Preview</text><text x="600" y="370" font-family="Arial" font-size="24" text-anchor="middle" fill="#9ca3af">This card is private</text></svg>`;
    return sharp(Buffer.from(svg)).png().toBuffer();
}

exports.generatePreview = async (req, res, next) => {
    try {
        const identifier = req.params.identifier;
        const lowerId = identifier.toLowerCase();
        const cached = await getCachedPreview(lowerId);
        if (cached) {
            res.set('Content-Type', 'image/png');
            return res.send(cached);
        }
        let card = await Card.findByShortCode(identifier);
        if (!card) card = await Card.findBySlugAndOrg(lowerId, null); // fallback
        if (!card) return res.status(404).json({ error: 'Card not found' });
        const cardData = JSON.parse(card.data);
        const privacy = cardData.privacy || {};
        if (privacy.requireInteraction || privacy.clientSideObfuscation) {
            const generic = await generateGenericPreviewImage();
            res.set('Content-Type', 'image/png');
            return res.send(generic);
        }
        const themeColor = cardData.theme?.color || 'indigo';
        const previewBuffer = await generatePreviewImage(cardData, themeColor);
        if (!previewBuffer) throw new Error('Failed to generate preview');
        await writeToCache(lowerId, previewBuffer);
        res.set('Content-Type', 'image/png');
        res.send(previewBuffer);
    } catch (err) { next(err); }
};