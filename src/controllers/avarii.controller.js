const { randomUUID } = require('crypto');
const fs = require('fs');
const path = require('path');
const { uploadsDir } = require('../config/paths');
const avariiModel = require('../models/avarii.model');
const { isInsideServiceArea } = require('../config/service-area');
const { reverseGeocode } = require('../services/geocoding.service');
const { saveImage } = require('../middleware/upload');
const { cleanText, cleanMultiline, normalizeForMatch, looksLikeSpam } = require('../security/text');
const { anonymousHash } = require('../security/tokens');
const { verifyTurnstile } = require('../security/turnstile');

const categorii = new Set(['bec ars', 'stalp defect', 'stalp cazut', 'cablu expus', 'zona intunecata', 'panou defect', 'altele', 'nespecificat']);

function isVisible() {
  return true;
}

function relations(a, auth) {
  const isOwn = Boolean(auth && auth.rol === 'user' && (a.userId === auth.id || String(a.emailAutor || '').toLowerCase() === String(auth.email || '').toLowerCase()));
  const isFollowing = Boolean(auth && auth.rol === 'user' && Array.isArray(a.followers) && a.followers.some((f) => f.userId === auth.id || String(f.email || '').toLowerCase() === String(auth.email || '').toLowerCase()));
  const canViewConversation = Boolean(auth && (auth.rol === 'admin' || isOwn || isFollowing));
  const canSendMessage = Boolean(auth && (auth.rol === 'admin' || isOwn));
  return { isOwn, isFollowing, canViewConversation, canSendMessage, canCommunicate: canViewConversation };
}

function publicFields(a, auth) {
  const rel = relations(a, auth);
  return {
    id: a.id,
    titlu: a.titlu,
    categorie: a.categorie,
    dataRaportare: a.dataRaportare,
    actualizatLa: a.actualizatLa,
    lat: a.lat,
    lng: a.lng,
    adresaText: a.adresaText,
    status: a.status,
    pozaUrl: a.pozaUrl,
    urmaritori: Number(a.urmaritori || 0),
    isOwn: rel.isOwn,
    isFollowing: rel.isFollowing,
  };
}

function adminFields(a) {
  const { reporterHash, requestId, ...safe } = a;
  return safe;
}

function detailFields(a, auth) {
  if (auth.rol === 'admin') return { ...adminFields(a), canCommunicate: true, canSendMessage: true, isOwn: false, isFollowing: false };
  const rel = relations(a, auth);
  const ownFeedback = Array.isArray(a.feedback) ? a.feedback.filter((f) => f.userId === auth.id) : [];
  return {
    ...publicFields(a, auth),
    descriere: a.descriere || '',
    autor: a.autor || 'Cetățean',
    statusHistory: Array.isArray(a.statusHistory) ? a.statusHistory : [],
    mesaje: rel.canViewConversation && Array.isArray(a.mesaje) ? a.mesaje : [],
    feedback: ownFeedback,
    canCommunicate: rel.canViewConversation,
    canSendMessage: rel.canSendMessage,
  };
}

function distanceMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const toRad = (value) => value * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const value = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function botCheck(body) {
  if (cleanText(body.website, 100)) return false;
  const started = Number(body.formStartedAt || 0);
  if (started && Date.now() - started < 800) return false;
  return true;
}

async function findDuplicate({ requestId, reporterKey, titlu, categorie, lat, lng }) {
  const now = Date.now();
  const toate = await avariiModel.citesteToate();
  return toate.find((a) => {
    if (requestId && a.requestId === requestId) return true;
    const created = Date.parse(a.dataRaportare || 0);
    if (!created || now - created > 10 * 60 * 1000) return false;
    const sameReporter = reporterKey && (a.userId === reporterKey || a.reporterHash === reporterKey);
    if (!sameReporter) return false;
    const sameCategory = normalizeForMatch(a.categorie) === normalizeForMatch(categorie);
    const sameTitle = normalizeForMatch(a.titlu) === normalizeForMatch(titlu);
    if (!sameCategory && !sameTitle) return false;
    if (Number.isFinite(lat) && Number.isFinite(lng) && Number.isFinite(Number(a.lat)) && Number.isFinite(Number(a.lng))) {
      return distanceMeters(lat, lng, Number(a.lat), Number(a.lng)) < 60;
    }
    return sameTitle;
  });
}

