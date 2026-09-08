import { assertPersistableDocument, assertPublishableDocument, assertStudentDocument } from './document-contract.mjs';

export const LESSON_API_CONTRACT = 'echs.lesson.store.v1';
export const MAX_REQUEST_BYTES = 1024 * 1024 + 128 * 1024;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const STAFF = new Set(['admin', 'teacher']);
const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);

class ApiError extends Error {
  constructor(status, code, message) { super(message); this.status = status; this.code = code; }
}
const invalid = () => { throw new ApiError(422, 'invalid_request', 'The request does not match the lesson API contract.'); };
const unavailable = () => new ApiError(503, 'service_unavailable', 'Lesson storage is temporarily unavailable.');
const conflict = () => new ApiError(409, 'revision_conflict', 'The lesson changed. Reload its current revision before saving.');

function object(value, keys, required = keys) {
  if (!value || Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype) invalid();
  if (Object.keys(value).some(key => !keys.includes(key)) || required.some(key => !own(value, key))) invalid();
  return value;
}
function uuid(value) { if (typeof value !== 'string' || !UUID.test(value)) invalid(); return value; }
function integer(value, min = 1, max = 2147483646) { if (!Number.isInteger(value) || value < min || value > max) invalid(); return value; }
function string(value, max, empty = false) {
  if (typeof value !== 'string' || value.length > max || (!empty && !value.trim()) || value.includes('\u0000')) invalid();
  return value;
}
function query(url, keys, required = []) {
  const result = {};
  for (const [key, value] of url.searchParams) { if (!keys.includes(key) || own(result, key)) invalid(); result[key] = value; }
  if (required.some(key => !own(result, key))) invalid();
  return result;
}
function queryInteger(value, max) { if (!/^[1-9][0-9]*$/.test(value)) invalid(); return integer(Number(value), 1, max); }

function projectedSnapshot(document, revision, published = false) {
  const projected = structuredClone(document);
  if (!published) projected.document_version = revision;
  projected.publication = { ...projected.publication, status: published ? 'published' : 'draft', revision };
  return projected;
}
function documentIdentity(document) {
  return { lesson_id: document.lesson_id, course_version_id: document.course_version_id,
    unit_id: document.unit_id, topic_id: document.topic_id, document_version: document.document_version,
    publication_revision: document.publication.revision };
}

async function readJson(req, timeoutMs) {
  if (!/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(req.headers.get('content-type') || '')) {
    throw new ApiError(415, 'json_required', 'Use application/json for lesson requests.');
  }
  const length = req.headers.get('content-length');
  if (length !== null && (!/^\d+$/.test(length) || Number(length) > MAX_REQUEST_BYTES)) {
    throw new ApiError(413, 'request_too_large', 'The lesson request exceeds the size limit.');
  }
  const reader = req.body?.getReader();
  if (!reader) invalid();
  let size = 0; const chunks = [];
  let timer, interrupt, bodyError;
  const interrupted = new Promise((_, reject) => {
    interrupt = () => {
      bodyError = new ApiError(408, 'request_timeout', 'The lesson request body did not complete in time.');
      reject(bodyError);
      void reader.cancel().catch(() => {});
    };
    timer = setTimeout(interrupt, timeoutMs);
    req.signal.addEventListener('abort', interrupt, { once: true });
    if (req.signal.aborted) interrupt();
  });
  try {
    while (true) {
      const { value, done } = await Promise.race([reader.read(), interrupted]);
      if (bodyError) throw bodyError;
      if (done) break;
      size += value.byteLength;
      if (size > MAX_REQUEST_BYTES) { void reader.cancel().catch(() => {}); throw new ApiError(413, 'request_too_large', 'The lesson request exceeds the size limit.'); }
      chunks.push(value);
    }
  } finally { clearTimeout(timer); req.signal.removeEventListener('abort', interrupt); reader.releaseLock(); }
  const bytes = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  try { return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)); }
  catch { throw new ApiError(400, 'invalid_json', 'The request must contain valid JSON.'); }
}

