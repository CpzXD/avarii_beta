const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const html=fs.readFileSync(path.join(__dirname,'..','public','harta.html'),'utf8');

test('numele utilizatorului are spațiu stabil în header',()=>{
  assert.match(html,/\.header-actions\{[^}]*max-width:50%[^}]*flex:0 1 auto/);
  assert.match(html,/\.user-chip\{[^}]*width:max-content[^}]*max-width:240px/);
  assert.doesNotMatch(html,/\.user-chip\{[^}]*max-width:45%/);
});

test('pe telefon numele folosește lățimea disponibilă, nu un procent aplicat direct',()=>{
  assert.match(html,/@media\(max-width:430px\)\{\.header-actions\{[^}]*max-width:46%/);
  assert.match(html,/\.user-chip\{max-width:100%;font-size:11px/);
});

test('numele complet rămâne disponibil ca tooltip',()=>{
  assert.match(html,/\$\('user-chip'\)\.title=fullName/);
});
