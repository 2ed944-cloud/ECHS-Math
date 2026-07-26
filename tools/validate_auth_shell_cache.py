#!/usr/bin/env python3
"""Release gate for authenticated shell cache recovery."""
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
ERRORS: list[str] = []


def read(path: str) -> str:
    file = ROOT / path
    if not file.is_file():
        ERRORS.append(f"Missing required auth-shell file: {path}")
        return ""
    return file.read_text(encoding="utf-8")


sw = read("sw.js")
for marker in [
    'echs-platform-school-control-v3',
    'AUTH_DOCUMENT',
    'school-control',
    'freshAuthDocument',
    'validAuthShell',
    'cache:"reload"',
    'text.length>1500',
    'institutionBody',
    'PURGE_AUTH_SHELL',
    'login-diagnostics',
]:
    if marker not in sw:
        ERRORS.append(f"Service worker missing auth-shell marker: {marker}")

for forbidden_version in [
    'echs-platform-initial-setup-v1',
    'const VERSION = "echs-platform-auth-shell-v2"',
]:
    if forbidden_version in sw:
        ERRORS.append(f"Service worker still uses a superseded cache version: {forbidden_version}")
if 'event.respondWith(staleWhileRevalidate(request));\n    return;\n  }\n  if(request.mode==="navigate")' in sw:
    ERRORS.append("Authenticated navigations must be handled before generic stale caching")

login_html = read("login.html")
for marker in [
    'js/institution-client.js',
    'js/login.js',
]:
    if marker not in login_html:
        ERRORS.append(f"Login page missing required asset marker: {marker}")

login_js = read("js/login.js")
for marker in [
    'AUTH_SHELL_VERSION="20260727-school-control-v1"',
    'echs_auth_shell_cache_version',
    'caches.delete',
    'updateViaCache:"none"',
    'PURGE_AUTH_SHELL',
    'versionedRoleHome',
    'question-bank/school-control.html',
    'searchParams.set("shell",AUTH_SHELL_VERSION)',
]:
    if marker not in login_js:
        ERRORS.append(f"Login client missing auth-shell recovery marker: {marker}")

for forbidden in [
    'SUPABASE_SERVICE_ROLE_KEY',
    'ECHS_BOOTSTRAP_SECRET',
    'password_hash',
    'initial_password',
]:
    if forbidden in login_js or forbidden in login_html:
        ERRORS.append(f"Auth-shell frontend contains forbidden secret marker: {forbidden}")

for path, label in [
    ("question-bank/admin.html", "Legacy admin shell"),
    ("question-bank/school-control.html", "Fresh School Control Center shell"),
]:
    body = read(path)
    for marker in [
        '<!doctype html>',
        'class="institutionBody"',
        'School Control Center',
        'id="accountRows"',
        'js/admin-accounts.js',
    ]:
        if marker not in body:
            ERRORS.append(f"{label} missing structural marker: {marker}")
    if len(body) < 10000:
        ERRORS.append(f"{label} is unexpectedly short and may have been replaced by a placeholder")
    if body.strip().lower() == "admin":
        ERRORS.append(f"{label} is the legacy one-word placeholder")

client = read("js/institution-client.js")
if 'role==="admin"?"question-bank/school-control.html"' not in client:
    ERRORS.append("Institution client does not use the fresh School Control Center as the canonical admin route")

print("ECHS authenticated shell cache recovery validation")
print(f"Errors: {len(ERRORS)}")
for error in ERRORS:
    print(f"  ERROR: {error}")
if ERRORS:
    sys.exit(1)
print("Status: PASS")
