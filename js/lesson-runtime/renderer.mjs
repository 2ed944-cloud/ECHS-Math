import {assertPublicLessonDocument, assertLessonDocument, LESSON_DOCUMENT_LIMITS} from './schema.mjs';

const EDITABLE = 'input,textarea,select,button,a,[contenteditable="true"]';
const mountedLessonRoots = new WeakMap();

export function resolveSlideIndex(hash, slides) {
  const raw = String(hash || '').replace(/^#/, '');
  let key;
  try { key = decodeURIComponent(raw.startsWith('slide=') ? raw.slice(6) : raw); }
  catch { return 0; }
  const byId = slides.findIndex(slide => slide.id === key);
  if (byId >= 0) return byId;
  if (/^[1-9]\d*$/.test(key)) return Math.min(Number(key), slides.length) - 1;
  const legacy = /^s([1-9]\d*)$/.exec(key);
  return legacy ? Math.min(Number(legacy[1]), slides.length) - 1 : 0;
}

export function slideHref(href, index) {
  const next = new URL(href);
  next.hash = `slide=${index + 1}`;
  return next.href;
}

// This bridge consumes the existing server-backed access decision. It does not
// create a second permission system or fetch private/persisted lesson documents.
async function waitForExistingAccess(win, timeoutMs) {
  if (!win.ECHSPortalAccess?.ready || !win.ECHSInstitution) throw new Error('Open this lesson through the ECHS learning pathway.');
  const access = await new Promise((resolve, reject) => {
    const timer = win.setTimeout(() => reject(new Error('The ECHS account check timed out.')), timeoutMs);
    Promise.resolve(win.ECHSPortalAccess.ready).then(resolve, reject).finally(() => win.clearTimeout(timer));
  });
  if (!access?.authenticated || !['student','teacher','admin'].includes(access.role)) throw new Error('ECHS course access is required.');
  const owner = win.ECHSInstitution.account()?.id;
  const token = win.ECHSInstitution.token?.();
  if (typeof token !== 'string' || !token) throw new Error('An active ECHS session is required.');
  if (!owner || owner !== access.current?.id) throw new Error('Your account changed. Reopen the lesson through ECHS.');
  const root = win.document.documentElement;
  if (root.dataset.lessonGate !== 'allowed') {
    await new Promise((resolve, reject) => {
      const observer = new win.MutationObserver(() => {
        if (root.dataset.lessonGate === 'allowed') { cleanup(); resolve(); }
      });
      const timer = win.setTimeout(() => { cleanup(); reject(new Error('The ECHS lesson access check has not allowed this lesson.')); }, timeoutMs);
      const cleanup = () => { observer.disconnect(); win.clearTimeout(timer); };
      observer.observe(root, {attributes:true, attributeFilter:['data-lesson-gate']});
    });
  }
  if (win.ECHSInstitution.account()?.id !== owner || win.ECHSInstitution.token?.() !== token) throw new Error('Your account changed. Reopen the lesson through ECHS.');
  return {owner, token, access};
}

// Supplied by the trusted host integration, never inferred from a lesson payload.
// A later persistence API must establish this binding from its authorized record.
function validateHostBinding(binding, lesson, win) {
  if (!binding || !binding.document || typeof binding.route !== 'string' || typeof binding.course_key !== 'string' || !binding.course_key) throw new Error('An authorized host document binding is required.');
  const route = new URL(binding.route);
  const current = new URL(win.location.href); current.hash = ''; route.hash = '';
  if (route.href !== current.href) throw new Error('The authorized lesson route does not match this page.');
  for (const key of ['lesson_id','course_version_id','unit_id','topic_id','document_version']) if (binding.document[key] !== lesson[key]) throw new Error(`The authorized document ${key} does not match.`);
  if (binding.document.publication_revision !== lesson.publication.revision) throw new Error('The authorized publication revision does not match.');
  if (win.document.documentElement.dataset.echsLessonCourse !== binding.course_key) throw new Error('The released course does not match the authorized document.');
  return Object.freeze({route:route.href,course_key:binding.course_key});
}

export async function mountLesson({root, lesson, binding, enabled = false, window:win = window, mathEngine = win.katex, accessTimeoutMs = 10000} = {}) {
  if (enabled !== true) return Object.freeze({mode:'legacy', href:win.location.href, dispose(){}});
  if (!root || root.ownerDocument !== win.document) throw new TypeError('A lesson mount in the current document is required.');
  const owner = await waitForExistingAccess(win, accessTimeoutMs);
  assertPublicLessonDocument(lesson, {mathEngine});
  return mountValidatedLesson({root, lesson, binding, win, mathEngine, owner});
}

// Only the two explicit entry points can reach this renderer. There is no public
// audience override or caller-provided "authorized" document shortcut.
function mountValidatedLesson({root, lesson, binding, win, mathEngine, owner, scopeAllowed = () => true}) {
  const host = validateHostBinding(binding, lesson, win);
  let currentAccess = owner.access;
  const data = JSON.parse(JSON.stringify(lesson));
  const doc = win.document;
  const listeners = [];
  let disposed = false;
  let mountRecord;
  const on = (target, type, handler) => { target.addEventListener(type, handler); listeners.push(() => target.removeEventListener(type, handler)); };
  const el = (tag, text, className) => { const node = doc.createElement(tag); if (text !== undefined) node.textContent = text; if (className) node.className = className; return node; };
  const currentRoute = () => { const url = new URL(win.location.href); url.hash = ''; return url.href; };
  const allowedRole = () => currentAccess?.authenticated && ['student','teacher','admin'].includes(currentAccess.role) && currentAccess.current?.id === owner.owner && (currentAccess.role !== 'student' || win.ECHSPortalAccess.courseAllowed?.(host.course_key,currentAccess) === true);
  const stillAllowed = () => !disposed && allowedRole() && scopeAllowed() && currentRoute() === host.route && doc.documentElement.dataset.lessonGate === 'allowed' && doc.documentElement.dataset.echsLessonCourse === host.course_key && win.ECHSInstitution.account()?.id === owner.owner && win.ECHSInstitution.token?.() === owner.token;
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    for (const remove of listeners.splice(0)) remove();
    if (mountedLessonRoots.get(root) === mountRecord) {mountedLessonRoots.delete(root); root.replaceChildren();}
  };
  const verify = () => { if (stillAllowed()) return true; dispose(); return false; };
  function math(content) {
    const span = el(content.display ? 'div' : 'span', undefined, 'echsDocumentMath');
    span.setAttribute('role', 'math'); span.setAttribute('aria-label', content.spoken);
    mathEngine.render(content.tex, span, {displayMode:Boolean(content.display), throwOnError:true, trust:false, strict:'error', output:'htmlAndMathml', maxExpand:100, maxSize:10});
    return span;
  }
  function paragraphs(content) {
    const group = el('div');
    for (const paragraph of content.paragraphs) {
      const p = el('p');
      for (const inline of paragraph.children) {
        let child = inline.type === 'math' ? math(inline) : doc.createTextNode(inline.text);
        for (const mark of inline.marks || []) { const wrap = el(mark); wrap.append(child); child = wrap; }
        p.append(child);
      }
      group.append(p);
    }
    return group;
  }
  function blockNode(block) {
    if (block.type === 'rich-text') return paragraphs(block.content);
    if (block.type === 'math') return math(block.content);
    if (block.type === 'callout') {
      const aside = el('aside', undefined, `echsDocumentCallout ${block.content.kind}`);
      const heading = el('h3', block.content.title); heading.id = `echs-block-${block.id}`;
      aside.setAttribute('aria-labelledby', heading.id); aside.append(heading, paragraphs(block.content.body)); return aside;
    }
    if (block.type === 'legacy-embedded') {
      const aside = el('aside', undefined, 'echsDocumentCallout');
      const repositoryRoot = new URL('../../', import.meta.url);
      const destination = new URL(block.content.source, repositoryRoot);
      if (destination.origin !== win.location.origin || destination.pathname !== win.location.pathname) throw new Error('A legacy reference must belong to this authorized lesson route.');
      destination.search = new URL(win.location.href).search; destination.hash = block.content.anchor;
      const link = el('a', 'Open the existing interactive lesson'); link.href = destination.href;
      aside.append(el('p', block.content.summary), link); return aside;
    }
    throw new Error(`No renderer for ${block.type}@${block.version}`);
  }
  const shell = el('section', undefined, 'echsDocument');
  shell.setAttribute('aria-label', data.title); shell.lang = data.accessibility.language;
  const heading = el('h1', data.title); shell.append(heading, el('p', data.accessibility.summary, 'echsDocumentSummary'));
  const stage = el('div', undefined, 'echsDocumentStage');
  const sections = data.slides.map((slide, index) => {
    const section = el('section', undefined, `echsDocumentSlide layout-${slide.layout}`);
    const title = el('h2', slide.title); title.id = `echs-slide-${slide.id}`; title.tabIndex = -1;
    section.setAttribute('aria-labelledby', title.id); section.dataset.slideIndex = String(index);
    const body = el('div', undefined, 'echsDocumentBlocks');
    for (const block of slide.blocks) body.append(blockNode(block));
    section.append(title, body); stage.append(section); return section;
  });
  const nav = el('nav', undefined, 'echsDocumentNavigation'); nav.setAttribute('aria-label','Lesson slides');
  const previous = el('button','Previous'); previous.type = 'button';
  const next = el('button','Next'); next.type = 'button';
  const label = el('label','Slide'); label.htmlFor = 'echs-document-slide-select';
  const select = el('select'); select.id = 'echs-document-slide-select';
  data.slides.forEach((slide, index) => { const option = el('option',`${index + 1}. ${slide.title}`); option.value = String(index); select.append(option); });
  const status = el('p',undefined,'echsDocumentStatus'); status.setAttribute('role','status'); status.setAttribute('aria-live','polite');
  const finish = el('button','Continue to lesson practice'); finish.type='button'; finish.dataset.documentAction='finish';
  nav.append(previous, label, select, next); shell.append(stage, nav, status, finish);
  let index = resolveSlideIndex(win.location.hash, data.slides);
  function show(value, {focus = true, updateUrl = true} = {}) {
    if (!verify()) return;
    if (!Number.isInteger(value)) throw new TypeError('Slide index must be an integer.');
    index = Math.max(0, Math.min(sections.length - 1, value));
    sections.forEach((section, i) => { section.hidden = i !== index; });
    previous.disabled = index === 0; next.disabled = index === sections.length - 1; select.value = String(index);
    status.textContent = `Slide ${index + 1} of ${sections.length}: ${data.slides[index].title}`;
    if (updateUrl) win.history.replaceState(null, '', slideHref(win.location.href, index));
    if (focus) sections[index].querySelector('h2').focus();
  }
  on(previous,'click',() => show(index - 1)); on(next,'click',() => show(index + 1));
  on(select,'change',() => show(Number(select.value)));
  on(shell,'keydown',event => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.target.closest?.(EDITABLE)) return;
    const values = {ArrowRight:index+1,ArrowLeft:index-1,PageDown:index+1,PageUp:index-1,Home:0,End:sections.length-1};
    if (Object.hasOwn(values,event.key)) { event.preventDefault(); show(values[event.key]); }
  });
  on(win,'hashchange',() => show(resolveSlideIndex(win.location.hash,data.slides),{updateUrl:false}));
  on(finish,'click',() => {
    if (!verify()) return;
    const original = doc.querySelector('[data-finish-lesson]');
    if (original && !original.disabled) original.click();
    else status.textContent = 'Open the lesson from your learning pathway to continue to its practice.';
  });
  on(win,'storage',verify); on(win,'pageshow',verify);
  on(doc,'echs:institution-signed-out',dispose); on(doc,'echs:institution-auth-error',dispose);
  on(doc,'echs:portal-access',event => { currentAccess = event.detail; verify(); });
  const gateObserver = new win.MutationObserver(verify);
  gateObserver.observe(doc.documentElement, {attributes:true, attributeFilter:['data-lesson-gate','data-echs-lesson-course']});
  listeners.push(() => gateObserver.disconnect());
  mountRecord = Object.freeze({mode:'document', get slideIndex(){return index;}, goTo:show, dispose});
  mountedLessonRoots.get(root)?.dispose();
  mountedLessonRoots.set(root,mountRecord);
  root.replaceChildren(shell); show(index,{focus:false,updateUrl:false});
  return mountRecord;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const INSTITUTIONAL_CONTRACT = 'echs.lesson.store.v1';
