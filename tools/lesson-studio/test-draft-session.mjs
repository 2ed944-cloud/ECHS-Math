import test from 'node:test';
import assert from 'node:assert/strict';
import { createLessonDraft, addSlide, renameSlide } from '../../js/lesson-studio/draft-model.mjs';
import { createDraftSession, assertDraftCheckpoint } from '../../js/lesson-studio/draft-session.mjs';

const clone = value => JSON.parse(JSON.stringify(value));
const tick = () => new Promise(resolve => setImmediate(resolve));
const deferred = () => { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; };
const error = (status, code = '') => Object.assign(new Error('Fixture response'), { status, code });
const headId = number => `40000000-0000-4000-8000-${String(number).padStart(12, '0')}`;
function initialRecord() {
  const document = createLessonDraft({ lessonId: 'b27b9a11-b5a2-4c56-8393-21ad0e01c901', courseVersionId: 'c7109cf8-abb4-5541-b431-c2ef17f6dffb',
    catalog: { unit_id: 'legacy:ap-calculus:unit:1', topic_id: 'legacy:ap-calculus:topic:1.7' }, title: 'Original fixture',
    objective: 'Explain the selected example.', skill: 'teacher:reason', summary: 'Draft autosave fixture.' });
  return { ok: true, contract: 'echs.lesson.store.v1', lesson: { id: document.lesson_id, organization_id: '10000000-0000-4000-8000-000000000001',
    class_id: '20000000-0000-4000-8000-000000000001', course_version_id: document.course_version_id, access_key: 'ap-calculus::0::1.7',
    route_path: 'lessons/ap-calculus/unit-1/1-7-selecting-limit-procedures.html', unit_id: document.unit_id, topic_id: document.topic_id,
    slug: document.slug, head_revision: 1, head_version_id: headId(1), workflow_state: 'draft' },
    head: { id: headId(1), lesson_id: document.lesson_id, version_number: 1, document, private_notes: 'Private initial notes' }, versions: [], reviews: [], publications: [] };
}
function fakeTimers() {
  let id = 0; const tasks = new Map();
  return { setTimeout(callback) { tasks.set(++id, callback); return id; }, clearTimeout(key) { tasks.delete(key); },
    count: () => tasks.size, async run() { const callbacks = [...tasks.values()]; tasks.clear(); callbacks.forEach(fn => fn()); await tick(); } };
}
function fixture(options = {}) {
  let remote = initialRecord(), active = true;
  const calls = [], changes = [], timers = fakeTimers();
  function commit(payload) {
    if (payload.expected_revision !== remote.lesson.head_revision) throw error(409, 'revision_conflict');
    const number = remote.lesson.head_revision + 1, doc = clone(payload.document); doc.document_version = number; doc.publication.revision = number;
    remote = { ...clone(remote), lesson: { ...remote.lesson, head_revision: number, head_version_id: headId(number), workflow_state: 'draft' },
      head: { ...remote.head, id: headId(number), version_number: number, document: doc, private_notes: payload.private_notes } };
    return clone(remote);
  }
  const client = { assertCurrent() { if (!active) throw error(401, 'session_changed'); return { id: 'teacher' }; },
    async save(id, payload) { calls.push({ action: 'save', id, payload: clone(payload) }); return options.save ? options.save(payload, commit) : commit(payload); },
    async get(id) { calls.push({ action: 'get', id }); return options.get ? options.get(() => clone(remote)) : clone(remote); } };
  const session = createDraftSession({ client, record: remote, timers, onChange: value => changes.push(value), ...options.session });
  return { session, client, calls, changes, timers, commit, remote: () => clone(remote), revoke: () => { active = false; } };
}
function rename(session, title) { const doc = session.snapshot().document; session.editDocument(renameSlide(doc, doc.slides[0].id, title)); }

test('snapshots are defensive and unchanged input never creates a save', async () => {
  const f = fixture(), snapshot = f.session.snapshot(); snapshot.document.title = 'Outside mutation'; snapshot.record.head.private_notes = 'Outside notes';
  assert.equal(f.session.snapshot().document.title, 'Original fixture'); assert.equal(f.session.snapshot().privateNotes, 'Private initial notes');
  f.session.editDocument(f.session.snapshot().document); await f.session.flush(); assert.equal(f.calls.length, 0); assert.equal(f.session.snapshot().status, 'saved');
});

