#!/usr/bin/env python3
"""Inject authenticated-learning guards into the exact GitHub Pages artifact.

The repository keeps canonical lesson/source files unchanged. This build step adds
presentation-layer account gates to deployed lesson and learning pages.
"""
from __future__ import annotations

import argparse
import os
import re
import sys
from pathlib import Path

LESSON_MARKER = 'data-echs-lesson-guard="1"'
PAGE_MARKER = 'data-echs-learning-guard="1"'


def rel_url(root: Path, parent: Path, relative: str) -> str:
    prefix = Path(os.path.relpath(root, parent)).as_posix()
    return f"{prefix}/{relative}" if prefix != "." else relative


def course_key(path: Path) -> str:
    token = path.as_posix().lower()
    if "ap-precalculus" in token:
        return "ap-precalculus"
    if "ap-calculus" in token:
        return "ap-calculus"
    if "algebra-2" in token or "algebra2" in token:
        return "algebra-2"
    if "ib-math" in token or "ib-mathematics" in token:
        return "ib-math-ai"
    if "grade-9" in token or "pre-precalculus" in token:
        return "grade-9"
    return "unassigned"


def insert_before(text: str, closing: str, addition: str) -> str:
    index = text.lower().rfind(closing.lower())
    if index < 0:
        raise ValueError(f"Missing {closing}")
    return text[:index] + addition + text[index:]


def inject_lesson(root: Path, path: Path) -> bool:
    text = path.read_text(encoding="utf-8")
    if LESSON_MARKER in text:
        return False
    prefix_css = rel_url(root, path.parent, "css/learning-access.css")
    institution = rel_url(root, path.parent, "js/institution-client.js")
    access = rel_url(root, path.parent, "js/portal-access.js")
    guard = rel_url(root, path.parent, "js/lesson-access-guard.js")
    head = (
        f'\n  <meta name="echs-course" content="{course_key(path)}" {LESSON_MARKER}>\n'
        '  <meta name="robots" content="noindex,nofollow">\n'
        f'  <link rel="stylesheet" href="{prefix_css}?v=20260727-pathway">\n'
        '  <style id="echsLessonGateStyle">html:not([data-lesson-gate="allowed"]) body{visibility:hidden!important}</style>\n'
    )
    scripts = (
        f'\n<script src="{institution}?v=20260727-pathway"></script>'
        f'<script src="{access}?v=20260727-pathway"></script>'
        f'<script src="{guard}?v=20260727-pathway"></script>\n'
    )
    text = insert_before(text, "</head>", head)
    text = insert_before(text, "</body>", scripts)
    path.write_text(text, encoding="utf-8")
    return True


def page_roles(path: Path) -> str | None:
    token = path.as_posix().lower()
    name = path.name.lower()
    if any(part in token for part in ("/question-bank/teacher/", "/question-bank/official/admin/")):
        return "teacher admin"
    if name in {"student.html", "teacher.html", "parent.html", "admin.html", "school-control.html"}:
        return None
    if "/question-bank/official/" in token:
        return "student teacher admin"
    if token.endswith("/question-bank/index.html"):
        return "student teacher admin parent"
    if name in {"practice.html", "exam.html", "dashboard.html", "mistakes.html", "review.html"} and "/question-bank/" in token:
        return "student teacher admin"
    return None


def inject_learning_page(root: Path, path: Path, roles: str) -> bool:
    text = path.read_text(encoding="utf-8")
    if PAGE_MARKER in text or LESSON_MARKER in text:
        return False
    if "data-require-account=" in text and "portal-access.js" in text:
        return False
    css = rel_url(root, path.parent, "css/learning-access.css")
    institution = rel_url(root, path.parent, "js/institution-client.js")
    access = rel_url(root, path.parent, "js/portal-access.js")
    text, count = re.subn(
        r"<body\b([^>]*)>",
        lambda match: f'<body{match.group(1)} data-require-account="{roles}" {PAGE_MARKER}>',
        text,
        count=1,
        flags=re.IGNORECASE,
    )
    if count != 1:
        raise ValueError("Missing <body>")
    head = (
        '\n  <meta name="robots" content="noindex,nofollow">\n'
        f'  <link rel="stylesheet" href="{css}?v=20260727-pathway">\n'
    )
    scripts = (
        f'\n<script src="{institution}?v=20260727-pathway"></script>'
        f'<script src="{access}?v=20260727-pathway"></script>\n'
    )
    text = insert_before(text, "</head>", head)
    text = insert_before(text, "</body>", scripts)
    path.write_text(text, encoding="utf-8")
    return True


def run(root: Path) -> tuple[int, int, list[str]]:
    lesson_count = 0
    page_count = 0
    errors: list[str] = []
    lessons = root / "lessons"
    if lessons.is_dir():
        for path in sorted(lessons.rglob("*.html")):
            try:
                lesson_count += int(inject_lesson(root, path))
            except Exception as exc:
                errors.append(f"{path.relative_to(root)}: {exc}")
    question_bank = root / "question-bank"
    if question_bank.is_dir():
        for path in sorted(question_bank.rglob("*.html")):
            roles = page_roles(path)
            if not roles:
                continue
            try:
                page_count += int(inject_learning_page(root, path, roles))
            except Exception as exc:
                errors.append(f"{path.relative_to(root)}: {exc}")
    return lesson_count, page_count, errors


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("root", type=Path)
    args = parser.parse_args()
    root = args.root.resolve()
    lessons, pages, errors = run(root)
    print("ECHS authenticated learning guard injection")
    print(f"Root: {root}")
    print(f"Lesson pages guarded: {lessons}")
    print(f"Learning pages guarded: {pages}")
    for error in errors:
        print(f"ERROR: {error}")
    if errors:
        return 1
    if not (root / "lessons").is_dir() or lessons == 0:
        print("ERROR: no lesson pages were guarded")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
