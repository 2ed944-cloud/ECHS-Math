import { createClient } from "npm:@supabase/supabase-js@2";

type Role = "admin" | "teacher" | "student" | "parent";
type SessionAccount = { account_id: string; organization_id: string; role: Role };
type AttemptInput = Record<string, unknown>;

const URL = Deno.env.get("SUPABASE_URL") ?? "";
const KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const ORIGINS = (Deno.env.get("ALLOWED_ORIGINS") ?? "https://2ed944-cloud.github.io,http://localhost:4173,http://127.0.0.1:4173")
  .split(",").map((value) => value.trim()).filter(Boolean);
const db = createClient(URL, KEY, { auth: { persistSession: false, autoRefreshToken: false } });

function headers(req: Request): HeadersInit {
  const origin = req.headers.get("origin") ?? "";
  const allowed = ORIGINS.includes(origin) ? origin : ORIGINS[0] ?? "";
  return {
    "access-control-allow-origin": allowed,
    "access-control-allow-headers": "authorization, content-type",
    "access-control-allow-methods": "GET, POST, OPTIONS",
    "vary": "Origin",
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
  };
}
function reply(req: Request, data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: headers(req) });
}
function failure(req: Request, message: string, status = 400, code = "request_error") {
  return reply(req, { ok: false, error: { code, message } }, status);
}
async function hash(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}
async function session(req: Request): Promise<SessionAccount | null> {
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) return null;
  const { data, error } = await db.rpc("api_session_lookup", { p_token_hash: await hash(token) });
  if (error) throw error;
  return Array.isArray(data) && data[0] ? data[0] as SessionAccount : null;
}
function number(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}
function clamp(value: number, minimum = 0, maximum = 1) {
  return Math.min(maximum, Math.max(minimum, value));
}
function normalise(value: unknown) {
  return String(value ?? "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
function fallbackSkill(row: AttemptInput) {
  const course = String(row.course ?? "unassigned");
  const unit = String(row.unit ?? "all");
  const topic = String(row.topic ?? "general");
  return `${normalise(course)}::${normalise(unit)}::${normalise(topic)}`;
}
function skillKey(row: AttemptInput) {
  return String(row.skill_key ?? row.skillKey ?? row.key ?? fallbackSkill(row));
}
function representation(row: AttemptInput) {
  const raw = row.representation ?? (row.classification as Record<string, unknown> | undefined)?.representation ?? "unknown";
  return normalise(raw) || "unknown";
}
function assistance(row: AttemptInput) {
  return normalise(row.assistance_level ?? row.assistanceLevel ?? row.help_level ?? "none") || "none";
}
function difficulty(row: AttemptInput) {
  const metadata = row.metadata as Record<string, unknown> | undefined;
  return clamp(number(row.difficulty ?? metadata?.difficulty, 2), 1, 3);
}
function dayKey(value: unknown) {
  const date = new Date(String(value ?? ""));
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}
function masteryLevel(score: number, confidence: number) {
  if (score >= 85 && confidence >= .72) return "Mastered";
  if (score >= 65 && confidence >= .5) return "Proficient";
  if (score >= 35) return "Developing";
  return "Starting";
}

async function accessibleClassIds(current: SessionAccount) {
  if (current.role === "admin") {
    const { data, error } = await db.from("classes").select("id").eq("organization_id", current.organization_id);
    if (error) throw error;
    return (data ?? []).map((row) => row.id as string);
  }
  if (current.role !== "teacher") return [];
  const { data, error } = await db.from("class_memberships").select("class_id")
    .eq("account_id", current.account_id).eq("membership_role", "teacher");
  if (error) throw error;
  return (data ?? []).map((row) => row.class_id as string);
}

async function recomputeMastery(current: SessionAccount, affectedSkills: string[]) {
  const uniqueSkills = [...new Set(affectedSkills.filter(Boolean))];
  if (!uniqueSkills.length) return [];
  const [{ data: attempts, error: attemptError }, { data: definitions, error: definitionError }] = await Promise.all([
    db.from("learning_attempts")
      .select("skill_key,course,unit,topic,correct,mode,difficulty,representation,assistance_level,trust_tier,occurred_at,payload")
      .eq("account_id", current.account_id).in("skill_key", uniqueSkills)
      .order("occurred_at", { ascending: true }).limit(10000),
    db.from("skill_definitions")
      .select("skill_key,course,unit,topic,title,evidence_rules")
      .in("skill_key", uniqueSkills),
  ]);
  if (attemptError) throw attemptError;
  if (definitionError) throw definitionError;
  const definitionMap = new Map((definitions ?? []).map((row) => [row.skill_key, row]));
  const rows = [];
  for (const key of uniqueSkills) {
    const evidenceRows = (attempts ?? []).filter((row) => row.skill_key === key);
    if (!evidenceRows.length) continue;
    const recent = evidenceRows.slice(-8);
    const correct = evidenceRows.filter((row) => row.correct).length;
    const independent = evidenceRows.filter((row) => !row.assistance_level || row.assistance_level === "none").length;
    const transfer = evidenceRows.filter((row) => ["transfer", "challenge", "mixed"].includes(String(row.mode))).length;
    const representations = new Set(evidenceRows.map((row) => row.representation).filter((value) => value && value !== "unknown"));
    const activeDays = new Set(evidenceRows.map((row) => dayKey(row.occurred_at)).filter(Boolean)).size;
    const firstAt = new Date(evidenceRows[0].occurred_at).getTime();
    const retentionCorrect = evidenceRows.filter((row) => row.correct && new Date(row.occurred_at).getTime() - firstAt >= 48 * 3600000).length;
    const verifiedBoundary = evidenceRows.filter((row) => row.trust_tier === "student_ready_verified").length;
    const overallAccuracy = correct / evidenceRows.length;
    const recentAccuracy = recent.filter((row) => row.correct).length / recent.length;
    const challengeCorrect = evidenceRows.filter((row) => row.correct && number(row.difficulty, 2) >= 3).length;
    const challengeRate = Math.min(1, challengeCorrect / 2);
    const retentionRate = Math.min(1, retentionCorrect / 2);
    const confidence = clamp(
      (1 - Math.exp(-evidenceRows.length / 6)) * .58 +
      Math.min(1, independent / 5) * .14 +
      Math.min(1, representations.size / 4) * .1 +
      Math.min(1, activeDays / 3) * .1 +
      Math.min(1, verifiedBoundary / 4) * .08
    );
    const score = Math.round(clamp(
      (overallAccuracy * .35 + recentAccuracy * .4 + challengeRate * .1 + retentionRate * .15) *
      (.68 + .32 * confidence)
    ) * 100);
    const definition = definitionMap.get(key) as Record<string, unknown> | undefined;
    const rules = (definition?.evidence_rules ?? {}) as Record<string, unknown>;
    const minimumIndependent = number(rules.minimum_independent, 4);
    const minimumDays = number(rules.minimum_days, 2);
    const minimumConfidence = number(rules.minimum_confidence, .72);
    const requiresTransfer = Boolean(rules.requires_transfer);
    const requiresRetention = Boolean(rules.requires_retention);
    const verified = score >= 85 && confidence >= minimumConfidence && independent >= minimumIndependent &&
      activeDays >= minimumDays && (!requiresTransfer || transfer > 0) && (!requiresRetention || retentionCorrect > 0);
    const latest = evidenceRows[evidenceRows.length - 1];
    rows.push({
      organization_id: current.organization_id,
      account_id: current.account_id,
      skill_key: key,
      course: definition?.course ?? latest.course ?? null,
      unit: definition?.unit ?? latest.unit ?? null,
      topic: definition?.topic ?? latest.topic ?? null,
      title: definition?.title ?? latest.topic ?? key,
      score,
      attempts: evidenceRows.length,
      correct,
      evidence: confidence,
      confidence,
      independent_evidence: independent,
      transfer_evidence: transfer,
      retention_evidence: retentionCorrect,
      representation_count: representations.size,
      active_days: activeDays,
      last_attempt_at: latest.occurred_at,
      last_verified_at: verified ? latest.occurred_at : null,
      source: "server",
      payload: {
        algorithm: "echs-mastery-2.0-foundation",
        level: masteryLevel(score, confidence),
        overall_accuracy: Math.round(overallAccuracy * 100),
        recent_accuracy: Math.round(recentAccuracy * 100),
        verified_question_evidence: verifiedBoundary,
        requirements: { minimumIndependent, minimumDays, minimumConfidence, requiresTransfer, requiresRetention },
        verified,
      },
      updated_at: new Date().toISOString(),
    });
  }
  if (rows.length) {
    const { error } = await db.from("mastery_records").upsert(rows, { onConflict: "account_id,skill_key" });
    if (error) throw error;
  }
  return rows;
}

async function sync(current: SessionAccount, req: Request) {
  if (current.role !== "student") return failure(req, "Student sign-in is required", 401, "student_required");
  const payload = await req.json() as {
    attempts?: AttemptInput[];
    sessions?: Record<string, unknown>[];
    review?: Record<string, unknown>[];
    mastery?: Record<string, unknown>[];
  };
  const attempts = (payload.attempts ?? []).slice(-10000);
  const sessions = (payload.sessions ?? []).slice(-1000);
  const review = (payload.review ?? []).slice(-5000);
  const attemptRows = await Promise.all(attempts.map(async (row, index) => {
    const questionId = String(row.question_id ?? row.questionId ?? row.id ?? "");
    const eventId = String(row.event_id ?? row.client_event_id ?? row.id ?? await hash(JSON.stringify([questionId, row.at, row.response, index])));
    return {
      organization_id: current.organization_id,
      account_id: current.account_id,
      client_event_id: eventId,
      question_id: questionId,
      skill_key: skillKey(row),
      course: row.course ?? null,
      unit: row.unit ?? null,
      topic: row.topic ?? null,
      correct: Boolean(row.correct),
      response: row.response == null ? null : String(row.response),
      mode: row.mode ?? "practice",
      bank_code: row.bank_code ?? row.bankCode ?? null,
      assignment_id: row.assignment_id ?? row.assignmentId ?? null,
      difficulty: difficulty(row),
      representation: representation(row),
      assistance_level: assistance(row),
      trust_tier: String(row.trust_tier ?? row.trustTier ?? "legacy_verified_boundary"),
      occurred_at: String(row.occurred_at ?? row.at ?? new Date().toISOString()),
      payload: row,
    };
  })).then((rows) => rows.filter((row) => row.question_id && row.skill_key));
  const sessionRows = sessions.map((row) => ({
    organization_id: current.organization_id,
    account_id: current.account_id,
    client_session_id: String(row.client_session_id ?? row.clientSessionId ?? row.id ?? crypto.randomUUID()),
    mode: String(row.mode ?? row.type ?? "practice"),
    course: row.course ?? null,
    unit: row.unit ?? null,
    topic: row.topic ?? null,
    assignment_id: row.assignment_id ?? row.assignmentId ?? null,
    correct: number(row.correct),
    total: number(row.total ?? row.graded ?? row.answered),
    duration_seconds: number(row.duration_seconds ?? row.durationSeconds ?? number(row.durationMs) / 1000),
    started_at: String(row.started_at ?? row.startedAt ?? new Date().toISOString()),
    completed_at: row.completed_at ?? row.completedAt ?? row.endedAt ?? null,
    payload: row,
  }));
  const reviewRows = review.map((row) => ({
    organization_id: current.organization_id,
    account_id: current.account_id,
    question_id: String(row.question_id ?? row.questionId ?? row.id ?? ""),
    course: row.course ?? null,
    unit: row.unit ?? null,
    topic: row.topic ?? null,
    status: row.status ?? (row.unresolved === false ? "recovered" : "open"),
    due_at: String(row.due_at ?? row.dueAt ?? new Date().toISOString()),
    interval_days: number(row.interval_days ?? row.intervalDays ?? row.box, 1),
    wrong_count: number(row.wrong_count ?? row.wrongCount ?? (row.unresolved ? 1 : 0)),
    correct_recovery_count: number(row.correct_recovery_count ?? row.correctRecoveryCount ?? row.correct),
    payload: row,
    updated_at: new Date().toISOString(),
  })).filter((row) => row.question_id);
  const assignmentRows = sessionRows.filter((row) => row.assignment_id).map((row) => ({
    assignment_id: row.assignment_id,
    student_id: current.account_id,
    status: row.completed_at ? "submitted" : "in_progress",
    score: row.total ? Math.round(row.correct / row.total * 100) : null,
    correct: row.correct,
    total: row.total,
    duration_seconds: row.duration_seconds,
    started_at: row.started_at,
    submitted_at: row.completed_at,
    payload: row.payload,
    updated_at: new Date().toISOString(),
  }));
  const operations = [];
  if (attemptRows.length) operations.push(db.from("learning_attempts").upsert(attemptRows, { onConflict: "account_id,client_event_id", ignoreDuplicates: true }));
  if (sessionRows.length) operations.push(db.from("learning_sessions").upsert(sessionRows, { onConflict: "account_id,client_session_id" }));
  if (reviewRows.length) operations.push(db.from("review_items").upsert(reviewRows, { onConflict: "account_id,question_id" }));
  if (assignmentRows.length) operations.push(db.from("assignment_results").upsert(assignmentRows, { onConflict: "assignment_id,student_id" }));
  const results = await Promise.all(operations);
  const failed = results.find((result) => result.error);
  if (failed?.error) throw failed.error;
  const authoritativeMastery = await recomputeMastery(current, attemptRows.map((row) => row.skill_key));
  return reply(req, {
    ok: true,
    authoritative: true,
    client_mastery_ignored: Array.isArray(payload.mastery) && payload.mastery.length > 0,
    synced: { attempts: attemptRows.length, sessions: sessionRows.length, review: reviewRows.length, assignment_results: assignmentRows.length },
    mastery: authoritativeMastery,
  });
}

async function classEvidence(current: SessionAccount, req: Request, classId: string) {
  if (!(["teacher", "admin"] as Role[]).includes(current.role)) return failure(req, "Teacher or administrator access is required", 403, "forbidden");
  const accessible = await accessibleClassIds(current);
  if (!accessible.includes(classId)) return failure(req, "Class access is not permitted", 403, "forbidden");
  const [{ data: classRow, error: classError }, { data: memberships, error: membershipError }] = await Promise.all([
    db.from("classes").select("id,name,course_key,academic_year,section").eq("id", classId).single(),
    db.from("class_memberships").select("account_id,membership_role").eq("class_id", classId),
  ]);
  if (classError) throw classError;
  if (membershipError) throw membershipError;
  const studentIds = (memberships ?? []).filter((row) => row.membership_role === "student").map((row) => row.account_id);
  const [{ data: students, error: studentError }, { data: mastery, error: masteryError }, { data: definitions, error: definitionError }] = await Promise.all([
    studentIds.length ? db.from("accounts").select("id,display_name,username,grade").in("id", studentIds).order("display_name") : Promise.resolve({ data: [], error: null }),
    studentIds.length ? db.from("mastery_records")
      .select("account_id,skill_key,title,course,unit,topic,score,confidence,attempts,independent_evidence,transfer_evidence,retention_evidence,representation_count,active_days,last_attempt_at,last_verified_at,source,payload")
      .in("account_id", studentIds) : Promise.resolve({ data: [], error: null }),
    db.from("skill_definitions").select("skill_key,title,course,unit,topic,lesson_ids,evidence_rules").eq("active", true),
  ]);
  if (studentError) throw studentError;
  if (masteryError) throw masteryError;
  if (definitionError) throw definitionError;
  const courseKey = normalise(classRow.course_key);
  const actualSkills = new Set((mastery ?? []).map((row) => row.skill_key));
  let skills = (definitions ?? []).filter((row) => normalise(row.course) === courseKey || actualSkills.has(row.skill_key));
  if (!skills.length) skills = (definitions ?? []).filter((row) => actualSkills.has(row.skill_key));
  const averages = new Map<string, { total: number; count: number }>();
  for (const row of mastery ?? []) {
    const value = averages.get(row.skill_key) ?? { total: 0, count: 0 };
    value.total += number(row.score);
    value.count++;
    averages.set(row.skill_key, value);
  }
  skills = skills.map((skill) => {
    const aggregate = averages.get(skill.skill_key);
    return { ...skill, average_score: aggregate ? Math.round(aggregate.total / aggregate.count) : null, evidence_students: aggregate?.count ?? 0 };
  }).sort((a, b) => {
    if (a.average_score == null && b.average_score != null) return 1;
    if (a.average_score != null && b.average_score == null) return -1;
    return number(a.average_score, 101) - number(b.average_score, 101);
  }).slice(0, 8);
  const selected = new Set(skills.map((skill) => skill.skill_key));
  const matrix = (mastery ?? []).filter((row) => selected.has(row.skill_key)).map((row) => ({
    ...row,
    level: masteryLevel(number(row.score), number(row.confidence)),
    has_evidence: number(row.attempts) > 0,
  }));
  const coveredStudents = new Set(matrix.filter((row) => row.has_evidence).map((row) => row.account_id)).size;
  return reply(req, {
    ok: true,
    authoritative: true,
    class: classRow,
    students: students ?? [],
    skills,
    matrix,
    coverage: {
      students_with_evidence: coveredStudents,
      students_total: studentIds.length,
      percent: studentIds.length ? Math.round(coveredStudents / studentIds.length * 100) : 0,
    },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: headers(req) });
  const path = new URL(req.url).pathname.split("/mastery-evidence")[1] || "/";
  try {
    if (path === "/health" && req.method === "GET") return reply(req, { ok: true, service: "echs-mastery-evidence", version: "2.0.0-foundation" });
    const current = await session(req);
    if (!current) return failure(req, "Sign in is required", 401, "unauthenticated");
    if (path === "/sync" && req.method === "POST") return await sync(current, req);
    const classMatch = path.match(/^\/classes\/([0-9a-f-]{36})$/i);
    if (classMatch && req.method === "GET") return await classEvidence(current, req, classMatch[1]);
    return failure(req, "Route not found", 404, "not_found");
  } catch (error) {
    console.error(error);
    return failure(req, error instanceof Error ? error.message : "Unexpected mastery evidence error", 400);
  }
});
