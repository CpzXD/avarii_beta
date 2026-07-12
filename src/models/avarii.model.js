const fs = require('fs');
const path = require('path');
const { dataDir, bundledDataDir } = require('../config/paths');

const DB_FILE = path.join(dataDir, 'avarii.json');
const SEED_FILE = path.join(bundledDataDir, 'avarii.json');

function initDb() {
  const dir = path.dirname(DB_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DB_FILE)) {
    if (DB_FILE !== SEED_FILE && fs.existsSync(SEED_FILE)) fs.copyFileSync(SEED_FILE, DB_FILE);
    else fs.writeFileSync(DB_FILE, '[]');
  }
}

function citesteToate() {
  initDb();
  try {
    const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8') || '[]');
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function salveazaToate(avarii) {
  initDb();
  const temp = `${DB_FILE}.tmp`;
  fs.writeFileSync(temp, JSON.stringify(avarii, null, 2));
  fs.renameSync(temp, DB_FILE);
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
  if (statusNou !== 'noua') {
    avarie.vizibilPublic = true;
    avarie.moderare = 'aprobata';
  }
  avarie.statusHistory = Array.isArray(avarie.statusHistory) ? avarie.statusHistory : [];
  avarie.statusHistory.push({ status: statusNou, mesaj: mesajAdmin || mesajImplicitStatus(statusNou), autor: 'admin', data: acum });
  avarie.mesaje = Array.isArray(avarie.mesaje) ? avarie.mesaje : [];
  avarie.mesaje.push({ id: `${Date.now()}-${Math.round(Math.random() * 1e6)}`, autor: 'Sistem', rol: 'sistem', mesaj: mesajAdmin || mesajImplicitStatus(statusNou), data: acum });
  salveazaToate(avarii);
  return avarie;
}

function adaugaMesaj(id, mesajNou) {
  const avarii = citesteToate();
  const index = avarii.findIndex((a) => a.id === id);
  if (index === -1) return null;
  avarii[index].mesaje = Array.isArray(avarii[index].mesaje) ? avarii[index].mesaje : [];
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
  const previousCount = Number(avarie.urmaritori || 0);
  const exista = avarie.followers.some((f) => f.userId === follower.userId || String(f.email || '').toLowerCase() === String(follower.email || '').toLowerCase());
  if (!exista) {
    avarie.followers.push({ ...follower, data: new Date().toISOString() });
    avarie.urmaritori = Math.max(previousCount + 1, avarie.followers.length);
  } else {
    avarie.urmaritori = Math.max(previousCount, avarie.followers.length);
  }
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
  const existent = avarie.feedback.findIndex((f) => f.userId && f.userId === feedbackNou.userId);
  const intrare = { ...feedbackNou, data: acum };
  if (existent >= 0) avarie.feedback[existent] = intrare;
  else avarie.feedback.push(intrare);
  avarie.mesaje = Array.isArray(avarie.mesaje) ? avarie.mesaje : [];
  const mesajIndex = avarie.mesaje.findIndex((m) => m.tip === 'feedback' && m.userId === feedbackNou.userId);
  const steleText = `${'★'.repeat(feedbackNou.stele)}${'☆'.repeat(5 - feedbackNou.stele)}`;
  const mesajFeedback = `Feedback final: ${steleText} (${feedbackNou.stele}/5)${feedbackNou.mesaj ? ` — ${feedbackNou.mesaj}` : ''}`;
  const mesajConversatie = {
    id: mesajIndex >= 0 ? avarie.mesaje[mesajIndex].id : `${Date.now()}-${Math.round(Math.random() * 1e6)}`,
    autor: feedbackNou.nume,
    rol: 'user',
    tip: 'feedback',
    userId: feedbackNou.userId,
    mesaj: mesajFeedback,
    data: acum,
  };
  if (mesajIndex >= 0) avarie.mesaje[mesajIndex] = mesajConversatie;
  else avarie.mesaje.push(mesajConversatie);
  avarie.actualizatLa = acum;
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
  return {
    noua: 'Sesizarea este nouă și așteaptă verificare.',
    confirmata: 'Sesizarea a fost confirmată de administrație.',
    in_lucru: 'Sesizarea este în lucru. Echipa verifică sau intervine în teren.',
    rezolvata: 'Sesizarea a fost marcată ca rezolvată.',
  }[status] || 'Statusul sesizării a fost actualizat.';
}

module.exports = { citesteToate, salveazaToate, gasesteDupaId, creeaza, actualizeazaStatus, adaugaMesaj, urmareste, feedback, sterge };
