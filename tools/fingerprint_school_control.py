#!/usr/bin/env python3
"""Create immutable, commit-fingerprinted assets for the School Control Center."""
from __future__ import annotations

import argparse
import json
import re
import shutil
import sys
from pathlib import Path


def replace_once(text: str, pattern: str, replacement: str, label: str) -> str:
    updated, count = re.subn(pattern, replacement, text, count=1)
    if count != 1:
        raise RuntimeError(f"Expected exactly one {label} reference, found {count}")
    return updated


def copy_text(root: Path, source: str, destination: str) -> str:
    source_path = root / source
    destination_path = root / destination
    if not source_path.is_file():
        raise RuntimeError(f"Missing source asset: {source}")
    destination_path.parent.mkdir(parents=True, exist_ok=True)
    text = source_path.read_text(encoding="utf-8")
    destination_path.write_text(text, encoding="utf-8")
    return text


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("root", type=Path)
    parser.add_argument("--sha", required=True)
    args = parser.parse_args()

    root = args.root.resolve()
    sha = args.sha.strip().lower()
    if not re.fullmatch(r"[0-9a-f]{40}", sha):
        raise SystemExit("--sha must be a full 40-character Git SHA")
    token = sha[:12]

    copies = {
        "js/institution-client.js": f"js/institution-client.{token}.js",
        "js/institution-experience.js": f"js/institution-experience.{token}.js",
        "js/institution-completion.js": f"js/institution-completion.{token}.js",
        "css/institution.css": f"css/institution.{token}.css",
        "css/institution-polish.css": f"css/institution-polish.{token}.css",
        "css/institution-premium.css": f"css/institution-premium.{token}.css",
        "css/institution-responsive.css": f"css/institution-responsive.{token}.css",
        "css/institution-completion.css": f"css/institution-completion.{token}.css",
        "question-bank/js/admin-accounts.js": f"question-bank/js/school-control.{token}.js",
    }

    for source, destination in copies.items():
        copy_text(root, source, destination)

    client_path = root / copies["js/institution-client.js"]
    client = client_path.read_text(encoding="utf-8")
    client = replace_once(
        client,
        r"css/institution-polish\.css\?v=[^\"']+",
        f"css/institution-polish.{token}.css",
        "institution polish stylesheet",
    )
    client_path.write_text(client, encoding="utf-8")

    experience_path = root / copies["js/institution-experience.js"]
    experience = experience_path.read_text(encoding="utf-8")
    experience = replace_once(
        experience,
        r"css/institution-responsive\.css\?v=[^\"']+",
        f"css/institution-responsive.{token}.css",
        "responsive stylesheet",
    )
    experience = replace_once(
        experience,
        r"css/institution-completion\.css\?v=[^\"']+",
        f"css/institution-completion.{token}.css",
        "completion stylesheet",
    )
    experience = replace_once(
        experience,
        r"js/institution-completion\.js\?v=[^\"']+",
        f"js/institution-completion.{token}.js",
        "completion script",
    )
    experience_path.write_text(experience, encoding="utf-8")

    control_path = root / "question-bank/school-control.html"
    if not control_path.is_file():
        raise RuntimeError("Missing question-bank/school-control.html")
    control = control_path.read_text(encoding="utf-8")
    replacements = [
        (r"\.\./css/institution\.css\?v=[^\"']+", f"../css/institution.{token}.css", "institution stylesheet"),
        (r"\.\./css/institution-premium\.css\?v=[^\"']+", f"../css/institution-premium.{token}.css", "premium stylesheet"),
        (r"\.\./js/institution-client\.js\?v=[^\"']+", f"../js/institution-client.{token}.js", "institution client"),
        (r"\.\./js/institution-experience\.js\?v=[^\"']+", f"../js/institution-experience.{token}.js", "institution experience"),
        (r"js/admin-accounts\.js\?v=[^\"']+", f"js/school-control.{token}.js", "School Control Center runtime"),
    ]
    for pattern, replacement, label in replacements:
        control = replace_once(control, pattern, replacement, label)
    control = control.replace('href="admin.html"', 'href="school-control.html"')
    control_path.write_text(control, encoding="utf-8")

    manifest = {
        "sha": sha,
        "token": token,
        "page": "question-bank/school-control.html",
        "runtime": copies["question-bank/js/admin-accounts.js"],
        "assets": sorted(copies.values()),
    }
    (root / "school-control-assets.json").write_text(
        json.dumps(manifest, indent=2) + "\n",
        encoding="utf-8",
    )

    print("ECHS School Control Center asset fingerprinting")
    print(f"SHA: {sha}")
    print(f"Token: {token}")
    print(f"Runtime: {manifest['runtime']}")
    print("Status: PASS")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as error:
        print(f"ERROR: {error}", file=sys.stderr)
        sys.exit(1)
