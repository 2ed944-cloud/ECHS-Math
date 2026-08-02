#!/usr/bin/env python3
"""Static security, integration and release validation for ECHS Phase 3."""
from __future__ import annotations
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ERRORS: list[str] = []


def fail(message: str) -> None:
    ERRORS.append(message)


def text(path: str) -> str:
    file = ROOT / path
    if not file.is_file():
        fail(f"Missing required file: {path}")
        return ""
    return file.read_text(encoding="utf-8")


REQUIRED = [
    "login.html",
    "css/institution.css",
    "css/institution-polish.css",
    "js/institution-client.js",
    "js/institution-portal.js",
    "js/login.js",
    "question-bank/admin.html",
    "question-bank/student.html",
    "question-bank/teacher.html",
    "question-bank/parent.html",
    "question-bank/js/admin-accounts.js",
    "question-bank/js/student-cloud.js",
    "question-bank/js/teacher-cloud.js",
    "question-bank/js/parent-cloud.js",
    "question-bank/js/institution-timetable.js",
    "question-bank/css/institution-timetable.css",
    "config/institution.json",
    "config/institution.example.json",
    "templates/echs-account-import-template.csv",
    "supabase/config.toml",
    "supabase/migrations/202607260001_institutional_platform.sql",
    "supabase/migrations/202608020002_assignment_routes_and_timetables.sql",
    "supabase/functions/account-api/index.ts",
    "supabase/functions/institution-api/index.ts",
    "supabase/functions/learning-sync/index.ts",
    ".github/workflows/institution-platform.yml",
    ".github/workflows/deploy-institution-backend.yml",
    "tools/bootstrap_institution.py",
    "platform/PHASE_3_INSTITUTIONAL_ACCOUNTS.md",
]

for item in REQUIRED:
    text(item)

# The interface can be reviewed before an external backend exists, but must not claim
# that accounts are active until the real project has been deployed and bootstrapped.
config = json.loads(text("config/institution.json") or "{}")
if config.get("enabled") is not False:
    fail("config/institution.json must remain disabled until backend bootstrap completes")
if "YOUR_PROJECT_REF" not in str(config.get("api_base")):
    fail("Disabled institutional config must retain the project-ref placeholder")

migration = text("supabase/migrations/202607260001_institutional_platform.sql")
for marker in [
    "create table if not exists private.account_credentials",
    "password_hash text not null",
    "crypt(p_password, gen_salt('bf', 12))",
    "failed_attempts + 1 >= 5",
    "interval '10 minutes'",
    "students_can_change_passwords', false",
    "alter table public.accounts enable row level security",
    "revoke all on all tables in schema public from anon, authenticated",
    "create or replace function public.api_reset_password",
    "update private.sessions set revoked_at = now()",
    "create table if not exists public.account_audit_log",
]:
    if marker not in migration:
        fail(f"Institutional migration missing security marker: {marker}")
if re.search(r"^\s*password\s+text", migration, re.I | re.M):
    fail("A plaintext password table column was detected")
if "api_change_password" in migration:
    fail("Student password-change RPC must not exist")
if "create extension if not exists citext" in migration.lower():
    fail("The institutional schema should not depend on an unnecessary citext extension")

account_api = text("supabase/functions/account-api/index.ts")
for marker in [
    "/accounts/import",
    "/reset-password",
    "api_verify_login",
    "api_create_session",
    "x-bootstrap-secret",
    "generatePassword",
    "initial_password",
    "teachers_can_view_all_accounts",
]:
    if marker not in account_api:
        fail(f"Account API missing: {marker}")
for forbidden in ["signUp(", "/change-password", "current_password"]:
    if forbidden.lower() in account_api.lower():
        fail(f"Account API contains forbidden self-registration/password feature: {forbidden}")

sync_api = text("supabase/functions/learning-sync/index.ts")
for marker in [
    "row.questionId",
    "row.assignmentId",
    "assignment_results",
    "account_id,client_event_id",
    "Student sign-in is required",
]:
    if marker not in sync_api:
        fail(f"Learning sync missing integration marker: {marker}")

client = text("js/institution-client.js")
for marker in [
    "learning-sync",
    "requireAuth",
    "roleHome",
    "echs:learning-attempt",
    "Institutional accounts are not configured yet",
    "institution-polish.css",
    "mountTimetableModule",
]:
    if marker not in client:
        fail(f"Institution client missing: {marker}")

page_requirements = {
    "login.html": [
        "loginForm",
        "username",
        "password",
        "Public self-registration and Google sign-in are disabled",
    ],
    "question-bank/admin.html": ["accountRows", "createDialog", "importDialog", "passwordDialog"],
    "question-bank/student.html": ["masteryMeter", "topicsMeter", "goalMeter", "timeMeter", "assignmentList"],
    "question-bank/teacher.html": ["classSelector", "studentRows", "assignmentDialog", "resetDialog", "importDialog", "teacherTimetable", "assignmentBanks", "assignmentTargets"],
    "question-bank/parent.html": ["childSelector", "parentMasteryMeter", "familyAssignments", "familyPlan"],
}
for path, markers in page_requirements.items():
    body = text(path)
    for marker in markers:
        if marker not in body:
            fail(f"{path} missing required interface marker: {marker}")

# All private account and role pages need a restrictive browser content policy.
for path in [
    "login.html",
    "question-bank/admin.html",
    "question-bank/student.html",
    "question-bank/teacher.html",
    "question-bank/parent.html",
]:
    body = text(path)
    for marker in [
        "Content-Security-Policy",
        "default-src 'self'",
        "connect-src 'self' https://*.supabase.co",
        "script-src 'self'",
        "object-src 'none'",
        "base-uri 'self'",
    ]:
        if marker not in body:
            fail(f"{path} is missing CSP marker: {marker}")