function route(req) {
  const url = new URL(req.url);
  const prefix = /^\/(?:functions\/v1\/)?lesson-api(?=\/|$)/;
  if (!prefix.test(url.pathname)) throw new ApiError(404, 'not_found', 'Lesson endpoint not found.');
  const path = url.pathname.replace(prefix, '') || '/';
  let match;
  if (req.method === 'GET' && path === '/health') { query(url, []); return { action: 'health', payload: {} }; }
  if (req.method === 'GET' && path === '/context') {
    const args = query(url, ['class_id']); if (own(args, 'class_id')) uuid(args.class_id);
    return { action: 'context', payload: args };
  }
  if (req.method === 'GET' && path === '/lessons') {
    const args = query(url, ['class_id'], ['class_id']); uuid(args.class_id); return { action: 'list', payload: args };
  }
  if (req.method === 'POST' && path === '/lessons') { query(url, []); return { action: 'create' }; }
  if ((match = /^\/classes\/([^/]+)\/course-version$/.exec(path)) && req.method === 'POST') {
    query(url, []); return { action: 'pin_course', pathId: uuid(match[1]) };
  }
  if ((match = /^\/lessons\/([^/]+)(?:\/(.*))?$/.exec(path))) {
    const lesson_id = uuid(match[1]); const suffix = match[2] || '';
    if (req.method === 'GET' && suffix === '') { query(url, []); return { action: 'get', payload: { lesson_id } }; }
    if (req.method === 'GET' && suffix === 'published') {
      const args = query(url, ['class_id'], ['class_id']); uuid(args.class_id);
      return { action: 'deliver', payload: { lesson_id, ...args } };
    }
    if (req.method === 'GET' && suffix === 'history') {
      const args = query(url, ['before_version', 'limit']);
      for (const key of Object.keys(args)) args[key] = queryInteger(args[key], key === 'limit' ? 100 : 2147483646);
      return { action: 'history', payload: { lesson_id, ...args } };
    }
    const versionMatch = /^versions\/([^/]+)$/.exec(suffix);
    if (req.method === 'GET' && versionMatch) { query(url, []); return { action: 'version', payload: { lesson_id, version_id: uuid(versionMatch[1]) } }; }
    const actions = { draft: 'save', 'request-review': 'request_review', approve: 'approve', publish: 'publish', restore: 'restore', unpublish: 'unpublish' };
    if (req.method === 'POST' && own(actions, suffix)) { query(url, []); return { action: actions[suffix], pathId: lesson_id }; }
  }
  throw new ApiError(404, 'not_found', 'Lesson endpoint not found.');
}

function mutationPayload(action, body, pathId) {
  if (action === 'create') {
    object(body, ['class_id','course_version_id','access_key','document','private_notes','expected_revision']);
    uuid(body.class_id); uuid(body.course_version_id); string(body.access_key, 400); integer(body.expected_revision, 0, 0);
  } else if (action === 'save') {
    object(body, ['expected_revision','document','private_notes']); integer(body.expected_revision);
  } else if (action === 'pin_course') {
    object(body, ['course_version_id','expected_assignment_id','reason']); uuid(body.course_version_id);
    if (body.expected_assignment_id !== null) uuid(body.expected_assignment_id); string(body.reason, 1000);
    return { class_id: pathId, ...body };
  } else if (action === 'approve') {
    object(body, ['expected_revision','checks','comment']); integer(body.expected_revision); string(body.comment, 2000);
    const names = ['curriculum','mathematics','accessibility','rights','student_safe']; object(body.checks, names);
    if (names.some(key => body.checks[key] !== true)) invalid();
  } else if (action === 'restore') {
    object(body, ['expected_revision','version_id']); integer(body.expected_revision); uuid(body.version_id);
  } else if (action === 'unpublish') {
    object(body, ['expected_revision','reason']); integer(body.expected_revision); string(body.reason, 1000);
  } else { object(body, ['expected_revision']); integer(body.expected_revision); }
  if (action === 'create' || action === 'save') string(body.private_notes, 20000, true);
  return pathId ? { lesson_id: pathId, ...body } : body;
}

function identity(lesson, version) {
  return { lesson_id: lesson.id, course_version_id: lesson.course_version_id, unit_id: lesson.unit_id, topic_id: lesson.topic_id,
    document_version: version.version_number, publication_revision: version.version_number };
}
function ensureRevision(result, expected) {
  if (!result?.lesson || result.lesson.head_revision !== expected) throw conflict();
}
function checkDraft(result, validator, mathEngine, key = 'head') {
  if (!result?.lesson || !result[key] || typeof result[key].private_notes !== 'string') throw unavailable();
  validator(result[key].document, { mathEngine, identity: identity(result.lesson, result[key]) });
}

function databaseError(error) {
  const code = String(error?.code || '');
  if (code === '28000' || code === 'PT401') return new ApiError(401, 'sign_in_required', 'An active ECHS school session is required.');
  if (code === '42501' || code === 'P0002') return new ApiError(404, 'lesson_unavailable', 'The requested lesson or class is not available to this account.');
  if (code === '40001' || code === '23505') return conflict();
  if (code === '22023') return new ApiError(422, 'invalid_request', 'The request does not match the lesson storage contract.');
  if (code === '23514') return new ApiError(409, 'invalid_transition', 'The current lesson state or class version does not permit this operation.');
  return unavailable();
}