test('debounce coalesces document and private-note edits into one current-revision save', async () => {
  const f = fixture(); rename(f.session, 'First edit'); rename(f.session, 'Last edit'); f.session.editNotes('New private notes');
  assert.equal(f.timers.count(), 1); assert.equal(f.session.snapshot().status, 'editing'); await f.timers.run();
  assert.equal(f.calls.length, 1); assert.equal(f.calls[0].payload.expected_revision, 1);
  assert.equal(f.calls[0].payload.document.slides[0].title, 'Last edit'); assert.equal(f.calls[0].payload.private_notes, 'New private notes');
  assert.equal(f.session.snapshot().status, 'saved'); assert.equal(f.session.snapshot().dirty, false); assert.equal(f.session.snapshot().document.document_version, 2);
});

test('PostgreSQL-style object key reordering is an equivalent save acknowledgement', async () => {
  function reorder(value) { if (Array.isArray(value)) return value.map(reorder); if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).reverse().map(key => [key, reorder(value[key])])); return value; }
  const f = fixture({ save: (payload, commit) => reorder(commit(payload)) });
  f.session.editDocument(addSlide(f.session.snapshot().document, { title: 'New content' })); await f.session.flush();
  assert.equal(f.session.snapshot().status, 'saved'); assert.equal(f.calls.length, 1);
});

test('edits during an in-flight save are preserved, serialized and rebased onto its acknowledged revision', async () => {
  const pending = deferred(); let number = 0;
  const f = fixture({ save: async (payload, commit) => { if (++number === 1) await pending.promise; return commit(payload); } });
  rename(f.session, 'Sent first'); const saving = f.session.flush(); await tick();
  rename(f.session, 'Edited during request'); f.session.editNotes('Notes during request');
  const alsoFlush = f.session.flush(); assert.equal(f.calls.length, 1); pending.resolve(); await Promise.all([saving, alsoFlush]);
  assert.equal(f.calls.filter(x => x.action === 'save').length, 2);
  assert.equal(f.calls[1].payload.expected_revision, 2); assert.equal(f.calls[1].payload.document.document_version, 2);
  assert.equal(f.remote().head.document.slides[0].title, 'Edited during request'); assert.equal(f.remote().head.private_notes, 'Notes during request');
  assert.equal(f.session.snapshot().status, 'saved'); assert.equal(f.session.snapshot().document.document_version, 3);
});

test('reverting local edits during a request writes the intended reversion after the first commit', async () => {
  const pending = deferred(); let number = 0;
  const f = fixture({ save: async (payload, commit) => { if (++number === 1) await pending.promise; return commit(payload); } });
  const original = f.session.snapshot().document; rename(f.session, 'Temporary'); const saving = f.session.flush(); await tick();
  f.session.editDocument(original); pending.resolve(); await saving;
  assert.equal(f.remote().head.document.slides[0].title, original.slides[0].title); assert.equal(f.calls.length, 2);
});

test('revision conflict preserves unsaved content and requires explicit discard/reload', async () => {
  const f = fixture(); const other = f.remote(); other.head.document.slides[0].title = 'Colleague revision';
  f.commit({ expected_revision: 1, document: other.head.document, private_notes: 'Colleague notes' });
  rename(f.session, 'My retained draft'); await f.session.flush(); assert.equal(f.session.snapshot().status, 'conflict');
  assert.equal(f.session.snapshot().document.slides[0].title, 'My retained draft');
  rename(f.session, 'More retained work'); await f.timers.run(); await f.session.retry();
  assert.equal(f.calls.filter(x => x.action === 'save').length, 1); assert.equal(f.session.snapshot().status, 'conflict');
  await f.session.discardAndReload(); assert.equal(f.session.snapshot().document.slides[0].title, 'Colleague revision');
  assert.equal(f.session.snapshot().status, 'saved'); assert.equal(f.session.snapshot().dirty, false);
});

test('unknown network result pauses autosave and retries only after confirming no server commit', async () => {
  let first = true;
  const f = fixture({ save: (payload, commit) => { if (first) { first = false; throw new TypeError('Network failed'); } return commit(payload); } });
  rename(f.session, 'Preserved offline draft'); await f.session.flush(); assert.equal(f.session.snapshot().status, 'offline');
  rename(f.session, 'Latest offline draft'); await f.timers.run(); await f.session.flush(); assert.equal(f.calls.length, 1);
  await f.session.retry(); assert.deepEqual(f.calls.map(x => x.action), ['save', 'get', 'save']);
  assert.equal(f.remote().head.document.slides[0].title, 'Latest offline draft'); assert.equal(f.session.snapshot().status, 'saved');
});

