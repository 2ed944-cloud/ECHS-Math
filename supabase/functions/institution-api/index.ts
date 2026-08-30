import { createClient } from "npm:@supabase/supabase-js@2";
import {
  anyClassAllows,
  canonicalCourseKey,
  decideLessonVisibility,
  lessonAccessKey,
} from "./lesson-access-policy.js";

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

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const ALLOWED_ORIGINS = (Deno.env.get("ALLOWED_ORIGINS") ??
  "https://2ed944-cloud.github.io,http://localhost:4173,http://127.0.0.1:4173")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

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
  return new Response(JSON.stringify(data), {
    status,
    headers: cors(req.headers.get("origin") ?? ""),
  });
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
  const { data, error } = await admin.rpc("api_session_lookup", {
    p_token_hash: await sha256(token),
  });
  if (error) throw error;
  return (Array.isArray(data) && data[0] ? data[0] : null) as SessionAccount | null;
}

function requireRole(session: SessionAccount | null, roles: Role[]): asserts session is SessionAccount {
  if (!session || !roles.includes(session.role)) throw new Response("Forbidden", { status: 403 });
}

async function body<T>(req: Request): Promise<T> {
  if (!(req.headers.get("content-type") ?? "").includes("application/json")) {
    throw new Error("Content-Type must be application/json");
  }
  return await req.json() as T;
}

function dateKey(value: string | Date): string {
  return new Date(value).toISOString().slice(0, 10);
}

