#!/usr/bin/env python3
"""Teacher-manager importer for publisher-key and independently verified private banks."""
from __future__ import annotations

import argparse
import io
import json
import mimetypes
import os
import sys
import zipfile
from datetime import datetime, timezone
from pathlib import Path, PurePosixPath

import upload_private_bank_package_fast as base

VERIFIED_TIER = "student_ready_verified"
VERIFIED_BASIS = "independent-solution-audit"


def archive_root(archive: zipfile.ZipFile) -> str:
    root = base.package_root(archive)
    roots = {name.split("/", 1)[0] for name in archive.namelist() if "/" in name}
    if roots != {root}:
        raise RuntimeError(f"Package must contain exactly one root folder; found {sorted(roots)}")
    return root


def inspect_trust(package: Path) -> str:
    with zipfile.ZipFile(package) as archive:
        root = archive_root(archive)
        manifest = json.loads(archive.read(f"{root}/bank-manifest.json"))
    return str(manifest.get("trust_default") or "")


def validate_verified_question(question: dict) -> None:
    trust = question.get("trust") or {}
    rights = question.get("rights") or {}
    metadata = question.get("metadata") or {}
    if trust.get("tier") != VERIFIED_TIER or trust.get("student_visible") is not True:
        raise RuntimeError(f"{question.get('id')} is not student-ready verified")
    required = (
        "source_verified",
        "mathematical_verified",
        "independent_math_verified",
        "media_verified",
        "mapping_verified",
    )
    if not all(trust.get(key) is True for key in required):
        raise RuntimeError(f"{question.get('id')} is missing independent verification evidence")
    if trust.get("verification_basis") != VERIFIED_BASIS or trust.get("manual_question_trust_required") is not False:
        raise RuntimeError(f"{question.get('id')} has an invalid independent verification contract")
    if rights.get("student_publication_allowed") is not True or rights.get("public_web_publication_allowed") is not False:
        raise RuntimeError(f"{question.get('id')} has an invalid private-publication rights contract")
    if metadata.get("student_ready") is not True or metadata.get("student_accessible") is not True:
        raise RuntimeError(f"{question.get('id')} is not student-ready")
    qtype = str(question.get("type") or "")
    if qtype in {"mcq", "true_false"} and not question.get("correct_choice_ids"):
        raise RuntimeError(f"{question.get('id')} has no selected-response answer key")
    if qtype == "fill_blank" and not question.get("accepted_answers"):
        raise RuntimeError(f"{question.get('id')} has no accepted answer")
    if qtype == "essay" and not (question.get("solution_text") or question.get("solution_html")):
        raise RuntimeError(f"{question.get('id')} has no worked solution")


