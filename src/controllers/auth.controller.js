const { randomUUID } = require('crypto');
const usersModel = require('../models/users.model');
const { cleanText, cleanEmail, validEmail } = require('../security/text');
const { hashPassword, verifyPassword, isHashedPassword } = require('../security/passwords');
const { createToken } = require('../security/tokens');
const { verifyTurnstile } = require('../security/turnstile');

function botCheck(body) {
  if (cleanText(body.website, 100)) return false;
  const started = Number(body.formStartedAt || 0);
  if (started && Date.now() - started < 800) return false;
  return true;
}

async function register(req, res) {
  const prenume = cleanText(req.body.prenume, 50);
  const nume = cleanText(req.body.nume, 50);
  const email = cleanEmail(req.body.email);
  const parola = String(req.body.parola || '');
  if (!botCheck(req.body)) return res.status(400).json({ eroare: 'Cererea nu a putut fi verificată.' });
  if (!(await verifyTurnstile(req.body.turnstileToken, req.ip))) return res.status(400).json({ eroare: 'Verificarea anti-spam nu a reușit.' });
  if (prenume.length < 2 || nume.length < 2) return res.status(400).json({ eroare: 'Numele și prenumele trebuie să aibă minimum 2 caractere.' });
  if (!validEmail(email)) return res.status(400).json({ eroare: 'Adresa de email nu este validă.' });
  if (parola.length < 8 || parola.length > 128) return res.status(400).json({ eroare: 'Parola trebuie să aibă între 8 și 128 de caractere.' });
  if (usersModel.gasesteDupaEmail(email)) return res.status(409).json({ eroare: 'Există deja un cont cu acest email.' });
  const userNou = { id: randomUUID(), prenume, nume, email, parola: hashPassword(parola), rol: 'user', creatLa: new Date().toISOString() };
  usersModel.creeaza(userNou);
  res.status(201).json({ user: usersModel.publicUser(userNou), token: createToken(userNou) });
}

function login(req, res) {
  const email = cleanEmail(req.body.email);
  const parola = String(req.body.parola || '');
  const rol = req.body.rol === 'admin' ? 'admin' : 'user';
  if (rol === 'admin' && (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD)) return res.status(503).json({ eroare: 'Contul admin trebuie configurat în variabilele de mediu ale serverului.' });
  if (!validEmail(email) || !parola) return res.status(401).json({ eroare: 'Email sau parolă greșită.' });
  const user = usersModel.gasesteDupaEmail(email);
  if (!user || !verifyPassword(parola, user.parola) || user.rol !== rol) return res.status(401).json({ eroare: 'Email sau parolă greșită.' });
  if (!isHashedPassword(user.parola)) usersModel.actualizeazaParola(user.id, hashPassword(parola));
  res.json({ user: usersModel.publicUser(user), token: createToken(user) });
}

module.exports = { register, login };
