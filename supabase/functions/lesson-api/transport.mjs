const RPC_NAMES = new Set(['api_session_lookup', 'lesson_store', 'lesson_store_health', 'lesson_content_capabilities', 'lesson_asset_store', 'lesson_media_capabilities', 'lesson_draft_recovery_key', 'lesson_recovery_capabilities']);
const MAX_RESPONSE_BYTES = 5 * 1024 * 1024;

/** A fixed service-side transport; request data cannot choose hosts, RPCs or keys.
 * @param {{url?: string, serviceKey?: string, fetch?: typeof globalThis.fetch, timeoutMs?: number}} options
 */
export function createRpcTransport({ url, serviceKey, fetch: request = globalThis.fetch, timeoutMs = 15000 } = {}) {
  let base;
  try { base = new URL(url); } catch { throw new TypeError('Supabase service configuration is required.'); }
  if (base.protocol !== 'https:' || base.username || base.password || base.search || base.hash || !/^[a-z0-9]+\.supabase\.co$/.test(base.hostname)) throw new TypeError('A fixed Supabase service origin is required.');
  if (typeof serviceKey !== 'string' || serviceKey.length < 20 || /\s/.test(serviceKey)) throw new TypeError('A service credential is required.');
  return async function rpc(name, args) {
    if (!RPC_NAMES.has(name)) throw new TypeError('Unsupported RPC.');
    const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await request(new URL(`/rest/v1/rpc/${name}`, base), { method: 'POST',
        headers: { apikey: serviceKey, authorization: `Bearer ${serviceKey}`, 'content-type': 'application/json' },
        body: JSON.stringify(args), cache: 'no-store', credentials: 'omit', redirect: 'error', signal: controller.signal });
      if (!response.headers.get('content-type')?.toLowerCase().includes('application/json') || response.redirected) throw new Error('Invalid database response.');
      const reader = response.body?.getReader(); if (!reader) throw new Error('Empty database response.');
      let length = 0; const chunks = [];
      try {
        while (true) {
          const { value, done } = await reader.read(); if (done) break;
          length += value.byteLength;
          if (length > MAX_RESPONSE_BYTES) { await reader.cancel(); throw new Error('Database response exceeds the limit.'); }
          chunks.push(value);
        }
      } finally { reader.releaseLock(); }
      const bytes = new Uint8Array(length); let offset = 0;
      for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
      const data = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
      return response.ok ? { data, error: null } : { data: null, error: { code: typeof data?.code === 'string' ? data.code : 'unavailable' } };
    } finally { clearTimeout(timer); }
  };
}
