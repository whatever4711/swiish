const db = require('../config/database');
const crypto = require('crypto');

class EmailVerificationToken {
    static async create(userId) {
        const id = crypto.randomUUID();
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);
        await db.runAsync(
            `INSERT INTO email_verification_tokens (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)`,
            [id, userId, token, expiresAt.toISOString()]
        );
        return token;
    }

    static async findByToken(token) {
        return db.getAsync(`SELECT * FROM email_verification_tokens WHERE token = ?`, [token]);
    }

    static async markVerified(id) {
        await db.runAsync(`UPDATE email_verification_tokens SET verified_at = CURRENT_TIMESTAMP WHERE id = ?`, [id]);
    }
}

module.exports = EmailVerificationToken;