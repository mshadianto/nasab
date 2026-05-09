// Inline unit test for dual-key migration logic.
// Run: node api/test-token-dualkey.mjs

async function _signToken(payload, secret) {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(payload) + secret));
  return btoa(String.fromCharCode(...new Uint8Array(hash))).slice(0, 16);
}
function timingSafeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}
async function makeToken(userId, env) {
  const payload = { uid: userId, exp: Date.now() + 30 * 24 * 3600000 };
  const secret = env.TOKEN_SECRET || 'nasab-secret';
  const sig = await _signToken(payload, secret);
  return btoa(JSON.stringify(payload)) + '.' + sig;
}
async function verifyToken(token, env) {
  try {
    const [payloadB64, providedSig] = token.split('.');
    if (!payloadB64 || !providedSig) return null;
    const payload = JSON.parse(atob(payloadB64));
    if (!payload || !payload.uid || !payload.exp) return null;
    if (payload.exp < Date.now()) return null;
    const secrets = [];
    if (env?.TOKEN_SECRET) secrets.push(env.TOKEN_SECRET);
    secrets.push('nasab-secret');
    for (const secret of secrets) {
      const expected = await _signToken(payload, secret);
      if (timingSafeEqual(providedSig, expected)) return payload.uid;
    }
    return null;
  } catch { return null; }
}

const NEW_SECRET = 'random-32-char-hex-from-openssl';
let pass = 0, fail = 0;
function check(name, ok) { if (ok) { console.log(' OK ', name); pass++; } else { console.log(' FAIL', name); fail++; } }

// Case 1: legacy token (signed with 'nasab-secret') verifies under env without TOKEN_SECRET set
const legacyToken = await makeToken('u_alice', {});
check('legacy.verify-no-env', await verifyToken(legacyToken, {}) === 'u_alice');

// Case 2: legacy token verifies even when TOKEN_SECRET is set (fallback path)
check('legacy.verify-with-new-secret', await verifyToken(legacyToken, { TOKEN_SECRET: NEW_SECRET }) === 'u_alice');

// Case 3: new token (signed with TOKEN_SECRET) verifies under same env
const newToken = await makeToken('u_bob', { TOKEN_SECRET: NEW_SECRET });
check('new.verify-with-secret', await verifyToken(newToken, { TOKEN_SECRET: NEW_SECRET }) === 'u_bob');

// Case 4: new token does NOT verify under env without TOKEN_SECRET (no legacy fallback match)
check('new.reject-no-env', await verifyToken(newToken, {}) === null);

// Case 5: forged token with bogus sig is rejected
const forged = btoa(JSON.stringify({ uid: 'u_attacker', exp: Date.now() + 1e9 })) + '.AAAAAAAAAAAAAAAA';
check('forged.reject', await verifyToken(forged, { TOKEN_SECRET: NEW_SECRET }) === null);

// Case 6: forged token without sig is rejected
const noSig = btoa(JSON.stringify({ uid: 'u_attacker', exp: Date.now() + 1e9 }));
check('no-sig.reject', await verifyToken(noSig, {}) === null);

// Case 7: expired legacy token rejected
const expiredPayload = { uid: 'u_alice', exp: Date.now() - 1000 };
const expSig = await _signToken(expiredPayload, 'nasab-secret');
const expiredToken = btoa(JSON.stringify(expiredPayload)) + '.' + expSig;
check('expired.reject', await verifyToken(expiredToken, {}) === null);

// Case 8: malformed token rejected
check('malformed.reject', await verifyToken('garbage', {}) === null);
check('malformed-empty.reject', await verifyToken('', {}) === null);

console.log(`\n${pass} pass, ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
