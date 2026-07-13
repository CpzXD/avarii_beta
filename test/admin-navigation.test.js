const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const admin = fs.readFileSync(path.join(__dirname, '..', 'public', 'admin.html'), 'utf8');

test('adminul are buton de navigare in lista si popup', () => {
  assert.match(admin, /Du-mă acolo/);
  assert.match(admin, /navigationButton\(a\)/);
});

test('navigatia se deschide separat fara sa inlocuiasca pagina admin', () => {
  assert.match(admin, /target='_blank'/);
  assert.match(admin, /rel='noopener noreferrer'/);
  assert.match(admin, /geo:0,0\?q=\$\{destination\}/);
  assert.match(admin, /google\.com\/maps\/dir/);
  assert.doesNotMatch(admin, /location\.href=`geo:/);
  assert.doesNotMatch(admin, /location\.href=webUrl/);
});
