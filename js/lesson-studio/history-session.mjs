import { assertDraftDocument } from './draft-model.mjs';

const CONTRACT = 'echs.lesson.store.v1';
const PAGE_SIZE = 25, MAX_HISTORY = 1000, MAX_BYTES = 2 * 1024 * 1024;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const encoder = new TextEncoder();
const SCOPE = ['id','organization_id','class_id','course_version_id','access_key','legacy_course_key','route_path','unit_id','topic_id','slug','created_by'];
const LESSON = [...SCOPE,'created_at','updated_at','head_revision','head_version_id','workflow_state','approved_version_id','approved_review_id','active_publication_id'];
const VERSION = ['id','organization_id','lesson_id','version_number','created_by','created_at','restored_from_version_id'];
const REVIEW = ['id','organization_id','lesson_id','version_id','revision','event_type','actor_id','checks','comment','created_at'];
const PUBLICATION = ['id','organization_id','lesson_id','source_version_id','revision','event_type','actor_id','reason','created_at'];
const CHECKS = ['curriculum','mathematics','accessibility','rights','student_safe'];
const ACTIONS = new Set(['restore','requestReview','approve','publish','unpublish']);
const copy = value => JSON.parse(JSON.stringify(value));
const fail = (code = 'invalid_response', status = 0) => Object.assign(new Error('Lesson history could not complete this operation.'), {code,status});
const requireValue = condition => { if (!condition) throw fail(); };
const uuid = value => typeof value === 'string' && UUID.test(value);
const nullableId = value => value === null || uuid(value);
const integer = value => Number.isInteger(value) && value > 0 && value <= 2147483647;
const text = (value, max, empty = false) => typeof value === 'string' && value.length <= max && (empty || value.trim().length > 0) && !value.includes('\0');
const date = value => text(value, 100) && Number.isFinite(Date.parse(value));
const canonical = value => Array.isArray(value) ? value.map(canonical) : value && typeof value === 'object'
  ? Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])])) : value;
