import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {stripTypeScriptTypes} from 'node:module';
import {createHash, webcrypto} from 'node:crypto';

// Execute the actual handler with a closed, data-free capability RPC fixture.
// No test connects to Supabase, retrieves a real session or reads a bank row.
const sourcePath = new URL('../supabase/functions/private-bank-api/index.ts', import.meta.url);
const source = fs.readFileSync(sourcePath, 'utf8');
const cap = {contract: 'echs.private-bank.snapshot-store.v1', schema_version: 1,
  immutable_ready: true, student_delivery: false, max_record_bytes: 65536,
  max_object_bytes: 16777216, max_snapshot_bytes: 268435456};
const unavailable = {ok: false, error: {code: 'archive_unavailable', message: 'Private archive capability is unavailable'}};
const clone = value => value === undefined ? undefined : JSON.parse(JSON.stringify(value));
function harness({data = cap, error = null, throws = false} = {}) {
  let handler;
  const calls = [], logs = [], reads = [];
  const db = {
    async rpc(name, args) {
      calls.push({name, args: clone(args)});
      assert.equal(name, 'private_bank_snapshot_capabilities');
      assert.deepEqual(clone(args), {});
      if (throws) throw new Error('PRIVATE_STORAGE_OR_DATABASE_CANARY');
      return {data: clone(data), error};
    },
    from(table) { reads.push(table); throw new Error('No data table read is allowed'); },
  };
  const context = vm.createContext({createClient: () => db,
    Deno: {env: {get: name => name === 'ALLOWED_ORIGINS' ? 'https://2ed944-cloud.github.io' : ''}, serve: fn => handler = fn},
    Request, Response, URL, TextEncoder, crypto: webcrypto,
    console: {error: (...args) => logs.push(args)}});
  const executable = source.replace(/^import\s[\s\S]*?;\r?\n/gm, '');
  vm.runInContext(stripTypeScriptTypes(executable), context, {filename: 'actual/private-bank-api/index.ts'});
  const send = (route = '/health/snapshots', method = 'GET') => handler(new Request(
    'https://fixture.invalid/functions/v1/private-bank-api' + route,
    {method, headers: {origin: 'https://2ed944-cloud.github.io'}}));
  return {send, calls, logs, reads};
}
function privateHeaders(response) {
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(response.headers.get('access-control-allow-origin'), 'https://2ed944-cloud.github.io');
  assert.match(response.headers.get('content-type'), /^application\/json;/);
  assert.equal(response.headers.get('vary'), 'Origin');
}
const checks = [];
async function check(label, fn) { await fn(); checks.push(label); console.log('PASS ' + label); }
await check('Exact data-free capability is returned only after the service-only capability RPC succeeds', async () => {
  const h = harness(), response = await h.send();
  assert.equal(response.status, 200); privateHeaders(response);
  assert.deepEqual(await response.json(), {ok: true, service: 'echs-private-bank-api', archive_capabilities: cap});
  assert.deepEqual(h.calls, [{name: 'private_bank_snapshot_capabilities', args: {}}]);
  assert.deepEqual(h.reads, []); assert.deepEqual(h.logs, []);
});
await check('Missing, incompatible, extra-field and wrong-type capability values fail closed without echoing input', async () => {
  const invalid = [null, false, 0, 'PRIVATE_CAPABILITY_CANARY', [], [cap], {},
    {...cap, student_delivery: true}, {...cap, student_delivery: 0}, {...cap, immutable_ready: 1},
    {...cap, schema_version: '1'}, {...cap, schema_version: 2}, {...cap, max_record_bytes: '65536'},
    {...cap, contract: 'future'}, {...cap, private_payload: 'PRIVATE_CAPABILITY_CANARY'}];
  for (const key of Object.keys(cap)) { const missing = {...cap}; delete missing[key]; invalid.push(missing); }
  for (const data of invalid) {
    const h = harness({data}), response = await h.send();
    assert.equal(response.status, 503); privateHeaders(response);
    assert.deepEqual(await response.json(), unavailable);
    assert.equal(h.calls.length, 1); assert.deepEqual(h.reads, []); assert.deepEqual(h.logs, []);
  }
});
await check('SQL errors and transport exceptions are generic503 with no private error payload or log', async () => {
  for (const options of [{error: {message: 'PRIVATE_SQL_CANARY', details: 'PRIVATE_DETAILS'}}, {throws: true}]) {
    const h = harness(options), response = await h.send();
    assert.equal(response.status, 503); privateHeaders(response);
    assert.deepEqual(await response.json(), unavailable); assert.deepEqual(h.logs, []); assert.deepEqual(h.reads, []);
  }
});
await check('Existing health and preflight response contracts do not call the database', async () => {
  const h = harness(), response = await h.send('/health');
  assert.equal(response.status, 200); privateHeaders(response);
  assert.deepEqual(await response.json(), {ok: true, service: 'echs-private-bank-api', version: '1.5.0-specific-bank-delete'});
  const preflight = await h.send('/health/snapshots', 'OPTIONS');
  assert.equal(preflight.status, 204); assert.equal(await preflight.text(), '');
  assert.equal(preflight.headers.get('cache-control'), 'no-store'); assert.deepEqual(h.calls, []);
});
await check('Other methods and existing private reads retain anonymous denial before any data RPC', async () => {
  for (const [route, method] of [['/health/snapshots', 'POST'], ['/health/snapshots', 'DELETE'],
    ['/health/snapshots/', 'GET'], ['/student-questions', 'GET'], ['/packages', 'GET'], ['/media-url', 'GET']]) {
    const h = harness(), response = await h.send(route, method);
    assert.equal(response.status, 403); privateHeaders(response);
    assert.deepEqual(await response.json(), {ok: false, error: {code: 'forbidden', message: 'Student, teacher, or administrator sign-in is required'}});
    assert.deepEqual(h.calls, []); assert.deepEqual(h.reads, []);
  }
});
const out = new URL('../reports/private-snapshot-health.json', import.meta.url);
fs.mkdirSync(new URL('../reports/', import.meta.url), {recursive: true});
fs.writeFileSync(out, JSON.stringify({contract: 'echs.private-snapshot-health-test.v1', status: 'PASS',
  production_calls: 0, source_sha256: createHash('sha256').update(source).digest('hex'), checks}, null, 2) + '\n');
console.log(`Private archive health: ${checks.length} groups PASS; no production calls.`);
