# Persistență sesizări pe Render

Varianta aceasta permite aplicației să salveze sesizările, utilizatorii și pozele într-un folder configurabil, astfel încât datele să nu revină la cele demo după restart/redeploy.

## Setări recomandate pe Render

Pentru persistență reală pe Render ai nevoie de Persistent Disk. Pe Free, filesystem-ul rămâne efemer, deci datele pot dispărea la restart sau redeploy.

### 1. Treci Web Service-ul pe plan plătit minim

În Render Dashboard:

- deschide serviciul aplicației
- mergi la Settings
- schimbă planul din Free în Starter sau alt plan plătit

### 2. Adaugă Persistent Disk

În Render Dashboard:

- deschide serviciul aplicației
- mergi la Disks
- Add Disk
- Name: avarii-data
- Mount Path: /var/data
- Size: 1 GB
- salvează

Render va face redeploy automat.

### 3. Adaugă Environment Variables

În Environment adaugă:

DATA_DIR=/var/data/data
UPLOAD_DIR=/var/data/uploads

Apoi apasă Save Changes și fă redeploy.

## După deploy

Testează:

- creezi o sesizare de pe telefon
- verifici că apare în admin
- dai Manual Deploy / restart
- verifici că sesizarea încă există

## Ce se păstrează

- conturile create
- sesizările trimise
- statusurile schimbate de admin
- timeline-ul
- mesajele
- urmăritorii
- feedbackul
- pozele încărcate

## Limită importantă

Aceasta este varianta rapidă pentru beta/pilot. Pentru producție mare, recomandarea rămâne bază de date reală, de exemplu Supabase/Postgres, și storage separat pentru poze.
