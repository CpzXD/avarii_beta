const fs = require('fs');
const path = require('path');
const avariiModel = require('../models/avarii.model');
const { uploadsDir } = require('../config/paths');

const RETENTION_INTERVAL_MS = 24 * 60 * 60 * 1000;

function stergePozaLocala(avarie) {
  if (!avarie?.pozaUrl || !String(avarie.pozaUrl).startsWith('/uploads/')) return;
  const filename = path.basename(avarie.pozaUrl);
  const filePath = path.join(uploadsDir, filename);
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (error) {
    console.warn(`Poza sesizării expirate nu a putut fi ștearsă (${filename}): ${error.message}`);
  }
}

async function curataSesizariRezolvateExpirate() {
  const sterse = await avariiModel.stergeRezolvateExpirate();
  sterse.forEach(stergePozaLocala);
  if (sterse.length > 0) {
    console.log(`Curățare retenție: ${sterse.length} sesizări rezolvate de peste 90 de zile au fost șterse.`);
  }
  return sterse.length;
}

function pornesteCuratareaPeriodica({ intervalMs = RETENTION_INTERVAL_MS } = {}) {
  const timer = setInterval(() => {
    curataSesizariRezolvateExpirate().catch((error) => {
      console.error(`Curățarea sesizărilor expirate a eșuat: ${error.message}`);
    });
  }, intervalMs);
  timer.unref?.();
  return timer;
}

module.exports = {
  RETENTION_INTERVAL_MS,
  curataSesizariRezolvateExpirate,
  pornesteCuratareaPeriodica,
};
