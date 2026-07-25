#!/usr/bin/env python3
"""Generate deterministic checksums for release-critical question-bank artifacts."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


TOOLS = Path(__file__).resolve().parent
OFFICIAL = TOOLS.parent
REPORTS = OFFICIAL / "reports"
MANIFEST_JSON = REPORTS / "release_checksum_manifest.json"
MANIFEST_TEXT = REPORTS / "release_checksums.sha256"

REPORT_NAMES = {
    "QUESTION_BY_QUESTION_AUDIT.csv",
    "QUESTION_CORRECTIONS_LOG.json",
    "QUESTION_CORRECTIONS_REPORT.md",
    "MATHEMATICAL_VERIFICATION_REPORT.md",
    "KATEX_AUDIT_REPORT.md",
    "katex_audit_results.json",
    "katex_error_log.json",
    "MEDIA_AUDIT_REPORT.md",
    "LESSON_MAPPING_AUDIT.md",
    "UNRELATED_QUESTIONS_REMOVED_FROM_LESSON_LINKS.md",
    "STUDENT_READY_REPORT.md",
    "TEACHER_REVIEW_QUEUE.md",
    "COUNT_RECONCILIATION_REPORT.md",
    "CHANGELOG.md",
}


def selected_files() -> list[Path]:
    paths: set[Path] = set()
    for folder in (
        OFFICIAL / "data" / "questions",
        OFFICIAL / "data" / "student",
    ):
        paths.update(path for path in folder.rglob("*") if path.is_file())
    for name in ("catalog.json", "id-map.json", "question-index.json"):
        paths.add(OFFICIAL / "data" / name)
    for name in REPORT_NAMES:
        paths.add(REPORTS / name)
    for folder in (OFFICIAL / "js",):
        paths.update(path for path in folder.glob("*.js") if path.is_file())
    paths.update(
        {
            OFFICIAL / "index.html",
            OFFICIAL / "archive.html",
            OFFICIAL / "practice.html",
            OFFICIAL / "exam.html",
            OFFICIAL / "dashboard.html",
            TOOLS / "apply_strict_audit_gate.py",
            TOOLS / "validate_katex.mjs",
            TOOLS / "validate_release.py",
            TOOLS / "package.json",
            TOOLS / "package-lock.json",
        }
    )
    missing = sorted(path for path in paths if not path.is_file())
    if missing:
        raise SystemExit(
            "Cannot checksum missing release artifacts: "
            + ", ".join(str(path.relative_to(OFFICIAL)) for path in missing)
        )
    return sorted(paths)


def main() -> None:
    rows = []
    for path in selected_files():
        payload = path.read_bytes()
        rows.append(
            {
                "path": path.relative_to(OFFICIAL).as_posix(),
                "bytes": len(payload),
                "sha256": hashlib.sha256(payload).hexdigest(),
            }
        )
    MANIFEST_JSON.write_text(
        json.dumps(
            {
                "algorithm": "SHA-256",
                "scope": "release-critical question-bank artifacts",
                "files": rows,
            },
            indent=2,
            ensure_ascii=False,
        )
        + "\n",
        encoding="utf-8",
    )
    MANIFEST_TEXT.write_text(
        "".join(f"{row['sha256']}  {row['path']}\n" for row in rows),
        encoding="utf-8",
    )
    print(json.dumps({"algorithm": "SHA-256", "files": len(rows)}, indent=2))


if __name__ == "__main__":
    main()
