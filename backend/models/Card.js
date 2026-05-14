const db = require('../config/database');
const { ensureUniqueShortCode } = require('../utils/shortCode');
const { SHORT_CODE_LENGTH } = require('../config/constants');

class Card {
    static async findBySlugAndUserId(slug, userId) {
        return db.getAsync(`SELECT * FROM cards WHERE slug = ? AND user_id = ?`, [slug, userId]);
    }

    static async findByShortCode(shortCode) {
        return db.getAsync(`SELECT c.*, u.organisation_id FROM cards c JOIN users u ON c.user_id = u.id WHERE c.short_code = ?`, [shortCode]);
    }

    static async findBySlugAndOrg(slug, organisationId) {
        return db.getAsync(`
      SELECT c.data, c.short_code, c.slug
      FROM cards c
      JOIN users u ON c.user_id = u.id
      WHERE c.slug = ? AND u.organisation_id = ?
      LIMIT 1
    `, [slug, organisationId]);
    }

    static async findByOrgSlugAndCardSlug(orgSlug, cardSlug) {
        return db.getAsync(`
      SELECT c.data, c.short_code, c.slug
      FROM cards c
      JOIN users u ON c.user_id = u.id
      JOIN organisations o ON u.organisation_id = o.id
      WHERE o.slug = ? AND c.slug = ?
      LIMIT 1
    `, [orgSlug, cardSlug]);
    }

    static async createOrUpdate(slug, userId, data, shortCode = null) {
        let finalShortCode = shortCode;
        if (!finalShortCode) {
            const existing = await this.findBySlugAndUserId(slug, userId);
            if (existing?.short_code) {
                finalShortCode = existing.short_code;
            } else {
                finalShortCode = await new Promise((resolve, reject) => {
                    ensureUniqueShortCode(db, (err, code) => {
                        if (err) reject(err);
                        else resolve(code);
                    });
                });
            }
        }

        const jsonData = JSON.stringify(data);
        await db.runAsync(
            `INSERT INTO cards (slug, user_id, short_code, data, updated_at)
       VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(slug, user_id) DO UPDATE SET
         data = excluded.data,
         short_code = COALESCE(cards.short_code, excluded.short_code),
         updated_at = CURRENT_TIMESTAMP`,
            [slug, userId, finalShortCode, jsonData]
        );
        return finalShortCode;
    }

    static async delete(slug, userId) {
        const result = await db.runAsync(`DELETE FROM cards WHERE slug = ? AND user_id = ?`, [slug, userId]);
        return result.changes;
    }

    static async getAllForOrganisation(organisationId) {
        return db.allAsync(`
      SELECT 
        u.id as user_id, u.email as user_email, u.role as user_role, u.created_at as user_created_at,
        c.slug, c.short_code, c.data
      FROM users u
      LEFT JOIN cards c ON c.user_id = u.id
      WHERE u.organisation_id = ?
      ORDER BY u.created_at DESC, c.created_at DESC
    `, [organisationId]);
    }
}

module.exports = Card;