async function listaAvarii(req, res) {
  const auth = req.auth;
  let avarii = await avariiModel.citesteToate();
  if (auth?.rol !== 'admin') avarii = avarii.filter((a) => isVisible(a) || relations(a, auth).isOwn);
  res.json(avarii.map((a) => auth?.rol === 'admin' ? adminFields(a) : publicFields(a, auth)));
}

async function detaliiAvarie(req, res) {
  const avarie = await avariiModel.gasesteDupaId(req.params.id);
  if (!avarie || (!isVisible(avarie) && req.auth.rol !== 'admin' && !relations(avarie, req.auth).isOwn)) return res.status(404).json({ eroare: 'Sesizarea nu a fost găsită.' });
  res.json(detailFields(avarie, req.auth));
}

async function creazaAvarie(req, res) {
  if (!botCheck(req.body)) return res.status(400).json({ eroare: 'Cererea nu a putut fi verificată.' });
  if (!(await verifyTurnstile(req.body.turnstileToken, req.ip))) return res.status(400).json({ eroare: 'Verificarea anti-spam nu a reușit.' });
  const titlu = cleanText(req.body.titlu, 100);
  const descriere = cleanMultiline(req.body.descriere, 1000);
  const categorieRaw = normalizeForMatch(req.body.categorie || 'nespecificat');
  const categorie = categorii.has(categorieRaw) ? categorieRaw : 'altele';
  const adresaCurata = cleanText(req.body.adresaText, 180);
  const latitude = req.body.lat !== undefined && req.body.lat !== '' ? Number(req.body.lat) : null;
  const longitude = req.body.lng !== undefined && req.body.lng !== '' ? Number(req.body.lng) : null;
  const requestId = cleanText(req.body.requestId, 80);
  if (titlu.length < 5) return res.status(400).json({ eroare: 'Titlul trebuie să aibă minimum 5 caractere.' });
  if (looksLikeSpam(`${titlu} ${descriere}`)) return res.status(400).json({ eroare: 'Textul sesizării pare repetitiv sau conține prea multe linkuri.' });
  if ((latitude === null || longitude === null) && !adresaCurata) return res.status(400).json({ eroare: 'Selectează locația pe hartă sau introdu o adresă.' });
  if ((latitude !== null || longitude !== null) && !isInsideServiceArea(latitude, longitude)) return res.status(400).json({ eroare: 'Locația este în afara zonei acoperite.' });
  const auth = req.auth?.rol === 'user' ? req.auth : null;
  const reporterHash = auth ? null : anonymousHash(req.ip);
  const reporterKey = auth ? auth.id : reporterHash;
  const duplicate = await findDuplicate({ requestId, reporterKey, titlu, categorie, lat: latitude, lng: longitude });
  if (duplicate) return res.status(409).json({ eroare: 'Ai trimis deja o sesizare foarte asemănătoare în ultimele minute.', duplicateId: duplicate.id });
  const generic = !adresaCurata || ['locatie gps', 'gps'].includes(normalizeForMatch(adresaCurata)) || /^-?\d+(?:\.\d+)?,\s*-?\d+(?:\.\d+)?$/.test(adresaCurata);
  const adresaRezolvata = !generic ? adresaCurata : (latitude !== null && longitude !== null ? await reverseGeocode(latitude, longitude) : '');
  let pozaUrl = null;
  try {
    pozaUrl = saveImage(req.file);
  } catch (error) {
    return res.status(400).json({ eroare: error.message });
  }
  const acum = new Date().toISOString();
  const avarieNoua = {
    id: randomUUID(),
    titlu,
    categorie,
    descriere,
    dataRaportare: acum,
    actualizatLa: acum,
    lat: latitude,
    lng: longitude,
    adresaText: adresaRezolvata || null,
    status: 'noua',
    pozaUrl,
    userId: auth?.id || null,
    autor: auth ? `${auth.prenume} ${auth.nume}` : 'Cetățean anonim',
    emailAutor: auth?.email || '',
    urmaritori: auth ? 1 : 0,
    followers: auth ? [{ userId: auth.id, nume: `${auth.prenume} ${auth.nume}`, email: auth.email, data: acum }] : [],
    feedback: [],
    statusHistory: [{ status: 'noua', mesaj: 'Sesizarea a fost trimisă.', autor: 'sistem', data: acum }],
    mesaje: [{ id: randomUUID(), autor: 'Sistem', rol: 'sistem', mesaj: 'Sesizarea a fost primită.', data: acum }],
    vizibilPublic: true,
    moderare: 'aprobata',
    reporterHash,
    requestId: requestId || randomUUID(),
  };
  await avariiModel.creeaza(avarieNoua);
  res.status(201).json(auth ? detailFields(avarieNoua, auth) : { id: avarieNoua.id, mesaj: 'Sesizarea a fost trimisă și este vizibilă pe hartă.' });
}

