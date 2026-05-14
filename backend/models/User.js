const db = require('../config/database');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

class User {
    static async create({ email, passwordHash, organisationId, role, emailVerified = 0 }) {
        const id = crypto.randomUUID();
        await db.runAsync(
            `INSERT INTO users (id, email, password_hash, organisation_id, role, email_verified)
       VALUES (?, ?, ?, ?, ?, ?)`,
            [id, email, passwordHash, organisationId, role, emailVerified]
        );
        return this.findById(id);
    }

    static async findByEmail(email) {
        return db.getAsync(`SELECT * FROM users WHERE email = ?`, [email.toLowerCase()]);
    }

    static async findById(id) {
        return db.getAsync(`SELECT * FROM users WHERE id = ?`, [id]);
    }

    static async findByOrganisation(organisationId) {
        return db.allAsync(`SELECT id, email, role, created_at FROM users WHERE organisation_id = ? ORDER BY created_at DESC`, [organisationId]);
    }

    static async updateRole(userId, role) {
        await db.runAsync(`UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [role, userId]);
    }

    static async updatePassword(userId, passwordHash) {
        await db.runAsync(`UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [passwordHash, userId]);
    }

    static async verifyEmail(userId) {
        await db.runAsync(`UPDATE users SET email_verified = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [userId]);
    }

    static async delete(userId) {
        await db.runAsync(`DELETE FROM users WHERE id = ?`, [userId]);
    }
}

module.exports = User;