test('lost acknowledgement is recognized without a duplicate save', async () => {
  const f = fixture({ save: (payload, commit) => { commit(payload); throw error(503); } });
  rename(f.session, 'Committed before disconnect'); await f.session.flush(); await f.session.retry();
  assert.deepEqual(f.calls.map(x => x.action), ['save', 'get']); assert.equal(f.session.snapshot().status, 'saved');
  assert.equal(f.session.snapshot().record.lesson.head_revision, 2);
});

test('lost acknowledgement with newer local edits reconciles before saving the remaining changes', async () => {
  const pending = deferred(); let number = 0;
  const f = fixture({ save: async (payload, commit) => { const saved = commit(payload); if (++number === 1) { await pending.promise; throw error(502); } return saved; } });
  rename(f.session, 'First committed'); const saving = f.session.flush(); await tick(); rename(f.session, 'Second retained'); pending.resolve(); await saving;
  await f.session.retry(); assert.deepEqual(f.calls.map(x => x.action), ['save', 'get', 'save']);
  assert.equal(f.calls[2].payload.expected_revision, 2); assert.equal(f.remote().head.document.slides[0].title, 'Second retained');
});

test('reconciliation never overwrites a different server revision after an uncertain write', async () => {
  const f = fixture({ save: () => { throw error(503); } }); rename(f.session, 'Local draft'); await f.session.flush();
  const remote = f.remote(); remote.head.document.slides[0].title = 'Different author'; f.commit({ expected_revision: 1, document: remote.head.document, private_notes: 'Different notes' });
  await f.session.retry(); assert.equal(f.session.snapshot().status, 'conflict'); assert.equal(f.session.snapshot().document.slides[0].title, 'Local draft');
  assert.deepEqual(f.calls.map(x => x.action), ['save', 'get']);
});

test('repeated retry requests share one reconciliation and preserve edits made while its GET waits', async () => {
  const pending = deferred(); let first = true;
  const f = fixture({ save: (payload, commit) => { if (first) { first = false; throw error(503); } return commit(payload); }, get: async read => { await pending.promise; return read(); } });
  rename(f.session, 'Offline'); await f.session.flush(); const one = f.session.retry(), two = f.session.retry(); await tick();
  assert.equal(f.calls.filter(x => x.action === 'get').length, 1); rename(f.session, 'Edited during reconciliation'); pending.resolve(); await Promise.all([one, two]);
  assert.deepEqual(f.calls.map(x => x.action), ['save', 'get', 'save']); assert.equal(f.remote().head.document.slides[0].title, 'Edited during reconciliation');
});

test('a reload never silently discards edits made after the reload request began', async () => {
  const pending = deferred(); const f = fixture({ get: async read => { await pending.promise; return read(); } });
  rename(f.session, 'Old unsaved'); const reloading = f.session.discardAndReload(); await tick(); rename(f.session, 'New work during reload');
  pending.resolve(); await reloading; assert.equal(f.session.snapshot().status, 'conflict'); assert.equal(f.session.snapshot().error.code, 'edited_during_reload');
  assert.equal(f.session.snapshot().document.slides[0].title, 'New work during reload'); assert.equal(f.calls.filter(x => x.action === 'save').length, 0);
});

test('malformed local documents and immutable identity edits never reach save', async () => {
  const f = fixture(), doc = f.session.snapshot().document; doc.course_version_id = '41495438-31bb-54ad-a8e3-02a17c5e0d39';
  assert.throws(() => f.session.editDocument(doc)); assert.equal(f.session.snapshot().status, 'invalid'); await f.session.flush();
  assert.throws(() => f.session.editNotes('a'.repeat(20001))); assert.throws(() => f.session.editNotes('bad\0notes'));
  assert.equal(f.calls.length, 0); assert.equal(f.session.snapshot().record.head.private_notes, 'Private initial notes');
  rename(f.session, 'Corrected valid draft'); await f.session.flush(); assert.equal(f.session.snapshot().status, 'saved');
});

test('server validation failure preserves local data and pauses until corrected', async () => {
  let reject = true; const f = fixture({ save: (payload, commit) => { if (reject) throw error(422); return commit(payload); } });
  rename(f.session, 'Rejected draft'); await f.session.flush(); assert.equal(f.session.snapshot().status, 'invalid');
  await f.timers.run(); assert.equal(f.calls.length, 1); reject = false; rename(f.session, 'Corrected draft'); await f.session.flush();
  assert.equal(f.session.snapshot().status, 'saved');
});

