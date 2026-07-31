import { createClient } from "npm:@supabase/supabase-js@2";

type Role = "admin" | "teacher" | "student" | "parent";
type SessionAccount = { account_id: string; organization_id: string; role: Role };
type CourseMapping = { course?: string; unit?: number; lesson_key?: string; lesson_title?: string; skill_key?: string; [key: string]: unknown };
type JsonRecord = Record<string, unknown>;
type PurgeJob = {
  id: string;
  organization_id: string;
  course_key: string;
  status: "pending" | "running" | "completed" | "failed";
  phase: string;
  dedicated_package_ids: string[];
  mixed_package_ids: string[];
  dedicated_bank_codes: string[];
  totals: JsonRecord;
  progress: JsonRecord;
  last_error?: string | null;
  created_at?: string;
  started_at?: string | null;
  completed_at?: string | null;
  updated_at?: string;
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const ALLOWED_ORIGINS = (Deno.env.get("ALLOWED_ORIGINS") ?? "https://2ed944-cloud.github.io,http://localhost:4173,http://127.0.0.1:4173")
  .split(",").map((value) => value.trim()).filter(Boolean);
const db = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const SUPPORTED_COURSES = ["ap-precalculus", "ib-math-ai", "ap-calculus", "algebra-2", "grade-9"];
const PRIVATE_BUCKET = "private-question-banks";
const MIXED_QUESTION_BATCH = 10;
const DEDICATED_QUESTION_BATCH = 100;
const MEDIA_BATCH = 25;
const PHASE_LABELS: Record<string, string> = {
  "mixed-questions": "Removing IB mappings from shared questions",
  "dedicated-questions": "Deleting dedicated IB questions",
  "dedicated-media": "Deleting dedicated IB media",
  "source-archives": "Deleting stored IB source archives",
  "mixed-packages": "Cleaning shared package metadata",
  "import-runs": "Cleaning IB import history",
  "dedicated-packages": "Deleting empty IB packages",
  "verify": "Verifying the IB reset",
  "completed": "IB Mathematics AI reset complete",
};

function responseHeaders(req: Request): HeadersInit {
  const origin = req.headers.get("origin") ?? "";
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0] ?? "";
  return {
    "access-control-allow-origin": allowed,
    "access-control-allow-headers": "authorization, content-type",
    "access-control-allow-methods": "GET, PATCH, POST, DELETE, OPTIONS",
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
function asRecord(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? value as JsonRecord : {};
}
function asStrings(value: unknown): string[] {
  return Array.isArray(value) ? value.map((item) => String(item ?? "")).filter(Boolean) : [];
}
function numberValue(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}
function canonicalJson(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return `[${value.map((item) => item === undefined ? "null" : canonicalJson(item)).join(",")}]`;
  if (typeof value === "object") {
    const row = value as JsonRecord;
    const keys = Object.keys(row).filter((key) => row[key] !== undefined).sort();
    return `{${keys.map((key) => `${JSON.stringify(key)}:${canonicalJson(row[key])}`).join(",")}}`;
  }
  const encoded = JSON.stringify(value);
  return encoded === undefined ? "null" : encoded;
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
function safeJobId(value: string) { return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value); }
function safeStoragePath(value: string) {
  return value.length > 0 && value.length <= 900 && !value.startsWith("/") && !value.includes("..") && /^[A-Za-z0-9._/+-]+$/.test(value);
}
function chunks<T>(values: T[], size = 100): T[][] {
  const out: T[][] = [];
  for (let index = 0; index < values.length; index += size) out.push(values.slice(index, index + size));
  return out;
}
function targetCourses(row: JsonRecord): string[] {
  const manifest = asRecord(row.manifest);
  const declared = asStrings(manifest.target_courses);
  if (declared.length) return [...new Set(declared)];
  const aliases = { ...asRecord(row.display_aliases), ...asRecord(manifest.display_aliases) };
  return Object.keys(aliases).filter((key) => SUPPORTED_COURSES.includes(key));
}
function dedicatedForCourse(row: JsonRecord, course: string) {
  const targets = targetCourses(row);
  if (targets.length === 1 && targets[0] === course) return true;
  return course === "ib-math-ai" && String(row.bank_code ?? "").startsWith("IBAI-");
}
function cleanAliases(value: unknown, course: string) {
  const aliases = { ...asRecord(value) };
  delete aliases[course];
  return aliases;
}
function cleanManifest(value: unknown, course: string, remainingTargets: string[], questionCount?: number) {
  const manifest: JsonRecord = { ...asRecord(value), target_courses: remainingTargets };
  const mappingCounts = { ...asRecord(manifest.mapping_counts) };
  for (const key of Object.keys(mappingCounts)) if (key.startsWith(`${course}:`)) delete mappingCounts[key];
  manifest.mapping_counts = mappingCounts;
  manifest.display_aliases = cleanAliases(manifest.display_aliases, course);
  if (questionCount !== undefined) manifest.questions = questionCount;
  return manifest;
}
function cleanPayload(value: unknown, course: string, mappings: CourseMapping[]) {
  const payload: JsonRecord = { ...asRecord(value), course_mappings: mappings };
  payload.display_bank_aliases = cleanAliases(payload.display_bank_aliases, course);
  const classification = { ...asRecord(payload.classification) };
  if (course === "ib-math-ai") {
    delete classification.ib_unit;
    delete classification.ib_lesson;
    delete classification.ib_lesson_title;
  }
  const primary = mappings[0];
  if (primary) {
    classification.course_scope = primary.course;
    classification.primary_unit = primary.unit;
    classification.primary_topic = primary.lesson_key;
    classification.primary_topic_title = primary.lesson_title;
    classification.topic = primary.lesson_key;
    classification.topic_title = primary.lesson_title;
    classification.mapping_verified = true;
    if (["ap-precalculus", "ap-calculus"].includes(String(primary.course ?? ""))) {
      classification.ap_unit = primary.unit;
      classification.ap_topic = primary.lesson_key;
      classification.ap_topic_title = primary.lesson_title;
    }
  }
  payload.classification = classification;
  const skillKeys = [...new Set(mappings.map((mapping) => String(mapping.skill_key ?? "")).filter(Boolean))];
  payload.skill_key = skillKeys[0] ?? null;
  payload.skill_keys = skillKeys;
  return payload;
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
  if (!lesson && !unit && !isStaff(current)) return fail(req, "Students must open practice from an unlocked lesson", 400, "invalid_lesson_scope");
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
    scope: lesson ? "lesson" : unit ? "unit" : "course", total: count ?? 0, limit, offset,
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
  const { data, error } = await db.storage.from(PRIVATE_BUCKET).createSignedUrl(path, 300);
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

function purgePercent(job: PurgeJob) {
  if (job.status === "completed" || job.phase === "completed") return 100;
  const totals = asRecord(job.totals), progress = asRecord(job.progress);
  const questionTotal = Math.max(1, numberValue(totals.questions));
  const mediaTotal = Math.max(1, numberValue(totals.media));
  const packageTotal = Math.max(1, numberValue(totals.packages));
  const archiveTotal = Math.max(1, numberValue(totals.archives));
  const questionPart = Math.min(1, numberValue(progress.questions_processed) / questionTotal) * 55;
  const mediaPart = Math.min(1, numberValue(progress.media_deleted) / mediaTotal) * 25;
  const packagePart = Math.min(1, (numberValue(progress.packages_deleted) + numberValue(progress.mixed_packages_updated)) / packageTotal) * 15;
  const archivePart = Math.min(1, numberValue(progress.archives_deleted) / archiveTotal) * 5;
  return Math.max(1, Math.min(99, Math.floor(questionPart + mediaPart + packagePart + archivePart)));
}
function purgeSnapshot(job: PurgeJob) {
  return {
    id: job.id,
    course: job.course_key,
    status: job.status,
    phase: job.phase,
    phase_label: PHASE_LABELS[job.phase] || job.phase,
    percent: purgePercent(job),
    totals: asRecord(job.totals),
    progress: asRecord(job.progress),
    last_error: job.last_error || null,
    created_at: job.created_at || null,
    started_at: job.started_at || null,
    completed_at: job.completed_at || null,
    updated_at: job.updated_at || null,
  };
}
async function updatePurgeJob(current: SessionAccount, jobId: string, values: JsonRecord) {
  const { data, error } = await db.from("private_bank_course_purge_jobs").update({ ...values, updated_at: new Date().toISOString() })
    .eq("organization_id", current.organization_id).eq("id", jobId).select("*").single();
  if (error) throw error;
  return data as PurgeJob;
}
async function getPurgeJobRow(current: SessionAccount, jobId: string) {
  const { data, error } = await db.from("private_bank_course_purge_jobs").select("*")
    .eq("organization_id", current.organization_id).eq("id", jobId).maybeSingle();
  if (error) throw error;
  return data as PurgeJob | null;
}
async function getPurgeJob(req: Request, current: SessionAccount, jobId: string) {
  if (current.role !== "admin") return fail(req, "Administrator access is required", 403, "forbidden");
  if (!safeJobId(jobId)) return fail(req, "Invalid purge job", 400, "invalid_purge_job");
  const job = await getPurgeJobRow(current, jobId);
  if (!job) return fail(req, "Purge job not found", 404, "not_found");
  return reply(req, { ok: true, private: true, job: purgeSnapshot(job) });
}
async function countCourseQuestions(current: SessionAccount, course: string) {
  const { count, error } = await db.from("private_bank_questions").select("question_id", { count: "exact", head: true })
    .eq("organization_id", current.organization_id).contains("course_keys", [course]);
  if (error) throw error;
  return count ?? 0;
}
async function countDedicatedMedia(current: SessionAccount, packageIds: string[]) {
  if (!packageIds.length) return 0;
  const { count, error } = await db.from("private_bank_media_objects").select("object_path", { count: "exact", head: true })
    .eq("organization_id", current.organization_id).in("package_id", packageIds);
  if (error) throw error;
  return count ?? 0;
}
async function startCoursePurge(req: Request, current: SessionAccount, course: string) {
  if (current.role !== "admin") return fail(req, "Administrator access is required", 403, "forbidden");
  if (!safeCourse(course)) return fail(req, "Invalid course", 400, "invalid_course");
  const { data: existing, error: existingError } = await db.from("private_bank_course_purge_jobs").select("*")
    .eq("organization_id", current.organization_id).eq("course_key", course)
    .in("status", ["pending", "running", "failed"]).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (existingError) throw existingError;
  if (existing) {
    let job = existing as PurgeJob;
    if (job.status === "failed") job = await updatePurgeJob(current, job.id, { status: "pending", last_error: null });
    return reply(req, { ok: true, private: true, resumed: true, job: purgeSnapshot(job) }, 202);
  }
  const { data: packages, error: packageError } = await db.from("private_bank_packages")
    .select("id,bank_code,question_count,storage_path,display_aliases,manifest")
    .eq("organization_id", current.organization_id);
  if (packageError) throw packageError;
  const dedicated: JsonRecord[] = [], mixed: JsonRecord[] = [];
  for (const packageRow of packages ?? []) {
    const row = packageRow as JsonRecord;
    const targets = targetCourses(row);
    if (!targets.includes(course) && !(course === "ib-math-ai" && String(row.bank_code ?? "").startsWith("IBAI-"))) continue;
    (dedicatedForCourse(row, course) ? dedicated : mixed).push(row);
  }
  const dedicatedIds = dedicated.map((row) => String(row.id));
  const mixedIds = mixed.map((row) => String(row.id));
  const questionTotal = await countCourseQuestions(current, course);
  const mediaTotal = await countDedicatedMedia(current, dedicatedIds);
  const archiveTotal = dedicated.filter((row) => Boolean(row.storage_path)).length;
  const now = new Date().toISOString();
  const row = {
    organization_id: current.organization_id,
    course_key: course,
    status: "pending",
    phase: "mixed-questions",
    dedicated_package_ids: dedicatedIds,
    mixed_package_ids: mixedIds,
    dedicated_bank_codes: dedicated.map((item) => String(item.bank_code)),
    totals: {
      questions: questionTotal,
      media: mediaTotal,
      packages: dedicatedIds.length + mixedIds.length,
      dedicated_packages: dedicatedIds.length,
      mixed_packages: mixedIds.length,
      archives: archiveTotal,
    },
    progress: {
      questions_processed: 0,
      questions_deleted: 0,
      mappings_removed: 0,
      media_deleted: 0,
      archives_deleted: 0,
      packages_deleted: 0,
      mixed_packages_updated: 0,
      trust_records_deleted: 0,
      import_runs_deleted: 0,
    },
    created_by: current.account_id,
    started_at: now,
    updated_at: now,
  };
  const { data, error } = await db.from("private_bank_course_purge_jobs").insert(row).select("*").single();
  if (error) throw error;
  return reply(req, { ok: true, private: true, resumed: false, job: purgeSnapshot(data as PurgeJob) }, 202);
}
async function removeStorageObjects(bucket: string, paths: string[]) {
  const unique = [...new Set(paths.filter(Boolean))];
  if (!unique.length) return 0;
  const { error } = await db.storage.from(bucket).remove(unique);
  if (error && !/not found|does not exist/i.test(String(error.message ?? error))) throw error;
  return unique.length;
}
async function deleteOrphanTrustRecords(questionIds: string[]) {
  const unique = [...new Set(questionIds.filter(Boolean))];
  if (!unique.length) return 0;
  const { data: retainedRows, error: retainedError } = await db.from("private_bank_questions").select("question_id").in("question_id", unique);
  if (retainedError) throw retainedError;
  const retained = new Set((retainedRows ?? []).map((row) => String(row.question_id)));
  const orphaned = unique.filter((id) => !retained.has(id));
  if (!orphaned.length) return 0;
  const { error } = await db.from("question_trust_records").delete().in("question_id", orphaned);
  if (error) throw error;
  return orphaned.length;
}
async function processMixedQuestions(current: SessionAccount, job: PurgeJob) {
  const packageIds = asStrings(job.mixed_package_ids);
  if (!packageIds.length) return updatePurgeJob(current, job.id, { phase: "dedicated-questions" });
  const { data, error } = await db.from("private_bank_questions")
    .select("question_id,package_id,course_mappings,payload")
    .eq("organization_id", current.organization_id).contains("course_keys", [job.course_key])
    .in("package_id", packageIds).order("question_id").limit(MIXED_QUESTION_BATCH);
  if (error) throw error;
  const rows = data ?? [];
  if (!rows.length) return updatePurgeJob(current, job.id, { phase: "dedicated-questions" });
  let deleted = 0, mappingsRemoved = 0, trustDeleted = 0;
  for (const row of rows) {
    const mappings = (Array.isArray(row.course_mappings) ? row.course_mappings : []) as CourseMapping[];
    const remaining = mappings.filter((mapping) => String(mapping.course ?? "") !== job.course_key);
    mappingsRemoved += mappings.length - remaining.length;
    const questionId = String(row.question_id);
    if (!remaining.length) {
      const { error: deleteError } = await db.from("private_bank_questions").delete()
        .eq("organization_id", current.organization_id).eq("question_id", questionId);
      if (deleteError) throw deleteError;
      deleted += 1;
      trustDeleted += await deleteOrphanTrustRecords([questionId]);
      continue;
    }
    const courseKeys = [...new Set(remaining.map((mapping) => String(mapping.course ?? "")).filter(Boolean))];
    const lessonKeys = [...new Set(remaining.map((mapping) => `${String(mapping.course ?? "")}:${String(mapping.lesson_key ?? "")}`).filter((value) => !value.endsWith(":")))];
    const skillCandidates = [...new Set(remaining.map((mapping) => String(mapping.skill_key ?? "")).filter(Boolean))];
    const payload = cleanPayload(row.payload, job.course_key, remaining);
    const { error: updateError } = await db.from("private_bank_questions").update({
      course_keys: courseKeys,
      lesson_keys: lessonKeys,
      skill_candidates: skillCandidates,
      course_mappings: remaining,
      payload,
      payload_sha256: await sha256(canonicalJson(payload)),
      updated_at: new Date().toISOString(),
    }).eq("organization_id", current.organization_id).eq("question_id", questionId);
    if (updateError) throw updateError;
  }
  const progress = asRecord(job.progress);
  return updatePurgeJob(current, job.id, {
    status: "running",
    progress: {
      ...progress,
      questions_processed: numberValue(progress.questions_processed) + rows.length,
      questions_deleted: numberValue(progress.questions_deleted) + deleted,
      mappings_removed: numberValue(progress.mappings_removed) + mappingsRemoved,
      trust_records_deleted: numberValue(progress.trust_records_deleted) + trustDeleted,
    },
    last_error: null,
  });
}
async function processDedicatedQuestions(current: SessionAccount, job: PurgeJob) {
  const packageIds = asStrings(job.dedicated_package_ids);
  if (!packageIds.length) return updatePurgeJob(current, job.id, { phase: "dedicated-media" });
  const { data, error } = await db.from("private_bank_questions").select("question_id")
    .eq("organization_id", current.organization_id).in("package_id", packageIds)
    .order("question_id").limit(DEDICATED_QUESTION_BATCH);
  if (error) throw error;
  const ids = (data ?? []).map((row) => String(row.question_id));
  if (!ids.length) return updatePurgeJob(current, job.id, { phase: "dedicated-media" });
  const { error: deleteError } = await db.from("private_bank_questions").delete()
    .eq("organization_id", current.organization_id).in("question_id", ids);
  if (deleteError) throw deleteError;
  const trustDeleted = await deleteOrphanTrustRecords(ids);
  const progress = asRecord(job.progress);
  return updatePurgeJob(current, job.id, {
    status: "running",
    progress: {
      ...progress,
      questions_processed: numberValue(progress.questions_processed) + ids.length,
      questions_deleted: numberValue(progress.questions_deleted) + ids.length,
      trust_records_deleted: numberValue(progress.trust_records_deleted) + trustDeleted,
    },
    last_error: null,
  });
}
async function processDedicatedMedia(current: SessionAccount, job: PurgeJob) {
  const packageIds = asStrings(job.dedicated_package_ids);
  if (!packageIds.length) return updatePurgeJob(current, job.id, { phase: "source-archives" });
  const { data, error } = await db.from("private_bank_media_objects").select("object_path")
    .eq("organization_id", current.organization_id).in("package_id", packageIds)
    .order("object_path").limit(MEDIA_BATCH);
  if (error) throw error;
  const paths = (data ?? []).map((row) => String(row.object_path ?? "")).filter(Boolean);
  if (!paths.length) return updatePurgeJob(current, job.id, { phase: "source-archives" });
  const removed = await removeStorageObjects(PRIVATE_BUCKET, paths);
  const { error: deleteError } = await db.from("private_bank_media_objects").delete()
    .eq("organization_id", current.organization_id).in("object_path", paths);
  if (deleteError) throw deleteError;
  const progress = asRecord(job.progress);
  return updatePurgeJob(current, job.id, {
    status: "running",
    progress: { ...progress, media_deleted: numberValue(progress.media_deleted) + removed },
    last_error: null,
  });
}
async function processSourceArchives(current: SessionAccount, job: PurgeJob) {
  const packageIds = asStrings(job.dedicated_package_ids);
  if (!packageIds.length) return updatePurgeJob(current, job.id, { phase: "mixed-packages" });
  const { data, error } = await db.from("private_bank_packages").select("id,storage_bucket,storage_path")
    .eq("organization_id", current.organization_id).in("id", packageIds).order("bank_code");
  if (error) throw error;
  const row = (data ?? []).find((item) => Boolean(item.storage_path));
  if (!row) return updatePurgeJob(current, job.id, { phase: "mixed-packages" });
  const path = String(row.storage_path ?? "");
  const removed = path ? await removeStorageObjects(String(row.storage_bucket || PRIVATE_BUCKET), [path]) : 0;
  const { error: updateError } = await db.from("private_bank_packages").update({ storage_path: null, updated_at: new Date().toISOString() })
    .eq("organization_id", current.organization_id).eq("id", row.id);
  if (updateError) throw updateError;
  const progress = asRecord(job.progress);
  return updatePurgeJob(current, job.id, {
    status: "running",
    progress: { ...progress, archives_deleted: numberValue(progress.archives_deleted) + removed },
    last_error: null,
  });
}
async function processMixedPackages(current: SessionAccount, job: PurgeJob) {
  const packageIds = asStrings(job.mixed_package_ids);
  if (!packageIds.length) return updatePurgeJob(current, job.id, { phase: "import-runs" });
  const { data, error } = await db.from("private_bank_packages").select("id,display_aliases,manifest")
    .eq("organization_id", current.organization_id).in("id", packageIds).order("bank_code");
  if (error) throw error;
  const row = (data ?? []).find((item) => targetCourses(item as JsonRecord).includes(job.course_key));
  if (!row) return updatePurgeJob(current, job.id, { phase: "import-runs" });
  const { count, error: countError } = await db.from("private_bank_questions").select("question_id", { count: "exact", head: true })
    .eq("organization_id", current.organization_id).eq("package_id", row.id);
  if (countError) throw countError;
  const remainingTargets = targetCourses(row as JsonRecord).filter((value) => value !== job.course_key);
  const { error: updateError } = await db.from("private_bank_packages").update({
    display_aliases: cleanAliases(row.display_aliases, job.course_key),
    manifest: cleanManifest(row.manifest, job.course_key, remainingTargets, count ?? 0),
    question_count: count ?? 0,
    updated_at: new Date().toISOString(),
  }).eq("organization_id", current.organization_id).eq("id", row.id);
  if (updateError) throw updateError;
  const progress = asRecord(job.progress);
  return updatePurgeJob(current, job.id, {
    status: "running",
    progress: { ...progress, mixed_packages_updated: numberValue(progress.mixed_packages_updated) + 1 },
    last_error: null,
  });
}
async function processImportRuns(current: SessionAccount, job: PurgeJob) {
  const codes = asStrings(job.dedicated_bank_codes);
  let deleted = 0;
  if (codes.length) {
    const { data, error } = await db.from("private_bank_import_runs").delete()
      .eq("organization_id", current.organization_id).in("bank_code", codes).select("id");
    if (error) throw error;
    deleted = (data ?? []).length;
  }
  const progress = asRecord(job.progress);
  return updatePurgeJob(current, job.id, {
    status: "running",
    phase: "dedicated-packages",
    progress: { ...progress, import_runs_deleted: numberValue(progress.import_runs_deleted) + deleted },
    last_error: null,
  });
}
async function processDedicatedPackages(current: SessionAccount, job: PurgeJob) {
  const packageIds = asStrings(job.dedicated_package_ids);
  if (!packageIds.length) return updatePurgeJob(current, job.id, { phase: "verify" });
  const { data, error } = await db.from("private_bank_packages").select("id")
    .eq("organization_id", current.organization_id).in("id", packageIds).order("bank_code").limit(1);
  if (error) throw error;
  const row = (data ?? [])[0];
  if (!row) return updatePurgeJob(current, job.id, { phase: "verify" });
  const { error: deleteError } = await db.from("private_bank_packages").delete()
    .eq("organization_id", current.organization_id).eq("id", row.id);
  if (deleteError) throw deleteError;
  const progress = asRecord(job.progress);
  return updatePurgeJob(current, job.id, {
    status: "running",
    progress: { ...progress, packages_deleted: numberValue(progress.packages_deleted) + 1 },
    last_error: null,
  });
}
async function verifyPurge(current: SessionAccount, job: PurgeJob) {
  const remainingQuestions = await countCourseQuestions(current, job.course_key);
  if (remainingQuestions > 0) {
    const { data, error } = await db.from("private_bank_questions").select("package_id,bank_code")
      .eq("organization_id", current.organization_id).contains("course_keys", [job.course_key]).limit(25);
    if (error) throw error;
    const dedicatedIds = new Set(asStrings(job.dedicated_package_ids));
    const mixedIds = new Set(asStrings(job.mixed_package_ids));
    let hasDedicated = false;
    for (const row of data ?? []) {
      const packageId = String(row.package_id ?? "");
      if (!packageId) continue;
      if (dedicatedIds.has(packageId) || (job.course_key === "ib-math-ai" && String(row.bank_code ?? "").startsWith("IBAI-"))) {
        dedicatedIds.add(packageId); hasDedicated = true;
      } else mixedIds.add(packageId);
    }
    return updatePurgeJob(current, job.id, {
      status: "running",
      phase: hasDedicated ? "dedicated-questions" : "mixed-questions",
      dedicated_package_ids: [...dedicatedIds],
      mixed_package_ids: [...mixedIds],
      last_error: null,
    });
  }
  const { data: packages, error: packageError } = await db.from("private_bank_packages")
    .select("id,bank_code,display_aliases,manifest").eq("organization_id", current.organization_id);
  if (packageError) throw packageError;
  const remainingPackages = (packages ?? []).filter((row) => targetCourses(row as JsonRecord).includes(job.course_key));
  if (remainingPackages.length) {
    const dedicatedIds = new Set(asStrings(job.dedicated_package_ids));
    const mixedIds = new Set(asStrings(job.mixed_package_ids));
    const codes = new Set(asStrings(job.dedicated_bank_codes));
    let hasDedicated = false;
    for (const row of remainingPackages) {
      const packageId = String(row.id);
      if (dedicatedForCourse(row as JsonRecord, job.course_key)) {
        dedicatedIds.add(packageId); codes.add(String(row.bank_code)); hasDedicated = true;
      } else mixedIds.add(packageId);
    }
    return updatePurgeJob(current, job.id, {
      status: "running",
      phase: hasDedicated ? "dedicated-media" : "mixed-packages",
      dedicated_package_ids: [...dedicatedIds],
      mixed_package_ids: [...mixedIds],
      dedicated_bank_codes: [...codes],
      last_error: null,
    });
  }
  return updatePurgeJob(current, job.id, {
    status: "completed",
    phase: "completed",
    completed_at: new Date().toISOString(),
    last_error: null,
  });
}
async function processPurgeStep(req: Request, current: SessionAccount, jobId: string) {
  if (current.role !== "admin") return fail(req, "Administrator access is required", 403, "forbidden");
  if (!safeJobId(jobId)) return fail(req, "Invalid purge job", 400, "invalid_purge_job");
  let job = await getPurgeJobRow(current, jobId);
  if (!job) return fail(req, "Purge job not found", 404, "not_found");
  if (job.status === "completed") return reply(req, { ok: true, private: true, job: purgeSnapshot(job) });
  try {
    if (job.status !== "running" || job.last_error) job = await updatePurgeJob(current, job.id, { status: "running", last_error: null });
    switch (job.phase) {
      case "mixed-questions": job = await processMixedQuestions(current, job); break;
      case "dedicated-questions": job = await processDedicatedQuestions(current, job); break;
      case "dedicated-media": job = await processDedicatedMedia(current, job); break;
      case "source-archives": job = await processSourceArchives(current, job); break;
      case "mixed-packages": job = await processMixedPackages(current, job); break;
      case "import-runs": job = await processImportRuns(current, job); break;
      case "dedicated-packages": job = await processDedicatedPackages(current, job); break;
      case "verify": job = await verifyPurge(current, job); break;
      case "completed": job = await updatePurgeJob(current, job.id, { status: "completed", completed_at: job.completed_at || new Date().toISOString() }); break;
      default: throw new Error(`Unknown purge phase ${job.phase}`);
    }
    return reply(req, { ok: true, private: true, job: purgeSnapshot(job) });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(asRecord(error).message || "Unexpected private bank purge error");
    await updatePurgeJob(current, job.id, { status: "failed", last_error: message }).catch(() => undefined);
    throw error;
  }
}


async function deletePackageStep(req: Request, current: SessionAccount, bankCode: string) {
  if (current.role !== "admin") return fail(req, "Administrator access is required", 403, "forbidden");
  if (!safeBankCode(bankCode)) return fail(req, "Invalid bank code", 400, "invalid_bank_code");
  const { data: packageRow, error: packageError } = await db.from("private_bank_packages")
    .select("id,bank_code,bank_slug,display_aliases,storage_bucket,storage_path")
    .eq("organization_id", current.organization_id).eq("bank_code", bankCode).maybeSingle();
  if (packageError) throw packageError;
  if (!packageRow) return reply(req, { ok: true, private: true, status: "completed", phase: "completed", bank_code: bankCode });

  const { data: questionRows, error: questionError } = await db.from("private_bank_questions").select("question_id")
    .eq("organization_id", current.organization_id).eq("package_id", packageRow.id)
    .order("question_id").limit(DEDICATED_QUESTION_BATCH);
  if (questionError) throw questionError;
  const questionIds = (questionRows ?? []).map((row) => String(row.question_id ?? "")).filter(Boolean);
  if (questionIds.length) {
    const { error: deleteError } = await db.from("private_bank_questions").delete()
      .eq("organization_id", current.organization_id).eq("package_id", packageRow.id).in("question_id", questionIds);
    if (deleteError) throw deleteError;
    const trustDeleted = await deleteOrphanTrustRecords(questionIds);
    return reply(req, { ok: true, private: true, status: "running", phase: "questions", bank_code: bankCode,
      deleted: { questions: questionIds.length, trust_records: trustDeleted } }, 202);
  }

  const { data: mediaRows, error: mediaError } = await db.from("private_bank_media_objects").select("object_path")
    .eq("organization_id", current.organization_id).eq("package_id", packageRow.id)
    .order("object_path").limit(MEDIA_BATCH);
  if (mediaError) throw mediaError;
  const mediaPaths = (mediaRows ?? []).map((row) => String(row.object_path ?? "")).filter(Boolean);
  if (mediaPaths.length) {
    const removed = await removeStorageObjects(String(packageRow.storage_bucket || PRIVATE_BUCKET), mediaPaths);
    const { error: deleteError } = await db.from("private_bank_media_objects").delete()
      .eq("organization_id", current.organization_id).eq("package_id", packageRow.id).in("object_path", mediaPaths);
    if (deleteError) throw deleteError;
    return reply(req, { ok: true, private: true, status: "running", phase: "media", bank_code: bankCode,
      deleted: { media: removed } }, 202);
  }

  const archivePath = String(packageRow.storage_path ?? "");
  if (archivePath) {
    const removed = await removeStorageObjects(String(packageRow.storage_bucket || PRIVATE_BUCKET), [archivePath]);
    const { error: updateError } = await db.from("private_bank_packages").update({ storage_path: null, updated_at: new Date().toISOString() })
      .eq("organization_id", current.organization_id).eq("id", packageRow.id);
    if (updateError) throw updateError;
    return reply(req, { ok: true, private: true, status: "running", phase: "archive", bank_code: bankCode,
      deleted: { archives: removed } }, 202);
  }

  const { data: runs, error: runError } = await db.from("private_bank_import_runs").delete()
    .eq("organization_id", current.organization_id).eq("bank_code", bankCode).select("id");
  if (runError) throw runError;
  const { error: deletePackageError } = await db.from("private_bank_packages").delete()
    .eq("organization_id", current.organization_id).eq("id", packageRow.id);
  if (deletePackageError) throw deletePackageError;
  return reply(req, { ok: true, private: true, status: "completed", phase: "completed", bank_code: bankCode,
    deleted: { packages: 1, import_runs: (runs ?? []).length } });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: responseHeaders(req) });
  const url = new URL(req.url); const path = url.pathname.split("/private-bank-api")[1] || "/";
  try {
    if (path === "/health" && req.method === "GET") return reply(req, { ok: true, service: "echs-private-bank-api", version: "1.5.0-specific-bank-delete" });
    const current = await session(req);
    if (!canPractise(current)) return fail(req, "Student, teacher, or administrator sign-in is required", 403, "forbidden");
    if (path === "/student-questions" && req.method === "GET") return await studentQuestions(req, current, url);
    if (path === "/media-url" && req.method === "GET") return await mediaUrl(req, current, url);
    const questionMatch = path.match(/^\/questions\/([A-Za-z0-9._:-]+)$/);
    if (questionMatch && req.method === "GET") return await questionDetail(req, current, questionMatch[1]);
    if (!isStaff(current)) return fail(req, "Teacher or administrator sign-in is required", 403, "forbidden");
    if (path === "/packages" && req.method === "GET") return await listPackages(req, current);
    if (path === "/questions" && req.method === "GET") return await staffQuestions(req, current, url);
    const courseMatch = path.match(/^\/courses\/([a-z0-9-]+)$/);
    if (courseMatch && req.method === "DELETE") return await startCoursePurge(req, current, courseMatch[1]);
    const purgeMatch = path.match(/^\/course-purges\/([0-9a-f-]+)$/i);
    if (purgeMatch && req.method === "GET") return await getPurgeJob(req, current, purgeMatch[1]);
    const purgeStepMatch = path.match(/^\/course-purges\/([0-9a-f-]+)\/step$/i);
    if (purgeStepMatch && req.method === "POST") return await processPurgeStep(req, current, purgeStepMatch[1]);
    const packageMatch = path.match(/^\/packages\/([A-Z0-9-]+)$/);
    if (packageMatch && req.method === "GET") return await packageDetail(req, current, packageMatch[1]);
    if (packageMatch && req.method === "PATCH") return await updatePackageState(req, current, packageMatch[1]);
    if (packageMatch && req.method === "DELETE") return await deletePackageStep(req, current, packageMatch[1]);
    return fail(req, "Route not found", 404, "not_found");
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : String(asRecord(error).message || "Unexpected private bank error");
    return fail(req, message, 400);
  }
});
