#!/usr/bin/env python3
"""Regression checks for native IB lesson chrome and uploaded private-bank routing."""
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


def validate_source(root: Path, errors: list[str]) -> None:
    access_css = read(root, "css/learning-access.css", errors)
    ib_css = read(root, "css/ib-lesson-platform-integration.css", errors)
    guard = read(root, "js/lesson-access-guard.js", errors)
    bridge = read(root, "js/ib-lesson-platform-integration.js", errors)
    aliases = read(root, "question-bank/js/ib-private-bank-lesson-aliases.js", errors)
    practice = read(root, "question-bank/practice.html", errors)
    injector = read(root, "tools/inject_learning_access_guard.py", errors)
    worker = read(root, "sw.js", errors)
    engine = read(root, "lessons/ib-math-ai/unit-1/assets/js/engine.js", errors)

    require(access_css, (
        ".echsLessonInlineAccess",
        ".echsLessonNativeAccess",
        ".hasEchsLessonAccessBar .topbar",
        "--echs-access-bar-height",
    ), "Learning access stylesheet", errors)
    require(ib_css, (
        ".platformBankBridge",
        ".ibBankTabBadge",
        ".platformBankStatus",
        "[data-platform-bank-link]",
    ), "IB lesson integration stylesheet", errors)
    require(guard, (
        "installIntegratedAccess",
        "nativeActions",
        "echsLessonInlineAccess",
        'dataset.lessonAccessLayout="integrated"',
        "installFallbackBar",
        "Finish lesson & unlock practice",
        "echs:lesson-completed",
        "course-not-assigned",
    ), "Lesson access guard", errors)
    require(bridge, (
        "Linked IB question banks",
        "Open linked IB banks",
        "platformBankBridge",
        "/student-questions?",
        '"1.6":["u1-number"',
        '"1.7":["u1-sequences"',
        '"1.8":["u1-algebra","u1-matrices"',
        "u1-modeling",
        "data-platform-bank-link",
    ), "IB lesson platform bridge", errors)
    require(aliases, (
        "IB Mathematics AI Bank 1",
        "IB Mathematics AI Bank 10",
        '"1.1":["u1-number"',
        '"1.6":["u1-number"',
        '"1.7":["u1-sequences"',
        '"1.8":["u1-algebra","u1-matrices"',
        "classification.ap_topic=requestedLesson",
        "classification.ib_lesson=requestedLesson",
        "ECHSBank.loadBundle=async",
        "source_content_fingerprint",
        "u1-modeling",
    ), "IB private-bank alias layer", errors)
    require(practice, (
        "private-bank-practice.js?v=20260729-iblinks1",
        "ib-private-bank-lesson-aliases.js?v=20260729-iblinks1",
        "practice.js?v=20260729-iblinks1",
    ), "Focused practice page", errors)
    private_index = practice.find('src="js/private-bank-practice.js')
    alias_index = practice.find('src="js/ib-private-bank-lesson-aliases.js')
    practice_index = practice.find('src="js/practice.js?v=20260729-iblinks1')
    if not (0 <= private_index < alias_index < practice_index):
        errors.append("Focused practice scripts are not ordered private base → IB aliases → practice controller")
    require(injector, (
        "ib-lesson-platform-integration.css",
        "ib-lesson-platform-integration.js",
        'resolved_course == "ib-math-ai"',
        "20260729-iblinks1",
    ), "Pages guard injector", errors)
    require(worker, (
        "iblinks1",
        "./css/ib-lesson-platform-integration.css",
        "./js/ib-lesson-platform-integration.js",
        "./question-bank/js/ib-private-bank-lesson-aliases.js",
        "ib-private-bank-lesson-aliases",
    ), "Service worker", errors)
    require(engine, (
        "renderPractice()",
        "routeButtons.forEach",
        "button.dataset.route",
    ), "IB lesson engine", errors)

    lesson_root = root / "lessons/ib-math-ai/unit-1/lessons"
    for name in LESSONS:
        text = read(root, f"lessons/ib-math-ai/unit-1/lessons/{name}", errors)
        require(text, (
            'class="topbar"',
            'class="header-actions"',
            'class="routebar"',
            'data-route="practice"',
            "../assets/js/engine.js",
        ), name, errors)
    old_shell = lesson_root / "lesson.html"
    if old_shell.exists():
        errors.append("Legacy shared IB lesson.html shell must not return")

    node_test = root / "tools/test_ib_private_bank_lesson_aliases.mjs"
    if not node_test.is_file():
        errors.append("Missing IB private-bank alias Node regression")
    else:
        result = subprocess.run(["node", str(node_test)], cwd=root, text=True, capture_output=True)
        if result.returncode:
            errors.append(f"IB private-bank alias Node regression failed: {result.stderr or result.stdout}")

    for relative in (
        "js/lesson-access-guard.js",
        "js/ib-lesson-platform-integration.js",
        "question-bank/js/ib-private-bank-lesson-aliases.js",
    ):
        result = subprocess.run(["node", "--check", str(root / relative)], cwd=root, text=True, capture_output=True)
        if result.returncode:
            errors.append(f"JavaScript syntax failure {relative}: {result.stderr}")


def validate_artifact(root: Path, errors: list[str]) -> None:
    for name in LESSONS:
        relative = f"lessons/ib-math-ai/unit-1/lessons/{name}"
        text = read(root, relative, errors)
        require(text, (
            'data-echs-lesson-guard="1"',
            'name="echs-course" content="ib-math-ai"',
            "css/learning-access.css?v=20260729-iblinks1",
            "css/ib-lesson-platform-integration.css?v=20260729-iblinks1",
            "js/lesson-access-guard.js?v=20260729-iblinks1",
            "js/ib-lesson-platform-integration.js?v=20260729-iblinks1",
        ), relative, errors)


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