test('client-side canonical rejection is invalid without claiming an uncertain network write', async () => {
  let reject = true;
  const f = fixture({ save: (payload, commit) => { if (reject) throw error(0, 'invalid_request'); return commit(payload); } });
  rename(f.session, 'Local client rejects'); await f.session.flush();
  assert.equal(f.session.snapshot().status, 'invalid'); await f.timers.run();
  assert.deepEqual(f.calls.map(call => call.action), ['save']);
  reject = false; rename(f.session, 'Corrected content'); await f.session.flush();
  assert.deepEqual(f.calls.map(call => call.action), ['save', 'save']); assert.equal(f.session.snapshot().status, 'saved');
});

test('invalid acknowledgement is treated as uncertain and cannot overwrite a server response', async () => {
  const f = fixture({ save: (payload, commit) => { const result = commit(payload); result.head.document.slides[0].title = 'Unexpected response'; return result; } });
  rename(f.session, 'Expected content'); await f.session.flush(); assert.equal(f.session.snapshot().status, 'offline');
  assert.equal(f.session.snapshot().document.slides[0].title, 'Expected content'); await f.session.retry();
  assert.equal(f.session.snapshot().status, 'saved'); assert.deepEqual(f.calls.map(x => x.action), ['save', 'get']);
});

test('401/403 and changed session scope clear sensitive state and ignore late acknowledgements', async () => {
  for (const status of [401, 403]) {
    const f = fixture({ save: () => { throw error(status); } }); rename(f.session, 'Private work'); await f.session.flush();
    assert.equal(f.session.snapshot().document, null); assert.equal(f.session.snapshot().privateNotes, ''); assert.equal(f.session.snapshot().record, null);
  }
  const pending = deferred(); const f = fixture({ save: async (payload, commit) => { await pending.promise; return commit(payload); } });
  rename(f.session, 'Account A draft'); const saving = f.session.flush(); await tick(); f.revoke(); pending.resolve(); await saving;
  assert.equal(f.session.snapshot().document, null); assert.equal(f.calls.length, 1); assert.throws(() => f.session.editNotes('Successor account data'));
});

test('reading a snapshot after an account switch clears data immediately without another write', () => {
  const f = fixture(); rename(f.session, 'Account-owned private draft'); f.revoke();
  const state = f.session.snapshot();
  assert.equal(state.document, null); assert.equal(state.record, null); assert.equal(state.privateNotes, '');
  assert.equal(state.error.code, 'session_changed'); assert.equal(state.dirty, false);
  assert.equal(f.timers.count(), 0); assert.equal(f.calls.length, 0);
});

test('disposal cancels pending debounce, clears in-memory content and prevents late UI updates', async () => {
  const f = fixture(); rename(f.session, 'Never sent'); const count = f.changes.length; f.session.dispose(); await f.timers.run();
  assert.equal(f.calls.length, 0); assert.equal(f.changes.length, count); assert.equal(f.session.snapshot().document, null);
  const pending = deferred(), g = fixture({ save: async (payload, commit) => { await pending.promise; return commit(payload); } });
  rename(g.session, 'Already sent'); const saving = g.session.flush(); await tick(); const notified = g.changes.length; g.session.dispose(); pending.resolve(); await saving;
  assert.equal(g.changes.length, notified); assert.equal(g.session.snapshot().record, null); assert.equal(g.session.snapshot().privateNotes, '');
});

test('session uses no browser storage and rejects unbounded debounce configuration', async () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, get() { throw new Error('Storage must not be accessed'); } });
  try { const f = fixture(); rename(f.session, 'Memory only'); await f.session.flush(); assert.equal(f.session.snapshot().status, 'saved'); f.session.dispose(); }
  finally { if (descriptor) Object.defineProperty(globalThis, 'localStorage', descriptor); else delete globalThis.localStorage; }
  assert.throws(() => fixture({ session: { delayMs: Infinity } }));
});

