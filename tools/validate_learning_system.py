#!/usr/bin/env python3
"""Validate the ECHS Phase 2 local-first learning system."""
from __future__ import annotations
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
ERRORS=[]

def fail(message): ERRORS.append(message)

REQUIRED=[
"question-bank/index.html","question-bank/practice.html","question-bank/exam.html","question-bank/dashboard.html",
"question-bank/mistakes.html","question-bank/teacher.html","question-bank/parent.html",
"question-bank/css/learning-system.css","question-bank/js/learning-system.js","question-bank/js/sync-adapter.js",
"question-bank/js/learning-home.js","question-bank/js/practice.js","question-bank/js/exam.js","question-bank/js/dashboard.js",
"question-bank/js/mistakes.js","question-bank/js/teacher.js","question-bank/js/parent.js",
"js/lesson-learning-bridge.js","tools/test_learning_system.mjs"
]
PAGE_IDS={
"question-bank/dashboard.html":["dailyPlan","masteryRows","achievementGrid","profileDialog"],
"question-bank/mistakes.html":["reviewList","viewFilter","startReview"],
"question-bank/teacher.html":["classList","classOverview","assignmentList","classDialog","assignmentDialog"],
"question-bank/parent.html":["parentMetrics","strengthList","weakList","familyPlan"],
"question-bank/practice.html":["mode","group","bundle","start","shell"],
"question-bank/exam.html":["group","bundle","start","exam"]
}
SCRIPT_MARKERS={
"question-bank/js/learning-system.js":["recordAttempt","selectAdaptive","dailyPlan","exportStudentReport","migrateLegacyAttempts"],
"question-bank/js/practice.js":["modeCopy","persistContinue","selectAdaptive","Mistake Bank"],
"question-bank/js/teacher.js":["assignmentLink","importReports","exportWorkspace"],
"question-bank/js/parent.js":["planItems","exportStudentReport"],
}

def validate_files():
    for relative in REQUIRED:
        if not (ROOT/relative).is_file(): fail(f"Missing required Phase 2 file: {relative}")

def validate_ids():
    for relative,ids in PAGE_IDS.items():
        path=ROOT/relative
        if not path.is_file(): continue
        text=path.read_text(encoding="utf-8")
        for value in ids:
            if not re.search(rf'\bid=["\']{re.escape(value)}["\']',text): fail(f"{relative} is missing id={value}")
        if "learning-system.js" not in text: fail(f"{relative} does not load learning-system.js")
        if "learning-system.css" not in text: fail(f"{relative} does not load learning-system.css")

def validate_markers():
    for relative,markers in SCRIPT_MARKERS.items():
        path=ROOT/relative
        if not path.is_file(): continue
        text=path.read_text(encoding="utf-8")
        for marker in markers:
            if marker not in text: fail(f"{relative} is missing expected marker: {marker}")

def validate_manifest_and_worker():
    manifest=json.loads((ROOT/"manifest.json").read_text(encoding="utf-8"))
    shortcut_urls={row.get("url") for row in manifest.get("shortcuts",[])}
    for url in ("./question-bank/dashboard.html","./question-bank/practice.html?mode=adaptive","./question-bank/mistakes.html"):
        if url not in shortcut_urls: fail(f"manifest.json is missing Phase 2 shortcut {url}")
    worker=(ROOT/"sw.js").read_text(encoding="utf-8")
    for relative in ("question-bank/dashboard.html","question-bank/mistakes.html","question-bank/teacher.html","question-bank/parent.html","question-bank/js/learning-system.js"):
        if f'"./{relative}"' not in worker: fail(f"sw.js does not pre-cache {relative}")

def validate_source_boundary():
    official=ROOT/"question-bank/official"
    if not official.is_dir(): fail("Official AP directory is missing")
    for page in ("question-bank/practice.html","question-bank/exam.html","question-bank/index.html"):
        text=(ROOT/page).read_text(encoding="utf-8")
        if "Official AP" not in text: fail(f"{page} does not preserve the Official AP boundary")

def check_javascript():
    scripts=[
      "question-bank/js/learning-system.js","question-bank/js/sync-adapter.js","question-bank/js/bank.js",
      "question-bank/js/learning-home.js","question-bank/js/practice.js","question-bank/js/exam.js",
      "question-bank/js/dashboard.js","question-bank/js/mistakes.js","question-bank/js/teacher.js",
      "question-bank/js/parent.js","js/platform-foundation.js","js/lesson-learning-bridge.js","sw.js"
    ]
    for relative in scripts:
        result=subprocess.run(["node","--check",str(ROOT/relative)],capture_output=True,text=True)
        if result.returncode: fail(f"JavaScript syntax failed for {relative}: {result.stderr.strip()}")

def run_engine_test():
    result=subprocess.run(["node","tools/test_learning_system.mjs"],cwd=ROOT,capture_output=True,text=True)
    if result.returncode: fail(f"Learning engine smoke test failed: {result.stdout}\n{result.stderr}")

def main():
    validate_files();validate_ids();validate_markers();validate_manifest_and_worker();validate_source_boundary();check_javascript();run_engine_test()
    print("ECHS Phase 2 learning-system validation")
    print(f"Errors: {len(ERRORS)}")
    for item in ERRORS: print(f"  ERROR: {item}")
    if ERRORS:return 1
    print("Status: PASS")
    return 0
if __name__=="__main__":sys.exit(main())