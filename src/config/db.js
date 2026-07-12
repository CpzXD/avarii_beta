// Conexiune la baza de date PostgreSQL (Render Postgres)
const { Pool } = require('pg');

// Render îți dă un singur connection string (Internal/External Database URL),
// nu variabile separate DB_HOST/DB_USER/etc. Local, poți pune același
// DATABASE_URL în .env pentru un Postgres instalat pe mașina ta.
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL nu este configurat. Setează-l în .env local sau în Environment pe Render.');
}

const isLocal = /localhost|127\.0\.0\.1/.test(process.env.DATABASE_URL);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Render Postgres cere SSL pe conexiunea externă; local (dev) nu are nevoie.
  ssl: isLocal ? false : { rejectUnauthorized: false },
});

pool.on('error', (err) => {
  console.error('Eroare neașteptată la conexiunea cu baza de date:', err);
});

module.exports = pool;
