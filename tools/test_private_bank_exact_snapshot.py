#!/usr/bin/env python3
"""Regression checks for exact private-bank replacement snapshots."""
from __future__ import annotations

import json
import tempfile
import urllib.parse
import zipfile
from pathlib import Path

import upload_private_bank_package_verified_free_tier as module


def write_package(path: Path, *, exact: bool = True) -> None:
    manifest = {
        "bank_code": "BANK-6",
        "bank_slug": "bank-6",
        "questions": 3,
        "replacement_mode": "exact-bank-snapshot" if exact else "additive",
        "revision": "strict-v3",
    }
    questions = {
        "questions": [
            {"id": "Q-001"},
            {"id": "Q-002"},
            {"id": "Q-003"},
        ]
    }
    with zipfile.ZipFile(path, "w", zipfile.ZIP_DEFLATED) as archive:
        archive.writestr("bank-6/bank-manifest.json", json.dumps(manifest))
        archive.writestr(
            "bank-6/questions/chunk-001.json",
            json.dumps(questions),
        )


with tempfile.TemporaryDirectory() as temp:
    exact_path = Path(temp) / "exact.zip"
    additive_path = Path(temp) / "additive.zip"
    write_package(exact_path, exact=True)
    write_package(additive_path, exact=False)

    snapshot = module.read_exact_snapshot(exact_path)
    assert snapshot and snapshot["bank_code"] == "BANK-6"
    assert snapshot["question_ids"] == frozenset({"Q-001", "Q-002", "Q-003"})
    assert snapshot["question_count"] == 3
    assert module.read_exact_snapshot(additive_path) is None

assert module.stale_question_ids(
    {"Q-001", "Q-002", "STALE-1"},
    {"Q-001", "Q-002", "Q-003"},
) == ["STALE-1"]


class FakeSupabase:
    def __init__(self, *_args, **_kwargs):
        self.ids = {"Q-001", "Q-002", "Q-003", "STALE-1", "STALE-2"}
        self.patches: list[tuple] = []
        self.deletes: list[str] = []

    def request(self, method, path, body=None, headers=None, *, attempts=1):
        query = urllib.parse.parse_qs(urllib.parse.urlsplit(path).query)
        if method == "GET":
            rows = [{"question_id": value} for value in sorted(self.ids)]
            start, end = map(int, (headers or {})["range"].split("-", 1))
            return rows[start : end + 1]
        if method == "DELETE":
            assert query["organization_id"] == ["eq.org-1"]
            assert query["bank_code"] == ["eq.BANK-6"]
            expression = query["question_id"][0]
            values = json.loads(f"[{expression[4:-1]}]")
            self.deletes.extend(values)
            self.ids.difference_update(values)
            return b""
        raise AssertionError((method, path, body, attempts))

    def patch(self, table, filters, values):
        self.patches.append((table, filters, values))
        return b""


module._exact_runtime_result.clear()
client_class = module.exact_snapshot_supabase_class(FakeSupabase, snapshot)
client = client_class()
client.patch(
    "private_bank_packages",
    {"organization_id": "org-1", "bank_code": "BANK-6"},
    {"deployment_state": "complete-direct-upload", "media_count": 4},
)

assert client.ids == {"Q-001", "Q-002", "Q-003"}
assert client.deletes == ["STALE-1", "STALE-2"]
assert (
    client.patches[-1][2]["deployment_state"]
    == "complete-direct-upload-exact-bank-snapshot"
)
assert module._exact_runtime_result["questions_removed"] == 2
assert module._exact_runtime_result["replacement_snapshot"] is True
assert module._exact_runtime_result["replacement_question_count"] == 3

print("Private-bank exact snapshot replacement: PASS")
