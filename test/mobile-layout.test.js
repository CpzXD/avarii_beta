const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const publicDir = path.join(__dirname, '..', 'public');
const read = name => fs.readFileSync(path.join(publicDir, name), 'utf8');

test('PWA citizen layout does not overlap the mobile status/navigation bars', () => {
  const harta = read('harta.html');
  const manifest = JSON.parse(read('manifest-cetatean.json'));

  assert.match(harta, /apple-mobile-web-app-status-bar-style" content="default"/);
  assert.doesNotMatch(harta, /viewport-fit=cover/);
  assert.doesNotMatch(harta, /padding-bottom:calc\(74px \+ env\(safe-area-inset-bottom\)\)/);
  assert.doesNotMatch(harta, /calc\(8px \+ env\(safe-area-inset-bottom\)\)/);
  assert.equal(manifest.theme_color, '#ffffff');
});
