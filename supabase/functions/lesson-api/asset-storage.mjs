import { LessonAssetError, copyLessonAssetBytes, inspectLessonAsset, lessonAssetByteLimit } from './asset-bytes.mjs';

// This is a privileged server transport, not an authorization layer. All scope,
// expected metadata and terminal cleanup state must come from lesson_asset_store.
// Reserve/finalize/cleanup are separate authorized database transactions. An
// ambiguous write/finalize must be reconciled; this module never retries writes.
// Supabase Storage REST shapes match the official storage-js StorageFileApi:
// POST/GET object/{bucket}/{key}, DELETE object/{bucket} with exact prefixes.
const BUCKET = 'lesson-assets';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const MAX_JSON_BYTES = 64 * 1024;
const fail = code => { throw new LessonAssetError(code); };
function closed(value, keys) {
  if (!value || Object.getPrototypeOf(value) !== Object.prototype) fail('asset_storage_invalid_input');
  const descriptors = Object.getOwnPropertyDescriptors(value);
  if (Reflect.ownKeys(descriptors).length !== keys.length || keys.some(key => !descriptors[key] || !Object.hasOwn(descriptors[key], 'value') || !descriptors[key].enumerable)) fail('asset_storage_invalid_input');
  return value;
}
function objectKey(scope) {
  closed(scope, ['organization_id','lesson_id','asset_id']);
  const ids = [scope.organization_id, scope.lesson_id, scope.asset_id];
  if (ids.some(id => typeof id !== 'string' || !UUID.test(id))) fail('asset_storage_invalid_input');
  return ids.join('/');
}
function expectedMetadata(value) {
  closed(value, ['mime','bytes','sha256']);
  const limit = lessonAssetByteLimit(value.mime);
  if (!Number.isInteger(value.bytes) || value.bytes < 1 || value.bytes > limit || typeof value.sha256 !== 'string' || !/^[0-9a-f]{64}$/.test(value.sha256)) fail('asset_storage_invalid_input');
  return { ...value };
}
function cancelBody(response) { try { void response?.body?.cancel().catch(() => {}); } catch { /* never retain upstream details */ } }

/** Fixed-origin, credential-only transport. No supplied bucket, path or URL.
 * @param {{url?: string, serviceKey?: string, fetchImpl?: typeof globalThis.fetch, timeoutMs?: number}} options
 */
