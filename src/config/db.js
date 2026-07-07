// Conexiune la baza de date PostgreSQL (cu extensia PostGIS)
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

pool.on('connect', () => {
  console.log('Conectat la baza de date PostgreSQL.');
});

pool.on('error', (err) => {
  console.error('Eroare neasteptata la conexiunea cu baza de date:', err);
  process.exit(-1);
});

module.exports = pool;
