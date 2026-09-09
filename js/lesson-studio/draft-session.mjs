import { assertDraftDocument } from './draft-model.mjs';

const clone = value => JSON.parse(JSON.stringify(value));
function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])]));
  return value;
}
const identical = (left, right) => JSON.stringify(canonical(left)) === JSON.stringify(canonical(right));
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const frozenError = (code, message, status = 0) => Object.freeze({ code, message, status });
const invalidResponse = () => Object.assign(new Error('Invalid lesson response.'), { code: 'invalid_response', status: 503 });
const CHECKPOINT_CONTRACT = 'echs.lesson.checkpoint.v1';
const CHECKPOINT_BYTES = 4 * 1024 * 1024;
const HISTORY_STATES = 50, HISTORY_BYTES = 20 * 1024 * 1024;
const encoder = new TextEncoder();
const LESSON_KEYS = ['id', 'organization_id', 'class_id', 'course_version_id', 'access_key', 'route_path', 'unit_id', 'topic_id', 'slug', 'head_revision', 'head_version_id', 'workflow_state'];
const HEAD_KEYS = ['id', 'lesson_id', 'version_number', 'document', 'private_notes'];
const SCOPE_KEYS = ['id', 'organization_id', 'class_id', 'course_version_id', 'access_key', 'route_path', 'unit_id', 'topic_id', 'slug'];
const checkpointError = () => Object.assign(new TypeError('This draft checkpoint is invalid or belongs to a different lesson.'), { code: 'invalid_checkpoint' });
const pick = (value, keys) => Object.fromEntries(keys.map(key => [key, value[key]]));
function minimalRecord(value) {
  return clone({ ok: true, contract: 'echs.lesson.store.v1', lesson: pick(value.lesson, LESSON_KEYS), head: pick(value.head, HEAD_KEYS) });
}
function exact(value, keys) {
  if (!value || Array.isArray(value) || typeof value !== 'object' || Object.keys(value).length !== keys.length || keys.some(key => !Object.hasOwn(value, key))) throw checkpointError();
}
// Inspect descriptors before cloning or consulting any untrusted checkpoint field.
function inspectCheckpoint(value) {
  const ancestors = new WeakSet(); let nodes = 0, bytes = 0;
  function walk(item, depth) {
    if (++nodes > 125000 || depth > 30) throw checkpointError();
    if (typeof item === 'string') { if (item.length > CHECKPOINT_BYTES) throw checkpointError(); bytes += encoder.encode(item).length; }
    else if (typeof item === 'number') { if (!Number.isFinite(item)) throw checkpointError(); }
    else if (item !== null && !['object', 'boolean'].includes(typeof item)) throw checkpointError();
    if (bytes > CHECKPOINT_BYTES) throw checkpointError();
    if (item === null || typeof item !== 'object') return;
    if (ancestors.has(item)) throw checkpointError();
    const array = Array.isArray(item), prototype = Object.getPrototypeOf(item);
    if (array ? prototype !== Array.prototype : prototype !== Object.prototype && prototype !== null) throw checkpointError();
    const descriptors = Object.getOwnPropertyDescriptors(item), keys = Reflect.ownKeys(descriptors);
    if (keys.length > 2000 || (array && (descriptors.length.value > 1000 || descriptors.length.value !== keys.length - 1))) throw checkpointError();
    ancestors.add(item);
    for (const key of keys) {
      if (array && key === 'length') continue;
      if (typeof key !== 'string' || ['__proto__', 'prototype', 'constructor', 'toJSON'].includes(key) || (array && !/^(?:0|[1-9][0-9]*)$/.test(key))) throw checkpointError();
      const descriptor = descriptors[key];
      if (!Object.hasOwn(descriptor, 'value') || !descriptor.enumerable) throw checkpointError();
      bytes += encoder.encode(key).length; walk(descriptor.value, depth + 1);
    }
    ancestors.delete(item);
  }
  walk(value, 0);
  if (encoder.encode(JSON.stringify(value)).length > CHECKPOINT_BYTES) throw checkpointError();
}
function assertMinimalRecord(value, mathEngine) {
  exact(value, ['ok', 'contract', 'lesson', 'head']); exact(value.lesson, LESSON_KEYS); exact(value.head, HEAD_KEYS);
  const {lesson, head} = value;
  if (value.ok !== true || value.contract !== 'echs.lesson.store.v1' ||
      ['id','organization_id','class_id','course_version_id','head_version_id'].some(key => typeof lesson[key] !== 'string' || !UUID.test(lesson[key])) ||
      typeof head.id !== 'string' || !UUID.test(head.id) || head.id !== lesson.head_version_id || head.lesson_id !== lesson.id ||
      !Number.isSafeInteger(lesson.head_revision) || lesson.head_revision < 1 || !Number.isSafeInteger(head.version_number) || head.version_number < 1 || head.version_number > lesson.head_revision ||
      !['draft', 'review', 'approved', 'published'].includes(lesson.workflow_state) ||
      ['access_key','route_path','unit_id','topic_id','slug'].some(key => typeof lesson[key] !== 'string' || !lesson[key].trim() || lesson[key].length > 512 || /[\u0000-\u001f\u007f]/.test(lesson[key])) ||
      !/^lessons\/([A-Za-z0-9][A-Za-z0-9._-]*\/)*[A-Za-z0-9][A-Za-z0-9._-]*\.html$/.test(lesson.route_path)) throw checkpointError();
  assertDraftDocument(head.document, {mathEngine}); assertNotes(head.private_notes);
  if (head.document.lesson_id !== lesson.id || ['course_version_id','unit_id','topic_id','slug'].some(key => head.document[key] !== lesson[key]) ||
      head.document.document_version !== head.version_number || head.document.publication.revision !== head.version_number) throw checkpointError();
}

