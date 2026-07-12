require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('../src/config/db');
const initDb = require('../src/config/init-db');

function firstExistingPath(...paths) {
  return paths.find((candidate) => fs.existsSync(candidate));
}

function readJsonArray(filePath) {
  if (!filePath) return [];
  const raw = fs.readFileSync(filePath, 'utf8').trim();
  if (!raw) return [];
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) throw new Error(`Fișierul ${filePath} nu conține o listă JSON.`);
  return parsed;
}

async function main() {
  await initDb();

  const root = path.join(__dirname, '..');
  const usersPath = firstExistingPath(
    path.join(root, 'data', 'users.json'),
    path.join(root, 'data_demo_veche_referinta', 'users.json')
  );
  const avariiPath = firstExistingPath(
    path.join(root, 'data', 'avarii.json'),
    path.join(root, 'data_demo_veche_referinta', 'avarii.json')
  );

  const users = readJsonArray(usersPath);
  const avarii = readJsonArray(avariiPath);

  for (const user of users) {
    await pool.query(
      `INSERT INTO users (id, email, data)
       VALUES ($1, $2, $3)
       ON CONFLICT (id) DO UPDATE
       SET email = EXCLUDED.email, data = EXCLUDED.data`,
      [user.id, String(user.email || '').trim().toLowerCase(), user]
    );
  }

  for (const avarie of avarii) {
    await pool.query(
      `INSERT INTO avarii (id, status, data_raportare, actualizat_la, data)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO UPDATE
       SET status = EXCLUDED.status,
           data_raportare = EXCLUDED.data_raportare,
           actualizat_la = EXCLUDED.actualizat_la,
           data = EXCLUDED.data`,
      [avarie.id, avarie.status, avarie.dataRaportare, avarie.actualizatLa, avarie]
    );
  }

  console.log(`Migrați ${users.length} utilizatori din ${usersPath || 'niciun fișier'}.`);
  console.log(`Migrate ${avarii.length} sesizări din ${avariiPath || 'niciun fișier'}.`);
}

main()
  .catch((error) => {
    console.error('Migrarea a eșuat:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
