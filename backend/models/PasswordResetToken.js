const db = require('../config/database');
const crypto = require('crypto');

class PasswordResetToken {
    static async create(userId) {
        const id = crypto.randomUUID();
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 1);
        await db.runAsync(
            `INSERT INTO password_reset_tokens (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)`,
            [id, userId, token, expiresAt.toISOString()]
        );
        return token;
    }

    static async findByToken(token) {
        return db.getAsync(`SELECT * FROM password_reset_tokens WHERE token = ?`, [token]);
    }

    static async markUsed(id) {
        await db.runAsync(`UPDATE password_reset_tokens SET used_at = CURRENT_TIMESTAMP WHERE id = ?`, [id]);
    }

    static async deleteOldForUser(userId) {
        await db.runAsync(`DELETE FROM password_reset_tokens WHERE user_id = ? AND used_at IS NULL`, [userId]);
    }
}

module.exports = PasswordResetToken;