/** Closed recovery data only; account authorization belongs to the encrypted envelope and fresh API session. */
export function assertDraftCheckpoint(value, {mathEngine, identity} = {}) {
  try {
    inspectCheckpoint(value); exact(value, ['contract','base','document','privateNotes','pending']);
    if (value.contract !== CHECKPOINT_CONTRACT) throw checkpointError();
    assertMinimalRecord(value.base, mathEngine);
    const assertWork = (work, base) => {
      assertDraftDocument(work.document, {identity:base.head.document, mathEngine}); assertNotes(work.privateNotes);
      if (work.document.document_version !== base.head.version_number || work.document.publication.revision !== base.head.version_number) throw checkpointError();
    };
    assertWork(value, value.base);
    if (value.pending !== null) {
      exact(value.pending, ['base','document','privateNotes']); assertMinimalRecord(value.pending.base, mathEngine);
      if (!identical(value.base, value.pending.base)) throw checkpointError();
      assertWork(value.pending, value.pending.base);
    }
    if (identity !== undefined) {
      inspectCheckpoint(identity);
      if (!identity || Array.isArray(identity) || typeof identity !== 'object') throw checkpointError();
      for (const key of Object.keys(identity)) {
        if (!['lesson_id', ...SCOPE_KEYS.filter(key => key !== 'id')].includes(key) ||
            typeof identity[key] !== 'string' || value.base.lesson[key === 'lesson_id' ? 'id' : key] !== identity[key]) throw checkpointError();
      }
    }
    return clone(value);
  } catch { throw checkpointError(); }
}

function assertNotes(notes) {
  if (typeof notes !== 'string' || notes.length > 20000 || notes.includes('\0')) throw new TypeError('Private notes must be a string of at most 20,000 characters.');
}
function content(document) {
  const result = clone(document); delete result.document_version; delete result.publication.revision; return result;
}
function sameContent(left, right) { return identical(content(left), content(right)); }
function rebase(document, serverDocument) {
  const result = clone(document);
  result.document_version = serverDocument.document_version;
  result.publication = clone(serverDocument.publication);
  return result;
}

