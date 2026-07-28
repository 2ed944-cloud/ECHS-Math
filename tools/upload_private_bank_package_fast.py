#!/usr/bin/env python3
"""Fast, resumable importer for validated ECHS private-bank packages."""
from __future__ import annotations

import argparse
import hashlib
import io
import json
import mimetypes
import os
import time
import urllib.error
import urllib.parse
import urllib.request
import zipfile
from datetime import datetime, timezone
from pathlib import Path, PurePosixPath

SUPPORTED_COURSES = {
    "ap-precalculus",
    "ib-math-ai",
    "ap-calculus",
    "algebra-2",
    "grade-9",
}


def canonical(value) -> bytes:
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode("utf-8")


def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def log(message: str) -> None:
    print(message, flush=True)


class Supabase:
    TRANSIENT_HTTP = {408, 425, 429, 500, 502, 503, 504}

    def __init__(self, url: str, key: str):
        self.url = url.rstrip("/")
        self.key = key

    def request(
        self,
        method: str,
        path: str,
        body: bytes | None = None,
        headers: dict[str, str] | None = None,
        *,
        attempts: int = 1,
    ):
        merged = {
            "apikey": self.key,
            "authorization": f"Bearer {self.key}",
            "user-agent": "ECHS-Private-Bank-Importer/2.2-resumable-multicourse",
        }
        merged.update(headers or {})
        last_error: Exception | None = None
        for attempt in range(1, attempts + 1):
            request = urllib.request.Request(f"{self.url}{path}", data=body, method=method, headers=merged)
            try:
                with urllib.request.urlopen(request, timeout=180) as response:
                    data = response.read()
                    return json.loads(data) if data and "json" in response.headers.get("content-type", "") else data
            except urllib.error.HTTPError as error:
                detail = error.read().decode("utf-8", errors="replace")
                last_error = RuntimeError(f"Supabase {method} {path} failed ({error.code}): {detail}")
                if error.code not in self.TRANSIENT_HTTP or attempt == attempts:
                    raise last_error from error
            except (urllib.error.URLError, TimeoutError) as error:
                last_error = RuntimeError(f"Supabase {method} {path} failed: {error}")
                if attempt == attempts:
                    raise last_error from error
            delay = min(30, 2 ** (attempt - 1))
            log(f"Transient storage/API error; retrying in {delay}s ({attempt}/{attempts})")
            time.sleep(delay)
        raise last_error or RuntimeError("Supabase request failed")

    def upsert(self, table: str, rows: list[dict], conflict: str, *, return_rows: bool = False):
        if not rows:
            return []
        query = urllib.parse.urlencode({"on_conflict": conflict}, safe=",")
        preference = "resolution=merge-duplicates,return=representation" if return_rows else "resolution=merge-duplicates,return=minimal"
        return self.request("POST", f"/rest/v1/{table}?{query}", canonical(rows), {
            "content-type": "application/json", "prefer": preference,
        }, attempts=4) or []

    def patch(self, table: str, filters: dict[str, str], values: dict):
        query = "&".join(f"{urllib.parse.quote(k)}=eq.{urllib.parse.quote(str(v))}" for k, v in filters.items())
        return self.request("PATCH", f"/rest/v1/{table}?{query}", canonical(values), {
            "content-type": "application/json", "prefer": "return=minimal",
        }, attempts=4)

    def select_existing_media(self, organization_id: str, package_id: str) -> dict[str, str]:
        existing: dict[str, str] = {}
        offset, page_size = 0, 1000
        while True:
            query = urllib.parse.urlencode({
                "select": "object_path,sha256",
                "organization_id": f"eq.{organization_id}",
                "package_id": f"eq.{package_id}",
                "order": "object_path.asc",
            }, safe=",")
            rows = self.request("GET", f"/rest/v1/private_bank_media_objects?{query}", headers={
                "range": f"{offset}-{offset + page_size - 1}",
            }, attempts=4) or []
            for row in rows:
                existing[str(row.get("object_path") or "")] = str(row.get("sha256") or "")
            if len(rows) < page_size:
                break
            offset += page_size
        return existing

    def upload(self, bucket: str, path: str, data: bytes, content_type: str):
        encoded = "/".join(urllib.parse.quote(part, safe="._+-") for part in path.split("/"))
        return self.request("POST", f"/storage/v1/object/{urllib.parse.quote(bucket, safe='')}/{encoded}", data, {
            "content-type": content_type, "x-upsert": "true",
        }, attempts=7)


