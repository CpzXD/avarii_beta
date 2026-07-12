const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'avarii-retention-'));
process.env.UPLOAD_DIR = tempDir;

const expiredImage = path.join(tempDir, 'expirata.jpg');
fs.writeFileSync(expiredImage, 'test');

const modelPath = require.resolve('../src/models/avarii.model');
require.cache[modelPath] = {
  id: modelPath,
  filename: modelPath,
  loaded: true,
  exports: {
    async stergeRezolvateExpirate() {
      return [
        { id: 'rezolvata-veche', pozaUrl: '/uploads/expirata.jpg' },
        { id: 'rezolvata-fara-poza', pozaUrl: null },
      ];
    },
  },
};

const { curataSesizariRezolvateExpirate } = require('../src/services/retention.service');

test('curățarea elimină și poza locală a sesizării expirate', async () => {
  const count = await curataSesizariRezolvateExpirate();
  assert.equal(count, 2);
  assert.equal(fs.existsSync(expiredImage), false);
});
