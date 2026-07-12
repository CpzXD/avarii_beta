const pool = require('../config/db');

// Rulează un update pe o singură sesizare într-o tranzacție, cu row lock
// (SELECT ... FOR UPDATE), ca să eviți suprascrierea unei modificări
// concurente (ex: doi useri scriu un mesaj în același timp pe aceeași sesizare).
async function withLockedAvarie(id, mutate) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query('SELECT data, rezolvata_la FROM avarii WHERE id = $1 FOR UPDATE', [id]);
    if (!rows[0]) {
      await client.query('ROLLBACK');
      return null;
    }
    const avarie = rows[0].data;
    const statusAnterior = avarie.status;
    const rezultat = mutate(avarie, { statusAnterior });

    let rezolvataLa = rows[0].rezolvata_la || avarie.rezolvataLa || null;
    if (avarie.status === 'rezolvata' && statusAnterior !== 'rezolvata') {
      rezolvataLa = avarie.actualizatLa || new Date().toISOString();
    } else if (avarie.status !== 'rezolvata') {
      rezolvataLa = null;
    }

    if (rezolvataLa) avarie.rezolvataLa = new Date(rezolvataLa).toISOString();
    else delete avarie.rezolvataLa;

    await client.query(
      'UPDATE avarii SET data = $1, status = $2, actualizat_la = $3, rezolvata_la = $4 WHERE id = $5',
      [avarie, avarie.status, avarie.actualizatLa, rezolvataLa, id]
    );
    await client.query('COMMIT');
    return rezultat === undefined ? avarie : rezultat;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function citesteToate() {
  const { rows } = await pool.query(
    'SELECT data FROM avarii ORDER BY data_raportare DESC, id DESC'
  );
  return rows.map((row) => row.data);
}

async function citesteCandidateDuplicateRecente({ requestId = null, reporterKey = null }) {
  if (!requestId && !reporterKey) return [];
  const { rows } = await pool.query(
    `SELECT data
       FROM avarii
      WHERE data_raportare > now() - interval '10 minutes'
        AND (
          ($1::text IS NOT NULL AND data->>'requestId' = $1)
          OR ($2::text IS NOT NULL AND (data->>'userId' = $2 OR data->>'reporterHash' = $2))
        )
      ORDER BY data_raportare DESC`,
    [requestId || null, reporterKey || null]
  );
  return rows.map((r) => r.data);
}

async function gasesteDupaId(id) {
  const { rows } = await pool.query('SELECT data FROM avarii WHERE id = $1', [id]);
  return rows[0]?.data || undefined;
}

async function creeaza(avarieNoua) {
  await pool.query(
    'INSERT INTO avarii (id, status, data_raportare, actualizat_la, data) VALUES ($1, $2, $3, $4, $5)',
    [avarieNoua.id, avarieNoua.status, avarieNoua.dataRaportare, avarieNoua.actualizatLa, avarieNoua]
  );
  return avarieNoua;
}

async function actualizeazaStatusCuMeta(id, statusNou, mesajAdmin = '') {
  let statusAnterior = null;
  const avarie = await withLockedAvarie(id, (item, meta) => {
    statusAnterior = meta.statusAnterior;
    const acum = new Date().toISOString();
    item.status = statusNou;
    item.actualizatLa = acum;
    item.statusHistory = Array.isArray(item.statusHistory) ? item.statusHistory : [];
    item.statusHistory.push({ status: statusNou, mesaj: mesajAdmin || mesajImplicitStatus(statusNou), autor: 'admin', data: acum });
    item.mesaje = Array.isArray(item.mesaje) ? item.mesaje : [];
    item.mesaje.push({ id: `${Date.now()}-${Math.round(Math.random() * 1e6)}`, autor: 'Sistem', rol: 'sistem', mesaj: mesajAdmin || mesajImplicitStatus(statusNou), data: acum });
  });

  if (!avarie) return null;
  return { avarie, statusAnterior, statusSchimbat: statusAnterior !== statusNou };
}

