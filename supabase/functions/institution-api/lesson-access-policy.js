export function canonicalCourseKey(value) {
  const key = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const aliases = {
    "ap-calculus-ab": "ap-calculus",
    "ap-calculus-bc": "ap-calculus",
    "g12-ap-calculus-ab": "ap-calculus",
    "ap-precalculus-g10-g11": "ap-precalculus",
    "g11-ib-ai": "ib-math-ai",
    "ib-mathematics-ai": "ib-math-ai",
    "g9-pre-precalculus": "grade-9",
    "grade-9-pre-precalculus": "grade-9",
    "g10-algebra2-ap-readiness": "algebra-2",
    "algebra-2-concepts": "algebra-2",
  };
  if (aliases[key]) return aliases[key];
  if (key.includes("precalculus")) return "ap-precalculus";
  if (key.includes("calculus")) return "ap-calculus";
  if (key.includes("algebra-2") || key.includes("algebra2")) return "algebra-2";
  if ((key.includes("ib") && key.includes("math")) || key === "g11-ib-ai") return "ib-math-ai";
  if (key.includes("grade-9") || key.includes("pre-precalculus")) return "grade-9";
  return key;
}

export function lessonAccessKey(courseKey, unitIndex, topic) {
  return `${canonicalCourseKey(courseKey)}::${Number(unitIndex)}::${String(topic || "").trim()}`;
}

export function decideLessonVisibility({
  ready = true,
  overrideState = "auto",
  position = 0,
  previousLessonComplete = false,
  previousPracticeComplete = false,
} = {}) {
  if (!ready) return { allowed: false, reason: "not_ready" };
  if (overrideState === "hidden") return { allowed: false, reason: "hidden_by_staff" };
  if (overrideState === "shown") return { allowed: true, reason: "shown_by_staff" };
  if (Number(position) < 2) return { allowed: true, reason: "initial_lesson" };
  if (previousLessonComplete && previousPracticeComplete) {
    return { allowed: true, reason: "progression_unlocked" };
  }
  return {
    allowed: false,
    reason: previousLessonComplete ? "previous_practice_required" : "previous_lesson_required",
  };
}

export function anyClassAllows(decisions) {
  return Array.isArray(decisions) && decisions.some((decision) => decision?.allowed === true);
}
