const fs = require('fs').promises;
const path = require('path');
const env = require('../config/env');

let logLines = [];
const LOG_FILE = path.join(__dirname, '..', 'server.log');
const MAX_LOG_LINES = 1000;

function log(message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}${data ? ' ' + JSON.stringify(data) : ''}`;
    if (env.NODE_ENV === 'development') console.log(logEntry);
    logLines.push(logEntry);
    if (logLines.length > MAX_LOG_LINES) logLines = logLines.slice(-MAX_LOG_LINES);
    fs.appendFile(LOG_FILE, logEntry + '\n', 'utf8').catch(() => {});
}

function requestLogger(req, res, next) {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        log(`${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
    });
    next();
}

function getLogs() {
    return logLines.slice(-100);
}

module.exports = { log, requestLogger, getLogs };