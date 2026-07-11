const fs = require('fs');
const path = require('path');
const { dataDir, bundledDataDir } = require('../config/paths');

const DB_FILE = path.join(dataDir, 'avarii.json');
const SEED_FILE = path.join(bundledDataDir, 'avarii.json');

function initDb() {
  const dir = path.dirname(DB_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DB_FILE)) {
    if (DB_FILE !== SEED_FILE && fs.existsSync(SEED_FILE)) {
      fs.copyFileSync(SEED_FILE, DB_FILE);
    } else {
      fs.writeFileSync(DB_FILE, JSON.stringify([], null, 2));
    }
  }
}

function citesteToate() {
  initDb();
  const continut = fs.readFileSync(DB_FILE, 'utf-8');
  return JSON.parse(continut || '[]');
}

function salveazaToate(avarii) {
  initDb();
  fs.writeFileSync(DB_FILE, JSON.stringify(avarii, null, 2));
}

function gasesteDupaId(id) {
  return citesteToate().find((a) => a.id === id);
}

function creeaza(avarieNoua) {
  const avarii = citesteToate();
  avarii.push(avarieNoua);
  salveazaToate(avarii);
  return avarieNoua;
}

function actualizeazaStatus(id, statusNou, mesajAdmin = '') {
  const avarii = citesteToate();
  const index = avarii.findIndex((a) => a.id === id);
  if (index === -1) return null;

  const acum = new Date().toISOString();
  const avarie = avarii[index];
  avarie.status = statusNou;
  avarie.actualizatLa = acum;
  avarie.statusHistory = avarie.statusHistory || [];
  avarie.statusHistory.push({
    status: statusNou,
    mesaj: mesajAdmin || mesajImplicitStatus(statusNou),
    autor: 'admin',
    data: acum,
  });

  avarie.mesaje = avarie.mesaje || [];
  avarie.mesaje.push({
    id: `${Date.now()}-${Math.round(Math.random() * 1e6)}`,
    autor: 'Sistem',
    rol: 'sistem',
    mesaj: mesajAdmin || mesajImplicitStatus(statusNou),
    data: acum,
  });

  salveazaToate(avarii);
  return avarie;
}

function adaugaMesaj(id, mesajNou) {
  const avarii = citesteToate();
  const index = avarii.findIndex((a) => a.id === id);
  if (index === -1) return null;
  avarii[index].mesaje = avarii[index].mesaje || [];
  avarii[index].mesaje.push(mesajNou);
  avarii[index].actualizatLa = mesajNou.data;
  salveazaToate(avarii);
  return avarii[index];
}

function urmareste(id, follower) {
  const avarii = citesteToate();
  const index = avarii.findIndex((a) => a.id === id);
  if (index === -1) return null;
  const avarie = avarii[index];
  avarie.followers = Array.isArray(avarie.followers) ? avarie.followers : [];
  const key = follower.userId || follower.email || follower.deviceId || 'anonim';
  const exista = avarie.followers.some((f) => (f.userId || f.email || f.deviceId || 'anonim') === key);
  if (!exista) {
    avarie.followers.push({ ...follower, data: new Date().toISOString() });
  }
  avarie.urmaritori = avarie.followers.length;
  salveazaToate(avarii);
  return avarie;
}

function feedback(id, feedbackNou) {
  const avarii = citesteToate();
  const index = avarii.findIndex((a) => a.id === id);
  if (index === -1) return null;
  const acum = new Date().toISOString();
  const avarie = avarii[index];
  avarie.feedback = Array.isArray(avarie.feedback) ? avarie.feedback : [];
  avarie.feedback.push({ ...feedbackNou, data: acum });
  avarie.actualizatLa = acum;

  if (feedbackNou.raspuns === 'nu') {
    avarie.status = 'confirmata';
    avarie.statusHistory = avarie.statusHistory || [];
    avarie.statusHistory.push({
      status: 'confirmata',
      mesaj: 'Utilizatorul a spus că problema nu este rezolvată. Necesită reverificare.',
      autor: 'utilizator',
      data: acum,
    });
    avarie.mesaje = avarie.mesaje || [];
    avarie.mesaje.push({
      id: `${Date.now()}-${Math.round(Math.random() * 1e6)}`,
      autor: 'Sistem',
      rol: 'sistem',
      mesaj: 'Feedback primit: problema nu este rezolvată. Sesizarea a fost redeschisă pentru verificare.',
      data: acum,
    });
  }

  salveazaToate(avarii);
  return avarie;
}

function sterge(id) {
  const avarii = citesteToate();
  const index = avarii.findIndex((a) => a.id === id);
  if (index === -1) return false;
  avarii.splice(index, 1);
  salveazaToate(avarii);
  return true;
}

function mesajImplicitStatus(status) {
  const mesaje = {
    noua: 'Sesizarea este nouă și așteaptă verificare.',
    confirmata: 'Sesizarea a fost confirmată de administrație.',
    in_lucru: 'Sesizarea este în lucru. Echipa verifică/intervine în teren.',
    rezolvata: 'Sesizarea a fost marcată ca rezolvată.',
  };
  return mesaje[status] || 'Statusul sesizării a fost actualizat.';
}

module.exports = {
  citesteToate,
  gasesteDupaId,
  creeaza,
  actualizeazaStatus,
  adaugaMesaj,
  urmareste,
  feedback,
  sterge,
};
