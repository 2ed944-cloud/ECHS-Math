// C04 owner-storage foundation. Data adoption is explicit; ownership is not grading authority.
export const OWNER_STORAGE_CONTRACT = 'echs.owner-storage.v1';
export const OWNER_AUTHORITY_CONTRACT = 'echs.owner-authority.v1';
export const OWNER_DOMAINS = Object.freeze([
  'profile', 'attempts', 'mastery', 'reviews', 'sessions', 'continue',
  'achievements', 'streak', 'classes', 'assignments', 'submissions', 'settings',
  'lesson-activity', 'bank-attempts', 'completions', 'sync-queue',
]);
export const OWNER_LIMITS = Object.freeze({ itemBytes: 4 * 1024 * 1024,
  exportBytes: 20 * 1024 * 1024, items: 1000, nodes: 100000, depth: 24 });
const encoder = new TextEncoder();
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const opaque = /^[A-Za-z0-9_-]{16,128}$/;
const itemPattern = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;
const forbidden = new Set(['__proto__', 'prototype', 'constructor']);

export class OwnerStorageError extends Error {
  constructor(code) { super(`Owner storage unavailable: ${code}`); this.name = 'OwnerStorageError'; this.code = code; }
}
const fail = code => { throw new OwnerStorageError(code); };
const closed = (object, keys) => {
  if (!object || Array.isArray(object) || typeof object !== 'object' ||
      Object.keys(object).length !== keys.length || keys.some(key => !Object.hasOwn(object, key))) fail('invalid_input');
};

// Read data descriptors only. Do not invoke accessors/toJSON or trust prototypes.
function cloneJSON(value, byteLimit = OWNER_LIMITS.itemBytes) {
  let nodes = 0, bytes = 0;
  const active = new Set();
  function charge(length) { if ((bytes += length) > byteLimit) fail('data_bounds'); }
  function copy(input, depth) {
    if (++nodes > OWNER_LIMITS.nodes || depth > OWNER_LIMITS.depth) fail('data_bounds');
    if (input === null || typeof input === 'boolean') { charge(String(input).length); return input; }
    if (typeof input === 'string') {
      if (input.length > byteLimit) fail('data_bounds');
      charge(encoder.encode(JSON.stringify(input)).byteLength);
      return input;
    }
    if (typeof input === 'number') { if (!Number.isFinite(input)) fail('invalid_data'); charge(JSON.stringify(input).length); return input; }
    if (typeof input !== 'object' || active.has(input)) fail('invalid_data');
    const array = Array.isArray(input), proto = Object.getPrototypeOf(input);
    if (proto !== (array ? Array.prototype : Object.prototype) && !(proto === null && !array)) fail('invalid_data');
    const keys = Reflect.ownKeys(input);
    if (keys.length > OWNER_LIMITS.nodes + (array ? 1 : 0)) fail('data_bounds');
    if (keys.some(key => typeof key !== 'string' || forbidden.has(key))) fail('invalid_data');
    const descriptors = Object.getOwnPropertyDescriptors(input);
    if (array && (keys.length !== input.length + 1 || input.length > OWNER_LIMITS.nodes)) fail('invalid_data');
    active.add(input);
    charge(2); let count = 0;
    const result = array ? [] : {};
    for (const key of keys) {
      if (array && key === 'length') continue;
      const descriptor = descriptors[key];
      if (!Object.hasOwn(descriptor, 'value') || !descriptor.enumerable ||
          (array && (!/^(0|[1-9][0-9]*)$/.test(key) || Number(key) >= input.length))) fail('invalid_data');
      if (count++) charge(1);
      if (!array) charge(encoder.encode(JSON.stringify(key)).byteLength + 1);
      result[key] = copy(descriptor.value, depth + 1);
    }
    active.delete(input);
    return result;
  }
  try {
    const result = copy(value, 0);
    if (encoder.encode(JSON.stringify(result)).byteLength > byteLimit) fail('data_bounds');
    return result;
  } catch (error) {
    if (error instanceof OwnerStorageError) throw error;
    fail('invalid_data');
  }
}

function identity(value, clock) {
  const result = cloneJSON(value, 4096);
  if (result?.kind === 'guest') closed(result, ['kind', 'epoch', 'session_id']);
  else {
    closed(result, ['kind', 'organization_id', 'account_id', 'role', 'status', 'expires_at', 'session_id', 'epoch']);
    if (result.kind !== 'account' || !uuid.test(result.organization_id) || !uuid.test(result.account_id) ||
        !['student', 'teacher', 'admin', 'parent'].includes(result.role) || result.status !== 'active' ||
        !Number.isSafeInteger(result.expires_at) || result.expires_at <= clock()) fail('authority_unavailable');
  }
  if (!Number.isSafeInteger(result.epoch) || result.epoch < 0 || !opaque.test(result.session_id)) fail('authority_unavailable');
  return Object.freeze(result);
}
function sameIdentity(left, right) {
  return Object.keys(left).length === Object.keys(right).length && Object.keys(left).every(key => left[key] === right[key]);
}
function domainInput(input) {
  const value = cloneJSON(input, 1024); closed(value, ['domain', 'revision']);
  if (!OWNER_DOMAINS.includes(value.domain) || value.revision !== 1) fail('invalid_domain');
  return value;
}
function itemInput(item) {
  if (typeof item !== 'string' || !itemPattern.test(item) || forbidden.has(item)) fail('invalid_item');
  return item;
}