function delivery(result, actor, payload, siteBase, mathEngine) {
  const b = result?.binding;
  if (!b || b.account_id !== actor.account_id || b.organization_id !== actor.organization_id || b.class_id !== payload.class_id ||
      result.lesson_id !== payload.lesson_id || result.class_id !== payload.class_id || !UUID.test(result.publication_id || '') ||
      !Number.isInteger(result.revision) || result.revision < 1 || !b.document || b.document.lesson_id !== payload.lesson_id ||
      b.document.publication_revision !== result.revision) throw unavailable();
  if (!['ap-calculus','ap-precalculus','ib-math-ai'].includes(b.course_key) || typeof b.access_key !== 'string') throw unavailable();
  if (typeof b.route_path !== 'string' || !/^lessons\/[A-Za-z0-9_./-]+\.html$/.test(b.route_path) || b.route_path.split('/').some(part => !part || part === '.' || part === '..')) throw unavailable();
  const route = new URL(b.route_path, siteBase);
  if (route.origin !== siteBase.origin || !route.pathname.startsWith(siteBase.pathname) || route.search || route.hash) throw unavailable();
  assertStudentDocument(result.document, { mathEngine, identity: b.document });
  // Explicit projection: no head, private_notes, review comments, history or RPC extras.
  return { ok: true, contract: LESSON_API_CONTRACT, lesson_id: result.lesson_id, class_id: result.class_id,
    publication_id: result.publication_id, revision: result.revision, document: result.document,
    binding: { account_id: b.account_id, organization_id: b.organization_id, class_id: b.class_id,
      course_key: b.course_key, access_key: b.access_key, route: route.href,
      document: { lesson_id: b.document.lesson_id, course_version_id: b.document.course_version_id,
        unit_id: b.document.unit_id, topic_id: b.document.topic_id, document_version: b.document.document_version,
        publication_revision: b.document.publication_revision } } };
}

/** The only browser-facing authorization input is the existing opaque school token. */
/**
 * @param {{rpc: (name: string, args: Record<string, unknown>) => Promise<{data: unknown, error: null | {code: string}}>, mathEngine: {version: string, renderToString: Function}, allowedOrigins?: string[], siteBase?: string, now?: () => number, bodyTimeoutMs?: number}} options
 */