const equal = (a,b) => JSON.stringify(canonical(a)) === JSON.stringify(canonical(b));
function closed(value, keys) {
  requireValue(value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value,key)));
}
function plain(value, limit = MAX_BYTES) {
  const ancestors = new WeakSet(); let nodes = 0, bytes = 0;
  function visit(item, depth) {
    requireValue(++nodes <= 125000 && depth <= 32);
    if (typeof item === 'string') { requireValue(item.length <= limit); bytes += encoder.encode(item).length; }
    else if (typeof item === 'number') requireValue(Number.isFinite(item));
    else requireValue(item === null || ['object','boolean'].includes(typeof item));
    requireValue(bytes <= limit);
    if (item === null || typeof item !== 'object') return;
    requireValue(!ancestors.has(item));
    const array = Array.isArray(item), prototype = Object.getPrototypeOf(item);
    requireValue(array ? prototype === Array.prototype : prototype === Object.prototype || prototype === null);
    const descriptors = Object.getOwnPropertyDescriptors(item), keys = Reflect.ownKeys(descriptors);
    requireValue(keys.length <= 2000 && (!array || descriptors.length.value <= 1000 && descriptors.length.value === keys.length - 1));
    ancestors.add(item);
    for (const key of keys) {
      if (array && key === 'length') continue;
      requireValue(typeof key === 'string' && !['__proto__','prototype','constructor','toJSON'].includes(key) && (!array || /^(?:0|[1-9][0-9]*)$/.test(key)));
      const descriptor = descriptors[key];
      requireValue(Object.hasOwn(descriptor,'value') && descriptor.enumerable);
      bytes += encoder.encode(key).length; visit(descriptor.value, depth + 1);
    }
    ancestors.delete(item);
  }
  visit(value,0); requireValue(encoder.encode(JSON.stringify(value)).length <= limit);
}
function lesson(value, binding, actor) {
  closed(value, LESSON);
  requireValue(['id','organization_id','class_id','course_version_id','created_by','head_version_id'].every(key => uuid(value[key])) &&
    value.organization_id === actor.organization_id && integer(value.head_revision) &&
    ['draft','review','approved','published'].includes(value.workflow_state) &&
    ['approved_version_id','approved_review_id','active_publication_id'].every(key => nullableId(value[key])) &&
    ['access_key','unit_id','topic_id','slug'].every(key => text(value[key],400)) &&
    ['ap-calculus','ap-precalculus','ib-math-ai'].includes(value.legacy_course_key) &&
    /^lessons\/([A-Za-z0-9][A-Za-z0-9._-]*\/)*[A-Za-z0-9][A-Za-z0-9._-]*\.html$/.test(value.route_path) &&
    date(value.created_at) && date(value.updated_at));
  requireValue((value.approved_version_id === null) === (value.approved_review_id === null));
  requireValue(['approved','published'].includes(value.workflow_state) === (value.approved_version_id !== null));
  if (binding) requireValue(SCOPE.every(key => value[key] === binding[key]));
}
function version(value, binding, full, mathEngine) {
  closed(value, [...VERSION,...(full ? ['document','private_notes'] : [])]);
  requireValue(uuid(value.id) && value.organization_id === binding.organization_id && value.lesson_id === binding.id &&
    integer(value.version_number) && uuid(value.created_by) && date(value.created_at) && nullableId(value.restored_from_version_id));
  if (full) {
    requireValue(text(value.private_notes,20000,true));
    assertDraftDocument(value.document,{mathEngine});
    requireValue(encoder.encode(JSON.stringify(value.document)).length <= 1024 * 1024 && value.document.lesson_id === binding.id &&
      ['course_version_id','unit_id','topic_id','slug'].every(key => value.document[key] === binding[key]) &&
      value.document.document_version === value.version_number && value.document.publication.revision === value.version_number);
  }
}
function review(value, binding) {
  closed(value,REVIEW);
  requireValue(uuid(value.id) && value.organization_id === binding.organization_id && value.lesson_id === binding.id &&
    uuid(value.version_id) && integer(value.revision) && uuid(value.actor_id) && date(value.created_at) && text(value.comment,4000,true) &&
    ['requested','approved'].includes(value.event_type));
  if (value.event_type === 'requested') requireValue(value.checks === null);
  else { closed(value.checks,CHECKS); requireValue(CHECKS.every(key => value.checks[key] === true)); }
}
function publication(value, binding) {
  closed(value,PUBLICATION);
  requireValue(uuid(value.id) && value.organization_id === binding.organization_id && value.lesson_id === binding.id &&
    uuid(value.source_version_id) && integer(value.revision) && uuid(value.actor_id) && date(value.created_at) &&
    text(value.reason,1000,true) && ['published','unpublished'].includes(value.event_type));
}
function descending(rows, key, maximum, validate) {
  requireValue(Array.isArray(rows) && rows.length <= maximum);
  const ids = new Set(); let previous = Infinity;
  for (const row of rows) { validate(row); requireValue(!ids.has(row.id) && row[key] < previous); ids.add(row.id); previous = row[key]; }
}
function recordValue(value, binding, actor, mathEngine) {
  plain(value); closed(value,['ok','contract','lesson','head','versions','reviews','publications']);
  requireValue(value.ok === true && value.contract === CONTRACT); lesson(value.lesson,binding,actor);
  version(value.head,value.lesson,true,mathEngine);
  requireValue(value.head.id === value.lesson.head_version_id && value.head.version_number <= value.lesson.head_revision);
  if (value.lesson.approved_version_id !== null) requireValue(value.lesson.approved_version_id === value.head.id);
  if (value.lesson.workflow_state === 'published') requireValue(value.lesson.active_publication_id !== null);
  descending(value.versions,'version_number',PAGE_SIZE,row => version(row,value.lesson,false));
  descending(value.reviews,'revision',PAGE_SIZE,row => review(row,value.lesson));
  descending(value.publications,'revision',PAGE_SIZE,row => publication(row,value.lesson));
  for (const row of [...value.versions,...value.reviews,...value.publications]) requireValue((row.revision || row.version_number) <= value.lesson.head_revision);
  return copy(value);
}
const message = code => ({
  invalid_request:'Check this history action before trying again.', invalid_response:'The lesson service returned an invalid history response.',
  revision_conflict:'The lesson changed. Check the current server version before continuing.',
  invalid_transition:'The current lesson state does not permit this action.',
  network_error:'The action may have reached the server. Check its state before retrying.',
  read_failed:'The server state could not be checked. The pending action is retained.',
  history_limit:'The most recent 1,000 versions are loaded. Reopen history to start again.',
  lesson_unavailable:'This lesson or version is unavailable to your account.',
  session_changed:'Your account or workspace changed. Reopen Lesson Studio.'
})[code] || 'Lesson history could not complete this operation.';
const safeError = (error, fallback = 'network_error') => {
  const known = new Set(['invalid_request','invalid_response','revision_conflict','invalid_transition','lesson_unavailable','session_changed']);
  const code = known.has(error?.code) ? error.code : fallback;
  return {code,message:message(code),status:Number.isInteger(error?.status) ? error.status : 0};
};
function sameBase(fresh, base) { return equal(fresh.lesson,base.lesson) && equal(fresh.head,base.head); }
function committed(fresh, intent) {
  const {base,action,body,actor,source,liveSource} = intent;
  const next = base.lesson.head_revision + 1, current = fresh.lesson;
  if (current.head_revision !== next) return false;
  const sameHead = equal(fresh.head,base.head);
  const sameLive = current.active_publication_id === base.lesson.active_publication_id;
  const sameApproval = current.approved_version_id === base.lesson.approved_version_id && current.approved_review_id === base.lesson.approved_review_id;
  const matchingReview = type => fresh.reviews.find(row => row.revision === next && row.event_type === type && row.actor_id === actor.id && row.version_id === base.head.id);
  const matchingPublication = type => fresh.publications.find(row => row.revision === next && row.event_type === type && row.actor_id === actor.id);
  if (action === 'restore') {
    const document = copy(source.document); document.document_version = next; document.publication.revision = next;
    return current.workflow_state === 'draft' && current.approved_version_id === null && current.approved_review_id === null && sameLive &&
      fresh.head.id !== base.head.id && fresh.head.id !== source.id && fresh.head.version_number === next && fresh.head.created_by === actor.id &&
      fresh.head.restored_from_version_id === source.id && fresh.head.private_notes === source.private_notes && equal(fresh.head.document,document);
  }
  if (!sameHead || current.head_version_id !== base.lesson.head_version_id) return false;
  if (action === 'requestReview') {
    const event = matchingReview('requested');
    return current.workflow_state === 'review' && sameApproval && sameLive && Boolean(event && event.checks === null && event.comment === '');
  }
  if (action === 'approve') {
    const event = matchingReview('approved');
    return current.workflow_state === 'approved' && sameLive && current.approved_version_id === base.head.id &&
      Boolean(event && current.approved_review_id === event.id && equal(event.checks,body.checks) && event.comment === body.comment);
  }
  if (action === 'publish') {
    const event = matchingPublication('published');
    return current.workflow_state === 'published' && sameApproval && Boolean(event && current.active_publication_id === event.id && event.source_version_id === base.head.id && event.reason === '');
  }
  const event = matchingPublication('unpublished');
  return current.workflow_state === 'draft' && current.active_publication_id === null && current.approved_version_id === null && current.approved_review_id === null &&
    Boolean(event && event.source_version_id === liveSource && event.reason === body.reason.trim());
}

