const fs = require('fs');
const path = require('path');
const { dataDir, bundledDataDir } = require('../config/paths');
const { hashPassword, verifyPassword } = require('../security/passwords');

const DB_FILE = path.join(dataDir, 'users.json');
const SEED_FILE = path.join(bundledDataDir, 'users.json');

function initDb() {
  const dir = path.dirname(DB_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DB_FILE)) {
    if (DB_FILE !== SEED_FILE && fs.existsSync(SEED_FILE)) fs.copyFileSync(SEED_FILE, DB_FILE);
    else fs.writeFileSync(DB_FILE, '[]');
  }
}

function citesteToti() {
  initDb();
  try {
    const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8') || '[]');
    const users = Array.isArray(data) ? data : [];
    const adminEmail = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
    const adminPassword = String(process.env.ADMIN_PASSWORD || '');
    if (adminEmail && adminPassword.length >= 10) {
      let admin = users.find((u) => u.rol === 'admin');
      if (!admin) {
        admin = { id: 'admin-principal', prenume: 'Admin', nume: 'Avarii', email: adminEmail, parola: hashPassword(adminPassword), rol: 'admin', creatLa: new Date().toISOString() };
        users.push(admin);
        salveazaToti(users);
      } else {
        let changed = false;
        if (admin.email !== adminEmail) { admin.email = adminEmail; changed = true; }
        if (!verifyPassword(adminPassword, admin.parola)) { admin.parola = hashPassword(adminPassword); changed = true; }
        if (changed) salveazaToti(users);
      }
    }
    return users;
  } catch {
    return [];
  }
}

function salveazaToti(users) {
  initDb();
  const temp = `${DB_FILE}.tmp`;
  fs.writeFileSync(temp, JSON.stringify(users, null, 2));
  fs.renameSync(temp, DB_FILE);
}

function gasesteDupaEmail(email) {
  const cautat = String(email || '').toLowerCase();
  return citesteToti().find((u) => String(u.email || '').toLowerCase() === cautat);
}

function gasesteDupaId(id) {
  return citesteToti().find((u) => u.id === id);
}

function creeaza(userNou) {
  const users = citesteToti();
  users.push(userNou);
  salveazaToti(users);
  return userNou;
}

function actualizeazaParola(id, parola) {
  const users = citesteToti();
  const index = users.findIndex((u) => u.id === id);
  if (index === -1) return false;
  users[index].parola = parola;
  salveazaToti(users);
  return true;
}

function publicUser(user) {
  if (!user) return null;
  const { parola, ...safe } = user;
  return safe;
}

module.exports = { citesteToti, gasesteDupaEmail, gasesteDupaId, creeaza, actualizeazaParola, publicUser };
