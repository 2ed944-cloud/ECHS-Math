#!/usr/bin/env python3
"""Release gate for the production institutional login repair."""
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
ERRORS: list[str] = []


def read(path: str) -> str:
    file = ROOT / path
    if not file.is_file():
        ERRORS.append(f"Missing required login repair file: {path}")
        return ""
    return file.read_text(encoding="utf-8")


migration = read("supabase/migrations/202607260003_login_authentication_repair.sql")
for marker in [
    "create or replace function public.api_verify_login",
    "credential_row.account_id = v_account.id",
    "credential_row.failed_attempts + 1",
    "account_row.id = v_account.id",
    "create or replace function public.api_login_self_test",
    "Incorrect-9!Password",
    "Login self-test did not reset credential lockout state",
    "grant execute on function public.api_verify_login(text, text)",
    "grant execute on function public.api_login_self_test()",
    "to service_role",
]:
    if marker not in migration:
        ERRORS.append(f"Login repair migration missing marker: {marker}")

for forbidden in [
    "where account_id = v_account.id",
    "set failed_attempts = failed_attempts + 1",
    "where id = v_account.id",
]:
    if forbidden in migration:
        ERRORS.append(f"Login repair migration contains ambiguous SQL: {forbidden}")

if "password_hash text" in migration or "initial_password" in migration:
    ERRORS.append("Login repair must not add readable password storage")

diagnostics = read("supabase/functions/login-diagnostics/index.ts")
for marker in [
    "api_login_self_test",
    "x-bootstrap-secret",
    "secretsEqual",
    "login_contract",
    "cache-control",
    "no-store",
]:
    if marker not in diagnostics:
        ERRORS.append(f"Login diagnostics function missing marker: {marker}")
for forbidden in ["console.log", "password_hash", "initial_password", "localStorage"]:
    if forbidden in diagnostics:
        ERRORS.append(f"Login diagnostics function contains forbidden pattern: {forbidden}")

config = read("supabase/config.toml")
if "[functions.login-diagnostics]" not in config or "verify_jwt = false" not in config:
    ERRORS.append("Supabase config must register login-diagnostics")

deploy = read(".github/workflows/deploy-institution-backend.yml")
for marker in [
    "Verify production login transaction",
    "functions/v1/login-diagnostics",
    "Production login transaction: PASS",
    "supabase db push --linked",
]:
    if marker not in deploy:
        ERRORS.append(f"Deployment workflow missing login verification marker: {marker}")

print("ECHS production login authentication repair validation")
print(f"Errors: {len(ERRORS)}")
for error in ERRORS:
    print(f"  ERROR: {error}")
if ERRORS:
    sys.exit(1)
print("Status: PASS")
