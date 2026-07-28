#!/usr/bin/env python3
"""Streaming/recoverable Teacher Upload processor.

It reuses the stable course-release implementation and replaces only queued-bank
selection and bank importing with a resumable, visible fast path.
"""
from __future__ import annotations

import json
import subprocess
import sys
import urllib.parse
from pathlib import Path

import process_teacher_upload_request as base

ROOT = Path(__file__).resolve().parents[1]


def queued(request_id: str = ""):
    select = "id,organization_id,upload_kind,course_key,unit_key,original_filename,object_path,file_size_bytes,sha256,status"
    if request_id:
        query = urllib.parse.urlencode({"select": select, "id": f"eq.{request_id}", "limit": "1"}, safe=",")
    else:
        # Recover interrupted banks as well as course releases. Upserts make retries idempotent.
        query = urllib.parse.urlencode({
            "select": select,
            "or": "(status.eq.queued,status.eq.processing)",
            "order": "created_at.asc",
            "limit": "1",
        }, safe=",().")
    rows = base.request("GET", f"/rest/v1/teacher_upload_requests?{query}") or []
    return rows[0] if rows else None


def process_bank(row: dict, package: Path):
    command = [
        sys.executable,
        "-u",
        str(ROOT / "tools" / "upload_private_bank_package_fast.py"),
        str(package),
        "--organization-id", row["organization_id"],
        "--request-id", row["id"],
        "--batch-size", "250",
    ]
    expected_course = str(row.get("course_key") or "").strip()
    if expected_course:
        command.extend(["--expected-course", expected_course])
    print("Starting fast private-bank importer", flush=True)
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
        raise RuntimeError(f"Fast private-bank importer exited with code {return_code}")
    return {"kind": "private-bank", **result_payload}


base.queued = queued
base.process_bank = process_bank

if __name__ == "__main__":
    raise SystemExit(base.main())
