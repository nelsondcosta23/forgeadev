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

test('SECURITY: /api/admin/login error response does not leak internal details', async () => {
  const res = await fetch(`${baseUrl}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'nonexistent@forgea.dev', password: 'wrong' }),
  });

  assert.strictEqual(res.status, 401);
  const body = await res.json();
  assert.strictEqual(body.error, 'Authentication failed');
  assert.strictEqual(body.details, undefined, 'details must not be exposed in production error response');
});

test('SECURITY: /api/admin/verify error response does not leak internal details', async () => {
  const res = await fetch(`${baseUrl}/api/admin/verify`, {
    headers: { 'Authorization': 'Bearer bad-token' }
  });

  assert.strictEqual(res.status, 401);
  const body = await res.json();
  assert.strictEqual(body.details, undefined, 'details must not be exposed in production error response');
});
