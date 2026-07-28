import { createClient } from "npm:@supabase/supabase-js@2";

type Role = "admin" | "teacher" | "student" | "parent";
type SessionAccount = { account_id: string; organization_id: string; role: Role };

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const ALLOWED_ORIGINS = (Deno.env.get("ALLOWED_ORIGINS") ?? "https://2ed944-cloud.github.io,http://localhost:4173,http://127.0.0.1:4173")
  .split(",").map((value) => value.trim()).filter(Boolean);
const db = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const SUPPORTED_COURSES = ["ap-precalculus", "ib-math-ai", "ap-calculus", "algebra-2", "grade-9"];

function responseHeaders(req: Request): HeadersInit {
  const origin = req.headers.get("origin") ?? "";
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0] ?? "";
  return {
    "access-control-allow-origin": allowed,
    "access-control-allow-headers": "authorization, content-type",
    "access-control-allow-methods": "GET, PATCH, OPTIONS",
    "vary": "Origin",
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
  };
}
function reply(req: Request, data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: responseHeaders(req) });
}
function fail(req: Request, message: string, status = 400, code = "request_error") {
  return reply(req, { ok: false, error: { code, message } }, status);
}
async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}
async function session(req: Request): Promise<SessionAccount | null> {
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) return null;
  const { data, error } = await db.rpc("api_session_lookup", { p_token_hash: await sha256(token) });
  if (error) throw error;
  return Array.isArray(data) && data[0] ? data[0] as SessionAccount : null;
}
function isStaff(current: SessionAccount | null): current is SessionAccount {
  return Boolean(current && (current.role === "teacher" || current.role === "admin"));
}
function canPractise(current: SessionAccount | null): current is SessionAccount {
  return Boolean(current && ["student", "teacher", "admin"].includes(current.role));
}
function positiveInteger(value: string | null, fallback: number, maximum: number) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.min(parsed, maximum) : fallback;
}
function safeBankCode(value: string) { return /^[A-Z0-9-]{3,64}$/.test(value); }
function safeQuestionId(value: string) { return /^[A-Za-z0-9._:-]{3,160}$/.test(value); }
function safeCourse(value: string) { return SUPPORTED_COURSES.includes(value); }
function safeLesson(value: string) { return /^[A-Za-z0-9._-]{1,100}$/.test(value); }
function safeUnit(value: string) { return /^\d{1,2}$/.test(value) && Number(value) >= 0 && Number(value) <= 20; }
function safeStoragePath(value: string) {
  return value.length > 0 && value.length <= 900 && !value.startsWith("/") && !value.includes("..") && /^[A-Za-z0-9._/+-]+$/.test(value);
}

async function listPackages(req: Request, current: SessionAccount) {
  const { data, error } = await db.from("private_bank_packages")
    .select("id,bank_code,bank_slug,display_aliases,package_fingerprint,package_sha256,package_size_bytes,question_count,pool_count,media_count,access,trust_default,deployment_state,storage_bucket,storage_path,manifest,imported_at,updated_at")
    .eq("organization_id", current.organization_id).order("bank_code");
  if (error) throw error;
  return reply(req, { ok: true, private: true, packages: data ?? [] });
}

async function packageDetail(req: Request, current: SessionAccount, bankCode: string) {
  if (!safeBankCode(bankCode)) return fail(req, "Invalid bank code", 400, "invalid_bank_code");
  const { data: packageRow, error: packageError } = await db.from("private_bank_packages")
    .select("id,bank_code,bank_slug,display_aliases,package_fingerprint,package_sha256,package_size_bytes,question_count,pool_count,media_count,access,trust_default,deployment_state,storage_bucket,storage_path,manifest,imported_at,updated_at")
    .eq("organization_id", current.organization_id).eq("bank_code", bankCode).maybeSingle();
  if (packageError) throw packageError;
  if (!packageRow) return fail(req, "Private bank package not found", 404, "not_found");
  const [{ count: questions, error: questionError }, { count: media, error: mediaError }] = await Promise.all([
    db.from("private_bank_questions").select("question_id", { count: "exact", head: true }).eq("organization_id", current.organization_id).eq("package_id", packageRow.id),
    db.from("private_bank_media_objects").select("object_path", { count: "exact", head: true }).eq("organization_id", current.organization_id).eq("package_id", packageRow.id),
  ]);
  if (questionError) throw questionError;
  if (mediaError) throw mediaError;
  return reply(req, { ok: true, private: true, package: packageRow, indexed: { questions: questions ?? 0, media: media ?? 0 } });
}

