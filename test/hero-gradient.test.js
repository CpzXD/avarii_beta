const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('bannerul principal folosește gradientul albastru deschis-portocaliu al siglei', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'public', 'harta.html'), 'utf8');
  assert.match(html, /linear-gradient\(135deg,#1e73be 0%,#60a5fa 50%,#ff7a16 100%\)/);
  assert.doesNotMatch(html, /linear-gradient\(135deg,#1d4ed8,#0f766e\)/);
});
