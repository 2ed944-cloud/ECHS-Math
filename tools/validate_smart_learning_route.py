#!/usr/bin/env python3
"""Release gate for the deterministic ECHS Smart Learning Route."""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
ERRORS: list[str] = []


def read(path: str) -> str:
    file = ROOT / path
    if not file.is_file():
        ERRORS.append(f"Missing Smart Learning Route file: {path}")
        return ""
    return file.read_text(encoding="utf-8")


route = read("js/smart-learning-route.js")
styles = read("css/smart-learning-route.css")
client = read("js/institution-client.js")
portal = read("js/portal.js")
teacher = read("question-bank/js/teacher-cloud.js")
admin = read("question-bank/js/admin-accounts.js")
worker = read("sw.js")
access_model = read("platform/ACCESS_MODEL.md")

for marker in [
    'if (![' + '"lessons", "teacher", "admin"' + '].includes(page)) return;',
    'reviews >= 3',
    'mistakes >= 5',
    'prerequisiteScore < 55',
    'accuracy < 60',
    'targetScore >= 85',
    'accuracy >= 75',
    'reviews === 0',
    'mistakes <= 1',
    'count: 6',
    'count: 8',
    'count: 10',
    'courseLessons',
    'Verified evidence only',
    'Trusted mastery gate',
    'data-slr-assignment',
    'assignmentSelectionMode',
]:
    if marker not in route:
        ERRORS.append(f"Smart route rule or UI marker missing: {marker}")

for marker in [
    ".slrDecision",
    ".slrEvidenceGrid",
    ".slrLanes",
    ".slrOpsGrid",
    "@media(max-width:720px)",
    "@media(prefers-reduced-motion:reduce)",
    "@media print",
]:
    if marker not in styles:
        ERRORS.append(f"Smart route responsive/design marker missing: {marker}")

for body, name, markers in [
    (client, "institution client", ["mountSmartLearningRoute", "smart-learning-route.css", "smart-learning-route.js"]),
    (portal, "lesson portal", ["ECHSPortalRouteContext", "echs:smart-route-context"]),
    (teacher, "teacher page", ["ECHSTeacherRouteContext", "echs:smart-route-context"]),
    (admin, "admin page", ["ECHSAdminRouteContext", "echs:smart-route-context"]),
    (worker, "service worker", ["./css/smart-learning-route.css", "./js/smart-learning-route.js"]),
    (access_model, "access model", ["does not use a chatbot", "Support", "Core", "Challenge", "server-trusted evidence"]),
]:
    for marker in markers:
        if marker not in body:
            ERRORS.append(f"{name} missing Smart Learning Route marker: {marker}")

for forbidden in [
    "api.openai.com",
    "api.anthropic.com",
    "generativelanguage.googleapis.com",
    "chat/completions",
    "responses.create",
    "new WebSocket(",
]:
    if forbidden.lower() in route.lower():
        ERRORS.append(f"Smart route contains forbidden paid/chat service marker: {forbidden}")

for script in [
    "js/smart-learning-route.js",
    "js/institution-client.js",
    "js/portal.js",
    "question-bank/js/teacher-cloud.js",
    "question-bank/js/admin-accounts.js",
    "sw.js",
]:
    result = subprocess.run(
        ["node", "--check", str(ROOT / script)],
        capture_output=True,
        text=True,
    )
    if result.returncode:
        ERRORS.append(f"JavaScript syntax failed in {script}: {result.stderr.strip()}")

print("ECHS Smart Learning Route validation")
print("Mode: deterministic rules / no chatbot / no paid AI API")
print(f"Errors: {len(ERRORS)}")
for error in ERRORS:
    print(f"  ERROR: {error}")
if ERRORS:
    sys.exit(1)
print("Status: PASS")
