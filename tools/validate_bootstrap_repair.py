#!/usr/bin/env python3
"""Release gate for the repaired one-time bootstrap transaction."""
from pathlib import Path
import sys

root = Path(__file__).resolve().parents[1]
errors: list[str] = []


def require(path: str) -> str:
    file = root / path
    if not file.is_file():
        errors.append(f"Missing required file: {path}")
        return ""
    return file.read_text(encoding="utf-8")


migration = require("supabase/migrations/202607260002_bootstrap_function_repair.sql")
for marker in [
    "pg_advisory_xact_lock",
    "existing_account.role = 'admin'",
    "created_account.role",
    "private.account_credentials",
    "crypt(p_password, gen_salt('bf', 12))",
    "revoke all on function public.api_bootstrap_admin",
    "grant execute on function public.api_bootstrap_admin",
    "to service_role",
]:
    if marker not in migration:
        errors.append(f"Bootstrap repair migration missing marker: {marker}")

if "where role = 'admin'" in migration:
    errors.append("Bootstrap repair must not use the ambiguous unqualified role column")

if "password_hash text" in migration or "initial_password" in migration:
    errors.append("Bootstrap repair must not add readable password storage")

workflow = require(".github/workflows/deploy-institution-backend.yml")
for marker in [
    "supabase db push --linked",
    "Verify deployed bootstrap secret",
    "setup-api/verify-secret",
]:
    if marker not in workflow:
        errors.append(f"Deployment workflow missing marker: {marker}")

setup_api = require("supabase/functions/setup-api/index.ts")
for marker in ["api_bootstrap_admin", "setup_locked", "passwordStrong"]:
    if marker not in setup_api:
        errors.append(f"Setup API missing integration marker: {marker}")

print("ECHS bootstrap transaction repair validation")
print(f"Errors: {len(errors)}")
for error in errors:
    print(f"  ERROR: {error}")
if errors:
    sys.exit(1)
print("Status: PASS")
