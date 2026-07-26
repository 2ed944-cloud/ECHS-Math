#!/usr/bin/env python3
"""Validate the exact static artifact before and after GitHub Pages deployment."""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path


def fail(errors: list[str], message: str) -> None:
    errors.append(message)


def read(root: Path, relative: str, errors: list[str]) -> str:
    path = root / relative
    if not path.is_file():
        fail(errors, f"Missing Pages artifact file: {relative}")
        return ""
    try:
        return path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        fail(errors, f"Pages artifact file is not UTF-8 text: {relative}")
        return ""


def validate(root: Path, expected_sha: str) -> list[str]:
    errors: list[str] = []

    if not (root / ".nojekyll").is_file():
        fail(errors, "Pages artifact must include .nojekyll")

    deployment_text = read(root, "deployment.json", errors)
    try:
        deployment = json.loads(deployment_text or "{}")
    except json.JSONDecodeError as exc:
        fail(errors, f"deployment.json is invalid JSON: {exc}")
        deployment = {}
    if deployment.get("sha") != expected_sha:
        fail(errors, f"deployment.json SHA does not match artifact revision {expected_sha}")

    admin = read(root, "question-bank/admin.html", errors)
    admin_markers = [
        "<!doctype html",
        "School Control Center",
        "institutionBody",
        "accountRows",
        "createDialog",
        "importDialog",
        "admin-accounts.js",
    ]
    if len(admin.encode("utf-8")) <= 12000:
        fail(errors, "Administrator shell is unexpectedly short")
    if admin.strip().lower() == "admin":
        fail(errors, "Administrator shell is the legacy one-word placeholder")
    for marker in admin_markers:
        if marker.lower() not in admin.lower():
            fail(errors, f"Administrator shell missing marker: {marker}")

    role_pages = {
        "question-bank/teacher.html": ["Teaching Command Center", "studentRows", "teacher-cloud.js"],
        "question-bank/student.html": ["My Learning Journey", "masteryMeter", "student-cloud.js"],
        "question-bank/parent.html": ["Family Progress Center", "parentMasteryMeter", "parent-cloud.js"],
    }
    for relative, markers in role_pages.items():
        body = read(root, relative, errors)
        if len(body.encode("utf-8")) <= 5000:
            fail(errors, f"Role shell is unexpectedly short: {relative}")
        for marker in markers:
            if marker not in body:
                fail(errors, f"{relative} missing marker: {marker}")

    login = read(root, "login.html", errors)
    for marker in [
        "Welcome back",
        "loginForm",
        "20260727-auth-shell-v2",
        "js/institution-client.js",
        "js/login.js",
    ]:
        if marker not in login:
            fail(errors, f"Login shell missing marker: {marker}")

    worker = read(root, "sw.js", errors)
    for marker in [
        "echs-platform-auth-shell-v2",
        "AUTH_DOCUMENT",
        "validAuthShell",
        "freshAuthDocument",
        "privateApi",
        "PURGE_AUTH_SHELL",
        'cache:"no-store"',
    ]:
        if marker not in worker:
            fail(errors, f"Service worker missing deployment marker: {marker}")

    client = read(root, "js/institution-client.js", errors)
    for marker in [
        "requestError",
        "requireAuth",
        "institutionAuthUnavailable",
        "error?.status===401",
        "echs:institution-auth-error",
    ]:
        if marker not in client:
            fail(errors, f"Institution client missing marker: {marker}")

    return errors


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("root", type=Path)
    parser.add_argument("--expected-sha", required=True)
    args = parser.parse_args()

    errors = validate(args.root.resolve(), args.expected_sha)
    print("ECHS deterministic GitHub Pages artifact validation")
    print(f"Root: {args.root}")
    print(f"Expected SHA: {args.expected_sha}")
    print(f"Errors: {len(errors)}")
    for error in errors:
        print(f"  ERROR: {error}")
    if errors:
        return 1
    print("Status: PASS")
    return 0


if __name__ == "__main__":
    sys.exit(main())
