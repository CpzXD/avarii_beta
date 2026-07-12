const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function readPublicFile(name) {
  return fs.readFileSync(path.join(__dirname, '..', 'public', name), 'utf8');
}

test('interfețele nu mai conțin controale Anterior/Următor sau stare de paginare', () => {
  const harta = readPublicFile('harta.html');
  const admin = readPublicFile('admin.html');
  const combined = `${harta}\n${admin}`;

  assert.doesNotMatch(combined, /id="(?:active|mine|admin)-(?:prev|next)"/i);
  assert.doesNotMatch(combined, /currentPage|totalPages|pageSize|updatePagination/);
  assert.doesNotMatch(combined, /\/avarii\?page=/);
  assert.doesNotMatch(harta, /id="active-list"|id="active-list-title"/);
  assert.match(harta, /id="active-map"/);
});
