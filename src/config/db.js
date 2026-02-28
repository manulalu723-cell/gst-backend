const { Pool } = require('pg');
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';

const poolConfig = process.env.DATABASE_URL
  ? { connectionString: process.env.DATABASE_URL }
  : {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  };

// Enable SSL for production (required by Railway)
if (isProduction) {
  poolConfig.ssl = {
    rejectUnauthorized: false
  };
}

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
