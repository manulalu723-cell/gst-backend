const db = require('../config/db');

/**
 * Maps a DB row to frontend Client format
 */
function toClientResponse(row) {
    return {
        id: row.id,
        clientName: row.name,
        gstin: row.gstin,
        filingType: row.filing_type || 'Monthly',
        state: row.state,
        isActive: row.is_active !== false,
        created_at: row.created_at
    };
}

/**
 * Create a new client
 * POST /api/clients
 */
exports.createClient = async (req, res, next) => {
    try {
        // Accept both frontend (clientName) and backend (name) field names
        const name = req.body.clientName || req.body.name;
        const gstin = req.body.gstin;
        const state = req.body.state || '';
        const filingType = req.body.filingType || req.body.filing_type || 'Monthly';
        const isActive = req.body.isActive !== undefined ? req.body.isActive : true;

        if (!name || !gstin) {
            return res.status(400).json({ message: 'Name and GSTIN are required' });
        }

        const result = await db.query(
            'INSERT INTO clients (name, gstin, state, filing_type, is_active) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [name, gstin, state, filingType, isActive]
        );

        res.status(201).json({
            status: 'success',
            data: toClientResponse(result.rows[0]),
        });
    } catch (err) {
        if (err.code === '23505') {
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
        const search = req.query.q || req.query.search;
        let query = 'SELECT * FROM clients';
        const params = [];

        if (search) {
            query += ' WHERE name ILIKE $1 OR gstin ILIKE $1';
            params.push(`%${search}%`);
        }

        query += ' ORDER BY created_at DESC';

        const result = await db.query(query, params);
        res.status(200).json({
            status: 'success',
            data: {
                items: result.rows.map(toClientResponse),
                total: result.rows.length
            }
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
            data: toClientResponse(result.rows[0]),
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
        const name = req.body.clientName || req.body.name;
        const gstin = req.body.gstin;
        const state = req.body.state || '';
        const filingType = req.body.filingType || req.body.filing_type || 'Monthly';
        const isActive = req.body.isActive !== undefined ? req.body.isActive : true;

        if (!name || !gstin) {
            return res.status(400).json({ message: 'Name and GSTIN are required' });
        }

        const result = await db.query(
            'UPDATE clients SET name = $1, gstin = $2, state = $3, filing_type = $4, is_active = $5 WHERE id = $6 RETURNING *',
            [name, gstin, state, filingType, isActive, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Client not found' });
        }

        res.status(200).json({
            status: 'success',
            data: toClientResponse(result.rows[0]),
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
