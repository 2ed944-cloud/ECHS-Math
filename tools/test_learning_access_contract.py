#!/usr/bin/env python3
"""Regression contract for the authenticated ECHS learning pathway."""
from __future__ import annotations

import argparse
import sys
from pathlib import Path


def read(root: Path, relative: str, errors: list[str]) -> str:
    path = root / relative
    if not path.is_file():
        errors.append(f"Missing required file: {relative}")
        return ""
    return path.read_text(encoding="utf-8", errors="replace")


def require(text: str, markers: list[str], label: str, errors: list[str]) -> None:
    for marker in markers:
        if marker not in text:
            errors.append(f"{label} missing marker: {marker}")


def forbid(text: str, markers: list[str], label: str, errors: list[str]) -> None:
    lower = text.lower()
    for marker in markers:
        if marker.lower() in lower:
            errors.append(f"{label} exposes student-facing term: {marker}")


def validate_source(root: Path, errors: list[str]) -> None:
    index = read(root, "index.html", errors)
    landing = read(root, "css/landing-premium.css", errors)
    portal = read(root, "js/portal.js", errors)
    access = read(root, "js/portal-access.js", errors)
    lesson_guard = read(root, "js/lesson-access-guard.js", errors)
    learning_entry = read(root, "question-bank/index.html", errors)
    practice_shell = read(root, "question-bank/practice.html", errors)
    practice = read(root, "question-bank/js/practice.js", errors)
    bank = read(root, "question-bank/js/bank.js", errors)
    experience = read(root, "js/institution-experience.js", errors)
    worker = read(root, "sw.js", errors)

    require(index, [
        'data-auth-state="loading"',
        "Lessons appear after sign-in.",
        "Assigned learning pathway",
        "js/portal-access.js",
        "css/landing-premium.css",
        "Education City High School",
        "Learn with purpose.",
        "Master with confidence.",
        "Continue to secure sign in",
        "Created and developed by",
        "Mohammad Abu Ghuwaleh",
        "schoolIdentityCard",
        "roleGrid",
        "journeyRail",
    ], "Public landing page", errors)
    forbid(index, ["Pearson", "Blackboard", "publisher questions", "Explore courses"], "Public landing page", errors)
    require(landing, [
        ".premiumLandingHero",
        ".schoolLockup",
        ".identityLogoPlate",
        ".roleGrid",
        ".journeyRail",
        ".creatorSection",
        ".premiumLandingFooter",
        "@media(max-width:680px)",
    ], "Premium landing stylesheet", errors)
    require(access, ['role==="student"', '"/dashboard/student"', "courseKeys", "courseAllowed"], "Access resolver", errors)
    require(portal, ["access.allCourses?ALL_COURSES", "lessonURL(", "Complete each lesson to unlock", "lessonPracticeBtn"], "Learning-path portal", errors)
    require(lesson_guard, ["data-finish-lesson", "Finish lesson & unlock practice", "echs:lesson-completed", "course-not-assigned"], "Lesson guard", errors)
    require(learning_entry, ['data-require-account="student teacher admin parent"', "Opening your workspace", "role-entry.js"], "Learning entry router", errors)
    forbid(learning_entry, ["ALEKS", "IXL", "Pearson", "publisher"], "Learning entry router", errors)
    require(practice_shell, ['data-require-account="student teacher admin"', "Learn → Practise → Master", "ECHS practice bank", "js/portal-access.js"], "Practice shell", errors)
    forbid(practice_shell, ["ALEKS", "IXL", "Pearson", "publisher collection", "textbook"], "Practice shell", errors)
    require(practice, ["access.courseKeys.includes", "unlockedTopics", "lessonLocked", "This course is not assigned", "studentFocused"], "Focused practice controller", errors)
    require(bank, ['PCALRT5S:"AP Precalculus Bank 1"', 'CAF5S:"AP Precalculus Bank 2"', 'CALCT3BC:"AP Calculus Bank 1"', 'ADAMS10:"AP Calculus Bank 2"', "sanitiseCatalog"], "Bank-label adapter", errors)
    require(experience, ["gamification.css", "gamification-overlay.js"], "Student experience loader", errors)
    require(worker, ["learning-access.css", "landing-premium.css", "portal-access.js", "lesson-access-guard.js", "gamification-overlay.js", "pathway2-landing1"], "Service worker", errors)


def validate_artifact(root: Path, errors: list[str]) -> None:
    lesson_root = root / "lessons"
    lessons = sorted(lesson_root.rglob("*.html")) if lesson_root.is_dir() else []
    if not lessons:
        errors.append("Artifact contains no lesson HTML files")
        return
    for path in lessons:
        text = path.read_text(encoding="utf-8", errors="replace")
        relative = str(path.relative_to(root))
        require(text, ['data-echs-lesson-guard="1"', 'name="echs-course"', "echsLessonGateStyle", "js/institution-client.js", "js/portal-access.js", "js/lesson-access-guard.js"], relative, errors)
    for relative in ["question-bank/exam.html", "question-bank/dashboard.html", "question-bank/mistakes.html"]:
        path = root / relative
        if not path.is_file():
            continue
        text = path.read_text(encoding="utf-8", errors="replace")
        require(text, ['data-echs-learning-guard="1"', "data-require-account=", "js/portal-access.js"], relative, errors)


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
    print("ECHS authenticated learning pathway contract")
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
