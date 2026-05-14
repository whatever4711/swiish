const fs = require('fs').promises;
const path = require('path');
const env = require('../config/env');
const constants = require('../config/constants');

const PREVIEW_CACHE_DIR = path.join(__dirname, '..', 'cache', 'previews');
const CACHE_MAX_AGE = constants.PREVIEW_CACHE_MAX_AGE;
const CACHE_MAX_SIZE_MB = constants.PREVIEW_CACHE_MAX_SIZE_MB;

// Ensure cache dir exists
fs.mkdir(PREVIEW_CACHE_DIR, { recursive: true }).catch(console.error);

function resolveCachePath(identifier) {
    if (!identifier || !/^[a-zA-Z0-9-]+$/.test(identifier)) return null;
    const filename = `preview_${identifier}.png`;
    const resolved = path.resolve(PREVIEW_CACHE_DIR, filename);
    const resolvedCacheDir = path.resolve(PREVIEW_CACHE_DIR);
    if (!resolved.startsWith(resolvedCacheDir)) return null;
    return resolved;
}

async function getCachedPreview(identifier) {
    const filePath = resolveCachePath(identifier);
    if (!filePath) return null;
    try {
        const stat = await fs.stat(filePath);
        if (Date.now() - stat.mtimeMs < CACHE_MAX_AGE) {
            const buffer = await fs.readFile(filePath);
            return buffer;
        }
    } catch (err) {
        if (err.code !== 'ENOENT') console.error('[Cache] stat error:', err.message);
    }
    return null;
}

async function writeToCache(identifier, buffer) {
    const filePath = resolveCachePath(identifier);
    if (!filePath) return;
    const tempPath = `${filePath}.tmp.${Date.now()}`;
    try {
        await fs.writeFile(tempPath, buffer);
        await fs.rename(tempPath, filePath);
    } catch (err) {
        try { await fs.unlink(tempPath); } catch (e) {}
        console.error('[Cache] write error:', err.message);
    }
}

async function invalidateCache(slug, shortCode) {
    const paths = [];
    if (slug) paths.push(resolveCachePath(slug));
    if (shortCode) paths.push(resolveCachePath(shortCode));
    for (const p of paths) {
        if (p) {
            try { await fs.unlink(p); } catch (err) { if (err.code !== 'ENOENT') console.error(err); }
        }
    }
}

async function cleanExpiredCache() {
    try {
        const files = await fs.readdir(PREVIEW_CACHE_DIR);
        for (const file of files) {
            const filePath = path.join(PREVIEW_CACHE_DIR, file);
            const stat = await fs.stat(filePath);
            if (Date.now() - stat.mtimeMs > CACHE_MAX_AGE) {
                await fs.unlink(filePath);
            }
        }
    } catch (err) { console.error('[Cache] clean expired error:', err.message); }
}

async function enforceSizeLimit() {
    try {
        const files = await fs.readdir(PREVIEW_CACHE_DIR);
        let totalSize = 0;
        const stats = [];
        for (const file of files) {
            const filePath = path.join(PREVIEW_CACHE_DIR, file);
            const stat = await fs.stat(filePath);
            totalSize += stat.size;
            stats.push({ filePath, mtime: stat.mtimeMs, size: stat.size });
        }
        const maxBytes = CACHE_MAX_SIZE_MB * 1024 * 1024;
        if (totalSize > maxBytes) {
            stats.sort((a, b) => a.mtime - b.mtime);
            for (const f of stats) {
                await fs.unlink(f.filePath);
                totalSize -= f.size;
                if (totalSize <= maxBytes * 0.9) break;
            }
        }
    } catch (err) { console.error('[Cache] size limit error:', err.message); }
}

module.exports = {
    getCachedPreview,
    writeToCache,
    invalidateCache,
    cleanExpiredCache,
    enforceSizeLimit
};