import { createClient } from "npm:@supabase/supabase-js@2";
import {
  DEFAULT_MODEL,
  PATHWAYS,
  computeAllPathways,
  mergeModel,
  validateModelConfiguration,
  validationSummary,
} from "./readiness-engine.js";
import {
  DIAGNOSTIC_VERSION,
  gradeDiagnostic,
  publicDiagnostic,
  questionCount,
} from "./diagnostic-bank.js";

type Role = "admin" | "teacher" | "student" | "parent";
type SessionAccount = {
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
type Json = Record<string, unknown>;

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const ALLOWED_ORIGINS = (Deno.env.get("ALLOWED_ORIGINS") ??
  "https://2ed944-cloud.github.io,http://localhost:4173,http://127.0.0.1:4173")
  .split(",").map((value) => value.trim()).filter(Boolean);

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

class HttpError extends Error {
  status: number;
  code: string;
  constructor(message: string, status = 400, code = "request_error") {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function cors(origin: string): HeadersInit {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0] ?? "";
  return {
    "access-control-allow-origin": allowed,
    "access-control-allow-headers": "authorization, content-type, x-requested-with",
    "access-control-allow-methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "access-control-max-age": "86400",
    "vary": "Origin",
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
  };
}

function json(req: Request, data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: cors(req.headers.get("origin") ?? "") });
}
function fail(req: Request, message: string, status = 400, code = "request_error"): Response {
  return json(req, { ok: false, error: { code, message } }, status);
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function sessionFromRequest(req: Request): Promise<SessionAccount | null> {
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) return null;
  const { data, error } = await admin.rpc("api_session_lookup", { p_token_hash: await sha256(token) });
  if (error) throw error;
  return (Array.isArray(data) && data[0] ? data[0] : null) as SessionAccount | null;
}

function requireRoles(session: SessionAccount | null, roles: Role[]): asserts session is SessionAccount {
  if (!session) throw new HttpError("Authentication required", 401, "unauthorized");
  if (!roles.includes(session.role)) throw new HttpError("You do not have permission to perform this action", 403, "forbidden");
}

async function body<T>(req: Request): Promise<T> {
  if (!(req.headers.get("content-type") ?? "").includes("application/json")) {
    throw new HttpError("Content-Type must be application/json", 415, "unsupported_media_type");
  }
  return await req.json() as T;
}

function text(value: unknown, max = 300): string {
  return String(value ?? "").trim().slice(0, max);
}
function numeric(value: unknown, min?: number, max?: number): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  if (min !== undefined && n < min) return null;
  if (max !== undefined && n > max) return null;
  return n;
}
function season(value: unknown): "fall" | "winter" | "spring" | "default" {
  const key = text(value, 40).toLowerCase();
  if (["fall", "autumn", "beginning", "beginning-of-year", "boy"].includes(key)) return "fall";
  if (["winter", "middle", "middle-of-year", "moy"].includes(key)) return "winter";
  if (["spring", "end", "end-of-year", "eoy"].includes(key)) return "spring";
  return "default";
}
function dateOnly(value: unknown, fallback = ""): string {
  const raw = text(value, 60) || fallback;
  if (!raw) return "";
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}
function pathway(value: unknown): string {
  const key = text(value, 20).toUpperCase().replace(/[^A-Z]+/g, "_").replace(/^_|_$/g, "");
  const aliases: Record<string, string> = {
    AAHL: "AA_HL", AA_HL: "AA_HL", ANALYSIS_AND_APPROACHES_HL: "AA_HL",
    AASL: "AA_SL", AA_SL: "AA_SL", ANALYSIS_AND_APPROACHES_SL: "AA_SL",
    AIHL: "AI_HL", AI_HL: "AI_HL", APPLICATIONS_AND_INTERPRETATION_HL: "AI_HL",
    AISL: "AI_SL", AI_SL: "AI_SL", APPLICATIONS_AND_INTERPRETATION_SL: "AI_SL",
  };
  return aliases[key] ?? "";
}

async function audit(session: SessionAccount, action: string, targetAccountId: string | null, details: Json = {}) {
  const { error } = await admin.from("account_audit_log").insert({
    organization_id: session.organization_id,
    actor_id: session.account_id,
    target_account_id: targetAccountId,
    action,
    details,
  });
  if (error) console.warn("Readiness audit write failed", error.message);
}

async function teacherClassIds(session: SessionAccount): Promise<string[]> {
  if (session.role !== "teacher") return [];
  const { data, error } = await admin.from("class_memberships")
    .select("class_id")
    .eq("account_id", session.account_id)
    .eq("membership_role", "teacher");
  if (error) throw error;
  return [...new Set(((data ?? []) as any[]).map((row) => String(row.class_id)))];
}

async function accessibleStudentIds(session: SessionAccount): Promise<string[]> {
  if (session.role === "student") return [session.account_id];
  if (session.role === "parent") {
    const { data, error } = await admin.from("parent_student_links").select("student_id").eq("parent_id", session.account_id);
    if (error) throw error;
    return ((data ?? []) as any[]).map((row) => String(row.student_id));
  }
  if (session.role === "admin") {
    const { data, error } = await admin.from("accounts").select("id")
      .eq("organization_id", session.organization_id).eq("role", "student").neq("status", "archived");
    if (error) throw error;
    return ((data ?? []) as any[]).map((row) => String(row.id));
  }
  const classes = await teacherClassIds(session);
  if (!classes.length) return [];
  const { data, error } = await admin.from("class_memberships").select("account_id")
    .in("class_id", classes).eq("membership_role", "student");
  if (error) throw error;
  return [...new Set(((data ?? []) as any[]).map((row) => String(row.account_id)))];
}