test('undo and redo restore accepted document and private-note edits without rewinding acknowledgements', async () => {
  const f = fixture(); rename(f.session, 'Accepted title'); f.session.editNotes('Accepted notes');
  assert.equal(f.session.snapshot().canUndo, true); assert.equal(f.session.snapshot().canRedo, false);
  f.session.undo(); assert.equal(f.session.snapshot().privateNotes, 'Private initial notes');
  assert.equal(f.session.snapshot().document.slides[0].title, 'Accepted title');
  f.session.undo(); assert.equal(f.session.snapshot().document.slides[0].title, 'Original fixture');
  assert.equal(f.session.snapshot().dirty, false); assert.equal(f.session.snapshot().canUndo, false);
  f.session.redo(); f.session.redo(); await f.session.flush();
  assert.equal(f.remote().head.private_notes, 'Accepted notes'); assert.equal(f.session.snapshot().record.lesson.head_revision, 2);
  f.session.undo(); assert.equal(f.session.snapshot().document.document_version, 2);
  assert.equal(f.session.snapshot().privateNotes, 'Private initial notes'); await f.session.flush();
  assert.equal(f.remote().lesson.head_revision, 3); assert.equal(f.remote().head.document.slides[0].title, 'Accepted title');
  assert.equal(f.session.snapshot().canRedo, true, 'save acknowledgements do not create history or clear redo');
  f.session.redo(); assert.equal(f.session.snapshot().document.document_version, 3);
  assert.equal(f.session.snapshot().privateNotes, 'Accepted notes'); f.session.dispose();
});

test('explicit typing groups coalesce for1000ms while structural edits and changed groups stay distinct', () => {
  let time = 0; const f = fixture({session:{now:()=>time}});
  f.session.editNotes('First', {group:'notes'}); time = 500; f.session.editNotes('Second', {group:'notes'});
  time = 1501; f.session.editNotes('Third', {group:'notes'}); f.session.undo();
  assert.equal(f.session.snapshot().privateNotes, 'Second'); f.session.undo();
  assert.equal(f.session.snapshot().privateNotes, 'Private initial notes'); assert.equal(f.session.snapshot().canUndo, false);
  f.session.redo(); f.session.editNotes('A different branch', {group:'notes'}); assert.equal(f.session.snapshot().canRedo, false);
  rename(f.session, 'Structure1'); rename(f.session, 'Structure2'); f.session.undo();
  assert.equal(f.session.snapshot().document.slides[0].title, 'Structure1'); f.session.undo();
  assert.equal(f.session.snapshot().document.slides[0].title, 'Original fixture');
  const before = f.session.snapshot(); assert.throws(()=>f.session.editNotes('Rejected group', {group:'x'.repeat(161)}));
  assert.equal(f.session.snapshot().privateNotes, before.privateNotes); f.session.dispose();
});

test('one explicit group can capture a compound document-and-notes edit without keeping unchanged or invalid edits', () => {
  const f = fixture({session:{now:()=>0}}), original = f.session.snapshot().document;
  f.session.editDocument(renameSlide(original, original.slides[0].id, 'Compound'), {group:'compound'});
  f.session.editNotes('Compound notes', {group:'compound'}); f.session.editNotes('Compound notes');
  assert.throws(()=>f.session.editNotes('x'.repeat(20001)));
  f.session.undo(); assert.equal(f.session.snapshot().privateNotes, 'Private initial notes');
  assert.deepEqual(f.session.snapshot().document, original); assert.equal(f.session.snapshot().canUndo, false); f.session.dispose();
});

test('undo during a held save preserves the intended reversion and rebases its second CAS write', async () => {
  const held = deferred(); let number = 0;
  const f = fixture({save:async(payload,commit)=>{if(++number === 1)await held.promise;return commit(payload);}});
  rename(f.session, 'Sent title'); const saving = f.session.flush(); await tick(); f.session.undo();
  assert.equal(f.session.snapshot().document.slides[0].title, 'Original fixture'); held.resolve(); await saving;
  assert.equal(f.calls.length, 2); assert.equal(f.calls[1].payload.expected_revision, 2);
  assert.equal(f.calls[1].payload.document.document_version, 2); assert.equal(f.remote().head.document.slides[0].title, 'Original fixture');
  assert.equal(f.session.snapshot().canUndo, false); f.session.redo(); assert.equal(f.session.snapshot().document.document_version, 3); f.session.dispose();
});

test('history retains at most50 states and evicts oldest snapshots while preserving current work', () => {
  const f = fixture(); for(let index=1;index<=55;index++)f.session.editNotes('Revision'+index);
  let count=0; while(f.session.snapshot().canUndo){f.session.undo();count++;}
  assert.equal(count,50); assert.equal(f.session.snapshot().privateNotes,'Revision5');
  while(f.session.snapshot().canRedo)f.session.redo();assert.equal(f.session.snapshot().privateNotes,'Revision55'); f.session.dispose();
});