export function createLessonAssetStorage({ url, serviceKey, fetchImpl = globalThis.fetch, timeoutMs = 15000 } = {}) {
  let base;
  try { base = new URL(url); } catch { throw new TypeError('A fixed Supabase service origin is required.'); }
  if (base.protocol !== 'https:' || base.username || base.password || base.search || base.hash || base.port || base.pathname !== '/' || !/^[a-z0-9]+\.supabase\.co$/.test(base.hostname)) throw new TypeError('A fixed Supabase service origin is required.');
  if (typeof serviceKey !== 'string' || serviceKey.length < 20 || /\s/.test(serviceKey)) throw new TypeError('A service credential is required.');
  if (typeof fetchImpl !== 'function' || !Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 30000) throw new TypeError('A bounded storage transport is required.');

  async function request(method, key, { body, mime, expected } = {}) {
    const target = new URL(`/storage/v1/object/${BUCKET}${key === null ? '' : '/' + key}`, base);
    const controller = new AbortController(); let timer, reader, expired = false, response;
    const deadline = new Promise((_, reject) => {
      timer = setTimeout(() => {
        expired = true; controller.abort();
        try { void reader?.cancel().catch(() => {}); } catch { /* cleanup is best effort */ }
        reject(new LessonAssetError('asset_storage_timeout'));
      }, timeoutMs);
    });
    const bounded = promise => Promise.race([promise, deadline]);
    async function read(limit) {
      const declared = response.headers.get('content-length');
      if (declared !== null && (!/^(0|[1-9][0-9]*)$/.test(declared) || Number(declared) > limit)) fail('asset_storage_invalid_response');
      reader = response.body?.getReader(); if (!reader) fail('asset_storage_invalid_response');
      let length = 0; const chunks = [];
      while (true) {
        const { value, done } = await bounded(reader.read()); if (expired) fail('asset_storage_timeout'); if (done) break;
        if (!(value instanceof Uint8Array)) fail('asset_storage_invalid_response');
        length += value.byteLength; if (length > limit) fail('asset_storage_invalid_response'); chunks.push(value);
      }
      if (declared !== null && Number(declared) !== length) fail('asset_storage_invalid_response');
      const bytes = new Uint8Array(length); let offset = 0;
      for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
      return bytes;
    }
    async function json() {
      if (!/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(response.headers.get('content-type') || '')) fail('asset_storage_invalid_response');
      const bytes = await read(MAX_JSON_BYTES);
      try { return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)); } catch { fail('asset_storage_invalid_response'); }
    }
    try {
      const pending = Promise.resolve().then(() => fetchImpl(target, { method,
        headers: { apikey: serviceKey, authorization: `Bearer ${serviceKey}`, 'accept-encoding': 'identity',
          ...(method === 'GET' ? {} : { 'content-type': mime || 'application/json' }),
          ...(method === 'POST' ? { 'x-upsert': 'false', 'cache-control': 'max-age=0' } : {}) },
        ...(body === undefined ? {} : { body }), signal: controller.signal, redirect: 'error', credentials: 'omit', cache: 'no-store' }));
      // A nonconforming injected fetch may resolve after timeout; discard its body.
      void pending.then(value => { if (expired) cancelBody(value); }, () => {});
      response = await bounded(pending);
      if (expired) fail('asset_storage_timeout');
      if (!response || response.redirected || (response.url && response.url !== target.href) || !response.headers || !Number.isInteger(response.status)) fail('asset_storage_invalid_response');
      if (![200,201].includes(response.status)) {
        if (response.status === 404) fail('asset_storage_not_found');
        if (response.status === 409) fail('asset_storage_conflict');
        if (response.status >= 300 && response.status < 400) fail('asset_storage_invalid_response');
        // Supabase also reports existing-object collisions as HTTP 400.
        if (response.status === 400) {
          const result = await json();
          if (['Duplicate','ResourceAlreadyExists','KeyAlreadyExists'].includes(result?.code) || result?.error === 'Duplicate') fail('asset_storage_conflict');
        }
        fail('asset_storage_unavailable');
      }
      if (method === 'GET') {
        if (response.status !== 200 || response.headers.get('content-type')?.trim().toLowerCase() !== expected.mime) fail('asset_storage_invalid_response');
        const bytes = await read(expected.bytes);
        if (bytes.length !== expected.bytes) fail('asset_storage_integrity');
        let metadata;
        try { metadata = await bounded(inspectLessonAsset(bytes, expected.mime)); }
        catch (error) { if (expired) throw error; fail('asset_storage_integrity'); }
        if (metadata.sha256 !== expected.sha256 || metadata.bytes !== expected.bytes) fail('asset_storage_integrity');
        return bytes;
      }
      const result = await json();
      if (method === 'POST') {
        if (!result || Array.isArray(result) || result.Key !== `${BUCKET}/${key}`) fail('asset_storage_invalid_response');
      } else if (!Array.isArray(result) || result.some(item => !item || item.name !== keyFromDelete(body))) fail('asset_storage_invalid_response');
      return undefined;
    } catch (error) {
      if (expired) throw new LessonAssetError('asset_storage_timeout');
      if (error instanceof LessonAssetError) throw error;
      throw new LessonAssetError('asset_storage_unavailable');
    } finally {
      clearTimeout(timer); controller.abort();
      if (reader) { try { void reader.cancel().catch(() => {}); } catch { /* no upstream detail */ } try { reader.releaseLock(); } catch { /* a late read may still settle */ } }
      else cancelBody(response);
    }
  }
  const keyFromDelete = body => JSON.parse(body).prefixes[0];
  return Object.freeze({
    async put(options) {
      closed(options, ['scope','bytes','mime']); const key = objectKey(options.scope);
      const bytes = copyLessonAssetBytes(options.bytes, options.mime);
      const metadata = await inspectLessonAsset(bytes, options.mime);
      await request('POST', key, { body: bytes, mime: metadata.mime });
      return metadata;
    },
    async get(options) {
      closed(options, ['scope','expected']); const key = objectKey(options.scope), expected = expectedMetadata(options.expected);
      return request('GET', key, { expected });
    },
    async removeTemporary(options) {
      closed(options, ['scope','state']); const key = objectKey(options.scope);
      // The caller must first atomically make cleanup terminal in PostgreSQL.
      // A previously checked pending state could race a successful finalization.
      if (options.state !== 'cleanup') fail('asset_storage_cleanup_required');
      await request('DELETE', null, { body: JSON.stringify({ prefixes: [key] }) });
      return Object.freeze({ removed: true });
    }
  });
}
