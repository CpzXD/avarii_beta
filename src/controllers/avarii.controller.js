const { randomUUID } = require('crypto');
const avariiModel = require('../models/avarii.model');
const usersModel = require('../models/users.model');
const { isInsideServiceArea } = require('../config/service-area');
const { reverseGeocode } = require('../services/geocoding.service');

function listaAvarii(req, res) {
  let avarii = avariiModel.citesteToate();
  if (req.query.userId) {
    avarii = avarii.filter((a) => a.userId === req.query.userId);
  }
  res.json(avarii);
}

function detaliiAvarie(req, res) {
  const avarie = avariiModel.gasesteDupaId(req.params.id);
  if (!avarie) return res.status(404).json({ eroare: 'Avaria nu a fost gasita.' });
  res.json(avarie);
}

async function creazaAvarie(req, res) {
  const { titlu, categorie, descriere, lat, lng, adresaText, userId, numeAutor, emailAutor } = req.body;
  if (!titlu) return res.status(400).json({ eroare: 'Titlul este obligatoriu.' });
  if ((!lat || !lng) && !adresaText) {
    return res.status(400).json({ eroare: 'Trebuie fie locatie GPS (lat/lng), fie adresa scrisa manual.' });
  }
  const latitude = lat ? Number(lat) : null;
  const longitude = lng ? Number(lng) : null;
  if ((latitude !== null || longitude !== null) && !isInsideServiceArea(latitude, longitude)) {
    return res.status(400).json({ eroare: 'Locația trebuie să fie în zona Constanța–Mamaia.' });
  }

  const user = userId ? usersModel.gasesteDupaId(userId) : null;
  const pozaUrl = req.file ? `/uploads/${req.file.filename}` : null;
  const adresaCurata = String(adresaText || '').trim();
  const adresaGenerica = !adresaCurata
    || ['locație gps', 'locatie gps', 'gps'].includes(adresaCurata.toLowerCase())
    || /^-?\d+(?:\.\d+)?,\s*-?\d+(?:\.\d+)?$/.test(adresaCurata);
  const adresaRezolvata = !adresaGenerica
    ? adresaCurata
    : (latitude !== null && longitude !== null ? await reverseGeocode(latitude, longitude) : '');
  const acum = new Date().toISOString();

  const avarieNoua = {
    id: randomUUID(),
    titlu,
    categorie: categorie || 'nespecificat',
    descriere: descriere || '',
    dataRaportare: acum,
    actualizatLa: acum,
    lat: latitude,
    lng: longitude,
    adresaText: adresaRezolvata || null,
    status: 'noua',
    pozaUrl,
    userId: user ? user.id : (userId || null),
    autor: user ? `${user.prenume} ${user.nume}` : (numeAutor || 'Cetățean'),
    emailAutor: user ? user.email : (emailAutor || ''),
    urmaritori: user ? 1 : 0,
    followers: user ? [{ userId: user.id, nume: `${user.prenume} ${user.nume}`, email: user.email, data: acum }] : [],
    feedback: [],
    statusHistory: [{ status: 'noua', mesaj: 'Sesizarea a fost trimisă.', autor: 'sistem', data: acum }],
    mesaje: [{ id: randomUUID(), autor: 'Sistem', rol: 'sistem', mesaj: 'Sesizarea a fost primită.', data: acum }],
  };

  avariiModel.creeaza(avarieNoua);
  res.status(201).json(avarieNoua);
}

function actualizeazaStatus(req, res) {
  const { status, mesaj } = req.body;
  const statusuriValide = ['noua', 'confirmata', 'in_lucru', 'rezolvata'];
  if (!statusuriValide.includes(status)) {
    return res.status(400).json({ eroare: `Status invalid. Valori acceptate: ${statusuriValide.join(', ')}` });
  }
  const avarieActualizata = avariiModel.actualizeazaStatus(req.params.id, status, mesaj);
  if (!avarieActualizata) return res.status(404).json({ eroare: 'Avaria nu a fost gasita.' });
  res.json(avarieActualizata);
}

function listaMesaje(req, res) {
  const avarie = avariiModel.gasesteDupaId(req.params.id);
  if (!avarie) return res.status(404).json({ eroare: 'Avaria nu a fost gasita.' });
  res.json(avarie.mesaje || []);
}

function adaugaMesaj(req, res) {
  const { mesaj, autor, rol } = req.body;
  if (!mesaj) return res.status(400).json({ eroare: 'Mesajul este obligatoriu.' });
  const mesajNou = { id: randomUUID(), autor: autor || 'Cetățean', rol: rol || 'user', mesaj, data: new Date().toISOString() };
  const avarieActualizata = avariiModel.adaugaMesaj(req.params.id, mesajNou);
  if (!avarieActualizata) return res.status(404).json({ eroare: 'Avaria nu a fost gasita.' });
  res.status(201).json(mesajNou);
}

function urmaresteAvarie(req, res) {
  const { userId, nume, email } = req.body;
  if (!userId) return res.status(401).json({ eroare: 'Trebuie să fii conectat pentru a urmări o sesizare.' });
  const user = usersModel.gasesteDupaId(userId);
  if (!user || String(user.email).toLowerCase() !== String(email || '').toLowerCase()) {
    return res.status(403).json({ eroare: 'Contul nu a putut fi verificat.' });
  }
  const follower = { userId: user.id, nume: nume || `${user.prenume} ${user.nume}`, email: user.email };
  const avarieActualizata = avariiModel.urmareste(req.params.id, follower);
  if (!avarieActualizata) return res.status(404).json({ eroare: 'Avaria nu a fost gasita.' });
  res.json(avarieActualizata);
}

function feedbackAvarie(req, res) {
  const { raspuns, mesaj, userId, nume, email } = req.body;
  if (!['da', 'nu'].includes(raspuns)) return res.status(400).json({ eroare: 'Feedback invalid.' });
  const feedbackNou = { raspuns, mesaj: mesaj || '', userId: userId || null, nume: nume || 'Cetățean', email: email || '' };
  const avarieActualizata = avariiModel.feedback(req.params.id, feedbackNou);
  if (!avarieActualizata) return res.status(404).json({ eroare: 'Avaria nu a fost gasita.' });
  res.json(avarieActualizata);
}

function stergeAvarie(req, res) {
  const avarie = avariiModel.gasesteDupaId(req.params.id);
  if (!avarie) return res.status(404).json({ eroare: 'Avaria nu a fost gasita.' });
  const succes = avariiModel.sterge(req.params.id);
  if (!succes) return res.status(500).json({ eroare: 'Nu am putut sterge avaria.' });
  res.json({ mesaj: 'Sesizarea a fost stearsa.', id: req.params.id });
}

module.exports = { listaAvarii, detaliiAvarie, creazaAvarie, actualizeazaStatus, listaMesaje, adaugaMesaj, urmaresteAvarie, feedbackAvarie, stergeAvarie };
