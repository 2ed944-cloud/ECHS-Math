#!/usr/bin/env python3
"""Validate the activated institutional configuration and reuse all Phase 3 gates."""
from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CONFIG = ROOT / "config/institution.json"
errors: list[str] = []


def fail(message: str) -> None:
    errors.append(message)


original_text = CONFIG.read_text(encoding="utf-8")
config = json.loads(original_text)
api_base = str(config.get("api_base", ""))
setup_base = str(config.get("setup_api_base", ""))
endpoint = r"https://[a-z0-9]+\.supabase\.co/functions/v1"

if config.get("enabled") is not True:
    fail("Production institutional sign-in must be enabled")
if config.get("setup_enabled") is not False:
    fail("The one-time setup UI must be disabled after bootstrap")
if config.get("backend_deployed") is not True:
    fail("Production activation requires a deployed backend")
if not re.fullmatch(endpoint, api_base):
    fail("api_base must be a real Supabase Functions endpoint")
if not re.fullmatch(endpoint, setup_base):
    fail("setup_api_base must be a real Supabase Functions endpoint")
if api_base != setup_base:
    fail("Account and setup APIs must target the same Supabase project")
if "YOUR_PROJECT_REF" in original_text:
    fail("Production configuration must not contain a project placeholder")

if not errors:
    fixture = dict(config)
    fixture.update({
        "enabled": False,
        "api_base": "https://YOUR_PROJECT_REF.supabase.co/functions/v1",
        "setup_enabled": True,
    })
    try:
        CONFIG.write_text(json.dumps(fixture, indent=2) + "\n", encoding="utf-8")
        result = subprocess.run(
            [sys.executable, str(ROOT / "tools/validate_institution_platform.py")],
            cwd=ROOT,
            text=True,
            capture_output=True,
        )
        if result.returncode:
            fail("Phase 3 platform invariants failed under the isolated pre-activation fixture:\n" + result.stdout + result.stderr)
    finally:
        CONFIG.write_text(original_text, encoding="utf-8")

print("ECHS production institutional activation validation")
print(f"Errors: {len(errors)}")
for error in errors:
    print(f"  ERROR: {error}")
if errors:
    sys.exit(1)
print("Status: PASS")