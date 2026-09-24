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

test('INFRA: Dockerfile must not contain build-time secret ARGs', () => {
  const dockerfileContent = fs.readFileSync('./Dockerfile', 'utf8');
  assert.doesNotMatch(
    dockerfileContent,
    /ARG\s+INTERNAL_PROXY_KEY/i,
    'Dockerfile must not declare secret ARG INTERNAL_PROXY_KEY'
  );
  assert.doesNotMatch(
    dockerfileContent,
    /ENV\s+INTERNAL_PROXY_KEY/i,
    'Dockerfile must not bake secret into ENV in image layer'
  );
});

test('SECURITY: .env.example must not contain legacy Supabase keys or INTERNAL_PROXY_KEY', () => {
  const envExample = fs.readFileSync('./.env.example', 'utf8');
  assert.doesNotMatch(envExample, /INTERNAL_PROXY_KEY/i, '.env.example must not contain INTERNAL_PROXY_KEY');
  assert.doesNotMatch(envExample, /SUPABASE/i, '.env.example must not contain legacy Supabase keys');
});

test('SECURITY: package.json must not have active supabase dependencies', () => {
  const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
  const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
  assert.strictEqual(allDeps['@supabase/supabase-js'], undefined, 'Supabase client must not be a dependency');
});


