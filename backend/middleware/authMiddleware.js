const jwt = require('jsonwebtoken');
const db = require('../config/db');
require('dotenv').config();

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'smart_tasks_super_secret_jwt_key_123');

            // Get user from database, excluding password
            const [rows] = await db.query('SELECT id, name, email FROM users WHERE id = ?', [decoded.id]);
            
            if (rows.length === 0) {
                return res.status(401).json({ error: 'User session no longer exists in database.' });
            }

            req.user = rows[0];
            next();
        } catch (error) {
            console.error('JWT validation error:', error.message);
            return res.status(401).json({ error: 'Session expired or invalid signature. Please log in again.' });
        }
    } else {
        return res.status(401).json({ error: 'Authorization token is missing or malformed.' });
    }
};

module.exports = { protect };
