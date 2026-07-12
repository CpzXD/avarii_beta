# PostgreSQL + ultimele îmbunătățiri UI

Această versiune păstrează backendul PostgreSQL și include ultimele îmbunătățiri pentru:

- admin: toast la actualizare, stare „Se actualizează...”, animație discretă a statusului;
- conversație: mesaje diferențiate vizual pentru cetățean, admin și sistem;
- feedback: card separat cu stele și afișarea evaluării existente;
- protecțiile anti-spam și regulile de acces existente;
- hărțile și configurarea PostgreSQL din versiunea de bază.

Variabile Render necesare:

- DATABASE_URL
- AUTH_SECRET
- ADMIN_EMAIL
- ADMIN_PASSWORD

Nu publica fișierul `.env` și nu include parole în GitHub.
