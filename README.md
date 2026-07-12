# Avarii Iluminat

Aplicație web Node.js/Express pentru raportarea și administrarea sesizărilor de iluminat public. Datele sunt stocate în PostgreSQL, iar interfața este servită din directorul `public/`.

## Cerințe

- Node.js 18 sau mai nou;
- npm;
- o bază de date PostgreSQL;
- variabilele de mediu `DATABASE_URL` și `AUTH_SECRET`.

Serverul refuză pornirea dacă `DATABASE_URL` sau `AUTH_SECRET` lipsesc.

## Instalare locală

1. Instalează dependențele:

```bash
npm ci
```

2. Creează configurația locală:

```bash
cp .env.example .env
```

3. Completează cel puțin:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE
AUTH_SECRET=un-secret-lung-si-aleator
```

Pentru accesul de administrator, completează și:

```env
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=o-parola-puternica
```

4. Pornește aplicația:

```bash
npm start
```

Aplicația creează automat tabelele și indexurile lipsă la pornire. Implicit este disponibilă la `http://localhost:3000`, iar verificarea de sănătate este la `/health`.

Pentru dezvoltare cu repornire automată:

```bash
npm run dev
```

## Teste

Rulează:

```bash
npm test
```

Testele minime acoperă autentificarea, hash-ul parolei, crearea unei sesizări, respingerea duplicatelor și validarea configurației obligatorii de pornire.

## Deploy pe Render

Creează un **Web Service** Node.js și o bază de date PostgreSQL, apoi configurează serviciul astfel:

```text
Build Command: npm ci && npm test
Start Command: npm start
```

În **Environment**, adaugă:

| Variabilă | Obligatorie | Rol |
|---|---:|---|
| `DATABASE_URL` | Da | URL-ul intern al bazei PostgreSQL |
| `AUTH_SECRET` | Da | Semnarea token-urilor și a hash-urilor anonime |
| `ADMIN_EMAIL` | Pentru admin | Emailul contului administrator |
| `ADMIN_PASSWORD` | Pentru admin | Parola contului administrator; minimum 10 caractere |
| `TURNSTILE_SITE_KEY` | Nu | Cheia publică Cloudflare Turnstile |
| `TURNSTILE_SECRET_KEY` | Nu | Cheia secretă Cloudflare Turnstile |
| `UPLOAD_DIR` | Nu | Director personalizat pentru pozele încărcate |
| `DATA_DIR` | Nu | Director personalizat pentru datele locale auxiliare |

Nu seta manual `PORT`; Render îl furnizează automat, iar aplicația îl citește din `process.env.PORT`.

Fișierul `render.yaml` din proiect poate fi folosit pentru un deploy de tip Blueprint. Variabilele marcate `sync: false` trebuie introduse în dashboard-ul Render.

### Fișiere încărcate

Pozele sunt salvate implicit în directorul local `uploads/`. Pentru păstrare durabilă în producție, configurează un spațiu persistent sau un serviciu extern de stocare și setează `UPLOAD_DIR` conform infrastructurii folosite.

## Migrarea datelor JSON existente

Pentru a importa conținutul din `data/users.json` și `data/avarii.json` în PostgreSQL:

```bash
npm run db:migrate
```

Scriptul creează schema dacă este necesar și face actualizare la conflict pentru înregistrările cu același ID. Fă backup înainte de migrarea unei baze cu date importante.

## Variabile de securitate

`AUTH_SECRET` trebuie să fie stabil între deploy-uri. Schimbarea sa invalidează token-urile existente și modifică hash-urile anonime folosite de aplicație. Nu salva fișierul `.env` în Git.

Dacă cheile Turnstile nu sunt configurate, verificarea Turnstile este dezactivată. Pentru o versiune publică, configurează ambele chei.

## Structură

```text
public/                 interfața web
src/app.js              configurarea aplicației Express
src/index.js            validarea mediului și pornirea serverului
src/config/             PostgreSQL, schemă și configurare
src/controllers/        logica rutelor
src/models/             accesul la date
src/routes/             rutele HTTP
src/security/           parole, token-uri și validări
test/                   testele automate
scripts/                scripturi de migrare
uploads/                poze încărcate în runtime
```

## Comenzi disponibile

| Comandă | Descriere |
|---|---|
| `npm start` | Pornește serverul |
| `npm run dev` | Pornește cu Nodemon |
| `npm test` | Rulează testele automate |
| `npm run db:migrate` | Importă datele JSON în PostgreSQL |

## Observație despre listarea sesizărilor

Ruta care listează sesizările folosește în continuare citirea întregii colecții. Aceasta este o problemă separată de paginare și nu face parte din optimizarea verificării duplicatelor, care interoghează doar candidații din ultimele 10 minute.
