const db = require('../config/db');

/**
 * Create a new client
 * POST /api/clients
 */
exports.createClient = async (req, res, next) => {
    try {
        const { name, gstin, state } = req.body;

        if (!name || !gstin) {
            return res.status(400).json({ message: 'Name and GSTIN are required' });
        }

        const result = await db.query(
            'INSERT INTO clients (name, gstin, state) VALUES ($1, $2, $3) RETURNING *',
            [name, gstin, state || '']
        );

        res.status(201).json({
            status: 'success',
            data: result.rows[0],
        });
    } catch (err) {
        if (err.code === '23505') { // Unique violation for GSTIN
            return res.status(400).json({ message: 'GSTIN already exists' });
        }
        next(err);
    }
};

/**
 * Get all clients
 * GET /api/clients
 */
exports.getClients = async (req, res, next) => {
    try {
        const result = await db.query('SELECT * FROM clients ORDER BY created_at DESC');
        res.status(200).json({
            status: 'success',
            results: result.rows.length,
            data: result.rows,
        });
    } catch (err) {
        next(err);
    }
};

/**
 * Get a single client by ID
 * GET /api/clients/:id
 */
exports.getClientById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await db.query('SELECT * FROM clients WHERE id = $1', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Client not found' });
        }

        res.status(200).json({
            status: 'success',
            data: result.rows[0],
        });
    } catch (err) {
        next(err);
    }
};

/**
 * Update a client
 * PUT /api/clients/:id
 */
exports.updateClient = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, gstin, state } = req.body;

        if (!name || !gstin) {
            return res.status(400).json({ message: 'Name and GSTIN are required' });
        }

        const result = await db.query(
            'UPDATE clients SET name = $1, gstin = $2, state = $3 WHERE id = $4 RETURNING *',
            [name, gstin, state, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Client not found' });
        }

        res.status(200).json({
            status: 'success',
            data: result.rows[0],
        });
    } catch (err) {
        if (err.code === '23505') {
            return res.status(400).json({ message: 'GSTIN already exists' });
        }
        next(err);
    }
};

/**
 * Delete a client
 * DELETE /api/clients/:id
 */
exports.deleteClient = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await db.query('DELETE FROM clients WHERE id = $1 RETURNING id', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Client not found' });
        }

        res.status(200).json({
            status: 'success',
            message: 'Client deleted successfully',
        });
    } catch (err) {
        next(err);
    }
};
