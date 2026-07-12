const buckets = new Map();

function cleanup() {
  const now = Date.now();
  for (const [key, value] of buckets) if (value.resetAt <= now) buckets.delete(key);
}

setInterval(cleanup, 10 * 60 * 1000).unref();

function createRateLimit({ windowMs, max, prefix, key = (req) => req.ip, message, skip = () => false }) {
  return (req, res, next) => {
    if (skip(req)) return next();
    const now = Date.now();
    const limit = typeof max === 'function' ? max(req) : max;
    const bucketKey = `${prefix}:${key(req) || 'necunoscut'}`;
    let entry = buckets.get(bucketKey);
    if (!entry || entry.resetAt <= now) entry = { count: 0, resetAt: now + windowMs };
    entry.count += 1;
    buckets.set(bucketKey, entry);
    res.setHeader('RateLimit-Limit', limit);
    res.setHeader('RateLimit-Remaining', Math.max(0, limit - entry.count));
    res.setHeader('RateLimit-Reset', Math.ceil(entry.resetAt / 1000));
    if (entry.count > limit) {
      res.setHeader('Retry-After', Math.max(1, Math.ceil((entry.resetAt - now) / 1000)));
      return res.status(429).json({ eroare: message || 'Prea multe solicitări. Încearcă din nou mai târziu.' });
    }
    next();
  };
}

module.exports = { createRateLimit };
