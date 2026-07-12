const { test, beforeEach } = require('node:test');
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

beforeEach(() => {
  calls.length = 0;
});

test('lista completă păstrează ordinea globală și nu folosește LIMIT/OFFSET', async () => {
  const result = await avariiModel.citesteToate();

  assert.deepEqual(result, [{ id: 'avarie-recenta' }]);
  assert.equal(calls.length, 1);
  assert.match(calls[0].sql, /SELECT\s+data\s+FROM\s+avarii\s+ORDER BY\s+data_raportare\s+DESC,\s*id\s+DESC/i);
  assert.doesNotMatch(calls[0].sql, /LIMIT|OFFSET/i);
  assert.equal(calls[0].params, undefined);
});

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

test('retenția șterge exclusiv sesizările rezolvate de peste 90 de zile', async () => {
  const result = await avariiModel.stergeRezolvateExpirate();

  assert.deepEqual(result, [{ id: 'avarie-recenta' }]);
  assert.equal(calls.length, 1);
  assert.match(calls[0].sql, /DELETE\s+FROM\s+avarii/i);
  assert.match(calls[0].sql, /status\s*=\s*'rezolvata'/i);
  assert.match(calls[0].sql, /COALESCE\(rezolvata_la,\s*actualizat_la\)/i);
  assert.match(calls[0].sql, /now\(\)\s*-\s*interval\s+'90 days'/i);
  assert.match(calls[0].sql, /RETURNING\s+data/i);
});
