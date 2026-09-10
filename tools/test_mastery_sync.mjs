import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';

const read = file => fs.readFileSync(new URL('../' + file, import.meta.url), 'utf8');
const A = { id: '11111111-1111-4111-8111-111111111111', organization_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', role: 'student' };
const B = { id: '22222222-2222-4222-8222-222222222222', organization_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', role: 'student' };
const queueKey = account => 'echs_institution_pending_sync_v1:' + account.id;
const response = data => new Response(JSON.stringify(data), { headers: { 'content-type': 'application/json' } });
const deferred = () => { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; };
const turn = () => new Promise(resolve => setImmediate(resolve));
function storage() {
  const values = new Map();
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, String(value)), removeItem: key => values.delete(key) };
}
function harness({ engine = false, bridge = false } = {}) {
  const requests = [], events = [], timers = new Map(), docListeners = new Map(), winListeners = new Map();
  const add = (map, name, fn) => map.set(name, [...(map.get(name) || []), fn]);
  let timerId = 0;
  const state = { failSync: false, failMe: false, supportsCompletions: true, configGate: null, meGate: null, syncGate: null };
  const document = {
    currentScript: {}, readyState: 'loading', documentElement: { dataset: {} },
    body: { dataset: {}, classList: { contains: () => false } },
    querySelector: () => null, querySelectorAll: () => [],
    addEventListener: (name, fn) => add(docListeners, name, fn),
    dispatchEvent: event => { events.push(event); for (const fn of docListeners.get(event.type) || []) fn(event); },
  };
  const sandbox = {
    document, localStorage: storage(), sessionStorage: storage(), navigator: { onLine: true },
    location: { href: 'https://fixture.invalid/question-bank/student.html' },
    URL, Headers, FormData, Blob, AbortController, crypto: webcrypto,
    console: { log: console.log, warn() {}, error: console.error },
    setTimeout: (fn, delay) => { const id = ++timerId; timers.set(id, { fn, delay }); return id; },
    clearTimeout: id => timers.delete(id),
    CustomEvent: class { constructor(type, init = {}) { this.type = type; this.detail = init.detail; } },
    addEventListener: (name, fn) => add(winListeners, name, fn),
    fetch: async (url, options = {}) => {
      assert.equal(sandbox.navigator.onLine, true, 'Offline reload must not attempt network verification');
      if (String(url).endsWith('/institution.json')) {
        if (state.configGate) await state.configGate.promise;
        return response({ enabled: true, api_base: 'https://fixture.invalid/functions/v1' });
      }
      const auth = options.headers?.get('authorization');
      const request = { url: String(url), auth, body: options.body ? JSON.parse(options.body) : null, options };
      requests.push(request);
      if (String(url).endsWith('/me')) {
        if (state.failMe) throw new Error('Fixture verification failure');
        if (state.meGate) await state.meGate.promise;
        return response({ ok: true, account: { ...(auth === 'Bearer token-a' ? A : B), expires_at: '2099-01-01T00:00:00Z' } });
      }
      assert.ok(String(url).endsWith('/mastery-evidence/sync'), 'Every sync path must use authoritative recomputation');
      if (state.failSync) throw new Error('Fixture send failure');
      if (state.syncGate) await state.syncGate.promise;
      return response({ ok: true, authoritative: true, mastery: [], ...(state.supportsCompletions ? { sync_contract: 'echs-learning-sync-v1' } : {}) });
    },
  };
  sandbox.window = sandbox;
  const context = vm.createContext(sandbox);
  const load = file => { document.currentScript = { src: 'https://fixture.invalid/' + file }; vm.runInContext(read(file), context, { filename: file }); };
  const signIn = (account = A) => sandbox.ECHSInstitution.setSession({ account, token: account.id === A.id ? 'token-a' : 'token-b', expires_at: '2099-01-01T00:00:00Z' }, true);
  load('js/institution-client.js');
  const originalSync = sandbox.ECHSInstitution.syncLearning, originalFlush = sandbox.ECHSInstitution.flushPending;
  if (engine) load('question-bank/js/learning-system.js');
  if (bridge) load('js/institution-mastery-evidence.js');
  const seed = (suffix = '1') => {
    sandbox.localStorage.setItem('echs_learning_events_v2', JSON.stringify([{ id: 'event-' + suffix, questionId: 'q' + suffix, correct: true, course: 'ap-calculus', unit: '1', topic: '1.7', at: '2026-09-08T08:00:00Z' }]));
    sandbox.localStorage.setItem('echs_learning_sessions_v2', JSON.stringify([{ id: 'session-' + suffix, answered: 1, correct: 1, course: 'ap-calculus', unit: '1', topic: '1.7' }]));
    sandbox.localStorage.setItem('echs_learning_reviews_v2', JSON.stringify({ q: { questionId: 'q' + suffix, unresolved: false } }));
    sandbox.localStorage.setItem('echs_math_complete', JSON.stringify(['ap-calculus::0::1.7::Selecting procedures']));
  };
  return { sandbox, client: sandbox.ECHSInstitution, state, requests, events, signIn, seed, load, originalSync, originalFlush,
    syncs: () => requests.filter(r => r.url.endsWith('/sync')),
    pending: (account = A) => JSON.parse(sandbox.localStorage.getItem(queueKey(account))),
    bind: () => document.dispatchEvent(new sandbox.CustomEvent('DOMContentLoaded')),
    fire: (name, window = false) => { if (window) for (const fn of winListeners.get(name) || []) fn({ type: name }); else document.dispatchEvent(new sandbox.CustomEvent(name)); },
    runScheduled: async () => { for (const [id, timer] of [...timers]) if (timer.delay === 1200) { timers.delete(id); timer.fn(); } await turn(); },
    onlineListeners: () => (winListeners.get('online') || []).length,
  };
}

