-- Rulează acest script o singură dată, pe baza de date nouă din Render,
-- ca să creeze tabelele. Poți face asta din tab-ul "Shell"/"psql" din
-- dashboard-ul Render, sau local cu: psql "$DATABASE_URL" -f src/config/schema.sql

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  data JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS avarii (
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL,
  data_raportare TIMESTAMPTZ NOT NULL,
  actualizat_la TIMESTAMPTZ NOT NULL,
  rezolvata_la TIMESTAMPTZ,
  data JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_avarii_status ON avarii (status);
CREATE INDEX IF NOT EXISTS idx_avarii_data_raportare ON avarii (data_raportare DESC);

-- Migrare sigură pentru baze create înainte de politica de retenție.
ALTER TABLE avarii ADD COLUMN IF NOT EXISTS rezolvata_la TIMESTAMPTZ;

-- Pentru sesizările deja rezolvate folosim ultima actualizare ca reper inițial.
-- Este o alegere conservatoare: nu șterge mai devreme decât trebuie date vechi.
UPDATE avarii
   SET rezolvata_la = actualizat_la
 WHERE status = 'rezolvata'
   AND rezolvata_la IS NULL;

CREATE INDEX IF NOT EXISTS idx_avarii_rezolvate_retentie
  ON avarii (rezolvata_la)
  WHERE status = 'rezolvata';
