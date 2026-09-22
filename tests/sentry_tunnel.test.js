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

test('MONITORING TUNNEL: rejects empty envelope payload with 400', async () => {
  const res = await fetch(`${baseUrl}/api/sentry-tunnel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-sentry-envelope' },
    body: '',
  });

  assert.strictEqual(res.status, 400);
  const body = await res.json();
  assert.match(body.error, /empty envelope/i);
});

test('MONITORING TUNNEL: rejects invalid header format with 400', async () => {
  const res = await fetch(`${baseUrl}/api/sentry-tunnel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-sentry-envelope' },
    body: 'not-valid-json\n{}\n',
  });

  assert.strictEqual(res.status, 400);
  const body = await res.json();
  assert.match(body.error, /invalid envelope header/i);
});

test('MONITORING TUNNEL: rejects envelope with project ID mismatch with 403', async () => {
  // Project ID is 99 instead of 8
  const header = JSON.stringify({ dsn: 'http://fakekey@localhost:9000/99' });
  const envelope = `${header}\n{"type":"event"}\n{"message":"test"}\n`;

  const res = await fetch(`${baseUrl}/api/sentry-tunnel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-sentry-envelope' },
    body: envelope,
  });

  assert.strictEqual(res.status, 403);
  const body = await res.json();
  assert.match(body.error, /project id mismatch/i);
});

test('MONITORING TUNNEL: forwards valid envelope to Sentry or returns 502 gracefully if upstream is unreachable', async () => {
  const header = JSON.stringify({ dsn: 'http://994ebcb62592da248c0fa74514c61fa7@localhost:9000/8' });
  const envelope = `${header}\n{"type":"event"}\n{"message":"ping"}\n`;

  const res = await fetch(`${baseUrl}/api/sentry-tunnel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-sentry-envelope' },
    body: envelope,
  });

  // Either forwarded (200) if local Sentry is running, or handled gracefully with 502 without crashing Express
  assert.ok(
    res.status === 200 || res.status === 502,
    `Expected 200 or 502, received ${res.status}`
  );
});
