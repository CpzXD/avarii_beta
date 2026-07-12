const fs = require('fs');
const path = require('path');
const pool = require('./db');

async function initDb() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  await pool.query(schema);
}

module.exports = initDb;
