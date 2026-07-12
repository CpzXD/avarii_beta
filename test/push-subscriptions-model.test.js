const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

const calls = [];
const fakePool = {
  async query(sql, params) {
    calls.push({ sql, params });
    if (/SELECT subscription/i.test(sql)) return { rows: [{ subscription: { endpoint: 'https://push.test/1' } }] };
    if (/DELETE/i.test(sql)) return { rowCount: 1 };
    return { rows: [{ user_id: params[0], endpoint: params[1] }] };
  },
};

const dbPath = require.resolve('../src/config/db');
require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: fakePool };
const model = require('../src/models/push-subscriptions.model');

beforeEach(() => { calls.length = 0; });

test('abonamentul push este salvat prin upsert pe endpoint și asociat contului', async () => {
  const subscription = { endpoint: 'https://push.test/1', keys: { p256dh: 'abc', auth: 'def' } };
  await model.salveaza('user-1', subscription, 'Browser test');
  assert.match(calls[0].sql, /INSERT INTO push_subscriptions/i);
  assert.match(calls[0].sql, /ON CONFLICT \(endpoint\) DO UPDATE/i);
  assert.deepEqual(calls[0].params.slice(0, 3), ['user-1', subscription.endpoint, subscription]);
});

test('abonamentele sunt citite numai pentru utilizatorul destinatar', async () => {
  const result = await model.citestePentruUser('user-2');
  assert.deepEqual(result, [{ endpoint: 'https://push.test/1' }]);
  assert.match(calls[0].sql, /WHERE user_id = \$1/i);
  assert.deepEqual(calls[0].params, ['user-2']);
});
