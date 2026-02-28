const jwt = require('jsonwebtoken');
const db = require('../config/db');

const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token provided' });
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Get user from DB and attach to req
        const result = await db.query(
            'SELECT id, name, email, role FROM users WHERE id = $1',
            [decoded.id]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ message: 'User no longer exists' });
        }

        req.user = result.rows[0];
        next();
    } catch (err) {
        console.error('Auth Middleware Error:', err);
        res.status(401).json({ message: 'Not authorized, token failed' });
    }
};

module.exports = protect;