async function assertStudentAccess(session: SessionAccount, studentId: string): Promise<void> {
  const ids = await accessibleStudentIds(session);
  if (!ids.includes(studentId)) throw new HttpError("Student is outside your authorised scope", 403, "student_scope_forbidden");
}

async function studentDirectory(session: SessionAccount) {
  const ids = await accessibleStudentIds(session);
  if (!ids.length) return [];
  const { data, error } = await admin.from("accounts")
    .select("id,display_name,username,email,external_id,grade,status,last_login_at")
    .eq("organization_id", session.organization_id).eq("role", "student").in("id", ids)
    .order("display_name");
  if (error) throw error;
  return data ?? [];
}

async function currentSchoolMap(session: SessionAccount, studentIds: string[]): Promise<Map<string, any>> {
  if (!studentIds.length) return new Map();
  const { data, error } = await admin.from("readiness_student_schools")
    .select("student_id,school_id,academic_year,readiness_schools(id,name,code,status)")
    .eq("organization_id", session.organization_id).eq("is_current", true).in("student_id", studentIds);
  if (error) throw error;
  const result = new Map<string, any>();
  for (const row of data ?? []) {
    const school = Array.isArray(row.readiness_schools) ? row.readiness_schools[0] : row.readiness_schools;
    result.set(row.student_id, school ? { ...school, academic_year: row.academic_year } : null);
  }
  return result;
}

async function currentSchoolId(session: SessionAccount, studentId: string): Promise<string | null> {
  const schools = await currentSchoolMap(session, [studentId]);
  return schools.get(studentId)?.id ?? null;
}

async function organizationStudentDirectory(session: SessionAccount) {
  requireRoles(session, ["admin"]);
  const { data, error } = await admin.from("accounts")
    .select("id,display_name,username,email,external_id,grade,status")
    .eq("organization_id", session.organization_id).eq("role", "student").neq("status", "archived");
  if (error) throw error;
  const rows = data ?? [];
  const schoolMap = await currentSchoolMap(session, rows.map((row) => row.id));
  return rows.map((row) => ({ ...row, school: schoolMap.get(row.id) ?? null, school_id: schoolMap.get(row.id)?.id ?? null }));
}

async function listSchools(session: SessionAccount, req: Request): Promise<Response> {
  const { data, error } = await admin.from("readiness_schools")
    .select("id,name,code,status,created_at")
    .eq("organization_id", session.organization_id).order("name");
  if (error) throw error;
  return json(req, { ok: true, schools: data ?? [] });
}

async function createSchool(session: SessionAccount, req: Request): Promise<Response> {
  requireRoles(session, ["admin"]);
  const payload = await body<Json>(req);
  const name = text(payload.name, 240);
  const code = text(payload.code || name, 80).toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-|-$/g, "");
  if (!name || !code) throw new HttpError("School name and code are required");
  const { data, error } = await admin.from("readiness_schools").insert({
    organization_id: session.organization_id, name, code, created_by: session.account_id,
  }).select("id,name,code,status,created_at").single();
  if (error) throw error;
  await audit(session, "readiness.school_create", null, { school_id: data.id, code: data.code });
  return json(req, { ok: true, school: data }, 201);
}

async function assignSchool(session: SessionAccount, req: Request): Promise<Response> {
  requireRoles(session, ["admin"]);
  const payload = await body<{ school_id?: string; student_ids?: string[]; academic_year?: string }>(req);
  const schoolId = text(payload.school_id, 80);
  const year = text(payload.academic_year, 30) || "2026-2027";
  const requested = [...new Set((payload.student_ids ?? []).map((id) => text(id, 80)).filter(Boolean))].slice(0, 1000);
  if (!schoolId || !requested.length) throw new HttpError("school_id and at least one student_id are required");
  const { count, error: schoolError } = await admin.from("readiness_schools").select("id", { count: "exact", head: true })
    .eq("id", schoolId).eq("organization_id", session.organization_id).eq("status", "active");
  if (schoolError) throw schoolError;
  if (!count) throw new HttpError("School not found", 404, "school_not_found");
  const { data: valid, error: studentError } = await admin.from("accounts").select("id")
    .eq("organization_id", session.organization_id).eq("role", "student").in("id", requested);
  if (studentError) throw studentError;
  const ids = (valid ?? []).map((row) => row.id);
  if (!ids.length) throw new HttpError("No valid students were supplied");
  const clear = await admin.from("readiness_student_schools").update({ is_current: false }).eq("organization_id", session.organization_id).in("student_id", ids).eq("is_current", true);
  if (clear.error) throw clear.error;
  const rows = ids.map((studentId) => ({ organization_id: session.organization_id, student_id: studentId, school_id: schoolId, academic_year: year, is_current: true, assigned_by: session.account_id, assigned_at: new Date().toISOString() }));
  const { error } = await admin.from("readiness_student_schools").upsert(rows, { onConflict: "student_id,school_id,academic_year" });
  if (error) throw error;
  await audit(session, "readiness.school_assign", null, { school_id: schoolId, academic_year: year, student_count: ids.length });
  return json(req, { ok: true, assigned: ids.length, student_ids: ids });
}

function directoryMatcher(rows: any[]) {
  const maps = {
    id: new Map<string, any>(), external_id: new Map<string, any>(), username: new Map<string, any>(), email: new Map<string, any>(),
  };
  for (const row of rows) {
    maps.id.set(String(row.id), row);
    if (row.external_id) maps.external_id.set(String(row.external_id).trim().toLowerCase(), row);
    if (row.username) maps.username.set(String(row.username).trim().toLowerCase(), row);
    if (row.email) maps.email.set(String(row.email).trim().toLowerCase(), row);
  }
  return (kind: unknown, value: unknown) => {
    const key = text(value, 320).toLowerCase();
    const type = text(kind, 30).toLowerCase();
    return (maps as any)[type]?.get(key) ?? null;
  };
}