def verified_main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("package", type=Path)
    parser.add_argument("--organization-id", required=True)
    parser.add_argument("--supabase-url", default=os.getenv("SUPABASE_URL", ""))
    parser.add_argument("--service-role-key", default=os.getenv("SUPABASE_SERVICE_ROLE_KEY", ""))
    parser.add_argument("--request-id", default=os.getenv("ECHS_UPLOAD_REQUEST_ID", ""))
    parser.add_argument("--expected-course", default="")
    parser.add_argument("--bucket", default="private-question-banks")
    parser.add_argument("--batch-size", type=int, default=250)
    parser.add_argument("--skip-media", action="store_true")
    args = parser.parse_args()
    if not args.package.is_file() or not args.supabase_url or not args.service_role_key:
        raise SystemExit("Package, SUPABASE_URL, and SUPABASE_SERVICE_ROLE_KEY are required")
    if args.batch_size < 1 or args.batch_size > 500:
        raise SystemExit("--batch-size must be between 1 and 500")
    expected_course = str(args.expected_course or "").strip()
    if expected_course and expected_course not in base.SUPPORTED_COURSES:
        raise SystemExit(f"Unsupported --expected-course {expected_course!r}")

    client = base.Supabase(args.supabase_url, args.service_role_key)
    package_bytes = args.package.read_bytes()
    package_hash = base.digest(package_bytes)
    now = datetime.now(timezone.utc).isoformat()
    base.progress(client, args.request_id, 38, "Opening and validating verified bank package")

    with zipfile.ZipFile(args.package) as archive:
        bad_member = archive.testzip()
        if bad_member:
            raise RuntimeError(f"ZIP CRC failure: {bad_member}")
        root = archive_root(archive)
        manifest = json.loads(archive.read(f"{root}/bank-manifest.json"))
        if manifest.get("trust_default") != VERIFIED_TIER:
            raise RuntimeError("Verified importer requires student_ready_verified trust")
        if manifest.get("student_visible") is not True or manifest.get("question_trust_review_required") is not False:
            raise RuntimeError("Package is not enabled for authenticated student practice")
        if manifest.get("verification_basis") != VERIFIED_BASIS:
            raise RuntimeError("Package verification basis must be independent-solution-audit")

        declared_targets = base.manifest_target_courses(manifest)
        if expected_course and declared_targets and set(declared_targets) != {expected_course}:
            raise RuntimeError(
                f"Selected course {expected_course!r} does not match package targets {sorted(declared_targets)}"
            )
        required_targets = declared_targets or ([expected_course] if expected_course else [])

        prepared: list[tuple[dict, list[str], list[str], list[str]]] = []
        seen: set[str] = set()
        inferred_targets: list[str] = []
        question_files = sorted(
            name for name in archive.namelist()
            if name.startswith(f"{root}/questions/") and name.endswith(".json")
        )
        if not question_files:
            raise RuntimeError("Package contains no question chunks under questions/")
        for file_name in question_files:
            payload = json.loads(archive.read(file_name))
            for question in payload.get("questions") or []:
                question_id = str(question.get("id") or "")
                if not question_id or question_id in seen:
                    raise RuntimeError(f"Missing or duplicate question ID: {question_id}")
                seen.add(question_id)
                validate_verified_question(question)
                course_keys, lesson_keys, skill_keys = base.direct_mappings(
                    question, required_targets or inferred_targets
                )
                if not required_targets and not inferred_targets:
                    inferred_targets = list(course_keys)
                prepared.append((question, course_keys, lesson_keys, skill_keys))

        effective_targets = required_targets or inferred_targets
        if not effective_targets:
            raise RuntimeError("Package contains no verified course targets")
        expected = int(manifest.get("questions") or 0)
        if len(prepared) != expected:
            raise RuntimeError(f"Question count mismatch: expected {expected}, parsed {len(prepared)}")

        bank_code = str(manifest["bank_code"])
        bank_slug = str(manifest["bank_slug"])
        storage_path = f"{bank_slug}/imports/{package_hash}.zip"
        package_row = {
            "organization_id": args.organization_id,
            "bank_code": bank_code,
            "bank_slug": bank_slug,
            "display_aliases": manifest.get("display_aliases") or {},
            "package_fingerprint": manifest.get("package_fingerprint") or bank_code,
            "package_sha256": package_hash,
            "package_size_bytes": len(package_bytes),
            "question_count": expected,
            "pool_count": int(manifest.get("pools") or 0),
            "media_count": 0,
            "access": "private-school-authenticated",
            "trust_default": VERIFIED_TIER,
            "deployment_state": "uploading",
            "storage_bucket": args.bucket,
            "storage_path": storage_path,
            "manifest": {**manifest, "target_courses": effective_targets},
            "imported_at": now,
            "updated_at": now,
        }
        returned = client.upsert(
            "private_bank_packages", [package_row], "organization_id,bank_code", return_rows=True
        )
        package_id = returned[0]["id"]
        base.progress(client, args.request_id, 42, f"Registered {bank_code}; storing source package")
        client.upload(args.bucket, storage_path, package_bytes, "application/zip")

        trust_rows = []
        for question, _course_keys, _lesson_keys, skill_keys in prepared:
            rights = question.get("rights") or {}
            trust_rows.append({
                "question_id": str(question["id"]),
                "trust_tier": VERIFIED_TIER,
                "student_visible": True,
                "source_verified": True,
                "mathematical_verified": True,
                "media_verified": True,
                "mapping_verified": True,
                "rights_status": str(rights.get("status") or "school-authorized-private"),
                "skill_keys": skill_keys,
                "blockers": [],
                "evidence": {
                    "verification_basis": VERIFIED_BASIS,
                    "independent_math_verified": True,
                    "bank_code": bank_code,
                    "package_sha256": package_hash,
                },
                "updated_at": now,
            })
        for group in base.batches(trust_rows, args.batch_size):
            client.upsert("question_trust_records", group, "question_id")
        base.progress(client, args.request_id, 44, f"Question Trust records registered: {len(trust_rows)}")

        rows = []
        for question, course_keys, lesson_keys, skill_keys in prepared:
            source = question.get("source") or {}
            rows.append({
                "organization_id": args.organization_id,
                "question_id": str(question["id"]),
                "package_id": package_id,
                "bank_code": bank_code,
                "pool_id": question.get("pool_id"),
                "chapter": source.get("chapter"),
                "section": source.get("section"),
                "question_type": question.get("type") or "unknown",
                "course_keys": course_keys,
                "lesson_keys": lesson_keys,
                "skill_candidates": skill_keys,
                "course_mappings": question.get("course_mappings") or [],
                "mapping_verified": True,
                "trust_tier": VERIFIED_TIER,
                "student_visible": True,
                "payload_sha256": base.digest(base.canonical(question)),
                "payload": question,
                "updated_at": now,
            })
        total_batches = max(1, (len(rows) + args.batch_size - 1) // args.batch_size)
        for index, group in enumerate(base.batches(rows, args.batch_size), 1):
            client.upsert("private_bank_questions", group, "organization_id,question_id")
            done = min(index * args.batch_size, len(rows))
            percent = 45 + int(35 * index / total_batches)
            base.progress(client, args.request_id, percent, f"Questions imported: {done}/{len(rows)}")

        media_archives = sorted(
            name for name in archive.namelist()
            if name.startswith(f"{root}/media/") and name.endswith(".zip")
        )
        declared_media = {f"{root}/{rel}" for rel in manifest.get("media_packages") or []}
        if declared_media != set(media_archives):
            raise RuntimeError("Media archives do not match bank-manifest.json")
        uploaded, skipped, media_rows = 0, 0, []
        existing_media = client.select_existing_media(args.organization_id, package_id) if not args.skip_media else {}
        if not args.skip_media:
            for archive_index, media_name in enumerate(media_archives, 1):
                chapter_token = PurePosixPath(media_name).stem.replace("chapter_", "")
                chapter = int(chapter_token) if chapter_token.isdigit() else None
                with zipfile.ZipFile(io.BytesIO(archive.read(media_name))) as media_archive:
                    bad_media = media_archive.testzip()
                    if bad_media:
                        raise RuntimeError(f"Media ZIP {media_name} CRC failure: {bad_media}")
                    for source_path in sorted(name for name in media_archive.namelist() if not name.endswith("/")):
                        data = media_archive.read(source_path)
                        object_path = f"{bank_slug}/chapter_{(chapter or 0):02d}/{source_path.lstrip('/')}"
                        data_hash = base.digest(data)
                        if existing_media.get(object_path) == data_hash:
                            skipped += 1
                            continue
                        content_type = mimetypes.guess_type(source_path)[0] or "application/octet-stream"
                        client.upload(args.bucket, object_path, data, content_type)
                        media_rows.append({
                            "organization_id": args.organization_id,
                            "package_id": package_id,
                            "object_path": object_path,
                            "source_path": source_path,
                            "chapter": chapter,
                            "size_bytes": len(data),
                            "sha256": data_hash,
                            "mime_type": content_type,
                            "uploaded_at": now,
                        })
                        uploaded += 1
                        if len(media_rows) >= args.batch_size:
                            client.upsert("private_bank_media_objects", media_rows, "organization_id,object_path")
                            media_rows.clear()
                if media_rows:
                    client.upsert("private_bank_media_objects", media_rows, "organization_id,object_path")
                    media_rows.clear()
                base.progress(
                    client,
                    args.request_id,
                    80 + int(17 * archive_index / max(1, len(media_archives))),
                    f"Media archives uploaded: {archive_index}/{len(media_archives)} · new {uploaded} · reused {skipped}",
                )

        state = "registered-verified" if args.skip_media else "complete-verified-upload"
        client.patch(
            "private_bank_packages",
            {"organization_id": args.organization_id, "bank_code": bank_code},
            {"deployment_state": state, "media_count": uploaded + skipped, "updated_at": datetime.now(timezone.utc).isoformat()},
        )
        aliases = manifest.get("display_aliases") or {}
        result = {
            "bank_code": bank_code,
            "display_name": aliases.get("teacher") or aliases.get("student") or bank_code,
            "questions": len(rows),
            "trust_records": len(trust_rows),
            "media_uploaded": uploaded,
            "media_reused": skipped,
            "media_total": uploaded + skipped,
            "target_courses": effective_targets,
            "package_sha256": package_hash,
            "deployment_state": state,
            "trust_tier": VERIFIED_TIER,
        }
        base.log("IMPORT_RESULT=" + json.dumps(result, ensure_ascii=False, separators=(",", ":")))
    return 0


def main() -> int:
    if len(sys.argv) < 2:
        raise SystemExit("Package path is required")
    package = Path(sys.argv[1])
    trust = inspect_trust(package)
    if trust == "publisher_key_direct":
        return base.main()
    if trust == VERIFIED_TIER:
        return verified_main()
    raise RuntimeError(f"Unsupported package trust policy {trust!r}")


if __name__ == "__main__":
    raise SystemExit(main())
