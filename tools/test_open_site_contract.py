#!/usr/bin/env python3
"""Validate the generated ECHS Mathematics Open release."""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path

ERRORS: list[str] = []


def fail(message: str) -> None:
    ERRORS.append(message)


def read(path: Path) -> str:
    if not path.is_file():
        fail(f"Missing required file: {path}")
        return ""
    return path.read_text(encoding="utf-8", errors="replace")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("root", type=Path)
    args = parser.parse_args()
    root = args.root.resolve()

    required = [
        "index.html", "manifest.json", "sw.js", "open-build.json", ".nojekyll",
        "css/open-platform.css", "js/portal-open.js", "data/courses.js",
        "question-bank/practice.html", "question-bank/mistakes.html",
        "question-bank/exam.html", "question-bank/dashboard.html",
        ".github/workflows/deploy-pages.yml",
    ]
    for relative in required:
        if not (root / relative).exists():
            fail(f"Missing open-release file: {relative}")

    forbidden_paths = [
        "login.html", "setup.html", "learning-library.html", "config", "supabase",
        "question-bank/admin.html", "question-bank/school-control.html",
        "question-bank/student.html", "question-bank/teacher.html", "question-bank/parent.html",
        "question-bank/official/admin",
    ]
    for relative in forbidden_paths:
        if (root / relative).exists():
            fail(f"Account or administration surface leaked into open release: {relative}")

    index = read(root / "index.html")
    for marker in [
        "Open Learning Edition", "No account is required", 'id="courses"',
        "question-bank/practice.html", "question-bank/dashboard.html", "js/portal-open.js",
    ]:
        if marker not in index:
            fail(f"Open landing page missing marker: {marker}")
    for forbidden in [
        "login.html", "Sign in", "School Control Center", "Teaching Command Center",
        "data-auth-content", "data-guest-content", "institution-client.js",
    ]:
        if forbidden in index:
            fail(f"Open landing page contains account marker: {forbidden}")

    practice = read(root / "question-bank/practice.html")
    for marker in ["js/bank.js", "js/practice.js", "Open course access"]:
        if marker not in practice:
            fail(f"Open practice page missing marker: {marker}")

    try:
        metadata = json.loads(read(root / "open-build.json") or "{}")
    except json.JSONDecodeError as exc:
        fail(f"Invalid open-build.json: {exc}")
        metadata = {}
    for key in ["accounts", "roles", "cloud_sync"]:
        if metadata.get(key) is not False:
            fail(f"open-build.json must set {key}=false")
    if metadata.get("progress_storage") != "browser-localStorage":
        fail("Open release must declare browser-localStorage progress")

    try:
        manifest = json.loads(read(root / "manifest.json") or "{}")
    except json.JSONDecodeError as exc:
        fail(f"Invalid manifest.json: {exc}")
        manifest = {}
    if manifest.get("name") != "ECHS Mathematics Open":
        fail("Open manifest has the wrong application name")
    shortcuts = {row.get("url") for row in manifest.get("shortcuts", []) if isinstance(row, dict)}
    if "./login.html" in shortcuts or "./question-bank/teacher.html" in shortcuts:
        fail("Open manifest exposes account shortcuts")

    forbidden_tokens = [
        "data-require-account", "data-echs-learning-guard", "data-echs-lesson-guard",
        "institution-client.js", "portal-access.js", "lesson-access-guard.js",
        "wkqadnfloiohqfnesmyq.supabase.co", "question-bank/school-control.html",
    ]
    scan_extensions = {".html", ".js", ".json"}
    for path in root.rglob("*"):
        if not path.is_file() or path.suffix.lower() not in scan_extensions:
            continue
        text = path.read_text(encoding="utf-8", errors="replace")
        for token in forbidden_tokens:
            if token in text:
                fail(f"Forbidden account/runtime token in {path.relative_to(root)}: {token}")

    lessons = list((root / "lessons").rglob("*.html")) if (root / "lessons").is_dir() else []
    if not lessons:
        fail("Open release contains no lesson pages")

    for relative in ["js/portal-open.js", "sw.js"]:
        path = root / relative
        if path.is_file():
            result = subprocess.run(["node", "--check", str(path)], capture_output=True, text=True)
            if result.returncode:
                fail(f"JavaScript syntax failed in {relative}: {result.stderr.strip()}")

    print("ECHS Mathematics Open release validation")
    print(f"Root: {root}")
    print(f"Lesson pages: {len(lessons)}")
    print(f"Errors: {len(ERRORS)}")
    for error in ERRORS:
        print(f"  ERROR: {error}")
    if ERRORS:
        return 1
    print("Status: PASS")
    return 0


if __name__ == "__main__":
    sys.exit(main())
