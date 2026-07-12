# Render Free fără Persistent Disk

Această variantă este pregătită pentru Render Free și nu necesită Persistent Disk.

## Ce funcționează

- rate limiting pentru login, conturi, sesizări, mesaje și feedback;
- honeypot anti-bot;
- validarea și curățarea textelor;
- blocarea sesizărilor duplicate trimise rapid;
- verificarea tipului real al imaginilor și limita de 5 MB;
- autentificare cu parole hash-uite și tokenuri semnate;
- Cloudflare Turnstile opțional.

## Limitare Render Free

Datele sunt salvate temporar în fișierele locale ale instanței. La restart, redeploy sau înlocuirea instanței pot reveni la datele incluse în repository. Se pot pierde:

- conturile create după deploy;
- sesizările noi și conversațiile;
- fotografiile încărcate;
- contoarele rate-limit din memorie.

Această limitare este acceptabilă pentru prezentări și teste beta temporare.

## Variabile obligatorii în Render

În `Service > Environment` configurează:

- `AUTH_SECRET`: un șir aleatoriu lung și stabil;
- `ADMIN_EMAIL`: emailul contului admin;
- `ADMIN_PASSWORD`: parola admin, minimum 10 caractere.

Nu configura `DATA_DIR` sau `UPLOAD_DIR` și nu adăuga Disk.

## Variabile opționale

Pentru Cloudflare Turnstile:

- `TURNSTILE_SITE_KEY`
- `TURNSTILE_SECRET_KEY`


## Hotfix hartă și interfață
Leaflet este livrat local din proiect, astfel încât hărțile și navigația nu depind de CDN-ul extern unpkg. După deploy, închide complet aplicația instalată și redeschide linkul în browser pentru actualizarea service worker-ului.
