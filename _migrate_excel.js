const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function migrate() {
    try {
        console.log('Connecting to database...');
        const client = await pool.connect();

        console.log('Adding new columns to clients table...');
        await client.query(`
      ALTER TABLE clients ADD COLUMN IF NOT EXISTS lead VARCHAR(255);
      ALTER TABLE clients ADD COLUMN IF NOT EXISTS default_assigned_to UUID REFERENCES users(id) ON DELETE SET NULL;
      ALTER TABLE clients ADD COLUMN IF NOT EXISTS rank VARCHAR(50);
      ALTER TABLE clients ADD COLUMN IF NOT EXISTS rcm_applicable BOOLEAN DEFAULT false;
      ALTER TABLE clients ADD COLUMN IF NOT EXISTS contact_number VARCHAR(50);
      ALTER TABLE clients ADD COLUMN IF NOT EXISTS mode_of_filing VARCHAR(50);
    `);

        console.log('Adding new columns to gst_records table...');
        await client.query(`
      /* GSTR-1 Fields */
      ALTER TABLE gst_records ADD COLUMN IF NOT EXISTS gstr1_tally_received VARCHAR(50);
      ALTER TABLE gst_records ADD COLUMN IF NOT EXISTS gstr1_entered_in_tally BOOLEAN DEFAULT false;
      ALTER TABLE gst_records ADD COLUMN IF NOT EXISTS gstr1_nil_return BOOLEAN DEFAULT false;
      ALTER TABLE gst_records ADD COLUMN IF NOT EXISTS gstr1_comments TEXT;
      
      /* GSTR-3B Fields */
      ALTER TABLE gst_records ADD COLUMN IF NOT EXISTS gstr3b_tally_received VARCHAR(50);
      ALTER TABLE gst_records ADD COLUMN IF NOT EXISTS gstr3b_entered_in_tally BOOLEAN DEFAULT false;
      ALTER TABLE gst_records ADD COLUMN IF NOT EXISTS gstr3b_reconciliation VARCHAR(50);
      ALTER TABLE gst_records ADD COLUMN IF NOT EXISTS gstr3b_notices_orders BOOLEAN DEFAULT false;
      ALTER TABLE gst_records ADD COLUMN IF NOT EXISTS gstr3b_bills_pending BOOLEAN DEFAULT false;
      ALTER TABLE gst_records ADD COLUMN IF NOT EXISTS gstr3b_tax_liability VARCHAR(255);
      ALTER TABLE gst_records ADD COLUMN IF NOT EXISTS gstr3b_nil_return BOOLEAN DEFAULT false;
      ALTER TABLE gst_records ADD COLUMN IF NOT EXISTS gstr3b_comments TEXT;

      /* Other Fields */
      ALTER TABLE gst_records ADD COLUMN IF NOT EXISTS gstr1a_applicable BOOLEAN DEFAULT false;
      ALTER TABLE gst_records ADD COLUMN IF NOT EXISTS billing_status VARCHAR(100);
      ALTER TABLE gst_records ADD COLUMN IF NOT EXISTS bill_sent BOOLEAN DEFAULT false;
    `);

        console.log('✅ Migration complete!');
        client.release();
    } catch (err) {
        console.error('❌ Error during migration:', err.stack);
    } finally {
        await pool.end();
    }
}

migrate();
