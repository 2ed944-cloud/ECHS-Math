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
    'echs-platform-auth-shell-v2',
    'AUTH_DOCUMENT',
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

if 'echs-platform-initial-setup-v1' in sw:
    ERRORS.append("Service worker still uses the initial-setup cache version")
if 'event.respondWith(staleWhileRevalidate(request));\n    return;\n  }\n  if(request.mode==="navigate")' in sw:
    ERRORS.append("Authenticated navigations must be handled before generic stale caching")

login_html = read("login.html")
for marker in [
    '20260727-auth-shell-v2',
    'js/institution-client.js?v=20260727-auth-shell-v2',
    'js/login.js?v=20260727-auth-shell-v2',
]:
    if marker not in login_html:
        ERRORS.append(f"Login page missing cache-busting marker: {marker}")

login_js = read("js/login.js")
for marker in [
    'AUTH_SHELL_VERSION="20260727-auth-shell-v2"',
    'echs_auth_shell_cache_version',
    'caches.delete',
    'updateViaCache:"none"',
    'PURGE_AUTH_SHELL',
    'versionedRoleHome',
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

admin_html = read("question-bank/admin.html")
for marker in [
    '<!doctype html>',
    'class="institutionBody"',
    'School Control Center',
    'id="accountRows"',
    'js/admin-accounts.js',
]:
    if marker not in admin_html:
        ERRORS.append(f"Admin shell missing structural marker: {marker}")
if len(admin_html) < 10000:
    ERRORS.append("Admin shell is unexpectedly short and may have been replaced by a placeholder")

print("ECHS authenticated shell cache recovery validation")
print(f"Errors: {len(ERRORS)}")
for error in ERRORS:
    print(f"  ERROR: {error}")
if ERRORS:
    sys.exit(1)
print("Status: PASS")
