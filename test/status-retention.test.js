const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

let storedRow;
let updateParams;

const fakeClient = {
  async query(sql, params) {
    if (/^SELECT data, rezolvata_la/i.test(sql)) {
      return { rows: [{ data: structuredClone(storedRow.data), rezolvata_la: storedRow.rezolvata_la }] };
    }
    if (/^UPDATE avarii SET/i.test(sql)) {
      updateParams = params;
      storedRow = { data: structuredClone(params[0]), rezolvata_la: params[3] };
      return { rowCount: 1 };
    }
    return { rows: [] };
  },
  release() {},
};

const fakePool = {
  async connect() { return fakeClient; },
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
  updateParams = null;
});

test('marcarea ca rezolvată pornește intervalul de retenție', async () => {
  storedRow = {
    data: {
      id: 'a-1',
      status: 'in_lucru',
      actualizatLa: '2026-01-01T00:00:00.000Z',
      statusHistory: [],
      mesaje: [],
    },
    rezolvata_la: null,
  };

  const result = await avariiModel.actualizeazaStatus('a-1', 'rezolvata');

  assert.equal(result.status, 'rezolvata');
  assert.ok(updateParams[3], 'rezolvata_la trebuie completată');
  assert.equal(result.rezolvataLa, new Date(updateParams[3]).toISOString());
  assert.equal(updateParams[4], 'a-1');
});

test('redeschiderea anulează expirarea automată', async () => {
  storedRow = {
    data: {
      id: 'a-2',
      status: 'rezolvata',
      actualizatLa: '2026-01-01T00:00:00.000Z',
      rezolvataLa: '2026-01-01T00:00:00.000Z',
      statusHistory: [],
      mesaje: [],
    },
    rezolvata_la: new Date('2026-01-01T00:00:00.000Z'),
  };

  const result = await avariiModel.actualizeazaStatus('a-2', 'in_lucru');

  assert.equal(result.status, 'in_lucru');
  assert.equal(updateParams[3], null);
  assert.equal('rezolvataLa' in result, false);
});
