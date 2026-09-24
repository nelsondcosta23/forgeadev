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

test('SECURITY: /api/results/:sessionId rejects PocketBase filter injection with 400', async () => {
  const injectionPayload = encodeURIComponent('" || 1=1 || "');
  const res = await fetch(`${baseUrl}/api/results/${injectionPayload}`);
  assert.strictEqual(res.status, 400, 'Expected 400 Bad Request for filter injection in sessionId');
  const body = await res.json();
  assert.match(body.error, /invalid session id/i);
});

test('SECURITY: /api/results/:sessionId rejects invalid length sessionId with 400', async () => {
  const res = await fetch(`${baseUrl}/api/results/short`);
  assert.strictEqual(res.status, 400, 'Expected 400 Bad Request for too short sessionId');
});

test('SECURITY: /api/quiz/analyze rejects empty body with 400 and validation details', async () => {
  const res = await fetch(`${baseUrl}/api/quiz/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  assert.strictEqual(res.status, 400);
  const body = await res.json();
  assert.strictEqual(body.error, 'Invalid request payload');
  assert.ok(body.details, 'Response should contain Zod validation details');
});

test('SECURITY: /api/quiz/analyze rejects filter injection in sessionId with 400', async () => {
  const res = await fetch(`${baseUrl}/api/quiz/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: '"; 1=1 --',
      answers: { country: 'PT' },
      questions: [{ id: 'q1', question: 'Usage?' }],
    }),
  });
  assert.strictEqual(res.status, 400);
  const body = await res.json();
  assert.strictEqual(body.error, 'Invalid request payload');
});

test('SECURITY: /api/quiz/analyze rejects empty questions array with 400', async () => {
  const res = await fetch(`${baseUrl}/api/quiz/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: '12345678-1234-1234-1234-123456789012',
      answers: { country: 'PT' },
      questions: [],
    }),
  });
  assert.strictEqual(res.status, 400);
  const body = await res.json();
  assert.strictEqual(body.error, 'Invalid request payload');
});

test('SECURITY: /api/quiz/analyze rejects PocketBase filter injection in answers.country with 400', async () => {
  const res = await fetch(`${baseUrl}/api/quiz/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: '12345678-1234-1234-1234-123456789012',
      answers: { country: 'PT" || 1=1 || country_code="' },
      questions: [{ id: 'q1', question: 'Usage?' }],
    }),
  });
  assert.strictEqual(res.status, 400, 'Expected 400 for filter injection in country');
  const body = await res.json();
  assert.strictEqual(body.error, 'Invalid request payload');
  assert.ok(JSON.stringify(body.details).toLowerCase().includes('country'));
});

test('SECURITY: /api/quiz/analyze rejects non-ISO country code in answers.country with 400', async () => {
  const res = await fetch(`${baseUrl}/api/quiz/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: '12345678-1234-1234-1234-123456789012',
      answers: { country: 'INVALID_LONG_CODE' },
      questions: [{ id: 'q1', question: 'Usage?' }],
    }),
  });
  assert.strictEqual(res.status, 400, 'Expected 400 for non-ISO country code');
  const body = await res.json();
  assert.strictEqual(body.error, 'Invalid request payload');
  assert.ok(JSON.stringify(body.details).toLowerCase().includes('country'));
});

test('SECURITY: /api/analytics/track rejects payload missing event_type with 400', async () => {
  const res = await fetch(`${baseUrl}/api/analytics/track`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ page_path: '/quiz' }),
  });
  assert.strictEqual(res.status, 400);
  const body = await res.json();
  assert.match(body.error, /invalid analytics/i);
});

test('SECURITY: /api/analytics/track rejects unexpected injected fields with 400 (strict schema)', async () => {
  const res = await fetch(`${baseUrl}/api/analytics/track`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event_type: 'click',
      injected_admin_field: 'malicious',
      isAdmin: true,
    }),
  });
  assert.strictEqual(res.status, 400);
  const body = await res.json();
  assert.match(body.error, /invalid analytics/i);
});


