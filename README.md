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

Testele acoperă autentificarea, hash-ul parolei, crearea unei sesizări, respingerea duplicatelor, listarea completă în ordine stabilă, configurarea obligatorie, notificările push și politica de retenție de 90 de zile.



## Notificări push la schimbarea statusului

Aplicația poate trimite notificări Web Push proprietarului unei sesizări create din cont. Notificarea este trimisă când administratorul schimbă efectiv statusul în:

- `confirmata` — „Sesizarea dumneavoastră a fost confirmată”;
- `in_lucru` — „Sesizarea dumneavoastră este în lucru”;
- `rezolvata` — „Sesizarea dumneavoastră a fost rezolvată”;
- `noua` — pentru o sesizare redeschisă și revenită la starea nouă.

O actualizare care păstrează același status nu trimite o notificare nouă. Sesizările anonime nu pot primi push, deoarece nu sunt asociate unui cont. Abonamentul este salvat separat pentru fiecare browser/dispozitiv în tabela `push_subscriptions`. Endpointurile expirate sunt eliminate automat când serviciul push răspunde cu `404` sau `410`.

Utilizatorul activează sau dezactivează notificările din fila **Cont**. Permisiunea browserului este cerută numai după apăsarea butonului. Apăsarea notificării deschide direct pagina sesizării.

Instrucțiunile scurte dedicate Render sunt și în [`PUSH_RENDER_SETUP.md`](PUSH_RENDER_SETUP.md).

### Configurare VAPID

Generează o singură dată perechea de chei:

```bash
npm run push:keys
```

Comanda afișează trei linii care trebuie copiate în `.env` local sau în **Render → Environment**:

```env
VAPID_PUBLIC_KEY=cheia-publica-generata
VAPID_PRIVATE_KEY=cheia-privata-generata
VAPID_SUBJECT=mailto:adresa-ta@example.com
```

Păstrează `VAPID_PRIVATE_KEY` secretă și stabilă între deploy-uri. Nu o salva în Git. Dacă toate cele trei variabile lipsesc, aplicația pornește normal, dar afișează notificările ca neconfigurate. Dacă este setată doar o parte dintre ele, serverul refuză pornirea pentru a evita o configurare incompletă.

Render oferă HTTPS automat, necesar pentru service worker și Web Push. Pe iPhone/iPad, utilizatorul trebuie să instaleze aplicația pe ecranul principal și să deschidă versiunea instalată înainte de activarea notificărilor. Pe dispozitivele care nu acceptă Push API, aplicația afișează un mesaj și continuă să funcționeze fără notificări.

Schimbarea statusului rămâne salvată chiar dacă un furnizor push este temporar indisponibil; eroarea de notificare nu anulează actualizarea sesizării.

## Retenția sesizărilor rezolvate

Harta încarcă toate sesizările păstrate în PostgreSQL, în ordine de la cea mai nouă la cea mai veche. Afișarea completă este separată de politica de retenție:

- sesizările cu status `noua`, `confirmata` sau `in_lucru` sunt păstrate fără termen automat de expirare;
- când administratorul schimbă statusul în `rezolvata`, aplicația memorează momentul în coloana `rezolvata_la`;
- o sesizare rezolvată rămâne vizibilă timp de 90 de zile;
- după 90 de zile de la rezolvare, înregistrarea și poza sa locală sunt șterse automat;
- dacă sesizarea este redeschisă, termenul este anulat; la o rezolvare ulterioară începe un nou interval de 90 de zile.

Curățarea rulează la pornirea serviciului și apoi o dată la 24 de ore. Interogarea șterge exclusiv rândurile care îndeplinesc ambele condiții:

```sql
status = 'rezolvata'
AND COALESCE(rezolvata_la, actualizat_la) < now() - interval '90 days'
```

`src/config/schema.sql` adaugă automat coloana și indexul necesar și face un backfill conservator pentru sesizările care erau deja rezolvate înainte de această modificare.

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
| `VAPID_PUBLIC_KEY` | Pentru push | Cheia publică Web Push, expusă browserului |
| `VAPID_PRIVATE_KEY` | Pentru push | Cheia privată Web Push; trebuie păstrată secretă |
| `VAPID_SUBJECT` | Pentru push | Contact `mailto:` sau adresă `https://` pentru VAPID |
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
src/services/           geocodare, retenție și notificări push
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
| `npm run push:keys` | Generează perechea VAPID pentru notificări push |

## Afișarea completă pe hartă

`GET /avarii` întoarce toate sesizările păstrate în PostgreSQL. Nu există parametri `page`/`limit` și nici controale **Anterior/Următor** în interfețe.

Interogarea folosește:

```sql
SELECT data
FROM avarii
ORDER BY data_raportare DESC, id DESC;
```

Ordinea este globală și deterministă: cele mai noi sesizări apar primele, iar `id DESC` separă stabil înregistrările care au aceeași secundă de raportare. `harta.html` afișează toate punctele primite pe o singură hartă, fără listă paginată dedesubt. Detaliile se deschid din marker, iar fila „Ale mele” rămâne separată. Panoul `admin.html` păstrează lista de administrare și harta, dar fără paginare. Filtrele și căutarea se aplică întregului set încărcat.

Sesizările active sunt păstrate fără expirare. Numai cele rezolvate sunt eliminate automat după 90 de zile, conform secțiunii despre retenție.
