# Fixuri aplicate

## Duplicate

Verificarea duplicatelor nu mai apelează `citesteToate()`. Modelul execută un query PostgreSQL limitat la ultimele 10 minute și întoarce doar sesizările cu același `requestId`, `userId` sau `reporterHash`; comparația de titlu, categorie și distanță rămâne în controller.

## Teste

Rulează:

```bash
npm test
```

Testele acoperă:

- înregistrare, hash-ul parolei, login reușit și login cu parolă greșită;
- creare sesizare și respingerea unei retrimiteri duplicate;
- prezența filtrului SQL `data_raportare > now() - interval '10 minutes'`.

## Moderare

Logica neterminată bazată pe `isVisible`, `vizibilPublic` și `moderare` a fost eliminată. Toate sesizările existente sunt tratate conform fluxului actual, fără o stare de moderare simulată.
