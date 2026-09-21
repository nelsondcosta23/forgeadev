import test from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import { app } from '../server.js';

let testServer;
let baseUrl;

test.before(async () => {
  await new Promise((resolve) => {
    testServer = http.createServer(app);
    testServer.listen(0, () => {
      const port = testServer.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
});

test.after(async () => {
  if (testServer) {
    await new Promise((resolve) => testServer.close(resolve));
  }
});

test('SECURITY: /api/admin/login enforces strict rate limiting (max 5 requests per window)', async () => {
  let hitLimit = false;

  // Attempt 7 quick login requests
  for (let i = 0; i < 7; i++) {
    const res = await fetch(`${baseUrl}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: `test${i}@forgea.dev`, password: 'wrongpassword' }),
    });

    if (res.status === 429) {
      hitLimit = true;
      const body = await res.json();
      assert.match(body.error, /too many/i);
      break;
    }
  }

  assert.strictEqual(hitLimit, true, 'Expected rate limiter to return 429 after 5 failed attempts');
});

test('SECURITY: CORS headers allow trusted origins and block untrusted origins', async () => {
  // 1. Trusted Origin
  const allowedRes = await fetch(`${baseUrl}/api/results/test-session-id`, {
    headers: { 'Origin': 'http://localhost:5173' }
  });
  assert.strictEqual(
    allowedRes.headers.get('access-control-allow-origin'),
    'http://localhost:5173',
    'Trusted origin must be reflected in Access-Control-Allow-Origin'
  );

  // 2. Untrusted Origin
  const untrustedRes = await fetch(`${baseUrl}/api/results/test-session-id`, {
    headers: { 'Origin': 'https://evil-attacker.example.com' }
  });
  const acao = untrustedRes.headers.get('access-control-allow-origin');
  assert.notStrictEqual(
    acao,
    'https://evil-attacker.example.com',
    'Untrusted origin must NOT receive Access-Control-Allow-Origin'
  );
});
