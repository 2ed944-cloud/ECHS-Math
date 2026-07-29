#!/usr/bin/env python3
"""Streaming/recoverable Teacher Upload processor.

It reuses the stable course-release implementation, adds validated IB Mathematics
AI lesson releases, and replaces queued-bank selection, staged-package download,
and bank importing with resumable paths.
"""
from __future__ import annotations

import hashlib
import json
import subprocess
import sys
import urllib.parse
from pathlib import Path

import process_teacher_upload_request as base
import process_ib_lesson_release as ib_release

ROOT = Path(__file__).resolve().parents[1]
_stable_course_processor = base.process_course


def queued(request_id: str = ""):
    select = "id,organization_id,upload_kind,course_key,unit_key,original_filename,object_path,file_size_bytes,sha256,status,result"
    if request_id:
        query = urllib.parse.urlencode({"select": select, "id": f"eq.{request_id}", "limit": "1"}, safe=",")
    else:
        query = urllib.parse.urlencode({
            "select": select,
            "or": "(status.eq.queued,status.eq.processing)",
            "order": "created_at.asc",
            "limit": "1",
        }, safe=",().")
    rows = base.request("GET", f"/rest/v1/teacher_upload_requests?{query}") or []
    return rows[0] if rows else None


def _download_object(path: str) -> bytes:
    encoded = "/".join(urllib.parse.quote(part, safe="._+-") for part in path.split("/"))
    return base.request("GET", f"/storage/v1/object/{base.BUCKET}/{encoded}")


def download(row: dict, destination: Path):
    """Download either a legacy single object or a chunked staged ZIP."""
    staging = (row.get("result") or {}).get("staging") or {}
    part_paths = staging.get("part_paths") if staging.get("upload_mode") == "chunked" else None
    paths = [str(path) for path in (part_paths or [row["object_path"]]) if str(path).strip()]
    if not paths:
        raise RuntimeError("The upload request does not contain any staged object paths")

    digest = hashlib.sha256()
    total = 0
    with destination.open("wb") as handle:
        for index, path in enumerate(paths, start=1):
            data = _download_object(path)
            handle.write(data)
            digest.update(data)
            total += len(data)
            print(f"Reassembled staged part {index}/{len(paths)}: {path} ({len(data)} bytes)", flush=True)

    expected_size = int(row["file_size_bytes"])
    actual_sha = digest.hexdigest()
    if total != expected_size:
        raise RuntimeError(f"Reassembled ZIP size mismatch: expected {expected_size}, got {total}")
    if actual_sha != row["sha256"]:
        raise RuntimeError(f"SHA-256 mismatch: expected {row['sha256']}, got {actual_sha}")


def process_course(row: dict, package: Path):
    course = str(row.get("course_key") or "").strip()
    if course == "ib-math-ai":
        return ib_release.process_ib_ai_release(ROOT, row, package, base.safe_extract)
    return _stable_course_processor(row, package)


def process_bank(row: dict, package: Path):
    command = [
        sys.executable,
        "-u",
        str(ROOT / "tools" / "upload_private_bank_package_verified_free_tier.py"),
        str(package),
        "--organization-id", row["organization_id"],
        "--request-id", row["id"],
        "--batch-size", "250",
    ]
    expected_course = str(row.get("course_key") or "").strip()
    if expected_course:
        command.extend(["--expected-course", expected_course])
    print("Starting Free-plan-safe verified private-bank importer", flush=True)
    result_payload = {}
    process = subprocess.Popen(
        command,
        cwd=ROOT,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        bufsize=1,
    )
    assert process.stdout is not None
    for line in process.stdout:
        print(line, end="", flush=True)
        if line.startswith("IMPORT_RESULT="):
            try:
                result_payload = json.loads(line.split("=", 1)[1])
            except json.JSONDecodeError:
                pass
    return_code = process.wait()
    if return_code:
        raise RuntimeError(f"Verified private-bank importer exited with code {return_code}")
    return {"kind": "private-bank", **result_payload}


base.queued = queued
base.download = download
base.process_course = process_course
base.process_bank = process_bank

if __name__ == "__main__":
    raise SystemExit(base.main())
