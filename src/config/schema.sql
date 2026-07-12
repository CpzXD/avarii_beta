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
  data JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_avarii_status ON avarii (status);
CREATE INDEX IF NOT EXISTS idx_avarii_data_raportare ON avarii (data_raportare DESC);
