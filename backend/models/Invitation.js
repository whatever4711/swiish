const db = require('../config/database');
const crypto = require('crypto');

class Invitation {
    static async create({ organisationId, email, role, invitedBy }) {
        const id = crypto.randomUUID();
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);
        await db.runAsync(
            `INSERT INTO invitations (id, organisation_id, email, token, role, invited_by, expires_at, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
            [id, organisationId, email.toLowerCase(), token, role, invitedBy, expiresAt.toISOString()]
        );
        return { id, token, expiresAt };
    }

    static async findByToken(token) {
        return db.getAsync(`SELECT * FROM invitations WHERE token = ?`, [token]);
    }

    static async findByEmailAndOrg(email, organisationId) {
        return db.getAsync(
            `SELECT * FROM invitations WHERE email = ? AND organisation_id = ? AND status IN ('pending', 'sent') AND expires_at > datetime('now')`,
            [email.toLowerCase(), organisationId]
        );
    }

    static async updateStatus(invitationId, status) {
        await db.runAsync(`UPDATE invitations SET status = ? WHERE id = ?`, [status, invitationId]);
    }

    static async markAccepted(invitationId) {
        await db.runAsync(`UPDATE invitations SET accepted_at = CURRENT_TIMESTAMP, status = 'accepted' WHERE id = ?`, [invitationId]);
    }

    static async listByOrganisation(organisationId) {
        return db.allAsync(
            `SELECT i.id, i.email, i.role, i.status, i.created_at, i.expires_at, i.accepted_at, u.email as invited_by_email
       FROM invitations i
       LEFT JOIN users u ON i.invited_by = u.id
       WHERE i.organisation_id = ?
       ORDER BY i.created_at DESC`,
            [organisationId]
        );
    }

    static async delete(invitationId) {
        await db.runAsync(`DELETE FROM invitations WHERE id = ?`, [invitationId]);
    }
}

module.exports = Invitation;