const MAX_ENVELOPE_BYTES = LESSON_DOCUMENT_LIMITS.maxBytes + 16384;
const pendingInstitutionalMounts = new WeakMap();
const envelopeError = () => new Error('The institutional lesson response does not match its authorized delivery contract.');

function exactKeys(value, keys) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype) throw envelopeError();
  const actual = Object.keys(value);
  if (actual.length !== keys.length || keys.some(key => !Object.hasOwn(value, key))) throw envelopeError();
}

function configuredEndpoint(config) {
  if (config?.enabled !== true || config.configuration_error || typeof config.api_base !== 'string' ||
      config.api_base.trim() !== config.api_base || !/^https:\/\/[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.supabase\.co\/functions\/v1\/?$/i.test(config.api_base)) {
    throw new Error('A trusted institutional lesson service is not configured.');
  }
  const api = new URL(config.api_base);
  const site = new URL(config.site_base);
  if (site.protocol !== 'https:' || site.username || site.password || site.port || site.search || site.hash || !site.pathname.endsWith('/')) {
    throw new Error('The institutional lesson site is not configured.');
  }
  return {api:api.href.replace(/\/$/, ''), site:site.href};
}

async function readInstitutionalEnvelope(response, requestUrl, signal) {
  if (response.status !== 200 || !response.ok || response.redirected || response.url !== requestUrl ||
      !/^application\/json(?:\s*;|$)/i.test(response.headers.get('content-type') || '')) throw envelopeError();
  const declared = response.headers.get('content-length');
  if (declared !== null && (!/^\d+$/.test(declared) || Number(declared) > MAX_ENVELOPE_BYTES)) throw envelopeError();
  if (!response.body?.getReader) throw envelopeError();
  const reader = response.body.getReader();
  const cancel = () => {void reader.cancel().catch(() => {});};
  signal.addEventListener('abort', cancel, {once:true});
  const decoder = new TextDecoder('utf-8', {fatal:true});
  let size = 0, text = '', complete = false;
  try {
    while (true) {
      signal.throwIfAborted();
      const chunk = await reader.read();
      signal.throwIfAborted();
      if (chunk.done) break;
      size += chunk.value.byteLength;
      if (size > MAX_ENVELOPE_BYTES) throw envelopeError();
      text += decoder.decode(chunk.value, {stream:true});
    }
    text += decoder.decode(); complete = true;
    return JSON.parse(text);
  } finally {
    signal.removeEventListener('abort', cancel);
    if (!complete) void reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}

function institutionalBinding(payload, {lessonId, classId, accountId, organizationId, route, site, win, mathEngine}) {
  exactKeys(payload, ['ok','contract','lesson_id','class_id','publication_id','revision','document','binding']);
  if (payload.ok !== true || payload.contract !== INSTITUTIONAL_CONTRACT || payload.lesson_id !== lessonId ||
      payload.class_id !== classId || !UUID.test(payload.publication_id) || !Number.isSafeInteger(payload.revision) || payload.revision < 1) throw envelopeError();
  const binding = payload.binding;
  exactKeys(binding, ['account_id','organization_id','class_id','course_key','access_key','route','document']);
  exactKeys(binding.document, ['lesson_id','course_version_id','unit_id','topic_id','document_version','publication_revision']);
  if (binding.account_id !== accountId || binding.organization_id !== organizationId || binding.class_id !== classId ||
      typeof binding.course_key !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(binding.course_key) || binding.course_key.length > 160 ||
      typeof binding.access_key !== 'string' || !binding.access_key || binding.access_key.length > 512 || /[\u0000-\u001f\u007f]/.test(binding.access_key)) throw envelopeError();
  if (typeof binding.route !== 'string' || /[?#]/.test(binding.route)) throw envelopeError();
  const destination = new URL(binding.route);
  const current = new URL(route);
  const configuredSite = new URL(site);
  if (destination.href !== binding.route || destination.username || destination.password || destination.search || destination.hash ||
      destination.origin !== configuredSite.origin || !destination.pathname.startsWith(configuredSite.pathname) ||
      destination.origin !== current.origin || destination.pathname !== current.pathname ||
      current.searchParams.getAll('accessKey').length !== 1 || current.searchParams.get('accessKey') !== binding.access_key) throw envelopeError();
  assertLessonDocument(payload.document, {mathEngine:mathEngine ?? null});
  if (payload.document.publication.status !== 'published' || payload.document.publication.audience !== 'institutional' ||
      payload.document.lesson_id !== lessonId || payload.document.publication.revision !== payload.revision ||
      payload.document.slides.some(slide => slide.blocks.some(block => !['rich-text','math','callout'].includes(block.type)))) throw envelopeError();
  const host = {course_key:binding.course_key, route, document:binding.document};
  validateHostBinding(host, payload.document, win);
  return host;
}

/**
 * Fetch a published institutional lesson through the existing account boundary.
 * This opt-in entry point never accepts a document, binding, or endpoint from
 * its caller. Server authorization remains authoritative; no data is persisted.
 */
export async function mountInstitutionalLesson({root, lessonId, classId, enabled = false, window:win = window,
  mathEngine = win.katex, accessTimeoutMs = 10000, requestTimeoutMs = 10000, signal} = {}) {
  if (enabled !== true) return Object.freeze({mode:'legacy', href:win.location.href, dispose(){}});
  if (!root || root.ownerDocument !== win.document) throw new TypeError('A lesson mount in the current document is required.');
  if (!UUID.test(lessonId) || !UUID.test(classId)) throw new TypeError('A lesson and class identity are required.');
  if (![accessTimeoutMs,requestTimeoutMs].every(value => Number.isInteger(value) && value >= 1 && value <= 30000)) throw new TypeError('Lesson request timeouts must be bounded.');
  const client = win.ECHSInstitution;
  const account = client?.account?.();
  const accountId = account?.id, organizationId = account?.organization_id, role = account?.role, token = client?.token?.();
  if (!UUID.test(accountId) || !UUID.test(organizationId) || !['student','teacher','admin'].includes(role) || typeof token !== 'string' || !token || typeof client?.config !== 'function') {
    throw new Error('An active institutional course account is required.');
  }
  const routeUrl = new URL(win.location.href); routeUrl.hash = '';
  const route = routeUrl.href;
  const currentRoute = () => {const url = new URL(win.location.href); url.hash = ''; return url.href;};
  const sessionMatches = () => win.ECHSInstitution === client && client.account()?.id === accountId &&
    client.account()?.organization_id === organizationId && client.account()?.role === role && client.token?.() === token && currentRoute() === route;
  const controller = new win.AbortController();
  const abort = message => controller.abort(new Error(message));
  pendingInstitutionalMounts.get(root)?.abort(new Error('A newer institutional lesson request replaced this request.'));
  pendingInstitutionalMounts.set(root, controller);
  const cleanups = [];
  const on = (target, type, handler) => {target.addEventListener(type, handler); cleanups.push(() => target.removeEventListener(type, handler));};
  const changed = () => {if (!sessionMatches()) abort('Your institutional lesson account or route changed.');};
  on(win, 'storage', changed); on(win, 'pageshow', changed);
  on(win.document, 'echs:institution-signed-out', () => abort('Your institutional session ended.'));
  on(win.document, 'echs:institution-auth-error', () => abort('Your institutional session is no longer authorized.'));
  let accessReady = false, courseKey;
  const accessChanged = event => {
    const access = event.detail;
    if (!access?.authenticated || access.current?.id !== accountId || access.current?.organization_id !== organizationId || access.role !== role ||
        (accessReady && role === 'student' && win.ECHSPortalAccess.courseAllowed?.(courseKey,access) !== true)) abort('Institutional course access changed.');
  };
  on(win.document, 'echs:portal-access', accessChanged);
  const observer = new win.MutationObserver(() => {
    if (accessReady && (win.document.documentElement.dataset.lessonGate !== 'allowed' || win.document.documentElement.dataset.echsLessonCourse !== courseKey)) abort('Institutional lesson access changed.');
  });
  observer.observe(win.document.documentElement, {attributes:true, attributeFilter:['data-lesson-gate','data-echs-lesson-course']});
  cleanups.push(() => observer.disconnect());
  if (signal) {
    const cancelled = () => abort('The institutional lesson request was cancelled.');
    if (signal.aborted) cancelled(); else {signal.addEventListener('abort', cancelled, {once:true}); cleanups.push(() => signal.removeEventListener('abort',cancelled));}
  }
  const timer = win.setTimeout(() => abort('The institutional lesson request timed out.'), requestTimeoutMs);
  let rejectAborted;
  const aborted = new Promise((_, reject) => {rejectAborted = () => reject(controller.signal.reason); controller.signal.addEventListener('abort', rejectAborted, {once:true});});
  if (controller.signal.aborted) rejectAborted();
  const assertCurrent = () => {controller.signal.throwIfAborted(); if (!sessionMatches()) throw new Error('Your institutional lesson account or route changed.');};
  try {
    return await Promise.race([aborted, (async () => {
      assertCurrent();
      const owner = await waitForExistingAccess(win, accessTimeoutMs);
      assertCurrent();
      courseKey = win.document.documentElement.dataset.echsLessonCourse; accessReady = true;
      if (role === 'student' && win.ECHSPortalAccess.courseAllowed?.(courseKey,owner.access) !== true) throw new Error('An assigned institutional course is required.');
      const config = await client.config(); assertCurrent();
      const endpoint = configuredEndpoint(config);
      const configuredApi = config.api_base, configuredSite = config.site_base;
      const configMatches = () => config.enabled === true && !config.configuration_error && config.api_base === configuredApi && config.site_base === configuredSite;
      const url = `${endpoint.api}/lesson-api/lessons/${lessonId}/published?class_id=${encodeURIComponent(classId)}`;
      const response = await win.fetch(url, {method:'GET', headers:{Accept:'application/json',Authorization:`Bearer ${token}`},
        mode:'cors', credentials:'omit', cache:'no-store', redirect:'error', referrerPolicy:'no-referrer', signal:controller.signal});
      assertCurrent(); if (!configMatches()) throw new Error('Institutional lesson configuration changed.');
      const payload = await readInstitutionalEnvelope(response, url, controller.signal);
      assertCurrent(); if (!configMatches()) throw new Error('Institutional lesson configuration changed.');
      const binding = institutionalBinding(payload, {lessonId,classId,accountId,organizationId,route,site:endpoint.site,win,mathEngine});
      assertCurrent();
      return mountValidatedLesson({root,lesson:payload.document,binding,win,mathEngine,owner,scopeAllowed:() => sessionMatches() && configMatches()});
    })()]);
  } catch (error) {
    controller.abort(error);
    throw error;
  } finally {
    win.clearTimeout(timer); controller.signal.removeEventListener('abort', rejectAborted);
    for (const cleanup of cleanups) cleanup();
    if (pendingInstitutionalMounts.get(root) === controller) pendingInstitutionalMounts.delete(root);
  }
}
