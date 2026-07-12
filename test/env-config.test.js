const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { validateRuntimeEnv } = require('../src/config/env');

test('configurația de runtime cere DATABASE_URL și AUTH_SECRET', () => {
  assert.throws(
    () => validateRuntimeEnv({ DATABASE_URL: 'postgresql://test' }),
    /AUTH_SECRET/
  );

  assert.throws(
    () => validateRuntimeEnv({ AUTH_SECRET: 'secret-test' }),
    /DATABASE_URL/
  );

  assert.doesNotThrow(() => validateRuntimeEnv({
    DATABASE_URL: 'postgresql://test',
    AUTH_SECRET: 'secret-test',
  }));
});

test('serverul se oprește înainte de inițializare când AUTH_SECRET lipsește', () => {
  const projectRoot = path.join(__dirname, '..');
  const result = spawnSync(process.execPath, ['src/index.js'], {
    cwd: projectRoot,
    env: {
      ...process.env,
      DATABASE_URL: 'postgresql://unused-for-this-test',
      AUTH_SECRET: '',
    },
    encoding: 'utf8',
    timeout: 5000,
  });

  assert.equal(result.status, 1);
  assert.match(`${result.stdout}\n${result.stderr}`, /AUTH_SECRET/);
  assert.doesNotMatch(`${result.stdout}\n${result.stderr}`, /Server pornit/);
});


test('configurația push este opțională, dar cele trei valori VAPID trebuie setate împreună', () => {
  const base = { DATABASE_URL: 'postgresql://test', AUTH_SECRET: 'secret-test' };

  assert.doesNotThrow(() => validateRuntimeEnv(base));
  assert.throws(
    () => validateRuntimeEnv({ ...base, VAPID_PUBLIC_KEY: 'A'.repeat(87) }),
    /incompletă|VAPID_PRIVATE_KEY/i
  );
  assert.doesNotThrow(() => validateRuntimeEnv({
    ...base,
    VAPID_PUBLIC_KEY: 'A'.repeat(87),
    VAPID_PRIVATE_KEY: 'B'.repeat(43),
    VAPID_SUBJECT: 'mailto:test@example.com',
  }));
});
