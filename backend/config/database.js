const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const env = require('./env');

const DATA_DIR = env.DATA_DIR;
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const DB_FILENAME = env.DEMO_MODE ? 'cards-demo.db' : 'cards.db';
const db = new sqlite3.Database(path.join(DATA_DIR, DB_FILENAME));

// Enable foreign keys
db.run("PRAGMA foreign_keys = ON", (err) => {
    if (err) {
        console.error('Failed to enable foreign keys:', err);
        process.exit(1);
    }
    console.log('[DB] Foreign key constraints enabled');
});

// Promisify for convenience
const util = require('util');
db.runAsync = util.promisify(db.run.bind(db));
db.getAsync = util.promisify(db.get.bind(db));
db.allAsync = util.promisify(db.all.bind(db));

module.exports = db;