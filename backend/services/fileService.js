const fs = require('fs').promises;
const path = require('path');
const env = require('../config/env');

function validateFilePath(filePath, baseDir = env.UPLOADS_DIR) {
    if (!filePath) throw new Error('File path required');
    const resolved = path.resolve(filePath);
    const resolvedBase = path.resolve(baseDir);
    if (!resolved.startsWith(resolvedBase)) throw new Error('Path traversal detected');
    return resolved;
}

async function deleteFile(filePath) {
    try {
        const safePath = validateFilePath(filePath);
        await fs.unlink(safePath);
    } catch (err) {
        console.error('Delete file error:', err.message);
    }
}

module.exports = { validateFilePath, deleteFile };