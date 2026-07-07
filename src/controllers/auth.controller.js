const { randomUUID } = require('crypto');
const usersModel = require('../models/users.model');

function register(req, res) {
  const { prenume, nume, email, parola } = req.body;
  if (!prenume || !nume || !email || !parola) {
    return res.status(400).json({ eroare: 'Completează nume, prenume, email și parolă.' });
  }
  if (usersModel.gasesteDupaEmail(email)) {
    return res.status(409).json({ eroare: 'Există deja un cont cu acest email.' });
  }
  const userNou = {
    id: randomUUID(),
    prenume,
    nume,
    email,
    parola,
    rol: 'user',
    creatLa: new Date().toISOString(),
  };
  usersModel.creeaza(userNou);
  res.status(201).json({ user: usersModel.publicUser(userNou) });
}

function login(req, res) {
  const { email, parola, rol } = req.body;
  const user = usersModel.gasesteDupaEmail(email);
  if (!user || user.parola !== parola) {
    return res.status(401).json({ eroare: 'Email sau parolă greșită.' });
  }
  if (rol && user.rol !== rol) {
    return res.status(403).json({ eroare: 'Contul nu are acces la această zonă.' });
  }
  res.json({ user: usersModel.publicUser(user) });
}

module.exports = { register, login };
