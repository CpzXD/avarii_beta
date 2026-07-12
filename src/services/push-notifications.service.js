const webpush = require('web-push');
const subscriptionsModel = require('../models/push-subscriptions.model');
const { getPushConfig } = require('../config/push');

let configuredSignature = '';

function ensureConfigured() {
  const config = getPushConfig();
  if (!config.enabled) return config;

  const signature = `${config.subject}|${config.publicKey}|${config.privateKey}`;
  if (signature !== configuredSignature) {
    webpush.setVapidDetails(config.subject, config.publicKey, config.privateKey);
    configuredSignature = signature;
  }
  return config;
}

function statusMessage(status) {
  return {
    noua: 'Sesizarea dumneavoastră a revenit la starea nouă.',
    confirmata: 'Sesizarea dumneavoastră a fost confirmată.',
    in_lucru: 'Sesizarea dumneavoastră este în lucru.',
    rezolvata: 'Sesizarea dumneavoastră a fost rezolvată.',
  }[status] || 'Statusul sesizării dumneavoastră a fost actualizat.';
}

function notificationPayload(avarie) {
  const title = String(avarie.titlu || 'Sesizare iluminat').trim().slice(0, 100);
  const url = `/sesizare-detalii.html?id=${encodeURIComponent(avarie.id)}&from=user`;
  return {
    title: 'Actualizare sesizare',
    body: `${statusMessage(avarie.status)} ${title ? `„${title}”` : ''}`.trim(),
    icon: '/branding/luxten-192.png',
    badge: '/branding/luxten-192.png',
    tag: `avarie-status-${avarie.id}`,
    renotify: true,
    data: { url, avarieId: avarie.id, status: avarie.status },
  };
}

async function trimiteCatreAbonament(subscription, payload) {
  try {
    await webpush.sendNotification(
      subscription,
      JSON.stringify(payload),
      { TTL: 24 * 60 * 60, urgency: 'high', timeout: 5000 }
    );
    return { sent: true, removed: false };
  } catch (error) {
    if (error?.statusCode === 404 || error?.statusCode === 410) {
      await subscriptionsModel.stergeDupaEndpoint(subscription.endpoint);
      return { sent: false, removed: true };
    }
    console.warn(`Notificarea push nu a putut fi trimisă: ${error.message}`);
    return { sent: false, removed: false };
  }
}

async function notificaSchimbareStatus(avarie, statusAnterior) {
  const config = ensureConfigured();
  if (!config.enabled || !avarie?.userId || !avarie?.id || statusAnterior === avarie.status) {
    return { sent: 0, removed: 0, skipped: true };
  }

  const subscriptions = await subscriptionsModel.citestePentruUser(avarie.userId);
  if (!subscriptions.length) return { sent: 0, removed: 0, skipped: false };

  const payload = notificationPayload(avarie);
  const results = await Promise.all(subscriptions.map((subscription) => trimiteCatreAbonament(subscription, payload)));
  return {
    sent: results.filter((result) => result.sent).length,
    removed: results.filter((result) => result.removed).length,
    skipped: false,
  };
}

module.exports = { configurePush: ensureConfigured, notificaSchimbareStatus, notificationPayload, statusMessage };
