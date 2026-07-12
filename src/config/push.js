function getPushConfig(env = process.env) {
  const publicKey = String(env.VAPID_PUBLIC_KEY || '').trim();
  const privateKey = String(env.VAPID_PRIVATE_KEY || '').trim();
  const subject = String(env.VAPID_SUBJECT || '').trim();
  const values = [publicKey, privateKey, subject];
  const configured = values.some(Boolean);

  if (!configured) {
    return { enabled: false, publicKey: '', privateKey: '', subject: '' };
  }

  if (values.some((value) => !value)) {
    throw new Error(
      'Configurarea notificărilor push este incompletă. Setează împreună VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY și VAPID_SUBJECT.'
    );
  }

  if (!/^[A-Za-z0-9_-]{87}$/.test(publicKey)) {
    throw new Error('VAPID_PUBLIC_KEY nu are formatul așteptat. Generează din nou perechea de chei VAPID.');
  }

  if (!/^[A-Za-z0-9_-]{43}$/.test(privateKey)) {
    throw new Error('VAPID_PRIVATE_KEY nu are formatul așteptat. Generează din nou perechea de chei VAPID.');
  }

  if (!/^(mailto:|https:\/\/)/i.test(subject)) {
    throw new Error('VAPID_SUBJECT trebuie să înceapă cu mailto: sau https://.');
  }

  return { enabled: true, publicKey, privateKey, subject };
}

module.exports = { getPushConfig };
