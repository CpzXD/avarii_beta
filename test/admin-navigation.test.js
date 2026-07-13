const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const admin = fs.readFileSync(path.join(__dirname, '..', 'public', 'admin.html'), 'utf8');

test('panoul admin oferă navigare către coordonatele fiecărei avarii', () => {
  assert.match(admin, /Du-mă acolo/);
  assert.match(admin, /function navigationButton\(a\)/);
  assert.match(admin, /function openNavigation\(lat,lng\)/);
  assert.match(admin, /geo:0,0\?q=\$\{destination\}/);
  assert.match(admin, /google\.com\/maps\/dir\/\?api=1&destination=/);
});

test('butonul de navigare apare atât în listă, cât și în popup-ul hărții', () => {
  const uses = admin.match(/\$\{navigationButton\(a\)\}/g) || [];
  assert.equal(uses.length, 2);
  assert.match(admin, /class="item-actions"/);
  assert.match(admin, /\.popup \.navigate-btn/);
});
