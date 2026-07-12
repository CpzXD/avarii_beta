const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const harta = fs.readFileSync(path.join(__dirname, '..', 'public', 'harta.html'), 'utf8');

test('formularul de sesizare afișează detaliile înaintea hărții', () => {
  const titleIndex = harta.indexOf('id="titlu"');
  const descriptionIndex = harta.indexOf('id="descriere"');
  const mapIndex = harta.indexOf('id="report-map"');
  const submitIndex = harta.indexOf('id="btn-trimite"');

  assert.ok(titleIndex > -1, 'câmpul titlu trebuie să existe');
  assert.ok(descriptionIndex > titleIndex, 'descrierea trebuie să urmeze după titlu');
  assert.ok(mapIndex > descriptionIndex, 'harta trebuie să apară după detaliile problemei');
  assert.ok(submitIndex > mapIndex, 'trimiterea trebuie să rămână după verificarea locației');
  assert.match(harta, /id="report-details-step"/);
  assert.match(harta, /id="report-location-step"/);
});

test('harta de raportare este mai compactă decât harta principală pe mobil', () => {
  assert.match(harta, /#active-map\{height:48dvh;min-height:330px/);
  assert.match(harta, /#report-map\{height:30dvh;min-height:220px;max-height:300px/);
  assert.match(harta, /@media\(max-width:430px\)[\s\S]*?#report-map\{height:28dvh;min-height:210px;max-height:245px/);
});
