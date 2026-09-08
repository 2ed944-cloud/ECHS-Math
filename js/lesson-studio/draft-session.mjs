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
  timers = globalThis, isCurrent = () => true, mathEngine } = {}) {
  if (!client || typeof client.save !== 'function' || typeof client.get !== 'function' || typeof onChange !== 'function' || typeof isCurrent !== 'function') {
    throw new TypeError('An authenticated draft client and change callback are required.');
  }
  if (!Number.isInteger(delayMs) || delayMs < 0 || delayMs > 30000 || typeof timers.setTimeout !== 'function' || typeof timers.clearTimeout !== 'function') {
    throw new TypeError('Autosave delay and timers must be bounded.');
  }
  let server, document, privateNotes, status = 'saved', error = null, timer = null, inFlight = null;
  let uncertain = null, disposed = false, callback = onChange, recovery = null, discardRequested = false, editSequence = 0;

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
    if (server && ['id', 'organization_id', 'class_id', 'course_version_id', 'access_key', 'route_path', 'unit_id', 'topic_id', 'slug'].some(key => lesson[key] !== server.lesson[key])) throw invalidResponse();
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
  function dirty() { return Boolean(uncertain || (server && (!identical(document, server.head.document) || privateNotes !== server.head.private_notes))); }
  function snapshot() {
    if (!disposed) current();
    return { record: server ? clone(server) : null, document: document ? clone(document) : null,
      privateNotes: privateNotes ?? '', status, dirty: dirty(), error: error ? { ...error } : null };
  }
  function emit() { try { callback?.(snapshot()); } catch { /* A UI callback cannot alter save authority or acknowledgements. */ } }
  function clearTimer() { if (timer !== null) { timers.clearTimeout(timer); timer = null; } }
  function invalidate(code) {
    clearTimer(); disposed = true; server = null; document = null; privateNotes = ''; uncertain = null;
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
  function editDocument(next) {
    editable();
    try {
      assertDraftDocument(next, { identity: server.head.document, mathEngine });
      if (next.document_version !== server.head.version_number || next.publication.revision !== server.head.version_number) throw new TypeError('Use the current server revision when editing.');
    } catch (failure) { return invalidEdit(failure); }
    if (!identical(document, next)) editSequence++;
    document = clone(next); edited(); return snapshot();
  }
  function editNotes(next) {
    editable(); try { assertNotes(next); } catch (failure) { return invalidEdit(failure); }
    if (privateNotes !== next) editSequence++;
    privateNotes = next; edited(); return snapshot();
  }
  function edited() {
    if (!uncertain && !['conflict', 'error', 'offline'].includes(status)) {
      status = inFlight ? 'saving' : dirty() ? 'editing' : 'saved'; error = null; schedule();
    }
    emit();
  }
  function failSave(failure, sent) {
    if (disposed) return;
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
    if (next.lesson.head_revision !== sent.base.lesson.head_revision + 1 || next.head.version_number !== next.lesson.head_revision ||
      !sameContent(next.head.document, sent.document) || next.head.private_notes !== sent.privateNotes) throw invalidResponse();
    document = rebase(document, next.head.document); server = next; uncertain = null;
    status = dirty() ? 'editing' : 'saved'; error = null;
  }
  function flush() {
    clearTimer();
    if (!current()) return Promise.resolve(snapshot());
    if (recovery) return recovery;
    if (inFlight) return inFlight.then(() => blocked() ? snapshot() : flush());
    if (blocked()) return Promise.resolve(snapshot());
    if (!dirty()) { status = 'saved'; error = null; emit(); return Promise.resolve(snapshot()); }
    const sent = { base: clone(server), document: clone(document), privateNotes };
    status = 'saving'; error = null;
    inFlight = Promise.resolve().then(async () => {
      try {
        if (!current()) return;
        const value = await client.save(server.lesson.id, { expected_revision: sent.base.lesson.head_revision, document: sent.document, private_notes: sent.privateNotes });
        if (!current()) return;
        adoptAcknowledgement(value, sent); emit();
      } catch (failure) { if (current()) failSave(failure, sent); }
    }).finally(() => { inFlight = null; });
    emit();
    return inFlight.then(() => blocked() ? snapshot() : dirty() ? flush() : snapshot());
  }
  async function reconcile() {
    const pending = uncertain;
    const value = await client.get(server.lesson.id);
    if (!current()) return false;
    const next = validateRecord(value, server.head.document);
    if (next.lesson.head_revision === server.lesson.head_revision && next.head.id === server.head.id &&
      identical(next.head.document, server.head.document) && next.head.private_notes === server.head.private_notes) {
      server = next; uncertain = null; status = dirty() ? 'editing' : 'saved'; error = null; return true;
    }
    if (pending && next.lesson.head_revision === pending.base.lesson.head_revision + 1 && next.head.version_number === next.lesson.head_revision &&
      sameContent(next.head.document, pending.document) && next.head.private_notes === pending.privateNotes) {
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
          server = next; document = clone(next.head.document); privateNotes = next.head.private_notes; uncertain = null; status = 'saved'; error = null;
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
    clearTimer(); disposed = true; callback = null; server = null; document = null; privateNotes = ''; uncertain = null;
    status = 'error'; error = frozenError('disposed', 'This draft session is closed.');
  }

  if (!current()) throw Object.assign(new Error('An active authoring session is required.'), { code: 'session_changed', status: 401 });
  server = validateRecord(record); document = clone(server.head.document); privateNotes = server.head.private_notes;
  return Object.freeze({ snapshot, editDocument, editNotes, flush, retry, discardAndReload, dispose });
}
