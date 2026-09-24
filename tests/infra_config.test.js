import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';

test('INFRA: docker-compose.yml must not expose pocketbase port or coolify label', () => {
  const composeContent = fs.readFileSync('./docker-compose.yml', 'utf8');
  
  // Extract pb service definition
  const pbSectionMatch = composeContent.match(/pb:\s*([\s\S]*?)(volumes:|$)/);
  assert.ok(pbSectionMatch, 'pb service must be defined in docker-compose.yml');
  
  const pbConfig = pbSectionMatch[1];
  assert.doesNotMatch(
    pbConfig,
    /coolify\.port=8090/,
    'pb service must not declare coolify.port=8090 (should only be internal)'
  );
  assert.doesNotMatch(
    pbConfig,
    /ports:\s*-\s*["']?8090/,
    'pb service must not bind port 8090 to host'
  );
});
