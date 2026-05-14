const db = require('../config/database');

class OrganisationSetting {
    static async get(organisationId, key) {
        const row = await db.getAsync(`SELECT value FROM organisation_settings WHERE organisation_id = ? AND key = ?`, [organisationId, key]);
        return row?.value;
    }

    static async set(organisationId, key, value) {
        await db.runAsync(
            `INSERT INTO organisation_settings (organisation_id, key, value, updated_at)
       VALUES (?, ?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(organisation_id, key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`,
            [organisationId, key, value]
        );
    }

    static async getAll(organisationId) {
        const rows = await db.allAsync(`SELECT key, value FROM organisation_settings WHERE organisation_id = ?`, [organisationId]);
        const settings = {};
        for (const row of rows) {
            if (row.key === 'theme_colors') {
                settings[row.key] = JSON.parse(row.value);
            } else if (row.key.startsWith('allow_')) {
                settings[row.key] = row.value === 'true';
            } else {
                settings[row.key] = row.value;
            }
        }
        return settings;
    }
}

module.exports = OrganisationSetting;