async function actualizeazaStatus(id, statusNou, mesajAdmin = '') {
  const rezultat = await actualizeazaStatusCuMeta(id, statusNou, mesajAdmin);
  return rezultat?.avarie || null;
}

async function adaugaMesaj(id, mesajNou) {
  return withLockedAvarie(id, (avarie) => {
    avarie.mesaje = Array.isArray(avarie.mesaje) ? avarie.mesaje : [];
    avarie.mesaje.push(mesajNou);
    avarie.actualizatLa = mesajNou.data;
  });
}

async function urmareste(id, follower) {
  return withLockedAvarie(id, (avarie) => {
    avarie.followers = Array.isArray(avarie.followers) ? avarie.followers : [];
    const previousCount = Number(avarie.urmaritori || 0);
    const exista = avarie.followers.some((f) => f.userId === follower.userId || String(f.email || '').toLowerCase() === String(follower.email || '').toLowerCase());
    if (!exista) {
      avarie.followers.push({ ...follower, data: new Date().toISOString() });
      avarie.urmaritori = Math.max(previousCount + 1, avarie.followers.length);
    } else {
      avarie.urmaritori = Math.max(previousCount, avarie.followers.length);
    }
  });
}

async function feedback(id, feedbackNou) {
  return withLockedAvarie(id, (avarie) => {
    const acum = new Date().toISOString();
    avarie.feedback = Array.isArray(avarie.feedback) ? avarie.feedback : [];
    const existent = avarie.feedback.findIndex((f) => f.userId && f.userId === feedbackNou.userId);
    const intrare = { ...feedbackNou, data: acum };
    if (existent >= 0) avarie.feedback[existent] = intrare;
    else avarie.feedback.push(intrare);
    avarie.mesaje = Array.isArray(avarie.mesaje) ? avarie.mesaje : [];
    const mesajIndex = avarie.mesaje.findIndex((m) => m.tip === 'feedback' && m.userId === feedbackNou.userId);
    const steleText = `${'★'.repeat(feedbackNou.stele)}${'☆'.repeat(5 - feedbackNou.stele)}`;
    const mesajFeedback = `Feedback final: ${steleText} (${feedbackNou.stele}/5)${feedbackNou.mesaj ? ` — ${feedbackNou.mesaj}` : ''}`;
    const mesajConversatie = {
      id: mesajIndex >= 0 ? avarie.mesaje[mesajIndex].id : `${Date.now()}-${Math.round(Math.random() * 1e6)}`,
      autor: feedbackNou.nume,
      rol: 'user',
      tip: 'feedback',
      userId: feedbackNou.userId,
      mesaj: mesajFeedback,
      data: acum,
    };
    if (mesajIndex >= 0) avarie.mesaje[mesajIndex] = mesajConversatie;
    else avarie.mesaje.push(mesajConversatie);
    avarie.actualizatLa = acum;
  });
}


async function stergeRezolvateExpirate() {
  const { rows } = await pool.query(
    `DELETE FROM avarii
      WHERE status = 'rezolvata'
        AND COALESCE(rezolvata_la, actualizat_la) < now() - interval '90 days'
      RETURNING data`
  );
  return rows.map((row) => row.data);
}

async function sterge(id) {
  const { rowCount } = await pool.query('DELETE FROM avarii WHERE id = $1', [id]);
  return rowCount > 0;
}

function mesajImplicitStatus(status) {
  return {
    noua: 'Sesizarea este nouă și așteaptă verificare.',
    confirmata: 'Sesizarea a fost confirmată de administrație.',
    in_lucru: 'Sesizarea este în lucru. Echipa verifică sau intervine în teren.',
    rezolvata: 'Sesizarea a fost marcată ca rezolvată.',
  }[status] || 'Statusul sesizării a fost actualizat.';
}

module.exports = { citesteToate, citesteCandidateDuplicateRecente, gasesteDupaId, creeaza, actualizeazaStatus, actualizeazaStatusCuMeta, adaugaMesaj, urmareste, feedback, stergeRezolvateExpirate, sterge };