function computeStreak(attempts: { occurred_at: string }[]): number {
  const days = new Set(attempts.map((row) => dateKey(row.occurred_at)));
  let streak = 0;
  const cursor = new Date();
  if (!days.has(dateKey(cursor))) cursor.setUTCDate(cursor.getUTCDate() - 1);
  while (days.has(dateKey(cursor))) {
    streak++;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}

function masteryLabel(score: number): string {
  if (score >= 85) return "Mastered";
  if (score >= 65) return "Proficient";
  if (score >= 35) return "Developing";
  return "Starting";
}

async function accessibleClassIds(session: SessionAccount): Promise<string[]> {
  let query = admin.from("classes").select("id").eq("organization_id", session.organization_id);
  if (session.role === "teacher") {
    const { data: memberships, error } = await admin
      .from("class_memberships")
      .select("class_id")
      .eq("account_id", session.account_id)
      .eq("membership_role", "teacher");
    if (error) throw error;
    return (memberships ?? []).map((row) => row.class_id);
  }
  if (session.role === "admin") {
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map((row) => row.id);
  }
  return [];
}

async function canAccessStudent(session: SessionAccount, studentId: string): Promise<boolean> {
  if (session.role === "admin") {
    const { count } = await admin
      .from("accounts")
      .select("id", { count: "exact", head: true })
      .eq("id", studentId)
      .eq("organization_id", session.organization_id)
      .eq("role", "student");
    return Boolean(count);
  }
  if (session.role === "student") return session.account_id === studentId;
  if (session.role === "parent") {
    const { count } = await admin
      .from("parent_student_links")
      .select("student_id", { count: "exact", head: true })
      .eq("parent_id", session.account_id)
      .eq("student_id", studentId);
    return Boolean(count);
  }
  if (session.role === "teacher") {
    const classes = await accessibleClassIds(session);
    if (!classes.length) return false;
    const { count } = await admin
      .from("class_memberships")
      .select("account_id", { count: "exact", head: true })
      .eq("account_id", studentId)
      .eq("membership_role", "student")
      .in("class_id", classes);
    return Boolean(count);
  }
  return false;
}

type LessonCatalogRow = {
  access_key: string;
  course_key: string;
  unit_index: number;
  unit_title: string;
  topic: string;
  title: string;
  position: number;
  url: string;
  is_ready: boolean;
};

type LessonAccessDecision = LessonCatalogRow & {
  allowed: boolean;
  reason: string;
  override_state: "auto" | "shown" | "hidden";
};

async function catalogForCourse(session: SessionAccount, rawCourseKey: string): Promise<LessonCatalogRow[]> {
  const courseKey = canonicalCourseKey(rawCourseKey);
  const { data, error } = await admin.from("lesson_catalog")
    .select("access_key,course_key,unit_index,unit_title,topic,title,position,url,is_ready")
    .eq("organization_id", session.organization_id)
    .eq("course_key", courseKey)
    .eq("is_ready", true)
    .order("position")
    .order("access_key");
  if (error) throw error;
  return (data ?? []) as LessonCatalogRow[];
}

function nestedClass(row: Record<string, unknown>): Record<string, unknown> {
  const value = row.classes;
  if (Array.isArray(value)) return (value[0] ?? {}) as Record<string, unknown>;
  return (value ?? {}) as Record<string, unknown>;
}

async function studentClassIdsForCourse(session: SessionAccount, courseKey: string): Promise<string[]> {
  const { data, error } = await admin.from("class_memberships")
    .select("class_id,classes(id,course_key,status,organization_id)")
    .eq("account_id", session.account_id)
    .eq("membership_role", "student");
  if (error) throw error;
  return (data ?? []).filter((row) => {
    const classRow = nestedClass(row as unknown as Record<string, unknown>);
    return classRow.organization_id === session.organization_id &&
      classRow.status === "active" &&
      canonicalCourseKey(classRow.course_key) === courseKey;
  }).map((row) => row.class_id);
}

async function studentLessonDecisions(
  session: SessionAccount,
  rawCourseKey: string,
): Promise<LessonAccessDecision[]> {
  const courseKey = canonicalCourseKey(rawCourseKey);
  const catalog = await catalogForCourse(session, courseKey);
  if (["teacher", "admin"].includes(session.role)) {
    return catalog.map((row) => ({
      ...row,
      allowed: true,
      reason: "staff_full_access",
      override_state: "auto",
    }));
  }
  if (session.role !== "student" || !catalog.length) return [];
  const classIds = await studentClassIdsForCourse(session, courseKey);
  if (!classIds.length) return catalog.map((row) => ({
    ...row,
    allowed: false,
    reason: "course_not_assigned",
    override_state: "auto",
  }));

  const [overrideResult, completionResult, sessionResult] = await Promise.all([
    admin.from("lesson_access_overrides")
      .select("class_id,access_key,state")
      .eq("organization_id", session.organization_id)
      .in("class_id", classIds),
    admin.from("lesson_completions")
      .select("access_key")
      .eq("account_id", session.account_id)
      .eq("course_key", courseKey),
    admin.from("learning_sessions")
      .select("course,unit,topic,total,completed_at")
      .eq("account_id", session.account_id)
      .not("completed_at", "is", null)
      .gt("total", 0),
  ]);
  for (const result of [overrideResult, completionResult, sessionResult]) {
    if (result.error) throw result.error;
  }
  const overrides = new Map<string, "shown" | "hidden">(
    (overrideResult.data ?? []).map((row) => [`${row.class_id}::${row.access_key}`, row.state as "shown" | "hidden"]),
  );
  const completed = new Set((completionResult.data ?? []).map((row) => row.access_key));
  const practiceSessions = sessionResult.data ?? [];

  return catalog.map((row, index) => {
    const previous = index > 0 ? catalog[index - 1] : null;
    const previousLessonComplete = previous ? completed.has(previous.access_key) : false;
    const previousPracticeComplete = previous ? practiceSessions.some((practice) =>
      canonicalCourseKey(practice.course) === courseKey &&
      String(practice.unit ?? "") === String(previous.unit_index + 1) &&
      String(practice.topic ?? "") === String(previous.topic) &&
      Number(practice.total ?? 0) > 0
    ) : false;
    const classDecisions = classIds.map((classId) => decideLessonVisibility({
      ready: row.is_ready,
      overrideState: overrides.get(`${classId}::${row.access_key}`) ?? "auto",
      position: row.position,
      previousLessonComplete,
      previousPracticeComplete,
    }));
    const allowed = anyClassAllows(classDecisions);
    const winning = classDecisions.find((decision) => decision.allowed) ?? classDecisions[0];
    const states = classIds.map((classId) => overrides.get(`${classId}::${row.access_key}`)).filter(Boolean);
    return {
      ...row,
      allowed,
      reason: winning?.reason ?? "course_not_assigned",
      override_state: (states.includes("shown") ? "shown" : states.every((state) => state === "hidden") && states.length === classIds.length ? "hidden" : "auto") as "auto" | "shown" | "hidden",
    };
  });
}

async function listLessonAccess(session: SessionAccount, req: Request): Promise<Response> {
  if (!["student", "teacher", "admin"].includes(session.role)) {
    return fail(req, "Lesson access is not available for this role", 403, "forbidden");
  }
  const courseKey = new URL(req.url).searchParams.get("course_key") ?? "";
  if (!courseKey) return fail(req, "Course is required");
  const lessons = await studentLessonDecisions(session, courseKey);
  return json(req, {
    ok: true,
    course_key: canonicalCourseKey(courseKey),
    lessons,
    visible_lesson_keys: lessons.filter((row) => row.allowed).map((row) => row.access_key),
  });
}

async function checkLessonAccess(session: SessionAccount, req: Request): Promise<Response> {
  if (["teacher", "admin"].includes(session.role)) {
    return json(req, { ok: true, allowed: true, reason: "staff_full_access" });
  }
  if (session.role !== "student") return fail(req, "Lesson access is not permitted", 403, "forbidden");
  const payload = await body<{ course_key?: string; access_key?: string }>(req);
  const courseKey = canonicalCourseKey(payload.course_key ?? "");
  const accessKey = String(payload.access_key ?? "");
  if (!courseKey || !accessKey) return json(req, { ok: true, allowed: false, reason: "missing_lesson_route" });
  const lessons = await studentLessonDecisions(session, courseKey);
  const decision = lessons.find((row) => row.access_key === accessKey);
  return json(req, {
    ok: true,
    allowed: Boolean(decision?.allowed),
    reason: decision?.reason ?? "lesson_not_found",
  });
}

async function syncLessonCatalog(session: SessionAccount, req: Request): Promise<Response> {
  requireRole(session, ["admin"]);
  const payload = await body<{ lessons?: Record<string, unknown>[] }>(req);
  const lessons = Array.isArray(payload.lessons) ? payload.lessons.slice(0, 2000) : [];
  const rows = lessons.map((row) => {
    const courseKey = canonicalCourseKey(row.course_key);
    const unitIndex = Number(row.unit_index);
    const topic = String(row.topic ?? "").trim();
    const accessKey = lessonAccessKey(courseKey, unitIndex, topic);
    if (!courseKey || !Number.isInteger(unitIndex) || unitIndex < 0 || !topic || accessKey !== row.access_key) {
      throw new Error("Lesson catalog contains an invalid route");
    }
    return {
      organization_id: session.organization_id,
      access_key: accessKey,
      course_key: courseKey,
      unit_index: unitIndex,
      unit_title: String(row.unit_title ?? "").slice(0, 300),
      topic,
      title: String(row.title ?? topic).slice(0, 500),
      position: Math.max(0, Number(row.position) || 0),
      url: String(row.url ?? "").slice(0, 2000),
      is_ready: Boolean(row.is_ready ?? true),
      updated_at: new Date().toISOString(),
    };
  });
  if (rows.length) {
    const { error } = await admin.from("lesson_catalog").upsert(rows, { onConflict: "organization_id,access_key" });
    if (error) throw error;
  }
  return json(req, { ok: true, synced: rows.length });
}

async function classLessonAccess(session: SessionAccount, req: Request, classId: string): Promise<Response> {
  requireRole(session, ["admin", "teacher"]);
  const classIds = await accessibleClassIds(session);
  if (!classIds.includes(classId)) return fail(req, "Class access is not permitted", 403, "forbidden");
  const { data: classRow, error: classError } = await admin.from("classes")
    .select("id,name,course_key,status")
    .eq("id", classId)
    .eq("organization_id", session.organization_id)
    .single();
  if (classError) throw classError;
  const courseKey = canonicalCourseKey(classRow.course_key);
  const [catalog, overrideResult] = await Promise.all([
    catalogForCourse(session, courseKey),
    admin.from("lesson_access_overrides")
      .select("access_key,state,updated_at")
      .eq("organization_id", session.organization_id)
      .eq("class_id", classId),
  ]);
  if (overrideResult.error) throw overrideResult.error;
  const overrideMap = new Map((overrideResult.data ?? []).map((row) => [row.access_key, row]));
  return json(req, {
    ok: true,
    class: classRow,
    course_key: courseKey,
    lessons: catalog.map((row) => ({
      ...row,
      override_state: overrideMap.get(row.access_key)?.state ?? "auto",
      default_state: row.position < 2 ? "shown" : "progression",
      updated_at: overrideMap.get(row.access_key)?.updated_at ?? null,
    })),
  });
}

async function updateClassLessonAccess(session: SessionAccount, req: Request, classId: string): Promise<Response> {
  requireRole(session, ["admin", "teacher"]);
  const classIds = await accessibleClassIds(session);
  if (!classIds.includes(classId)) return fail(req, "Class access is not permitted", 403, "forbidden");
  const payload = await body<{ access_key?: string; state?: string }>(req);
  const accessKey = String(payload.access_key ?? "");
  const state = String(payload.state ?? "auto");
  if (!["auto", "shown", "hidden"].includes(state)) return fail(req, "Choose Automatic, Show, or Hide");
  const { data: classRow, error: classError } = await admin.from("classes")
    .select("id,course_key")
    .eq("id", classId)
    .eq("organization_id", session.organization_id)
    .single();
  if (classError) throw classError;
  const { data: lesson, error: lessonError } = await admin.from("lesson_catalog")
    .select("access_key,course_key,title")
    .eq("organization_id", session.organization_id)
    .eq("access_key", accessKey)
    .eq("course_key", canonicalCourseKey(classRow.course_key))
    .eq("is_ready", true)
    .single();
  if (lessonError || !lesson) return fail(req, "Lesson is not part of this class course", 400, "invalid_lesson");
  if (state === "auto") {
    const { error } = await admin.from("lesson_access_overrides")
      .delete().eq("class_id", classId).eq("access_key", accessKey);
    if (error) throw error;
  } else {
    const { error } = await admin.from("lesson_access_overrides").upsert({
      organization_id: session.organization_id,
      class_id: classId,
      access_key: accessKey,
      state,
      updated_by: session.account_id,
      updated_at: new Date().toISOString(),
    }, { onConflict: "class_id,access_key" });
    if (error) throw error;
  }
  await admin.from("account_audit_log").insert({
    organization_id: session.organization_id,
    actor_id: session.account_id,
    action: "lesson_access_updated",
    details: { class_id: classId, access_key: accessKey, lesson_title: lesson.title, state },
  });
  return json(req, { ok: true, access_key: accessKey, state });
}

async function studentDashboard(session: SessionAccount, req: Request, requestedId?: string): Promise<Response> {
  const studentId = requestedId || session.account_id;
  if (!(await canAccessStudent(session, studentId))) return fail(req, "Student access is not permitted", 403, "forbidden");

  const [{ data: student, error: studentError }, attemptsResult, masteryResult, reviewResult, sessionsResult] =
    await Promise.all([
      admin.from("accounts").select("id,username,display_name,email,grade,last_login_at").eq("id", studentId).single(),
      admin.from("learning_attempts")
        .select("question_id,correct,course,unit,topic,mode,occurred_at")
        .eq("account_id", studentId)
        .order("occurred_at", { ascending: false })
        .limit(5000),
      admin.from("mastery_records")
        .select("skill_key,course,unit,topic,title,score,attempts,correct,evidence,updated_at")
        .eq("account_id", studentId)
        .order("score", { ascending: false }),
      admin.from("review_items")
        .select("question_id,course,unit,topic,status,due_at,wrong_count,correct_recovery_count")
        .eq("account_id", studentId),
      admin.from("learning_sessions")
        .select("client_session_id,mode,course,unit,topic,correct,total,duration_seconds,started_at,completed_at")
        .eq("account_id", studentId)
        .order("started_at", { ascending: false })
        .limit(20),
    ]);
  if (studentError) throw studentError;
  for (const result of [attemptsResult, masteryResult, reviewResult, sessionsResult]) {
    if (result.error) throw result.error;
  }

  const attempts = attemptsResult.data ?? [];
  const mastery = masteryResult.data ?? [];
  const reviews = reviewResult.data ?? [];
  const sessions = sessionsResult.data ?? [];
  const correct = attempts.filter((row) => row.correct).length;
  const today = dateKey(new Date());
  const weekStart = new Date();
  weekStart.setUTCDate(weekStart.getUTCDate() - 6);
  weekStart.setUTCHours(0, 0, 0, 0);
  const mastered = mastery.filter((row) => Number(row.score) >= 85).length;
  const masteryAverage = mastery.length
    ? Math.round(mastery.reduce((sum, row) => sum + Number(row.score || 0), 0) / mastery.length)
    : 0;
  const due = reviews.filter((row) => row.status === "open" && new Date(row.due_at) <= new Date()).length;
  const mistakes = reviews.filter((row) => row.status === "open").length;
  const durationWeek = sessions
    .filter((row) => new Date(row.started_at) >= weekStart)
    .reduce((sum, row) => sum + Number(row.duration_seconds || 0), 0);

  const { data: memberships, error: membershipError } = await admin
    .from("class_memberships")
    .select("class_id,classes(id,name,course_key,academic_year,section)")
    .eq("account_id", studentId)
    .eq("membership_role", "student");
  if (membershipError) throw membershipError;
  const classIds = (memberships ?? []).map((row) => row.class_id);
  const { data: assignments, error: assignmentError } = classIds.length
    ? await admin
      .from("assignments")
      .select("id,class_id,title,description,activity_type,configuration,available_at,due_at,status")
      .in("class_id", classIds)
      .eq("status", "published")
      .order("due_at", { ascending: true })
    : { data: [], error: null };
  if (assignmentError) throw assignmentError;
  const assignmentIds = (assignments ?? []).map((row) => row.id);
  const { data: results, error: resultError } = assignmentIds.length
    ? await admin
      .from("assignment_results")
      .select("assignment_id,status,score,correct,total,started_at,submitted_at")
      .eq("student_id", studentId)
      .in("assignment_id", assignmentIds)
    : { data: [], error: null };
  if (resultError) throw resultError;
  const resultMap = new Map((results ?? []).map((row) => [row.assignment_id, row]));

  return json(req, {
    ok: true,
    student,
    classes: memberships ?? [],
    counters: {
      attempts: attempts.length,
      accuracy: attempts.length ? Math.round(correct / attempts.length * 100) : 0,
      mastery: masteryAverage,
      mastered_topics: mastered,
      total_topics: mastery.length,
      questions_today: attempts.filter((row) => dateKey(row.occurred_at) === today).length,
      review_due: due,
      open_mistakes: mistakes,
      streak: computeStreak(attempts),
      weekly_minutes: Math.round(durationWeek / 60),
    },
    mastery: mastery.map((row) => ({ ...row, level: masteryLabel(Number(row.score)) })),
    strengths: mastery.slice(0, 5),
    priorities: [...mastery].sort((a, b) => Number(a.score) - Number(b.score)).slice(0, 5),
    review: reviews,
    recent_sessions: sessions,
    assignments: (assignments ?? []).map((assignment) => ({
      ...assignment,
      result: resultMap.get(assignment.id) ?? { status: "not_started" },
    })),
  });
}

async function listChildren(session: SessionAccount, req: Request): Promise<Response> {
  if (session.role === "student") {
    const { data, error } = await admin.from("accounts")
      .select("id,username,display_name,email,grade,last_login_at")
      .eq("id", session.account_id);
    if (error) throw error;
    return json(req, { ok: true, students: data ?? [] });
  }
  if (session.role === "parent") {
    const { data: links, error: linkError } = await admin.from("parent_student_links")
      .select("student_id,relationship_label")
      .eq("parent_id", session.account_id);
    if (linkError) throw linkError;
    const ids = (links ?? []).map((row) => row.student_id);
    if (!ids.length) return json(req, { ok: true, students: [] });
    const { data, error } = await admin.from("accounts")
      .select("id,username,display_name,email,grade,last_login_at")
      .in("id", ids).order("display_name");
    if (error) throw error;
    return json(req, { ok: true, students: data ?? [] });
  }
  if (session.role === "teacher" || session.role === "admin") {
    const classIds = await accessibleClassIds(session);
    if (!classIds.length) return json(req, { ok: true, students: [] });
    const { data: memberships, error: memberError } = await admin.from("class_memberships")
      .select("account_id").in("class_id", classIds).eq("membership_role", "student");
    if (memberError) throw memberError;
    const ids = [...new Set((memberships ?? []).map((row) => row.account_id))];
    if (!ids.length) return json(req, { ok: true, students: [] });
    const { data, error } = await admin.from("accounts")
      .select("id,username,display_name,email,grade,last_login_at")
      .in("id", ids).order("display_name");
    if (error) throw error;
    return json(req, { ok: true, students: data ?? [] });
  }
  return json(req, { ok: true, students: [] });
}

async function listClasses(session: SessionAccount, req: Request): Promise<Response> {
  requireRole(session, ["admin", "teacher"]);
  const classIds = await accessibleClassIds(session);
  if (!classIds.length && session.role === "teacher") return json(req, { ok: true, classes: [] });

  let query = admin.from("classes")
    .select("id,name,course_key,academic_year,section,status,created_at")
    .eq("organization_id", session.organization_id)
    .order("name");
  if (session.role === "teacher") query = query.in("id", classIds);
  const { data: classes, error } = await query;
  if (error) throw error;

  const ids = (classes ?? []).map((row) => row.id);
  const { data: memberships, error: memberError } = ids.length
    ? await admin.from("class_memberships").select("class_id,account_id,membership_role").in("class_id", ids)
    : { data: [], error: null };
  if (memberError) throw memberError;
  const counts = new Map<string, { teachers: number; students: number }>();
  for (const row of memberships ?? []) {
    const entry = counts.get(row.class_id) ?? { teachers: 0, students: 0 };
    if (row.membership_role === "teacher") entry.teachers++;
    else entry.students++;
    counts.set(row.class_id, entry);
  }

  return json(req, {
    ok: true,
    classes: (classes ?? []).map((row) => ({ ...row, counts: counts.get(row.id) ?? { teachers: 0, students: 0 } })),
  });
}

async function classDashboard(session: SessionAccount, req: Request, classId: string): Promise<Response> {
  requireRole(session, ["admin", "teacher"]);
  const classIds = await accessibleClassIds(session);
  if (!classIds.includes(classId)) return fail(req, "Class access is not permitted", 403, "forbidden");

  const [{ data: classRow, error: classError }, { data: memberships, error: memberError }] = await Promise.all([
    admin.from("classes").select("*").eq("id", classId).single(),
    admin.from("class_memberships").select("account_id,membership_role").eq("class_id", classId),
  ]);
  if (classError) throw classError;
  if (memberError) throw memberError;

  const studentIds = (memberships ?? []).filter((row) => row.membership_role === "student").map((row) => row.account_id);
  const { data: students, error: studentError } = studentIds.length
    ? await admin.from("accounts")
      .select("id,username,display_name,email,grade,status,last_login_at")
      .in("id", studentIds)
      .order("display_name")
    : { data: [], error: null };
  if (studentError) throw studentError;

  const [attemptsResult, masteryResult, reviewResult, assignmentsResult] = await Promise.all([
    studentIds.length
      ? admin.from("learning_attempts").select("account_id,correct,occurred_at").in("account_id", studentIds)
      : Promise.resolve({ data: [], error: null }),
    studentIds.length
      ? admin.from("mastery_records").select("account_id,skill_key,title,course,unit,topic,score").in("account_id", studentIds)
      : Promise.resolve({ data: [], error: null }),
    studentIds.length
      ? admin.from("review_items").select("account_id,status,due_at").in("account_id", studentIds)
      : Promise.resolve({ data: [], error: null }),
    admin.from("assignments")
      .select("id,title,activity_type,due_at,status,created_at")
      .eq("class_id", classId)
      .order("created_at", { ascending: false }),
  ]);
  for (const result of [attemptsResult, masteryResult, reviewResult, assignmentsResult]) {
    if (result.error) throw result.error;
  }

  const attempts = attemptsResult.data ?? [];
  const mastery = masteryResult.data ?? [];
  const reviews = reviewResult.data ?? [];
  const todayMinus7 = new Date(Date.now() - 7 * 86400000);
  const analytics = (students ?? []).map((student) => {
    const studentAttempts = attempts.filter((row) => row.account_id === student.id);
    const studentMastery = mastery.filter((row) => row.account_id === student.id);
    const studentReviews = reviews.filter((row) => row.account_id === student.id && row.status === "open");
    const correct = studentAttempts.filter((row) => row.correct).length;
    const avgMastery = studentMastery.length
      ? Math.round(studentMastery.reduce((sum, row) => sum + Number(row.score), 0) / studentMastery.length)
      : 0;
    return {
      ...student,
      attempts: studentAttempts.length,
      accuracy: studentAttempts.length ? Math.round(correct / studentAttempts.length * 100) : 0,
      mastery: avgMastery,
      mastered_topics: studentMastery.filter((row) => Number(row.score) >= 85).length,
      open_mistakes: studentReviews.length,
      active_this_week: studentAttempts.some((row) => new Date(row.occurred_at) >= todayMinus7),
    };
  });

  const weakMap = new Map<string, { title: string; total: number; count: number }>();
  for (const row of mastery) {
    const key = row.skill_key;
    const entry = weakMap.get(key) ?? { title: row.title || row.topic || key, total: 0, count: 0 };
    entry.total += Number(row.score);
    entry.count++;
    weakMap.set(key, entry);
  }
  const supportPriorities = [...weakMap.entries()]
    .map(([skill_key, row]) => ({ skill_key, title: row.title, mastery: Math.round(row.total / row.count), students: row.count }))
    .sort((a, b) => a.mastery - b.mastery)
    .slice(0, 8);

  return json(req, {
    ok: true,
    class: classRow,
    students: analytics,
    assignments: assignmentsResult.data ?? [],
    support_priorities: supportPriorities,
    summary: {
      students: analytics.length,
      active_this_week: analytics.filter((row) => row.active_this_week).length,
      average_accuracy: analytics.length ? Math.round(analytics.reduce((sum, row) => sum + row.accuracy, 0) / analytics.length) : 0,
      average_mastery: analytics.length ? Math.round(analytics.reduce((sum, row) => sum + row.mastery, 0) / analytics.length) : 0,
      need_support: analytics.filter((row) => row.mastery < 50 || row.accuracy < 60).length,
    },
  });
}

async function syncLearning(session: SessionAccount, req: Request): Promise<Response> {
  requireRole(session, ["student"]);
  const payload = await body<{
    attempts?: Record<string, unknown>[];
    sessions?: Record<string, unknown>[];
    mastery?: Record<string, unknown>[];
    review?: Record<string, unknown>[];
    lessons?: Record<string, unknown>[];
  }>(req);
  const attempts = (payload.attempts ?? []).slice(-10000);
  const sessions = (payload.sessions ?? []).slice(-1000);
  const mastery = (payload.mastery ?? []).slice(-5000);
  const review = (payload.review ?? []).slice(-5000);
  const lessons = (payload.lessons ?? []).slice(-2000);

  const attemptRows = await Promise.all(attempts.map(async (row, index) => {
    const seed = JSON.stringify([row.id, row.question_id, row.at, row.occurred_at, row.response, index]);
    return {
      organization_id: session.organization_id,
      account_id: session.account_id,
      client_event_id: String(row.event_id ?? row.client_event_id ?? await sha256(seed)),
      question_id: String(row.question_id ?? row.id ?? ""),
      course: row.course ?? null,
      unit: row.unit ?? null,
      topic: row.topic ?? null,
      correct: Boolean(row.correct),
      response: row.response == null ? null : String(row.response),
      mode: row.mode ?? "practice",
      bank_code: row.bank_code ?? null,
      assignment_id: row.assignment_id ?? null,
      occurred_at: String(row.occurred_at ?? row.at ?? new Date().toISOString()),
      payload: row,
    };
  })).then((rows) => rows.filter((row) => row.question_id));

  const sessionRows = sessions.map((row) => ({
    organization_id: session.organization_id,
    account_id: session.account_id,
    client_session_id: String(row.client_session_id ?? row.id ?? crypto.randomUUID()),
    mode: String(row.mode ?? "practice"),
    course: row.course ?? null,
    unit: row.unit ?? null,
    topic: row.topic ?? null,
    assignment_id: row.assignment_id ?? null,
    correct: Number(row.correct ?? 0),
    total: Number(row.total ?? row.graded ?? 0),
    duration_seconds: Number(row.duration_seconds ?? 0),
    started_at: String(row.started_at ?? row.startedAt ?? new Date().toISOString()),
    completed_at: row.completed_at ?? row.completedAt ?? null,
    payload: row,
  }));

  const masteryRows = mastery.map((row) => ({
    organization_id: session.organization_id,
    account_id: session.account_id,
    skill_key: String(row.skill_key ?? row.key ?? ""),
    course: row.course ?? null,
    unit: row.unit ?? null,
    topic: row.topic ?? null,
    title: row.title ?? null,
    score: Math.max(0, Math.min(100, Number(row.score ?? 0))),
    attempts: Number(row.attempts ?? 0),
    correct: Number(row.correct ?? 0),
    evidence: Math.max(0, Math.min(1, Number(row.evidence ?? 0))),
    updated_at: String(row.updated_at ?? row.updatedAt ?? new Date().toISOString()),
  })).filter((row) => row.skill_key);

  const reviewRows = review.map((row) => ({
    organization_id: session.organization_id,
    account_id: session.account_id,
    question_id: String(row.question_id ?? row.id ?? ""),
    course: row.course ?? null,
    unit: row.unit ?? null,
    topic: row.topic ?? null,
    status: ["open", "recovered", "dismissed"].includes(String(row.status)) ? row.status : "open",
    due_at: String(row.due_at ?? row.dueAt ?? new Date().toISOString()),
    interval_days: Number(row.interval_days ?? row.intervalDays ?? 1),
    wrong_count: Number(row.wrong_count ?? row.wrongCount ?? 0),
    correct_recovery_count: Number(row.correct_recovery_count ?? row.correctRecoveryCount ?? 0),
    payload: row,
    updated_at: new Date().toISOString(),
  })).filter((row) => row.question_id);

  const lessonRows = lessons.map((row) => {
    const courseKey = canonicalCourseKey(row.course_key ?? row.course);
    const unitIndex = Number(row.unit_index ?? (Number(row.unit ?? 1) - 1));
    const topic = String(row.topic ?? "").trim();
    const accessKey = String(row.access_key ?? lessonAccessKey(courseKey, unitIndex, topic));
    return {
      organization_id: session.organization_id,
      account_id: session.account_id,
      access_key: accessKey,
      course_key: courseKey,
      unit_index: unitIndex,
      topic,
      title: String(row.title ?? ""),
      completed_at: String(row.completed_at ?? row.completedAt ?? new Date().toISOString()),
      payload: row,
      updated_at: new Date().toISOString(),
    };
  }).filter((row) => row.course_key && Number.isInteger(row.unit_index) && row.unit_index >= 0 && row.topic && row.access_key === lessonAccessKey(row.course_key, row.unit_index, row.topic));

  const operations = [];
  if (attemptRows.length) operations.push(admin.from("learning_attempts").upsert(attemptRows, { onConflict: "account_id,client_event_id", ignoreDuplicates: true }));
  if (sessionRows.length) operations.push(admin.from("learning_sessions").upsert(sessionRows, { onConflict: "account_id,client_session_id" }));
  if (masteryRows.length) operations.push(admin.from("mastery_records").upsert(masteryRows, { onConflict: "account_id,skill_key" }));
  if (reviewRows.length) operations.push(admin.from("review_items").upsert(reviewRows, { onConflict: "account_id,question_id" }));
  if (lessonRows.length) operations.push(admin.from("lesson_completions").upsert(lessonRows, { onConflict: "account_id,access_key" }));
  const results = await Promise.all(operations);
  const failed = results.find((result) => result.error);
  if (failed?.error) throw failed.error;

  return json(req, {
    ok: true,
    synced: {
      attempts: attemptRows.length,
      sessions: sessionRows.length,
      mastery: masteryRows.length,
      review: reviewRows.length,
      lessons: lessonRows.length,
    },
  });
}

async function createClass(session: SessionAccount, req: Request): Promise<Response> {
  requireRole(session, ["admin", "teacher"]);
  const payload = await body<Record<string, unknown>>(req);
  const name = String(payload.name ?? "").trim();
  const courseKey = String(payload.course_key ?? "").trim();
  if (!name || !courseKey) return fail(req, "Class name and course are required");
  const { data, error } = await admin.from("classes").insert({
    organization_id: session.organization_id,
    name,
    course_key: courseKey,
    academic_year: payload.academic_year ?? null,
    section: payload.section ?? null,
    created_by: session.account_id,
  }).select().single();
  if (error) throw error;
  await admin.from("class_memberships").insert({
    class_id: data.id,
    account_id: session.account_id,
    membership_role: "teacher",
  });
  return json(req, { ok: true, class: data }, 201);
}

async function setMembers(session: SessionAccount, req: Request, classId: string): Promise<Response> {
  requireRole(session, ["admin", "teacher"]);
  const classIds = await accessibleClassIds(session);
  if (!classIds.includes(classId)) return fail(req, "Class access is not permitted", 403, "forbidden");
  const payload = await body<{ student_ids?: string[]; teacher_ids?: string[] }>(req);
  const students = [...new Set(payload.student_ids ?? [])];
  const teachers = [...new Set(payload.teacher_ids ?? [])];
  await admin.from("class_memberships").delete().eq("class_id", classId);
  const rows = [
    ...teachers.map((account_id) => ({ class_id: classId, account_id, membership_role: "teacher" })),
    ...students.map((account_id) => ({ class_id: classId, account_id, membership_role: "student" })),
  ];
  if (!teachers.includes(session.account_id) && session.role === "teacher") {
    rows.push({ class_id: classId, account_id: session.account_id, membership_role: "teacher" });
  }
  if (rows.length) {
    const { error } = await admin.from("class_memberships").insert(rows);
    if (error) throw error;
  }
  return json(req, { ok: true, members: rows.length });
}

async function listTimetable(session: SessionAccount, req: Request): Promise<Response> {
  const url = new URL(req.url);
  let classIds: string[] = [];
  let teacherId: string | null = null;
  if (session.role === "admin") {
    teacherId = url.searchParams.get("teacher_id");
  } else if (session.role === "teacher") {
    teacherId = session.account_id;
    classIds = await accessibleClassIds(session);
  } else if (session.role === "student") {
    const { data: memberships, error } = await admin.from("class_memberships")
      .select("class_id").eq("account_id", session.account_id).eq("membership_role", "student");
    if (error) throw error;
    classIds = (memberships ?? []).map((row) => row.class_id);
    if (!classIds.length) return json(req, { ok: true, entries: [], editable: false });
  } else {
    return json(req, { ok: true, entries: [], editable: false });
  }

  let query = admin.from("timetable_entries")
    .select("id,teacher_id,class_id,day_of_week,period_order,start_time,end_time,room,label,teacher:accounts!timetable_entries_teacher_id_fkey(id,display_name,username),class:classes!timetable_entries_class_id_fkey(id,name,course_key,section)")
    .eq("organization_id", session.organization_id)
    .order("day_of_week").order("period_order");
  if (teacherId) query = query.eq("teacher_id", teacherId);
  else if (classIds.length) query = query.in("class_id", classIds);
  const { data: entries, error } = await query;
  if (error) throw error;

  if (session.role !== "admin")
    return json(req, { ok: true, entries: entries ?? [], editable: false });
  const [{ data: teachers, error: teacherError }, { data: classes, error: classError }] = await Promise.all([
    admin.from("accounts").select("id,display_name,username").eq("organization_id", session.organization_id).eq("role", "teacher").eq("status", "active").order("display_name"),
    admin.from("classes").select("id,name,course_key,section,academic_year").eq("organization_id", session.organization_id).eq("status", "active").order("name"),
  ]);
  if (teacherError) throw teacherError;
  if (classError) throw classError;
  return json(req, { ok: true, entries: entries ?? [], teachers: teachers ?? [], classes: classes ?? [], editable: true });
}

async function replaceTimetable(session: SessionAccount, req: Request): Promise<Response> {
  requireRole(session, ["admin"]);
  const payload = await body<{ teacher_id?: string; entries?: Record<string, unknown>[] }>(req);
  const teacherId = String(payload.teacher_id ?? "");
  const entries = Array.isArray(payload.entries) ? payload.entries.slice(0, 140) : [];
  const { data: teacher, error: teacherError } = await admin.from("accounts")
    .select("id").eq("id", teacherId).eq("organization_id", session.organization_id).eq("role", "teacher").single();
  if (teacherError || !teacher) return fail(req, "Choose a valid teacher", 400, "invalid_teacher");

  const classIds = [...new Set(entries.map((row) => String(row.class_id ?? "")).filter(Boolean))];
  if (classIds.length) {
    const { data: classes, error } = await admin.from("classes")
      .select("id").eq("organization_id", session.organization_id).in("id", classIds);
    if (error) throw error;
    if ((classes ?? []).length !== classIds.length)
      return fail(req, "One or more timetable classes are invalid", 400, "invalid_class");
  }

  const slots = new Set<string>(), rows = [];
  for (const entry of entries) {
    const day = Number(entry.day_of_week), period = Number(entry.period_order),
      start = String(entry.start_time ?? ""), end = String(entry.end_time ?? ""),
      classId = String(entry.class_id ?? ""), slot = `${day}:${period}`;
    if (!Number.isInteger(day) || day < 1 || day > 7 || !Number.isInteger(period) || period < 1 || period > 20)
      return fail(req, "Timetable day or period is invalid", 400, "invalid_slot");
    if (!/^\d{2}:\d{2}$/.test(start) || !/^\d{2}:\d{2}$/.test(end) || end <= start)
      return fail(req, "Timetable times are invalid", 400, "invalid_time");
    if (!classId || slots.has(slot)) return fail(req, "Each teacher may have only one class in a period", 400, "duplicate_slot");
    slots.add(slot);
    rows.push({
      organization_id: session.organization_id,
      teacher_id: teacherId,
      class_id: classId,
      day_of_week: day,
      period_order: period,
      start_time: start,
      end_time: end,
      room: String(entry.room ?? "").trim() || null,
      label: String(entry.label ?? "").trim() || null,
      created_by: session.account_id,
      updated_at: new Date().toISOString(),
    });
  }
  const { data, error } = await admin.rpc("api_replace_timetable", {
    p_organization_id: session.organization_id,
    p_teacher_id: teacherId,
    p_created_by: session.account_id,
    p_entries: rows,
  });
  if (error) throw error;
  return json(req, { ok: true, entries: data ?? [], teacher_id: teacherId });
}

async function listAssignments(session: SessionAccount, req: Request): Promise<Response> {
  const url = new URL(req.url);
  let query = admin.from("assignments")
    .select("id,class_id,created_by,title,description,activity_type,configuration,available_at,due_at,status,created_at")
    .eq("organization_id", session.organization_id)
    .order("due_at", { ascending: true });
  if (session.role === "teacher") {
    const classIds = await accessibleClassIds(session);
    if (!classIds.length) return json(req, { ok: true, assignments: [] });
    query = query.in("class_id", classIds);
  } else if (session.role === "student") {
    const { data: memberships } = await admin.from("class_memberships")
      .select("class_id").eq("account_id", session.account_id).eq("membership_role", "student");
    const classIds = (memberships ?? []).map((row) => row.class_id);
    if (!classIds.length) return json(req, { ok: true, assignments: [] });
    query = query.in("class_id", classIds).eq("status", "published");
  } else if (session.role === "parent") {
    return json(req, { ok: true, assignments: [] });
  }
  const classId = url.searchParams.get("class_id");
  if (classId) query = query.eq("class_id", classId);
  const { data, error } = await query;
  if (error) throw error;
  return json(req, { ok: true, assignments: data ?? [] });
}

async function createAssignment(session: SessionAccount, req: Request): Promise<Response> {
  requireRole(session, ["admin", "teacher"]);
  const payload = await body<Record<string, unknown>>(req);
  const classId = String(payload.class_id ?? "");
  const classIds = await accessibleClassIds(session);
  if (!classIds.includes(classId)) return fail(req, "Class access is not permitted", 403, "forbidden");
  const activityType = String(payload.activity_type ?? "adaptive");
  if (!["practice", "adaptive", "review", "exam", "lesson"].includes(activityType)) {
    return fail(req, "Invalid assignment type");
  }
  const { data, error } = await admin.from("assignments").insert({
    organization_id: session.organization_id,
    class_id: classId,
    created_by: session.account_id,
    title: String(payload.title ?? "").trim(),
    description: payload.description ?? null,
    activity_type: activityType,
    configuration: payload.configuration ?? {},
    available_at: payload.available_at ?? new Date().toISOString(),
    due_at: payload.due_at ?? null,
    status: payload.status ?? "published",
  }).select().single();
  if (error) throw error;
  return json(req, { ok: true, assignment: data }, 201);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(req.headers.get("origin") ?? "") });
  const path = new URL(req.url).pathname.split("/institution-api")[1] || "/";
  try {
    if (path === "/health" && req.method === "GET") {
      return json(req, { ok: true, service: "echs-institution-api", version: "4.0.0" });
    }
    const session = await sessionFromRequest(req);
    if (!session) return fail(req, "Sign in is required", 401, "unauthenticated");

    if (path === "/learning/sync" && req.method === "POST") return await syncLearning(session, req);
    if (path === "/children" && req.method === "GET") return await listChildren(session, req);
    if (path === "/dashboard/student" && req.method === "GET") {
      return await studentDashboard(session, req, new URL(req.url).searchParams.get("student_id") ?? undefined);
    }
    if (path === "/classes" && req.method === "GET") return await listClasses(session, req);
    if (path === "/classes" && req.method === "POST") return await createClass(session, req);
    if (path === "/lesson-access" && req.method === "GET") return await listLessonAccess(session, req);
    if (path === "/lesson-access/check" && req.method === "POST") return await checkLessonAccess(session, req);
    if (path === "/lesson-access/catalog" && req.method === "POST") return await syncLessonCatalog(session, req);
    const memberMatch = path.match(/^\/classes\/([0-9a-f-]{36})\/members$/i);
    if (memberMatch && req.method === "POST") return await setMembers(session, req, memberMatch[1]);
    const dashboardMatch = path.match(/^\/classes\/([0-9a-f-]{36})\/dashboard$/i);
    if (dashboardMatch && req.method === "GET") return await classDashboard(session, req, dashboardMatch[1]);
    const lessonAccessMatch = path.match(/^\/classes\/([0-9a-f-]{36})\/lesson-access$/i);
    if (lessonAccessMatch && req.method === "GET") return await classLessonAccess(session, req, lessonAccessMatch[1]);
    if (lessonAccessMatch && req.method === "PUT") return await updateClassLessonAccess(session, req, lessonAccessMatch[1]);
    if (path === "/assignments" && req.method === "GET") return await listAssignments(session, req);
    if (path === "/assignments" && req.method === "POST") return await createAssignment(session, req);
    if (path === "/timetable" && req.method === "GET") return await listTimetable(session, req);
    if (path === "/timetable" && req.method === "PUT") return await replaceTimetable(session, req);

    return fail(req, "Route not found", 404, "not_found");
  } catch (error) {
    if (error instanceof Response) return fail(req, "You do not have permission for this action", error.status, "forbidden");
    console.error(error);
    return fail(req, error instanceof Error ? error.message : "Unexpected server error", 400);
  }
});
