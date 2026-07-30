#!/usr/bin/env python3
"""Regression checks for native IB lesson chrome and future exact-bank routing."""
from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path

LESSONS = (
    "IB_AI_SL_1.1_standard_form_ECHS.html",
    "IB_AI_SL_1.2_arithmetic_sequences_ECHS.html",
    "IB_AI_SL_1.3_geometric_sequences_ECHS.html",
    "IB_AI_SL_1.4_financial_models_ECHS.html",
    "IB_AI_SL_1.5_logarithms_ECHS.html",
    "IB_AI_SL_1.6_approximation_error_ECHS.html",
    "IB_AI_SL_1.7_loans_annuities_ECHS.html",
    "IB_AI_SL_1.8_technology_equations_ECHS.html",
)


def read(root: Path, relative: str, errors: list[str]) -> str:
    path = root / relative
    if not path.is_file():
        errors.append(f"Missing required file: {relative}")
        return ""
    return path.read_text(encoding="utf-8", errors="replace")


def require(text: str, markers: tuple[str, ...], label: str, errors: list[str]) -> None:
    for marker in markers:
        if marker not in text:
            errors.append(f"{label} missing marker: {marker}")


def forbid(text: str, markers: tuple[str, ...], label: str, errors: list[str]) -> None:
    for marker in markers:
        if marker in text:
            errors.append(f"{label} contains forbidden broad lesson mapping: {marker}")


def run_node(root: Path, relative: str, label: str, errors: list[str]) -> None:
    path = root / relative
    if not path.is_file():
        errors.append(f"Missing {label}: {relative}")
        return
    result = subprocess.run(["node", str(path)], cwd=root, text=True, capture_output=True)
    if result.returncode:
        errors.append(f"{label} failed: {result.stderr or result.stdout}")


