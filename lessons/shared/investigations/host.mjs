import {resolveInvestigationHost} from './host-manifest.mjs';

const OWNERS = ['kind','organization_id','account_id','role','status','expires_at','epoch','session_id'];
const ROLES = ['student','teacher','admin'];
const siteRoot = new URL('../../../', import.meta.url);
const stripHash = href => { const url = new URL(href); url.hash = ''; return url.href; };
const sameOwner = (left, right) => left && right && OWNERS.every(key => left[key] === right[key]);

// The optional window/loader are local test seams. Authorization always comes
// from the existing portal and canonical owner authority, never activity data.
export function startInvestigationHost({window:win = globalThis.window,
  loadWorkspace = () => import('./workspace.mjs'), baseURL = siteRoot} = {}) {
  if (!win?.document) return Object.freeze({dispose(){}});
  const doc = win.document;
  const spec = resolveInvestigationHost(win.location.href, baseURL);
  if (!spec) return Object.freeze({dispose(){}});
  const route = stripHash(win.location.href);
  const removers = [];
  let disposed = false, starting = false, owner, authority, portal, access;
  let unsubscribe, observer, deadline, host, button, dialog, ui, workspacePromise;
  let cycle = 0, opening = false;
  const on = (target, event, callback, options) => {
    target.addEventListener(event, callback, options);
    removers.push(() => target.removeEventListener(event, callback, options));
  };
  const el = (tag, text, className) => {
    const node = doc.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (className) node.className = className;
    return node;
  };
  const close = () => {
    cycle++; opening = false;
    const current = ui; ui = null;
    try { current?.dispose(); } finally {
      try { if (dialog?.open) dialog.close(); } finally {
        dialog?.replaceChildren();
        dialog?.removeAttribute('aria-labelledby');
        if (!disposed && button?.isConnected) button.focus();
      }
    }
  };
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    win.clearTimeout(deadline);
    observer?.disconnect();
    try { unsubscribe?.(); } catch { /* Continue owned cleanup. */ }
    for (const remove of removers.splice(0)) {
      try { remove(); } catch { /* Continue owned cleanup. */ }
    }
    try { close(); } catch { /* Detach owned UI even if a renderer fails. */ }
    host?.remove(); dialog?.remove();
  };
  const allowed = () => {
    try {
      if (disposed || !owner || win.ECHSInstitution?.ownerAuthority !== authority || win.ECHSPortalAccess !== portal ||
          stripHash(win.location.href) !== route || doc.documentElement.dataset.lessonGate !== 'allowed' ||
          doc.documentElement.dataset.echsLessonCourse !== spec.course) return false;
      const current = authority.capture();
      if (disposed || !sameOwner(owner, current) || current.kind !== 'account' || current.status !== 'active' ||
          !ROLES.includes(current.role) || !Number.isSafeInteger(current.expires_at) || current.expires_at <= Date.now() ||
          !access?.authenticated || access.role !== current.role || access.current?.id !== current.account_id) return false;
      const queryCourse = new URL(win.location.href).searchParams.get('course');
      if (queryCourse && (portal.normaliseCourseKey?.(queryCourse) || queryCourse) !== spec.course) return false;
      if (current.role === 'student' && portal.courseAllowed?.(spec.course, access) !== true) return false;
      const finalOwner = authority.capture();
      return !disposed && sameOwner(owner, finalOwner);
    } catch { return false; }
  };
  const verify = () => { if (allowed()) return true; dispose(); return false; };
  const open = async () => {
    if (!verify() || opening || dialog.open || button.disabled) return;
    opening = true;
    const ticket = ++cycle;
    const status = el('p', 'Loading investigation…', 'ei-status');
    status.setAttribute('role', 'status');
    const cancel = el('button', 'Close investigation', 'ei-close');
    cancel.type = 'button'; cancel.addEventListener('click', close, {once:true});
    dialog.replaceChildren(status, cancel);
    dialog.removeAttribute('aria-labelledby');
    try {
      dialog.showModal();
      cancel.focus();
      workspacePromise ||= Promise.resolve().then(loadWorkspace);
      const module = await workspacePromise;
      if (disposed || ticket !== cycle || !dialog.open || !verify()) return;
      if (typeof module?.mountInvestigation !== 'function') throw new Error('workspace-unavailable');
      const mounted = module.mountInvestigation({dialog, key:spec.key, window:win, onClose:close});
      if (!mounted || typeof mounted.dispose !== 'function') throw new Error('workspace-unavailable');
      if (disposed || ticket !== cycle || !dialog.open || !verify()) { mounted.dispose(); return; }
      ui = mounted;
    } catch {
      if (!disposed && ticket === cycle && verify()) {
        workspacePromise = null;
        status.textContent = 'The investigation is unavailable. Continue with the lesson or try again.';
        dialog.replaceChildren(status, cancel);
      }
    } finally { if (ticket === cycle) opening = false; }
  };
  const install = () => {
    if (!verify()) return;
    host = el('div', undefined, 'ei-host');
    host.dataset.eiHost = spec.key;
    button = el('button', 'Explore this idea', 'ei-launch');
    button.type = 'button'; button.setAttribute('aria-haspopup', 'dialog');
    dialog = el('dialog', undefined, 'ei-dialog');
    dialog.setAttribute('aria-label', 'Mathematics investigation');
    host.append(button);
    // These nodes are outside every original deck and the IB #app render root.
    doc.body.append(host, dialog);
    if (typeof dialog.showModal !== 'function' || typeof dialog.close !== 'function') {
      button.disabled = true;
      host.append(el('p', 'Interactive investigations need a browser with dialog support. The full lesson remains available.', 'ei-status'));
    } else {
      on(button, 'click', open);
      on(dialog, 'close', () => { if (!dialog.open) close(); });
      on(dialog, 'keydown', event => event.stopPropagation());
      for (const type of ['click','input','change','keydown','pointerdown']) {
        on(dialog, type, event => {
          if (!verify()) { event.preventDefault(); event.stopImmediatePropagation(); }
        }, true);
      }
    }
    const cssURL = new URL('./investigations.css', import.meta.url).href;
    if (![...doc.querySelectorAll('link[rel="stylesheet"]')].some(link => link.href === cssURL)) {
      const css = el('link'); css.rel = 'stylesheet'; css.href = cssURL; doc.head.append(css);
    }
    win.clearTimeout(deadline);
  };
  const attempt = async () => {
    if (disposed || starting || host || doc.documentElement.dataset.lessonGate !== 'allowed') return;
    authority = win.ECHSInstitution?.ownerAuthority;
    portal = win.ECHSPortalAccess;
    if (!authority?.subscribe || !authority.capture || !portal?.ready) return;
    starting = true;
    try {
      unsubscribe = authority.subscribe(dispose);
      if (disposed) { unsubscribe?.(); return; }
      owner = authority.capture();
      access = await portal.ready;
      if (!disposed) install();
    } catch { dispose(); }
  };
  observer = new win.MutationObserver(() => {
    if (host || owner) { if (!allowed()) dispose(); } else void attempt();
  });
  observer.observe(doc.documentElement, {attributes:true, attributeFilter:['data-lesson-gate','data-echs-lesson-course']});
  on(win, 'pagehide', dispose);
  on(win, 'popstate', () => { if (host || owner) verify(); else if (stripHash(win.location.href) !== route) dispose(); });
  on(win, 'hashchange', () => { if (host || owner) verify(); });
  on(win, 'focus', () => { if (host || owner) verify(); else void attempt(); });
  on(doc, 'DOMContentLoaded', () => void attempt(), {once:true});
  deadline = win.setTimeout(dispose, 15000);
  void attempt();
  return Object.freeze({dispose});
}

if (globalThis.window?.document) startInvestigationHost();
