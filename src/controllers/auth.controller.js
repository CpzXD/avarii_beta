const { randomUUID } = require('crypto');
const usersModel = require('../models/users.model');
const sessionsModel = require('../models/sessions.model');
const { cleanText, cleanEmail, validEmail } = require('../security/text');
const { hashPassword, verifyPassword, isHashedPassword } = require('../security/passwords');
const {
  createToken,
  createAccessToken,
  createRefreshToken,
  parseRefreshToken,
  hashRefreshToken,
  safeTokenHashEqual,
} = require('../security/tokens');
const {
  refreshLifetimeMs,
  readRefreshCookie,
  setRefreshCookie,
  clearRefreshCookie,
} = require('../security/session-cookies');
const { verifyTurnstile } = require('../security/turnstile');

function botCheck(body) {
  if (cleanText(body.website, 100)) return false;
  const started = Number(body.formStartedAt || 0);
  if (started && Date.now() - started < 800) return false;
  return true;
}

async function issueUserSession(req, res, user, statusCode = 200) {
  const existing = parseRefreshToken(readRefreshCookie(req));
  if (existing) {
    await sessionsModel.revoca(existing.sessionId, hashRefreshToken(existing.token), 'replaced_by_login');
  }

  const sessionId = randomUUID();
  const refreshToken = createRefreshToken(sessionId);
  const expiresAt = new Date(Date.now() + refreshLifetimeMs());
  await sessionsModel.creeaza({
    id: sessionId,
    userId: user.id,
    refreshTokenHash: hashRefreshToken(refreshToken),
    expiresAt,
  });

  setRefreshCookie(req, res, refreshToken, expiresAt);
  return res.status(statusCode).json({
    user: usersModel.publicUser(user),
    token: createAccessToken(user),
  });
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
  if (await usersModel.gasesteDupaEmail(email)) return res.status(409).json({ eroare: 'Există deja un cont cu acest email.' });
  const userNou = { id: randomUUID(), prenume, nume, email, parola: hashPassword(parola), rol: 'user', creatLa: new Date().toISOString() };
  await usersModel.creeaza(userNou);
  return issueUserSession(req, res, userNou, 201);
}

async function login(req, res) {
  const email = cleanEmail(req.body.email);
  const parola = String(req.body.parola || '');
  const rol = req.body.rol === 'admin' ? 'admin' : 'user';
  if (rol === 'admin' && (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD)) return res.status(503).json({ eroare: 'Contul admin trebuie configurat în variabilele de mediu ale serverului.' });
  if (!validEmail(email) || !parola) return res.status(401).json({ eroare: 'Email sau parolă greșită.' });
  const user = await usersModel.gasesteDupaEmail(email);
  if (!user || !verifyPassword(parola, user.parola) || user.rol !== rol) return res.status(401).json({ eroare: 'Email sau parolă greșită.' });
  if (!isHashedPassword(user.parola)) await usersModel.actualizeazaParola(user.id, hashPassword(parola));

  // Adminul rămâne momentan pe mecanismul existent; sesiunea persistentă este
  // introdusă în această etapă numai pentru cetățeni.
  if (rol === 'admin') {
    return res.json({ user: usersModel.publicUser(user), token: createToken(user) });
  }

  return issueUserSession(req, res, user);
}

async function refresh(req, res) {
  const parsed = parseRefreshToken(readRefreshCookie(req));
  if (!parsed) {
    return res.status(401).json({ eroare: 'Sesiunea nu este disponibilă.' });
  }

  const session = await sessionsModel.gasesteActiva(parsed.sessionId);
  const currentHash = hashRefreshToken(parsed.token);
  if (!session || !safeTokenHashEqual(session.refresh_token_hash, currentHash)) {
    return res.status(401).json({ eroare: 'Sesiunea nu mai este validă.' });
  }

  const user = await usersModel.gasesteDupaId(session.user_id);
  if (!user || user.rol !== 'user') {
    await sessionsModel.revoca(parsed.sessionId, currentHash, 'invalid_user');
    return res.status(401).json({ eroare: 'Sesiunea nu mai este validă.' });
  }

  const nextRefreshToken = createRefreshToken(parsed.sessionId);
  const nextHash = hashRefreshToken(nextRefreshToken);
  const expiresAt = new Date(Date.now() + refreshLifetimeMs());
  const rotated = await sessionsModel.roteste({
    id: parsed.sessionId,
    expectedHash: currentHash,
    newHash: nextHash,
    expiresAt,
  });

  if (!rotated) {
    return res.status(401).json({ eroare: 'Sesiunea nu mai este validă.' });
  }

  setRefreshCookie(req, res, nextRefreshToken, expiresAt);
  return res.json({
    user: usersModel.publicUser(user),
    token: createAccessToken(user),
  });
}

async function logout(req, res) {
  const parsed = parseRefreshToken(readRefreshCookie(req));
  if (parsed) {
    await sessionsModel.revoca(parsed.sessionId, hashRefreshToken(parsed.token), 'logout');
  }
  clearRefreshCookie(req, res);
  return res.status(204).end();
}

module.exports = { register, login, refresh, logout };
