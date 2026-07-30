import { createClient } from "npm:@supabase/supabase-js@2";

type Role = "admin" | "teacher" | "student" | "parent";
type SessionAccount = { account_id: string; organization_id: string; role: Role };
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
const MIXED_BATCH = 100;
const QUESTION_BATCH = 250;
const MEDIA_BATCH = 100;
const PHASE_LABELS: Record<string, string> = {
  "mixed-questions": "Removing course mappings from shared questions",
  "dedicated-questions": "Deleting dedicated course questions",
  "dedicated-media": "Deleting dedicated course media",
  "source-archives": "Deleting stored source archives",
  "mixed-packages": "Cleaning shared package metadata",
  "import-runs": "Cleaning course import history",
  "dedicated-packages": "Deleting empty course packages",
  "verify": "Verifying the course reset",
  "completed": "Course bank reset complete",
};

function responseHeaders(req: Request): HeadersInit {
  const origin = req.headers.get("origin") ?? "";
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0] ?? "";
  return {
    "access-control-allow-origin": allowed,
    "access-control-allow-headers": "authorization, content-type",
    "access-control-allow-methods": "GET, POST, DELETE, OPTIONS",
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
function safeCourse(value: string) { return SUPPORTED_COURSES.includes(value); }
function safeJobId(value: string) { return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value); }
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
function cleanManifest(value: unknown, course: string, remainingTargets: string[], questionCount: number) {
  const manifest: JsonRecord = { ...asRecord(value), target_courses: remainingTargets, questions: questionCount };
  const mappingCounts = { ...asRecord(manifest.mapping_counts) };
  for (const key of Object.keys(mappingCounts)) if (key.startsWith(`${course}:`)) delete mappingCounts[key];
  manifest.mapping_counts = mappingCounts;
  manifest.display_aliases = cleanAliases(manifest.display_aliases, course);
  return manifest;
}
function percent(job: PurgeJob) {
  if (job.status === "completed" || job.phase === "completed") return 100;
  const totals = asRecord(job.totals), progress = asRecord(job.progress);
  const qTotal = Math.max(1, numberValue(totals.questions));
  const mTotal = Math.max(1, numberValue(totals.media));
  const pTotal = Math.max(1, numberValue(totals.packages));
  const aTotal = Math.max(1, numberValue(totals.archives));
  const q = Math.min(1, numberValue(progress.questions_processed) / qTotal) * 55;
  const m = Math.min(1, numberValue(progress.media_deleted) / mTotal) * 25;
  const p = Math.min(1, (numberValue(progress.packages_deleted) + numberValue(progress.mixed_packages_updated)) / pTotal) * 15;
  const a = Math.min(1, numberValue(progress.archives_deleted) / aTotal) * 5;
  return Math.max(1, Math.min(99, Math.floor(q + m + p + a)));
}
function snapshot(job: PurgeJob) {
  return {
    id: job.id,
    course: job.course_key,
    status: job.status,
    phase: job.phase,
    phase_label: PHASE_LABELS[job.phase] || job.phase,
    percent: percent(job),
    totals: asRecord(job.totals),
    progress: asRecord(job.progress),
    last_error: job.last_error || null,
    created_at: job.created_at || null,
    started_at: job.started_at || null,
    completed_at: job.completed_at || null,
    updated_at: job.updated_at || null,
  };
}
async function jobRow(current: SessionAccount, id: string) {
  const { data, error } = await db.from("private_bank_course_purge_jobs").select("*")
    .eq("organization_id", current.organization_id).eq("id", id).maybeSingle();
  if (error) throw error;
  return data as PurgeJob | null;
}
async function updateJob(current: SessionAccount, id: string, values: JsonRecord) {
  const { data, error } = await db.from("private_bank_course_purge_jobs")
    .update({ ...values, updated_at: new Date().toISOString() })
    .eq("organization_id", current.organization_id).eq("id", id).select("*").single();
  if (error) throw error;
  return data as PurgeJob;
}
async function countQuestions(current: SessionAccount, course: string) {
  const { count, error } = await db.from("private_bank_questions").select("question_id", { count: "exact", head: true })
    .eq("organization_id", current.organization_id).contains("course_keys", [course]);
  if (error) throw error;
  return count ?? 0;
}
async function countMedia(current: SessionAccount, packageIds: string[]) {
  if (!packageIds.length) return 0;
  const { count, error } = await db.from("private_bank_media_objects").select("object_path", { count: "exact", head: true })
    .eq("organization_id", current.organization_id).in("package_id", packageIds);
  if (error) throw error;
  return count ?? 0;
}
async function start(req: Request, current: SessionAccount, course: string) {
  if (!safeCourse(course)) return fail(req, "Invalid course", 400, "invalid_course");
  const { data: existing, error: existingError } = await db.from("private_bank_course_purge_jobs").select("*")
    .eq("organization_id", current.organization_id).eq("course_key", course)
    .in("status", ["pending", "running", "failed"]).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (existingError) throw existingError;
  if (existing) {
    let job = existing as PurgeJob;
    if (job.status === "failed") job = await updateJob(current, job.id, { status: "pending", last_error: null });
    return reply(req, { ok: true, resumed: true, job: snapshot(job) }, 202);
  }

  const { data: packages, error: packageError } = await db.from("private_bank_packages")
    .select("id,bank_code,storage_path,display_aliases,manifest")
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
  const now = new Date().toISOString();
  const insert = {
    organization_id: current.organization_id,
    course_key: course,
    status: "pending",
    phase: "mixed-questions",
    dedicated_package_ids: dedicatedIds,
    mixed_package_ids: mixedIds,
    dedicated_bank_codes: dedicated.map((row) => String(row.bank_code)),
    totals: {
      questions: await countQuestions(current, course),
      media: await countMedia(current, dedicatedIds),
      packages: dedicatedIds.length + mixedIds.length,
      dedicated_packages: dedicatedIds.length,
      mixed_packages: mixedIds.length,
      archives: dedicated.filter((row) => Boolean(row.storage_path)).length,
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
  const { data, error } = await db.from("private_bank_course_purge_jobs").insert(insert).select("*").single();
  if (error) throw error;
  return reply(req, { ok: true, resumed: false, job: snapshot(data as PurgeJob) }, 202);
}
async function deleteOrphanTrust(ids: string[]) {
  const unique = [...new Set(ids.filter(Boolean))];
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
async function mixedQuestions(current: SessionAccount, job: PurgeJob) {
  const packageIds = asStrings(job.mixed_package_ids);
  if (!packageIds.length) return updateJob(current, job.id, { phase: "dedicated-questions" });
  const { data, error } = await db.rpc("purge_private_bank_course_mappings_batch", {
    p_organization_id: current.organization_id,
    p_course_key: job.course_key,
    p_package_ids: packageIds,
    p_limit: MIXED_BATCH,
  });
  if (error) throw error;
  const result = asRecord(data);
  const processed = numberValue(result.processed);
  if (!processed) return updateJob(current, job.id, { phase: "dedicated-questions" });
  const deletedIds = asStrings(result.deleted_ids);
  const trustDeleted = await deleteOrphanTrust(deletedIds);
  const progress = asRecord(job.progress);
  return updateJob(current, job.id, {
    status: "running",
    progress: {
      ...progress,
      questions_processed: numberValue(progress.questions_processed) + processed,
      questions_deleted: numberValue(progress.questions_deleted) + numberValue(result.deleted),
      mappings_removed: numberValue(progress.mappings_removed) + numberValue(result.mappings_removed),
      trust_records_deleted: numberValue(progress.trust_records_deleted) + trustDeleted,
    },
    last_error: null,
  });
}
async function dedicatedQuestions(current: SessionAccount, job: PurgeJob) {
  const packageIds = asStrings(job.dedicated_package_ids);
  if (!packageIds.length) return updateJob(current, job.id, { phase: "dedicated-media" });
  const { data, error } = await db.rpc("delete_private_bank_questions_batch", {
    p_organization_id: current.organization_id,
    p_package_ids: packageIds,
    p_limit: QUESTION_BATCH,
  });
  if (error) throw error;
  const result = asRecord(data), processed = numberValue(result.processed), ids = asStrings(result.deleted_ids);
  if (!processed) return updateJob(current, job.id, { phase: "dedicated-media" });
  const trustDeleted = await deleteOrphanTrust(ids);
  const progress = asRecord(job.progress);
  return updateJob(current, job.id, {
    status: "running",
    progress: {
      ...progress,
      questions_processed: numberValue(progress.questions_processed) + processed,
      questions_deleted: numberValue(progress.questions_deleted) + processed,
      trust_records_deleted: numberValue(progress.trust_records_deleted) + trustDeleted,
    },
    last_error: null,
  });
}
async function dedicatedMedia(current: SessionAccount, job: PurgeJob) {
  const packageIds = asStrings(job.dedicated_package_ids);
  if (!packageIds.length) return updateJob(current, job.id, { phase: "source-archives" });
  const { data, error } = await db.from("private_bank_media_objects").select("object_path")
    .eq("organization_id", current.organization_id).in("package_id", packageIds)
    .order("object_path").limit(MEDIA_BATCH);
  if (error) throw error;
  const paths = (data ?? []).map((row) => String(row.object_path ?? "")).filter(Boolean);
  if (!paths.length) return updateJob(current, job.id, { phase: "source-archives" });
  const { error: storageError } = await db.storage.from(PRIVATE_BUCKET).remove(paths);
  if (storageError && !/not found|does not exist/i.test(String(storageError.message ?? storageError))) throw storageError;
  const { error: deleteError } = await db.from("private_bank_media_objects").delete()
    .eq("organization_id", current.organization_id).in("object_path", paths);
  if (deleteError) throw deleteError;
  const progress = asRecord(job.progress);
  return updateJob(current, job.id, {
    status: "running",
    progress: { ...progress, media_deleted: numberValue(progress.media_deleted) + paths.length },
    last_error: null,
  });
}
async function sourceArchives(current: SessionAccount, job: PurgeJob) {
  const packageIds = asStrings(job.dedicated_package_ids);
  if (!packageIds.length) return updateJob(current, job.id, { phase: "mixed-packages" });
  const { data, error } = await db.from("private_bank_packages").select("id,storage_bucket,storage_path")
    .eq("organization_id", current.organization_id).in("id", packageIds);
  if (error) throw error;
  const row = (data ?? []).find((item) => Boolean(item.storage_path));
  if (!row) return updateJob(current, job.id, { phase: "mixed-packages" });
  const path = String(row.storage_path ?? ""), bucket = String(row.storage_bucket || PRIVATE_BUCKET);
  if (path) {
    const { error: storageError } = await db.storage.from(bucket).remove([path]);
    if (storageError && !/not found|does not exist/i.test(String(storageError.message ?? storageError))) throw storageError;
  }
  const { error: updateError } = await db.from("private_bank_packages").update({ storage_path: null, updated_at: new Date().toISOString() })
    .eq("organization_id", current.organization_id).eq("id", row.id);
  if (updateError) throw updateError;
  const progress = asRecord(job.progress);
  return updateJob(current, job.id, {
    status: "running",
    progress: { ...progress, archives_deleted: numberValue(progress.archives_deleted) + (path ? 1 : 0) },
    last_error: null,
  });
}
async function mixedPackages(current: SessionAccount, job: PurgeJob) {
  const packageIds = asStrings(job.mixed_package_ids);
  if (!packageIds.length) return updateJob(current, job.id, { phase: "import-runs" });
  const { data, error } = await db.from("private_bank_packages").select("id,display_aliases,manifest")
    .eq("organization_id", current.organization_id).in("id", packageIds);
  if (error) throw error;
  const row = (data ?? []).find((item) => targetCourses(item as JsonRecord).includes(job.course_key));
  if (!row) return updateJob(current, job.id, { phase: "import-runs" });
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
  return updateJob(current, job.id, {
    status: "running",
    progress: { ...progress, mixed_packages_updated: numberValue(progress.mixed_packages_updated) + 1 },
    last_error: null,
  });
}
async function importRuns(current: SessionAccount, job: PurgeJob) {
  const codes = asStrings(job.dedicated_bank_codes);
  let removed = 0;
  if (codes.length) {
    const { data, error } = await db.from("private_bank_import_runs").delete()
      .eq("organization_id", current.organization_id).in("bank_code", codes).select("id");
    if (error) throw error;
    removed = (data ?? []).length;
  }
  const progress = asRecord(job.progress);
  return updateJob(current, job.id, {
    status: "running",
    phase: "dedicated-packages",
    progress: { ...progress, import_runs_deleted: numberValue(progress.import_runs_deleted) + removed },
    last_error: null,
  });
}
async function dedicatedPackages(current: SessionAccount, job: PurgeJob) {
  const packageIds = asStrings(job.dedicated_package_ids);
  if (!packageIds.length) return updateJob(current, job.id, { phase: "verify" });
  const { data, error } = await db.from("private_bank_packages").select("id")
    .eq("organization_id", current.organization_id).in("id", packageIds).limit(1);
  if (error) throw error;
  const row = (data ?? [])[0];
  if (!row) return updateJob(current, job.id, { phase: "verify" });
  const { error: deleteError } = await db.from("private_bank_packages").delete()
    .eq("organization_id", current.organization_id).eq("id", row.id);
  if (deleteError) throw deleteError;
  const progress = asRecord(job.progress);
  return updateJob(current, job.id, {
    status: "running",
    progress: { ...progress, packages_deleted: numberValue(progress.packages_deleted) + 1 },
    last_error: null,
  });
}
async function verify(current: SessionAccount, job: PurgeJob) {
  const remaining = await countQuestions(current, job.course_key);
  if (remaining > 0) {
    const { data, error } = await db.from("private_bank_questions").select("package_id,bank_code")
      .eq("organization_id", current.organization_id).contains("course_keys", [job.course_key]).limit(25);
    if (error) throw error;
    const dedicatedIds = new Set(asStrings(job.dedicated_package_ids)), mixedIds = new Set(asStrings(job.mixed_package_ids));
    let dedicatedFound = false;
    for (const row of data ?? []) {
      const packageId = String(row.package_id ?? "");
      if (!packageId) continue;
      if (dedicatedIds.has(packageId) || (job.course_key === "ib-math-ai" && String(row.bank_code ?? "").startsWith("IBAI-"))) {
        dedicatedIds.add(packageId); dedicatedFound = true;
      } else mixedIds.add(packageId);
    }
    return updateJob(current, job.id, {
      status: "running",
      phase: dedicatedFound ? "dedicated-questions" : "mixed-questions",
      dedicated_package_ids: [...dedicatedIds],
      mixed_package_ids: [...mixedIds],
      last_error: null,
    });
  }
  const { data: packages, error } = await db.from("private_bank_packages").select("id,bank_code,display_aliases,manifest")
    .eq("organization_id", current.organization_id);
  if (error) throw error;
  const remainingPackages = (packages ?? []).filter((row) => targetCourses(row as JsonRecord).includes(job.course_key));
  if (remainingPackages.length) {
    const dedicatedIds = new Set(asStrings(job.dedicated_package_ids)), mixedIds = new Set(asStrings(job.mixed_package_ids)), codes = new Set(asStrings(job.dedicated_bank_codes));
    let dedicatedFound = false;
    for (const row of remainingPackages) {
      if (dedicatedForCourse(row as JsonRecord, job.course_key)) {
        dedicatedIds.add(String(row.id)); codes.add(String(row.bank_code)); dedicatedFound = true;
      } else mixedIds.add(String(row.id));
    }
    return updateJob(current, job.id, {
      status: "running",
      phase: dedicatedFound ? "dedicated-media" : "mixed-packages",
      dedicated_package_ids: [...dedicatedIds],
      mixed_package_ids: [...mixedIds],
      dedicated_bank_codes: [...codes],
      last_error: null,
    });
  }
  return updateJob(current, job.id, { status: "completed", phase: "completed", completed_at: new Date().toISOString(), last_error: null });
}
async function step(req: Request, current: SessionAccount, id: string) {
  if (!safeJobId(id)) return fail(req, "Invalid purge job", 400, "invalid_purge_job");
  let job = await jobRow(current, id);
  if (!job) return fail(req, "Purge job not found", 404, "not_found");
  if (job.status === "completed") return reply(req, { ok: true, job: snapshot(job) });
  try {
    if (job.status !== "running" || job.last_error) job = await updateJob(current, job.id, { status: "running", last_error: null });
    switch (job.phase) {
      case "mixed-questions": job = await mixedQuestions(current, job); break;
      case "dedicated-questions": job = await dedicatedQuestions(current, job); break;
      case "dedicated-media": job = await dedicatedMedia(current, job); break;
      case "source-archives": job = await sourceArchives(current, job); break;
      case "mixed-packages": job = await mixedPackages(current, job); break;
      case "import-runs": job = await importRuns(current, job); break;
      case "dedicated-packages": job = await dedicatedPackages(current, job); break;
      case "verify": job = await verify(current, job); break;
      case "completed": job = await updateJob(current, job.id, { status: "completed", completed_at: job.completed_at || new Date().toISOString() }); break;
      default: throw new Error(`Unknown purge phase ${job.phase}`);
    }
    return reply(req, { ok: true, job: snapshot(job) });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(asRecord(error).message || "Unexpected private bank purge error");
    await updateJob(current, job.id, { status: "failed", last_error: message }).catch(() => undefined);
    throw error;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: responseHeaders(req) });
  const url = new URL(req.url); const path = url.pathname.split("/private-bank-purge-api")[1] || "/";
  try {
    if (path === "/health" && req.method === "GET") return reply(req, { ok: true, service: "echs-private-bank-purge-api", version: "1.1.0-generic-course-batches" });
    const current = await session(req);
    if (!current || current.role !== "admin") return fail(req, "Administrator access is required", 403, "forbidden");
    const courseMatch = path.match(/^\/courses\/([a-z0-9-]+)$/);
    if (courseMatch && req.method === "DELETE") return await start(req, current, courseMatch[1]);
    const jobMatch = path.match(/^\/jobs\/([0-9a-f-]+)$/i);
    if (jobMatch && req.method === "GET") {
      if (!safeJobId(jobMatch[1])) return fail(req, "Invalid purge job", 400, "invalid_purge_job");
      const job = await jobRow(current, jobMatch[1]);
      if (!job) return fail(req, "Purge job not found", 404, "not_found");
      return reply(req, { ok: true, job: snapshot(job) });
    }
    const stepMatch = path.match(/^\/jobs\/([0-9a-f-]+)\/step$/i);
    if (stepMatch && req.method === "POST") return await step(req, current, stepMatch[1]);
    return fail(req, "Route not found", 404, "not_found");
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : String(asRecord(error).message || "Unexpected private bank purge error");
    return fail(req, message, 400);
  }
});
