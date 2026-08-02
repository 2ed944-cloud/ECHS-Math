#!/usr/bin/env python3
"""Reconcile canonical and student media manifests with student-ready questions."""
from __future__ import annotations

import hashlib
import json
import mimetypes
from pathlib import Path


OFFICIAL = Path(__file__).resolve().parents[1]
STUDENT = OFFICIAL / "data" / "student"
MANIFESTS = (
    OFFICIAL / "data" / "media-manifest.json",
    STUDENT / "media-manifest.json",
)


def load(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def reconcile(manifest: Path, referenced: dict[str, dict]) -> tuple[int, int]:
    current = load(manifest)
    by_id = {str(row.get("id")): row for row in current if row.get("id")}
    by_path = {str(row.get("path")): row for row in current if row.get("path")}
    created = 0
    updated = 0

    for path, reference in sorted(referenced.items()):
        media = reference["media"]
        media_id = str(media.get("id") or f"MEDIA-STUDENT-{hashlib.sha256(path.encode()).hexdigest()[:16].upper()}")
        row = by_path.get(path)
        if row is None:
            candidate = by_id.get(media_id)
            if candidate is not None and candidate.get("path") in (None, "", path):
                row = candidate
            elif candidate is not None:
                media_id = f"{media_id}-{hashlib.sha256(path.encode()).hexdigest()[:10].upper()}"
        file_path = OFFICIAL / path
        if not file_path.is_file():
            raise SystemExit(f"Student media reference is missing on disk: {path}")
        checksum = hashlib.sha256(file_path.read_bytes()).hexdigest()
        if row is None:
            row = {"id": media_id}
            current.append(row)
            by_id[media_id] = row
            created += 1
        else:
            updated += 1
        row.update({
            "path": path,
            "normalizedFilename": Path(path).name,
            "mimeType": media.get("mime") or mimetypes.guess_type(path)[0] or "application/octet-stream",
            "checksum": checksum,
            "linkedQuestions": sorted(reference["questions"]),
            "altText": str(media.get("alt") or "").strip(),
            "caption": str(media.get("caption") or "").strip(),
            "verificationStatus": "student-reference-verified",
            "cropStatus": media.get("cropStatus") or "not-applicable",
            "renderMode": media.get("renderMode") or "file",
            "qualityStatus": "student-ready",
        })

    current.sort(key=lambda row: (str(row.get("id") or ""), str(row.get("path") or "")))
    manifest.write_text(json.dumps(current, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return created, updated


def main() -> None:
    questions = []
    for chunk in sorted((STUDENT / "questions").glob("chunk-*.json")):
        payload = load(chunk)
        questions.extend(payload.get("questions", payload if isinstance(payload, list) else []))

    referenced: dict[str, dict] = {}
    for question in questions:
        question_id = str(question.get("id") or "")
        for media in question.get("media") or []:
            path = str(media.get("path") or "").strip()
            if not path:
                continue
            row = referenced.setdefault(path, {"media": media, "questions": []})
            if question_id and question_id not in row["questions"]:
                row["questions"].append(question_id)

    print(f"Student media references: {len(referenced)}")
    for manifest in MANIFESTS:
        created, updated = reconcile(manifest, referenced)
        print(f"{manifest.relative_to(OFFICIAL)}: {created} created, {updated} updated")


if __name__ == "__main__":
    main()
