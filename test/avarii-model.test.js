const { test } = require('node:test');
const assert = require('node:assert/strict');

const calls = [];
const fakePool = {
  async query(sql, params) {
    calls.push({ sql, params });
    return { rows: [{ data: { id: 'avarie-recenta' } }] };
  },
};

const dbPath = require.resolve('../src/config/db');
require.cache[dbPath] = {
  id: dbPath,
  filename: dbPath,
  loaded: true,
  exports: fakePool,
};

const avariiModel = require('../src/models/avarii.model');

test('query-ul de duplicate este limitat la ultimele 10 minute în PostgreSQL', async () => {
  const result = await avariiModel.citesteCandidateDuplicateRecente({
    requestId: 'request-123',
    reporterKey: 'user-456',
  });

  assert.deepEqual(result, [{ id: 'avarie-recenta' }]);
  assert.equal(calls.length, 1);
  assert.match(calls[0].sql, /WHERE\s+data_raportare\s*>\s*now\(\)\s*-\s*interval\s+'10 minutes'/i);
  assert.match(calls[0].sql, /data->>'requestId'/);
  assert.match(calls[0].sql, /data->>'userId'/);
  assert.match(calls[0].sql, /data->>'reporterHash'/);
  assert.deepEqual(calls[0].params, ['request-123', 'user-456']);
});
