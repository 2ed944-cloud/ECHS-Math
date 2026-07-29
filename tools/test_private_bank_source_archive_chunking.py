#!/usr/bin/env python3
from __future__ import annotations

import importlib

module = importlib.import_module("upload_private_bank_package_verified_free_tier")
recorded = []


def fake_upload(self, bucket, path, data, content_type):
    recorded.append((bucket, path, bytes(data), content_type))
    return {"ok": True}


module._original_upload = fake_upload
client = object()
payload = b"x" * (module.PART_BYTES + 123)
module.free_tier_upload(client, "private-question-banks", "bank/imports/hash.zip", payload, "application/zip")

assert len(recorded) == 3, recorded
assert recorded[0][1].endswith("hash.parts/part-0001.bin")
assert len(recorded[0][2]) == module.PART_BYTES
assert recorded[1][1].endswith("hash.parts/part-0002.bin")
assert len(recorded[1][2]) == 123
assert recorded[2][1] == "bank/imports/hash.zip"
assert recorded[2][3] == "application/json"
assert b"echs-chunked-source-archive-v1" in recorded[2][2]
assert all(len(row[2]) < 50 * 1024 * 1024 for row in recorded)

recorded.clear()
small = b"y" * 1024
module.free_tier_upload(client, "private-question-banks", "bank/imports/small.zip", small, "application/zip")
assert recorded == [("private-question-banks", "bank/imports/small.zip", small, "application/zip")]

print("Private-bank source archive chunking: PASS")
