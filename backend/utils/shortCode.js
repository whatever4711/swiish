const crypto = require('crypto');
const constants = require('../config/constants');

function generateShortCode() {
    let code = '';
    const chars = constants.SHORT_CODE_CHARS;
    const maxValid = Math.floor(256 / chars.length) * chars.length;
    for (let i = 0; i < constants.SHORT_CODE_LENGTH; i++) {
        let byte;
        do { byte = crypto.randomBytes(1)[0]; } while (byte >= maxValid);
        code += chars[byte % chars.length];
    }
    return code;
}

function ensureUniqueShortCode(db, callback) {
    let attempts = 0;
    const tryGenerate = () => {
        const code = generateShortCode();
        db.get("SELECT 1 FROM cards WHERE short_code = ?", [code], (err, row) => {
            if (err) return callback(err);
            if (!row) return callback(null, code);
            attempts++;
            if (attempts > 10) return callback(new Error('Failed to generate unique short code'));
            tryGenerate();
        });
    };
    tryGenerate();
}

module.exports = { generateShortCode, ensureUniqueShortCode };