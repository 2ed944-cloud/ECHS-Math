#!/usr/bin/env python3
"""Static release gate for strict course, unit, and lesson practice scopes."""
from __future__ import annotations
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ERRORS: list[str] = []

def read(path: str) -> str:
    target = ROOT / path
    if not target.is_file():
        ERRORS.append(f"Missing required file: {path}")
        return ""
    return target.read_text(encoding="utf-8", errors="replace")

def require(text: str, markers: tuple[str, ...], label: str) -> None:
    for marker in markers:
        if marker not in text:
            ERRORS.append(f"{label} missing marker: {marker}")

def forbid(text: str, markers: tuple[str, ...], label: str) -> None:
    for marker in markers:
        if marker in text:
            ERRORS.append(f"{label} contains forbidden broad mapping: {marker}")

api = read("supabase/functions/practice-bank-api/index.ts")
practice = read("question-bank/js/mapped-practice.js")
isolation = read("question-bank/js/practice-course-isolation.js")
private = read("question-bank/js/mapped-private-bank-practice.js")
single_bank = read("question-bank/js/practice-single-bank.js")
recovery_ui = read("question-bank/js/practice-recovery-ui.js")
recovery_css = read("question-bank/css/practice-recovery-polish.css")
lesson_bridge = read("js/ib-lesson-platform-integration.js")
unit_unlock = read("js/unit-practice-unlock.js")
practice_html = read("question-bank/practice.html")
worker = read("sw.js")
config = read("supabase/config.toml")
deploy = read(".github/workflows/deploy-institution-backend.yml")

require(api, (
    "assignedCourses", "class_memberships", "course_not_assigned", "student_scope_required",
    '.containedBy("course_keys", [course])', 'requestedView === "all"', "practice-bank-api",
    "media_course_mismatch", "targets.length !== 1", "private_bank_practice_inventory", 'query.eq("bank_code", bank)',
), "Strict practice API")
require(practice, (
    "function lessonCompleted", "function unitCompleted", "completedUnits", "strictScopeInPlace",
    "mappingCompatible", 'scope===\"unit\"', "Staff view · includes withheld rows",
    "No unlocked targets yet", "visibility", "function buildTargets", "loadPrivateInventory", "bankCodesForCourse",
), "Mapped practice controller")
require(isolation, (
    "questionCourse", "mappingCompatible", "scopeQuestion", "courseCompatible",
    "practiceCourseIsolation",
), "Course-aware bank isolation")
require(private, (
    'ECHSInstitution.api("practice-bank-api"', 'ECHSInstitution.api("private-bank-api"',
    "protectedCompatibilityRequest", "compatibility_fallback", "protected-compatibility",
    "source?.staff_view_all", "staff_review_only", "rowMappings.length?rowMappings:payloadMappings",
    "dedicated", "requestKey", 'allowAll:scope.view==="all"||fallback',
), "Mapped private-bank adapter")
require(single_bank, ("practiceBankIsolation", "studentPracticeBank", 'option.value==="all"', "ECHSBank.filterQuestions"), "Student single-bank isolation")
require(recovery_ui, ("Protected recovery", "data-retry-practice", "practiceBankTransport", "fixAuthenticatedHeader"), "Practice recovery UI")
require(recovery_css, ("practiceStudio .studioHero h1", "connectionRecovery", "grid-template-columns:minmax(360px,410px)", "transportPill"), "Practice recovery polish")
require(lesson_bridge, ("practice-bank-api", '"1.6":["u1-approximation-error"]', 'scope:"lesson"', "Exact lesson mapping"), "IB lesson bridge")
forbid(lesson_bridge, ('"u1-number"', '"u1-sequences"', '"u1-modeling"'), "IB lesson bridge")
require(unit_unlock, ("unitPracticeUnlock", "eligibleLessons", "Practise the full unit", 'scope:"unit"'), "Unit practice unlock")
require(practice_html, (
    "practice-scope-access.css", "practice-recovery-polish.css", 'id="course"', 'id="bank"', 'id="scope"', 'id="visibility"', "../data/courses.js",
    "practice-course-isolation.js", "mapped-private-bank-practice.js", "mapped-practice.js", "practice-single-bank.js", "routeSteps", "practiceRouteSummary",
    "practice-recovery-ui.js",
), "Practice page")
forbid(practice_html, (
    'src="js/private-bank-practice.js', 'src="js/ib-private-bank-lesson-aliases.js',
    'src="js/ib-exact-lesson-bank-aliases.js', 'src="js/practice.js',
), "Practice page script wiring")
require(worker, (
    "recovery1-calculus-only-practice-routing-redesign", "practice-bank-api", "practice-scope-access",
    "practice-recovery-polish", "unit-practice-unlock", "practice-course-isolation",
    "mapped-private-bank-practice", "mapped-practice", "practice-single-bank", "practice-recovery-ui",
), "Service worker")
require(config, ("[functions.practice-bank-api]", "verify_jwt = false"), "Supabase function registration")
require(deploy, ("practice-bank-api", "supabase functions deploy"), "Backend deployment")

for relative in (
    "question-bank/js/bank.js", "question-bank/js/private-bank-assets.js",
    "question-bank/js/practice-course-isolation.js", "question-bank/js/mapped-private-bank-practice.js",
    "question-bank/js/mapped-practice.js", "question-bank/js/practice-single-bank.js",
    "question-bank/js/practice-builder.js", "question-bank/js/practice-recovery-ui.js",
    "js/ib-lesson-platform-integration.js",
    "js/unit-practice-unlock.js", "js/institution-portal.js", "sw.js",
):
    path = ROOT / relative
    if path.is_file():
        result = subprocess.run(["node", "--check", str(path)], cwd=ROOT, text=True, capture_output=True)
        if result.returncode:
            ERRORS.append(f"JavaScript syntax failure {relative}: {result.stderr.strip()}")

for relative in (
    "tools/test_practice_course_isolation.mjs",
    "tools/test_student_single_bank.mjs",
):
    path = ROOT / relative
    if not path.is_file():
        ERRORS.append(f"Missing runtime regression: {relative}")
        continue
    result = subprocess.run(["node", str(path)], cwd=ROOT, text=True, capture_output=True)
    if result.returncode:
        ERRORS.append(f"Runtime regression failed {relative}: {result.stderr or result.stdout}")

print("Strict mapped practice scope validation")
print(f"Errors: {len(ERRORS)}")
for error in ERRORS:
    print(f"  ERROR: {error}")
if ERRORS:
    sys.exit(1)
print("Status: PASS")