/** In-memory only. All persistence uses the existing authenticated lesson API. */
export function createDraftSession({ client, record, onChange = () => {}, delayMs = 800,
  timers = globalThis, isCurrent = () => true, mathEngine, beforeSave, now = () => Date.now() } = {}) {
  if (!client || typeof client.save !== 'function' || typeof client.get !== 'function' || typeof onChange !== 'function' || typeof isCurrent !== 'function' ||
      typeof now !== 'function' || (beforeSave !== undefined && typeof beforeSave !== 'function')) {
    throw new TypeError('An authenticated draft client and change callback are required.');
  }
  if (!Number.isInteger(delayMs) || delayMs < 0 || delayMs > 30000 || typeof timers.setTimeout !== 'function' || typeof timers.clearTimeout !== 'function') {
    throw new TypeError('Autosave delay and timers must be bounded.');
  }
  let server, document, privateNotes, status = 'saved', error = null, timer = null, inFlight = null;
  let uncertain = null, disposed = false, callback = onChange, recovery = null, discardRequested = false, editSequence = 0;
  let activeSent = null, restoreConflict = false, beforeSaveCancel = null, lastGroup = null;
  const undoStates = [], redoStates = [];

  function validateRecord(value, expectedIdentity) {
    if (!value || value.ok !== true || value.contract !== 'echs.lesson.store.v1' || !value.lesson || !value.head) throw invalidResponse();
    const lesson = value.lesson, head = value.head;
    if (!UUID.test(lesson.id || '') || !UUID.test(head.id || '') || lesson.head_version_id !== head.id || head.lesson_id !== lesson.id ||
      !Number.isInteger(lesson.head_revision) || lesson.head_revision < 1 || !Number.isInteger(head.version_number) || head.version_number < 1 ||
      head.version_number > lesson.head_revision || !['draft', 'review', 'approved', 'published'].includes(lesson.workflow_state)) throw invalidResponse();
    assertDraftDocument(head.document, { identity: expectedIdentity, mathEngine }); assertNotes(head.private_notes);
    if (head.document.lesson_id !== lesson.id || head.document.course_version_id !== lesson.course_version_id ||
      head.document.unit_id !== lesson.unit_id || head.document.topic_id !== lesson.topic_id || head.document.slug !== lesson.slug ||
      head.document.document_version !== head.version_number || head.document.publication.revision !== head.version_number) throw invalidResponse();
    if (server && SCOPE_KEYS.some(key => lesson[key] !== server.lesson[key])) throw invalidResponse();
    return clone(value);
  }
  function current() {
    if (disposed) return false;
    try {
      if (isCurrent() !== true) throw Object.assign(new Error('Account changed.'), { code: 'session_changed', status: 401 });
      client.assertCurrent?.();
      return true;
    } catch (failure) { invalidate(failure?.code || 'session_changed'); return false; }
  }
  function dirty() { return Boolean(uncertain || restoreConflict || (server && (!identical(document, server.head.document) || privateNotes !== server.head.private_notes))); }
  function snapshot() {
    if (!disposed) current();
    return { record: server ? clone(server) : null, document: document ? clone(document) : null,
      privateNotes: privateNotes ?? '', status, dirty: dirty(), error: error ? { ...error } : null,
      canUndo: !disposed && undoStates.length > 0, canRedo: !disposed && redoStates.length > 0 };
  }
  function emit() { try { callback?.(snapshot()); } catch { /* A UI callback cannot alter save authority or acknowledgements. */ } }
  function clearTimer() { if (timer !== null) { timers.clearTimeout(timer); timer = null; } }
  function invalidate(code) {
    clearTimer(); disposed = true; beforeSaveCancel?.(); server = null; document = null; privateNotes = ''; uncertain = null; activeSent = null; restoreConflict = false; clearHistory();
    status = 'error'; error = frozenError(code, 'Your authoring session ended. Sign in and reopen the lesson.', 401);
    emit(); callback = null;
  }
  function editable() {
    if (!current()) throw Object.assign(new Error('The authoring session is no longer active.'), { code: 'session_changed', status: 401 });
  }
  function blocked() { return disposed || recovery !== null || discardRequested || uncertain !== null || ['offline', 'conflict', 'invalid', 'error'].includes(status); }
  function schedule() {
    clearTimer();
    if (!disposed && !blocked() && !inFlight && dirty()) timer = timers.setTimeout(() => { timer = null; void flush(); }, delayMs);
  }
  function invalidEdit(failure) {
    if (!['offline', 'conflict', 'error'].includes(status)) { clearTimer(); status = 'invalid'; error = frozenError('invalid_draft', failure.message || 'Correct the draft before saving.', 422); emit(); }
    throw failure;
  }
  function clearHistory() { undoStates.length = 0; redoStates.length = 0; lastGroup = null; }
  function historyState() {
    const state = {document:clone(document), privateNotes};
    return {...state, bytes:encoder.encode(JSON.stringify(state)).length};
  }
  function trimHistory() {
    let bytes = [...undoStates, ...redoStates].reduce((total, state) => total + state.bytes, 0);
    while (undoStates.length + redoStates.length > HISTORY_STATES || bytes > HISTORY_BYTES) {
      const oldest = undoStates.length ? undoStates.shift() : redoStates.shift(); bytes -= oldest.bytes;
    }
  }
  function remember(options) {
    if (options !== undefined && (!options || typeof options !== 'object' || Array.isArray(options) || Object.keys(options).some(key => key !== 'group'))) throw new TypeError('History grouping must be explicit.');
    const group = options?.group;
    if (group !== undefined && (typeof group !== 'string' || !group.trim() || group.length > 160 || /[\u0000-\u001f\u007f]/.test(group))) throw new TypeError('A history group must be a short label.');
    const time = now(); if (!Number.isFinite(time)) throw new TypeError('History time must be finite.');
    const combined = group !== undefined && lastGroup?.group === group && time >= lastGroup.time && time - lastGroup.time <= 1000;
    if (!combined) undoStates.push(historyState());
    redoStates.length = 0; lastGroup = group === undefined ? null : {group, time}; trimHistory();
    editSequence++;
  }
  function editDocument(next, options) {
    editable();
    try {
      assertDraftDocument(next, { identity: server.head.document, mathEngine });
      if (next.document_version !== server.head.version_number || next.publication.revision !== server.head.version_number) throw new TypeError('Use the current server revision when editing.');
    } catch (failure) { return invalidEdit(failure); }
    if (!identical(document, next)) remember(options);
    document = clone(next); edited(); return snapshot();
  }
  function editNotes(next, options) {
    editable(); try { assertNotes(next); } catch (failure) { return invalidEdit(failure); }
    if (privateNotes !== next) remember(options);
    privateNotes = next; edited(); return snapshot();
  }
  function travel(from, to) {
    editable(); lastGroup = null;
    if (!from.length) return snapshot();
    const saved = from.pop(); to.push(historyState()); trimHistory();
    document = rebase(saved.document, server.head.document); privateNotes = saved.privateNotes; editSequence++;
    edited(); return snapshot();
  }
  function undo() { return travel(undoStates, redoStates); }
  function redo() { return travel(redoStates, undoStates); }
  function checkpoint() {
    if (!current()) return null;
    const pending = activeSent || uncertain;
    return assertDraftCheckpoint({contract:CHECKPOINT_CONTRACT, base:minimalRecord(server), document, privateNotes,
      pending:pending ? {base:minimalRecord(pending.base), document:pending.document, privateNotes:pending.privateNotes} : null}, {mathEngine});
  }
  function matchingBase(next, base) {
    return identical(minimalRecord(next), minimalRecord(base));
  }
  function confirmsPending(next, pending) {
    return Boolean(pending && next.lesson.head_revision === pending.base.lesson.head_revision + 1 && next.head.version_number === next.lesson.head_revision &&
      next.head.id !== pending.base.head.id && sameContent(next.head.document, pending.document) && next.head.private_notes === pending.privateNotes);
  }
  function restoreCheckpoint(value) {
    editable();
    if (inFlight || recovery || editSequence !== 0 || dirty() || status !== 'saved') throw Object.assign(new Error('Recovery requires a freshly loaded draft session.'), {code:'checkpoint_restore_unavailable'});
    const restored = assertDraftCheckpoint(value, {mathEngine, identity:Object.fromEntries(SCOPE_KEYS.map(key => [key === 'id' ? 'lesson_id' : key, server.lesson[key]]))});
    clearTimer(); clearHistory(); editSequence++;
    if (matchingBase(server, restored.base) || confirmsPending(server, restored.pending)) {
      document = rebase(restored.document, server.head.document); privateNotes = restored.privateNotes; uncertain = null; restoreConflict = false;
      status = dirty() ? 'editing' : 'saved'; error = null; schedule();
    } else {
      // Keep the original edit base, not the newly observed conflicting revision.
      server = restored.base; document = restored.document; privateNotes = restored.privateNotes; uncertain = restored.pending; restoreConflict = true;
      status = 'conflict'; error = frozenError('revision_conflict', 'The server contains a different revision. Your recovered draft is retained until you reload.', 409);
    }
    emit(); return snapshot();
  }
  function edited() {
    if (!uncertain && !['conflict', 'error', 'offline'].includes(status)) {
      status = inFlight ? 'saving' : dirty() ? 'editing' : 'saved'; error = null; schedule();
    }
    emit();
  }
  function failSave(failure, sent) {
    if (disposed) return;
    activeSent = null;
    const http = Number(failure?.status) || 0, code = String(failure?.code || '');
    if ([401, 403].includes(http) || ['session_changed', 'session_expired', 'disposed', 'not_initialized'].includes(code)) { invalidate(code || 'session_expired'); return; }
    if (http === 409) {
      status = 'conflict'; error = frozenError('revision_conflict', 'This lesson changed elsewhere. Reload the server version before replacing it.', 409);
    } else if ([400, 413, 415, 422].includes(http) || (http === 0 && code === 'invalid_request')) {
      status = 'invalid'; error = frozenError('invalid_draft', 'This draft was rejected. Correct it before saving.', http || 422);
    } else if (http === 404) {
      status = 'error'; error = frozenError('lesson_unavailable', 'This lesson is no longer available in the current class scope.', 404);
    } else {
      uncertain = sent; status = 'offline'; error = frozenError('save_uncertain', 'The save result is unknown. Retry will first check the server version.', http);
    }
    clearTimer(); emit();
  }
  function adoptAcknowledgement(value, sent) {
    const next = validateRecord(value, server.head.document);
    if (!confirmsPending(next, sent)) throw invalidResponse();
    document = rebase(document, next.head.document); server = next; uncertain = null; activeSent = null; restoreConflict = false;
    status = dirty() ? 'editing' : 'saved'; error = null;
  }
  async function preservePending() {
    if (!beforeSave) return;
    let deadline, cancel;
    const bounded = new Promise(resolve => {
      cancel = resolve; deadline = timers.setTimeout(resolve, 1000); beforeSaveCancel = resolve;
    });
    try {
      await Promise.race([bounded, Promise.resolve().then(() => beforeSave(checkpoint())).catch(() => {})]);
    } finally {
      timers.clearTimeout(deadline); if (beforeSaveCancel === cancel) beforeSaveCancel = null;
    }
  }
  function flush() {
    clearTimer();
    if (!current()) return Promise.resolve(snapshot());
    if (recovery) return recovery;
    if (inFlight) return inFlight.then(() => blocked() ? snapshot() : flush());
    if (blocked()) return Promise.resolve(snapshot());
    if (!dirty()) { status = 'saved'; error = null; emit(); return Promise.resolve(snapshot()); }
    const sent = { base: clone(server), document: clone(document), privateNotes };
    activeSent = sent;
    status = 'saving'; error = null;
    inFlight = Promise.resolve().then(async () => {
      try {
        if (!current()) return;
        await preservePending(); if (!current()) return;
        const value = await client.save(sent.base.lesson.id, { expected_revision: sent.base.lesson.head_revision, document: sent.document, private_notes: sent.privateNotes });
        if (!current()) return;
        adoptAcknowledgement(value, sent); emit();
      } catch (failure) { if (current()) failSave(failure, sent); }
    }).finally(() => { if (activeSent === sent) activeSent = null; inFlight = null; });
    emit();
    return inFlight.then(() => blocked() ? snapshot() : dirty() ? flush() : snapshot());
  }
  async function reconcile() {
    const pending = uncertain;
    const value = await client.get(server.lesson.id);
    if (!current()) return false;
    const next = validateRecord(value, server.head.document);
    if (matchingBase(next, server)) {
      server = next; uncertain = null; restoreConflict = false; status = dirty() ? 'editing' : 'saved'; error = null; return true;
    }
    if (confirmsPending(next, pending)) {
      adoptAcknowledgement(next, pending); return true;
    }
    status = 'conflict'; error = frozenError('revision_conflict', 'The server contains a different revision. Your unsaved draft is retained until you reload.', 409);
    return false;
  }
  function recover(mode) {
    clearTimer(); if (!current()) return Promise.resolve(snapshot());
    if (mode === 'reload') discardRequested = true;
    if (recovery) return mode === 'reload' ? recovery.then(() => recover('reload')) : recovery;
    const sequence = editSequence;
    const needsRead = Boolean(uncertain || ['offline', 'conflict', 'error'].includes(status));
    const wasInvalid = status === 'invalid';
    let allowFlush = false;
    status = 'saving';
    const job = Promise.resolve().then(async () => {
      try {
        if (inFlight) await inFlight;
        if (!current()) return;
        if (mode === 'reload') {
          const value = await client.get(server.lesson.id); if (!current()) return;
          const next = validateRecord(value, server.head.document);
          if (editSequence !== sequence) {
            status = 'conflict'; error = frozenError('edited_during_reload', 'New edits were made while reloading. They are retained; reload again to discard them.', 409); emit(); return;
          }
          server = next; document = clone(next.head.document); privateNotes = next.head.private_notes; uncertain = null; activeSent = null; restoreConflict = false; clearHistory(); status = 'saved'; error = null;
        } else {
          // A save awaited above may just have become uncertain or conflicted.
          if (needsRead || uncertain || ['offline', 'conflict', 'error'].includes(status)) {
            if (!await reconcile()) { emit(); return; }
          } else {
            if (wasInvalid) { assertDraftDocument(document, { identity: server.head.document, mathEngine }); assertNotes(privateNotes); }
            status = dirty() ? 'editing' : 'saved'; error = null;
          }
          allowFlush = true;
        }
        emit();
      } catch (failure) { if (current()) failSave(failure, uncertain); }
    }).finally(() => { recovery = null; if (mode === 'reload') discardRequested = false; });
    recovery = job.then(() => allowFlush && !discardRequested && !disposed ? flush() : snapshot());
    emit(); return recovery;
  }
  function retry() { return recover('retry'); }
  function discardAndReload() { return recover('reload'); }
  function dispose() {
    if (disposed) return;
    clearTimer(); disposed = true; beforeSaveCancel?.(); callback = null; server = null; document = null; privateNotes = ''; uncertain = null; activeSent = null; restoreConflict = false; clearHistory();
    status = 'error'; error = frozenError('disposed', 'This draft session is closed.');
  }

  if (!current()) throw Object.assign(new Error('An active authoring session is required.'), { code: 'session_changed', status: 401 });
  server = validateRecord(record); document = clone(server.head.document); privateNotes = server.head.private_notes;
  return Object.freeze({ snapshot, editDocument, editNotes, undo, redo, checkpoint, restoreCheckpoint, flush, retry, discardAndReload, dispose });
}
