export const LESSON_IMAGE_LIMIT = 4 * 1024 * 1024;
export const LESSON_RESOURCE_LIMIT = 8 * 1024 * 1024;
export const LESSON_MEDIA_TYPES = Object.freeze(['image', 'video', 'table', 'resource']);
export const LESSON_ASSET_MIMES = Object.freeze(['image/png', 'image/jpeg', 'image/webp', 'application/pdf']);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
const fail = () => { throw new Error('The lesson asset is unavailable or invalid.'); };

function dataObject(value, keys) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || ![Object.prototype, null].includes(Object.getPrototypeOf(value))) fail();
  const descriptors = Object.getOwnPropertyDescriptors(value);
  if (Reflect.ownKeys(descriptors).length !== keys.length || !keys.every(key => own(descriptors, key))) fail();
  for (const key of Reflect.ownKeys(descriptors)) if (!keys.includes(key) || !own(descriptors[key], 'value') || !descriptors[key].enumerable) fail();
  return Object.fromEntries(keys.map(key => [key, descriptors[key].value]));
}

/** Exact data-free negotiation; old/future/partial contracts disable new tools. */
export function supportsLessonMedia(value) {
  try {
    const cap = dataObject(value, ['contract', 'blocks', 'asset_delivery', 'mime_types', 'max_image_bytes', 'max_resource_bytes']);
    if (cap.contract !== 'echs.lesson.media.v1' || cap.asset_delivery !== 'authenticated-bytes' || cap.max_image_bytes !== LESSON_IMAGE_LIMIT || cap.max_resource_bytes !== LESSON_RESOURCE_LIMIT) return false;
    const blocks = dataObject(cap.blocks, LESSON_MEDIA_TYPES);
    if (!LESSON_MEDIA_TYPES.every(type => Array.isArray(blocks[type]) && blocks[type].length === 1 && blocks[type][0] === 1)) return false;
    return Array.isArray(cap.mime_types) && cap.mime_types.length === LESSON_ASSET_MIMES.length && cap.mime_types.every((mime, index) => mime === LESSON_ASSET_MIMES[index]);
  } catch { return false; }
}

/** Private transport metadata has no storage path, URL, filename or authority. */
export function assertLessonAssetMetadata(value, {assetId, kind} = {}) {
  const meta = dataObject(value, ['asset_id', 'mime_type', 'byte_length', 'width', 'height', 'sha256', 'state']);
  if (typeof meta.asset_id !== 'string' || !UUID.test(meta.asset_id) || (assetId !== undefined && meta.asset_id !== assetId) || meta.state !== 'ready' || !LESSON_ASSET_MIMES.includes(meta.mime_type)) fail();
  const image = meta.mime_type.startsWith('image/');
  if (kind !== undefined && (kind !== 'image' && kind !== 'resource' || image !== (kind === 'image'))) fail();
  if (!Number.isInteger(meta.byte_length) || meta.byte_length < 1 || meta.byte_length > (image ? LESSON_IMAGE_LIMIT : LESSON_RESOURCE_LIMIT) || typeof meta.sha256 !== 'string' || !/^[0-9a-f]{64}$/.test(meta.sha256)) fail();
  if (image) {
    if (![meta.width, meta.height].every(number => Number.isInteger(number) && number > 0 && number <= 4096) || meta.width * meta.height > 16777216) fail();
  } else if (meta.width !== null || meta.height !== null) fail();
  return Object.freeze(meta);
}

/** Read only an already-authorized fixed endpoint response. The caller owns the
 * account/route checks and request timeout. Never fetches or persists anything. */
export async function readLessonAssetResponse(response, {metadata, expectedUrl, signal, assertCurrent, crypto: cryptography = globalThis.crypto} = {}) {
  const meta = assertLessonAssetMetadata(metadata);
  if (typeof assertCurrent !== 'function' || !signal || !cryptography?.subtle?.digest || typeof expectedUrl !== 'string') fail();
  const check = () => { signal.throwIfAborted(); assertCurrent(); };
  check();
  if (response.status !== 200 || response.redirected || response.url !== expectedUrl || response.headers.get('content-type')?.trim().toLowerCase() !== meta.mime_type) fail();
  const cache = response.headers.get('cache-control') || '';
  if (!/\bprivate\b/i.test(cache) || !/\bno-store\b/i.test(cache)) fail();
  const length = response.headers.get('content-length');
  if (length !== null && (!/^\d+$/.test(length) || Number(length) !== meta.byte_length)) fail();
  const reader = response.body?.getReader(); if (!reader) fail();
  const parts = []; let size = 0;
  const cancel = () => { reader.cancel().catch(() => {}); };
  signal.addEventListener('abort', cancel, {once: true});
  try {
    while (true) {
      check(); const part = await reader.read(); check();
      if (part.done) break;
      size += part.value.byteLength;
      if (size > meta.byte_length) fail();
      parts.push(part.value);
    }
    if (size !== meta.byte_length) fail();
    const bytes = new Uint8Array(size); let offset = 0;
    for (const part of parts) { bytes.set(part, offset); offset += part.byteLength; }
    const digest = await cryptography.subtle.digest('SHA-256', bytes); check();
    const hex = [...new Uint8Array(digest)].map(value => value.toString(16).padStart(2, '0')).join('');
    if (hex !== meta.sha256) fail();
    return Object.freeze({metadata: meta, blob: new Blob([bytes], {type: meta.mime_type})});
  } finally {
    signal.removeEventListener('abort', cancel); reader.cancel().catch(() => {}); reader.releaseLock();
  }
}