async function actualizeazaStatus(req, res) {
  const status = cleanText(req.body.status, 30);
  const mesaj = cleanMultiline(req.body.mesaj, 600);
  const statusuriValide = ['noua', 'confirmata', 'in_lucru', 'rezolvata'];
  if (!statusuriValide.includes(status)) return res.status(400).json({ eroare: 'Status invalid.' });
  if (looksLikeSpam(mesaj)) return res.status(400).json({ eroare: 'Mesajul nu este valid.' });
  const avarie = await avariiModel.actualizeazaStatus(req.params.id, status, mesaj);
  if (!avarie) return res.status(404).json({ eroare: 'Sesizarea nu a fost găsită.' });
  res.json(adminFields(avarie));
}

async function listaMesaje(req, res) {
  const avarie = await avariiModel.gasesteDupaId(req.params.id);
  if (!avarie) return res.status(404).json({ eroare: 'Sesizarea nu a fost găsită.' });
  if (!relations(avarie, req.auth).canViewConversation) return res.status(403).json({ eroare: 'Urmărește sesizarea pentru a vedea conversația.' });
  res.json(Array.isArray(avarie.mesaje) ? avarie.mesaje : []);
}

async function adaugaMesaj(req, res) {
  const avarie = await avariiModel.gasesteDupaId(req.params.id);
  if (!avarie) return res.status(404).json({ eroare: 'Sesizarea nu a fost găsită.' });
  const rel = relations(avarie, req.auth);
  if (!rel.canSendMessage) {
    return res.status(403).json({ eroare: 'Doar creatorul sesizării și administratorul pot scrie în conversație.' });
  }
  const mesaj = cleanMultiline(req.body.mesaj, 600);
  if (mesaj.length < 2 || looksLikeSpam(mesaj)) return res.status(400).json({ eroare: 'Mesajul trebuie să aibă între 2 și 600 de caractere și să nu fie repetitiv.' });
  const isAdmin = req.auth.rol === 'admin';
  const mesaje = Array.isArray(avarie.mesaje) ? avarie.mesaje : [];
  if (!isAdmin) {
    const now = Date.now();
    const userName = `${req.auth.prenume} ${req.auth.nume}`.trim();
    const isOwnMessage = (entry) => entry && entry.rol === 'user' && (entry.userId === req.auth.id || (!entry.userId && entry.autor === userName));
    const ownMessages = mesaje.filter(isOwnMessage);
    const lastOwn = ownMessages[ownMessages.length - 1];
    if (lastOwn) {
      const lastAt = Date.parse(lastOwn.data || 0);
      if (lastAt && now - lastAt < 15 * 1000) {
        const wait = Math.max(1, Math.ceil((15 * 1000 - (now - lastAt)) / 1000));
        return res.status(429).json({ eroare: `Așteaptă ${wait} secunde înainte de următorul mesaj.` });
      }
    }
    const normalized = normalizeForMatch(mesaj);
    const duplicate = ownMessages.some((entry) => {
      const created = Date.parse(entry.data || 0);
      return created && now - created <= 10 * 60 * 1000 && normalizeForMatch(entry.mesaj) === normalized;
    });
    if (duplicate) return res.status(409).json({ eroare: 'Acest mesaj a fost deja trimis recent.' });
    let consecutive = 0;
    for (let index = mesaje.length - 1; index >= 0; index -= 1) {
      const entry = mesaje[index];
      if (entry?.rol === 'admin' || entry?.rol === 'sistem') break;
      if (isOwnMessage(entry)) consecutive += 1;
    }
    if (consecutive >= 3) {
      return res.status(429).json({ eroare: 'Ai trimis deja 3 mesaje consecutive. Așteaptă un răspuns din partea administrației.' });
    }
  }
  const mesajNou = {
    id: randomUUID(),
    autor: isAdmin ? 'Admin' : `${req.auth.prenume} ${req.auth.nume}`,
    rol: isAdmin ? 'admin' : 'user',
    userId: isAdmin ? null : req.auth.id,
    mesaj,
    data: new Date().toISOString(),
  };
  await avariiModel.adaugaMesaj(req.params.id, mesajNou);
  res.status(201).json(mesajNou);
}