def validate_source(root: Path, errors: list[str]) -> None:
    access_css = read(root, "css/learning-access.css", errors)
    ib_css = read(root, "css/ib-lesson-platform-integration.css", errors)
    guard = read(root, "js/lesson-access-guard.js", errors)
    bridge = read(root, "js/ib-lesson-platform-integration.js", errors)
    unit_unlock = read(root, "js/unit-practice-unlock.js", errors)
    global_bridge = read(root, "question-bank/js/practice-global-bridge.js", errors)
    isolation = read(root, "question-bank/js/practice-course-isolation.js", errors)
    private_base = read(root, "question-bank/js/mapped-private-bank-practice.js", errors)
    bank = read(root, "question-bank/js/bank.js", errors)
    practice_controller = read(root, "question-bank/js/mapped-practice.js", errors)
    single_bank = read(root, "question-bank/js/practice-single-bank.js", errors)
    recovery_ui = read(root, "question-bank/js/practice-recovery-ui.js", errors)
    recovery_css = read(root, "question-bank/css/practice-recovery-polish.css", errors)
    practice = read(root, "question-bank/practice.html", errors)
    practice_api = read(root, "supabase/functions/practice-bank-api/index.ts", errors)
    injector = read(root, "tools/inject_learning_access_guard.py", errors)
    worker = read(root, "sw.js", errors)
    engine = read(root, "lessons/ib-math-ai/unit-1/assets/js/engine.js", errors)

    require(access_css, (".echsLessonInlineAccess", ".echsLessonNativeAccess", ".hasEchsLessonAccessBar .topbar", "--echs-access-bar-height"), "Learning access stylesheet", errors)
    require(ib_css, (".platformBankBridge", ".ibBankTabBadge", ".platformBankStatus", "[data-platform-bank-link]"), "IB lesson integration stylesheet", errors)
    require(guard, ("installIntegratedAccess", "nativeActions", "echsLessonInlineAccess", 'dataset.lessonAccessLayout="integrated"', "installFallbackBar", "Finish lesson & unlock practice", "echs:lesson-completed", "course-not-assigned"), "Lesson access guard", errors)
    require(bridge, ("Linked IB question banks", "Open lesson practice", "platformBankBridge", "practice-bank-api", '"1.6":["u1-approximation-error"', '"1.7":["u1-loans-annuities"', '"1.8":["u1-technology-equations"', 'scope:"lesson"', "Exact lesson mapping", "data-platform-bank-link"), "IB lesson platform bridge", errors)
    forbid(bridge, ('"u1-number"', '"u1-sequences"', '"u1-modeling"'), "IB lesson platform bridge", errors)
    require(unit_unlock, ("unitPracticeUnlock", "eligibleLessons", "Practise the full unit", 'scope:"unit"'), "Completed-unit practice access", errors)
    require(global_bridge, ("window.ECHSBank=ECHSBank", "window.ECHSLearning=ECHSLearning", "practiceGlobalBridge", '"ready":"incomplete"'), "Practice lexical-global bridge", errors)
    require(isolation, ("mappingCompatible", "courseCompatible", "scopeQuestion", "practiceCourseIsolation", "selectedBundleFromParams"), "Course isolation layer", errors)
    require(private_base, (
        "row?.course_mappings", "practice-bank-api", "echs:bundle-progress",
        "echs:private-bank-summary", "staff_review_only", "source?.staff_view_all",
        "dedicated", "exactRoute", "scope.bank", "protectedCompatibilityRequest",
        "protected-compatibility", "compatibility_fallback", "return rows",
    ), "Mapped private-bank course browser", errors)
    require(bank, ('row.course_key==="ib-math-ai"', "static_compatibility_blocked", 'dataset.ibStaticCompatibility="blocked"'), "Core static IB compatibility block", errors)
    require(practice_controller, ("unitCompleted", "lessonCompleted", "strictScopeInPlace", "mappingCompatible", "Staff view · includes withheld rows", "function buildTargets", "loadPrivateInventory", "bankCodesForCourse"), "Strict practice controller", errors)
    require(single_bank, ("practiceBankIsolation", "studentPracticeBank", "ECHSBank.filterQuestions"), "Student single-bank isolation", errors)
    require(recovery_ui, ("Protected recovery", "practiceBankTransport", "data-retry-practice", "fixAuthenticatedHeader"), "Practice recovery controller", errors)
    require(recovery_css, ("practiceStudio .studioHero h1", "connectionRecovery", "transportPill"), "Practice recovery stylesheet", errors)
    require(practice_api, ("assignedCourses", "course_not_assigned", "student_scope_required", '.containedBy("course_keys", [course])', "practice-bank-api", "media_course_mismatch"), "Strict practice API", errors)
    require(practice, ("practice-scope-access.css?v=20260730-redesign", "practice-recovery-polish.css?v=20260730-recovery1", "bank.js?v=20260730-calculus-only", "practice-global-bridge.js?v=20260730-redesign", "practice-course-isolation.js?v=20260730-redesign", "mapped-private-bank-practice.js?v=20260730-redesign-recovery1", "mapped-practice.js?v=20260730-redesign", "practice-single-bank.js?v=20260730-redesign", "practice-recovery-ui.js?v=20260730-recovery1", 'id="course"', 'id="bank"', 'id="scope"', 'id="visibility"'), "Focused practice page", errors)
    forbid(practice, ('src="js/private-bank-practice.js', 'src="js/ib-private-bank-lesson-aliases.js', 'src="js/ib-exact-lesson-bank-aliases.js', 'src="js/practice.js'), "Focused practice page", errors)
    bank_index = practice.find('src="js/bank.js')
    global_index = practice.find('src="js/practice-global-bridge.js')
    isolation_index = practice.find('src="js/practice-course-isolation.js')
    private_index = practice.find('src="js/mapped-private-bank-practice.js')
    practice_index = practice.find('src="js/mapped-practice.js')
    single_bank_index = practice.find('src="js/practice-single-bank.js')
    recovery_index = practice.find('src="js/practice-recovery-ui.js')
    if not (0 <= bank_index < global_index < isolation_index < private_index < practice_index < single_bank_index < recovery_index):
        errors.append("Focused practice scripts are not ordered bank → global bridge → isolation → mapped private banks → mapped controller → student bank isolation → recovery UI")
    require(injector, ("ib-lesson-platform-integration.css", "ib-lesson-platform-integration.js", 'resolved_course == "ib-math-ai"', "20260729-iblinks1"), "Pages guard injector", errors)
    require(worker, ("recovery1-calculus-only-practice-routing-redesign", "./css/ib-lesson-platform-integration.css", "./js/ib-lesson-platform-integration.js", "./js/unit-practice-unlock.js", "./question-bank/css/practice-scope-access.css", "./question-bank/css/practice-recovery-polish.css", "./question-bank/js/practice-global-bridge.js", "./question-bank/js/practice-course-isolation.js", "./question-bank/js/mapped-private-bank-practice.js", "./question-bank/js/mapped-practice.js", "./question-bank/js/practice-single-bank.js", "./question-bank/js/practice-recovery-ui.js", "practice-bank-api"), "Service worker", errors)
    require(engine, ("renderPractice()", "routeButtons.forEach", "button.dataset.route"), "IB lesson engine", errors)

    lesson_root = root / "lessons/ib-math-ai/unit-1/lessons"
    for name in LESSONS:
        text = read(root, f"lessons/ib-math-ai/unit-1/lessons/{name}", errors)
        require(text, ('class="topbar"', 'class="header-actions"', 'class="routebar"', 'data-route="practice"', "../assets/js/engine.js"), name, errors)
    old_shell = lesson_root / "lesson.html"
    if old_shell.exists():
        errors.append("Legacy shared IB lesson.html shell must not return")

    run_node(root, "tools/test_practice_global_bridge.mjs", "Practice global-bridge Node regression", errors)
    run_node(root, "tools/test_practice_course_isolation.mjs", "Practice course-isolation Node regression", errors)
    run_node(root, "tools/test_student_single_bank.mjs", "Student single-bank Node regression", errors)

    for relative in (
        "js/lesson-access-guard.js", "js/ib-lesson-platform-integration.js", "js/unit-practice-unlock.js",
        "question-bank/js/bank.js", "question-bank/js/practice-global-bridge.js",
        "question-bank/js/practice-course-isolation.js", "question-bank/js/mapped-private-bank-practice.js",
        "question-bank/js/mapped-practice.js", "question-bank/js/practice-single-bank.js",
        "question-bank/js/practice-recovery-ui.js",
    ):
        result = subprocess.run(["node", "--check", str(root / relative)], cwd=root, text=True, capture_output=True)
        if result.returncode:
            errors.append(f"JavaScript syntax failure {relative}: {result.stderr}")


def validate_artifact(root: Path, errors: list[str]) -> None:
    for name in LESSONS:
        relative = f"lessons/ib-math-ai/unit-1/lessons/{name}"
        text = read(root, relative, errors)
        require(text, ('data-echs-lesson-guard="1"', 'name="echs-course" content="ib-math-ai"', "css/learning-access.css?v=20260729-iblinks1", "css/ib-lesson-platform-integration.css?v=20260729-iblinks1", "js/lesson-access-guard.js?v=20260729-iblinks1", "js/ib-lesson-platform-integration.js?v=20260729-iblinks1"), relative, errors)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("root", type=Path)
    parser.add_argument("--artifact", action="store_true")
    args = parser.parse_args()
    root = args.root.resolve()
    errors: list[str] = []
    validate_source(root, errors)
    if args.artifact:
        validate_artifact(root, errors)
    print("ECHS IB lesson platform integration")
    print(f"Root: {root}")
    print(f"Artifact checks: {'enabled' if args.artifact else 'disabled'}")
    print(f"Errors: {len(errors)}")
    for error in errors:
        print(f"  ERROR: {error}")
    if errors:
        return 1
    print("Status: PASS")
    return 0


if __name__ == "__main__":
    sys.exit(main())
