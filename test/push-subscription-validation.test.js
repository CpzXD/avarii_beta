const { test } = require('node:test');
const assert = require('node:assert/strict');

const modelPath = require.resolve('../src/models/push-subscriptions.model');
require.cache[modelPath] = {
  id: modelPath,
  filename: modelPath,
  loaded: true,
  exports: {},
};
const { normalizeSubscription } = require('../src/controllers/notifications.controller');

const validKeys = { p256dh: 'A'.repeat(87), auth: 'B'.repeat(22) };

test('validarea abonamentului push respinge endpointuri locale și chei trunchiate', () => {
  assert.throws(() => normalizeSubscription({
    endpoint: 'https://127.0.0.1/push',
    keys: validKeys,
  }), /locală|privată/i);

  assert.throws(() => normalizeSubscription({
    endpoint: 'https://fcm.googleapis.com/fcm/send/test',
    keys: { p256dh: 'scurt', auth: 'scurt' },
  }), /cheile/i);

  assert.doesNotThrow(() => normalizeSubscription({
    endpoint: 'https://fcm.googleapis.com/fcm/send/test',
    expirationTime: null,
    keys: validKeys,
  }));
});
