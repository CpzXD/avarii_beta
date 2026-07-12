const { verifyToken } = require('../security/tokens');
const usersModel = require('../models/users.model');

async function readAuth(req) {
  const header = String(req.headers.authorization || '');
  if (!header.startsWith('Bearer ')) return null;
  const payload = verifyToken(header.slice(7));
  if (!payload) return null;
  const user = await usersModel.gasesteDupaId(payload.sub);
  if (!user || user.rol !== payload.rol) return null;
  return { id: user.id, rol: user.rol, email: user.email, prenume: user.prenume, nume: user.nume };
}

async function optionalAuth(req, res, next) {
  req.auth = await readAuth(req);
  next();
}

async function requireAuth(req, res, next) {
  req.auth = await readAuth(req);
  if (!req.auth) return res.status(401).json({ eroare: 'Autentificarea nu mai este validă. Conectează-te din nou.' });
  next();
}

async function requireUser(req, res, next) {
  req.auth = await readAuth(req);
  if (!req.auth) return res.status(401).json({ eroare: 'Trebuie să fii conectat.' });
  if (req.auth.rol !== 'user') return res.status(403).json({ eroare: 'Acces indisponibil pentru acest cont.' });
  next();
}

async function requireAdmin(req, res, next) {
  req.auth = await readAuth(req);
  if (!req.auth) return res.status(401).json({ eroare: 'Autentificarea de admin nu mai este validă.' });
  if (req.auth.rol !== 'admin') return res.status(403).json({ eroare: 'Acces permis doar administratorului.' });
  next();
}

module.exports = { optionalAuth, requireAuth, requireUser, requireAdmin };
