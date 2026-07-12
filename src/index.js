require('dotenv').config();
const { validateRuntimeEnv } = require('./config/env');

const PORT = process.env.PORT || 3000;

async function start() {
  // Validarea rulează înainte de importarea bazei de date, a rutelor și a
  // modulului de token-uri. Serverul nu pornește cu o configurare incompletă.
  validateRuntimeEnv();

  const createApp = require('./app');
  const usersModel = require('./models/users.model');
  const initDb = require('./config/init-db');
  const { curataSesizariRezolvateExpirate, pornesteCuratareaPeriodica } = require('./services/retention.service');

  await initDb();
  await usersModel.ensureAdmin();
  try {
    await curataSesizariRezolvateExpirate();
  } catch (error) {
    console.error(`Curățarea inițială a sesizărilor expirate a eșuat: ${error.message}`);
  }
  pornesteCuratareaPeriodica();

  const app = createApp();
  app.listen(PORT, () => {
    console.log(`Server pornit pe portul ${PORT}`);
    if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
      console.warn('Configurează ADMIN_EMAIL și ADMIN_PASSWORD înainte de a folosi autentificarea de administrator.');
    }
  });
}

start().catch((error) => {
  console.error(`Serverul nu poate porni: ${error.message}`);
  process.exit(1);
});
