import { createClient } from "npm:@supabase/supabase-js@2";

type Role = "admin" | "teacher" | "student" | "parent";
type SessionAccount = {
  session_id: string;
  account_id: string;
  organization_id: string;
  username: string;
  display_name: string;
  email: string | null;
  role: Role;
  status: string;
  grade: string | null;
  can_manage_accounts: boolean;
  organization_name: string;
  organization_settings: Record<string, unknown>;
  expires_at: string;
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

function cors(origin: string): HeadersInit {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0] ?? "";
  return {
    "access-control-allow-origin": allowed,
    "access-control-allow-headers":
      "authorization, content-type, x-bootstrap-secret, x-requested-with",
    "access-control-allow-methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "access-control-max-age": "86400",
    "vary": "Origin",
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
  };
}

function json(req: Request, data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: cors(requestOrigin(req)) });
}

function fail(req: Request, message: string, status = 400, code = "request_error"): Response {
  return json(req, { ok: false, error: { code, message } }, status);
}

async function readBody<T = Record<string, unknown>>(req: Request): Promise<T> {
  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    throw new Error("Content-Type must be application/json");
  }
  return await req.json() as T;
}

async function sha256(value: string): Promise<string> {
  const encoded = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function randomToken(bytes = 32): string {
  const data = crypto.getRandomValues(new Uint8Array(bytes));
  return btoa(String.fromCharCode(...data))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

const PASSWORD_SYMBOLS = "!@#$%^&*_-+=";
function generatePassword(length = 14): string {
  const lower = "abcdefghjkmnpqrstuvwxyz";
  const upper = "ABCDEFGHJKMNPQRSTUVWXYZ";
  const digits = "23456789";
  const all = lower + upper + digits + PASSWORD_SYMBOLS;
  const values = crypto.getRandomValues(new Uint32Array(length));
  const chars = [
    lower[values[0] % lower.length],
    upper[values[1] % upper.length],
    digits[values[2] % digits.length],
    PASSWORD_SYMBOLS[values[3] % PASSWORD_SYMBOLS.length],
  ];
  for (let index = 4; index < length; index++) chars.push(all[values[index] % all.length]);
  for (let index = chars.length - 1; index > 0; index--) {
    const swap = values[index % values.length] % (index + 1);
    [chars[index], chars[swap]] = [chars[swap], chars[index]];
  }
  return chars.join("");
}

function passwordStrong(password: string): boolean {
  return password.length >= 10 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9]/.test(password);
}

function normaliseUsername(value: string): string {
  return value.trim().toLowerCase();
}

function slug(value: string): string {
  const base = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "");
  return base.slice(0, 34) || `student.${crypto.randomUUID().slice(0, 8)}`;
}

function roleHome(role: Role): string {
  if (role === "admin") return "question-bank/admin.html";
  if (role === "teacher") return "question-bank/teacher.html";
  if (role === "parent") return "question-bank/parent.html";
  return "question-bank/student.html";
}

async function sessionFromRequest(req: Request): Promise<SessionAccount | null> {
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) return null;
  const tokenHash = await sha256(token);
  const { data, error } = await admin.rpc("api_session_lookup", { p_token_hash: tokenHash });
  if (error) throw error;
  return (Array.isArray(data) && data[0] ? data[0] : null) as SessionAccount | null;
}

function requireRole(session: SessionAccount | null, roles: Role[]): asserts session is SessionAccount {
  if (!session || !roles.includes(session.role)) throw new Response("Forbidden", { status: 403 });
}

function clientMeta(req: Request): { userAgentHash: Promise<string>; ipHash: Promise<string> } {
  const userAgent = req.headers.get("user-agent") ?? "";
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("cf-connecting-ip") ??
    "unknown";
  return { userAgentHash: sha256(userAgent), ipHash: sha256(forwarded) };
}

async function audit(
  session: SessionAccount,
  action: string,
  targetAccountId: string | null,
  details: Record<string, unknown> = {},
): Promise<void> {
  await admin.from("account_audit_log").insert({
    organization_id: session.organization_id,
    actor_id: session.account_id,
    target_account_id: targetAccountId,
    action,
    details,
  });
}