async function staffQuestions(req: Request, current: SessionAccount, url: URL) {
  const bank = url.searchParams.get("bank")?.trim() ?? "";
  const course = url.searchParams.get("course")?.trim() ?? "";
  const lesson = url.searchParams.get("lesson")?.trim() ?? "";
  const limit = positiveInteger(url.searchParams.get("limit"), 50, 100);
  const offset = positiveInteger(url.searchParams.get("offset"), 0, 1000000);
  let query = db.from("private_bank_questions")
    .select("question_id,bank_code,pool_id,chapter,section,question_type,course_keys,lesson_keys,skill_candidates,course_mappings,mapping_verified,trust_tier,student_visible,updated_at", { count: "exact" })
    .eq("organization_id", current.organization_id).order("question_id").range(offset, offset + Math.max(limit, 1) - 1);
  if (bank) {
    if (!safeBankCode(bank)) return fail(req, "Invalid bank code", 400, "invalid_bank_code");
    query = query.eq("bank_code", bank);
  }
  if (course) {
    if (!safeCourse(course)) return fail(req, "Invalid course", 400, "invalid_course");
    query = query.contains("course_keys", [course]);
  }
  if (lesson) query = query.contains("lesson_keys", [course ? `${course}:${lesson}` : lesson]);
  const { data, count, error } = await query;
  if (error) throw error;
  return reply(req, { ok: true, private: true, total: count ?? 0, limit, offset, questions: data ?? [] });
}

async function studentQuestions(req: Request, current: SessionAccount, url: URL) {
  const course = url.searchParams.get("course")?.trim() ?? "";
  const lesson = url.searchParams.get("lesson")?.trim() ?? "";
  const unit = url.searchParams.get("unit")?.trim() ?? "";
  const limit = positiveInteger(url.searchParams.get("limit"), 500, 2000);
  const offset = positiveInteger(url.searchParams.get("offset"), 0, 1000000);
  if (!safeCourse(course)) return fail(req, "A valid course is required", 400, "invalid_course_scope");
  if (!lesson && !unit) return fail(req, "A valid lesson or unit is required", 400, "invalid_lesson_scope");
  if (lesson && !safeLesson(lesson)) return fail(req, "Invalid lesson", 400, "invalid_lesson_scope");
  if (unit && !safeUnit(unit)) return fail(req, "Invalid unit", 400, "invalid_unit_scope");
  const lessonKey = lesson ? `${course}:${lesson}` : "";
  let query = db.from("private_bank_questions")
    .select("question_id,bank_code,pool_id,chapter,section,question_type,course_keys,lesson_keys,skill_candidates,course_mappings,mapping_verified,trust_tier,student_visible,payload_sha256,payload,updated_at", { count: "exact" })
    .eq("organization_id", current.organization_id)
    .eq("student_visible", true).eq("mapping_verified", true)
    .in("trust_tier", ["publisher_key_direct", "student_ready_verified"])
    .contains("course_keys", [course]);
  if (lessonKey) query = query.contains("lesson_keys", [lessonKey]);
  if (unit) query = query.contains("course_mappings", [{ course, unit: Number(unit) }]);
  const { data, count, error } = await query.order("question_id").range(offset, offset + Math.max(limit, 1) - 1);
  if (error) throw error;
  return reply(req, {
    ok: true, private: true, course, lesson: lesson || null, unit: unit ? Number(unit) : null,
    total: count ?? 0, limit, offset,
    verification_basis: "source-key-or-independent-package-evidence",
    independently_audited: false,
    disclosure: "Source-key practice; not independently audited. Each package preserves its own verification disclosure.",
    questions: (data ?? []).map((row) => ({ ...row, payload: row.payload })),
  });
}

