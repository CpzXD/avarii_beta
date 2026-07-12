async function verifyTurnstile(token, remoteip) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (!token) return false;
  try {
    const body = new URLSearchParams({ secret, response: token, remoteip: remoteip || '' });
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body });
    const result = await response.json();
    return result.success === true;
  } catch {
    return false;
  }
}

module.exports = { verifyTurnstile };
