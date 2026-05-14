const db = require('../config/database');
const crypto = require('crypto');

class Organisation {
    static async create({ name, slug, subscriptionTier = 'individual' }) {
        const id = crypto.randomUUID();
        await db.runAsync(
            `INSERT INTO organisations (id, name, slug, subscription_tier) VALUES (?, ?, ?, ?)`,
            [id, name, slug, subscriptionTier]
        );
        return this.findById(id);
    }

    static async findById(id) {
        return db.getAsync(`SELECT * FROM organisations WHERE id = ?`, [id]);
    }

    static async findBySlug(slug) {
        return db.getAsync(`SELECT * FROM organisations WHERE slug = ?`, [slug]);
    }

    static async updateSlug(orgId, slug) {
        await db.runAsync(`UPDATE organisations SET slug = ? WHERE id = ?`, [slug, orgId]);
    }
}

module.exports = Organisation;