async function urmaresteAvarie(req, res) {
  const avarie = await avariiModel.gasesteDupaId(req.params.id);
  if (!avarie || !isVisible(avarie)) return res.status(404).json({ eroare: 'Sesizarea nu a fost găsită.' });
  if (avarie.userId === req.auth.id || String(avarie.emailAutor || '').toLowerCase() === String(req.auth.email || '').toLowerCase()) return res.status(400).json({ eroare: 'Sesizarea este deja asociată contului tău.' });
  const actualizata = await avariiModel.urmareste(req.params.id, { userId: req.auth.id, nume: `${req.auth.prenume} ${req.auth.nume}`, email: req.auth.email });
  res.json(publicFields(actualizata, req.auth));
}

async function feedbackAvarie(req, res) {
  const avarie = await avariiModel.gasesteDupaId(req.params.id);
  if (!avarie) return res.status(404).json({ eroare: 'Sesizarea nu a fost găsită.' });
  const rel = relations(avarie, req.auth);
  if (!rel.isOwn) return res.status(403).json({ eroare: 'Doar creatorul sesizării poate trimite feedback.' });
  if (avarie.status !== 'rezolvata') return res.status(400).json({ eroare: 'Feedbackul poate fi trimis după rezolvare.' });
  const stele = Number(req.body.stele);
  const mesaj = cleanMultiline(req.body.mesaj, 500);
  if (!Number.isInteger(stele) || stele < 1 || stele > 5 || looksLikeSpam(mesaj)) return res.status(400).json({ eroare: 'Alege o evaluare între 1 și 5 stele.' });
  const actualizata = await avariiModel.feedback(req.params.id, { stele, mesaj, userId: req.auth.id, nume: `${req.auth.prenume} ${req.auth.nume}`, email: req.auth.email });
  res.json(detailFields(actualizata, req.auth));
}

async function stergeAvarie(req, res) {
  const avarie = await avariiModel.gasesteDupaId(req.params.id);
  if (!avarie) return res.status(404).json({ eroare: 'Sesizarea nu a fost găsită.' });
  await avariiModel.sterge(req.params.id);
  if (avarie.pozaUrl && String(avarie.pozaUrl).startsWith('/uploads/')) {
    const filename = path.basename(avarie.pozaUrl);
    const filePath = path.join(uploadsDir, filename);
    try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch {}
  }
  res.json({ mesaj: 'Sesizarea a fost ștearsă.', id: req.params.id });
}

module.exports = { listaAvarii, detaliiAvarie, creazaAvarie, actualizeazaStatus, listaMesaje, adaugaMesaj, urmaresteAvarie, feedbackAvarie, stergeAvarie };
