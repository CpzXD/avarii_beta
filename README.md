# Avarii Iluminat

**Avarii Iluminat** este o aplicație web prin care cetățenii pot raporta rapid problemele de iluminat public, direct de pe telefon sau calculator.

În locul unui mesaj vag de tipul „nu merge lumina pe strada X”, aplicația trimite informațiile de care are nevoie echipa de intervenție: poziția exactă pe hartă, categoria problemei, o descriere și, opțional, o fotografie.

După trimitere, utilizatorul poate urmări sesizarea până la rezolvare și poate primi notificări atunci când aceasta este confirmată, preluată în lucru sau închisă.

> Aplicația este în prezent un proiect demonstrativ. Poate fi adaptată la identitatea vizuală, infrastructura și procedurile unei companii sau instituții.

## Ce poate face aplicația

### Pentru cetățeni

Un utilizator poate:

- să își creeze un cont și să se autentifice;
- să raporteze o problemă folosind GPS-ul sau alegând punctul direct pe hartă;
- să adauge titlu, categorie, descriere și fotografie;
- să vadă sesizările active pe hartă;
- să își urmărească propriile sesizări din secțiunea **Ale mele**;
- să urmărească și sesizările altor utilizatori;
- să discute cu administratorul în pagina sesizării;
- să primească notificări când statusul se schimbă;
- să lase o evaluare după rezolvare;
- să instaleze aplicația pe telefon ca PWA;
- să aleagă între tema luminoasă și cea întunecată.

### Pentru administratori

Panoul de administrare oferă:

- o hartă cu toate sesizările;
- o listă cu informațiile importante despre fiecare caz;
- căutare și filtre după status;
- schimbarea statusului unei sesizări;
- mesaje publice pentru cetățean;
- conversație directă cu autorul;
- ștergerea unei sesizări atunci când este necesar;
- butonul **Du-mă acolo**, care deschide traseul către locația raportată;
- temă luminoasă și întunecată.

## Cum circulă o sesizare

Fluxul normal este:

```text
Nouă → Confirmată → În lucru → Rezolvată
```

La fiecare schimbare, administratorul poate adăuga un mesaj public. Utilizatorul primește notificare dacă și-a activat notificările din secțiunea **Cont**.

Sesizările active nu sunt șterse automat. Cele rezolvate sunt păstrate timp de 90 de zile, după care aplicația le elimină împreună cu fotografia locală asociată. Dacă o sesizare este redeschisă, termenul de ștergere se anulează.

## Categorii disponibile

- Bec ars
- Stâlp defect
- Stâlp căzut
- Cablu expus / căzut
- Zonă întunecată
- Panou de control defect
- Altele

Lista este definită într-un singur loc, astfel încât formularul și backendul să accepte întotdeauna aceleași categorii.

## Protecții incluse

Aplicația are deja câteva măsuri pentru a limita spamul și folosirea abuzivă:

- detectează raportările foarte asemănătoare trimise în ultimele 10 minute;
- limitează încercările repetate de autentificare;
- limitează numărul de conturi și sesizări create într-un interval scurt;
- limitează mesajele și operațiile administrative;
- acceptă o singură fotografie per sesizare, de maximum 5 MB;
- acceptă doar JPG, PNG și WebP și verifică tipul real al fișierului;
- poate folosi Cloudflare Turnstile, dacă sunt configurate cheile necesare.

Pentru un proiect mai mare, cu mai multe instanțe ale serverului, limitările ar trebui mutate într-un serviciu comun precum Redis.

## Tehnologii folosite

Aplicația este construită simplu, fără un framework mare pe partea de interfață:

- **Node.js** și **Express** pentru server;
- **PostgreSQL** pentru baza de date;
- **HTML, CSS și JavaScript** pentru interfață;
- **Leaflet** și **OpenStreetMap** pentru hartă;
- **Web Push și VAPID** pentru notificări;
- **Multer** pentru încărcarea fotografiilor;
- **node:test** pentru testele automate.

## Pornire locală

Ai nevoie de:

- Node.js 18 sau mai nou;
- npm;
- o bază de date PostgreSQL.

### 1. Instalează dependențele

Din folderul proiectului:

```bash
npm ci
```

`npm ci` instalează exact versiunile salvate în `package-lock.json`. Când adaugi sau actualizezi un pachet în timpul dezvoltării, folosește `npm install`.

