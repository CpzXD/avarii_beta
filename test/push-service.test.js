const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

process.env.VAPID_PUBLIC_KEY = 'A'.repeat(87);
process.env.VAPID_PRIVATE_KEY = 'B'.repeat(43);
process.env.VAPID_SUBJECT = 'mailto:test@example.com';

const sent = [];
const removed = [];
const webPushPath = require.resolve('web-push');
require.cache[webPushPath] = {
  id: webPushPath,
  filename: webPushPath,
  loaded: true,
  exports: {
    setVapidDetails(subject, publicKey, privateKey) { sent.push({ type: 'config', subject, publicKey, privateKey }); },
    async sendNotification(subscription, payload, options) {
      sent.push({ type: 'send', subscription, payload: JSON.parse(payload), options });
      if (subscription.endpoint.endsWith('/expired')) {
        const error = new Error('expirat');
        error.statusCode = 410;
        throw error;
      }
    },
  },
};

const modelPath = require.resolve('../src/models/push-subscriptions.model');
require.cache[modelPath] = {
  id: modelPath,
  filename: modelPath,
  loaded: true,
  exports: {
    async citestePentruUser() {
      return [
        { endpoint: 'https://push.test/active', keys: { p256dh: 'a', auth: 'b' } },
        { endpoint: 'https://push.test/expired', keys: { p256dh: 'c', auth: 'd' } },
      ];
    },
    async stergeDupaEndpoint(endpoint) { removed.push(endpoint); },
  },
};

const service = require('../src/services/push-notifications.service');

beforeEach(() => { sent.length = 0; removed.length = 0; });

test('schimbarea statusului trimite push proprietarului și elimină endpointurile expirate', async () => {
  const result = await service.notificaSchimbareStatus({
    id: 'avarie-1', userId: 'user-1', titlu: 'Bec ars pe strada Principală', status: 'confirmata',
  }, 'noua');

  const messages = sent.filter((entry) => entry.type === 'send');
  assert.equal(messages.length, 2);
  assert.equal(messages[0].payload.title, 'Actualizare sesizare');
  assert.match(messages[0].payload.body, /a fost confirmată/i);
  assert.equal(messages[0].payload.data.url, '/sesizare-detalii.html?id=avarie-1&from=user');
  assert.equal(messages[0].options.timeout, 5000);
  assert.deepEqual(removed, ['https://push.test/expired']);
  assert.deepEqual(result, { sent: 1, removed: 1, skipped: false });
});

test('nu trimite notificare dacă statusul nu s-a schimbat', async () => {
  const result = await service.notificaSchimbareStatus({
    id: 'avarie-1', userId: 'user-1', titlu: 'Test', status: 'confirmata',
  }, 'confirmata');
  assert.deepEqual(result, { sent: 0, removed: 0, skipped: true });
  assert.equal(sent.filter((entry) => entry.type === 'send').length, 0);
});
