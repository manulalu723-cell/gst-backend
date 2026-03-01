const bcrypt = require('bcryptjs');
const db = require('../config/db');

/**
 * Get all staff/admin users
 */
exports.getStaff = async (req, res, next) => {
    try {
        const search = req.query.q || req.query.search;
        let query = 'SELECT id, name, email, role, active, created_at FROM users';
        const params = [];

        if (search) {
            query += ' WHERE name ILIKE $1 OR email ILIKE $1';
            params.push(`%${search}%`);
        }

        query += ' ORDER BY created_at DESC';

        const result = await db.query(query, params);

        res.status(200).json({
            status: 'success',
            data: {
                items: result.rows,
                total: result.rows.length
            }
        });
    } catch (err) {
        next(err);
    }
};

/**
 * Create a new staff/admin user
 */
exports.createStaff = async (req, res, next) => {
    try {
        const { name, email, password, role, active } = req.body;

        if (!name || !email || !password || !role) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const result = await db.query(
            'INSERT INTO users (name, email, password_hash, role, active) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role, active, created_at',
            [name, email, passwordHash, role, active !== false]
        );

        res.status(201).json({
            status: 'success',
            data: result.rows[0]
        });
    } catch (err) {
        if (err.code === '23505') {
            return res.status(400).json({ message: 'Email already exists' });
        }
        next(err);
    }
};

/**
 * Update a staff/admin user
 */
exports.updateStaff = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, email, role, active, password } = req.body;

        let query = 'UPDATE users SET name = $1, email = $2, role = $3, active = $4';
        const params = [name, email, role, active];

        if (password) {
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(password, salt);
            query += ', password_hash = $5 WHERE id = $6 RETURNING id, name, email, role, active';
            params.push(passwordHash, id);
        } else {
            query += ' WHERE id = $5 RETURNING id, name, email, role, active';
            params.push(id);
        }

        const result = await db.query(query, params);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({
            status: 'success',
            data: result.rows[0]
        });
    } catch (err) {
        if (err.code === '23505') {
            return res.status(400).json({ message: 'Email already exists' });
        }
        next(err);
    }
};

/**
 * Delete a staff/admin user
 */
exports.deleteStaff = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Prevent deleting the last admin or yourself if possible (simple version for now)
        const result = await db.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({
            status: 'success',
            message: 'User deleted successfully'
        });
    } catch (err) {
        next(err);
    }
};
