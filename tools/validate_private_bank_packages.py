#!/usr/bin/env python3
"""Validate direct-linked ECHS private-bank packages without publishing content."""
from __future__ import annotations

import argparse
import collections
import hashlib
import io
import json
import re
import zipfile
from pathlib import Path

ALLOWED_TYPES = {"mcq", "true_false", "fill_blank", "essay"}
ALLOWED_COURSES = {"ap-precalculus", "ib-math-ai", "ap-calculus", "algebra-2", "grade-9"}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("packages", nargs="*", type=Path)
    parser.add_argument("--root", type=Path)
    parser.add_argument("--registry", type=Path, default=Path("question-bank/private-sources/data/private-bank-registry.json"))
    parser.add_argument("--output-dir", type=Path, default=Path("."))
    parser.add_argument("--skip-registry-totals", action="store_true")
    args = parser.parse_args()

    packages = list(args.packages)
    if args.root:
        packages.extend(sorted(args.root.glob("*-private-import.zip")))
    packages = sorted({path.resolve() for path in packages})
    if not packages:
        raise SystemExit("No private import packages were supplied")

    registry = json.loads(args.registry.read_text(encoding="utf-8")) if args.registry.is_file() else {}
    registry_by_code = {row.get("bank_code"): row for row in registry.get("banks") or []}
    report = {"schema_version": "1.2.0", "status": "PASS", "packages": [], "totals": {}, "errors": [], "warnings": []}
    all_ids: set[str] = set()
    totals = collections.Counter()

    def error(message, bank=None, question=None):
        report["errors"].append({"message": message, **({"bank": bank} if bank else {}), **({"question_id": question} if question else {})})

    def warning(message, bank=None, question=None):
        report["warnings"].append({"message": message, **({"bank": bank} if bank else {}), **({"question_id": question} if question else {})})

    for package_path in packages:
        data = package_path.read_bytes()
        package_digest = hashlib.sha256(data).hexdigest()
        with zipfile.ZipFile(io.BytesIO(data)) as outer:
            bad = outer.testzip()
            if bad:
                error(f"Outer ZIP CRC failure: {bad}", package_path.name)
            roots = {name.split("/", 1)[0] for name in outer.namelist() if "/" in name}
            if len(roots) != 1:
                error(f"Package must have one root, found {sorted(roots)}", package_path.name)
                continue
            slug = next(iter(roots))
            manifest_name = f"{slug}/bank-manifest.json"
            if manifest_name not in outer.namelist():
                error("Missing bank-manifest.json", slug)
                continue
            manifest = json.loads(outer.read(manifest_name))
            code = manifest.get("bank_code") or slug
            registry_row = registry_by_code.get(code) or {}
            if registry_row and registry_row.get("package_sha256") != package_digest:
                error("Package SHA-256 does not match registry", code)
            if manifest.get("trust_default") != "publisher_key_direct" or manifest.get("student_visible") is not True or manifest.get("question_trust_review_required") is not False:
                error("Manifest does not use publisher-key direct lesson access", code)
            target_courses = [str(value or "").strip() for value in manifest.get("target_courses") or []]
            if len(target_courses) != 1:
                error("Manifest must declare exactly one target course", code)
            unsupported_targets = sorted(set(target_courses) - ALLOWED_COURSES)
            if unsupported_targets:
                error(f"Manifest contains unsupported courses {unsupported_targets}", code)

            media_inventory: dict[str, set[str]] = {}
            media_files = 0
            for rel in manifest.get("media_packages") or []:
                inner = f"{slug}/{rel}"
                if inner not in outer.namelist():
                    error(f"Missing media package {rel}", code)
                    continue
                chapter_match = re.search(r"chapter_(\d{2})\.zip$", rel)
                chapter = chapter_match.group(1) if chapter_match else None
                with zipfile.ZipFile(io.BytesIO(outer.read(inner))) as media_zip:
                    bad_media = media_zip.testzip()
                    if bad_media:
                        error(f"Media ZIP {rel} CRC failure: {bad_media}", code)
                    files = {name.lstrip("/") for name in media_zip.namelist() if not name.endswith("/")}
                    media_files += len(files)
                    if chapter:
                        media_inventory[chapter] = files

            ids: list[str] = []
            pools: set[str] = set()
            types = collections.Counter()
            mapping_counts = collections.Counter()
            readiness = collections.Counter()
            media_refs = 0
            essay_without_solution = 0
            inferred_targets: set[str] | None = None

            for chunk in manifest.get("chunks") or []:
                rel = chunk.get("file", "")
                inner = f"{slug}/{rel}"
                if inner not in outer.namelist():
                    error(f"Missing question chunk {rel}", code)
                    continue
                payload = json.loads(outer.read(inner))
                questions = payload.get("questions") or []
                if chunk.get("questions") is not None and len(questions) != chunk.get("questions"):
                    error(f"Chunk {rel} count mismatch", code)
                for question in questions:
                    qid = str(question.get("id") or "")
                    if not qid:
                        error("Question missing ID", code)
                        continue
                    if qid in all_ids:
                        error("Duplicate question ID across packages", code, qid)
                    all_ids.add(qid)
                    ids.append(qid)
                    pools.add(str(question.get("pool_uid") or ""))
                    qtype = question.get("type")
                    types[qtype] += 1
                    if qtype not in ALLOWED_TYPES:
                        error(f"Unsupported type {qtype}", code, qid)
                    if not (question.get("prompt_text") or question.get("prompt_html")):
                        error("Missing prompt", code, qid)
                    choices = question.get("choices") or []
                    correct = question.get("correct_choice_ids") or []
                    choice_ids = {str(row.get("id")) for row in choices}
                    if qtype in {"mcq", "true_false"} and (len(choices) < 2 or not correct or not set(map(str, correct)).issubset(choice_ids)):
                        error("Selected-response answer key is incomplete", code, qid)
                    if qtype == "fill_blank" and not (question.get("accepted_answers") or []):
                        error("Fill-blank answer key is missing", code, qid)
                    if qtype == "essay" and not (question.get("solution_text") or question.get("solution_html")):
                        essay_without_solution += 1
                        warning("Essay has no source solution", code, qid)

                    trust = question.get("trust") or {}
                    rights = question.get("rights") or {}
                    metadata = question.get("metadata") or {}
                    if trust.get("tier") != "publisher_key_direct" or trust.get("student_visible") is not True or trust.get("mapping_verified") is not True:
                        error("Direct trust/mapping contract is incomplete", code, qid)
                    if trust.get("manual_question_trust_required") is not False or trust.get("verification_basis") != "publisher-answer-key":
                        error("Manual Trust bypass or source-key basis is missing", code, qid)
                    if trust.get("mathematical_verified") is True and trust.get("independent_math_verified") is not True:
                        warning("Mathematical verification is claimed without independent verification evidence", code, qid)
                    if rights.get("student_publication_allowed") is not True or rights.get("public_web_publication_allowed") is not False:
                        error("Authenticated/private rights contract is invalid", code, qid)
                    if metadata.get("student_accessible") is not True or metadata.get("student_ready") is not True:
                        error("Student practice metadata is disabled", code, qid)

                    maps = question.get("course_mappings") or []
                    mapped_courses = [str(row.get("course") or "").strip() for row in maps]
                    if len(maps) != 1 or any(not course for course in mapped_courses):
                        error("Question must have exactly one course mapping", code, qid)
                    unsupported = sorted(set(mapped_courses) - ALLOWED_COURSES)
                    if unsupported:
                        error(f"Question contains unsupported course mappings {unsupported}", code, qid)
                    mapped_set = set(mapped_courses)
                    if target_courses and mapped_set != set(target_courses):
                        error(f"Question mappings {sorted(mapped_set)} do not match manifest targets {sorted(target_courses)}", code, qid)
                    if inferred_targets is None:
                        inferred_targets = mapped_set
                    elif not target_courses and mapped_set != inferred_targets:
                        error(f"Question mappings {sorted(mapped_set)} do not match inferred package targets {sorted(inferred_targets)}", code, qid)
                    for mapping in maps:
                        course = str(mapping.get("course") or "")
                        try:
                            unit = int(mapping.get("unit"))
                        except (TypeError, ValueError):
                            unit = 0
                        lesson = mapping.get("lesson_key")
                        lesson_title = mapping.get("lesson_title")
                        skill = mapping.get("skill_key")
                        if unit < 1 or not lesson or not lesson_title or not skill or mapping.get("mapping_verified") is not True:
                            error(f"Incomplete direct mapping for {course}", code, qid)
                        mapping_counts[(course, unit)] += 1
                        if unit == 0:
                            readiness[course] += 1
                    for image in question.get("images") or []:
                        media_refs += 1
                        source = str(image.get("source_path") or "").lstrip("/")
                        private = str(image.get("private_path") or "")
                        chapter_match = re.search(r"/chapter_(\d{2})/", private)
                        chapter = chapter_match.group(1) if chapter_match else f"{int((question.get('source') or {}).get('chapter') or 0):02d}"
                        if source and source not in media_inventory.get(chapter, set()):
                            error(f"Media missing from chapter_{chapter}.zip: {source}", code, qid)
                        if private and private != f"{slug}/chapter_{chapter}/{source}":
                            error("Private media path mismatch", code, qid)

            effective_targets = target_courses or sorted(inferred_targets or [])
            if manifest.get("questions") != len(ids):
                error("Manifest question count mismatch", code)
            if manifest.get("pools") != len(pools):
                error("Manifest pool count mismatch", code)
            info = {
                "file": package_path.name,
                "sha256": package_digest,
                "size_bytes": len(data),
                "bank_code": code,
                "target_courses": effective_targets,
                "questions": len(ids),
                "pools": len(pools),
                "media_files": media_files,
                "media_references": media_refs,
                "question_types": dict(types),
                "mapping_counts": {f"{course}:U{unit}": count for (course, unit), count in sorted(mapping_counts.items())},
                "readiness_counts": dict(readiness),
                "essay_without_solution": essay_without_solution,
            }
            report["packages"].append(info)
            totals["packages"] += 1
            totals["questions"] += len(ids)
            totals["pools"] += len(pools)
            totals["media_files"] += media_files
            totals["media_references"] += media_refs

    expected = registry.get("totals") or {}
    if expected and not args.skip_registry_totals and set(registry_by_code).issubset({row["bank_code"] for row in report["packages"]}):
        if totals["packages"] != expected.get("banks"):
            error(f"Expected {expected.get('banks')} packages, found {totals['packages']}")
        if totals["questions"] != expected.get("questions"):
            error(f"Expected {expected.get('questions')} questions, found {totals['questions']}")

    report["status"] = "FAIL" if report["errors"] else "PASS"
    report["totals"] = {**dict(totals), "unique_question_ids": len(all_ids), "errors": len(report["errors"]), "warnings": len(report["warnings"])}
    args.output_dir.mkdir(parents=True, exist_ok=True)
    (args.output_dir / "PRIVATE_BANK_VALIDATION.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    target_summary = sorted({course for row in report["packages"] for course in row.get("target_courses") or []})
    lines = [
        "# ECHS Private Bank Validation",
        "",
        f"**Result: {report['status']}**",
        "",
        f"- Questions: {totals['questions']:,}",
        f"- Unique IDs: {len(all_ids):,}",
        f"- Packages: {totals['packages']:,}",
        f"- Source pools: {totals['pools']:,}",
        f"- Media files: {totals['media_files']:,}",
        f"- Target courses: {', '.join(target_summary) or 'not declared'}",
        "",
        "## Use boundary",
        "",
        "- Every package targets exactly one course, and every question has exactly one verified unit/lesson mapping.",
        "- AP Calculus, AP Precalculus, IB Mathematics AI, Algebra 2, and Grade 9 private banks are supported.",
        "- Manual Question Trust review is not required for authenticated school practice when the package uses the direct source-key contract.",
        "- Source content and media remain private and are not published through GitHub Pages.",
    ]
    (args.output_dir / "PRIVATE_BANK_VALIDATION.md").write_text("\n".join(lines), encoding="utf-8")
    print(json.dumps({"status": report["status"], "totals": report["totals"]}, indent=2))
    return 1 if report["errors"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