async function createOneAccount(
  session: SessionAccount,
  row: Record<string, unknown>,
  usedUsernames: Set<string>,
): Promise<Record<string, unknown>> {
  const displayName = String(row.display_name ?? row.full_name ?? row.name ?? "").trim();
  if (!displayName) throw new Error("A display name is required");
  const role = String(row.role ?? "student").toLowerCase() as Role;
  if (!["admin", "teacher", "student", "parent"].includes(role)) throw new Error("Invalid role");
  if (session.role === "teacher" && !["student", "parent"].includes(role)) {
    throw new Error("Teachers can only create student or parent accounts");
  }

  let username = normaliseUsername(String(row.username ?? ""));
  if (!username) username = slug(displayName);
  const base = username;
  let suffix = 2;
  while (usedUsernames.has(username)) username = `${base.slice(0, 35)}${suffix++}`;
  if (!/^[a-z0-9._-]{3,40}$/.test(username)) throw new Error(`Invalid username: ${username}`);

  const passwordProvided = String(row.password ?? "").trim();
  const password = passwordProvided || generatePassword();
  if (!passwordStrong(password)) throw new Error(`Password for ${username} does not meet policy`);

  const { data, error } = await admin.rpc("api_create_account", {
    p_actor_id: session.account_id,
    p_organization_id: session.organization_id,
    p_username: username,
    p_display_name: displayName,
    p_email: String(row.email ?? "").trim(),
    p_role: role,
    p_password: password,
    p_external_id: String(row.external_id ?? row.student_id ?? "").trim() || null,
    p_grade: String(row.grade ?? "").trim() || null,
    p_can_manage_accounts: Boolean(row.can_manage_accounts),
  });
  if (error) throw error;
  const account = (Array.isArray(data) ? data[0] : data) as Record<string, unknown>;
  if (!account?.id) throw new Error(`Account ${username} was created without a returned ID`);

  const className = String(row.class_name ?? "").trim();
  if (className && role === "student") {
    const { data: classRow } = await admin.from("classes")
      .select("id").eq("organization_id", session.organization_id)
      .ilike("name", className).maybeSingle();
    if (classRow?.id) {
      await admin.from("class_memberships").upsert({
        class_id: classRow.id,
        account_id: account.id,
        membership_role: "student",
      }, { onConflict: "class_id,account_id" });
    }
  }

  const studentUsername = normaliseUsername(String(row.student_username ?? ""));
  if (studentUsername && role === "parent") {
    const { data: student } = await admin.from("accounts")
      .select("id").eq("organization_id", session.organization_id)
      .eq("username", studentUsername).eq("role", "student").maybeSingle();
    if (student?.id) {
      await admin.from("parent_student_links").upsert({
        parent_id: account.id,
        student_id: student.id,
        relationship_label: String(row.relationship_label ?? "Parent/Guardian"),
      }, { onConflict: "parent_id,student_id" });
    }
  }

  usedUsernames.add(username);
  return {
    ...account,
    username,
    initial_password: password,
    class_name: className || null,
    student_username: studentUsername || null,
  };
}

async function listAccounts(session: SessionAccount, req: Request): Promise<Response> {
  const url = new URL(req.url);
  const search = (url.searchParams.get("q") ?? "").trim().toLowerCase();
  const role = url.searchParams.get("role");
  const status = url.searchParams.get("status");

  let visibleIds: string[] | null = null;
  const settings = session.organization_settings ?? {};
  const teacherCanSeeAll = Boolean(settings.teachers_can_view_all_accounts);

  if (session.role === "teacher" && !teacherCanSeeAll && !session.can_manage_accounts) {
    const { data: teacherMemberships, error: teacherError } = await admin
      .from("class_memberships")
      .select("class_id")
      .eq("account_id", session.account_id)
      .eq("membership_role", "teacher");
    if (teacherError) throw teacherError;
    const classIds = (teacherMemberships ?? []).map((row) => row.class_id);
    if (!classIds.length) visibleIds = [];
    else {
      const { data: students, error: studentError } = await admin
        .from("class_memberships")
        .select("account_id")
        .in("class_id", classIds)
        .eq("membership_role", "student");
      if (studentError) throw studentError;
      visibleIds = [...new Set((students ?? []).map((row) => row.account_id))];
    }
  }

  let query = admin
    .from("accounts")
    .select("id,username,display_name,email,role,status,external_id,grade,can_manage_accounts,last_login_at,password_updated_at,created_at")
    .eq("organization_id", session.organization_id)
    .order("role")
    .order("display_name");

  if (visibleIds) {
    if (!visibleIds.length) return json(req, { ok: true, accounts: [] });
    query = query.in("id", visibleIds);
  }
  if (role && ["admin", "teacher", "student", "parent"].includes(role)) query = query.eq("role", role);
  if (status && ["active", "suspended", "archived"].includes(status)) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) throw error;
  const accounts = (data ?? []).filter((row) => {
    if (!search) return true;
    return [row.username, row.display_name, row.email, row.external_id, row.grade]
      .some((value) => String(value ?? "").toLowerCase().includes(search));
  });
  return json(req, { ok: true, accounts });
}