async function activeModel(session: SessionAccount) {
  const { data, error } = await admin.from("readiness_models")
    .select("id,name,version,status,configuration,notes,created_at,activated_at")
    .eq("organization_id", session.organization_id).eq("status", "active")
    .order("version", { ascending: false }).limit(1).maybeSingle();
  if (error) throw error;
  if (data) return { ...data, effective_configuration: mergeModel(DEFAULT_MODEL, data.configuration ?? {}) };
  return {
    id: null, name: DEFAULT_MODEL.name, version: 0, status: "virtual_default", configuration: {}, notes: DEFAULT_MODEL.purpose,
    effective_configuration: mergeModel(DEFAULT_MODEL, {}),
  };
}

async function latestEvidence(studentId: string) {
  const [mapResult, mypResult, diagnosticResult] = await Promise.all([
    admin.from("map_assessments").select("*").eq("student_id", studentId).order("test_date", { ascending: false }).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    admin.from("myp_math_evidence").select("*").eq("student_id", studentId).order("evidence_date", { ascending: false }).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    admin.from("readiness_diagnostic_attempts").select("*").eq("student_id", studentId).order("completed_at", { ascending: false }).limit(1).maybeSingle(),
  ]);
  for (const result of [mapResult, mypResult, diagnosticResult]) if (result.error) throw result.error;
  return { map: mapResult.data, myp: mypResult.data, diagnostic: diagnosticResult.data };
}

async function syncInterventions(session: SessionAccount, studentId: string, schoolId: string | null, pathwayKey: string, snapshotId: string, gaps: any[]) {
  const { data: existing, error } = await admin.from("readiness_interventions")
    .select("id,skill_key,status")
    .eq("student_id", studentId).eq("pathway", pathwayKey).in("status", ["open", "in_progress"]);
  if (error) throw error;
  const existingBySkill = new Map((existing ?? []).map((row) => [row.skill_key, row]));
  const currentSkills = new Set((gaps ?? []).map((gap) => gap.skill_key));
  const resolvedIds = (existing ?? []).filter((row) => !currentSkills.has(row.skill_key)).map((row) => row.id);
  if (resolvedIds.length) {
    const resolved = await admin.from("readiness_interventions").update({ status: "mastered", updated_at: new Date().toISOString() }).in("id", resolvedIds);
    if (resolved.error) throw resolved.error;
  }
  const inserts = (gaps ?? []).filter((gap) => !existingBySkill.has(gap.skill_key)).map((gap) => ({
    organization_id: session.organization_id,
    student_id: studentId,
    school_id: schoolId,
    pathway: pathwayKey,
    skill_key: text(gap.skill_key, 80),
    title: text(gap.title, 300),
    recommendation: text(gap.recommendation, 1500),
    priority: ["high", "medium", "supporting"].includes(gap.priority) ? gap.priority : "medium",
    status: "open",
    baseline_score: numeric(gap.current_score, 0, 100),
    target_score: numeric(gap.target_score, 0, 100),
    source_snapshot_id: snapshotId,
  }));
  if (inserts.length) {
    const inserted = await admin.from("readiness_interventions").insert(inserts);
    if (inserted.error) throw inserted.error;
  }
}

async function recomputeStudent(session: SessionAccount, studentId: string) {
  await assertStudentAccess(session, studentId);
  const modelRow = await activeModel(session);
  const schoolId = await currentSchoolId(session, studentId);
  const evidence = await latestEvidence(studentId);
  const results = computeAllPathways({
    map: evidence.map,
    myp: evidence.myp,
    diagnostic: evidence.diagnostic,
    model: modelRow.configuration ?? {},
  });
  const snapshots = Object.entries(results).map(([pathwayKey, result]: [string, any]) => ({
    organization_id: session.organization_id,
    student_id: studentId,
    school_id: schoolId,
    model_id: modelRow.id,
    model_version: modelRow.version ?? 0,
    pathway: pathwayKey,
    readiness_index: result.score,
    band: result.band,
    confidence: result.confidence,
    evidence_status: result.evidence_status,
    evidence_completeness: result.evidence_completeness,
    components: result.layers,
    skill_profile: result.skill_profile,
    gaps: result.gaps,
    reasons: result.reasons,
    created_by: session.account_id,
  }));
  const { data: inserted, error } = await admin.from("readiness_snapshots").insert(snapshots).select("id,pathway,gaps");
  if (error) throw error;
  for (const row of inserted ?? []) await syncInterventions(session, studentId, schoolId, row.pathway, row.id, row.gaps ?? []);
  await audit(session, "readiness.recompute", studentId, { model_version: modelRow.version, evidence_status: Object.values(results)[0]?.evidence_status ?? "unknown" });
  return { model: modelRow, evidence, pathways: results };
}

