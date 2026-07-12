function cleanText(value, maxLength = 1000) {
  return String(value ?? '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/<[^>]*>/g, '')
    .replace(/[<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

function cleanMultiline(value, maxLength = 1000) {
  return String(value ?? '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/<[^>]*>/g, '')
    .replace(/[<>]/g, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, maxLength);
}

function cleanEmail(value) {
  return String(value ?? '').trim().toLowerCase().slice(0, 254);
}

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(value ?? ''));
}

function normalizeForMatch(value) {
  return cleanText(value, 500)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function looksLikeSpam(value) {
  const text = cleanText(value, 2000);
  if (!text) return false;
  if (/(.)\1{14,}/i.test(text)) return true;
  const links = (text.match(/https?:\/\//gi) || []).length;
  if (links > 2) return true;
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length >= 8) {
    const unique = new Set(words.map((word) => word.toLowerCase()));
    if (unique.size / words.length < 0.25) return true;
  }
  return false;
}

module.exports = { cleanText, cleanMultiline, cleanEmail, validEmail, normalizeForMatch, looksLikeSpam };
