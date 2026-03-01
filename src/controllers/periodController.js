const db = require('../config/db');

/**
 * Create a new period
 * POST /api/periods
 */
exports.createPeriod = async (req, res, next) => {
    try {
        const { month, financial_year, status } = req.body;

        if (!month || !financial_year) {
            return res.status(400).json({ message: 'Month and financial_year are required' });
        }

        const result = await db.query(
            'INSERT INTO periods (month, financial_year, status) VALUES ($1, $2, $3) RETURNING *',
            [month, financial_year, status || 'open']
        );

        res.status(201).json({
            status: 'success',
            data: result.rows[0],
        });
    } catch (err) {
        if (err.code === '23505') { // Unique violation for (month, financial_year)
            return res.status(400).json({ message: 'Period already exists for this month and financial year' });
        }
        next(err);
    }
};

/**
 * Get all periods
 * GET /api/periods
 */
exports.getPeriods = async (req, res, next) => {
    try {
        const result = await db.query('SELECT * FROM periods ORDER BY created_at DESC');
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
 * Update a period
 * PUT /api/periods/:id
 */
exports.updatePeriod = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { month, financial_year, status } = req.body;

        if (!month || !financial_year || !status) {
            return res.status(400).json({ message: 'Month, financial_year, and status are required' });
        }

        const result = await db.query(
            'UPDATE periods SET month = $1, financial_year = $2, status = $3 WHERE id = $4 RETURNING *',
            [month, financial_year, status, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Period not found' });
        }

        res.status(200).json({
            status: 'success',
            data: result.rows[0],
        });
    } catch (err) {
        if (err.code === '23505') {
            return res.status(400).json({ message: 'Period already exists for this month and financial year' });
        }
        next(err);
    }
};

/**
 * Delete a period
 * DELETE /api/periods/:id
 */
exports.deletePeriod = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await db.query('DELETE FROM periods WHERE id = $1 RETURNING id', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Period not found' });
        }

        res.status(200).json({
            status: 'success',
            message: 'Period deleted successfully',
        });
    } catch (err) {
        next(err);
    }
};