async function listStudents(session: SessionAccount) {
  const students = await studentDirectory(session);
  const ids = students.map((row) => row.id);
  if (!ids.length) return [];
  const [snapResult, mapResult, mypResult, diagResult, prefResult, membershipResult, schoolResult] = await Promise.all([
    admin.from("readiness_snapshots").select("student_id,pathway,readiness_index,band,confidence,evidence_status,evidence_completeness,created_at")
      .in("student_id", ids).order("created_at", { ascending: false }).limit(Math.min(8000, ids.length * 24)),
    admin.from("map_assessments").select("student_id,test_date,overall_rit,percentile").in("student_id", ids).order("test_date", { ascending: false }),
    admin.from("myp_math_evidence").select("student_id,evidence_date,criterion_a,criterion_b,criterion_c,criterion_d").in("student_id", ids).order("evidence_date", { ascending: false }),
    admin.from("readiness_diagnostic_attempts").select("student_id,completed_at,score").in("student_id", ids).order("completed_at", { ascending: false }),
    admin.from("readiness_preferences").select("student_id,preferred_pathway").in("student_id", ids),
    admin.from("class_memberships").select("account_id,class_id,classes(id,name,course_key,section)").in("account_id", ids).eq("membership_role", "student"),
    admin.from("readiness_student_schools").select("student_id,academic_year,school_id,readiness_schools(id,name,code,status)").eq("organization_id", session.organization_id).eq("is_current", true).in("student_id", ids),
  ]);
  for (const result of [snapResult, mapResult, mypResult, diagResult, prefResult, membershipResult, schoolResult]) if (result.error) throw result.error;
  const latestPath = new Map<string, any>();
  for (const row of snapResult.data ?? []) {
    const key = `${row.student_id}:${row.pathway}`;
    if (!latestPath.has(key)) latestPath.set(key, row);
  }
  const firstByStudent = (rows: any[]) => {
    const map = new Map<string, any>();
    for (const row of rows) if (!map.has(row.student_id)) map.set(row.student_id, row);
    return map;
  };
  const latestMap = firstByStudent(mapResult.data ?? []);
  const latestMyp = firstByStudent(mypResult.data ?? []);
  const latestDiag = firstByStudent(diagResult.data ?? []);
  const prefs = new Map((prefResult.data ?? []).map((row) => [row.student_id, row.preferred_pathway]));
  const classes = new Map<string, any[]>();
  for (const row of membershipResult.data ?? []) {
    const nested = Array.isArray(row.classes) ? row.classes[0] : row.classes;
    if (!nested) continue;
    if (!classes.has(row.account_id)) classes.set(row.account_id, []);
    classes.get(row.account_id)?.push(nested);
  }
  const schools = new Map<string, any>();
  for (const row of schoolResult.data ?? []) {
    const nested = Array.isArray(row.readiness_schools) ? row.readiness_schools[0] : row.readiness_schools;
    if (nested) schools.set(row.student_id, { ...nested, academic_year: row.academic_year });
  }
  return students.map((student) => ({
    ...student,
    preferred_pathway: prefs.get(student.id) ?? null,
    evidence: {
      map: latestMap.get(student.id) ?? null,
      myp: latestMyp.get(student.id) ?? null,
      diagnostic: latestDiag.get(student.id) ?? null,
    },
    pathways: Object.fromEntries(Object.keys(PATHWAYS).map((key) => [key, latestPath.get(`${student.id}:${key}`) ?? null])),
    classes: classes.get(student.id) ?? [],
    school: schools.get(student.id) ?? null,
  }));
}

async function overview(session: SessionAccount, req: Request) {
  const rows = await listStudents(session);
  const pathwayCounts: Record<string, number> = Object.fromEntries(Object.keys(PATHWAYS).map((key) => [key, 0]));
  const gapCounts = new Map<string, number>();
  let fullProfiles = 0, partialProfiles = 0, screening = 0, noIndex = 0;
  for (const row of rows) {
    const preferred = row.preferred_pathway || "AA_SL";
    const current = row.pathways[preferred] || Object.values(row.pathways).find(Boolean) as any;
    if (!current) noIndex++;
    else if (current.evidence_status === "full_profile") fullProfiles++;
    else if (current.evidence_status === "partial_profile") partialProfiles++;
    else screening++;
    let bestKey = ""; let best = -1;
    for (const [key, result] of Object.entries(row.pathways) as [string, any][]) {
      if (Number.isFinite(Number(result?.readiness_index)) && Number(result.readiness_index) > best) { best = Number(result.readiness_index); bestKey = key; }
    }
    if (bestKey) pathwayCounts[bestKey]++;
  }
  const ids = rows.map((row) => row.id);
  if (ids.length) {
    const { data, error } = await admin.from("readiness_interventions").select("skill_key")
      .in("student_id", ids).in("status", ["open", "in_progress"]);
    if (error) throw error;
    for (const item of data ?? []) gapCounts.set(item.skill_key, (gapCounts.get(item.skill_key) ?? 0) + 1);
  }
  const topGaps = [...gapCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([skill_key, count]) => ({ skill_key, count }));
  const schoolSummary = new Map<string, any>();
  for (const row of rows) {
    const school = row.school ?? { id: "unassigned", name: "Unassigned", code: "UNASSIGNED" };
    if (!schoolSummary.has(school.id)) schoolSummary.set(school.id, { school_id: school.id, school_name: school.name, school_code: school.code, students: 0, full_profiles: 0, pathway_index_sum: 0, pathway_index_count: 0 });
    const item = schoolSummary.get(school.id);
    item.students++;
    const preferred = row.preferred_pathway || "AA_SL";
    const current = row.pathways[preferred] || Object.values(row.pathways).find(Boolean) as any;
    if (current?.evidence_status === "full_profile") item.full_profiles++;
    if (Number.isFinite(Number(current?.readiness_index))) { item.pathway_index_sum += Number(current.readiness_index); item.pathway_index_count++; }
  }
  const schools = [...schoolSummary.values()].map((item) => ({ ...item, average_target_readiness: item.pathway_index_count ? item.pathway_index_sum / item.pathway_index_count : null })).map(({ pathway_index_sum: _sum, pathway_index_count: _count, ...item }) => item);
  return json(req, {
    ok: true,
    students: rows.length,
    evidence_profiles: { full: fullProfiles, partial: partialProfiles, screening_only: screening, no_index: noIndex },
    strongest_pathway_counts: pathwayCounts,
    top_gaps: topGaps,
    school_summary: schools,
    rows,
  });
}

