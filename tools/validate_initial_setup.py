#!/usr/bin/env python3
"""Static release gate for the ECHS one-time institutional setup wizard."""
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


def read(path: str) -> str:
    file = ROOT / path
    if not file.is_file():
        fail(f"Missing required initial-setup file: {path}")
        return ""
    return file.read_text(encoding="utf-8")


required = [
    "setup.html",
    "css/institution-setup.css",
    "js/institution-setup.js",
    "config/institution.json",
    "config/institution.example.json",
    "supabase/config.toml",
    "supabase/functions/setup-api/index.ts",
    ".github/workflows/deploy-institution-backend.yml",
    "robots.txt",
    "sw.js",
    "platform/PHASE_5_INITIAL_SETUP.md",
]
for path in required:
    read(path)

config = json.loads(read("config/institution.json") or "{}")
if config.get("enabled") is not False:
    fail("Live sign-in must remain disabled until the first administrator is created")
if config.get("setup_enabled") is not True:
    fail("Initial setup must be explicitly enabled")
if config.get("backend_deployed") is not True:
    fail("The setup release must record that the backend was deployed")
setup_base = str(config.get("setup_api_base", ""))
if not re.fullmatch(r"https://[a-z0-9]+\.supabase\.co/functions/v1", setup_base):
    fail("setup_api_base must point to a deployed Supabase functions endpoint")
if "YOUR_PROJECT_REF" not in str(config.get("api_base", "")):
    fail("Live api_base must remain a placeholder until the activation release")
if config.get("setup_path") != "setup.html":
    fail("setup_path must point to setup.html")

example = json.loads(read("config/institution.example.json") or "{}")
if "YOUR_PROJECT_REF" not in str(example.get("setup_api_base", "")):
    fail("The example setup endpoint must retain its placeholder")

page = read("setup.html")
for marker in [
    "setupWizard",
    "organizationName",
    "organizationSlug",
    "adminName",
    "adminUsername",
    "adminPassword",
    "bootstrapSecret",
    "confirmPermanent",
    "setupSuccess",
    "setupLocked",
    "institution-setup.css",
    "institution-setup.js",
    "noindex,nofollow,noarchive",
    "frame-ancestors 'none'",
    "connect-src 'self' https://wkqadnfloiohqfnesmyq.supabase.co",
]:
    if marker not in page:
        fail(f"Setup page missing required marker: {marker}")
if "<script>" in page.lower():
    fail("Setup page must not contain inline executable scripts")

client = read("js/institution-setup.js")
for marker in [
    "setup_api_base",
    "/setup-api",
    "x-bootstrap-secret",
    "crypto.getRandomValues",
    "beforeunload",
    "setup_complete",
    "Preview mode cannot create",
    'cache:"no-store"',
]:
    if marker not in client:
        fail(f"Setup client missing security/integration marker: {marker}")
for forbidden in [
    "localStorage",
    "sessionStorage",
    "console.log",
    "document.cookie",
    "bootstrap_secret=",
]:
    if forbidden in client:
        fail(f"Setup client contains forbidden persistence or disclosure pattern: {forbidden}")

api = read("supabase/functions/setup-api/index.ts")
for marker in [
    "originAllowed",
    "secretsEqual",
    "bootstrapComplete",
    'route === "/status"',
    'route === "/bootstrap"',
    "api_bootstrap_admin",
    "x-bootstrap-secret",
    "cache-control",
    "no-store",
    "setup_locked",
]:
    if marker not in api:
        fail(f"Setup Edge Function missing marker: {marker}")
for forbidden in [
    "console.log",
    "password_hash:",
    "initial_password",
    "localStorage",
]:
    if forbidden in api:
        fail(f"Setup Edge Function contains forbidden pattern: {forbidden}")

supabase_config = read("supabase/config.toml")
if "[functions.setup-api]" not in supabase_config or "verify_jwt = false" not in supabase_config:
    fail("Supabase config must register setup-api with custom bootstrap authentication")

deploy = read(".github/workflows/deploy-institution-backend.yml")
for marker in [
    "setup-api/health",
    "supabase functions deploy",
    "ECHS_BOOTSTRAP_SECRET",
    "institutional-production",
]:
    if marker not in deploy:
        fail(f"Deployment workflow missing setup marker: {marker}")

worker = read("sw.js")
if "setup-api" not in worker:
    fail("Service worker must bypass the private setup API")
if "setupPage" not in worker or 'cache:"no-store"' not in worker:
    fail("Service worker must bypass caches for setup.html")
if '"./setup.html"' in worker:
    fail("setup.html must not be pre-cached in the application shell")

robots = read("robots.txt")
if "Disallow: /setup.html" not in robots:
    fail("robots.txt must exclude the one-time setup page")

login = read("js/login.js")
for marker in ["setup_api_base", "setup-api/status", "Open Initial Setup"]:
    if marker not in login:
        fail(f"Login setup guidance missing: {marker}")

for relative in ["js/institution-setup.js", "js/login.js", "sw.js"]:
    result = subprocess.run(
        ["node", "--check", str(ROOT / relative)],
        capture_output=True,
        text=True,
    )
    if result.returncode:
        fail(f"JavaScript syntax failed in {relative}: {result.stderr.strip()}")

print("ECHS initial setup wizard validation")
print(f"Errors: {len(ERRORS)}")
for error in ERRORS:
    print(f"  ERROR: {error}")
if ERRORS:
    sys.exit(1)
print("Status: PASS")
