#!/usr/bin/env python3
"""Run the verified private-bank importer with Free-plan-safe source archive storage.

The browser staging upload is already chunked. The normal importer also preserves the
original package in the private-question-banks bucket; that second copy must likewise
avoid Supabase Free's per-object limit. Large source archives are therefore stored as
40 MiB parts plus a small JSON pointer at the canonical storage_path.
"""
from __future__ import annotations

import json
from pathlib import PurePosixPath

import upload_private_bank_package_verified_fast as verified

PART_BYTES = 40 * 1024 * 1024
FORMAT = "echs-chunked-source-archive-v1"

_original_upload = verified.base.Supabase.upload


def free_tier_upload(self, bucket: str, path: str, data: bytes, content_type: str):
    is_source_archive = "/imports/" in path and path.lower().endswith(".zip")
    if not is_source_archive or len(data) <= PART_BYTES:
        return _original_upload(self, bucket, path, data, content_type)

    archive_path = PurePosixPath(path)
    part_prefix = str(archive_path.with_suffix("")) + ".parts"
    parts = []
    for index, offset in enumerate(range(0, len(data), PART_BYTES), 1):
        chunk = data[offset:offset + PART_BYTES]
        part_path = f"{part_prefix}/part-{index:04d}.bin"
        verified.base.log(
            f"Storing source archive part {index} "
            f"({len(chunk)} bytes; Free-plan-safe)"
        )
        _original_upload(self, bucket, part_path, chunk, "application/octet-stream")
        parts.append({
            "index": index,
            "path": part_path,
            "size": len(chunk),
            "sha256": verified.base.digest(chunk),
        })

    pointer = verified.base.canonical({
        "format": FORMAT,
        "original_content_type": content_type,
        "original_size": len(data),
        "original_sha256": verified.base.digest(data),
        "part_size": PART_BYTES,
        "parts": parts,
    })
    verified.base.log(
        f"Source archive stored as {len(parts)} private parts; "
        f"writing pointer manifest to {path}"
    )
    return _original_upload(self, bucket, path, pointer, "application/json")


verified.base.Supabase.upload = free_tier_upload

if __name__ == "__main__":
    raise SystemExit(verified.main())
