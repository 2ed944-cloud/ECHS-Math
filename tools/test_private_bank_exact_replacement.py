#!/usr/bin/env python3
"""Regression checks for exact private-bank replacement on re-upload."""
from __future__ import annotations

import importlib.util
import urllib.parse
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MODULE_PATH = ROOT / "tools" / "upload_private_bank_package_fast.py"
spec = importlib.util.spec_from_file_location("echs_private_bank_uploader", MODULE_PATH)
if spec is None or spec.loader is None:
    raise SystemExit("Could not load private-bank uploader")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class FakeSupabase(module.Supabase):
    def __init__(self):
        super().__init__("https://example.supabase.test", "service-key")
        self.calls: list[tuple[str, str, dict[str, str]]] = []

    def request(self, method, path, body=None, headers=None, *, attempts=1):
        self.calls.append((method, path, headers or {}))
        if method == "GET" and path.startswith("/rest/v1/private_bank_questions?"):
            return [
                {"question_id": "BANK-Q-001"},
                {"question_id": "BANK-Q-002"},
                {"question_id": "BANK-Q-003"},
            ]
        return b""


client = FakeSupabase()
existing = client.select_existing_question_ids("org-1", "BANK-06")
assert existing == {"BANK-Q-001", "BANK-Q-002", "BANK-Q-003"}
get_call = client.calls[-1]
assert get_call[0] == "GET"
get_query = urllib.parse.parse_qs(urllib.parse.urlsplit(get_call[1]).query)
assert get_query["organization_id"] == ["eq.org-1"]
assert get_query["bank_code"] == ["eq.BANK-06"]
assert get_query["select"] == ["question_id"]

client.calls.clear()
removed = client.delete_question_ids(
    "org-1",
    "BANK-06",
    {"BANK-Q-002", "BANK-Q-004", "BANK-Q-005"},
    batch_size=2,
)
assert removed == 3
assert len(client.calls) == 2
for method, path, headers in client.calls:
    assert method == "DELETE"
    assert headers.get("prefer") == "return=minimal"
    query = urllib.parse.parse_qs(urllib.parse.urlsplit(path).query)
    assert query["organization_id"] == ["eq.org-1"]
    assert query["bank_code"] == ["eq.BANK-06"]
    assert query["question_id"][0].startswith("in.(")
    assert query["question_id"][0].endswith(")")

client.calls.clear()
assert client.delete_question_ids("org-1", "BANK-06", set()) == 0
assert client.calls == []

old_ids = {"Q1", "Q2", "Q3", "Q4"}
new_ids = {"Q1", "Q3", "Q5"}
assert old_ids - new_ids == {"Q2", "Q4"}

source = MODULE_PATH.read_text(encoding="utf-8")
assert "existing_question_ids - seen" in source
assert '"questions_removed": questions_removed' in source
assert source.index('client.upsert("private_bank_questions"') < source.index("client.delete_question_ids(")
assert source.index("client.delete_question_ids(") < source.index('"deployment_state": state')

print("Exact private-bank replacement: PASS")
