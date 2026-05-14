require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const fs = require('fs');
const env = require('./config/env');
const { seedDemoData, resetDemoData } = require('./services/demoService');
const { cleanExpiredCache, enforceSizeLimit } = require('./services/previewCacheService');
const { requestLogger } = require('./middleware/requestLogger');
const { helmetMiddleware, corsMiddleware } = require('./middleware/security');
const errorHandler = require('./middleware/errorHandler');
const routes = require('./routes');
const db = require('./config/database');
const { execSync } = require('child_process');

const app = express();
const PORT = env.PORT;

// Setup directories
const dirs = [env.DATA_DIR, env.UPLOADS_DIR, path.join(__dirname, 'cache', 'previews')];
dirs.forEach(dir => { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); });

// Trust proxy
app.set('trust proxy', 1);

// Nonce middleware
app.use((req, res, next) => {
    const crypto = require('crypto');
    res.locals.nonce = crypto.randomBytes(16).toString('base64');
    next();
});

// Security middleware
app.use(helmetMiddleware);
app.use(corsMiddleware);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(requestLogger);

// Serve React build (from frontend/build)
const frontendBuildPath = path.join(__dirname, '..', 'frontend', 'build');
app.use(express.static(frontendBuildPath, { maxAge: '1d', etag: true, lastModified: true, index: false }));
app.use('/uploads', express.static(env.UPLOADS_DIR));

// Routes
app.use(routes);

// SPA fallback
app.get('*', async (req, res, next) => {
    if (req.path.startsWith('/static/') || req.path.startsWith('/api/') || req.path.startsWith('/uploads/') || req.path.startsWith('/manifest/') || req.path.startsWith('/icons/')) {
        return res.status(404).json({ error: 'Not found' });
    }
    try {
        // Inside the SPA fallback route
        const indexPath = path.join(frontendBuildPath, 'index.html');
        let html = await fs.promises.readFile(indexPath, 'utf8');
        // inject meta tags logic from original (simplified)
        html = html.replace(/<script(\s|>)/gi, `<script nonce="${res.locals.nonce}"$1`);
        res.set('Cache-Control', 'no-cache');
        res.send(html);
    } catch (err) {
        if (err.code === 'ENOENT') return res.status(404).json({ error: 'Not found' });
        next(err);
    }
});

app.use(errorHandler);

// Run migrations and start
async function start() {
    try {
        console.log('Running migrations...');
        const migrateEnv = env.DEMO_MODE ? 'demo' : 'dev';
        execSync(`npx db-migrate up --env ${migrateEnv}`, { stdio: 'inherit', cwd: __dirname });
        if (env.DEMO_MODE) {
            await seedDemoData();
            setInterval(resetDemoData, 60 * 60 * 1000);
        }
        setInterval(cleanExpiredCache, 24 * 60 * 60 * 1000);
        setInterval(enforceSizeLimit, 60 * 60 * 1000);
        const server = app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            console.log(`Environment: ${env.NODE_ENV}`);
        });
        process.on('SIGTERM', () => server.close(() => db.close(() => process.exit(0))));
        process.on('SIGINT', () => server.close(() => db.close(() => process.exit(0))));
    } catch (err) {
        console.error('Failed to start:', err);
        process.exit(1);
    }
}

start();