const net = require('node:net');
const subscriptionsModel = require('../models/push-subscriptions.model');


function isPrivateIpv4(address) {
  const parts = address.split('.').map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return true;
  const [a, b] = parts;
  return a === 0 || a === 10 || a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && (b === 0 || b === 168)) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224;
}

function isPrivateHostname(hostname) {
  const value = hostname.replace(/^\[|\]$/g, '').toLowerCase();
  if (value === 'localhost' || value.endsWith('.localhost') || value.endsWith('.local') || value.endsWith('.internal')) return true;
  const ipVersion = net.isIP(value);
  if (ipVersion === 4) return isPrivateIpv4(value);
  if (ipVersion === 6) {
    return value === '::' || value === '::1' || value.startsWith('fc') || value.startsWith('fd') ||
      /^fe[89ab]/.test(value) || value.startsWith('ff') || value.startsWith('2001:db8:');
  }
  return false;
}

function normalizeSubscription(value) {
  const subscription = value?.subscription || value;
  const endpoint = String(subscription?.endpoint || '').trim();
  const p256dh = String(subscription?.keys?.p256dh || '').trim();
  const auth = String(subscription?.keys?.auth || '').trim();

  if (!endpoint || endpoint.length > 2048) {
    throw new Error('Abonamentul push nu conține un endpoint valid.');
  }

  let url;
  try {
    url = new URL(endpoint);
  } catch {
    throw new Error('Endpointul abonamentului push nu este valid.');
  }

  if (url.protocol !== 'https:' || url.username || url.password || (url.port && url.port !== '443')) {
    throw new Error('Endpointul abonamentului push trebuie să folosească HTTPS standard.');
  }
  if (isPrivateHostname(url.hostname)) {
    throw new Error('Endpointul abonamentului push nu poate indica o adresă locală sau privată.');
  }

  const base64Url = /^[A-Za-z0-9_-]+$/;
  if (!base64Url.test(p256dh) || p256dh.length < 40 || p256dh.length > 512 ||
      !base64Url.test(auth) || auth.length < 8 || auth.length > 256) {
    throw new Error('Cheile abonamentului push nu sunt valide.');
  }

  const expirationTime = subscription.expirationTime == null ? null : Number(subscription.expirationTime);
  if (expirationTime !== null && (!Number.isFinite(expirationTime) || expirationTime < 0)) {
    throw new Error('Data de expirare a abonamentului push nu este validă.');
  }

  return {
    endpoint,
    expirationTime,
    keys: { p256dh, auth },
  };
}

async function salveazaAbonament(req, res) {
  let subscription;
  try {
    subscription = normalizeSubscription(req.body);
  } catch (error) {
    return res.status(400).json({ eroare: error.message });
  }

  await subscriptionsModel.salveaza(req.auth.id, subscription, req.headers['user-agent']);
  res.status(201).json({ mesaj: 'Notificările au fost activate pe acest dispozitiv.' });
}

async function stergeAbonament(req, res) {
  const endpoint = String(req.body?.endpoint || '').trim();
  if (!endpoint || endpoint.length > 2048) {
    return res.status(400).json({ eroare: 'Endpointul abonamentului lipsește.' });
  }

  await subscriptionsModel.stergePentruUser(req.auth.id, endpoint);
  res.json({ mesaj: 'Notificările au fost dezactivate pe acest dispozitiv.' });
}

module.exports = { salveazaAbonament, stergeAbonament, normalizeSubscription, isPrivateHostname };