export function createLessonHandler({ rpc, mathEngine, allowedOrigins = ['https://2ed944-cloud.github.io'], siteBase = 'https://2ed944-cloud.github.io/ECHS-Math/', now = () => Date.now(), bodyTimeoutMs = 10000 } = {}) {
  if (!Number.isInteger(bodyTimeoutMs) || bodyTimeoutMs < 1 || bodyTimeoutMs > 30000) throw new TypeError('A bounded request timeout is required.');
  if (typeof rpc !== 'function' || !mathEngine) throw new TypeError('Trusted database and math dependencies are required.');
  const base = new URL(siteBase);
  if (base.protocol !== 'https:' || base.search || base.hash || !base.pathname.endsWith('/')) throw new TypeError('A fixed HTTPS site base is required.');
  const origins = new Set(allowedOrigins);
  if (!origins.size || [...origins].some(origin => { try { return new URL(origin).origin !== origin || origin === '*'; } catch { return true; } })) throw new TypeError('Exact allowed origins are required.');
  return async function handle(req) {
    const origin = req.headers.get('origin');
    const headers = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store, private',
      'pragma': 'no-cache', 'vary': 'Origin, Authorization', 'x-content-type-options': 'nosniff',
      'access-control-allow-methods': 'GET, POST, OPTIONS', 'access-control-allow-headers': 'authorization, content-type',
      'access-control-max-age': '600' };
    if (origin && origins.has(origin)) headers['access-control-allow-origin'] = origin;
    const reply = (data, status = 200) => new Response(JSON.stringify(data), { status, headers });
    let inputValidation = false;
    try {
      if (origin && !origins.has(origin)) throw new ApiError(403, 'origin_forbidden', 'This origin is not permitted.');
      if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
      const target = route(req);
      const invoke = async (name, args) => {
        let result; try { result = await rpc(name, args); } catch { throw unavailable(); }
        if (!result || result.error) throw databaseError(result?.error);
        return result.data;
      };
      if (target.action === 'health') {
        const data = await invoke('lesson_store_health', {});
        if (data?.ok !== true || data.contract !== LESSON_API_CONTRACT) throw unavailable();
        return reply({ ok: true, service: 'lesson-api', contract: LESSON_API_CONTRACT });
      }
      const header = req.headers.get('authorization') || '';
      const token = /^Bearer ([^\s]{16,2048})$/.exec(header)?.[1];
      if (!token) throw new ApiError(401, 'sign_in_required', 'An active ECHS school session is required.');
      const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
      const tokenHash = [...new Uint8Array(digest)].map(n => n.toString(16).padStart(2, '0')).join('');
      const sessions = await invoke('api_session_lookup', { p_token_hash: tokenHash });
      const actor = Array.isArray(sessions) && sessions.length === 1 ? sessions[0] : null;
      if (!actor || !UUID.test(actor.account_id || '') || !UUID.test(actor.organization_id || '') || actor.status !== 'active' || !(Date.parse(actor.expires_at) > now())) {
        throw new ApiError(401, 'sign_in_required', 'An active ECHS school session is required.');
      }
      if (target.action === 'deliver' ? !['admin','teacher','student'].includes(actor.role) : !STAFF.has(actor.role)) {
        throw new ApiError(403, 'staff_required', 'This operation requires an authorized teacher or administrator.');
      }
      if (target.action === 'pin_course' && actor.role !== 'admin') throw new ApiError(403, 'admin_required', 'Only an administrator can assign a class course version.');
      const store = async (action, payload) => {
        const data = await invoke('lesson_store', { p_token_hash: tokenHash, p_action: action, p_payload: payload });
        if (data?.ok !== true || data.contract !== LESSON_API_CONTRACT) throw unavailable();
        return data;
      };
      let payload = target.payload;
      if (!payload) { inputValidation = true; payload = mutationPayload(target.action, await readJson(req, bodyTimeoutMs), target.pathId); inputValidation = false; }
      if (target.action === 'create') {
        const context = await store('context', { class_id: payload.class_id });
        const catalog = context.catalog?.find(row => row.access_key === payload.access_key);
        if (!catalog) throw new ApiError(404, 'lesson_unavailable', 'This lesson route is not available for the selected class.');
        inputValidation = true;
        uuid(payload.document?.lesson_id);
        assertPersistableDocument(payload.document, { mathEngine, identity: { lesson_id: payload.document.lesson_id,
          course_version_id: payload.course_version_id, unit_id: catalog.unit_id, topic_id: catalog.topic_id,
          document_version: 1, publication_revision: 1 } });
        inputValidation = false;
      }
      if (['save','approve','publish','restore'].includes(target.action)) {
        const current = await store(target.action === 'restore' ? 'version' : 'get', {
          lesson_id: payload.lesson_id, ...(target.action === 'restore' ? { version_id: payload.version_id } : {}) });
        ensureRevision(current, payload.expected_revision);
        if (target.action === 'save') {
          inputValidation = true;
          assertPersistableDocument(payload.document, { mathEngine, identity: identity(current.lesson, current.head) });
          const projected = projectedSnapshot(payload.document, payload.expected_revision + 1);
          assertPersistableDocument(projected, { mathEngine, identity: documentIdentity(projected) });
          inputValidation = false;
        } else if (target.action === 'restore') {
          checkDraft(current, assertPersistableDocument, mathEngine, 'version');
          inputValidation = true;
          const projected = projectedSnapshot(current.version.document, payload.expected_revision + 1);
          assertPersistableDocument(projected, { mathEngine, identity: documentIdentity(projected) });
          inputValidation = false;
        } else {
          checkDraft(current, assertPublishableDocument, mathEngine);
          if (target.action === 'publish') {
            inputValidation = true;
            const projected = projectedSnapshot(current.head.document, payload.expected_revision + 1, true);
            assertStudentDocument(projected, { mathEngine, identity: documentIdentity(projected) });
            inputValidation = false;
          }
          payload.validated_version_id = current.head.id;
        }
      }
      const data = await store(target.action, payload);
      if (target.action === 'deliver') return reply(delivery(data, actor, payload, base, mathEngine));
      if (data.head) checkDraft(data, assertPersistableDocument, mathEngine);
      if (data.version) checkDraft(data, assertPersistableDocument, mathEngine, 'version');
      return reply(data, target.action === 'create' ? 201 : 200);
    } catch (error) {
      if (error?.name === 'LessonDocumentError') {
        if (inputValidation && error.errors?.some(issue => issue.code === 'persisted-size-limit')) {
          return reply({ ok: false, error: { code: 'document_too_large', message: 'The stored lesson document must fit within 1 MiB of compact JSON.' } }, 413);
        }
        const status = inputValidation ? 422 : 503;
        return reply({ ok: false, error: { code: inputValidation ? 'invalid_lesson_document' : 'invalid_stored_document',
          message: inputValidation ? 'The lesson document failed validation.' : 'The stored lesson cannot be delivered or published safely.' } }, status);
      }
      const safe = error instanceof ApiError ? error : unavailable();
      return reply({ ok: false, error: { code: safe.code, message: safe.message } }, safe.status);
    }
  };
}