async function accountRoute(req: Request): Promise<Response> {
  const origin = requestOrigin(req);
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(origin) });

  const pathname = new URL(req.url).pathname;
  const route = pathname.split("/account-api")[1] || "/";
  const method = req.method.toUpperCase();

  try {
    if (route === "/health" && method === "GET") {
      return json(req, { ok: true, service: "echs-account-api", version: "3.0.0" });
    }

    if (route === "/bootstrap" && method === "POST") {
      if (!BOOTSTRAP_SECRET || req.headers.get("x-bootstrap-secret") !== BOOTSTRAP_SECRET) {
        return fail(req, "Bootstrap is not authorised", 403, "forbidden");
      }
      const body = await readBody<Record<string, string>>(req);
      const { data, error } = await admin.rpc("api_bootstrap_admin", {
        p_organization_name: body.organization_name,
        p_organization_slug: body.organization_slug,
        p_username: normaliseUsername(body.username),
        p_display_name: body.display_name,
        p_email: body.email ?? "",
        p_password: body.password,
      });
      if (error) throw error;
      return json(req, { ok: true, account: Array.isArray(data) ? data[0] : data }, 201);
    }

    if (route === "/login" && method === "POST") {
      const body = await readBody<{ username?: string; password?: string; remember?: boolean }>(req);
      const username = normaliseUsername(body.username ?? "");
      const password = body.password ?? "";
      if (!username || !password) return fail(req, "Username and password are required", 400, "missing_credentials");

      const { data, error } = await admin.rpc("api_verify_login", {
        p_username: username,
        p_password: password,
      });
      if (error) throw error;
      const account = Array.isArray(data) ? data[0] : null;
      if (!account) return fail(req, "Invalid username or password", 401, "invalid_credentials");

      const rawToken = randomToken(36);
      const tokenHash = await sha256(rawToken);
      const settings = account.organization_settings ?? {};
      const rememberDays = Math.max(1, Number(settings.remember_session_days ?? 30));
      const normalHours = Math.max(1, Number(settings.session_hours ?? 12));
      const expiresAt = new Date(
        Date.now() + (body.remember ? rememberDays * 86400000 : normalHours * 3600000),
      );
      const meta = clientMeta(req);
      const { error: sessionError } = await admin.rpc("api_create_session", {
        p_account_id: account.account_id,
        p_token_hash: tokenHash,
        p_expires_at: expiresAt.toISOString(),
        p_user_agent_hash: await meta.userAgentHash,
        p_ip_hash: await meta.ipHash,
      });
      if (sessionError) throw sessionError;

      return json(req, {
        ok: true,
        token: rawToken,
        expires_at: expiresAt.toISOString(),
        account: {
          id: account.account_id,
          organization_id: account.organization_id,
          organization_name: account.organization_name,
          username: account.username,
          display_name: account.display_name,
          email: account.email,
          role: account.role,
          grade: account.grade,
          can_manage_accounts: account.can_manage_accounts,
          home: roleHome(account.role),
        },
      });
    }

    const session = await sessionFromRequest(req);
    if (!session) return fail(req, "Sign in is required", 401, "unauthenticated");

    if (route === "/me" && method === "GET") {
      return json(req, {
        ok: true,
        account: {
          id: session.account_id,
          organization_id: session.organization_id,
          organization_name: session.organization_name,
          username: session.username,
          display_name: session.display_name,
          email: session.email,
          role: session.role,
          grade: session.grade,
          can_manage_accounts: session.can_manage_accounts,
          expires_at: session.expires_at,
          home: roleHome(session.role),
        },
      });
    }

    if (route === "/logout" && method === "POST") {
      const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
      await admin.rpc("api_revoke_session", { p_token_hash: await sha256(token) });
      return json(req, { ok: true });
    }

    if (route === "/accounts" && method === "GET") {
      requireRole(session, ["admin", "teacher"]);
      return await listAccounts(session, req);
    }

    if (route === "/accounts" && method === "POST") {
      requireRole(session, ["admin", "teacher"]);
      const body = await readBody<Record<string, unknown>>(req);
      const { data: existing } = await admin
        .from("accounts")
        .select("username")
        .eq("organization_id", session.organization_id);
      const used = new Set((existing ?? []).map((row) => String(row.username).toLowerCase()));
      const account = await createOneAccount(session, body, used);
      return json(req, { ok: true, account }, 201);
    }

    if (route === "/accounts/import" && method === "POST") {
      requireRole(session, ["admin", "teacher"]);
      const body = await readBody<{ rows?: Record<string, unknown>[] }>(req);
      const rows = Array.isArray(body.rows) ? body.rows.slice(0, 500) : [];
      if (!rows.length) return fail(req, "No account rows were supplied");

      const { data: existing, error: existingError } = await admin
        .from("accounts")
        .select("username")
        .eq("organization_id", session.organization_id);
      if (existingError) throw existingError;
      const used = new Set((existing ?? []).map((row) => String(row.username).toLowerCase()));

      const created: Record<string, unknown>[] = [];
      const errors: { row: number; message: string }[] = [];
      for (let index = 0; index < rows.length; index++) {
        try {
          created.push(await createOneAccount(session, rows[index], used));
        } catch (error) {
          errors.push({ row: index + 2, message: error instanceof Error ? error.message : String(error) });
        }
      }
      await audit(session, "bulk_import_accounts", null, { requested: rows.length, created: created.length, errors: errors.length });
      return json(req, { ok: errors.length === 0, created, errors }, errors.length ? 207 : 201);
    }

    const resetMatch = route.match(/^\/accounts\/([0-9a-f-]{36})\/reset-password$/i);
    if (resetMatch && method === "POST") {
      requireRole(session, ["admin", "teacher"]);
      const body = await readBody<{ password?: string }>(req);
      const password = body.password?.trim() || generatePassword();
      if (!passwordStrong(password)) return fail(req, "Password does not meet the minimum policy");
      const { error } = await admin.rpc("api_reset_password", {
        p_actor_id: session.account_id,
        p_target_id: resetMatch[1],
        p_new_password: password,
      });
      if (error) throw error;
      return json(req, { ok: true, initial_password: password });
    }

    const statusMatch = route.match(/^\/accounts\/([0-9a-f-]{36})\/status$/i);
    if (statusMatch && method === "PATCH") {
      requireRole(session, ["admin"]);
      const body = await readBody<{ status?: string }>(req);
      const { data, error } = await admin.rpc("api_set_account_status", {
        p_actor_id: session.account_id,
        p_target_id: statusMatch[1],
        p_status: body.status,
      });
      if (error) throw error;
      return json(req, { ok: true, account: data });
    }

    return fail(req, "Route not found", 404, "not_found");
  } catch (error) {
    if (error instanceof Response) return fail(req, "You do not have permission for this action", error.status, "forbidden");
    console.error(error);
    const message = error instanceof Error ? error.message : "Unexpected server error";
    const safeMessage = /duplicate key/i.test(message)
      ? "That username, email or external ID is already in use"
      : /not authorised/i.test(message)
      ? "You do not have permission for this action"
      : message;
    return fail(req, safeMessage, 400);
  }
}

Deno.serve(accountRoute);