function largeDocument() {
  const document=initialRecord().head.document;
  document.slides[0].blocks[0].content.paragraphs=[100,100,60].map(count=>({type:'paragraph',children:Array.from({length:count},()=>({type:'text',text:'x'.repeat(4000)}))}));
  return document;
}

test('the20MiB history budget evicts large states before reaching the50-state ceiling', () => {
  const f=fixture();f.session.editDocument(largeDocument());
  for(let index=1;index<=25;index++)f.session.editNotes('Large revision'+index);
  let count=0;while(f.session.snapshot().canUndo){f.session.undo();count++;}
  assert.ok(count>=15&&count<=20, 'near1MiB snapshots must be evicted under the20MiB budget');
  assert.notEqual(f.session.snapshot().privateNotes,'Private initial notes');
  assert.equal(f.session.snapshot().document.slides[0].blocks[0].content.paragraphs.length,3);f.session.dispose();
});

test('checkpoint is closed projected recovery data with defensive snapshots and explicit owner scope', () => {
  const f=fixture();rename(f.session,'Checkpoint edit');f.session.editNotes('Checkpoint private notes');
  const cp=f.session.checkpoint();assert.deepEqual(Object.keys(cp).sort(),['base','contract','document','pending','privateNotes']);
  assert.equal(cp.contract,'echs.lesson.checkpoint.v1');assert.equal(cp.pending,null);
  assert.deepEqual(Object.keys(cp.base).sort(),['contract','head','lesson','ok']);
  assert.equal(JSON.stringify(cp).includes('reviews'),false);assert.equal(JSON.stringify(cp).includes('versions'),false);
  const identity={organization_id:cp.base.lesson.organization_id,class_id:cp.base.lesson.class_id,lesson_id:cp.base.lesson.id};
  const copy=assertDraftCheckpoint(cp,{identity});copy.document.title='Outside mutation';cp.base.head.private_notes='Outside private mutation';
  assert.equal(f.session.checkpoint().base.head.private_notes,'Private initial notes');
  assert.equal(f.session.snapshot().document.title,'Original fixture');f.session.dispose();assert.equal(f.session.checkpoint(),null);
});

test('checkpoint rejects hostile JSON, cross-scope identities, extra private fields and inconsistent pending bases', () => {
  const f=fixture(), good=f.session.checkpoint();let getterReads=0;
  const getter=clone(good);Object.defineProperty(getter,'document',{get(){getterReads++;return good.document;},enumerable:true});
  const cycle=clone(good);cycle.document=cycle;
  const hidden=clone(good);Object.defineProperty(hidden,'secret',{value:'private',enumerable:false});
  for(const value of [null,{},getter,cycle,hidden,{...good,extra:'private'},Object.assign(Object.create({}),good),{...good,privateNotes:'x'.repeat(20001)}]) {
    assert.throws(()=>assertDraftCheckpoint(value),{code:'invalid_checkpoint'});
  }
  assert.equal(getterReads,0);
  for(const mutate of [cp=>cp.base.head.document.private_notes='Leaked field',cp=>cp.base.lesson.organization_id='bad',cp=>cp.base.lesson.route_path='https://foreign.test/private',
    cp=>cp.base.head.version_number=2,cp=>cp.document.document_version=2,cp=>cp.base.head.private_notes='bad\0notes',cp=>cp.base.head.extra='private',
    cp=>{cp.pending={base:clone(cp.base),document:clone(cp.document),privateNotes:''};cp.pending.base.lesson.class_id=headId(99);}]){
    const value=clone(good);mutate(value);assert.throws(()=>assertDraftCheckpoint(value),{code:'invalid_checkpoint'});
  }
  for(const key of ['organization_id','class_id','lesson_id','course_version_id'])assert.throws(()=>assertDraftCheckpoint(good,{identity:{[key]:headId(99)}}),{code:'invalid_checkpoint'});
  f.session.dispose();
});

