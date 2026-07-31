import { createClient } from "npm:@supabase/supabase-js@2";

type Role = "admin" | "teacher" | "student" | "parent";
type SessionAccount = { account_id: string; organization_id: string; role: Role };
type JsonRecord = Record<string, unknown>;

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const ALLOWED_ORIGINS = (Deno.env.get("ALLOWED_ORIGINS") ??
  "https://2ed944-cloud.github.io,http://localhost:4173,http://127.0.0.1:4173")
  .split(",").map((value) => value.trim()).filter(Boolean);
const db = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const SUPPORTED_COURSES = ["ap-precalculus", "ib-math-ai", "ap-calculus", "algebra-2", "grade-9"];
const READY_TRUST = ["publisher_key_direct", "student_ready_verified"];
const PRIVATE_BUCKET = "private-question-banks";

function headers(req: Request): HeadersInit {
  const origin = req.headers.get("origin") ?? "";
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0] ?? "";
  return {
    "access-control-allow-origin": allowed,
    "access-control-allow-headers": "authorization, content-type",
    "access-control-allow-methods": "GET, OPTIONS",
    "vary": "Origin",
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
  };
}
function reply(req: Request, data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: headers(req) });
}
function fail(req: Request, message: string, status = 400, code = "request_error") {
  return reply(req, { ok: false, error: { code, message } }, status);
}
function asRecord(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? value as JsonRecord : {};
}
function asStrings(value: unknown): string[] {
  return Array.isArray(value) ? value.map((item) => String(item ?? "")).filter(Boolean) : [];
}
function normaliseCourse(value: unknown): string {
  const key = String(value ?? "").trim().toLowerCase().replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  if (["ap-calculus", "ap-calculus-ab", "ap-calculus-bc"].includes(key)) return "ap-calculus";
  if (key.includes("precalculus")) return "ap-precalculus";
  if (key.includes("algebra-2") || key.includes("algebra2")) return "algebra-2";
  if (key.includes("ib") && key.includes("math")) return "ib-math-ai";
  if (key.includes("grade-9")) return "grade-9";
  return key;
}
function positiveInteger(value: string | null, fallback: number, maximum: number) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.min(parsed, maximum) : fallback;
}
function safeCourse(value: string) { return SUPPORTED_COURSES.includes(value); }
function safeLesson(value: string) { return /^[A-Za-z0-9._-]{1,100}$/.test(value); }
function safeUnit(value: string) { return /^\d{1,2}$/.test(value) && Number(value) >= 0 && Number(value) <= 20; }
function safePath(value: string) {
  return value.length > 0 && value.length <= 900 && !value.startsWith("/") &&
    !value.includes("..") && /^[A-Za-z0-9._/+-]+$/.test(value);
}
function isStaff(current: SessionAccount | null): current is SessionAccount {
  return Boolean(current && (current.role === "teacher" || current.role === "admin"));
}
function canPractise(current: SessionAccount | null): current is SessionAccount {
  return Boolean(current && ["student", "teacher", "admin"].includes(current.role));
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
async function assignedCourses(current: SessionAccount): Promise<Set<string>> {
  if (current.role !== "student") return new Set(SUPPORTED_COURSES);
  const { data, error } = await db.from("class_memberships")
    .select("class_id,classes(course_key)")
    .eq("account_id", current.account_id)
    .eq("membership_role", "student");
  if (error) throw error;
  const courses = new Set<string>();
  for (const row of data ?? []) {
    const linked = (row as JsonRecord).classes;
    const classRow = Array.isArray(linked) ? asRecord(linked[0]) : asRecord(linked);
    const course = normaliseCourse(classRow.course_key);
    if (safeCourse(course)) courses.add(course);
  }
  return courses;
}
async function authoriseStudentCourse(req: Request, current: SessionAccount, course: string) {
  if (current.role !== "student") return null;
  const courses = await assignedCourses(current);
  if (!courses.has(course)) {
    return fail(req, "This course is not assigned to the signed-in student", 403, "course_not_assigned");
  }
  return null;
}
async function inventory(req: Request, current: SessionAccount, url: URL) {
  const requestedCourse = normaliseCourse(url.searchParams.get("course") ?? "");
  if (requestedCourse && !safeCourse(requestedCourse)) {
    return fail(req, "Invalid course", 400, "invalid_course_scope");
  }
  const allowed = await assignedCourses(current);
  if (requestedCourse && !allowed.has(requestedCourse)) {
    return fail(req, "This course is not available to the signed-in account", 403, "course_not_assigned");
  }
  const { data, error } = await db.rpc("private_bank_practice_inventory", {
    p_organization_id: current.organization_id,
    p_course_key: requestedCourse || null,
  });
  if (error) throw error;
  const rows = (data ?? []).filter((row: JsonRecord) =>
    allowed.has(normaliseCourse(row.course_key)) &&
    (current.role !== "student" || Number(row.ready_count ?? 0) > 0)
  );
  const bankCodes = [...new Set(rows.map((row: JsonRecord) => String(row.bank_code ?? "")).filter(Boolean))];
  const packageNames = new Map<string, string>();
  if (bankCodes.length) {
    const { data: packages, error: packageError } = await db.from("private_bank_packages")
      .select("bank_code,bank_slug,display_aliases,manifest")
      .eq("organization_id", current.organization_id)
      .in("bank_code", bankCodes);
    if (packageError) throw packageError;
    for (const packageRow of packages ?? []) {
      const row = packageRow as JsonRecord;
      const code = String(row.bank_code ?? "");
      const course = normaliseCourse(
        rows.find((inventoryRow: JsonRecord) => String(inventoryRow.bank_code ?? "") === code)?.course_key,
      );
      packageNames.set(code, packageDisplayName(row, course, code));
    }
  }
  const identifiedRows = rows.map((row: JsonRecord) => {
    const bankCode = String(row.bank_code ?? "");
    return {
      ...row,
      bank_display_name: packageNames.get(bankCode) || bankCode,
      bank_identity: bankCode,
    };
  });
  return reply(req, {
    ok: true,
    private: true,
    course: requestedCourse || null,
    routing_order: ["course", "bank", "unit", "lesson"],
    dedicated_course_required: true,
    stable_bank_identity: true,
    rows: identifiedRows,
  });
}
function cleanDisplayLabel(value: unknown): string {
  const label = String(value ?? "").replace(/\\s+/g, " ").trim();
  return label.length <= 160 ? label : "";
}
function packageDisplayName(row: JsonRecord, course: string, bankCode: string): string {
  const manifest = asRecord(row.manifest);
  const aliases = { ...asRecord(manifest.display_aliases), ...asRecord(row.display_aliases) };
  const candidates = [
    aliases[course],
    aliases.student,
    aliases.teacher,
    aliases.admin,
    manifest.display_name,
    manifest.bank_name,
    manifest.title,
    manifest.name,
    row.bank_slug,
  ];
  return candidates.map(cleanDisplayLabel).find(Boolean) || bankCode;
}
function packageTargets(row: JsonRecord): string[] {
  const manifest = asRecord(row.manifest);
  const declared = asStrings(manifest.target_courses).map(normaliseCourse).filter(safeCourse);
  if (declared.length) return [...new Set(declared)];
  const aliases = { ...asRecord(row.display_aliases), ...asRecord(manifest.display_aliases) };
  return Object.keys(aliases).map(normaliseCourse).filter(safeCourse);
}

async function questions(req: Request, current: SessionAccount, url: URL) {
  const course = normaliseCourse(url.searchParams.get("course") ?? "");
  const bank = url.searchParams.get("bank")?.trim() ?? "";
  const lesson = url.searchParams.get("lesson")?.trim() ?? "";
  const unit = url.searchParams.get("unit")?.trim() ?? "";
  const requestedView = url.searchParams.get("view")?.trim() ?? "ready";
  const limit = positiveInteger(url.searchParams.get("limit"), 500, 2000);
  const offset = positiveInteger(url.searchParams.get("offset"), 0, 1000000);

  if (!safeCourse(course)) return fail(req, "A valid course is required", 400, "invalid_course_scope");
  if (bank && !/^[A-Z0-9-]{3,64}$/.test(bank)) return fail(req, "Invalid bank", 400, "invalid_bank_scope");
  const denied = await authoriseStudentCourse(req, current, course);
  if (denied) return denied;
  if (current.role === "student" && !lesson && !unit) {
    return fail(req, "Students must practise an unlocked lesson or a completed unit", 400, "student_scope_required");
  }
  if (lesson && !safeLesson(lesson)) return fail(req, "Invalid lesson", 400, "invalid_lesson_scope");
  if (unit && !safeUnit(unit)) return fail(req, "Invalid unit", 400, "invalid_unit_scope");

  const includeAll = isStaff(current) && requestedView === "all";
  const lessonKey = lesson ? `${course}:${lesson}` : "";
  let query = db.from("private_bank_questions")
    .select("question_id,bank_code,pool_id,chapter,section,question_type,course_keys,lesson_keys,skill_candidates,course_mappings,mapping_verified,trust_tier,student_visible,payload_sha256,payload,updated_at", { count: "exact" })
    .eq("organization_id", current.organization_id)
    .contains("course_keys", [course])
    .contains("course_mappings", [{ course }]);

  // Student practice uses dedicated course rows only. A shared question that is
  // mapped to another course remains visible to staff QA but cannot enter a
  // student session for this course.
  if (current.role === "student") query = query.containedBy("course_keys", [course]);
  if (!includeAll) {
    query = query.eq("student_visible", true).eq("mapping_verified", true).in("trust_tier", READY_TRUST);
  }
  if (lessonKey) query = query.contains("lesson_keys", [lessonKey]);
  if (unit) query = query.contains("course_mappings", [{ course, unit: Number(unit) }]);
  if (bank) query = query.eq("bank_code", bank);

  const { data, count, error } = await query.order("question_id")
    .range(offset, offset + Math.max(limit, 1) - 1);
  if (error) throw error;

  return reply(req, {
    ok: true,
    private: true,
    course,
    bank: bank || null,
    lesson: lesson || null,
    unit: unit ? Number(unit) : null,
    scope: lesson ? "lesson" : unit ? "unit" : "course",
    view: includeAll ? "staff-all" : "student-ready",
    dedicated_course_only: current.role === "student",
    total: count ?? 0,
    limit,
    offset,
    questions: data ?? [],
  });
}

async function mediaUrl(req: Request, current: SessionAccount, url: URL) {
  const path = url.searchParams.get("path")?.trim() ?? "";
  const course = normaliseCourse(url.searchParams.get("course") ?? "");
  if (!safePath(path)) return fail(req, "Invalid private media path", 400, "invalid_media_path");

  const { data: objectRow, error: objectError } = await db.from("private_bank_media_objects")
    .select("object_path,mime_type,size_bytes,package_id")
    .eq("organization_id", current.organization_id)
    .eq("object_path", path)
    .maybeSingle();
  if (objectError) throw objectError;
  if (!objectRow) return fail(req, "Private media object not found", 404, "not_found");

  if (current.role === "student") {
    if (!safeCourse(course)) return fail(req, "A valid assigned course is required", 400, "invalid_course_scope");
    const denied = await authoriseStudentCourse(req, current, course);
    if (denied) return denied;
    const { data: packageRow, error: packageError } = await db.from("private_bank_packages")
      .select("manifest,display_aliases")
      .eq("organization_id", current.organization_id)
      .eq("id", objectRow.package_id)
      .maybeSingle();
    if (packageError) throw packageError;
    const targets = packageRow ? packageTargets(packageRow as JsonRecord) : [];
    if (!packageRow || targets.length !== 1 || targets[0] !== course) {
      return fail(req, "This media object is not dedicated to the student's assigned course", 403, "media_course_mismatch");
    }
  }

  const { data, error } = await db.storage.from(PRIVATE_BUCKET).createSignedUrl(path, 300);
  if (error) throw error;
  return reply(req, {
    ok: true,
    private: true,
    expires_in: 300,
    path,
    signed_url: data.signedUrl,
    mime_type: objectRow.mime_type,
    size_bytes: objectRow.size_bytes,
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: headers(req) });
  const url = new URL(req.url);
  const path = url.pathname.split("/practice-bank-api")[1] || "/";
  try {
    if (path === "/health" && req.method === "GET") {
      return reply(req, { ok: true, service: "echs-practice-bank-api", version: "1.2.0-stable-bank-identities" });
    }
    const current = await session(req);
    if (!canPractise(current)) return fail(req, "Student, teacher, or administrator sign-in is required", 403, "forbidden");
    if (path === "/inventory" && req.method === "GET") return await inventory(req, current, url);
    if (path === "/questions" && req.method === "GET") return await questions(req, current, url);
    if (path === "/media-url" && req.method === "GET") return await mediaUrl(req, current, url);
    return fail(req, "Route not found", 404, "not_found");
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : String(asRecord(error).message || "Unexpected practice bank error");
    return fail(req, message, 400);
  }
});