async function studentDetail(session: SessionAccount, req: Request, studentId: string) {
  await assertStudentAccess(session, studentId);
  const { data: student, error: studentError } = await admin.from("accounts")
    .select("id,display_name,username,email,external_id,grade,status")
    .eq("id", studentId).eq("organization_id", session.organization_id).eq("role", "student").maybeSingle();
  if (studentError) throw studentError;
  if (!student) throw new HttpError("Student not found", 404, "not_found");
  const schoolMap = await currentSchoolMap(session, [studentId]);
  const [mapResult, mypResult, diagResult, snapshotResult, interventionResult, prefResult] = await Promise.all([
    admin.from("map_assessments").select("*").eq("student_id", studentId).order("test_date", { ascending: false }).limit(40),
    admin.from("myp_math_evidence").select("*").eq("student_id", studentId).order("evidence_date", { ascending: false }).limit(40),
    admin.from("readiness_diagnostic_attempts").select("id,diagnostic_version,score,correct,total,answered,skill_scores,completed_at").eq("student_id", studentId).order("completed_at", { ascending: false }).limit(20),
    admin.from("readiness_snapshots").select("*").eq("student_id", studentId).order("created_at", { ascending: false }).limit(120),
    admin.from("readiness_interventions").select("*").eq("student_id", studentId).order("status").order("priority").order("updated_at", { ascending: false }).limit(100),
    admin.from("readiness_preferences").select("preferred_pathway,student_note,updated_at").eq("student_id", studentId).maybeSingle(),
  ]);
  for (const result of [mapResult, mypResult, diagResult, snapshotResult, interventionResult, prefResult]) if (result.error) throw result.error;
  return json(req, {
    ok: true, student: { ...student, school: schoolMap.get(studentId) ?? null },
    map_history: mapResult.data ?? [],
    myp_history: mypResult.data ?? [],
    diagnostic_history: diagResult.data ?? [],
    snapshots: snapshotResult.data ?? [],
    interventions: interventionResult.data ?? [],
    preference: prefResult.data ?? null,
  });
}

async function createImportBatch(session: SessionAccount, importType: string, fileName: string, headers: unknown[], rowCount: number) {
  const { data, error } = await admin.from("readiness_import_batches").insert({
    organization_id: session.organization_id,
    import_type: importType,
    file_name: text(fileName, 300),
    headers: Array.isArray(headers) ? headers.slice(0, 150).map((h) => text(h, 160)) : [],
    row_count: rowCount,
    imported_by: session.account_id,
  }).select("id").single();
  if (error) throw error;
  return data.id as string;
}

async function updateImportBatch(id: string, matched: number, rejected: number) {
  const { error } = await admin.from("readiness_import_batches").update({ matched_count: matched, rejected_count: rejected }).eq("id", id);
  if (error) throw error;
}

async function mapImport(session: SessionAccount, req: Request) {
  requireRoles(session, ["admin"]);
  const payload = await body<{ file_name?: string; headers?: unknown[]; rows?: Json[] }>(req);
  const rows = Array.isArray(payload.rows) ? payload.rows.slice(0, 500) : [];
  if (!rows.length) throw new HttpError("No MAP rows were provided");
  const directory = await organizationStudentDirectory(session);
  const match = directoryMatcher(directory);
  const batchId = await createImportBatch(session, "map", payload.file_name ?? "", payload.headers ?? [], rows.length);
  const upserts: any[] = [];
  const rejected: any[] = [];
  const matchedStudentIds = new Set<string>();
  for (let index = 0; index < rows.length; index++) {
    const row = rows[index] || {};
    const student = match(row.identifier_type, row.identifier);
    const testDate = dateOnly(row.test_date);
    const overallRit = numeric(row.overall_rit, 100, 400);
    const percentile = numeric(row.percentile, 0, 100);
    if (!student || !testDate || (overallRit === null && percentile === null)) {
      rejected.push({ row: index + 2, reason: !student ? "student_not_matched" : !testDate ? "invalid_test_date" : "missing_map_score" });
      continue;
    }
    const domains: Json = {};
    for (const key of ["number", "algebra", "functions", "geometry", "data"]) {
      const value = numeric((row.domains as Json | undefined)?.[key], 100, 400);
      if (value !== null) domains[key] = value;
    }
    upserts.push({
      organization_id: session.organization_id,
      student_id: student.id,
      school_id: student.school_id ?? null,
      import_batch_id: batchId,
      test_date: testDate,
      season: season(row.season),
      grade: text(row.grade || student.grade, 30) || null,
      overall_rit: overallRit,
      percentile,
      growth_percentile: numeric(row.growth_percentile, 0, 100),
      domains,
      source_note: text(row.source_note, 500) || null,
      created_by: session.account_id,
      updated_at: new Date().toISOString(),
    });
    matchedStudentIds.add(student.id);
  }
  if (upserts.length) {
    const { error } = await admin.from("map_assessments").upsert(upserts, { onConflict: "student_id,test_date,season" });
    if (error) throw error;
  }
  await updateImportBatch(batchId, upserts.length, rejected.length);
  await audit(session, "readiness.map_import", null, { batch_id: batchId, rows: rows.length, matched: upserts.length, rejected: rejected.length });
  return json(req, { ok: true, batch_id: batchId, matched: upserts.length, rejected, matched_student_ids: [...matchedStudentIds] });
}