def package_root(archive: zipfile.ZipFile) -> str:
    manifests = [name for name in archive.namelist() if name.endswith("/bank-manifest.json")]
    if len(manifests) != 1:
        raise RuntimeError(f"Expected one bank-manifest.json, found {len(manifests)}")
    return str(PurePosixPath(manifests[0]).parent)


def batches(rows: list[dict], size: int):
    for index in range(0, len(rows), size):
        yield rows[index:index + size]


def manifest_target_courses(manifest: dict) -> list[str]:
    targets, seen = [], set()
    for value in manifest.get("target_courses") or []:
        course = str(value or "").strip()
        if not course or course in seen:
            raise RuntimeError("Manifest target_courses contains a blank or duplicate course")
        if course not in SUPPORTED_COURSES:
            raise RuntimeError(f"Manifest uses unsupported course {course!r}")
        seen.add(course)
        targets.append(course)
    return targets


def direct_mappings(question: dict, target_courses: list[str] | tuple[str, ...] = ()) -> tuple[list[str], list[str], list[str]]:
    mappings = question.get("course_mappings") or []
    if not mappings:
        raise RuntimeError(f"{question.get('id')} must have at least one verified course mapping")
    by_course: dict[str, dict] = {}
    input_order: list[str] = []
    for row in mappings:
        course = str(row.get("course") or "").strip()
        if not course or course in by_course:
            raise RuntimeError(f"{question.get('id')} has a missing or duplicate course mapping")
        if course not in SUPPORTED_COURSES:
            raise RuntimeError(f"{question.get('id')} has unsupported course mapping {course!r}")
        lesson = str(row.get("lesson_key") or "").strip()
        skill = str(row.get("skill_key") or "").strip()
        if not lesson or not skill or row.get("mapping_verified") is not True:
            raise RuntimeError(f"{question.get('id')} has an incomplete mapping for {course}")
        by_course[course] = row
        input_order.append(course)
    expected = list(target_courses)
    if expected and set(by_course) != set(expected):
        raise RuntimeError(
            f"{question.get('id')} mappings {sorted(by_course)} do not match package targets {sorted(expected)}"
        )
    ordered = expected or input_order
    return (
        ordered,
        [f"{course}:{str(by_course[course].get('lesson_key')).strip()}" for course in ordered],
        [str(by_course[course].get("skill_key")).strip() for course in ordered],
    )


def validate_question(question: dict) -> None:
    trust, rights, metadata = question.get("trust") or {}, question.get("rights") or {}, question.get("metadata") or {}
    if trust.get("tier") != "publisher_key_direct" or trust.get("student_visible") is not True:
        raise RuntimeError(f"{question.get('id')} is not publisher-key direct")
    if not all(trust.get(key) is True for key in ("source_verified", "media_verified", "mapping_verified")):
        raise RuntimeError(f"{question.get('id')} is missing verification evidence")
    if trust.get("verification_basis") != "publisher-answer-key" or trust.get("manual_question_trust_required") is not False:
        raise RuntimeError(f"{question.get('id')} has an invalid verification contract")
    if rights.get("student_publication_allowed") is not True or rights.get("public_web_publication_allowed") is not False:
        raise RuntimeError(f"{question.get('id')} has an invalid private-publication rights contract")
    if metadata.get("student_ready") is not True or metadata.get("student_accessible") is not True:
        raise RuntimeError(f"{question.get('id')} is not student-ready")


def progress(client: Supabase, request_id: str, percent: int, stage: str) -> None:
    log(f"[{percent:3d}%] {stage}")
    if request_id:
        client.patch("teacher_upload_requests", {"id": request_id}, {
            "progress": max(1, min(99, percent)), "stage": stage,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        })


