require('dotenv').config();

const requiredEnvVars = ['JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
if (missingEnvVars.length > 0) {
    console.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
    process.exit(1);
}

module.exports = {
    PORT: process.env.PORT || 3000,
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
    ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:3000', 'http://localhost:8095'],
    NODE_ENV: process.env.NODE_ENV || 'development',
    DATA_DIR: process.env.DATA_DIR || 'data',
    UPLOADS_DIR: process.env.UPLOADS_DIR || 'uploads',
    MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024,
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: parseInt(process.env.SMTP_PORT) || 587,
    SMTP_SECURE: process.env.SMTP_SECURE === 'true',
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASSWORD: process.env.SMTP_PASSWORD,
    SMTP_FROM: process.env.SMTP_FROM || 'noreply@localhost',
    APP_URL: process.env.APP_URL || (process.env.NODE_ENV === 'production' ? (() => { throw new Error('APP_URL required in production'); })() : 'http://localhost:3000'),
    DEMO_MODE: process.env.DEMO_MODE === 'true',
    FORCE_HTTPS: process.env.FORCE_HTTPS === 'true',
};