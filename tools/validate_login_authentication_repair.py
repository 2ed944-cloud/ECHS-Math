#!/usr/bin/env python3
"""Release gate for production login and session persistence repairs."""
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
ERRORS: list[str] = []


def read(path: str) -> str:
    file = ROOT / path
    if not file.is_file():
        ERRORS.append(f"Missing required authentication repair file: {path}")
        return ""
    return file.read_text(encoding="utf-8")


login_migration = read("supabase/migrations/202607260003_login_authentication_repair.sql")
for marker in [
    "create or replace function public.api_verify_login",
    "credential_row.account_id = v_account.id",
    "credential_row.failed_attempts + 1",
    "account_row.id = v_account.id",
    "create or replace function public.api_login_self_test",
    "Incorrect-9!Password",
    "grant execute on function public.api_verify_login(text, text)",
    "to service_role",
]:
    if marker not in login_migration:
        ERRORS.append(f"Login repair migration missing marker: {marker}")

for forbidden in [
    "where account_id = v_account.id",
    "set failed_attempts = failed_attempts + 1",
    "where id = v_account.id",
]:
    if forbidden in login_migration:
        ERRORS.append(f"Login repair migration contains ambiguous SQL: {forbidden}")

session_migration = read("supabase/migrations/202607270001_session_lookup_repair.sql")
for marker in [
    "create or replace function public.api_session_lookup",
    "session_row.token_hash = p_token_hash",
    "session_row.expires_at > now()",
    "session_row.revoked_at is null",
    "public.api_create_session",
    "public.api_session_lookup(v_token_hash)",
    "public.api_revoke_session(v_token_hash)",
    "Session self-test did not resolve the expected account",
    "Session self-test resolved a revoked session",
    "grant execute on function public.api_session_lookup(text)",
    "grant execute on function public.api_login_self_test()",
    "to service_role",
]:
    if marker not in session_migration:
        ERRORS.append(f"Session repair migration missing marker: {marker}")

for forbidden in [
    "where token_hash = p_token_hash",
    "and expires_at > now()",
    "and revoked_at is null",
]:
    if forbidden in session_migration:
        ERRORS.append(f"Session repair migration contains unqualified SQL: {forbidden}")

combined = login_migration + session_migration
if "password_hash text" in combined or "initial_password" in combined:
    ERRORS.append("Authentication repair must not add readable password storage")

diagnostics = read("supabase/functions/login-diagnostics/index.ts")
for marker in [
    "api_login_self_test",
    "x-bootstrap-secret",
    "secretsEqual",
    "login_contract",
    "session_contract",
    "cache-control",
    "no-store",
]:
    if marker not in diagnostics:
        ERRORS.append(f"Login diagnostics function missing marker: {marker}")
for forbidden in ["console.log", "password_hash", "initial_password", "localStorage"]:
    if forbidden in diagnostics:
        ERRORS.append(f"Login diagnostics function contains forbidden pattern: {forbidden}")

client = read("js/institution-client.js")
for marker in [
    "function requestError",
    "error.status=status",
    "if(error?.status===401)",
    "institutionAuthUnavailable",
    "echs:institution-auth-error",
]:
    if marker not in client:
        ERRORS.append(f"Institution client missing resilient session marker: {marker}")
if ".catch(()=>{clearSession();return null})" in client:
    ERRORS.append("Institution client must not clear a valid session on every /me failure")

config = read("supabase/config.toml")
if "[functions.login-diagnostics]" not in config or "verify_jwt = false" not in config:
    ERRORS.append("Supabase config must register login-diagnostics")

deploy = read(".github/workflows/deploy-institution-backend.yml")
for marker in [
    "Verify production authentication and session transaction",
    "functions/v1/login-diagnostics",
    "session_contract",
    "Production authentication and session transaction: PASS",
    "supabase db push --linked",
]:
    if marker not in deploy:
        ERRORS.append(f"Deployment workflow missing authentication verification marker: {marker}")

for path in ["js/institution-client.js"]:
    result = subprocess.run(["node", "--check", str(ROOT / path)], capture_output=True, text=True)
    if result.returncode:
        ERRORS.append(f"JavaScript syntax failed in {path}: {result.stderr.strip()}")

print("ECHS production authentication/session repair validation")
print(f"Errors: {len(ERRORS)}")
for error in ERRORS:
    print(f"  ERROR: {error}")
if ERRORS:
    sys.exit(1)
print("Status: PASS")
