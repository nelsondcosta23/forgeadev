import test from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
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

test('SECURITY: /api/geo returns default safe country info without external third-party requests', async () => {
  const res = await fetch(`${baseUrl}/api/geo`);
  assert.strictEqual(res.status, 200, 'Expected 200 OK from /api/geo');
  const data = await res.json();
  assert.strictEqual(data.country_code, 'PT');
  assert.strictEqual(data.country_name, 'Portugal');
  assert.strictEqual(data.currency, 'EUR');
  assert.strictEqual(data.symbol, '€');
});

test('SECURITY: /api/geo respects CF-IPCountry header when present and valid', async () => {
  const res = await fetch(`${baseUrl}/api/geo`, {
    headers: { 'CF-IPCountry': 'US' }
  });
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.strictEqual(data.country_code, 'US');
  assert.strictEqual(data.country_name, 'United States');
  assert.strictEqual(data.currency, 'USD');
});

test('SECURITY: /api/geo safely sanitizes invalid or spoofed country header values', async () => {
  const res = await fetch(`${baseUrl}/api/geo`, {
    headers: { 'CF-IPCountry': 'INVALID_TOOLONG' }
  });
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.strictEqual(data.country_code, 'PT', 'Must fallback to default PT on invalid header');
});

test('SECURITY: useAnalytics does NOT make client-side calls to ipapi.co', () => {
  const fileContent = fs.readFileSync(path.resolve('src/hooks/useAnalytics.ts'), 'utf-8');
  assert.doesNotMatch(fileContent, /ipapi\.co/, 'useAnalytics.ts must not call ipapi.co');
  assert.match(fileContent, /\/api\/geo/, 'useAnalytics.ts must call internal /api/geo');
});
