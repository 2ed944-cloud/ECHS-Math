#!/usr/bin/env python3
from pathlib import Path
import subprocess
import sys

root = Path(sys.argv[1] if len(sys.argv) > 1 else ".").resolve()
errors: list[str] = []


def require(relative: str, markers: tuple[str, ...]) -> None:
    path = root / relative
    if not path.is_file():
        errors.append(f"Missing {relative}")
        return
    text = path.read_text(encoding="utf-8", errors="replace")
    for marker in markers:
        if marker not in text:
            errors.append(f"{relative} missing {marker}")


require("supabase/migrations/202608300001_lesson_visibility_progression.sql", (
    "public.lesson_catalog", "public.lesson_access_overrides", "public.lesson_completions",
    "state in ('shown', 'hidden')", "Seed the current ready-lesson catalog",
    "ap-calculus::0::0", "ap-calculus::0::1.1", "ap-calculus::0::1.2",
))
require("supabase/functions/institution-api/lesson-access-policy.js", (
    'overrideState === "hidden"', 'overrideState === "shown"', "Number(position) < 2",
    "previousLessonComplete && previousPracticeComplete",
))
require("supabase/functions/institution-api/index.ts", (
    'path === "/lesson-access"', 'path === "/lesson-access/check"',
    "/lesson-access/catalog", "lessonAccessMatch", "lesson_access_updated",
    "studentLessonDecisions", "previousPracticeComplete",
))
require("supabase/functions/learning-sync/index.ts", (
    "lessonRows", 'db.from("lesson_completions")', "lessons:lessonRows.length",
))
require("js/portal.js", (
    "lessonAccessByCourse", "visible_lesson_keys", "loadStudentLessonAccess",
    "syncLearning", "lessonVisible", "accessKey",
))
require("js/lesson-access-guard.js", (
    '"/lesson-access/check"', "decision.allowed", "accessKey",
))
require("question-bank/js/mapped-practice.js", (
    "requestedAccessKey", '"/lesson-access/check"', "This lesson is not available yet",
))
require("question-bank/teacher.html", (
    'id="lessonAccessSection"', 'id="lessonAccessList"', 'id="lessonAccessSearch"',
))
require("question-bank/js/teacher-cloud.js", (
    "renderLessonAccess", "Show to students", "Hide from students",
    "Automatic · progress unlock", "/lesson-access`",
))

node = subprocess.run(
    ["node", "tools/test_lesson_visibility_progression.mjs"],
    cwd=root, text=True, capture_output=True,
)
if node.returncode:
    errors.append(node.stderr or node.stdout or "Lesson policy Node test failed")

print("ECHS lesson visibility contract")
print(f"Root: {root}")
print(f"Errors: {len(errors)}")
for error in errors:
    print(f"  ERROR: {error}")
if errors:
    raise SystemExit(1)
print("Status: PASS")