async function saveMypEvidence(session: SessionAccount, req: Request) {
  requireRoles(session, ["admin", "teacher"]);
  const payload = await body<Json>(req);
  const studentId = text(payload.student_id, 80);
  if (!studentId) throw new HttpError("student_id is required");
  await assertStudentAccess(session, studentId);
  const values: any = {};
  for (const key of ["a", "b", "c", "d"]) values[`criterion_${key}`] = numeric(payload[`criterion_${key}`], 0, 8);
  if (Object.values(values).every((value) => value === null)) throw new HttpError("At least one MYP criterion score is required");
  const row = {
    organization_id: session.organization_id,
    student_id: studentId,
    school_id: await currentSchoolId(session, studentId),
    evidence_date: dateOnly(payload.evidence_date, new Date().toISOString()) || new Date().toISOString().slice(0, 10),
    ...values,
    source_title: text(payload.source_title, 300) || "MYP Mathematics evidence",
    notes: text(payload.notes, 2000) || null,
    teacher_id: session.account_id,
  };
  const { data, error } = await admin.from("myp_math_evidence").insert(row).select("id").single();
  if (error) throw error;
  const recomputed = await recomputeStudent(session, studentId);
  await audit(session, "readiness.myp_evidence", studentId, { evidence_id: data.id });
  return json(req, { ok: true, evidence_id: data.id, recomputed });
}

async function mypImport(session: SessionAccount, req: Request) {
  requireRoles(session, ["admin"]);
  const payload = await body<{ file_name?: string; headers?: unknown[]; rows?: Json[] }>(req);
  const rows = Array.isArray(payload.rows) ? payload.rows.slice(0, 500) : [];
  if (!rows.length) throw new HttpError("No MYP rows were provided");
  const directory = await organizationStudentDirectory(session);
  const match = directoryMatcher(directory);
  const batchId = await createImportBatch(session, "myp", payload.file_name ?? "", payload.headers ?? [], rows.length);
  const inserts: any[] = [], rejected: any[] = [];
  const matchedStudentIds = new Set<string>();
  for (let index = 0; index < rows.length; index++) {
    const row = rows[index] || {};
    const student = match(row.identifier_type, row.identifier);
    const values: any = {};
    for (const key of ["a", "b", "c", "d"]) values[`criterion_${key}`] = numeric(row[`criterion_${key}`], 0, 8);
    if (!student || Object.values(values).every((value) => value === null)) {
      rejected.push({ row: index + 2, reason: !student ? "student_not_matched" : "missing_criteria" });
      continue;
    }
    inserts.push({
      organization_id: session.organization_id,
      student_id: student.id,
      school_id: student.school_id ?? null,
      import_batch_id: batchId,
      evidence_date: dateOnly(row.evidence_date, new Date().toISOString()) || new Date().toISOString().slice(0, 10),
      ...values,
      source_title: text(row.source_title, 300) || "MYP Mathematics bulk evidence",
      notes: text(row.notes, 2000) || null,
      teacher_id: session.account_id,
    });
    matchedStudentIds.add(student.id);
  }
  if (inserts.length) {
    const { error } = await admin.from("myp_math_evidence").insert(inserts);
    if (error) throw error;
  }
  await updateImportBatch(batchId, inserts.length, rejected.length);
  await audit(session, "readiness.myp_import", null, { batch_id: batchId, matched: inserts.length, rejected: rejected.length });
  return json(req, { ok: true, batch_id: batchId, matched: inserts.length, rejected, matched_student_ids: [...matchedStudentIds] });
}

async function diagnosticSubmit(session: SessionAccount, req: Request) {
  requireRoles(session, ["student", "teacher", "admin"]);
  const payload = await body<{ student_id?: string; responses?: Record<string, unknown> }>(req);
  const studentId = session.role === "student" ? session.account_id : text(payload.student_id, 80);
  if (!studentId) throw new HttpError("student_id is required");
  await assertStudentAccess(session, studentId);
  const responses = payload.responses && typeof payload.responses === "object" ? payload.responses : {};
  const result = gradeDiagnostic(responses);
  if (result.answered < Math.ceil(questionCount() * 0.75)) {
    throw new HttpError("Please answer at least 75% of the diagnostic before submitting", 400, "diagnostic_incomplete");
  }
  const digest = await sha256(JSON.stringify(responses));
  const { data, error } = await admin.from("readiness_diagnostic_attempts").insert({
    organization_id: session.organization_id,
    student_id: studentId,
    school_id: await currentSchoolId(session, studentId),
    diagnostic_version: DIAGNOSTIC_VERSION,
    score: result.score,
    correct: result.correct,
    total: result.total,
    answered: result.answered,
    skill_scores: result.skill_scores,
    response_digest: digest,
    proctored_by: session.role === "student" ? null : session.account_id,
  }).select("id,completed_at").single();
  if (error) throw error;
  const recomputed = await recomputeStudent(session, studentId);
  await audit(session, "readiness.diagnostic_submit", studentId, { attempt_id: data.id, version: DIAGNOSTIC_VERSION, score: Math.round(result.score) });
  return json(req, { ok: true, attempt_id: data.id, completed_at: data.completed_at, result, recomputed });
}

async function savePreference(session: SessionAccount, req: Request) {
  requireRoles(session, ["student", "teacher", "admin"]);
  const payload = await body<Json>(req);
  const studentId = session.role === "student" ? session.account_id : text(payload.student_id, 80);
  if (!studentId) throw new HttpError("student_id is required");
  await assertStudentAccess(session, studentId);
  const selected = payload.preferred_pathway ? pathway(payload.preferred_pathway) : null;
  if (payload.preferred_pathway && !selected) throw new HttpError("Unknown IB Mathematics pathway");
  const { error } = await admin.from("readiness_preferences").upsert({
    organization_id: session.organization_id,
    student_id: studentId,
    preferred_pathway: selected,
    student_note: text(payload.student_note, 1200) || null,
    updated_by: session.account_id,
    updated_at: new Date().toISOString(),
  }, { onConflict: "student_id" });
  if (error) throw error;
  await audit(session, "readiness.preference", studentId, { preferred_pathway: selected });
  return json(req, { ok: true, preferred_pathway: selected });
}

