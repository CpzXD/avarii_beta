const pool = require('../config/db');

async function creeaza(session) {
  await pool.query(
    `INSERT INTO sessions (
      id, user_id, refresh_token_hash, created_at, last_used_at, expires_at
    ) VALUES ($1, $2, $3, now(), now(), $4)`,
    [session.id, session.userId, session.refreshTokenHash, session.expiresAt]
  );
  return session;
}

async function gasesteActiva(id) {
  const { rows } = await pool.query(
    `SELECT id, user_id, refresh_token_hash, expires_at, revoked_at
       FROM sessions
      WHERE id = $1
        AND revoked_at IS NULL
        AND expires_at > now()
      LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

async function roteste({ id, expectedHash, newHash, expiresAt }) {
  const { rows } = await pool.query(
    `UPDATE sessions
        SET refresh_token_hash = $3,
            expires_at = $4,
            last_used_at = now()
      WHERE id = $1
        AND refresh_token_hash = $2
        AND revoked_at IS NULL
        AND expires_at > now()
      RETURNING id, user_id, expires_at`,
    [id, expectedHash, newHash, expiresAt]
  );
  return rows[0] || null;
}

async function revoca(id, expectedHash, reason = 'logout') {
  const { rowCount } = await pool.query(
    `UPDATE sessions
        SET revoked_at = now(), revoke_reason = $3
      WHERE id = $1
        AND refresh_token_hash = $2
        AND revoked_at IS NULL`,
    [id, expectedHash, reason]
  );
  return rowCount > 0;
}

async function revocaToatePentruUser(userId, reason = 'security') {
  const { rowCount } = await pool.query(
    `UPDATE sessions
        SET revoked_at = now(), revoke_reason = $2
      WHERE user_id = $1
        AND revoked_at IS NULL`,
    [userId, reason]
  );
  return rowCount;
}

module.exports = { creeaza, gasesteActiva, roteste, revoca, revocaToatePentruUser };
