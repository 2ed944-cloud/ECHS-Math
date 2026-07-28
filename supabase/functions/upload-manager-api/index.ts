import { createClient } from "npm:@supabase/supabase-js@2";

type Role = "admin" | "teacher" | "student" | "parent";
type Account = { account_id: string; organization_id: string; role: Role };

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const ALLOWED_ORIGINS = (Deno.env.get("ALLOWED_ORIGINS") ?? "https://2ed944-cloud.github.io,http://localhost:4173,http://127.0.0.1:4173")
  .split(",").map((value) => value.trim()).filter(Boolean);
const db = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const BUCKET = "teacher-upload-staging";
const MAX_BYTES = 150 * 1024 * 1024;
const TERMINAL_STATUSES = ["completed", "failed", "cancelled"];
const ACTIVE_STATUSES = ["queued", "processing", "pr-opened", "completed"];

function headers(req: Request): HeadersInit {
  const origin = req.headers.get("origin") ?? "";
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0] ?? "";
  return {
    "access-control-allow-origin": allowed,
    "access-control-allow-headers": "authorization, content-type, x-upsert",
    "access-control-allow-methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
    "vary": "Origin",
  };
}
function reply(req: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: headers(req) });
}
function fail(req: Request, message: string, status = 400, code = "request_error") {
  return reply(req, { ok: false, error: { code, message } }, status);
}
async function hash(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}
async function account(req: Request): Promise<Account | null> {
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) return null;
  const { data, error } = await db.rpc("api_session_lookup", { p_token_hash: await hash(token) });
  if (error) throw error;
  return Array.isArray(data) && data[0] ? data[0] as Account : null;
}
function staff(value: Account | null): value is Account {
  return Boolean(value && (value.role === "teacher" || value.role === "admin"));
}
function cleanName(value: string) {
  return value.replace(/[^A-Za-z0-9._-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 180);
}
function validSha(value: string) { return /^[0-9a-f]{64}$/.test(value); }
function validKind(value: string) { return value === "private-bank" || value === "course-release"; }
function validCourse(value: string) { return !value || ["ap-precalculus", "ib-math-ai", "ap-calculus", "algebra-2", "grade-9"].includes(value); }
function terminalStatus(value: unknown) { return TERMINAL_STATUSES.includes(String(value ?? "")); }

async function signedUploadFor(path: string) {
  return await db.storage.from(BUCKET).createSignedUploadUrl(path, { upsert: true });
}

async function createUpload(req: Request, current: Account) {
  const body = await req.json() as { kind?: string; filename?: string; size?: number; sha256?: string; course_key?: string; unit_key?: string };
  const kind = String(body.kind ?? "");
  const filename = cleanName(String(body.filename ?? ""));
  const size = Number(body.size ?? 0);
  const sha256 = String(body.sha256 ?? "").toLowerCase();
  const courseKey = String(body.course_key ?? "").trim();
  const unitKey = String(body.unit_key ?? "").trim();
  if (!validKind(kind)) return fail(req, "Choose a supported upload type", 400, "invalid_kind");
  if (!filename.toLowerCase().endsWith(".zip")) return fail(req, "Only ZIP packages are accepted", 400, "invalid_file");
  if (!Number.isFinite(size) || size <= 0 || size > MAX_BYTES) return fail(req, "ZIP file must be between 1 byte and 150 MB", 400, "invalid_size");
  if (!validSha(sha256)) return fail(req, "A valid SHA-256 fingerprint is required", 400, "invalid_sha256");
  if (!validCourse(courseKey)) return fail(req, "Unsupported course", 400, "invalid_course");
  if (kind === "course-release" && (!courseKey || !unitKey)) return fail(req, "Course and unit are required for a course release", 400, "missing_release_scope");

  const { data: existing, error: existingError } = await db.from("teacher_upload_requests")
    .select("id,requested_by,object_path,status,progress,stage,github_pr_url,result,error_message,created_at,updated_at")
    .eq("organization_id", current.organization_id).eq("sha256", sha256).eq("upload_kind", kind).maybeSingle();
  if (existingError) throw existingError;

  if (existing && ACTIVE_STATUSES.includes(String(existing.status))) {
    return reply(req, { ok: true, duplicate: true, request: existing });
  }

  if (existing) {
    const resetValues = {
      requested_by: current.account_id,
      course_key: courseKey || null,
      unit_key: unitKey || null,
      original_filename: filename,
      file_size_bytes: Math.floor(size),
      status: "created",
      progress: 2,
      stage: String(existing.status) === "created" ? "Fresh signed upload URL created" : "Retry upload URL created",
      result: {},
      error_message: null,
      github_pr_url: null,
      started_at: null,
      completed_at: null,
      updated_at: new Date().toISOString(),
    };
    const { data: reset, error: resetError } = await db.from("teacher_upload_requests")
      .update(resetValues).eq("id", existing.id).eq("organization_id", current.organization_id).select("*").single();
    if (resetError) throw resetError;
    const { data: signed, error: signError } = await signedUploadFor(String(reset.object_path));
    if (signError) {
      await db.from("teacher_upload_requests").update({
        status: "failed", progress: 0, error_message: signError.message,
        stage: "Could not create retry upload URL", completed_at: new Date().toISOString(),
      }).eq("id", existing.id);
      throw signError;
    }
    return reply(req, {
      ok: true, duplicate: false, retry: true, request: reset,
      upload: { token: signed.token, path: signed.path, signed_url: signed.signedUrl },
    });
  }

  const requestId = crypto.randomUUID();
  const objectPath = `${current.organization_id}/${requestId}/${filename}`;
  const row = {
    id: requestId,
    organization_id: current.organization_id,
    requested_by: current.account_id,
    upload_kind: kind,
    course_key: courseKey || null,
    unit_key: unitKey || null,
    original_filename: filename,
    object_path: objectPath,
    file_size_bytes: Math.floor(size),
    sha256,
    status: "created",
    progress: 2,
    stage: "Secure upload URL created",
  };
  const { data: inserted, error: insertError } = await db.from("teacher_upload_requests").insert(row).select("*").single();
  if (insertError) throw insertError;
  const { data: signed, error: signError } = await signedUploadFor(objectPath);
  if (signError) {
    await db.from("teacher_upload_requests").update({
      status: "failed", progress: 0, error_message: signError.message,
      stage: "Could not create upload URL", completed_at: new Date().toISOString(),
    }).eq("id", requestId);
    throw signError;
  }
  return reply(req, { ok: true, duplicate: false, request: inserted, upload: { token: signed.token, path: signed.path, signed_url: signed.signedUrl } });
}

async function completeUpload(req: Request, current: Account, id: string) {
  const { data: row, error } = await db.from("teacher_upload_requests").select("*")
    .eq("id", id).eq("organization_id", current.organization_id).maybeSingle();
  if (error) throw error;
  if (!row) return fail(req, "Upload request not found", 404, "not_found");
  if (["queued", "processing", "pr-opened", "completed"].includes(row.status)) return reply(req, { ok: true, request: row });
  const parts = String(row.object_path).split("/");
  const name = parts.pop() ?? "";
  const folder = parts.join("/");
  const { data: objects, error: listError } = await db.storage.from(BUCKET).list(folder, { search: name, limit: 10 });
  if (listError) throw listError;
  const object = (objects ?? []).find((item) => item.name === name);
  if (!object) return fail(req, "The ZIP has not finished uploading", 409, "upload_incomplete");
  const actualSize = Number(object.metadata?.size ?? 0);
  if (actualSize && actualSize !== Number(row.file_size_bytes)) return fail(req, "Uploaded file size does not match the selected ZIP", 409, "size_mismatch");
  const { data: updated, error: updateError } = await db.from("teacher_upload_requests").update({
    status: "queued", progress: 12, stage: "Uploaded securely · waiting for automatic processing",
    updated_at: new Date().toISOString(), error_message: null, completed_at: null,
  }).eq("id", id).eq("organization_id", current.organization_id).select("*").single();
  if (updateError) throw updateError;
  return reply(req, { ok: true, request: updated });
}

async function listRequests(req: Request, current: Account, url: URL) {
  const limit = Math.min(50, Math.max(1, Number.parseInt(url.searchParams.get("limit") ?? "20", 10) || 20));
  const { data, error } = await db.from("teacher_upload_requests")
    .select("id,upload_kind,course_key,unit_key,original_filename,file_size_bytes,sha256,status,progress,stage,result,error_message,github_pr_url,created_at,updated_at,completed_at")
    .eq("organization_id", current.organization_id).order("created_at", { ascending: false }).limit(limit);
  if (error) throw error;
  return reply(req, { ok: true, requests: data ?? [] });
}

async function requestDetail(req: Request, current: Account, id: string) {
  const { data, error } = await db.from("teacher_upload_requests")
    .select("id,upload_kind,course_key,unit_key,original_filename,file_size_bytes,sha256,status,progress,stage,result,error_message,github_pr_url,created_at,updated_at,completed_at")
    .eq("id", id).eq("organization_id", current.organization_id).maybeSingle();
  if (error) throw error;
  if (!data) return fail(req, "Upload request not found", 404, "not_found");
  return reply(req, { ok: true, request: data });
}

async function cancelRequest(req: Request, current: Account, id: string) {
  const { data: row, error } = await db.from("teacher_upload_requests").select("id,status,object_path")
    .eq("id", id).eq("organization_id", current.organization_id).maybeSingle();
  if (error) throw error;
  if (!row) return fail(req, "Upload request not found", 404, "not_found");
  if (["processing", "pr-opened", "completed"].includes(row.status)) return fail(req, "This request can no longer be cancelled", 409, "already_processing");
  await db.storage.from(BUCKET).remove([row.object_path]);
  const { data, error: updateError } = await db.from("teacher_upload_requests").update({
    status: "cancelled", progress: 0, stage: "Cancelled",
    completed_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  }).eq("id", id).select("*").single();
  if (updateError) throw updateError;
  return reply(req, { ok: true, request: data });
}

async function deleteTerminalRequest(req: Request, current: Account, id: string) {
  const { data: row, error } = await db.from("teacher_upload_requests").select("id,status,object_path")
    .eq("id", id).eq("organization_id", current.organization_id).maybeSingle();
  if (error) throw error;
  if (!row) return fail(req, "Upload request not found", 404, "not_found");
  if (!terminalStatus(row.status)) {
    return fail(req, "Only completed, failed, or cancelled requests can be removed", 409, "request_not_terminal");
  }
  if (row.object_path) {
    const { error: storageError } = await db.storage.from(BUCKET).remove([row.object_path]);
    if (storageError) throw storageError;
  }
  const { error: deleteError } = await db.from("teacher_upload_requests")
    .delete().eq("id", id).eq("organization_id", current.organization_id);
  if (deleteError) throw deleteError;
  return reply(req, { ok: true, deleted: id });
}

async function clearTerminalRequests(req: Request, current: Account) {
  const { data: rows, error } = await db.from("teacher_upload_requests").select("id,object_path,status")
    .eq("organization_id", current.organization_id).in("status", TERMINAL_STATUSES);
  if (error) throw error;
  const objectPaths = (rows ?? []).map((row) => String(row.object_path ?? "")).filter(Boolean);
  if (objectPaths.length) {
    const { error: storageError } = await db.storage.from(BUCKET).remove(objectPaths);
    if (storageError) throw storageError;
  }
  const ids = (rows ?? []).map((row) => String(row.id));
  if (ids.length) {
    const { error: deleteError } = await db.from("teacher_upload_requests")
      .delete().eq("organization_id", current.organization_id).in("id", ids);
    if (deleteError) throw deleteError;
  }
  return reply(req, { ok: true, deleted: ids.length });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: headers(req) });
  const url = new URL(req.url);
  const path = url.pathname.split("/upload-manager-api")[1] || "/";
  try {
    if (path === "/health" && req.method === "GET") return reply(req, { ok: true, service: "echs-upload-manager-api", version: "1.2.0-signed-upload-recovery" });
    const current = await account(req);
    if (!staff(current)) return fail(req, "Teacher or administrator sign-in is required", 403, "forbidden");
    if (path === "/requests" && req.method === "GET") return await listRequests(req, current, url);
    if (path === "/requests" && req.method === "POST") return await createUpload(req, current);
    if (path === "/requests/terminal" && req.method === "DELETE") return await clearTerminalRequests(req, current);
    const detail = path.match(/^\/requests\/([0-9a-f-]{36})$/);
    if (detail && req.method === "GET") return await requestDetail(req, current, detail[1]);
    if (detail && req.method === "DELETE") return await deleteTerminalRequest(req, current, detail[1]);
    const complete = path.match(/^\/requests\/([0-9a-f-]{36})\/complete$/);
    if (complete && req.method === "POST") return await completeUpload(req, current, complete[1]);
    const cancel = path.match(/^\/requests\/([0-9a-f-]{36})\/cancel$/);
    if (cancel && req.method === "POST") return await cancelRequest(req, current, cancel[1]);
    return fail(req, "Route not found", 404, "not_found");
  } catch (error) {
    console.error(error);
    return fail(req, error instanceof Error ? error.message : "Unexpected upload manager error", 400);
  }
});
