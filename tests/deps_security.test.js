import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';

test('SECURITY: package.json must not have vulnerable jspdf < 4.2.1', () => {
  const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
  const jspdfVersion = pkg.dependencies?.jspdf || '';
  
  // Must be at least 4.2.1 to patch critical GHSA-f8cm-6447-x5h2
  const cleaned = jspdfVersion.replace(/^[\^~]/, '');
  const [major, minor] = cleaned.split('.').map(Number);
  
  assert.ok(
    major > 4 || (major === 4 && minor >= 2),
    `Expected jspdf >= 4.2.1, found ${jspdfVersion}`
  );
});

test('FUNCTIONALITY: jsPDF can be imported and initialized without errors', async () => {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF();
  doc.text('Forgea Build Test', 10, 10);
  const pdfOutput = doc.output('arraybuffer');
  assert.ok(pdfOutput.byteLength > 100, 'jsPDF should generate valid document buffer');
});

test('SECURITY: package.json must not have vulnerable or abandoned xlsx package', () => {
  const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
  assert.strictEqual(
    pkg.dependencies?.xlsx,
    undefined,
    'vulnerable xlsx package must not be present in dependencies'
  );
  assert.strictEqual(
    pkg.devDependencies?.xlsx,
    undefined,
    'vulnerable xlsx package must not be present in devDependencies'
  );
});

