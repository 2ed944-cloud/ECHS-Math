#!/usr/bin/env python3
"""Bootstrap the first ECHS institutional administrator and enable the frontend config."""
from __future__ import annotations
import argparse
import getpass
import json
import re
import secrets
import string
import sys
import urllib.error
import urllib.request
from pathlib import Path

def strong_password(length: int = 16) -> str:
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*_-+="
    while True:
        value = "".join(secrets.choice(alphabet) for _ in range(length))
        if all((re.search(r"[a-z]", value), re.search(r"[A-Z]", value), re.search(r"\d", value), re.search(r"[^A-Za-z0-9]", value))):
            return value

def post_json(url: str, payload: dict, secret: str) -> dict:
    request = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json", "x-bootstrap-secret": secret},
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", "replace")
        raise SystemExit(f"Bootstrap failed ({exc.code}): {detail}") from exc

def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--project-ref", required=True, help="Supabase project reference")
    parser.add_argument("--bootstrap-secret", help="Value deployed as BOOTSTRAP_SECRET")
    parser.add_argument("--organization", default="Education City High School")
    parser.add_argument("--slug", default="echs")
    parser.add_argument("--username", default="admin")
    parser.add_argument("--display-name", default="ECHS Platform Administrator")
    parser.add_argument("--email", default="")
    parser.add_argument("--password")
    parser.add_argument("--repo", type=Path, default=Path.cwd())
    args = parser.parse_args()

    secret = args.bootstrap_secret or getpass.getpass("BOOTSTRAP_SECRET: ")
    password = args.password or strong_password()
    api_base = f"https://{args.project_ref}.supabase.co/functions/v1"
    result = post_json(
        f"{api_base}/account-api/bootstrap",
        {
            "organization_name": args.organization,
            "organization_slug": args.slug,
            "username": args.username,
            "display_name": args.display_name,
            "email": args.email,
            "password": password,
        },
        secret,
    )
    if not result.get("ok"):
        raise SystemExit(result)

    config_path = args.repo / "config" / "institution.json"
    config = json.loads(config_path.read_text(encoding="utf-8"))
    config.update({"enabled": True, "api_base": api_base, "institution_name": args.organization})
    config_path.write_text(json.dumps(config, indent=2) + "\n", encoding="utf-8")

    print("Institutional administrator created.")
    print(f"Username: {args.username}")
    print(f"Initial password: {password}")
    print(f"Frontend configuration updated: {config_path}")
    print("Store the password securely. It cannot be retrieved from the database.")
    return 0

if __name__ == "__main__":
    sys.exit(main())
