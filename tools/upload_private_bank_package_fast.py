#!/usr/bin/env python3
"""Fast, resumable importer for validated ECHS private-bank packages."""
from __future__ import annotations

import argparse
import hashlib
import io
import json
import mimetypes
import os
import urllib.error
import urllib.parse
import urllib.request
import zipfile
from datetime import datetime, timezone
from pathlib import Path, PurePosixPath


def canonical(value) -> bytes:
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode("utf-8")


def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def log(message: str) -> None:
    print(message, flush=True)


class Supabase:
    def __init__(self, url: str, key: str):
        self.url = url.rstrip("/")
        self.key = key

    def request(self, method: str, path: str, body: bytes | None = None, headers: dict[str, str] | None = None):
        merged = {
            "apikey": self.key,
            "authorization": f"Bearer {self.key}",
            "user-agent": "ECHS-Private-Bank-Importer/2.0-fast",
        }
        merged.update(headers or {})
        request = urllib.request.Request(f"{self.url}{path}", data=body, method=method, headers=merged)
        try:
            with urllib.request.urlopen(request, timeout=180) as response:
                data = response.read()
                return json.loads(data) if data and "json" in response.headers.get("content-type", "") else data
        except urllib.error.HTTPError as error:
            detail = error.read().decode("utf-8", errors="replace")
            raise RuntimeError(f"Supabase {method} {path} failed ({error.code}): {detail}") from error

    def upsert(self, table: str, rows: list[dict], conflict: str, *, return_rows: bool = False):
        if not rows:
            return []
        query = urllib.parse.urlencode({"on_conflict": conflict}, safe=",")
        preference = "resolution=merge-duplicates,return=representation" if return_rows else "resolution=merge-duplicates,return=minimal"
        return self.request("POST", f"/rest/v1/{table}?{query}", canonical(rows), {
            "content-type": "application/json", "prefer": preference,
        }) or []

    def patch(self, table: str, filters: dict[str, str], values: dict):
        query = "&".join(f"{urllib.parse.quote(k)}=eq.{urllib.parse.quote(str(v))}" for k, v in filters.items())
        return self.request("PATCH", f"/rest/v1/{table}?{query}", canonical(values), {
            "content-type": "application/json", "prefer": "return=minimal",
        })

    def upload(self, bucket: str, path: str, data: bytes, content_type: str):
        encoded = "/".join(urllib.parse.quote(part, safe="._+-") for part in path.split("/"))
        return self.request("POST", f"/storage/v1/object/{urllib.parse.quote(bucket, safe='')}/{encoded}", data, {
            "content-type": content_type, "x-upsert": "true",
        })


def package_root(archive: zipfile.ZipFile) -> str:
    manifests = [name for name in archive.namelist() if name.endswith("/bank-manifest.json")]
    if len(manifests) != 1:
        raise RuntimeError(f"Expected one bank-manifest.json, found {len(manifests)}")
    return str(PurePosixPath(manifests[0]).parent)


def batches(rows: list[dict], size: int):
    for index in range(0, len(rows), size):
        yield rows[index:index + size]


def direct_mappings(question: dict) -> tuple[list[str], list[str], list[str]]:
    mappings = question.get("course_mappings") or []
    by_course = {str(row.get("course") or ""): row for row in mappings}
    if set(by_course) != {"ap-precalculus", "ib-math-ai"} or len(mappings) != 2:
        raise RuntimeError(f"{question.get('id')} must have exactly one AP and one IB mapping")
    courses, lessons, skills = [], [], []
    for course in ("ap-precalculus", "ib-math-ai"):
        row = by_course[course]
        lesson, skill = str(row.get("lesson_key") or "").strip(), str(row.get("skill_key") or "").strip()
        if not lesson or not skill or row.get("mapping_verified") is not True:
            raise RuntimeError(f"{question.get('id')} has an incomplete mapping for {course}")
        courses.append(course); lessons.append(f"{course}:{lesson}"); skills.append(skill)
    return courses, lessons, skills


