import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const BOOTSTRAP_SECRET = Deno.env.get("BOOTSTRAP_SECRET") ?? "";

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function headers(): HeadersInit {
  return {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store, max-age=0",
    "pragma": "no-cache",
    "x-content-type-options": "nosniff",
  };
}

function response(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: headers() });
}

function canonicalSecret(value: string): string {
  return value.normalize("NFKC").trim();
}

async function digest(value: string): Promise<Uint8Array> {
  return new Uint8Array(
    await crypto.subtle.digest("SHA-256", new TextEncoder().encode(canonicalSecret(value))),
  );
}

async function secretsEqual(left: string, right: string): Promise<boolean> {
  const [a, b] = await Promise.all([digest(left), digest(right)]);
  if (a.length !== b.length) return false;
  let difference = 0;
  for (let index = 0; index < a.length; index++) difference |= a[index] ^ b[index];
  return difference === 0;
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method !== "POST") {
    return response({ ok: false, error: { code: "method_not_allowed" } }, 405);
  }

  const supplied = req.headers.get("x-bootstrap-secret") ?? "";
  if (!canonicalSecret(BOOTSTRAP_SECRET) || !supplied || !await secretsEqual(supplied, BOOTSTRAP_SECRET)) {
    return response({ ok: false, error: { code: "forbidden" } }, 403);
  }

  try {
    const { data, error } = await admin.rpc("api_login_self_test");
    if (error) throw error;
    if (data !== true) throw new Error("Login self-test did not return true");
    return response({ ok: true, login_contract: true });
  } catch (error) {
    console.error("login-diagnostics", error);
    return response({ ok: false, error: { code: "login_contract_failed" } }, 500);
  }
});
