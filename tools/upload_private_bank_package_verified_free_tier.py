#!/usr/bin/env python3
"""Run the verified private-bank importer with Free-plan-safe source storage.

The browser staging upload is already chunked. The normal importer also preserves the
original package in the private-question-banks bucket; that second copy must likewise
avoid Supabase Free's per-object limit. Large source archives are therefore stored as
40 MiB parts plus a small JSON pointer at the canonical storage_path.

Packages that explicitly declare ``replacement_mode: exact-bank-snapshot`` are also
applied as exact bank snapshots. The importer first upserts every revised question,
then removes stale question rows for that organization and bank, and finally verifies
that the database ID set exactly matches the replacement package. This is required for
re-audited banks where questions were deliberately excluded or remapped.
"""
from __future__ import annotations

import json
import sys
import urllib.parse
import zipfile
from pathlib import Path, PurePosixPath

import upload_private_bank_package_verified_fast as verified

PART_BYTES = 40 * 1024 * 1024
FORMAT = "echs-chunked-source-archive-v1"
EXACT_REPLACEMENT_MODE = "exact-bank-snapshot"
DELETE_BATCH_SIZE = 200

_original_upload = verified.base.Supabase.upload
_original_log = verified.base.log
_exact_runtime_result: dict = {}


def free_tier_upload(self, bucket: str, path: str, data: bytes, content_type: str):
    is_source_archive = "/imports/" in path and path.lower().endswith(".zip")
    if not is_source_archive or len(data) <= PART_BYTES:
        return _original_upload(self, bucket, path, data, content_type)

    archive_path = PurePosixPath(path)
    part_prefix = str(archive_path.with_suffix("")) + ".parts"
    parts = []
    for index, offset in enumerate(range(0, len(data), PART_BYTES), 1):
        chunk = data[offset : offset + PART_BYTES]
        part_path = f"{part_prefix}/part-{index:04d}.bin"
        verified.base.log(
            f"Storing source archive part {index} "
            f"({len(chunk)} bytes; Free-plan-safe)"
        )
        _original_upload(
            self,
            bucket,
            part_path,
            chunk,
            "application/octet-stream",
        )
        parts.append(
            {
                "index": index,
                "path": part_path,
                "size": len(chunk),
                "sha256": verified.base.digest(chunk),
            }
        )

    pointer = verified.base.canonical(
        {
            "format": FORMAT,
            "original_content_type": content_type,
            "original_size": len(data),
            "original_sha256": verified.base.digest(data),
            "part_size": PART_BYTES,
            "parts": parts,
        }
    )
    verified.base.log(
        f"Source archive stored as {len(parts)} private parts; "
        f"writing pointer manifest to {path}"
    )
    return _original_upload(self, bucket, path, pointer, "application/json")


verified.base.Supabase.upload = free_tier_upload


def stale_question_ids(existing_ids, replacement_ids) -> list[str]:
    return sorted(
        {str(value) for value in existing_ids if str(value)}
        - {str(value) for value in replacement_ids if str(value)}
    )


def read_exact_snapshot(package: Path) -> dict | None:
    """Return exact replacement metadata, or None for normal additive packages."""
    with zipfile.ZipFile(package) as archive:
        root = verified.archive_root(archive)
        manifest = json.loads(archive.read(f"{root}/bank-manifest.json"))
        if str(manifest.get("replacement_mode") or "").strip() != EXACT_REPLACEMENT_MODE:
            return None

        bank_code = str(manifest.get("bank_code") or "").strip()
        if not bank_code:
            raise RuntimeError("Exact replacement package is missing bank_code")
        question_ids: set[str] = set()
        question_files = sorted(
            name
            for name in archive.namelist()
            if name.startswith(f"{root}/questions/") and name.endswith(".json")
        )
        if not question_files:
            raise RuntimeError("Exact replacement package contains no question chunks")
        for file_name in question_files:
            payload = json.loads(archive.read(file_name))
            for question in payload.get("questions") or []:
                question_id = str(question.get("id") or "").strip()
                if not question_id or question_id in question_ids:
                    raise RuntimeError(
                        f"Exact replacement package has a missing or duplicate ID: {question_id}"
                    )
                question_ids.add(question_id)

        expected = int(manifest.get("questions") or 0)
        if len(question_ids) != expected:
            raise RuntimeError(
                f"Exact replacement question count mismatch: expected {expected}, "
                f"parsed {len(question_ids)}"
            )
        return {
            "bank_code": bank_code,
            "bank_slug": str(manifest.get("bank_slug") or "").strip(),
            "question_ids": frozenset(question_ids),
            "question_count": expected,
            "revision": str(manifest.get("revision") or "").strip(),
            "package_sha256": verified.base.digest(package.read_bytes()),
        }


def _query_existing_question_ids(client, organization_id: str, bank_code: str) -> set[str]:
    existing: set[str] = set()
    offset, page_size = 0, 1000
    while True:
        query = urllib.parse.urlencode(
            {
                "select": "question_id",
                "organization_id": f"eq.{organization_id}",
                "bank_code": f"eq.{bank_code}",
                "order": "question_id.asc",
            },
            safe=",",
        )
        rows = client.request(
            "GET",
            f"/rest/v1/private_bank_questions?{query}",
            headers={"range": f"{offset}-{offset + page_size - 1}"},
            attempts=4,
        ) or []
        for row in rows:
            question_id = str(row.get("question_id") or "").strip()
            if question_id:
                existing.add(question_id)
        if len(rows) < page_size:
            break
        offset += page_size
    return existing