// Real learning engine exports a summary; sync must keep its raw arrays and completions.
{
  const h = harness({ engine: true, bridge: true }); h.signIn(); h.seed();
  assert.equal(h.client.syncLearning, h.originalSync);
  assert.equal(h.client.flushPending, h.originalFlush);
  assert.equal(h.sandbox.ECHSLearning.exportStudentReport().attempts, undefined);
  assert.equal(h.sandbox.ECHSMasteryEvidence.learningPayload().lessons.length, 1);
  await h.sandbox.ECHSMasteryEvidence.syncLearning();
  const sent = h.syncs()[0];
  assert.equal(sent.auth, 'Bearer token-a');
  for (const field of ['attempts', 'sessions', 'review', 'lessons']) assert.equal(sent.body[field].length, 1, field);
  assert.equal(sent.options.cache, 'no-store');
  assert.equal(Object.hasOwn(sent.options, 'sessionGuard'), false, 'Internal guard must not leak into fetch options');
  assert.equal(h.pending(), null);
  assert.equal(h.events.filter(e => e.type === 'echs:mastery-authority').length, 1);
  h.bind(); assert.equal(h.onlineListeners(), 1, 'Bridge must not register a second flush path');
  for (const [name, window] of [['echs:learning-updated', false], ['echs:learning-attempt', true], ['echs:learning-session', true], ['echs:lesson-completed', true]]) {
    const before = h.syncs().length; h.fire(name, window); await h.runScheduled();
    assert.equal(h.syncs().length, before + 1, name + ' must use the same canonical endpoint');
  }
}
// Offline reload queues before verification; another account cannot adopt it.
{
  const h = harness({ bridge: true }); h.signIn(); h.seed(); h.sandbox.navigator.onLine = false;
  assert.equal((await h.sandbox.ECHSMasteryEvidence.syncLearning()).queued, true);
  assert.equal(h.requests.length, 0); assert.equal(h.pending().accountId, A.id);
  h.signIn(B); h.sandbox.navigator.onLine = true; await h.sandbox.ECHSMasteryEvidence.flushPending();
  assert.equal(h.syncs().length, 0); assert.ok(h.pending());
  h.signIn(); await h.client.flushPending();
  assert.equal(h.syncs()[0].auth, 'Bearer token-a'); assert.equal(h.pending(), null);
}
// Neither old global queue is adopted or destroyed, including by the same signed-in account.
{
  const h = harness({ bridge: true }); h.signIn();
  for (const key of ['echs_institution_pending_sync_v1', 'echs_mastery_evidence_pending_v1']) h.sandbox.localStorage.setItem(key, JSON.stringify({ attempts: [{ id: 'unowned' }] }));
  await h.sandbox.ECHSMasteryEvidence.flushPending(); assert.equal(h.syncs().length, 0);
  for (const key of ['echs_institution_pending_sync_v1', 'echs_mastery_evidence_pending_v1']) assert.ok(h.sandbox.localStorage.getItem(key));
  h.sandbox.localStorage.setItem(queueKey(A), JSON.stringify({ accountId: B.id, payload: { attempts: [{ id: 'foreign' }] } }));
  await h.client.flushPending(); assert.equal(h.syncs().length, 0); assert.equal(h.pending().accountId, B.id);
}
// A verification request that completes after an account switch cannot dispatch the old payload.
for (const action of ['sync', 'flush']) {
  const h = harness(); h.signIn(); h.seed();
  if (action === 'flush') { h.sandbox.navigator.onLine = false; await h.client.syncLearning(); h.sandbox.navigator.onLine = true; }
  const gate = deferred(); h.state.meGate = gate;
  const pending = action === 'sync' ? h.client.syncLearning().catch(error => error) : h.client.flushPending();
  await turn(); h.signIn(B); gate.resolve(); await pending;
  assert.equal(h.syncs().length, 0, action + ' after account switch');
  assert.ok(h.pending()); assert.equal(h.client.account().id, B.id);
}
// The final dispatch guard runs after asynchronous configuration resolution, too.
{
  const h = harness(); h.signIn(); const gate = deferred(); h.state.configGate = gate;
  const request = h.client.api('mastery-evidence', '/sync', { method: 'POST', body: { attempts: [{ id: 'a-only' }] }, sessionGuard: { accountId: A.id, token: 'token-a' } });
  const rejected = assert.rejects(request, /session changed/);
  await turn(); h.signIn(B); gate.resolve(); await rejected;
  assert.equal(h.syncs().length, 0);
}
// Previously owned legacy envelopes still replay only to their declared account.
{
  const h = harness(); h.signIn();
  h.sandbox.localStorage.setItem('echs_institution_pending_sync_v1', JSON.stringify({ accountId: A.id, payload: { attempts: [{ id: 'owned-legacy' }] } }));
  await h.client.flushPending(); assert.equal(h.syncs()[0].body.attempts[0].id, 'owned-legacy');
  assert.equal(h.syncs()[0].auth, 'Bearer token-a'); assert.equal(h.sandbox.localStorage.getItem('echs_institution_pending_sync_v1'), null);
}
// Once dispatched, A's request keeps A's token. A late response cannot touch B or clear A's queue.
for (const action of ['sync', 'flush']) {
  const h = harness(); h.signIn(); h.seed();
  if (action === 'flush') { h.sandbox.navigator.onLine = false; await h.client.syncLearning(); h.sandbox.navigator.onLine = true; }
  const gate = deferred(); h.state.syncGate = gate;
  const pending = action === 'sync' ? h.client.syncLearning().catch(error => error) : h.client.flushPending();
  await turn(); assert.equal(h.syncs()[0].auth, 'Bearer token-a'); h.signIn(B);
  h.sandbox.localStorage.setItem(queueKey(B), JSON.stringify({ accountId: B.id, payload: { attempts: [{ id: 'b-owned' }] } }));
  gate.resolve(); await pending;
  assert.ok(h.pending()); assert.equal(h.pending(B).payload.attempts[0].id, 'b-owned');
  assert.equal(h.events.filter(e => e.type === 'echs:mastery-authority').length, 0);
}
// A newer snapshot survives the old response, preserving earlier queued rows by stable identity.
{
  const h = harness(); h.signIn(); h.seed(); const gate = deferred(); h.state.syncGate = gate;
  const sending = h.client.syncLearning(); await turn();
  h.sandbox.navigator.onLine = false; h.seed('2'); await h.client.syncLearning();
  assert.equal(h.pending().payload.attempts.length, 2); assert.equal(h.pending().payload.lessons.length, 1);
  gate.resolve(); await sending; assert.equal(h.pending().payload.attempts.length, 2);
  h.sandbox.navigator.onLine = true; h.state.syncGate = null; await h.client.flushPending();
  assert.equal(h.syncs().at(-1).body.attempts.length, 2); assert.equal(h.pending(), null);
}
// Online verification/send failures retain the owned snapshot for a later retry.
for (const failure of ['failMe', 'failSync']) {
  const h = harness(); h.signIn(); h.seed(); h.state[failure] = true;
  await assert.rejects(h.client.syncLearning(), /Could not connect/); assert.equal(h.pending().payload.lessons.length, 1);
  h.state[failure] = false; await h.client.flushPending(); assert.equal(h.pending(), null);
  assert.equal(h.syncs().at(-1).body.attempts[0].id, 'event-1');
}
// A newer Pages client may reach the older endpoint during deployment. Never lose completions.
{
  const h = harness(); h.signIn(); h.seed(); h.state.supportsCompletions = false;
  const result = await h.client.syncLearning();
  assert.equal(result.queued, true); assert.equal(result.reason, 'completion_sync_unavailable');
  assert.equal(h.pending().payload.lessons.length, 1);
  assert.equal(h.events.filter(e => e.type === 'echs:mastery-authority').length, 0);
  h.state.supportsCompletions = true; const retry = await h.client.flushPending();
  assert.equal(retry.sync_contract, 'echs-learning-sync-v1'); assert.equal(h.pending(), null);
  assert.equal(h.syncs().length, 2); assert.equal(h.syncs()[1].body.attempts[0].id, 'event-1');
  assert.equal(h.syncs()[1].body.lessons[0].access_key, 'ap-calculus::0::1.7');
}
// Expired/non-student sessions never create a queue.
{
  const h = harness(); h.signIn({ ...A, id: '33333333-3333-4333-8333-333333333333', role: 'teacher' }); h.seed();
  assert.equal((await h.client.syncLearning()).skipped, true); assert.equal(h.syncs().length, 0);
  h.signIn(); h.sandbox.localStorage.setItem('echs_institution_expires_v1', 'invalid');
  assert.equal((await h.client.syncLearning()).skipped, true); assert.equal(h.pending(), null);
}
console.log('Mastery sync: PASS (raw engine/bridge/event payloads, owned queues, account races, retries, completions)');