function memoryStorage() {
  const values = new Map();
  return { get length() { return values.size; }, key: index => [...values.keys()][index] ?? null,
    getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value),
    removeItem: key => values.delete(key), clear: () => values.clear(),
    removePrefix(prefix) { for (const key of values.keys()) if (key.startsWith(prefix)) values.delete(key); } };
}
const guestNamespace = captured => `echs_guest_v1:${captured.session_id}:${captured.epoch}:`;

export function createOwnerStorage(options) { return createCore(options, false); }
export function createGuestOwnerStorage(options) {
  if (Object.hasOwn(options, 'storage')) fail('invalid_input');
  return createCore({ ...options, storage: memoryStorage() }, true);
}

function createCore({ storage, authority, onInvalidate = () => {}, now = Date.now }, guest) {
  if (!storage || !authority || typeof authority.capture !== 'function' || typeof authority.subscribe !== 'function' ||
      (!guest && typeof authority.verify !== 'function') || typeof now !== 'function' || typeof onInvalidate !== 'function') fail('invalid_input');
  const contexts = new Set();
  let disposed = false, backend = storage;
  function invalidate(context, reason) {
    if (context.state === 'disposed') return;
    // Capture the old guest epoch before clearing references. A late invalidation
    // may follow a missed event and a newer guest handle's writes to this Map.
    const previousGuestNamespace = guest && context.identity ? guestNamespace(context.identity) : null;
    context.state = 'disposed'; context.reason = reason;
    context.identity = null; context.owner = null; context.prefix = null;
    contexts.delete(context);
    if (previousGuestNamespace && reason !== 'disposed') backend.removePrefix(previousGuestNamespace);
    context.controller.abort();
    try { onInvalidate(Object.freeze({ reason, domain: context.domain, revision: context.revision })); } catch { /* observer cannot change safety */ }
  }
  function capture() {
    if (disposed) fail('disposed');
    try { return identity(authority.capture(), now); } catch { fail('authority_unavailable'); }
  }
  function current(context) {
    if (disposed || context.state === 'disposed') fail(context.reason || 'disposed');
    let latest;
    try { latest = capture(); } catch { invalidate(context, 'authority_unavailable'); fail('authority_unavailable'); }
    // The canonical capture may discover a raw storage transition and notify
    // subscribers synchronously, including this handle, before returning.
    if (context.state === 'disposed') fail(context.reason || 'disposed');
    if (!sameIdentity(context.identity, latest)) { invalidate(context, 'owner_changed'); fail('owner_changed'); }
    return context.owner;
  }
  const unsubscribe = authority.subscribe(() => {
    for (const context of [...contexts]) { try { current(context); } catch { /* current invalidates synchronously */ } }
  });
  if (typeof unsubscribe !== 'function') fail('invalid_authority');

  function storageCall(context, method, ...args) {
    current(context);
    let result;
    try { result = backend[method](...args); } catch { fail('storage_unavailable'); }
    // A callback may switch authority during an injected storage operation. Never
    // return success to the old caller; the operation's key was already captured.
    current(context);
    return result;
  }
  function namespace(context) {
    const prefix = guest ? guestNamespace(context.identity) : `echs_owned_v1:${context.identity.organization_id}:${context.identity.account_id}:`;
    return `${prefix}${context.domain}:${context.revision}:`;
  }
  function envelope(context, item, data) {
    return { contract: guest ? 'echs.guest-storage.v1' : OWNER_STORAGE_CONTRACT,
      owner: context.owner, domain: context.domain, revision: context.revision, item, data };
  }
  function decode(context, item, raw) {
    if (typeof raw !== 'string' || raw.length > OWNER_LIMITS.itemBytes || encoder.encode(raw).byteLength > OWNER_LIMITS.itemBytes) fail('invalid_envelope');
    let value;
    try { value = cloneJSON(JSON.parse(raw)); closed(value, ['contract', 'owner', 'domain', 'revision', 'item', 'data']); }
    catch { fail('invalid_envelope'); }
    const expected = envelope(context, item, null);
    if (value.contract !== expected.contract || value.domain !== expected.domain || value.revision !== expected.revision ||
        value.item !== expected.item || !value.owner || JSON.stringify(value.owner) !== JSON.stringify(expected.owner)) fail('invalid_envelope');
    return value.data;
  }
  function collect(context) {
    current(context);
    let length;
    try { length = backend.length; } catch { fail('storage_unavailable'); }
    if (!Number.isSafeInteger(length) || length < 0 || length > 100000) fail('storage_bounds');
    const names = new Set(), prefix = context.prefix;
    for (let i = 0; i < length; i++) {
      const key = storageCall(context, 'key', i);
      if (typeof key === 'string' && key.startsWith(prefix)) {
        names.add(itemInput(key.slice(prefix.length)));
        if (names.size > OWNER_LIMITS.items) fail('storage_bounds');
      }
    }
    const rows = []; let bytes = 0;
    for (const item of [...names].sort()) {
      const raw = storageCall(context, 'getItem', prefix + item);
      if (raw === null) continue;
      bytes += typeof raw === 'string' ? encoder.encode(raw).byteLength : OWNER_LIMITS.exportBytes + 1;
      if (bytes > OWNER_LIMITS.exportBytes) fail('storage_bounds');
      rows.push({ item, raw, data: decode(context, item, raw) });
    }
    current(context); return rows;
  }

  async function open(input) {
    const { domain, revision } = domainInput(input), captured = capture();
    if (captured.kind !== (guest ? 'guest' : 'account')) fail('authority_unavailable');
    const context = { domain, revision, identity: captured, state: 'verifying', reason: null,
      controller: new AbortController(), owner: null, prefix: null };
    contexts.add(context);
    try {
      if (!guest) {
        const result = await authority.verify(captured);
        current(context);
        const receipt = cloneJSON(result, 8192); closed(receipt, ['contract', 'verified', 'identity']);
        if (receipt.contract !== OWNER_AUTHORITY_CONTRACT || receipt.verified !== true ||
            !sameIdentity(captured, identity(receipt.identity, now))) fail('verification_failed');
      }
      current(context);
      context.owner = Object.freeze(guest ? { guest_id: captured.session_id } : {
        organization_id: captured.organization_id, account_id: captured.account_id });
      context.prefix = namespace(context); context.state = 'ready';
    } catch (error) {
      invalidate(context, error instanceof OwnerStorageError ? error.code : 'verification_failed');
      fail(context.reason);
    }
    const key = item => { current(context); return context.prefix + itemInput(item); };
    const api = {
      signal: context.controller.signal,
      state() {
        try { current(context); } catch { /* current clears invalid authority */ }
        return Object.freeze({ status: context.state, reason: context.reason });
      },
      assertCurrent: () => Object.freeze({ ...current(context) }),
      read(item, fallback = null) {
        const raw = storageCall(context, 'getItem', key(item));
        const result = raw === null ? cloneJSON(fallback) : decode(context, item, raw);
        current(context); return result;
      },
      write(item, data) {
        const path = key(item), value = cloneJSON(data), body = cloneJSON(envelope(context, item, value));
        storageCall(context, 'setItem', path, JSON.stringify(body)); return cloneJSON(value);
      },
      remove(item) {
        const path = key(item), raw = storageCall(context, 'getItem', path);
        if (raw === null) return false;
        decode(context, item, raw); storageCall(context, 'removeItem', path); return true;
      },
      compareAndRemove(item, expectedData) {
        const path = key(item), expected = JSON.stringify(cloneJSON(envelope(context, item, cloneJSON(expectedData))));
        const raw = storageCall(context, 'getItem', path);
        if (raw === null) return false;
        decode(context, item, raw);
        if (raw !== expected) return false;
        storageCall(context, 'removeItem', path); return true;
      },
      keys: () => collect(context).map(row => row.item),
      export() {
        const rows = collect(context);
        return cloneJSON({ contract: guest ? 'echs.guest-export.v1' : 'echs.owner-export.v1', owner: context.owner,
          domain, revision, items: rows.map(({ item, data }) => ({ item, data })) }, OWNER_LIMITS.exportBytes);
      },
      reset() {
        const rows = collect(context); let removed = 0, changed = 0;
        for (const row of rows) {
          const path = key(row.item);
          if (storageCall(context, 'getItem', path) !== row.raw) { changed++; continue; }
          storageCall(context, 'removeItem', path); removed++;
        }
        return Object.freeze({ removed, changed });
      },
      async run(task) {
        current(context); if (typeof task !== 'function') fail('invalid_input');
        let result;
        try { result = await task(context.controller.signal); }
        catch (error) { current(context); throw error; }
        current(context); return result;
      },
      dispose: () => invalidate(context, 'disposed'),
    };
    return Object.freeze(api);
  }
  return Object.freeze({ open, dispose() {
    if (disposed) return;
    disposed = true;
    for (const context of [...contexts]) invalidate(context, 'disposed');
    try { unsubscribe(); } catch { /* handles are already invalid */ }
    if (guest) backend.clear();
    backend = null;
  } });
}
