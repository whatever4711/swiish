const helmet = require('helmet');
const cors = require('cors');
const csrf = require('csurf');
const env = require('../config/env');

const cspDirectives = {
    defaultSrc: ["'self'"],
    imgSrc: ["'self'", "data:", "https:"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    fontSrc: ["'self'", "data:"],
    connectSrc: env.NODE_ENV === 'development'
        ? ["'self'", "http://127.0.0.1:7243", "http://localhost:7243", "https://api.github.com"]
        : ["'self'", "https://api.github.com"]
};

const helmetMiddleware = helmet({
    contentSecurityPolicy: {
        useDefaults: false,
        directives: {
            ...cspDirectives,
            scriptSrc: [
                "'self'",
                (req, res) => `'nonce-${res.locals.nonce}'`
            ]
        }
    },
    crossOriginEmbedderPolicy: false
});

const corsMiddleware = cors({
    origin: function (origin, callback) {
        if (!origin && env.NODE_ENV === 'development') return callback(null, true);
        if (!origin || env.ALLOWED_ORIGINS.includes(origin)) callback(null, true);
        else callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token']
});

const csrfProtection = csrf({
    cookie: {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'strict'
    }
});

module.exports = { helmetMiddleware, corsMiddleware, csrfProtection };