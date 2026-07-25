#!/usr/bin/env python3
"""Validate teacher-only practice staging JSON before human review."""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

REQUIRED_QUALITY_FLAGS = (
    "needsReview",
    "transcriptionVerified",
    "answerVerified",
    "katexVerified",
    "mediaVerified",
    "mappingVerified",
    "studentReady",
)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("files", nargs="+", type=Path)
    args = parser.parse_args()
    errors: list[str] = []
    seen_ids: set[str] = set()

    for path in args.files:
        try:
            payload = json.loads(path.read_text(encoding="utf-8"))
        except Exception as exc:
            errors.append(f"{path}: invalid JSON: {exc}")
            continue
        if payload.get("visibility") != "teacher-only-staging":
            errors.append(f"{path}: visibility must be teacher-only-staging")
        for index, question in enumerate(payload.get("questions", []), start=1):
            prefix = f"{path}: question {index}"
            qid = question.get("id")
            if not qid:
                errors.append(f"{prefix}: missing id")
            elif qid in seen_ids:
                errors.append(f"{prefix}: duplicate id {qid}")
            else:
                seen_ids.add(qid)
            if not question.get("prompt"):
                errors.append(f"{prefix}: missing prompt")
            rights = question.get("rights", {})
            if rights.get("publicPublicationAllowed") is not False:
                errors.append(f"{prefix}: publisher item must not be public")
            quality = question.get("quality", {})
            for flag in REQUIRED_QUALITY_FLAGS:
                if flag not in quality:
                    errors.append(f"{prefix}: missing quality.{flag}")
            if quality.get("studentReady") is True:
                errors.append(f"{prefix}: staging importer may not set studentReady=true")
            answer = question.get("answer")
            labels = {choice.get("label") for choice in question.get("choices", [])}
            if isinstance(answer, str) and labels and answer not in labels:
                errors.append(f"{prefix}: answer {answer!r} is not a choice label")
            for media in question.get("media", []):
                if not media.get("sourcePath"):
                    errors.append(f"{prefix}: media missing sourcePath")

    if errors:
        print("Practice staging validation failed:")
        for error in errors:
            print(f"- {error}")
        return 1
    print(f"Practice staging validation passed for {len(seen_ids)} questions.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
