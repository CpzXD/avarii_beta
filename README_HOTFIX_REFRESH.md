# Hotfix conversație și hartă

- Actualizarea automată nu mai reconstruiește pagina dacă nu există modificări.
- Textul nesalvat din conversație și feedback este păstrat în sessionStorage.
- Actualizarea este amânată cât timp utilizatorul scrie.
- Hărțile sunt inițializate doar când tabul lor este vizibil.
- Hărțile își recalculează dimensiunea după splash, resize, rotație și revenirea în pagină.
- Fișierele HTML/JS/CSS nu mai sunt servite din cache vechi.
- Service worker-ul nu mai interceptează și nu mai cache-uiește tile-urile OpenStreetMap.