async function questionDetail(req: Request, current: SessionAccount, questionId: string) {
  if (!safeQuestionId(questionId)) return fail(req, "Invalid question ID", 400, "invalid_question_id");
  let query = db.from("private_bank_questions")
    .select("question_id,bank_code,pool_id,chapter,section,question_type,course_keys,lesson_keys,skill_candidates,course_mappings,mapping_verified,trust_tier,student_visible,payload_sha256,payload,updated_at")
    .eq("organization_id", current.organization_id).eq("question_id", questionId);
  if (current.role === "student") query = query.eq("student_visible", true).eq("mapping_verified", true).in("trust_tier", ["publisher_key_direct", "student_ready_verified"]);
  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  if (!data) return fail(req, "Private bank question not found", 404, "not_found");
  return reply(req, { ok: true, private: true, question: data });
}

async function mediaUrl(req: Request, current: SessionAccount, url: URL) {
  const path = url.searchParams.get("path")?.trim() ?? "";
  if (!safeStoragePath(path)) return fail(req, "Invalid private media path", 400, "invalid_media_path");
  const { data: objectRow, error: objectError } = await db.from("private_bank_media_objects")
    .select("object_path,mime_type,size_bytes").eq("organization_id", current.organization_id).eq("object_path", path).maybeSingle();
  if (objectError) throw objectError;
  if (!objectRow) return fail(req, "Private media object not found", 404, "not_found");
  const { data, error } = await db.storage.from("private-question-banks").createSignedUrl(path, 300);
  if (error) throw error;
  return reply(req, { ok: true, private: true, expires_in: 300, path, signed_url: data.signedUrl, mime_type: objectRow.mime_type, size_bytes: objectRow.size_bytes });
}

async function updatePackageState(req: Request, current: SessionAccount, bankCode: string) {
  if (current.role !== "admin") return fail(req, "Administrator access is required", 403, "forbidden");
  if (!safeBankCode(bankCode)) return fail(req, "Invalid bank code", 400, "invalid_bank_code");
  const body = await req.json() as { deployment_state?: string };
  const state = String(body.deployment_state ?? "").trim();
  if (!/^[a-z0-9-]{3,80}$/.test(state)) return fail(req, "Invalid deployment state", 400, "invalid_state");
  const { data, error } = await db.from("private_bank_packages").update({ deployment_state: state, updated_at: new Date().toISOString() })
    .eq("organization_id", current.organization_id).eq("bank_code", bankCode).select("bank_code,deployment_state,updated_at").maybeSingle();
  if (error) throw error;
  if (!data) return fail(req, "Private bank package not found", 404, "not_found");
  return reply(req, { ok: true, private: true, package: data });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: responseHeaders(req) });
  const url = new URL(req.url); const path = url.pathname.split("/private-bank-api")[1] || "/";
  try {
    if (path === "/health" && req.method === "GET") return reply(req, { ok: true, service: "echs-private-bank-api", version: "1.2.0-multi-course" });
    const current = await session(req);
    if (!canPractise(current)) return fail(req, "Student, teacher, or administrator sign-in is required", 403, "forbidden");
    if (path === "/student-questions" && req.method === "GET") return await studentQuestions(req, current, url);
    if (path === "/media-url" && req.method === "GET") return await mediaUrl(req, current, url);
    const questionMatch = path.match(/^\/questions\/([A-Za-z0-9._:-]+)$/);
    if (questionMatch && req.method === "GET") return await questionDetail(req, current, questionMatch[1]);
    if (!isStaff(current)) return fail(req, "Teacher or administrator sign-in is required", 403, "forbidden");
    if (path === "/packages" && req.method === "GET") return await listPackages(req, current);
    if (path === "/questions" && req.method === "GET") return await staffQuestions(req, current, url);
    const packageMatch = path.match(/^\/packages\/([A-Z0-9-]+)$/);
    if (packageMatch && req.method === "GET") return await packageDetail(req, current, packageMatch[1]);
    if (packageMatch && req.method === "PATCH") return await updatePackageState(req, current, packageMatch[1]);
    return fail(req, "Route not found", 404, "not_found");
  } catch (error) {
    console.error(error);
    return fail(req, error instanceof Error ? error.message : "Unexpected private bank error", 400);
  }
});
