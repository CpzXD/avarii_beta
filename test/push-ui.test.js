const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function read(name) { return fs.readFileSync(path.join(__dirname, '..', 'public', name), 'utf8'); }

test('PWA include abonarea push și deschiderea sesizării din notificare', () => {
  const harta = read('harta.html');
  const client = read('push-client.js');
  const worker = read('service-worker.js');
  const bootstrap = read('cache-bootstrap.js');

  assert.match(harta, /id="push-settings"/);
  assert.match(harta, /push-client\.js/);
  assert.match(client, /pushManager\.subscribe/);
  assert.match(client, /Notification\.requestPermission/);
  assert.match(client, /\/notifications\/subscription/);
  assert.match(worker, /addEventListener\('push'/);
  assert.match(worker, /showNotification/);
  assert.match(worker, /addEventListener\('notificationclick'/);
  assert.match(worker, /sesizare-detalii\.html|data\?\.url/);
  assert.doesNotMatch(bootstrap, /\.unregister\(/, 'update-ul service workerului nu trebuie să anuleze abonamentele push');
});
