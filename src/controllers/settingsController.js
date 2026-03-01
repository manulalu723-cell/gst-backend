const db = require('../config/db');

/**
 * Get all settings by key
 * GET /api/settings?key=gst_status
 */
exports.getSettings = async (req, res, next) => {
    try {
        const { key } = req.query;
        let query = 'SELECT * FROM settings';
        const params = [];

        if (key) {
            query += ' WHERE key = $1';
            params.push(key);
        }

        query += ' ORDER BY created_at ASC';
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
 * Add a setting value
 * POST /api/settings
 */
exports.createSetting = async (req, res, next) => {
    try {
        const { key, value } = req.body;

        if (!key || !value) {
            return res.status(400).json({ message: 'key and value are required' });
        }

        const result = await db.query(
            'INSERT INTO settings (key, value) VALUES ($1, $2) RETURNING *',
            [key, value.toLowerCase()]
        );

        res.status(201).json({
            status: 'success',
            data: result.rows[0]
        });
    } catch (err) {
        if (err.code === '23505') {
            return res.status(400).json({ message: 'This status already exists' });
        }
        next(err);
    }
};

/**
 * Delete a setting
 * DELETE /api/settings/:id
 */
exports.deleteSetting = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await db.query('DELETE FROM settings WHERE id = $1 RETURNING id', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Setting not found' });
        }

        res.status(200).json({
            status: 'success',
            message: 'Setting deleted'
        });
    } catch (err) {
        next(err);
    }
};
