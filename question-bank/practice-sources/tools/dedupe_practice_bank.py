#!/usr/bin/env python3
"""Detect exact and near-duplicate practice questions without deleting records."""
from __future__ import annotations

import argparse
import hashlib
import json
import re
from collections import defaultdict
from difflib import SequenceMatcher
from pathlib import Path

WS_RE = re.compile(r"\s+")


def normalise(value: str) -> str:
    value = value.lower()
    value = re.sub(r"\\(?:frac|sqrt|left|right|cdot|times|text)\b", " ", value)
    value = re.sub(r"[^a-z0-9]+", " ", value)
    return WS_RE.sub(" ", value).strip()


def fingerprint(question: dict) -> str:
    choices = " | ".join(str(x.get("text", "")) for x in question.get("choices", []))
    canonical = normalise(f'{question.get("prompt", "")} | {choices}')
    return hashlib.sha256(canonical.encode()).hexdigest()


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("inputs", nargs="+", type=Path)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--near-threshold", type=float, default=0.94)
    args = parser.parse_args()

    questions = []
    for path in args.inputs:
        payload = json.loads(path.read_text(encoding="utf-8"))
        questions.extend(payload.get("questions", []))

    exact = defaultdict(list)
    for question in questions:
        exact[fingerprint(question)].append(question["id"])

    exact_groups = [ids for ids in exact.values() if len(ids) > 1]
    representatives = []
    for question in questions:
        norm = normalise(question.get("prompt", ""))
        if norm:
            representatives.append((question["id"], norm))

    near_groups = []
    seen = set()
    for i, (left_id, left_text) in enumerate(representatives):
        for right_id, right_text in representatives[i + 1:]:
            pair = tuple(sorted((left_id, right_id)))
            if pair in seen:
                continue
            if abs(len(left_text) - len(right_text)) > max(50, 0.25 * max(len(left_text), len(right_text))):
                continue
            ratio = SequenceMatcher(None, left_text, right_text).ratio()
            if ratio >= args.near_threshold:
                near_groups.append({"questionIds": list(pair), "similarity": round(ratio, 4)})
                seen.add(pair)

    report = {
        "schemaVersion": "1.0.0",
        "questionCount": len(questions),
        "exactDuplicateGroups": exact_groups,
        "nearDuplicatePairs": near_groups,
        "policy": "No record is deleted automatically. A reviewer must select the canonical practice record and preserve all source references."
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(f"Exact groups: {len(exact_groups)}; near pairs: {len(near_groups)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
