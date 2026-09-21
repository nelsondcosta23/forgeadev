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

test('SECURITY: Unauthenticated GET /api/pb/quiz_sessions must be rejected with 401', async () => {
  const res = await fetch(`${baseUrl}/api/pb/quiz_sessions`);
  assert.strictEqual(res.status, 401, 'Expected 401 Unauthorized for unauthenticated access');
  const body = await res.json();
  assert.match(body.error, /authentication/i);
});

test('SECURITY: Unauthenticated GET /api/pb/users must be rejected with 401 or 403', async () => {
  const res = await fetch(`${baseUrl}/api/pb/users`);
  assert.ok(res.status === 401 || res.status === 403, `Expected 401 or 403, got ${res.status}`);
});

test('SECURITY: Unauthenticated DELETE /api/pb/quiz_sessions?id=dummy must be rejected with 401', async () => {
  const res = await fetch(`${baseUrl}/api/pb/quiz_sessions?id=dummy`, {
    method: 'DELETE',
  });
  assert.strictEqual(res.status, 401, 'Expected 401 Unauthorized for unauthenticated deletion');
});

test('SECURITY: Unauthenticated POST /api/pb/admin_prompts must be rejected with 401', async () => {
  const res = await fetch(`${baseUrl}/api/pb/admin_prompts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt_text: 'malicious prompt' }),
  });
  assert.strictEqual(res.status, 401, 'Expected 401 Unauthorized for prompt modification');
});

test('SECURITY: Calling /api/admin/verify with invalid token must return 401', async () => {
  const res = await fetch(`${baseUrl}/api/admin/verify`, {
    headers: { 'Authorization': 'Bearer fake-invalid-token-123' }
  });
  assert.strictEqual(res.status, 401, 'Expected 401 for invalid admin token');
});

test('SECURITY: Legacy leaked x-internal-key must NOT grant access to admin collections', async () => {
  const res = await fetch(`${baseUrl}/api/pb/quiz_sessions`, {
    headers: { 'x-internal-key': 'forgea-lite-stack-secret' }
  });
  assert.strictEqual(res.status, 401, 'x-internal-key must not bypass admin authentication');
});

test('FUNCTIONALITY: Public POST /api/pb/quiz_sessions is allowed without admin token', async () => {
  const res = await fetch(`${baseUrl}/api/pb/quiz_sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  // Empty payload should return 400 (missing session_id), NOT 401 Unauthorized
  assert.strictEqual(res.status, 400);
  const body = await res.json();
  assert.match(body.error, /session_id/i);
});