test('crash before a request acknowledgement retains pending intent and safely resumes against unchanged fresh server', async () => {
  const held=deferred();const f=fixture({save:async()=>{await held.promise;throw error(503);}});rename(f.session,'Latest pending edit');
  const saving=f.session.flush();await tick();const cp=f.session.checkpoint();assert.equal(cp.pending.document.slides[0].title,'Latest pending edit');
  f.session.dispose();held.resolve();await saving;
  const calls=[];const fresh=createDraftSession({client:{assertCurrent(){},get:f.client.get,save:async(id,payload)=>{calls.push(payload);return f.commit(payload);}},record:f.remote(),timers:fakeTimers()});
  fresh.restoreCheckpoint(cp);assert.equal(fresh.snapshot().status,'editing');await fresh.flush();
  assert.equal(calls.length,1);assert.equal(calls[0].expected_revision,1);assert.equal(fresh.snapshot().dirty,false);fresh.dispose();
});

test('fresh server confirmation of a lost acknowledgement avoids duplicate writes and preserves newer recovered edits', async () => {
  for(const later of [false,true]){
    const held=deferred();const f=fixture({save:async(payload,commit)=>{const record=commit(payload);await held.promise;return record;}});
    rename(f.session,'Already committed');const saving=f.session.flush();await tick();
    if(later)rename(f.session,'Newer unsent edit');const cp=f.session.checkpoint();f.session.dispose();held.resolve();await saving;
    const fresh=createDraftSession({client:{...f.client,save:async(id,payload)=>f.commit(payload)},record:f.remote(),timers:fakeTimers()});
    const before=f.remote().lesson.head_revision;fresh.restoreCheckpoint(cp);
    assert.equal(fresh.snapshot().document.document_version,2);assert.equal(fresh.snapshot().dirty,later);await fresh.flush();
    assert.equal(f.remote().lesson.head_revision,before+(later?1:0));
    assert.equal(fresh.snapshot().document.slides[0].title,later?'Newer unsent edit':'Already committed');fresh.dispose();
  }
});

test('a recovered conflict retains its original base through edits, retry and a second checkpoint recovery', async () => {
  const f=fixture();rename(f.session,'Recovered local work');const cp=f.session.checkpoint();f.session.dispose();
  const other=f.remote();other.head.document.slides[0].title='A colleague changed this';f.commit({expected_revision:1,document:other.head.document,private_notes:'Colleague notes'});
  const fresh=createDraftSession({client:f.client,record:f.remote(),timers:fakeTimers()});fresh.restoreCheckpoint(cp);
  assert.equal(fresh.snapshot().status,'conflict');assert.equal(fresh.snapshot().dirty,true);assert.equal(fresh.checkpoint().base.lesson.head_revision,1);
  fresh.editNotes('Retained after conflict');await fresh.retry();assert.deepEqual(f.calls.map(call=>call.action),['get']);
  const second=fresh.checkpoint();assert.equal(second.base.lesson.head_revision,1);assert.equal(second.privateNotes,'Retained after conflict');
  const next=createDraftSession({client:f.client,record:f.remote(),timers:fakeTimers()});next.restoreCheckpoint(second);assert.equal(next.snapshot().status,'conflict');
  await next.flush();assert.equal(f.calls.filter(call=>call.action==='save').length,0);
  await next.discardAndReload();assert.equal(next.snapshot().status,'saved');assert.equal(next.checkpoint().base.lesson.head_revision,2);
  assert.equal(next.snapshot().canUndo,false);assert.equal(next.snapshot().canRedo,false);fresh.dispose();next.dispose();
});

test('uncertain recovered conflicts retain the exact pending intent rather than rebasing it to a colleague revision', async () => {
  const f=fixture({save:()=>{throw error(503);}});rename(f.session,'Possibly sent');await f.session.flush();rename(f.session,'More local work');const cp=f.session.checkpoint();
  const other=f.remote();other.head.document.slides[0].title='Other content';f.commit({expected_revision:1,document:other.head.document,private_notes:'Other notes'});
  const fresh=createDraftSession({client:f.client,record:f.remote(),timers:fakeTimers()});fresh.restoreCheckpoint(cp);
  assert.equal(fresh.snapshot().status,'conflict');assert.deepEqual(fresh.checkpoint().pending,cp.pending);await fresh.retry();
  assert.equal(fresh.checkpoint().pending.base.lesson.head_revision,1);assert.equal(fresh.checkpoint().document.slides[0].title,'More local work');f.session.dispose();fresh.dispose();
});