async function interventionUpdate(session: SessionAccount, req: Request, interventionId: string) {
  requireRoles(session, ["student", "teacher", "admin"]);
  const payload = await body<Json>(req);
  const status = text(payload.status, 30);
  if (!["open", "in_progress", "mastered", "dismissed"].includes(status)) throw new HttpError("Invalid intervention status");
  if (session.role === "student" && !["open", "in_progress"].includes(status)) {
    throw new HttpError("Students may track work in progress, but mastery is confirmed by fresh evidence or authorised staff", 403, "student_intervention_status_forbidden");
  }
  const { data: item, error } = await admin.from("readiness_interventions").select("id,student_id,pathway,skill_key")
    .eq("id", interventionId).eq("organization_id", session.organization_id).maybeSingle();
  if (error) throw error;
  if (!item) throw new HttpError("Intervention not found", 404, "not_found");
  await assertStudentAccess(session, item.student_id);
  const updated = await admin.from("readiness_interventions").update({ status, updated_at: new Date().toISOString() }).eq("id", item.id);
  if (updated.error) throw updated.error;
  await audit(session, "readiness.intervention_status", item.student_id, { intervention_id: item.id, pathway: item.pathway, skill_key: item.skill_key, status });
  return json(req, { ok: true });
}

async function getModel(session: SessionAccount, req: Request) {
  requireRoles(session, ["admin", "teacher"]);
  const model = await activeModel(session);
  return json(req, { ok: true, model, pathways: PATHWAYS, default_model: DEFAULT_MODEL });
}

async function saveModel(session: SessionAccount, req: Request) {
  requireRoles(session, ["admin"]);
  const payload = await body<{ configuration?: Json; notes?: string; name?: string }>(req);
  const validation = validateModelConfiguration(payload.configuration ?? {});
  if (!validation.ok) throw new HttpError(validation.errors.join(" "), 400, "invalid_model");
  const { data: versions, error: versionError } = await admin.from("readiness_models").select("version")
    .eq("organization_id", session.organization_id).order("version", { ascending: false }).limit(1);
  if (versionError) throw versionError;
  const nextVersion = Number(versions?.[0]?.version ?? 0) + 1;
  const retired = await admin.from("readiness_models").update({ status: "retired" }).eq("organization_id", session.organization_id).eq("status", "active");
  if (retired.error) throw retired.error;
  const { data, error } = await admin.from("readiness_models").insert({
    organization_id: session.organization_id,
    name: text(payload.name, 240) || "IB Mathematics readiness model",
    version: nextVersion,
    status: "active",
    configuration: payload.configuration ?? {},
    notes: text(payload.notes, 2000) || "Local evidence-based readiness configuration.",
    created_by: session.account_id,
    activated_at: new Date().toISOString(),
  }).select("id,name,version,status,configuration,notes,created_at,activated_at").single();
  if (error) throw error;
  await audit(session, "readiness.model_activate", null, { model_id: data.id, version: data.version });
  return json(req, { ok: true, model: { ...data, effective_configuration: validation.model } });
}

async function recomputeMany(session: SessionAccount, req: Request) {
  requireRoles(session, ["admin", "teacher"]);
  const payload = await body<{ student_ids?: string[] }>(req);
  const accessible = new Set(await accessibleStudentIds(session));
  const requested = Array.isArray(payload.student_ids) && payload.student_ids.length
    ? payload.student_ids.map((value) => text(value, 80)).filter((value) => accessible.has(value)).slice(0, 100)
    : [...accessible].slice(0, 100);
  const results: any[] = [];
  for (const studentId of requested) {
    try {
      const computed = await recomputeStudent(session, studentId);
      results.push({ student_id: studentId, ok: true, pathways: computed.pathways });
    } catch (error) {
      results.push({ student_id: studentId, ok: false, error: error instanceof Error ? error.message : String(error) });
    }
  }
  return json(req, { ok: true, processed: results.length, results, remaining_hint: Math.max(0, accessible.size - requested.length) });
}

async function outcomesImport(session: SessionAccount, req: Request) {
  requireRoles(session, ["admin"]);
  const payload = await body<{ file_name?: string; headers?: unknown[]; rows?: Json[] }>(req);
  const rows = Array.isArray(payload.rows) ? payload.rows.slice(0, 1000) : [];
  if (!rows.length) throw new HttpError("No outcome rows were provided");
  const directory = await organizationStudentDirectory(session);
  const match = directoryMatcher(directory);
  const batchId = await createImportBatch(session, "outcome", payload.file_name ?? "", payload.headers ?? [], rows.length);
  const upserts: any[] = [], rejected: any[] = [];
  for (let index = 0; index < rows.length; index++) {
    const row = rows[index] || {};
    const student = match(row.identifier_type, row.identifier);
    const path = pathway(row.pathway);
    const grade = numeric(row.final_grade, 1, 7);
    const academicYear = text(row.academic_year, 30);
    if (!student || !path || grade === null || !academicYear) {
      rejected.push({ row: index + 2, reason: !student ? "student_not_matched" : !path ? "invalid_pathway" : grade === null ? "invalid_grade" : "missing_academic_year" });
      continue;
    }
    upserts.push({
      organization_id: session.organization_id,
      student_id: student.id,
      school_id: student.school_id ?? null,
      import_batch_id: batchId,
      pathway: path,
      academic_year: academicYear,
      final_grade: grade,
      course_completed: row.course_completed === false || text(row.course_completed, 20).toLowerCase() === "false" ? false : true,
      outcome_date: dateOnly(row.outcome_date) || null,
      source_note: text(row.source_note, 500) || null,
      imported_by: session.account_id,
    });
  }
  if (upserts.length) {
    const { error } = await admin.from("readiness_outcomes").upsert(upserts, { onConflict: "student_id,pathway,academic_year" });
    if (error) throw error;
  }
  await updateImportBatch(batchId, upserts.length, rejected.length);
  await audit(session, "readiness.outcome_import", null, { batch_id: batchId, matched: upserts.length, rejected: rejected.length });
  return json(req, { ok: true, batch_id: batchId, matched: upserts.length, rejected });
}

