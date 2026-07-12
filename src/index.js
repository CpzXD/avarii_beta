require('dotenv').config();
const createApp = require('./app');
const usersModel = require('./models/users.model');
const initDb = require('./config/init-db');

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await initDb();
    await usersModel.ensureAdmin();
  } catch (error) {
    console.error('Nu m-am putut conecta la baza de date la pornire:', error.message);
    process.exit(1);
  }

  const app = createApp();
  app.listen(PORT, () => {
    console.log(`Server pornit pe portul ${PORT}`);
    if (!process.env.AUTH_SECRET) console.warn('AUTH_SECRET nu este configurat; autentificările se vor invalida la fiecare restart. Configurează o valoare stabilă în Render.');
    if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) console.warn('Configurează ADMIN_EMAIL și ADMIN_PASSWORD înainte de beta public.');
  });
}

start();
