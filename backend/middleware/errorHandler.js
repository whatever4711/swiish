const env = require('../config/env');

function errorHandler(err, req, res, next) {
    console.error('Error:', err);
    if (env.NODE_ENV === 'production') {
        if (err.name === 'ValidationError') return res.status(400).json({ error: 'Invalid input' });
        if (err.name === 'UnauthorizedError' || err.name === 'JsonWebTokenError') return res.status(401).json({ error: 'Unauthorized' });
        return res.status(500).json({ error: 'Internal server error' });
    }
    res.status(err.status || 500).json({ error: err.message, stack: err.stack });
}

module.exports = errorHandler;