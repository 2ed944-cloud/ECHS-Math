#!/usr/bin/env python3
"""Static release gate for the ECHS Phase 4 premium role experiences."""
from __future__ import annotations
import json
import subprocess
import sys
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
ERRORS=[]
def fail(message): ERRORS.append(message)
def read(path):
    file=ROOT/path
    if not file.is_file(): fail(f"Missing required premium file: {path}"); return ""
    return file.read_text(encoding="utf-8")

required=[
 "css/institution-premium.css","js/institution-experience.js","login.html",
 "question-bank/student.html","question-bank/teacher.html","question-bank/parent.html","question-bank/admin.html",
 "question-bank/js/student-cloud.js","question-bank/js/teacher-cloud.js","question-bank/js/parent-cloud.js","question-bank/js/admin-accounts.js",
 "platform/PHASE_4_PREMIUM_EXPERIENCE.md","sw.js"
]
for path in required: read(path)

page_markers={
 "question-bank/student.html":["My Learning Journey","missionProgress","weeklyActivity","journeyUnits","achievementList","masteryMeter","topicsMeter","goalMeter","timeMeter","assignmentList"],
 "question-bank/teacher.html":["Teaching Command Center","classReadinessRing","attentionList","classPulseBars","studentRows","supportList","distributionChart","classHeatmap","assignmentDialog","resetDialog","importDialog"],
 "question-bank/parent.html":["Family Progress Center","familyProgressRing","familyNarrativeScore","familyWeeklyActivity","parentMasteryMeter","familyAssignments","familyPlan"],
 "question-bank/admin.html":["School Control Center","schoolHealthRing","roleMix","recentAccountActivity","securityChecks","accountRows","createDialog","importDialog","passwordDialog"],
 "login.html":["A complete learning journey","Public self-registration and Google sign-in are disabled","Student preview","Teacher preview","Family preview","Admin preview"]
}
for path,markers in page_markers.items():
    body=read(path)
    for marker in markers:
        if marker not in body: fail(f"{path} missing premium marker: {marker}")
    if "Content-Security-Policy" not in body: fail(f"{path} missing Content Security Policy")
    if "institution-premium.css" not in body: fail(f"{path} does not load premium CSS")

css=read("css/institution-premium.css")
for marker in [".experienceHero",".missionRing",".premiumMetrics",".premiumGrid",".journeyMap",".weekBars",".planTimeline","@media(prefers-reduced-motion:reduce)"]:
    if marker not in css: fail(f"Premium CSS missing {marker}")

client=read("js/institution-experience.js")
for marker in ["showPreview","renderWeekBars","setRing","bindTheme","ECHSExperience"]:
    if marker not in client: fail(f"Premium experience helper missing {marker}")

scripts=["js/institution-experience.js","js/login.js","question-bank/js/student-cloud.js","question-bank/js/teacher-cloud.js","question-bank/js/parent-cloud.js","question-bank/js/admin-accounts.js","sw.js"]
for path in scripts:
    result=subprocess.run(["node","--check",str(ROOT/path)],capture_output=True,text=True)
    if result.returncode: fail(f"JavaScript syntax failed in {path}: {result.stderr.strip()}")

for path in ["question-bank/js/student-cloud.js","question-bank/js/teacher-cloud.js","question-bank/js/parent-cloud.js","question-bank/js/admin-accounts.js"]:
    body=read(path)
    if "unconfigured" not in body or "showPreview" not in body: fail(f"{path} must provide an honest unconfigured preview mode")

admin_js=read("question-bank/js/admin-accounts.js")
for marker in ["canStatus","canReset","row.role===\"student\"","current?.role===\"admin\""]:
    if marker not in admin_js: fail(f"Restricted account UI missing permission marker: {marker}")

worker=read("sw.js")
for asset in ["./css/institution-premium.css","./js/institution-experience.js","./question-bank/student.html","./question-bank/teacher.html","./question-bank/parent.html","./question-bank/admin.html"]:
    if asset not in worker: fail(f"Service worker missing premium asset {asset}")
if "learning-sync" not in worker or "event.respondWith(fetch(request))" not in worker: fail("Private institutional APIs must bypass caches")

config=json.loads(read("config/institution.json") or "{}")
if config.get("enabled") is not False: fail("Institutional configuration must remain disabled until approved backend activation")

print("ECHS Phase 4 premium experience validation")
print(f"Errors: {len(ERRORS)}")
for error in ERRORS: print(f"  ERROR: {error}")
if ERRORS: sys.exit(1)
print("Status: PASS")
