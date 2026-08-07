#!/usr/bin/env python3
"""Validate the exact static artifact before and after GitHub Pages deployment."""
from __future__ import annotations

import argparse
import json
import re
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


def validate_control_shell(body: str, label: str, errors: list[str], runtime_marker: str) -> None:
    markers = [
        "<!doctype html",
        "School Control Center",
        "institutionBody",
        "accountRows",
        "createDialog",
        "importDialog",
        runtime_marker,
    ]
    if len(body.encode("utf-8")) <= 12000:
        fail(errors, f"{label} is unexpectedly short")
    if body.strip().lower() == "admin":
        fail(errors, f"{label} is the legacy one-word placeholder")
    for marker in markers:
        if marker.lower() not in body.lower():
            fail(errors, f"{label} missing marker: {marker}")


def validate(root: Path, expected_sha: str) -> list[str]:
    errors: list[str] = []
    token = expected_sha[:12]

    if not re.fullmatch(r"[0-9a-f]{40}", expected_sha):
        fail(errors, "Expected SHA must be a full lowercase 40-character Git SHA")

    if not (root / ".nojekyll").is_file():
        fail(errors, "Pages artifact must include .nojekyll")

    development_only = [
        ".github",
        "tools",
        "supabase",
        "cloudflare-ai-worker",
        "integration",
        "reviews",
        "question-bank/official/tools",
        "question-bank/official/reports",
        "question-bank/official/admin/reports",
        "question-bank/official/admin/tools",
        "question-bank/prac.html",
    ]
    for relative in development_only:
        if (root / relative).exists():
            fail(errors, f"Pages artifact includes development-only path: {relative}")

    deployment_text = read(root, "deployment.json", errors)
    try:
        deployment = json.loads(deployment_text or "{}")
    except json.JSONDecodeError as exc:
        fail(errors, f"deployment.json is invalid JSON: {exc}")
        deployment = {}
    if deployment.get("sha") != expected_sha:
        fail(errors, f"deployment.json SHA does not match artifact revision {expected_sha}")

    manifest_text = read(root, "school-control-assets.json", errors)
    try:
        manifest = json.loads(manifest_text or "{}")
    except json.JSONDecodeError as exc:
        fail(errors, f"school-control-assets.json is invalid JSON: {exc}")
        manifest = {}
    expected_runtime = f"question-bank/js/school-control.{token}.js"
    if manifest.get("sha") != expected_sha:
        fail(errors, "School Control Center asset manifest SHA mismatch")
    if manifest.get("token") != token:
        fail(errors, "School Control Center asset manifest token mismatch")
    if manifest.get("runtime") != expected_runtime:
        fail(errors, "School Control Center runtime path mismatch")

    admin = read(root, "question-bank/admin.html", errors)
    control = read(root, "question-bank/school-control.html", errors)
    validate_control_shell(admin, "Legacy administrator shell", errors, "admin-accounts.js")
    validate_control_shell(control, "Fingerprint-protected School Control Center shell", errors, f"school-control.{token}.js")

    expected_refs = [
        f"../css/institution.{token}.css",
        f"../css/institution-premium.{token}.css",
        f"../js/institution-client.{token}.js",
        f"../js/institution-experience.{token}.js",
        f"js/school-control.{token}.js",
        'href="school-control.html"',
    ]
    for marker in expected_refs:
        if marker not in control:
            fail(errors, f"School Control Center shell missing fingerprinted reference: {marker}")
    for forbidden in [
        "js/admin-accounts.js?v=",
        "../js/institution-client.js?v=",
        "../js/institution-experience.js?v=",
        "../css/institution.css?v=",
        "../css/institution-premium.css?v=",
        'href="admin.html"',
    ]:
        if forbidden in control:
            fail(errors, f"School Control Center shell retains legacy cacheable reference: {forbidden}")

    fingerprinted_files = [
        f"js/institution-client.{token}.js",
        f"js/institution-experience.{token}.js",
        f"js/institution-completion.{token}.js",
        f"css/institution.{token}.css",
        f"css/institution-polish.{token}.css",
        f"css/institution-premium.{token}.css",
        f"css/institution-responsive.{token}.css",
        f"css/institution-completion.{token}.css",
        expected_runtime,
    ]
    for relative in fingerprinted_files:
        if not (root / relative).is_file():
            fail(errors, f"Missing fingerprinted School Control Center asset: {relative}")

    runtime = read(root, expected_runtime, errors)
    for marker in [
        'requireAuth(["admin","teacher"])',
        "accountRows",
        "createDialog",
        "importDialog",
        "ECHSInstitution.api",
    ]:
        if marker not in runtime:
            fail(errors, f"Fingerprint-protected runtime missing marker: {marker}")
    for forbidden in ["document.body.textContent", "document.write", "location.href=\"admin\""]:
        if forbidden in runtime:
            fail(errors, f"Fingerprint-protected runtime contains destructive marker: {forbidden}")

    fingerprinted_client = read(root, f"js/institution-client.{token}.js", errors)
    if f"css/institution-polish.{token}.css" not in fingerprinted_client:
        fail(errors, "Fingerprint-protected client does not load the fingerprinted polish stylesheet")

    fingerprinted_experience = read(root, f"js/institution-experience.{token}.js", errors)
    for marker in [
        f"css/institution-responsive.{token}.css",
        f"css/institution-completion.{token}.css",
        f"js/institution-completion.{token}.js",
    ]:
        if marker not in fingerprinted_experience:
            fail(errors, f"Fingerprint-protected experience layer missing marker: {marker}")

    # Validate role pages using stable shell attributes/IDs rather than visible headings.
    role_pages = {
        "question-bank/teacher.html": ['data-premium-page="teacher"', "studentRows", "teacher-cloud.js"],
        "question-bank/student.html": ['data-premium-page="student"', "masteryMeter", "student-cloud.js"],
        "question-bank/parent.html": ['data-premium-page="parent"', "parentMasteryMeter", "parent-cloud.js"],
    }
    for relative, markers in role_pages.items():
        body = read(root, relative, errors)
        if len(body.encode("utf-8")) <= 5000:
            fail(errors, f"Role shell is unexpectedly short: {relative}")
        for marker in markers:
            if marker not in body:
                fail(errors, f"{relative} missing marker: {marker}")

    login = read(root, "login.html", errors)
    for marker in ["Welcome back", "loginForm", "js/institution-client.js", "js/login.js"]:
        if marker not in login:
            fail(errors, f"Login shell missing marker: {marker}")

    login_controller = read(root, "js/login.js", errors)
    for marker in [
        "20260727-school-control-v1",
        "question-bank/school-control.html",
        "role===\"admin\"",
        r"question-bank\/admin\.html",
    ]:
        if marker not in login_controller:
            fail(errors, f"Login controller missing fresh administrator-route marker: {marker}")

    worker = read(root, "sw.js", errors)
    for marker in [
        "echs-platform-school-control-v3",
        "AUTH_DOCUMENT",
        "school-control",
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
        'role==="admin"?"question-bank/school-control.html"',
    ]:
        if marker not in client:
            fail(errors, f"Institution client missing marker: {marker}")

    robots = read(root, "robots.txt", errors)
    if "Disallow: /question-bank/school-control.html" not in robots:
        fail(errors, "robots.txt must exclude the School Control Center route")

    return errors


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("root", type=Path)
    parser.add_argument("--expected-sha", required=True)
    args = parser.parse_args()

    errors = validate(args.root.resolve(), args.expected_sha.strip().lower())
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