### 2. Creează fișierul `.env`

Pornește de la exemplul inclus:

```bash
cp .env.example .env
```

Pe Windows poți copia manual fișierul `.env.example` și îl poți redenumi `.env`.

Completează cel puțin:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE
AUTH_SECRET=un-secret-lung-aleator-si-stabil
```

Pentru contul administratorului:

```env
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=o-parola-puternica-de-minimum-10-caractere
```

Aplicația nu pornește dacă `DATABASE_URL` sau `AUTH_SECRET` lipsesc.

### 3. Pornește aplicația

```bash
npm start
```

Apoi deschide:

```text
http://localhost:3000
```

În timpul dezvoltării poți folosi:

```bash
npm run dev
```

La prima pornire, aplicația verifică setările, pregătește tabelele PostgreSQL, creează sau actualizează contul de administrator și pornește serviciile de curățare periodică.

## Variabile de mediu

| Variabilă | Când este necesară | La ce folosește |
|---|---|---|
| `DATABASE_URL` | Întotdeauna | Conexiunea la PostgreSQL |
| `AUTH_SECRET` | Întotdeauna | Protejează tokenurile de autentificare |
| `ADMIN_EMAIL` | Pentru panoul admin | Emailul administratorului |
| `ADMIN_PASSWORD` | Pentru panoul admin | Parola administratorului |
| `TURNSTILE_SITE_KEY` | Opțional | Cheia publică Cloudflare Turnstile |
| `TURNSTILE_SECRET_KEY` | Opțional | Cheia secretă Cloudflare Turnstile |
| `VAPID_PUBLIC_KEY` | Pentru notificări | Cheia publică Web Push |
| `VAPID_PRIVATE_KEY` | Pentru notificări | Cheia privată; nu trebuie publicată |
| `VAPID_SUBJECT` | Pentru notificări | Contactul serviciului, de exemplu `mailto:admin@example.com` |
| `UPLOAD_DIR` | Opțional | Folderul în care se salvează fotografiile |
| `PORT` | De obicei automat | Portul serverului; Render îl setează singur |

Dacă folosești notificări push, toate cele trei variabile `VAPID_*` trebuie configurate. Aplicația refuză o configurare incompletă pentru a evita erori greu de observat.

## Notificări push

Cheile VAPID se generează o singură dată:

```bash
npm run push:keys
```

Apoi adaugă valorile în `.env` sau în **Render → Environment**:

```env
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:adresa-ta@example.com
```

Păstrează aceleași chei la toate deploy-urile. Dacă le schimbi, abonamentele existente pot deveni invalide.

Utilizatorul decide singur dacă activează notificările. Permisiunea este cerută din secțiunea **Cont**, nu automat la deschiderea aplicației.

Pe iPhone și iPad, aplicația trebuie adăugată pe ecranul principal și deschisă de acolo pentru ca notificările web să funcționeze.

## Hartă și zonă de funcționare

Toate sesizările păstrate sunt afișate pe aceeași hartă. Cele mai noi sunt procesate primele, folosind ordinea:

```sql
ORDER BY data_raportare DESC, id DESC
```

Zona acceptată este configurată în:

```text
src/config/service-area.js
```

Configurația actuală este pregătită pentru zona Constanța. Pentru alt oraș trebuie schimbate limitele geografice și poziția inițială a hărții.

## Fotografii

În configurația implicită, fotografiile sunt salvate în:

```text
uploads/
```

Acest lucru este suficient pentru dezvoltare sau pentru un server cu disc persistent. Pe un serviciu cu filesystem temporar, fotografiile se pot pierde la restart sau redeploy.

Pentru producție se recomandă:

- un disc persistent;
- Cloudinary;
- Amazon S3;
- Cloudflare R2;
- alt serviciu de stocare compatibil.

Directorul poate fi schimbat prin variabila `UPLOAD_DIR`.

## Deploy pe Render

Proiectul include un fișier `render.yaml`. Configurația recomandată este:

```text
Build Command: npm ci && npm test
Start Command: npm start
Health Check Path: /health
```

Pașii sunt:

1. creează o bază PostgreSQL în Render;
2. creează un Web Service conectat la repository;
3. adaugă `DATABASE_URL`, folosind URL-ul intern al bazei;
4. adaugă `AUTH_SECRET`, `ADMIN_EMAIL` și `ADMIN_PASSWORD`;
5. adaugă cheile VAPID dacă vrei notificări;
6. pornește deploy-ul.

Nu trebuie să setezi manual `PORT` pe Render.

Dacă Render păstrează un build vechi în cache, folosește:

```text
Manual Deploy → Clear build cache & deploy
```

## Teste

Rulează testele cu:

```bash
npm test
```

Pe Render, testele rulează automat în timpul buildului prin:

```bash
npm ci && npm test
```

Suita verifică fluxurile importante: autentificarea, parolele, crearea sesizărilor, duplicatele, statusurile, retenția de 90 de zile, notificările push, categoriile, interfața PWA, tema light/dark, layoutul mobil și navigarea administratorului.

Testele folosesc în principal mock-uri pentru baza de date. Înainte de o lansare oficială sunt recomandate și teste într-un browser real, pe telefoane reale și pe o bază de date de staging.

## Comenzi utile

| Comandă | Ce face |
|---|---|
| `npm start` | Pornește aplicația |
| `npm run dev` | Pornește aplicația cu repornire automată |
| `npm test` | Rulează testele |
| `npm run push:keys` | Generează cheile pentru notificări |
| `npm run db:migrate` | Importă datele JSON vechi în PostgreSQL |

## Migrarea datelor vechi

Dacă există date în `data/users.json` și `data/avarii.json`, ele pot fi importate în PostgreSQL cu:

```bash
npm run db:migrate
```

Este recomandat să faci un backup înainte de a rula migrarea pe o bază care conține deja date importante.

## Structura proiectului

```text
public/           interfața web, tema, hărțile și PWA
src/app.js        configurarea aplicației Express
src/index.js      validarea mediului și pornirea serverului
src/config/       baza de date și configurările comune
src/controllers/  logica rutelor
src/middleware/   autentificare, upload și protecții
src/models/       interogările PostgreSQL
src/routes/       rutele HTTP
src/security/     parole, tokenuri și validări
src/services/     notificări, geocodare și retenție
scripts/          migrare și generarea cheilor VAPID
test/             testele automate
uploads/          fotografiile încărcate în timpul rulării
data/             date JSON istorice sau opționale
```

## Instalarea ca aplicație pe telefon

Aplicația este o PWA, deci poate fi instalată fără un APK separat.

Pe Android:

1. deschide site-ul în Chrome;
2. apasă meniul cu trei puncte;
3. alege **Instalează aplicația** sau **Adaugă pe ecranul principal**.

Pe iPhone:

1. deschide site-ul în Safari;
2. apasă **Share**;
3. alege **Add to Home Screen**.

Evită instalarea direct din browserul intern WhatsApp. Deschide mai întâi linkul în Chrome sau Safari.

După un deploy important, aplicația instalată poate păstra temporar versiunea veche. De obicei este suficient să o închizi și să o redeschizi. Dacă problema persistă, șterge datele site-ului o singură dată.

## Ce mai trebuie avut în vedere pentru producție

Aplicația este potrivită pentru demonstrații și proiecte pilot. Pentru o lansare oficială sunt recomandate:

- stocare persistentă pentru fotografii;
- expirarea automată a tokenurilor;
- un flux „Am uitat parola”;
- backup și procedură de restaurare pentru PostgreSQL;
- verificarea bazei de date în endpointul de health check;
- monitorizarea erorilor;
- o politică de confidențialitate adaptată beneficiarului;
- teste pe dispozitive reale;
- un rate limiter distribuit dacă aplicația rulează pe mai multe instanțe.

## Branding și folosire comercială

Înainte ca aplicația să fie publicată în numele unei companii sau instituții, trebuie clarificate:

- drepturile asupra codului;
- permisiunea de a folosi sigla și numele beneficiarului;
- cine răspunde pentru datele și fotografiile încărcate;
- politica de păstrare și ștergere a informațiilor;
- condițiile de suport și mentenanță.

---

Aplicația a fost gândită ca un punct de legătură simplu între cetățean și echipa care rezolvă problema: raportarea să dureze puțin, locația să fie clară, iar utilizatorul să știe ce se întâmplă cu sesizarea lui.
