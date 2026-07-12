const pool = require('../config/db');

async function salveaza(userId, subscription, userAgent = '') {
  const { rows } = await pool.query(
    `INSERT INTO push_subscriptions (user_id, endpoint, subscription, user_agent)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (endpoint) DO UPDATE
       SET user_id = EXCLUDED.user_id,
           subscription = EXCLUDED.subscription,
           user_agent = EXCLUDED.user_agent,
           updated_at = now()
     RETURNING user_id, endpoint, created_at, updated_at`,
    [userId, subscription.endpoint, subscription, String(userAgent || '').slice(0, 500)]
  );
  return rows[0];
}

async function citestePentruUser(userId) {
  const { rows } = await pool.query(
    `SELECT subscription
       FROM push_subscriptions
      WHERE user_id = $1
      ORDER BY updated_at DESC`,
    [userId]
  );
  return rows.map((row) => row.subscription);
}

async function stergePentruUser(userId, endpoint) {
  const { rowCount } = await pool.query(
    'DELETE FROM push_subscriptions WHERE user_id = $1 AND endpoint = $2',
    [userId, endpoint]
  );
  return rowCount > 0;
}

async function stergeDupaEndpoint(endpoint) {
  const { rowCount } = await pool.query(
    'DELETE FROM push_subscriptions WHERE endpoint = $1',
    [endpoint]
  );
  return rowCount > 0;
}

module.exports = { salveaza, citestePentruUser, stergePentruUser, stergeDupaEndpoint };
