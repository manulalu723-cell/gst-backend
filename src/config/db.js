const { Pool } = require('pg');
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';
const hasDatabaseUrl = process.env.DATABASE_URL && process.env.DATABASE_URL.trim() !== '';

// Diagnostics to stderr to bypass potential stdout buffering
console.error('--- DATABASE CONNECTION DIAGNOSTICS ---');
console.error(`[DB] NODE_ENV: ${process.env.NODE_ENV || 'undefined (defaulting to development)'}`);
console.error(`[DB] isProduction: ${isProduction}`);
console.error(`[DB] DATABASE_URL present: ${hasDatabaseUrl}`);

let poolConfig;

if (hasDatabaseUrl) {
  const dbUrl = process.env.DATABASE_URL.trim();
  console.error('[DB] Action: Using DATABASE_URL.');
  poolConfig = { connectionString: dbUrl };

  // For Railway/Cloud: Enable SSL if it's a remote URL and not explicitly disabled
  if (!dbUrl.includes('localhost') && !dbUrl.includes('127.0.0.1')) {
    console.error('[DB] SSL: Auto-Enabling for remote connection (rejectUnauthorized: false)');
    poolConfig.ssl = { rejectUnauthorized: false };
  }
} else if (process.env.DB_HOST && process.env.DB_HOST.trim() !== '') {
  console.error(`[DB] Action: Using individual variables. Host: ${process.env.DB_HOST}`);
  poolConfig = {
    host: process.env.DB_HOST.trim(),
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER ? process.env.DB_USER.trim() : undefined,
    password: process.env.DB_PASSWORD ? process.env.DB_PASSWORD.trim() : undefined,
    database: process.env.DB_NAME ? process.env.DB_NAME.trim() : undefined,
  };

  if (isProduction || (!poolConfig.host.includes('localhost') && !poolConfig.host.includes('127.0.0.1'))) {
    console.error('[DB] SSL: Enabling for production/remote host (rejectUnauthorized: false)');
    poolConfig.ssl = { rejectUnauthorized: false };
  }
} else {
  console.error('[DB] CRITICAL ERROR: No connection configuration found! Ensure DATABASE_URL or DB_HOST is set.');
  process.exit(1);
}

console.error('--- END DIAGNOSTICS ---');

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
