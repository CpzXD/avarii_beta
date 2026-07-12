const { test, before, beforeEach, after } = require('node:test');
const assert = require('node:assert/strict');

process.env.AUTH_SECRET = 'test-secret-stabil-pentru-rutele-critice';
delete process.env.TURNSTILE_SECRET_KEY;

const users = new Map();
const avarii = [];
let duplicateCandidateCalls = 0;
let citesteToateCalls = 0;

const fakeUsersModel = {
  async ensureAdmin() {},
  async gasesteDupaEmail(email) {
    return users.get(String(email || '').toLowerCase());
  },
  async gasesteDupaId(id) {
    return [...users.values()].find((user) => user.id === id);
  },
  async creeaza(user) {
    users.set(String(user.email).toLowerCase(), user);
    return user;
  },
  async actualizeazaParola(id, parola) {
    const user = [...users.values()].find((entry) => entry.id === id);
    if (!user) return false;
    user.parola = parola;
    return true;
  },
  publicUser(user) {
    if (!user) return null;
    const { parola, ...safe } = user;
    return safe;
  },
};

const fakeAvariiModel = {
  async citesteToate() {
    citesteToateCalls += 1;
    return [...avarii];
  },
  async citesteCandidateDuplicateRecente() {
    duplicateCandidateCalls += 1;
    return [...avarii];
  },
  async gasesteDupaId(id) {
    return avarii.find((avarie) => avarie.id === id);
  },
  async creeaza(avarie) {
    avarii.push(avarie);
    return avarie;
  },
  async actualizeazaStatus() { return null; },
  async adaugaMesaj() { return null; },
  async urmareste() { return null; },
  async feedback() { return null; },
  async sterge() { return false; },
};

function mockModule(modulePath, exports) {
  const resolved = require.resolve(modulePath);
  require.cache[resolved] = {
    id: resolved,
    filename: resolved,
    loaded: true,
    exports,
  };
}

mockModule('../src/models/users.model', fakeUsersModel);
mockModule('../src/models/avarii.model', fakeAvariiModel);
mockModule('../src/security/turnstile', { verifyTurnstile: async () => true });

const createApp = require('../src/app');
let server;
let baseUrl;

before(async () => {
  const app = createApp();
  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', resolve);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

beforeEach(() => {
  users.clear();
  avarii.length = 0;
  duplicateCandidateCalls = 0;
  citesteToateCalls = 0;
});

after(async () => {
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

async function postJson(path, body) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  return { response, body: await response.json() };
}

test('auth: înregistrarea hashuiește parola, iar loginul validează parola', async () => {
  const credentials = {
    prenume: 'Ana',
    nume: 'Popescu',
    email: 'ana@example.test',
    parola: 'ParolaSigura123!',
  };

  const registered = await postJson('/auth/register', credentials);
  assert.equal(registered.response.status, 201);
  assert.equal(registered.body.user.email, credentials.email);
  assert.equal(typeof registered.body.token, 'string');
  assert.equal('parola' in registered.body.user, false);

  const stored = users.get(credentials.email);
  assert.match(stored.parola, /^scrypt\$/);
  assert.notEqual(stored.parola, credentials.parola);

  const loggedIn = await postJson('/auth/login', {
    email: credentials.email,
    parola: credentials.parola,
    rol: 'user',
  });
  assert.equal(loggedIn.response.status, 200);
  assert.equal(loggedIn.body.user.email, credentials.email);
  assert.equal(typeof loggedIn.body.token, 'string');

  const rejected = await postJson('/auth/login', {
    email: credentials.email,
    parola: 'parola-gresita',
    rol: 'user',
  });
  assert.equal(rejected.response.status, 401);
});

test('creare sesizare: folosește doar candidații recenți și respinge duplicatul', async () => {
  const payload = {
    titlu: 'Bec ars pe strada Principală',
    descriere: 'Corpul de iluminat nu funcționează seara.',
    categorie: 'bec ars',
    adresaText: 'Strada Principală 10',
    requestId: 'req-test-duplicate-1',
  };

  const created = await postJson('/avarii', payload);
  assert.equal(created.response.status, 201);
  assert.equal(avarii.length, 1);
  assert.equal(duplicateCandidateCalls, 1);
  assert.equal(citesteToateCalls, 0);
  assert.equal('vizibilPublic' in avarii[0], false);
  assert.equal('moderare' in avarii[0], false);

  const duplicate = await postJson('/avarii', payload);
  assert.equal(duplicate.response.status, 409);
  assert.equal(duplicate.body.duplicateId, avarii[0].id);
  assert.equal(avarii.length, 1);
  assert.equal(duplicateCandidateCalls, 2);
  assert.equal(citesteToateCalls, 0);
});
