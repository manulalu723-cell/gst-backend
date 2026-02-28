const { Pool } = require('pg');
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';
console.log('--- DATABASE CONNECTION DIAGNOSTICS ---');
console.log(`[DB] NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`[DB] isProduction: ${isProduction}`);
console.log(`[DB] DATABASE_URL present: ${!!process.env.DATABASE_URL}`);
console.log(`[DB] DB_HOST present: ${!!process.env.DB_HOST}`);
console.log(`[DB] DB_NAME present: ${!!process.env.DB_NAME}`);

let poolConfig;

if (process.env.DATABASE_URL && process.env.DATABASE_URL.trim() !== '') {
  console.log('[DB] Action: Using DATABASE_URL.');
  poolConfig = {
    connectionString: process.env.DATABASE_URL.trim()
  };
} else if (process.env.DB_HOST && process.env.DB_HOST.trim() !== '') {
  console.log(`[DB] Action: Using individual variables. Host: ${process.env.DB_HOST}`);
  poolConfig = {
    host: process.env.DB_HOST.trim(),
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER ? process.env.DB_USER.trim() : undefined,
    password: process.env.DB_PASSWORD ? process.env.DB_PASSWORD.trim() : undefined,
    database: process.env.DB_NAME ? process.env.DB_NAME.trim() : undefined,
  };
} else {
  console.error('[DB] CRITICAL ERROR: No connection configuration found!');
  process.exit(1);
}

// Enable SSL for production (required by Railway)
if (isProduction) {
  console.log('[DB] SSL: Enabled (rejectUnauthorized: false)');
  poolConfig.ssl = {
    rejectUnauthorized: false
  };
} else {
  console.log('[DB] SSL: Disabled');
}

console.log('--- END DIAGNOSTICS ---');

const pool = new Pool(poolConfig);

// Proactive test connection and schema check on server start
pool.query("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users')", (err, res) => {
  if (err) {
    console.error('CRITICAL: Database connection failed!', {
      message: err.message,
      code: err.code,
      detail: err.detail,
    });
  } else if (!res.rows[0].exists) {
    console.warn('WARNING: The "users" table does not exist. Please run the schema.sql script against your database.');
  } else {
    console.log('Successfully connected to PostgreSQL. Verified that "users" table exists.');
  }
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