/** Staff-only in-memory history. The canonical client and server remain authority. */
export function createHistorySession({client,record,onChange = () => {},isCurrent = () => true,mathEngine} = {}) {
  if (!client || !['assertCurrent','get','history','version','restore','requestReview','approve','publish','unpublish'].every(key => typeof client[key] === 'function') ||
      typeof onChange !== 'function' || typeof isCurrent !== 'function') throw new TypeError('An initialized lesson client and callbacks are required.');
  const owner = client.assertCurrent();
  if (!uuid(owner?.id) || !uuid(owner?.organization_id) || !['teacher','admin'].includes(owner?.role) || owner.status !== 'active' || isCurrent() !== true) throw fail('session_changed',401);
  const actor = {id:owner.id,organization_id:owner.organization_id,role:owner.role,status:owner.status};
  let current = recordValue(record,null,actor,mathEngine), binding = copy(current.lesson);
  let versions = copy(current.versions), nextBefore = versions.length === PAGE_SIZE && versions.at(-1).version_number > 1 ? versions.at(-1).version_number : null;
  let selected = null, status = 'ready', error = null, pending = null, operation = null, disposed = false;
  function dispose() {
    if (disposed) return; disposed = true; operation?.controller.abort(); operation = null;
    current = binding = selected = pending = null; versions = []; nextBefore = null; status = 'disposed'; error = null;
  }
  function guard() {
    if (disposed) return false;
    try { const now = client.assertCurrent(); if (isCurrent() !== true || !['id','organization_id','role','status'].every(key => now[key] === actor[key])) throw fail(); }
    catch { dispose(); return false; }
    return true;
  }
  function snapshot() {
    guard();
    return copy({record:current,versions,nextBefore,selected,status,error,
      pending:pending ? {action:pending.action,expectedRevision:pending.base.lesson.head_revision,canRetry:status === 'retryable' && !pending.definite} : null,
      canApprove:!disposed && current.lesson.workflow_state === 'review' && actor.id !== current.lesson.created_by && actor.id !== current.head.created_by,
      historyLimitReached:versions.length >= MAX_HISTORY && nextBefore !== null});
  }
  function emit() { if (!guard()) return; try { onChange(snapshot()); } catch {} }
  function tokenCurrent(token) { return guard() && operation === token && !token.controller.signal.aborted; }
  function adopt(fresh) {
    current = fresh; versions = copy(fresh.versions);
    nextBefore = versions.length === PAGE_SIZE && versions.at(-1).version_number > 1 ? versions.at(-1).version_number : null;
    if (selected) selected.lesson = copy(fresh.lesson);
  }
  async function run(kind, callback) {
    if (!guard()) return snapshot();
    const previous = operation?.previous || status;
    if (operation) {
      if (kind === 'selecting' && operation.kind === 'selecting') operation.controller.abort();
      else return snapshot();
    }
    const token = {kind,previous,controller:new AbortController()}; operation = token; status = kind; error = null; emit();
    try { await callback(token,previous); }
    catch (caught) { if (tokenCurrent(token)) { if ([401,403].includes(caught?.status)) dispose(); else { error = safeError(caught); status = pending ? 'uncertain' : 'error'; } } }
    finally { if (tokenCurrent(token)) { operation = null; emit(); } }
    return snapshot();
  }
  async function scopedRead(token, request) {
    try { return await request(); }
    catch (caught) {
      // SQL conceals whole-lesson authorization failures as404. These reads
      // therefore invalidate the cached staff view even if the client lives on.
      if (tokenCurrent(token) && [401,403,404].includes(caught?.status)) dispose();
      throw caught;
    }
  }
  const freshRecord = async token => {
    const value = await scopedRead(token,()=>client.get(binding.id,{signal:token.controller.signal}));
    if (!tokenCurrent(token)) return null;
    const fresh = recordValue(value,binding,actor,mathEngine);
    requireValue(fresh.lesson.head_revision >= current.lesson.head_revision);
    return fresh;
  };
  function pageValue(value, before, bound) {
    plain(value); closed(value,['ok','contract','versions','next_before_version']);
    requireValue(value.ok === true && value.contract === CONTRACT && (value.next_before_version === null || integer(value.next_before_version)));
    descending(value.versions,'version_number',PAGE_SIZE,row => version(row,binding,false));
    requireValue(value.versions.every(row => row.version_number < (before || Infinity) && row.version_number <= bound));
    if (value.next_before_version !== null) requireValue(value.versions.length > 0 && value.next_before_version === value.versions.at(-1).version_number && value.next_before_version > 1);
    return copy(value);
  }
  function refresh() {
    return run('loading',async token => {
      const fresh = await freshRecord(token); if (!fresh) return;
      const result = await scopedRead(token,()=>client.history(binding.id,{limit:PAGE_SIZE},{signal:token.controller.signal})); if (!tokenCurrent(token)) return;
      const page = pageValue(result,null,fresh.head.version_number);
      adopt(fresh); versions = page.versions; nextBefore = page.next_before_version; selected = null; pending = null; status = 'ready'; error = null;
    });
  }
  function loadMore() {
    if (!guard() || nextBefore === null || versions.length >= MAX_HISTORY) return Promise.resolve(snapshot());
    return run('loading',async (token,previous) => {
      const before = nextBefore, result = await scopedRead(token,()=>client.history(binding.id,{limit:PAGE_SIZE,before_version:before},{signal:token.controller.signal}));
      if (!tokenCurrent(token)) return;
      const page = pageValue(result,before,current.head.version_number), ids = new Set(versions.map(row => row.id));
      requireValue(!page.versions.some(row => ids.has(row.id)) && versions.length + page.versions.length <= MAX_HISTORY);
      versions.push(...page.versions); nextBefore = page.next_before_version; status = pending || previous === 'conflict' ? previous : 'ready';
    });
  }
  function select(versionId) {
    if (!uuid(versionId)) return invalidAction();
    return run('selecting',async (token,previous) => {
      let value;
      try { value = await client.version(binding.id,versionId,{signal:token.controller.signal}); }
      catch (caught) {
        if (!tokenCurrent(token)) return;
        if (caught?.status !== 404) throw caught;
        // A missing version and revoked lesson membership share HTTP404. Keep
        // the modal only after a new full lesson read proves current access.
        try {
          const fresh = await freshRecord(token); if (!fresh) return;
          adopt(fresh); selected = null; status = pending ? 'uncertain' : 'error';
          error = safeError(fail('lesson_unavailable',404));
        } catch { if (tokenCurrent(token)) dispose(); }
        return;
      }
      if (!tokenCurrent(token)) return;
      plain(value); closed(value,['ok','contract','lesson','version']); requireValue(value.ok === true && value.contract === CONTRACT);
      lesson(value.lesson,binding,actor); version(value.version,binding,true,mathEngine);
      requireValue(value.version.id === versionId && value.version.version_number <= value.lesson.head_revision && value.lesson.head_revision >= current.lesson.head_revision);
      selected = copy({lesson:value.lesson,version:value.version});
      if (value.lesson.head_revision !== current.lesson.head_revision) { status = 'conflict'; error = safeError(fail('revision_conflict',409)); }
      else status = pending || previous === 'conflict' ? previous : 'ready';
    });
  }
  function invalidAction() {
    if (guard() && !operation) { error = safeError(fail('invalid_request',400)); if (!pending) status = 'error'; emit(); }
    return Promise.resolve(snapshot());
  }
  function payload(action, body) {
    plain(body,8192); requireValue(ACTIONS.has(action));
    closed(body,action === 'restore' ? ['version_id'] : action === 'approve' ? ['checks','comment'] : action === 'unpublish' ? ['reason'] : []);
    requireValue(current.lesson.head_revision < 2147483647);
    if (action === 'restore') requireValue(uuid(body.version_id) && selected?.version.id === body.version_id);
    if (action === 'approve') { closed(body.checks,CHECKS); requireValue(CHECKS.every(key => body.checks[key] === true) && text(body.comment,2000) && snapshot().canApprove); }
    if (action === 'unpublish') requireValue(text(body.reason,1000) && current.lesson.active_publication_id !== null);
    if (action === 'requestReview') requireValue(current.lesson.workflow_state === 'draft');
    if (action === 'publish') requireValue(current.lesson.workflow_state === 'approved');
    return copy(body);
  }
  async function send(token) {
    const intent = pending, options = {signal:token.controller.signal}, id = binding.id, revision = intent.base.lesson.head_revision;
    let result;
    try {
      if (intent.action === 'requestReview' || intent.action === 'publish') result = await client[intent.action](id,revision,options);
      else result = await client[intent.action](id,{...copy(intent.body),expected_revision:revision},options);
      if (!tokenCurrent(token)) return;
      const fresh = recordValue(result,binding,actor,mathEngine);
      requireValue(committed(fresh,intent)); adopt(fresh); pending = null; status = 'ready'; error = null;
    } catch (caught) {
      if (!tokenCurrent(token)) return;
      if (caught?.status === 401 || caught?.status === 403) { dispose(); return; }
      if (caught?.status === 409) {
        pending.definite = true; status = 'conflict'; error = safeError(caught);
        try { const fresh = await freshRecord(token); if (fresh) adopt(fresh); }
        catch { if (tokenCurrent(token)) error = safeError(null,'read_failed'); }
      } else if ([400,404,413,415,422].includes(caught?.status)) {
        pending = null; status = 'error'; error = safeError(caught);
      } else { status = 'uncertain'; error = safeError(caught); }
    }
  }
  function act(action, body = {}) {
    if (!guard() || operation || pending || status === 'conflict') return Promise.resolve(snapshot());
    let clean;
    try { clean = payload(action,body); } catch { return invalidAction(); }
    return run('acting',async token => {
      const live = current.publications.find(row => row.id === current.lesson.active_publication_id && row.event_type === 'published');
      if (action === 'unpublish') requireValue(live);
      pending = {action,body:clean,base:copy(current),actor:copy(actor),source:action === 'restore' ? copy(selected.version) : null,liveSource:live?.source_version_id || null,definite:false};
      emit(); if (!tokenCurrent(token)) return; await send(token);
    });
  }
  function reconcile(options = {}) {
    try { plain(options,1000); requireValue(options && typeof options === 'object' && !Array.isArray(options) && Object.keys(options).every(key => key === 'retry') && (!Object.hasOwn(options,'retry') || typeof options.retry === 'boolean')); }
    catch { return invalidAction(); }
    return run('loading',async token => {
      let fresh;
      try { fresh = await freshRecord(token); }
      catch (caught) { if (tokenCurrent(token)) { if ([401,403].includes(caught?.status)) dispose(); else { status = pending ? 'uncertain' : 'error'; error = safeError(caught,'read_failed'); } } return; }
      if (!fresh) return;
      if (!pending) { adopt(fresh); status = 'ready'; error = null; return; }
      const intent = pending;
      if (!intent.definite && committed(fresh,intent)) { adopt(fresh); pending = null; status = 'ready'; error = null; return; }
      if (!intent.definite && sameBase(fresh,intent.base)) {
        adopt(fresh); status = 'retryable'; error = null;
        if (options.retry === true) { status = 'acting'; emit(); if (tokenCurrent(token)) await send(token); }
        return;
      }
      adopt(fresh); status = 'conflict'; error = safeError(fail('revision_conflict',409));
    });
  }
  return Object.freeze({snapshot,refresh,loadMore,select,act,reconcile,dispose});
}
