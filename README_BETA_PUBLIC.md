# Avarii iluminat - beta public pentru prezentare

Aceasta este varianta pregatita pentru a fi urcata rapid pe un server public HTTPS si folosita pe telefon ca PWA.

## Pornire locala

```bash
npm install
npm start
```

Utilizator:

```text
http://localhost:3000/harta.html
```

Admin:

```text
http://localhost:3000/admin-login.html
```

## Conturi demo

Admin:

```text
email: admin@demo.ro
parola: admin123
```

Utilizator:

```text
email: user@demo.ro
parola: user123
```

## Deploy rapid pe Render

1. Incarca proiectul pe GitHub.
2. In Render alege New Web Service.
3. Conecteaza repository-ul.
4. Foloseste setarile:

```text
Build Command: npm install
Start Command: npm start
Health Check Path: /health
```

Dupa deploy, linkul public va fi de forma:

```text
https://numele-aplicatiei.onrender.com
```

Pagina de utilizator:

```text
https://numele-aplicatiei.onrender.com/harta.html
```

Admin:

```text
https://numele-aplicatiei.onrender.com/admin-login.html
```

## Instalare pe telefon

Android:

```text
Chrome -> deschide linkul -> Instaleaza aplicatia / Add to Home screen
```

iPhone:

```text
Safari -> Share -> Add to Home Screen
```

## Observatie importanta pentru beta

Aceasta varianta salveaza datele in fisiere JSON si pozele in folderul local uploads. Este potrivita pentru prezentare si beta restransa. Pentru lansare publica reala, datele trebuie mutate intr-o baza de date si pozele intr-un storage persistent.

## Persistență pe Render

Pentru ca sesizările să rămână după restart/redeploy, vezi `README_PERSISTENTA_RENDER.md`.

## Render Free fără disk

Pentru această variantă nu configura `DATA_DIR`, `UPLOAD_DIR` sau Persistent Disk. Protecțiile anti-spam funcționează în memorie, dar contoarele și datele locale se pot reseta la restart/redeploy.
