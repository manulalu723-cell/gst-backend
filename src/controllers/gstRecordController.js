const db = require('../config/db');

/**
 * Create a new GST record
 * POST /api/gst-records
 */
exports.createGstRecord = async (req, res, next) => {
    try {
        const {
            client_id,
            period_id,
            gstr1_status,
            gstr3b_status,
            gstr1_filed_date,
            gstr3b_filed_date,
            remarks
        } = req.body;

        if (!client_id || !period_id) {
            return res.status(400).json({ message: 'client_id and period_id are required' });
        }

        const result = await db.query(
            `INSERT INTO gst_records 
      (client_id, period_id, gstr1_status, gstr3b_status, gstr1_filed_date, gstr3b_filed_date, remarks) 
      VALUES ($1, $2, $3, $4, $5, $6, $7) 
      RETURNING *`,
            [
                client_id,
                period_id,
                gstr1_status || 'pending',
                gstr3b_status || 'pending',
                gstr1_filed_date,
                gstr3b_filed_date,
                remarks
            ]
        );

        res.status(201).json({
            status: 'success',
            data: result.rows[0],
        });
    } catch (err) {
        if (err.code === '23505') { // Unique constraint violation (client_id, period_id)
            return res.status(400).json({ message: 'A record already exists for this client in the specified period' });
        }
        next(err);
    }
};

/**
 * Generate GST records for all active clients in a period
 * POST /api/gst-records/generate
 */
exports.generateRecords = async (req, res, next) => {
    try {
        const { month, financial_year } = req.body;

        if (!month || !financial_year) {
            return res.status(400).json({ message: 'month and financial_year are required' });
        }

        // Find or create the period
        let periodResult = await db.query(
            'SELECT * FROM periods WHERE month = $1 AND financial_year = $2',
            [month, financial_year]
        );

        let period;
        if (periodResult.rows.length === 0) {
            periodResult = await db.query(
                'INSERT INTO periods (month, financial_year, status) VALUES ($1, $2, $3) RETURNING *',
                [month, financial_year, 'open']
            );
            period = periodResult.rows[0];
        } else {
            period = periodResult.rows[0];
        }

        // Get all active clients
        const clientsResult = await db.query(
            'SELECT id FROM clients WHERE is_active = true'
        );

        if (clientsResult.rows.length === 0) {
            return res.status(400).json({ message: 'No active clients found. Add clients first.' });
        }

        // Insert GST records for each client, skipping duplicates
        let created = 0;
        let skipped = 0;
        for (const client of clientsResult.rows) {
            try {
                await db.query(
                    `INSERT INTO gst_records (client_id, period_id, gstr1_status, gstr3b_status) 
                     VALUES ($1, $2, 'pending', 'pending')`,
                    [client.id, period.id]
                );
                created++;
            } catch (err) {
                if (err.code === '23505') {
                    skipped++;
                } else {
                    throw err;
                }
            }
        }

        res.status(201).json({
            status: 'success',
            data: {
                period,
                created,
                skipped,
                message: `Created ${created} records, skipped ${skipped} (already existed)`
            }
        });
    } catch (err) {
        next(err);
    }
};

/**
 * Get GST records with joined client and period data
 * GET /api/gst-records?periodId=xxx&month=xxx&financial_year=xxx&status=xxx&q=xxx
 */
exports.getGstRecords = async (req, res, next) => {
    try {
        const { periodId, month, financial_year, status, q } = req.query;

        let query = `
      SELECT 
        r.*, 
        c.name as client_name, 
        c.gstin,
        p.month, 
        p.financial_year,
        u.name as assigned_to_name
      FROM gst_records r
      JOIN clients c ON r.client_id = c.id
      JOIN periods p ON r.period_id = p.id
      LEFT JOIN users u ON r.assigned_to = u.id
    `;

        const conditions = [];
        const params = [];
        let paramIndex = 1;

        if (periodId) {
            conditions.push(`r.period_id = $${paramIndex++}`);
            params.push(periodId);
        }
        if (month) {
            conditions.push(`p.month = $${paramIndex++}`);
            params.push(month);
        }
        if (financial_year) {
            conditions.push(`p.financial_year = $${paramIndex++}`);
            params.push(financial_year);
        }
        if (status) {
            conditions.push(`(r.gstr1_status = $${paramIndex} OR r.gstr3b_status = $${paramIndex})`);
            params.push(status.toLowerCase());
            paramIndex++;
        }
        if (q) {
            conditions.push(`(c.name ILIKE $${paramIndex} OR c.gstin ILIKE $${paramIndex})`);
            params.push(`%${q}%`);
            paramIndex++;
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ` ORDER BY c.name ASC`;

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
 * Update a GST record
 * PUT /api/gst-records/:id
 */
exports.updateGstRecord = async (req, res, next) => {
    try {
        const { id } = req.params;
        const {
            gstr1_status,
            gstr3b_status,
            gstr1_filed_date,
            gstr3b_filed_date,
            remarks
        } = req.body;

        const result = await db.query(
            `UPDATE gst_records 
      SET gstr1_status = $1, gstr3b_status = $2, gstr1_filed_date = $3, gstr3b_filed_date = $4, remarks = $5 
      WHERE id = $6 
      RETURNING *`,
            [gstr1_status, gstr3b_status, gstr1_filed_date, gstr3b_filed_date, remarks, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'GST record not found' });
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
 * Bulk update GST records
 * POST /api/gst-records/bulk
 */
exports.bulkUpdateGstRecords = async (req, res, next) => {
    try {
        const { items } = req.body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: 'items array is required' });
        }

        let updated = 0;
        for (const item of items) {
            const fields = [];
            const params = [];
            let paramIndex = 1;

            if (item.gstr1_status) {
                fields.push(`gstr1_status = $${paramIndex++}`);
                params.push(item.gstr1_status);
            }
            if (item.gstr3b_status) {
                fields.push(`gstr3b_status = $${paramIndex++}`);
                params.push(item.gstr3b_status);
            }
            if (item.gstr1_filed_date !== undefined) {
                fields.push(`gstr1_filed_date = $${paramIndex++}`);
                params.push(item.gstr1_filed_date);
            }
            if (item.gstr3b_filed_date !== undefined) {
                fields.push(`gstr3b_filed_date = $${paramIndex++}`);
                params.push(item.gstr3b_filed_date);
            }
            if (item.remarks !== undefined) {
                fields.push(`remarks = $${paramIndex++}`);
                params.push(item.remarks);
            }
            if (item.assigned_to !== undefined) {
                fields.push(`assigned_to = $${paramIndex++}`);
                params.push(item.assigned_to || null);
            }

            if (fields.length > 0 && item.id) {
                params.push(item.id);
                await db.query(
                    `UPDATE gst_records SET ${fields.join(', ')} WHERE id = $${paramIndex}`,
                    params
                );
                updated++;
            }
        }

        res.status(200).json({
            status: 'success',
            data: { updated }
        });
    } catch (err) {
        next(err);
    }
};
