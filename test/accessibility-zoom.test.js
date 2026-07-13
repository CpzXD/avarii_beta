const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const read=relative=>fs.readFileSync(path.join(root,relative),'utf8');

test('aplicația nu blochează zoomul paginii pentru utilizatorii care au nevoie de mărire',()=>{
  const pages=[
    'public/harta.html',
    'public/sesizare-detalii.html',
    'public/login.html',
    'public/register.html',
    'public/gdpr.html',
    'public/termeni.html',
  ];
  for(const page of pages){
    const html=read(page);
    assert.doesNotMatch(html,/zoom-guard\.js/);
    assert.doesNotMatch(html,/user-scalable\s*=\s*no/i);
    assert.doesNotMatch(html,/maximum-scale\s*=\s*1/i);
  }
  assert.equal(fs.existsSync(path.join(root,'public/zoom-guard.js')),false);
});
