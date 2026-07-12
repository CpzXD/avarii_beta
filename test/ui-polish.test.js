const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const harta = fs.readFileSync(path.join(__dirname, '..', 'public', 'harta.html'), 'utf8');
const mapConfig = fs.readFileSync(path.join(__dirname, '..', 'public', 'map-config.js'), 'utf8');
const { REPORT_CATEGORIES } = require('../src/config/report-categories');

test('butonul de încărcare a pozei este stilizat și accesibil', () => {
  assert.match(harta, /class="file-upload-input"[^>]+id="poza"/);
  assert.match(harta, /class="file-upload-control" for="poza"/);
  assert.match(harta, /id="poza-name"[^>]*>Nicio poză selectată/);
  assert.match(harta, /addEventListener\('change',updatePhotoFileName\)/);
});

test('hărțile folosesc din nou tile-urile OpenStreetMap standard', () => {
  assert.match(mapConfig, /tile\.openstreetmap\.org/);
  assert.doesNotMatch(mapConfig, /basemaps\.cartocdn\.com/);
  assert.doesNotMatch(mapConfig, /CARTO/);
});

test('formularul oferă toate categoriile publice acceptate de backend', () => {
  const select = harta.match(/<select id="categorie"[\s\S]*?<\/select>/);
  assert.ok(select, 'selectul de categorii trebuie să existe');
  const uiValues = [...select[0].matchAll(/<option value="([^"]+)"/g)].map((match) => match[1]);
  const backendValues = REPORT_CATEGORIES.map((category) => category.value);
  assert.deepEqual(uiValues, backendValues);
  assert.match(select[0], />Stâlp defect</);
  assert.match(select[0], />Zonă întunecată</);
});
