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
 * GET /api/gst-records?periodId=xxx
 */
exports.getGstRecords = async (req, res, next) => {
    try {
        const { periodId } = req.query;

        let query = `
      SELECT 
        r.*, 
        c.name as client_name, 
        p.month, 
        p.financial_year 
      FROM gst_records r
      JOIN clients c ON r.client_id = c.id
      JOIN periods p ON r.period_id = p.id
    `;

        const params = [];
        if (periodId) {
            query += ` WHERE r.period_id = $1`;
            params.push(periodId);
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