def _delete_question_ids(
    client,
    organization_id: str,
    bank_code: str,
    question_ids,
) -> int:
    values = sorted({str(value) for value in question_ids if str(value)})
    deleted = 0
    for start in range(0, len(values), DELETE_BATCH_SIZE):
        group = values[start : start + DELETE_BATCH_SIZE]
        encoded_ids = ",".join(json.dumps(value) for value in group)
        query = urllib.parse.urlencode(
            {
                "organization_id": f"eq.{organization_id}",
                "bank_code": f"eq.{bank_code}",
                "question_id": f"in.({encoded_ids})",
            },
            safe='(),."-_: ',
        )
        client.request(
            "DELETE",
            f"/rest/v1/private_bank_questions?{query}",
            headers={"prefer": "return=minimal"},
            attempts=4,
        )
        deleted += len(group)
    return deleted


def exact_snapshot_supabase_class(base_class, snapshot: dict):
    """Build a scoped Supabase client that finalizes one exact bank snapshot."""

    class ExactSnapshotSupabase(base_class):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, **kwargs)
            self._exact_snapshot_applied = False

        def _apply_exact_snapshot(self, organization_id: str, bank_code: str) -> dict:
            global _exact_runtime_result
            if self._exact_snapshot_applied:
                return dict(_exact_runtime_result)
            if bank_code != snapshot["bank_code"]:
                raise RuntimeError(
                    f"Exact replacement bank mismatch: package={snapshot['bank_code']} "
                    f"database={bank_code}"
                )

            desired = set(snapshot["question_ids"])
            existing = _query_existing_question_ids(self, organization_id, bank_code)
            stale = stale_question_ids(existing, desired)
            verified.base.log(
                f"Exact bank snapshot {bank_code}: {len(existing)} current rows, "
                f"{len(desired)} replacement rows, {len(stale)} stale rows"
            )
            removed = _delete_question_ids(
                self,
                organization_id,
                bank_code,
                stale,
            )
            remaining = _query_existing_question_ids(self, organization_id, bank_code)
            missing = sorted(desired - remaining)
            extra = sorted(remaining - desired)
            if missing or extra:
                raise RuntimeError(
                    "Exact replacement verification failed: "
                    f"missing={len(missing)}, extra={len(extra)}"
                )

            self._exact_snapshot_applied = True
            _exact_runtime_result = {
                "replacement_snapshot": True,
                "replacement_mode": EXACT_REPLACEMENT_MODE,
                "replacement_revision": snapshot.get("revision") or None,
                "questions_removed": removed,
                "replacement_question_count": len(desired),
                "replacement_package_sha256": snapshot["package_sha256"],
            }
            verified.base.log(
                f"Exact bank snapshot verified: {len(remaining)} rows remain; "
                f"{removed} stale rows removed"
            )
            return dict(_exact_runtime_result)

        def patch(self, table: str, filters: dict[str, str], values: dict):
            if (
                table == "private_bank_packages"
                and str(filters.get("bank_code") or "") == snapshot["bank_code"]
                and str(values.get("deployment_state") or "")
                in {
                    "registered-direct",
                    "complete-direct-upload",
                    "registered-verified",
                    "complete-verified-upload",
                }
            ):
                organization_id = str(filters.get("organization_id") or "").strip()
                if not organization_id:
                    raise RuntimeError(
                        "Exact replacement finalization is missing organization_id"
                    )
                result = self._apply_exact_snapshot(
                    organization_id,
                    snapshot["bank_code"],
                )
                values = {
                    **values,
                    "deployment_state": (
                        f"{values['deployment_state']}-{EXACT_REPLACEMENT_MODE}"
                    ),
                }
                result["deployment_state"] = values["deployment_state"]
                _exact_runtime_result.update(result)
            return super().patch(table, filters, values)

    return ExactSnapshotSupabase


def _log_with_exact_result(message: str) -> None:
    if message.startswith("IMPORT_RESULT=") and _exact_runtime_result:
        try:
            payload = json.loads(message.split("=", 1)[1])
            payload.update(_exact_runtime_result)
            message = "IMPORT_RESULT=" + json.dumps(
                payload,
                ensure_ascii=False,
                separators=(",", ":"),
            )
        except json.JSONDecodeError:
            pass
    _original_log(message)


def install_exact_snapshot(package: Path) -> dict | None:
    snapshot = read_exact_snapshot(package)
    if not snapshot:
        return None
    verified.base.Supabase = exact_snapshot_supabase_class(
        verified.base.Supabase,
        snapshot,
    )
    verified.base.log = _log_with_exact_result
    verified.base.log(
        f"Exact replacement mode enabled for {snapshot['bank_code']} · "
        f"{snapshot['question_count']} questions"
    )
    return snapshot


if __name__ == "__main__":
    if len(sys.argv) < 2:
        raise SystemExit("Package path is required")
    install_exact_snapshot(Path(sys.argv[1]))
    raise SystemExit(verified.main())
