const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, '..', '..', 'data', 'users.json');

function initDb() {
  const dir = path.dirname(DB_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DB_FILE)) {
    const demoUsers = [
      {
        id: 'admin-demo',
        prenume: 'Demo',
        nume: 'Admin',
        email: 'admin@demo.ro',
        parola: 'admin123',
        rol: 'admin',
        creatLa: new Date().toISOString(),
      },
      {
        id: 'user-demo',
        prenume: 'Andrei',
        nume: 'Popescu',
        email: 'user@demo.ro',
        parola: 'user123',
        rol: 'user',
        creatLa: new Date().toISOString(),
      },
    ];
    fs.writeFileSync(DB_FILE, JSON.stringify(demoUsers, null, 2));
  }
}

function citesteToti() {
  initDb();
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
}

function salveazaToti(users) {
  fs.writeFileSync(DB_FILE, JSON.stringify(users, null, 2));
}

function gasesteDupaEmail(email) {
  const users = citesteToti();
  return users.find((u) => u.email.toLowerCase() === String(email || '').toLowerCase());
}

function gasesteDupaId(id) {
  const users = citesteToti();
  return users.find((u) => u.id === id);
}

function creeaza(userNou) {
  const users = citesteToti();
  users.push(userNou);
  salveazaToti(users);
  return userNou;
}

function publicUser(user) {
  if (!user) return null;
  const { parola, ...safe } = user;
  return safe;
}

module.exports = { citesteToti, gasesteDupaEmail, gasesteDupaId, creeaza, publicUser };