async function validation(session: SessionAccount, req: Request) {
  requireRoles(session, ["admin"]);
  const modelRow = await activeModel(session);
  const { data: outcomes, error: outcomeError } = await admin.from("readiness_outcomes").select("student_id,pathway,final_grade,outcome_date,academic_year")
    .eq("organization_id", session.organization_id).eq("course_completed", true).limit(5000);
  if (outcomeError) throw outcomeError;
  if (!(outcomes ?? []).length) return json(req, { ok: true, summary: validationSummary([], modelRow.configuration ?? {}), linked_records: [] });
  const studentIds = [...new Set((outcomes ?? []).map((row) => row.student_id))];
  const { data: snapshots, error: snapshotError } = await admin.from("readiness_snapshots")
    .select("student_id,pathway,readiness_index,created_at,band,confidence")
    .eq("organization_id", session.organization_id).in("student_id", studentIds)
    .order("created_at", { ascending: false }).limit(20000);
  if (snapshotError) throw snapshotError;
  const grouped = new Map<string, any[]>();
  for (const row of snapshots ?? []) {
    const key = `${row.student_id}:${row.pathway}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)?.push(row);
  }
  const linked: any[] = [];
  for (const outcome of outcomes ?? []) {
    const candidates = grouped.get(`${outcome.student_id}:${outcome.pathway}`) ?? [];
    const cutoff = outcome.outcome_date ? Date.parse(`${outcome.outcome_date}T23:59:59Z`) : Infinity;
    const snapshot = candidates.find((row) => Date.parse(row.created_at) <= cutoff && Number.isFinite(Number(row.readiness_index)));
    if (!snapshot) continue;
    linked.push({ ...outcome, readiness_score: Number(snapshot.readiness_index), readiness_band: snapshot.band, snapshot_at: snapshot.created_at });
  }
  return json(req, { ok: true, summary: validationSummary(linked, modelRow.configuration ?? {}), linked_records: linked.slice(0, 500) });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(req.headers.get("origin") ?? "") });
  try {
    const url = new URL(req.url);
    const route = url.pathname.split("/readiness-api")[1] || "/";
    const method = req.method.toUpperCase();
    if (route === "/health" && method === "GET") {
      return json(req, { ok: true, service: "echs-ib-math-readiness", version: "1.0.0", diagnostic_version: DIAGNOSTIC_VERSION });
    }
    const session = await sessionFromRequest(req);
    if (!session) return fail(req, "Authentication required", 401, "unauthorized");

    if (route === "/overview" && method === "GET") return await overview(session, req);
    if (route === "/schools" && method === "GET") return await listSchools(session, req);
    if (route === "/schools" && method === "POST") return await createSchool(session, req);
    if (route === "/schools/assign" && method === "POST") return await assignSchool(session, req);
    if (route === "/students" && method === "GET") return json(req, { ok: true, students: await listStudents(session) });
    if (route === "/model" && method === "GET") return await getModel(session, req);
    if (route === "/model" && method === "PUT") return await saveModel(session, req);
    if (route === "/map/import" && method === "POST") return await mapImport(session, req);
    if (route === "/myp/evidence" && method === "POST") return await saveMypEvidence(session, req);
    if (route === "/myp/import" && method === "POST") return await mypImport(session, req);
    if (route === "/diagnostic" && method === "GET") {
      requireRoles(session, ["student", "teacher", "admin"]);
      return json(req, { ok: true, version: DIAGNOSTIC_VERSION, questions: publicDiagnostic(), question_count: questionCount() });
    }
    if (route === "/diagnostic/submit" && method === "POST") return await diagnosticSubmit(session, req);
    if (route === "/preference" && method === "POST") return await savePreference(session, req);
    if (route === "/recompute" && method === "POST") return await recomputeMany(session, req);
    if (route === "/outcomes/import" && method === "POST") return await outcomesImport(session, req);
    if (route === "/validation" && method === "GET") return await validation(session, req);

    const studentMatch = route.match(/^\/students\/([0-9a-f-]{36})$/i);
    if (studentMatch && method === "GET") return await studentDetail(session, req, studentMatch[1]);
    const recomputeMatch = route.match(/^\/students\/([0-9a-f-]{36})\/recompute$/i);
    if (recomputeMatch && method === "POST") return json(req, { ok: true, ...(await recomputeStudent(session, recomputeMatch[1])) });
    const interventionMatch = route.match(/^\/interventions\/([0-9a-f-]{36})$/i);
    if (interventionMatch && method === "PATCH") return await interventionUpdate(session, req, interventionMatch[1]);

    return fail(req, "Route not found", 404, "not_found");
  } catch (error) {
    console.error("readiness-api", error);
    if (error instanceof HttpError) return fail(req, error.message, error.status, error.code);
    const message = error instanceof Error ? error.message : "Unexpected server error";
    return fail(req, message, 500, "server_error");
  }
});
