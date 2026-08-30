import assert from "node:assert/strict";
import {
  anyClassAllows,
  canonicalCourseKey,
  decideLessonVisibility,
  lessonAccessKey,
} from "../supabase/functions/institution-api/lesson-access-policy.js";

assert.equal(canonicalCourseKey("G12 AP Calculus AB"), "ap-calculus");
assert.equal(canonicalCourseKey("g11-ib-ai"), "ib-math-ai");
assert.equal(canonicalCourseKey("g9-pre-precalculus"), "grade-9");
assert.equal(lessonAccessKey("ap-calculus-ab", 0, "1.1"), "ap-calculus::0::1.1");

for (const position of [0, 1]) {
  assert.deepEqual(decideLessonVisibility({ position }), {
    allowed: true,
    reason: "initial_lesson",
  });
}
assert.equal(decideLessonVisibility({ position: 2 }).allowed, false);
assert.equal(
  decideLessonVisibility({ position: 2, previousLessonComplete: true }).reason,
  "previous_practice_required",
);
assert.deepEqual(
  decideLessonVisibility({
    position: 2,
    previousLessonComplete: true,
    previousPracticeComplete: true,
  }),
  { allowed: true, reason: "progression_unlocked" },
);
assert.deepEqual(
  decideLessonVisibility({
    position: 0,
    overrideState: "hidden",
    previousLessonComplete: true,
    previousPracticeComplete: true,
  }),
  { allowed: false, reason: "hidden_by_staff" },
);
assert.deepEqual(
  decideLessonVisibility({ position: 99, overrideState: "shown" }),
  { allowed: true, reason: "shown_by_staff" },
);
assert.equal(anyClassAllows([{ allowed: false }, { allowed: true }]), true);
assert.equal(anyClassAllows([{ allowed: false }, { allowed: false }]), false);

console.log("Lesson visibility progression policy: PASS");