login = text("login.html").lower()
if "google" not in login or "disabled" not in login:
    fail("Login page must state that Google/public registration is disabled")
if re.search(r"href=[\"'][^\"']*(?:register|sign-up|signup)", login):
    fail("Public login page must not expose a self-registration link")
login_controller = text("js/login.js")
for marker in ["candidate.origin!==location.origin", "candidate.pathname.startsWith(platformRoot.pathname)"]:
    if marker not in login_controller:
        fail(f"Login redirect validation is missing: {marker}")

account_controller = text("question-bank/js/admin-accounts.js")
for marker in [
    'requireAuth(["admin","teacher"])',
    'const mayReset=row=>isAdmin()||row.role==="student"',
    'if(!isAdmin())return',
    'if(!mayCreate())',
]:
    if marker not in account_controller:
        fail(f"Teacher account-directory permissions are missing: {marker}")

csv_header = text("templates/echs-account-import-template.csv").splitlines()[0].split(",")
for column in [
    "display_name",
    "email",
    "username",
    "password",
    "role",
    "grade",
    "external_id",
    "class_name",
    "student_username",
]:
    if column not in csv_header:
        fail(f"CSV template missing {column}")

manifest = json.loads(text("manifest.json") or "{}")
urls = {row.get("url") for row in manifest.get("shortcuts", [])}
for url in [
    "./login.html",
    "./question-bank/student.html",
    "./question-bank/dashboard.html",
    "./question-bank/teacher.html",
]:
    if url not in urls:
        fail(f"PWA manifest missing shortcut {url}")

worker = text("sw.js")
for asset in [
    "./login.html",
    "./css/institution.css",
    "./css/institution-polish.css",
    "./question-bank/admin.html",
    "./question-bank/student.html",
    "./question-bank/css/institution-timetable.css",
    "./question-bank/js/institution-timetable.js",
]:
    if asset not in worker:
        fail(f"Service worker missing institutional shell asset {asset}")
if "privateApi" not in worker or "event.respondWith(fetch(request))" not in worker:
    fail("Service worker must bypass caches for institutional API responses")
for service in ["account-api", "institution-api", "learning-sync"]:
    if service not in worker:
        fail(f"Service worker private API bypass missing {service}")

timetable_migration = text("supabase/migrations/202608020002_assignment_routes_and_timetables.sql")
for marker in ["create table if not exists public.timetable_entries", "timetable_teacher_slot", "alter table public.timetable_entries enable row level security", "api_replace_timetable", "security definer"]:
    if marker not in timetable_migration:
        fail(f"Timetable migration missing: {marker}")
institution_api = text("supabase/functions/institution-api/index.ts")
for marker in ["listTimetable", "replaceTimetable", 'requireRole(session, ["admin"])', 'path === "/timetable"', 'req.method === "PUT"']:
    if marker not in institution_api:
        fail(f"Institution API timetable permission or route missing: {marker}")
timetable_client = text("question-bank/js/institution-timetable.js")
for marker in ["My mathematics timetable", "Only administrators can edit", 'method: "PUT"', "teacher_id", "class_id"]:
    if marker not in timetable_client:
        fail(f"Timetable client missing: {marker}")

teacher_assignment = text("question-bank/js/teacher-cloud.js")
for marker in ["selectedAssignmentBanks", "selectedAssignmentTargets", "selectedAssignmentRoutes", "banks,", "targets,", "routes,", "assignmentDistribution"]:
    if marker not in teacher_assignment:
        fail(f"Multi-route assignment studio missing: {marker}")
mapped_practice = text("question-bank/js/mapped-practice.js")
for marker in ["assignmentRoutes", "loadAssignmentRouteSet", "balancedAssignmentSample", "assignmentMultiBank", "Teacher-selected banks"]:
    if marker not in mapped_practice:
        fail(f"Multi-route student practice missing: {marker}")

robots = text("robots.txt")
for route in [
    "/login.html",
    "/question-bank/admin.html",
    "/question-bank/student.html",
    "/question-bank/teacher.html",
    "/question-bank/parent.html",
]:
    if f"Disallow: {route}" not in robots:
        fail(f"robots.txt missing private route {route}")

gitignore = text(".gitignore")
for marker in [".env", "supabase/.temp/", ".supabase/"]:
    if marker not in gitignore:
        fail(f".gitignore does not protect {marker}")

deploy = text(".github/workflows/deploy-institution-backend.yml")
for marker in [
    "workflow_dispatch",
    "institutional-production",
    "SUPABASE_ACCESS_TOKEN",
    "SUPABASE_PROJECT_REF",
    "SUPABASE_DB_PASSWORD",
    "ECHS_BOOTSTRAP_SECRET",
    "supabase db push",
    "supabase functions deploy",
]:
    if marker not in deploy:
        fail(f"Backend deployment workflow missing: {marker}")
if re.search(r"on:\s*\n\s*push:", deploy):
    fail("Institutional backend deployment must remain manual until production approval")

js_files = [
    "js/institution-client.js",
    "js/institution-portal.js",
    "js/login.js",
    "question-bank/js/admin-accounts.js",
    "question-bank/js/student-cloud.js",
    "question-bank/js/teacher-cloud.js",
    "question-bank/js/parent-cloud.js",
]
for relative in js_files:
    result = subprocess.run(["node", "--check", str(ROOT / relative)], capture_output=True, text=True)
    if result.returncode:
        fail(f"JavaScript syntax failed in {relative}: {result.stderr.strip()}")

print("ECHS Phase 3 institutional platform validation")
print(f"Errors: {len(ERRORS)}")
for error in ERRORS:
    print(f"  ERROR: {error}")
if ERRORS:
    sys.exit(1)
print("Status: PASS")
