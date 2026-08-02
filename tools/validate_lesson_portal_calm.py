#!/usr/bin/env python3
"""Regression gate for the lesson-first Lesson Portal workspace."""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
ERRORS: list[str] = []


def read(path: str) -> str:
    file = ROOT / path
    if not file.is_file():
        ERRORS.append(f"Missing Lesson Portal file: {path}")
        return ""
    return file.read_text(encoding="utf-8")


portal = read("js/portal.js")
drawer = read("js/lesson-portal-overhaul.js")
styles = read("css/lesson-portal-overhaul.css")
route_styles = read("css/smart-learning-route.css")
index = read("index.html")
preview = read("preview.html")
visual = read("tools/capture_phase1_preview.mjs")
worker = read("sw.js")

requirements = [
    (portal, "portal renderer", ["courseTabList", "courseSelect", "lessonCardOpen", "lessonPayload", "What you will learn", "data-course-title", "completedCount"]),
    (drawer, "lesson drawer", ["lessonPortalCalm", 'classList.add("lessonWorkspace")', "lessonDetailDialog", "showModal()", "history.pushState", "popstate", "aria-haspopup"]),
    (styles, "calm portal styles", ['data-auth-state="signed-in"', ".lessonPortalHero", ".portalUtilityStrip", "grid-template-columns:repeat(3", ".lessonCardOpen", "dialog.lessonDetailDialog", ".lessonDrawerSurface", "@media(max-width:680px)", "@media(prefers-reduced-motion:reduce)"]),
    (route_styles, "compact Smart Route", ["#smartRoute-lessons", ".slrEvidence", ".slrDecisionCopy", ".slrAction.primary"]),
    (index, "lesson portal page", ["20260802-calm1", "lesson-portal-overhaul.css", "lesson-portal-overhaul.js"]),
    (preview, "lesson portal preview", ["20260802-calm1", "data-preview-fallback"]),
    (visual, "visual QA", ["lesson-portal", "lessonPortal:true", "firstLessonTop", "lessonDetailDialog", "lessonDrawerScreenshot"]),
    (worker, "service worker", ["lesson-portal-calm1", "./css/lesson-portal-overhaul.css", "./js/lesson-portal-overhaul.js"]),
]

for body, label, markers in requirements:
    for marker in markers:
        if marker not in body:
            ERRORS.append(f"{label} missing marker: {marker}")

for path in [
    "js/portal.js",
    "js/lesson-portal-overhaul.js",
    "js/smart-learning-route.js",
    "js/institution-client.js",
    "tools/capture_phase1_preview.mjs",
    "sw.js",
]:
    result = subprocess.run(["node", "--check", str(ROOT / path)], capture_output=True, text=True)
    if result.returncode:
        ERRORS.append(f"JavaScript syntax failed in {path}: {result.stderr.strip()}")

print("ECHS calm Lesson Portal validation")
print(f"Errors: {len(ERRORS)}")
for error in ERRORS:
    print(f"  ERROR: {error}")
if ERRORS:
    sys.exit(1)
print("Status: PASS")
