const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const publicDir = path.join(__dirname, '..', 'public');
const read = name => fs.readFileSync(path.join(publicDir, name), 'utf8');

test('clientul și panoul admin au switch pentru modul întunecat', () => {
  const client = read('harta.html');
  const admin = read('admin.html');

  assert.match(client, /class="client-app"/);
  assert.match(admin, /class="admin-app"/);
  assert.match(client, /data-theme-toggle/);
  assert.match(admin, /data-theme-toggle/);
  assert.match(client, />Mod întunecat</);
  assert.match(admin, />Mod întunecat</);
});

test('tema este memorată, respectă preferința sistemului și actualizează status bar-ul', () => {
  const script = read('theme.js');

  assert.match(script, /avariiTheme/);
  assert.match(script, /prefers-color-scheme: dark/);
  assert.match(script, /localStorage\.setItem\(STORAGE_KEY,next\)/);
  assert.match(script, /document\.documentElement\.dataset\.theme=next/);
  assert.match(script, /meta\[name="theme-color"\]/);
  assert.match(script, /data-theme-toggle/);
});

test('stilurile întunecate acoperă clientul, adminul și detaliul fără schimbarea tile-urilor hărții', () => {
  const css = read('theme.css');
  const mapConfig = read('map-config.js');

  assert.match(css, /html\[data-theme="dark"\] body\.client-app/);
  assert.match(css, /html\[data-theme="dark"\] body\.admin-app/);
  assert.match(css, /html\[data-theme="dark"\] body\.detail-app/);
  assert.match(css, /\.theme-switch__input:checked\+\.theme-switch__track/);
  assert.match(mapConfig, /tile\.openstreetmap\.org/);
  assert.doesNotMatch(mapConfig, /cartocdn|CARTO/i);
});
