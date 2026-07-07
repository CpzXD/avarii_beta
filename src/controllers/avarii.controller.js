const { randomUUID } = require('crypto');
const avariiModel = require('../models/avarii.model');
const usersModel = require('../models/users.model');

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

function creazaAvarie(req, res) {
  const { titlu, categorie, descriere, lat, lng, adresaText, userId, numeAutor, emailAutor } = req.body;
  if (!titlu) return res.status(400).json({ eroare: 'Titlul este obligatoriu.' });
  if ((!lat || !lng) && !adresaText) {
    return res.status(400).json({ eroare: 'Trebuie fie locatie GPS (lat/lng), fie adresa scrisa manual.' });
  }

  const user = userId ? usersModel.gasesteDupaId(userId) : null;
  const pozaUrl = req.file ? `/uploads/${req.file.filename}` : null;
  const acum = new Date().toISOString();

  const avarieNoua = {
    id: randomUUID(),
    titlu,
    categorie: categorie || 'nespecificat',
    descriere: descriere || '',
    dataRaportare: acum,
    actualizatLa: acum,
    lat: lat ? parseFloat(lat) : null,
    lng: lng ? parseFloat(lng) : null,
    adresaText: adresaText || null,
    status: 'noua',
    pozaUrl,
    userId: user ? user.id : (userId || null),
    autor: user ? `${user.prenume} ${user.nume}` : (numeAutor || 'Cetățean'),
    emailAutor: user ? user.email : (emailAutor || ''),
    urmaritori: 1,
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
  const { userId, nume, email, deviceId } = req.body;
  const follower = { userId: userId || null, nume: nume || 'Cetățean', email: email || '', deviceId: deviceId || '' };
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
