const pool = require('../config/db');
const { hashPassword, verifyPassword } = require('../security/passwords');

async function ensureAdmin() {
  const adminEmail = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const adminPassword = String(process.env.ADMIN_PASSWORD || '');
  if (!adminEmail || adminPassword.length < 10) return;

  const { rows: adminRows } = await pool.query(
    `SELECT id, data FROM users WHERE data->>'rol' = 'admin' LIMIT 1`
  );
  const admin = adminRows[0];

  if (!admin) {
    const userNou = {
      id: 'admin-principal',
      prenume: 'Admin',
      nume: 'Avarii',
      email: adminEmail,
      parola: hashPassword(adminPassword),
      rol: 'admin',
      creatLa: new Date().toISOString(),
    };
    await creeaza(userNou);
    return;
  }

  const data = admin.data;
  let changed = false;
  if (data.email !== adminEmail) { data.email = adminEmail; changed = true; }
  if (!verifyPassword(adminPassword, data.parola)) { data.parola = hashPassword(adminPassword); changed = true; }
  if (changed) {
    await pool.query('UPDATE users SET email = $1, data = $2 WHERE id = $3', [data.email, data, admin.id]);
  }
}

async function gasesteDupaEmail(email) {
  const cautat = String(email || '').toLowerCase();
  const { rows } = await pool.query('SELECT data FROM users WHERE email = $1', [cautat]);
  return rows[0]?.data || undefined;
}

async function gasesteDupaId(id) {
  const { rows } = await pool.query('SELECT data FROM users WHERE id = $1', [id]);
  return rows[0]?.data || undefined;
}

async function creeaza(userNou) {
  await pool.query(
    'INSERT INTO users (id, email, data) VALUES ($1, $2, $3)',
    [userNou.id, String(userNou.email).toLowerCase(), userNou]
  );
  return userNou;
}

async function actualizeazaParola(id, parola) {
  const user = await gasesteDupaId(id);
  if (!user) return false;
  user.parola = parola;
  await pool.query('UPDATE users SET data = $1 WHERE id = $2', [user, id]);
  return true;
}

function publicUser(user) {
  if (!user) return null;
  const { parola, ...safe } = user;
  return safe;
}

module.exports = { ensureAdmin, gasesteDupaEmail, gasesteDupaId, creeaza, actualizeazaParola, publicUser };