test('recovery cannot replace accepted local edits or cross lesson scope; successful reload clears both history stacks', async () => {
  const f=fixture(),cp=f.session.checkpoint();rename(f.session,'Do not replace');assert.throws(()=>f.session.restoreCheckpoint(cp),{code:'checkpoint_restore_unavailable'});
  f.session.editNotes('Undoable notes');f.session.undo();assert.equal(f.session.snapshot().canRedo,true);await f.session.discardAndReload();
  assert.equal(f.session.snapshot().canUndo,false);assert.equal(f.session.snapshot().canRedo,false);assert.equal(f.session.checkpoint().pending,null);
  const fresh=fixture(),cross=clone(cp);cross.base.lesson.organization_id=headId(99);assert.throws(()=>fresh.session.restoreCheckpoint(cross),{code:'invalid_checkpoint'});
  assert.equal(fresh.session.snapshot().status,'saved');assert.equal(fresh.session.snapshot().dirty,false);f.session.dispose();fresh.session.dispose();
});

test('beforeSave sees durable pending intent before any write while newer local work remains separate', async () => {
  const held=deferred(),checkpoints=[];let hooks=0;
  const f=fixture({session:{beforeSave:async cp=>{checkpoints.push(cp);if(++hooks===1)await held.promise;}}});
  rename(f.session,'First intent');const saving=f.session.flush();await tick();assert.equal(f.calls.length,0);
  assert.equal(checkpoints[0].pending.document.slides[0].title,'First intent');rename(f.session,'Newer work during checkpoint');
  assert.equal(f.session.checkpoint().document.slides[0].title,'Newer work during checkpoint');assert.equal(f.session.checkpoint().pending.document.slides[0].title,'First intent');
  held.resolve();await saving;assert.equal(f.calls.length,2);assert.equal(f.remote().head.document.slides[0].title,'Newer work during checkpoint');
  assert.equal(f.session.checkpoint().pending,null);assert.equal(f.session.snapshot().canUndo,true);f.session.dispose();
});

test('checkpoint hook rejection, timeout and oversized checkpoint never prevent the authenticated save', async () => {
  for(const kind of ['reject','timeout']){
    const f=fixture({session:{beforeSave:()=>kind==='reject'?Promise.reject(new Error('Private failure')):new Promise(()=>{})}});
    rename(f.session,'Save despite backup failure');const saving=f.session.flush();await tick();if(kind==='timeout'){assert.equal(f.calls.length,0);await f.timers.run();}
    await saving;assert.equal(f.calls.length,1);assert.equal(f.session.snapshot().status,'saved');f.session.dispose();
  }
  const record=initialRecord();record.head.document=largeDocument();record.head.private_notes='n'.repeat(20000);let writes=0,hookCalls=0;
  const client={assertCurrent(){},get:async()=>record,save:async(id,payload)=>{writes++;const next=clone(record);next.lesson.head_revision=2;next.lesson.head_version_id=headId(2);next.head.id=headId(2);next.head.version_number=2;next.head.document=clone(payload.document);next.head.document.document_version=2;next.head.document.publication.revision=2;next.head.private_notes=payload.private_notes;return next;}};
  const session=createDraftSession({client,record,timers:fakeTimers(),beforeSave:()=>{hookCalls++;}});session.editNotes('m'.repeat(20000));const saving=session.flush();
  assert.throws(()=>session.checkpoint(),{code:'invalid_checkpoint'});await saving;assert.equal(writes,1);assert.equal(hookCalls,0);assert.equal(session.snapshot().status,'saved');session.dispose();
});

test('disposal during the checkpoint hook prevents a later server write and clears pending/history immediately', async () => {
  const held=deferred();const f=fixture({session:{beforeSave:()=>held.promise}});rename(f.session,'Private pending content');const saving=f.session.flush();await tick();
  f.session.dispose();assert.equal(f.session.checkpoint(),null);assert.equal(f.session.snapshot().canUndo,false);held.resolve();await saving;
  assert.equal(f.calls.length,0);assert.equal(f.session.snapshot().privateNotes,'');assert.equal(f.timers.count(),0);
});

test('definite save refusal never leaks an active pending intent into the conflict checkpoint', async () => {
  let session;const captures=[];const f=fixture({save:()=>{throw error(409);},session:{onChange:state=>{if(session&&state.status==='conflict')captures.push(session.checkpoint());}}});session=f.session;
  rename(session,'Rejected conflict');await session.flush();assert.equal(captures.length,1);assert.equal(captures[0].pending,null);
  assert.equal(session.checkpoint().pending,null);session.dispose();
});
