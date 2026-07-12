# Protecție beta public

Protecțiile sunt active automat: parole scrypt, tokenuri semnate, acces admin protejat, rate limiting, validare input, honeypot, blocare dubluri rapide, upload JPG/PNG/WebP de maximum 5 MB și headere de securitate.

## Variabile obligatorii în Render

În `Service > Environment` adaugă:

- `AUTH_SECRET`: un șir aleator lung de minimum 32 de caractere
- `ADMIN_EMAIL`: emailul privat al administratorului
- `ADMIN_PASSWORD`: o parolă unică de minimum 10 caractere

Exemplu de generare pentru `AUTH_SECRET` în PowerShell:

```powershell
[Convert]::ToBase64String((1..48 | ForEach-Object { Get-Random -Maximum 256 }))
```

Nu publica valorile în GitHub. Loginul admin este dezactivat pe server până când `ADMIN_EMAIL` și `ADMIN_PASSWORD` sunt configurate.

## Cloudflare Turnstile opțional

Pentru protecție suplimentară la creare cont și trimitere sesizare, creează un widget Turnstile și adaugă în Render:

- `TURNSTILE_SITE_KEY`
- `TURNSTILE_SECRET_KEY`

Dacă aceste variabile lipsesc, aplicația funcționează cu celelalte protecții active.

## Comportament anonim

Sesizările trimise fără cont apar imediat atât în admin, cât și pe harta utilizatorilor. Utilizatorul anonim nu poate urmări sesizări, accesa conversații sau trimite feedback.

## Feedback după rezolvare

După ce o sesizare este marcată ca rezolvată, doar creatorul autentificat poate acorda între 1 și 5 stele și poate adăuga un comentariu. Feedbackul este păstrat în conversația sesizării până la ștergerea definitivă a acesteia.

## Autentificare persistentă

Sesiunile nu expiră automat. Utilizatorul și administratorul rămân conectați până la deconectarea explicită, ștergerea datelor browserului, eliminarea contului sau schimbarea variabilei `AUTH_SECRET`. Pentru a păstra autentificările după restart și redeploy, `AUTH_SECRET` trebuie să rămână aceeași valoare în Render.