def validate_question(question: dict) -> None:
    trust, rights, metadata = question.get("trust") or {}, question.get("rights") or {}, question.get("metadata") or {}
    if trust.get("tier") != "publisher_key_direct" or trust.get("student_visible") is not True:
        raise RuntimeError(f"{question.get('id')} is not publisher-key direct")
    if not all(trust.get(key) is True for key in ("source_verified", "media_verified", "mapping_verified")):
        raise RuntimeError(f"{question.get('id')} is missing verification evidence")
    if trust.get("verification_basis") != "publisher-answer-key" or trust.get("manual_question_trust_required") is not False:
        raise RuntimeError(f"{question.get('id')} has an invalid verification contract")
    if rights.get("student_publication_allowed") is not True or metadata.get("student_ready") is not True:
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
    parser.add_argument("--bucket", default="private-question-banks")
    parser.add_argument("--batch-size", type=int, default=250)
    parser.add_argument("--skip-media", action="store_true")
    args = parser.parse_args()
    if not args.package.is_file() or not args.supabase_url or not args.service_role_key:
        raise SystemExit("Package, SUPABASE_URL, and SUPABASE_SERVICE_ROLE_KEY are required")
    client = Supabase(args.supabase_url, args.service_role_key)
    package_bytes = args.package.read_bytes()
    package_hash, now = digest(package_bytes), datetime.now(timezone.utc).isoformat()
    progress(client, args.request_id, 38, "Opening and validating bank package")

    with zipfile.ZipFile(args.package) as archive:
        root = package_root(archive)
        manifest = json.loads(archive.read(f"{root}/bank-manifest.json"))
        if manifest.get("trust_default") != "publisher_key_direct" or manifest.get("student_visible") is not True:
            raise RuntimeError("Package uses an obsolete trust policy")
        bank_code, bank_slug = manifest["bank_code"], manifest["bank_slug"]
        storage_path = f"{bank_slug}/imports/{package_hash}.zip"
        package_row = {
            "organization_id": args.organization_id, "bank_code": bank_code, "bank_slug": bank_slug,
            "display_aliases": manifest.get("display_aliases") or {},
            "package_fingerprint": manifest.get("package_fingerprint") or bank_code,
            "package_sha256": package_hash, "package_size_bytes": len(package_bytes),
            "question_count": int(manifest.get("questions") or 0), "pool_count": int(manifest.get("pools") or 0),
            "media_count": 0, "access": "private-school-authenticated", "trust_default": "publisher_key_direct",
            "deployment_state": "uploading", "storage_bucket": args.bucket, "storage_path": storage_path,
            "manifest": manifest, "imported_at": now, "updated_at": now,
        }
        returned = client.upsert("private_bank_packages", [package_row], "organization_id,bank_code", return_rows=True)
        package_id = returned[0]["id"]
        progress(client, args.request_id, 42, f"Registered {bank_code}; storing source package")
        client.upload(args.bucket, storage_path, package_bytes, "application/zip")

        rows, seen = [], set()
        for file_name in sorted(name for name in archive.namelist() if name.startswith(f"{root}/questions/") and name.endswith(".json")):
            for question in json.loads(archive.read(file_name)).get("questions") or []:
                question_id = str(question.get("id") or "")
                if not question_id or question_id in seen:
                    raise RuntimeError(f"Missing or duplicate question ID: {question_id}")
                seen.add(question_id); validate_question(question)
                course_keys, lesson_keys, skill_keys = direct_mappings(question)
                source = question.get("source") or {}
                rows.append({
                    "organization_id": args.organization_id, "question_id": question_id, "package_id": package_id,
                    "bank_code": bank_code, "pool_id": question.get("pool_id"), "chapter": source.get("chapter"),
                    "section": source.get("section"), "question_type": question.get("type") or "unknown",
                    "course_keys": course_keys, "lesson_keys": lesson_keys, "skill_candidates": skill_keys,
                    "course_mappings": question.get("course_mappings") or [], "mapping_verified": True,
                    "trust_tier": "publisher_key_direct", "student_visible": True,
                    "payload_sha256": digest(canonical(question)), "payload": question, "updated_at": now,
                })
        expected = int(manifest.get("questions") or 0)
        if len(rows) != expected:
            raise RuntimeError(f"Question count mismatch: expected {expected}, parsed {len(rows)}")
        total_batches = max(1, (len(rows) + args.batch_size - 1) // args.batch_size)
        for index, group in enumerate(batches(rows, args.batch_size), 1):
            client.upsert("private_bank_questions", group, "organization_id,question_id")
            done = min(index * args.batch_size, len(rows))
            percent = 45 + int(35 * index / total_batches)
            progress(client, args.request_id, percent, f"Questions imported: {done}/{len(rows)}")

        uploaded, media_rows = 0, []
        media_archives = sorted(name for name in archive.namelist() if name.startswith(f"{root}/media/") and name.endswith(".zip"))
        if not args.skip_media:
            for archive_index, media_name in enumerate(media_archives, 1):
                chapter_token = PurePosixPath(media_name).stem.replace("chapter_", "")
                chapter = int(chapter_token) if chapter_token.isdigit() else None
                with zipfile.ZipFile(io.BytesIO(archive.read(media_name))) as media_archive:
                    for source_path in sorted(name for name in media_archive.namelist() if not name.endswith("/")):
                        data = media_archive.read(source_path)
                        object_path = f"{bank_slug}/chapter_{(chapter or 0):02d}/{source_path.lstrip('/')}"
                        content_type = mimetypes.guess_type(source_path)[0] or "application/octet-stream"
                        client.upload(args.bucket, object_path, data, content_type)
                        media_rows.append({
                            "organization_id": args.organization_id, "package_id": package_id, "object_path": object_path,
                            "source_path": source_path, "chapter": chapter, "size_bytes": len(data),
                            "sha256": digest(data), "mime_type": content_type, "uploaded_at": now,
                        })
                        uploaded += 1
                        if len(media_rows) >= args.batch_size:
                            client.upsert("private_bank_media_objects", media_rows, "organization_id,object_path"); media_rows.clear()
                percent = 80 + int(17 * archive_index / max(1, len(media_archives)))
                progress(client, args.request_id, percent, f"Media archives uploaded: {archive_index}/{len(media_archives)} ({uploaded} files)")
            if media_rows:
                client.upsert("private_bank_media_objects", media_rows, "organization_id,object_path")

        state = "registered-direct" if args.skip_media else "complete-direct-upload"
        client.patch("private_bank_packages", {"organization_id": args.organization_id, "bank_code": bank_code}, {
            "deployment_state": state, "media_count": uploaded, "updated_at": datetime.now(timezone.utc).isoformat(),
        })
        result = {"bank_code": bank_code, "questions": len(rows), "media_uploaded": uploaded,
                  "package_sha256": package_hash, "deployment_state": state, "trust_tier": "publisher_key_direct"}
        log("IMPORT_RESULT=" + json.dumps(result, ensure_ascii=False, separators=(",", ":")))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
