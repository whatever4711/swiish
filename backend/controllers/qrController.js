const QRCode = require('qrcode');
const Card = require('../models/Card');
const { buildVCardString } = require('../utils/vcard');

exports.generateQR = async (req, res, next) => {
    try {
        let identifier = req.params.identifier;
        let card;
        if (/^[a-zA-Z0-9]{7}$/.test(identifier)) {
            card = await Card.findByShortCode(identifier);
        } else {
            const db = require('../config/database');
            card = await db.getAsync("SELECT short_code FROM cards WHERE slug = ? LIMIT 1", [identifier.toLowerCase()]);
        }
        if (!card || (!card.short_code && !card.shortCode)) return res.status(404).json({ error: 'Card not found' });
        const shortCode = card.short_code || card.shortCode;
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        let qrContent = `${baseUrl}/${shortCode}`;
        if (req.body.payload && typeof req.body.payload === 'string' && req.body.payload.trim()) {
            qrContent = req.body.payload.trim();
        }
        const qrDataUrl = await QRCode.toDataURL(qrContent, { errorCorrectionLevel: 'M', type: 'image/png', width: 200, margin: 1 });
        res.json({ qrCode: qrDataUrl });
    } catch (err) { next(err); }
};