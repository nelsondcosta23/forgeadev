import test from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import { app, securityAuditLog } from '../server.js';

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

test('AUDIT: securityAuditLog helper constructs valid structured JSON log record', () => {
  const originalWarn = console.warn;
  let loggedOutput = '';
  console.warn = (msg) => {
    loggedOutput = msg;
  };

  try {
    const entry = securityAuditLog('TEST_EVENT', {
      ip: '127.0.0.1',
      method: 'POST',
      endpoint: '/api/admin/login',
      status: 401,
      details: { reason: 'bad credentials' },
    });

    assert.strictEqual(entry.eventType, 'TEST_EVENT');
    assert.strictEqual(entry.ip, '127.0.0.1');
    assert.strictEqual(entry.method, 'POST');
    assert.strictEqual(entry.endpoint, '/api/admin/login');
    assert.strictEqual(entry.status, 401);
    assert.strictEqual(entry.level, 'SECURITY_AUDIT');
    assert.ok(entry.timestamp, 'timestamp must be present');
    assert.ok(loggedOutput.startsWith('[SECURITY AUDIT]'), 'Log prefix must be [SECURITY AUDIT]');
  } finally {
    console.warn = originalWarn;
  }
});

test('AUDIT: Unauthenticated admin endpoint access emits security audit log', async () => {
  const originalWarn = console.warn;
  const captured = [];
  console.warn = (...args) => {
    captured.push(args.join(' '));
  };

  try {
    const res = await fetch(`${baseUrl}/api/admin/verify`);
    assert.strictEqual(res.status, 401);

    const auditFound = captured.some(log => log.includes('ADMIN_AUTH_FAILURE') && log.includes('[SECURITY AUDIT]'));
    assert.ok(auditFound, 'Expected ADMIN_AUTH_FAILURE security audit log entry');
  } finally {
    console.warn = originalWarn;
  }
});

test('AUDIT: Access to non-whitelisted collection emits FORBIDDEN_COLLECTION_ACCESS audit log', async () => {
  const originalWarn = console.warn;
  const captured = [];
  console.warn = (...args) => {
    captured.push(args.join(' '));
  };

  try {
    const res = await fetch(`${baseUrl}/api/pb/forbidden_secrets`);
    assert.strictEqual(res.status, 403);

    const auditFound = captured.some(log => log.includes('FORBIDDEN_COLLECTION_ACCESS') && log.includes('forbidden_secrets'));
    assert.ok(auditFound, 'Expected FORBIDDEN_COLLECTION_ACCESS security audit log entry');
  } finally {
    console.warn = originalWarn;
  }
});

test('AUDIT: Failed admin login emits ADMIN_LOGIN_FAILURE audit log', async () => {
  const originalWarn = console.warn;
  const captured = [];
  console.warn = (...args) => {
    captured.push(args.join(' '));
  };

  try {
    const res = await fetch(`${baseUrl}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'attacker@evil.com' }) // missing password
    });
    assert.strictEqual(res.status, 400);

    const auditFound = captured.some(log => log.includes('ADMIN_LOGIN_FAILURE'));
    assert.ok(auditFound, 'Expected ADMIN_LOGIN_FAILURE security audit log entry');
  } finally {
    console.warn = originalWarn;
  }
});