def main() -> int:
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
    if expected_course and expected_course not in SUPPORTED_COURSES:
        raise SystemExit(f"Unsupported --expected-course {expected_course!r}")

    client = Supabase(args.supabase_url, args.service_role_key)
    package_bytes = args.package.read_bytes()
    package_hash, now = digest(package_bytes), datetime.now(timezone.utc).isoformat()
    progress(client, args.request_id, 38, "Opening and validating bank package")

    with zipfile.ZipFile(args.package) as archive:
        bad_member = archive.testzip()
        if bad_member:
            raise RuntimeError(f"ZIP CRC failure: {bad_member}")
        root = package_root(archive)
        manifest = json.loads(archive.read(f"{root}/bank-manifest.json"))
        if manifest.get("trust_default") != "publisher_key_direct" or manifest.get("student_visible") is not True:
            raise RuntimeError("Package uses an obsolete trust policy")
        if manifest.get("question_trust_review_required") is not False:
            raise RuntimeError("Package requires manual Question Trust review")
        declared_targets = manifest_target_courses(manifest)
        if expected_course and declared_targets and set(declared_targets) != {expected_course}:
            raise RuntimeError(
                f"Selected course {expected_course!r} does not match package targets {sorted(declared_targets)}"
            )
        required_targets = declared_targets or ([expected_course] if expected_course else [])

        prepared: list[tuple[dict, list[str], list[str], list[str]]] = []
        seen: set[str] = set()
        inferred_targets: list[str] = []
        for file_name in sorted(name for name in archive.namelist() if name.startswith(f"{root}/questions/") and name.endswith(".json")):
            payload = json.loads(archive.read(file_name))
            for question in payload.get("questions") or []:
                question_id = str(question.get("id") or "")
                if not question_id or question_id in seen:
                    raise RuntimeError(f"Missing or duplicate question ID: {question_id}")
                seen.add(question_id)
                validate_question(question)
                course_keys, lesson_keys, skill_keys = direct_mappings(question, required_targets or inferred_targets)
                if not required_targets and not inferred_targets:
                    inferred_targets = list(course_keys)
                prepared.append((question, course_keys, lesson_keys, skill_keys))
        effective_targets = required_targets or inferred_targets
        if not effective_targets:
            raise RuntimeError("Package contains no verified course targets")
        expected = int(manifest.get("questions") or 0)
        if len(prepared) != expected:
            raise RuntimeError(f"Question count mismatch: expected {expected}, parsed {len(prepared)}")

        bank_code, bank_slug = manifest["bank_code"], manifest["bank_slug"]
        storage_path = f"{bank_slug}/imports/{package_hash}.zip"
        stored_manifest = {**manifest, "target_courses": effective_targets}
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
            "trust_default": "publisher_key_direct",
            "deployment_state": "uploading",
            "storage_bucket": args.bucket,
            "storage_path": storage_path,
            "manifest": stored_manifest,
            "imported_at": now,
            "updated_at": now,
        }
        returned = client.upsert("private_bank_packages", [package_row], "organization_id,bank_code", return_rows=True)
        package_id = returned[0]["id"]
        progress(client, args.request_id, 42, f"Registered {bank_code}; storing source package")
        client.upload(args.bucket, storage_path, package_bytes, "application/zip")

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
                "trust_tier": "publisher_key_direct",
                "student_visible": True,
                "payload_sha256": digest(canonical(question)),
                "payload": question,
                "updated_at": now,
            })

        total_batches = max(1, (len(rows) + args.batch_size - 1) // args.batch_size)
        for index, group in enumerate(batches(rows, args.batch_size), 1):
            client.upsert("private_bank_questions", group, "organization_id,question_id")
            done = min(index * args.batch_size, len(rows))
            percent = 45 + int(35 * index / total_batches)
            progress(client, args.request_id, percent, f"Questions imported: {done}/{len(rows)}")

        uploaded, skipped, media_rows = 0, 0, []
        media_archives = sorted(name for name in archive.namelist() if name.startswith(f"{root}/media/") and name.endswith(".zip"))
        existing_media = client.select_existing_media(args.organization_id, package_id) if not args.skip_media else {}
        if existing_media:
            log(f"Resuming media import with {len(existing_media)} previously registered files")
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
                        data_hash = digest(data)
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
                percent = 80 + int(17 * archive_index / max(1, len(media_archives)))
                progress(client, args.request_id, percent, f"Media archives uploaded: {archive_index}/{len(media_archives)} · new {uploaded} · reused {skipped}")

        total_media = uploaded + skipped
        state = "registered-direct" if args.skip_media else "complete-direct-upload"
        client.patch("private_bank_packages", {"organization_id": args.organization_id, "bank_code": bank_code}, {
            "deployment_state": state,
            "media_count": total_media,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        })
        aliases = manifest.get("display_aliases") or {}
        result = {
            "bank_code": bank_code,
            "display_name": aliases.get("teacher") or aliases.get("student") or bank_code,
            "questions": len(rows),
            "media_uploaded": uploaded,
            "media_reused": skipped,
            "media_total": total_media,
            "target_courses": effective_targets,
            "package_sha256": package_hash,
            "deployment_state": state,
            "trust_tier": "publisher_key_direct",
        }
        log("IMPORT_RESULT=" + json.dumps(result, ensure_ascii=False, separators=(",", ":")))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
