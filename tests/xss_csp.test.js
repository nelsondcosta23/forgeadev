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

test('SECURITY: /build/:sessionId rejects malicious XSS payloads with 400', async () => {
  const xssPayload = encodeURIComponent('"><script>alert(1)</script>');
  const res = await fetch(`${baseUrl}/build/${xssPayload}`);
  assert.strictEqual(res.status, 400, 'Expected 400 Bad Request for XSS payload in sessionId');
  const body = await res.json();
  assert.match(body.error, /invalid session id/i);
});

test('SECURITY: /build/:sessionId rejects SQL/quote injection with 400', async () => {
  const injectionPayload = encodeURIComponent('abc" OR "1"="1');
  const res = await fetch(`${baseUrl}/build/${injectionPayload}`);
  assert.strictEqual(res.status, 400, 'Expected 400 Bad Request for injection payload in sessionId');
});

test('SECURITY: CSP header does not contain unsafe-eval', async () => {
  const res = await fetch(`${baseUrl}/`);
  const csp = res.headers.get('content-security-policy') || '';
  assert.ok(csp.length > 0, 'CSP header should be present');
  assert.doesNotMatch(csp, /'unsafe-eval'/, "CSP script-src must not contain 'unsafe-eval'");
});

test('SECURITY: /build/:sessionId with valid UUID format is accepted', async () => {
  const validUuid = '12345678-abcd-ef01-2345-6789abcdef01';
  const res = await fetch(`${baseUrl}/build/${validUuid}`);
  assert.notStrictEqual(res.status, 400, 'Valid UUID should not return 400 Bad Request');
});
