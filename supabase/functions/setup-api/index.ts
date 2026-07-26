import { createClient } from "npm:@supabase/supabase-js@2";

type BootstrapBody = {
  organization_name?: string;
  organization_slug?: string;
  username?: string;
  display_name?: string;
  email?: string;
  password?: string;
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const BOOTSTRAP_SECRET = Deno.env.get("BOOTSTRAP_SECRET") ?? "";
const ALLOWED_ORIGINS = (Deno.env.get("ALLOWED_ORIGINS") ??
  "https://2ed944-cloud.github.io,http://localhost:4173,http://127.0.0.1:4173")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function requestOrigin(req: Request): string {
  return req.headers.get("origin") ?? "";
}

function originAllowed(req: Request): boolean {
  const origin = requestOrigin(req);
  return !origin || ALLOWED_ORIGINS.includes(origin);
}

function cors(req: Request): HeadersInit {
  const origin = requestOrigin(req);
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0] ?? "";
  return {
    "access-control-allow-origin": allowed,
    "access-control-allow-headers": "content-type, x-bootstrap-secret, x-requested-with",
    "access-control-allow-methods": "GET, POST, OPTIONS",
    "access-control-max-age": "86400",
    "vary": "Origin",
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store, max-age=0",
    "pragma": "no-cache",
    "x-content-type-options": "nosniff",
    "x-frame-options": "DENY",
    "referrer-policy": "no-referrer",
  };
}

function json(req: Request, data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: cors(req) });
}

function fail(req: Request, message: string, status = 400, code = "setup_error"): Response {
  return json(req, { ok: false, error: { code, message } }, status);
}

async function sha256(value: string): Promise<Uint8Array> {
  return new Uint8Array(
    await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)),
  );
}

async function secretsEqual(left: string, right: string): Promise<boolean> {
  const [a, b] = await Promise.all([sha256(left), sha256(right)]);
  if (a.length !== b.length) return false;
  let difference = 0;
  for (let index = 0; index < a.length; index++) difference |= a[index] ^ b[index];
  return difference === 0;
}

function passwordStrong(password: string): boolean {
  return password.length >= 10 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9]/.test(password);
}

function usernameValid(username: string): boolean {
  return /^[a-z0-9._-]{3,40}$/.test(username);
}

function slugValid(slug: string): boolean {
  return /^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/.test(slug);
}

async function bootstrapComplete(): Promise<boolean> {
  const { count, error } = await admin
    .from("accounts")
    .select("id", { count: "exact", head: true })
    .eq("role", "admin");
  if (error) throw error;
  return (count ?? 0) > 0;
}

async function readBody(req: Request): Promise<BootstrapBody> {
  const contentType = req.headers.get("content-type") ?? "";
  const contentLength = Number(req.headers.get("content-length") ?? "0");
  if (!contentType.includes("application/json")) {
    throw new Error("Content-Type must be application/json");
  }
  if (Number.isFinite(contentLength) && contentLength > 16_384) {
    throw new Error("Setup request is too large");
  }
  return await req.json() as BootstrapBody;
}

async function setupRoute(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors(req) });
  }

  if (!originAllowed(req)) {
    return fail(req, "This setup request origin is not authorised", 403, "origin_forbidden");
  }

  const pathname = new URL(req.url).pathname;
  const route = pathname.split("/setup-api")[1] || "/";
  const method = req.method.toUpperCase();

  try {
    if (route === "/health" && method === "GET") {
      return json(req, {
        ok: true,
        service: "echs-setup-api",
        version: "1.0.0",
        bootstrap_secret_configured: Boolean(BOOTSTRAP_SECRET),
      });
    }

    if (route === "/status" && method === "GET") {
      return json(req, {
        ok: true,
        complete: await bootstrapComplete(),
        setup_available: Boolean(BOOTSTRAP_SECRET),
      });
    }

    if (route === "/bootstrap" && method === "POST") {
      if (!BOOTSTRAP_SECRET) {
        return fail(req, "Initial setup is not available on this deployment", 503, "setup_unavailable");
      }

      const suppliedSecret = req.headers.get("x-bootstrap-secret") ?? "";
      if (!suppliedSecret || !await secretsEqual(suppliedSecret, BOOTSTRAP_SECRET)) {
        return fail(req, "Bootstrap is not authorised", 403, "forbidden");
      }

      if (await bootstrapComplete()) {
        return fail(req, "Initial setup is already complete", 409, "setup_complete");
      }

      const body = await readBody(req);
      const organizationName = String(body.organization_name ?? "").trim();
      const organizationSlug = String(body.organization_slug ?? "").trim().toLowerCase();
      const username = String(body.username ?? "").trim().toLowerCase();
      const displayName = String(body.display_name ?? "").trim();
      const email = String(body.email ?? "").trim();
      const password = String(body.password ?? "");

      if (organizationName.length < 2 || organizationName.length > 120) {
        return fail(req, "Enter a valid institution name");
      }
      if (!slugValid(organizationSlug)) {
        return fail(req, "Institution slug must use lowercase letters, numbers and hyphens");
      }
      if (displayName.length < 2 || displayName.length > 120) {
        return fail(req, "Enter the administrator's full name");
      }
      if (!usernameValid(username)) {
        return fail(req, "Username must contain 3–40 lowercase letters, numbers, dots, underscores or hyphens");
      }
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return fail(req, "Enter a valid administrator email address");
      }
      if (!passwordStrong(password)) {
        return fail(req, "Password must be at least 10 characters and include uppercase, lowercase, number and symbol");
      }

      const { data, error } = await admin.rpc("api_bootstrap_admin", {
        p_organization_name: organizationName,
        p_organization_slug: organizationSlug,
        p_username: username,
        p_display_name: displayName,
        p_email: email,
        p_password: password,
      });
      if (error) throw error;

      return json(req, {
        ok: true,
        setup_locked: true,
        account: Array.isArray(data) ? data[0] : data,
      }, 201);
    }

    return fail(req, "Route not found", 404, "not_found");
  } catch (error) {
    console.error("setup-api", error);
    const message = error instanceof Error ? error.message : "Unexpected setup error";
    if (/already complete/i.test(message)) {
      return fail(req, "Initial setup is already complete", 409, "setup_complete");
    }
    if (/duplicate key/i.test(message)) {
      return fail(req, "That institution slug, username or email is already in use", 409, "duplicate");
    }
    if (/password/i.test(message)) {
      return fail(req, "Password does not meet the minimum policy", 400, "password_policy");
    }
    return fail(req, "Initial setup could not be completed. Review the fields and try again.", 400, "setup_failed");
  }
}

Deno.serve(setupRoute);
