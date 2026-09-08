import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { stripTypeScriptTypes } from 'node:module';
import { createHash, webcrypto } from 'node:crypto';

// Execute the actual Edge handler with a fake database. No network/production calls.
const read = file => fs.readFileSync(new URL('../' + file, import.meta.url), 'utf8');
const source = read('supabase/functions/mastery-evidence/index.ts').replace(/^import .*;\r?\n/gm, '');
const policy = read('supabase/functions/institution-api/lesson-access-policy.js').replace(/export /g, '');
const A = { account_id: 'student-a', organization_id: 'org-a', role: 'student' };
const hash = value => createHash('sha256').update(value).digest('hex');
function harness() {
  const writes = [], rpcs = [], selections = [], tables = new Map(); let handler;
  const db = {
    rpc: async (name, args) => {
      rpcs.push({ name, args }); assert.equal(name, 'api_session_lookup');
      const account = args.p_token_hash === hash('valid-a') ? A : args.p_token_hash === hash('staff') ? { ...A, role: 'teacher' } : null;
      return { data: account ? [account] : [], error: null };
    },
    from: table => {
      const filters = [];
      const query = {
        select() { selections.push(table); return query; },
        eq(key, value) { filters.push(row => row[key] === value); return query; },
        in(key, values) { filters.push(row => values.includes(row[key])); return query; },
        order() { return query; }, limit() { return query; },
        then(resolve, reject) { return Promise.resolve({ data: (tables.get(table) || []).filter(row => filters.every(test => test(row))), error: null }).then(resolve, reject); },
        upsert(rows, options) { writes.push({ table, rows, options }); tables.set(table, rows); return Promise.resolve({ error: null }); },
      };
      return query;
    },
  };
  const context = vm.createContext({ createClient: () => db, Deno: { env: { get: () => '' }, serve: fn => { handler = fn; } }, Request, Response, URL, TextEncoder, crypto: webcrypto, console, Date });
  vm.runInContext(policy, context);
  vm.runInContext(stripTypeScriptTypes(source), context, { filename: 'mastery-evidence/index.ts' });
  const send = (body, token = 'valid-a') => handler(new Request('https://fixture.invalid/functions/v1/mastery-evidence/sync', { method: 'POST', headers: { ...(token ? { authorization: 'Bearer ' + token } : {}), 'content-type': 'application/json' }, body: JSON.stringify(body) }));
  return { writes, rpcs, selections, send };
}
const completion = { access_key: 'ap-calculus::0::1.7', course_key: 'AP Calculus AB', unit_index: 0, topic: '1.7', title: 'Selecting procedures', completed_at: '2026-09-08T08:30:00Z', account_id: 'forged-student', organization_id: 'forged-org' };
// Authentication and student-only authorization apply before any completion write.
for (const token of ['', 'invalid', 'staff']) {
  const h = harness(), res = await h.send({ lessons: [completion] }, token);
  assert.equal(res.status, 401); assert.equal(h.writes.length, 0);
  if (token) assert.equal(h.rpcs[0].args.p_token_hash, hash(token));
}
// Completion-only and client-mastery payloads must not create scored attempts/mastery.
{
  const h = harness(), res = await h.send({ lessons: [completion], mastery: [{ skill_key: 'client-score', score: 100 }], views: ['1.7'], reveals: ['q1'] });
  assert.equal(res.status, 200); const result = await res.json();
  assert.equal(result.sync_contract, 'echs-learning-sync-v1');
  assert.equal(result.authoritative, true); assert.equal(result.client_mastery_ignored, true);
  assert.equal(result.synced.lessons, 1); assert.equal(result.synced.attempts, 0); assert.equal(result.mastery.length, 0);
  assert.deepEqual(h.writes.map(write => write.table), ['lesson_completions']); assert.equal(h.selections.length, 0);
  const write = h.writes[0], row = write.rows[0];
  assert.equal(write.options.onConflict, 'account_id,access_key');
  assert.equal(row.account_id, A.account_id); assert.equal(row.organization_id, A.organization_id);
  assert.equal(row.course_key, 'ap-calculus'); assert.equal(row.completed_at, completion.completed_at);
}
// Views and reveals alone do not become completions or evidence.
{
  const h = harness(), res = await h.send({ views: ['1.7'], reveals: ['q1'], mastery: [{ score: 100 }] });
  assert.equal(res.status, 200); assert.equal(h.writes.length, 0);
}
// Invalid routes are omitted; valid aliases retain the existing completion contract.
{
  const h = harness(); const res = await h.send({ lessons: [
    { ...completion, access_key: 'ap-calculus::0::wrong' }, { ...completion, unit_index: -1 },
    { ...completion, unit_index: 0.5 }, { ...completion, topic: '' },
    { course: 'ap-calculus-ab', unit: 1, topic: '1.8', title: 'Squeeze theorem' },
  ] });
  assert.equal((await res.json()).synced.lessons, 1);
  assert.equal(h.writes[0].rows[0].access_key, 'ap-calculus::0::1.8');
}
// Raw evidence still reaches the unchanged server recomputation alongside completions.
{
  const h = harness(); const res = await h.send({
    attempts: [{ id: 'stable-event', questionId: 'q1', skill_key: 'APCALC.U1.TEST', correct: true, at: '2026-09-08T08:00:00Z' }],
    sessions: [{ id: 'stable-session', answered: 1, correct: 1 }], review: [{ questionId: 'q1' }], lessons: [completion],
    mastery: [{ skill_key: 'APCALC.U1.TEST', score: 100 }],
  });
  assert.equal(res.status, 200); const result = await res.json();
  for (const field of ['attempts', 'sessions', 'review', 'lessons']) assert.equal(result.synced[field], 1);
  const attempts = h.writes.find(write => write.table === 'learning_attempts');
  assert.equal(attempts.rows[0].client_event_id, 'stable-event'); assert.equal(attempts.options.ignoreDuplicates, true);
  const mastery = h.writes.find(write => write.table === 'mastery_records');
  assert.equal(mastery.rows[0].source, 'server'); assert.equal(mastery.rows[0].payload.algorithm, 'echs-mastery-2.0-foundation');
  assert.ok(mastery.rows[0].score < 100, 'Client mastery score is ignored');
}
console.log('Mastery sync endpoint: PASS (hashed-session authorization, completion identity/routes, no mastery from views, server recomputation)');
