import katex from 'npm:katex@0.16.27';
import { createLessonHandler } from './handler.mjs';
import { createRpcTransport } from './transport.mjs';
import { createLessonAssetStorage } from './asset-storage.mjs';

const origins = (Deno.env.get('ALLOWED_ORIGINS') || 'https://2ed944-cloud.github.io').split(',').map(value => value.trim()).filter(Boolean);
let handler: (request: Request) => Promise<Response>;
try {
  const rpc = createRpcTransport({ url: Deno.env.get('SUPABASE_URL'), serviceKey: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') });
  const assetStorage=createLessonAssetStorage({url:Deno.env.get('SUPABASE_URL'),serviceKey:Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')});
  handler = createLessonHandler({ rpc, mathEngine: katex, assetStorage, allowedOrigins: origins,
    siteBase: 'https://2ed944-cloud.github.io/ECHS-Math/' });
} catch {
  // No exception text or environment value can leave the service boundary.
  handler = async () => new Response(JSON.stringify({ ok: false, error: { code: 'service_unavailable', message: 'Lesson storage is temporarily unavailable.' } }), {
    status: 503, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' },
  });
}
Deno.serve(handler);
