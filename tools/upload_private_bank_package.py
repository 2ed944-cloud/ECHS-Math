#!/usr/bin/env python3
"""Upload one validated direct-linked ECHS private-bank package to Supabase.

Run only from a trusted machine or protected CI environment with the service-role key.
Source packages and media remain in a private bucket. Questions are available to
signed-in students through verified lesson mappings and source answer keys.
"""
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

SUPPORTED_COURSES = {
    "ap-precalculus",
    "ib-math-ai",
    "ap-calculus",
    "algebra-2",
    "grade-9",
}


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def canonical(value) -> bytes:
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode("utf-8")


class Supabase:
    def __init__(self, url: str, key: str, dry_run: bool = False):
        self.url, self.key, self.dry_run = url.rstrip("/"), key, dry_run

    def request(self, method: str, path: str, body: bytes | None = None, headers: dict[str, str] | None = None):
        if self.dry_run:
            return None
        merged = {"apikey": self.key, "authorization": f"Bearer {self.key}", "user-agent": "ECHS-Private-Bank-Importer/1.2"}
        merged.update(headers or {})
        request = urllib.request.Request(f"{self.url}{path}", data=body, method=method, headers=merged)
        try:
            with urllib.request.urlopen(request, timeout=180) as response:
                data = response.read()
                if not data:
                    return None
                return json.loads(data) if "json" in response.headers.get("content-type", "") else data
        except urllib.error.HTTPError as error:
            detail = error.read().decode("utf-8", errors="replace")
            raise RuntimeError(f"Supabase {method} {path} failed ({error.code}): {detail}") from error

    def upsert(self, table: str, rows: list[dict], conflict: str):
        if not rows:
            return []
        query = urllib.parse.urlencode({"on_conflict": conflict}, safe=",")
        return self.request("POST", f"/rest/v1/{table}?{query}", canonical(rows), {
            "content-type": "application/json", "prefer": "resolution=merge-duplicates,return=representation"
        }) or []

    def patch(self, table: str, filters: dict[str, str], values: dict):
        query = "&".join(f"{urllib.parse.quote(key)}=eq.{urllib.parse.quote(str(value))}" for key, value in filters.items())
        return self.request("PATCH", f"/rest/v1/{table}?{query}", canonical(values), {
            "content-type": "application/json", "prefer": "return=representation"
        })

    def upload(self, bucket: str, path: str, data: bytes, content_type: str):
        encoded = "/".join(urllib.parse.quote(part, safe="._+-") for part in path.split("/"))
        return self.request("POST", f"/storage/v1/object/{urllib.parse.quote(bucket, safe='')}/{encoded}", data, {
            "content-type": content_type, "x-upsert": "true"
        })


def package_root(archive: zipfile.ZipFile) -> str:
    manifests = [name for name in archive.namelist() if name.endswith("/bank-manifest.json")]
    if len(manifests) != 1:
        raise RuntimeError(f"Expected one bank-manifest.json, found {len(manifests)}")
    return str(PurePosixPath(manifests[0]).parent)


def batches(rows, size):
    for index in range(0, len(rows), size):
        yield rows[index:index + size]


def load_graph(path: Path) -> dict:
    if not path.is_file():
        raise RuntimeError(f"Knowledge graph not found: {path}")
    return json.loads(path.read_text(encoding="utf-8"))


def skill_rows(graph: dict) -> list[dict]:
    defaults = graph.get("skill_defaults") or {}
    default_representations = defaults.get("representations") or ["symbolic", "graphical", "numerical", "verbal", "contextual"]
    default_rules = defaults.get("evidence_rules") or {}
    course, now = str(graph.get("course") or ""), datetime.now(timezone.utc).isoformat()
    rows = []
    for skill in graph.get("skills") or []:
        lesson_ids = [str(value) for value in skill.get("lesson_ids") or []]
        topic = str(skill.get("topic") or (lesson_ids[0] if lesson_ids else ""))
        rows.append({
            "skill_key": str(skill["id"]), "course": course, "unit": str(skill.get("unit") or ""),
            "topic": topic or None, "title": str(skill.get("title") or skill["id"]),
            "description": str(skill.get("description") or skill.get("title") or skill["id"]),
            "ap_topics": [topic] if course in {"ap-precalculus", "ap-calculus"} and topic else [], "lesson_ids": lesson_ids,
            "prerequisites": [str(value) for value in skill.get("prerequisites") or []],
            "representations": [str(value) for value in skill.get("representations") or default_representations],
            "misconceptions": [str(value) for value in skill.get("misconceptions") or ["publisher-key-direct-independent-audit-not-claimed"]],
            "evidence_rules": skill.get("evidence_rules") or default_rules, "active": True, "updated_at": now,
        })
    return rows


def seed_graphs(client: Supabase, graph_paths: list[Path], batch_size: int):
    rows = [row for path in graph_paths for row in skill_rows(load_graph(path))]
    ids = [row["skill_key"] for row in rows]
    if len(ids) != len(set(ids)):
        raise RuntimeError("Knowledge graphs contain duplicate skill IDs")
    for group in batches(rows, batch_size):
        client.upsert("skill_definitions", group, "skill_key")
    print(f"Skill definitions registered: {len(rows)}")


def manifest_target_courses(manifest: dict) -> list[str]:
    targets, seen = [], set()
    for value in manifest.get("target_courses") or []:
        course = str(value or "").strip()
        if not course or course in seen:
            raise RuntimeError("Manifest target_courses contains a blank or duplicate course")
        if course not in SUPPORTED_COURSES:
            raise RuntimeError(f"Manifest uses unsupported course {course!r}")
        seen.add(course); targets.append(course)
    return targets


def direct_mappings(question: dict, target_courses: list[str] | tuple[str, ...] = ()) -> tuple[list[str], list[str], list[str]]:
    mappings = question.get("course_mappings") or []
    if not mappings:
        raise RuntimeError(f"{question.get('id')} must have at least one verified course mapping")
    by_course, order = {}, []
    for row in mappings:
        course = str(row.get("course") or "").strip()
        if not course or course in by_course:
            raise RuntimeError(f"{question.get('id')} has a missing or duplicate course mapping")
        if course not in SUPPORTED_COURSES:
            raise RuntimeError(f"{question.get('id')} has unsupported course mapping {course!r}")
        lesson, skill = str(row.get("lesson_key") or "").strip(), str(row.get("skill_key") or "").strip()
        if not lesson or not skill or row.get("mapping_verified") is not True:
            raise RuntimeError(f"{question.get('id')} has an incomplete direct mapping for {course}")
        by_course[course] = row; order.append(course)
    expected = list(target_courses)
    if expected and set(by_course) != set(expected):
        raise RuntimeError(f"{question.get('id')} mappings {sorted(by_course)} do not match package targets {sorted(expected)}")
    ordered = expected or order
    return ordered, [f"{course}:{str(by_course[course].get('lesson_key')).strip()}" for course in ordered], [str(by_course[course].get("skill_key")).strip() for course in ordered]


def validate_direct_question(question: dict):
    trust, rights, metadata = question.get("trust") or {}, question.get("rights") or {}, question.get("metadata") or {}
    if trust.get("tier") != "publisher_key_direct" or trust.get("student_visible") is not True:
        raise RuntimeError(f"{question.get('id')} is not a publisher-key direct question")
    if trust.get("source_verified") is not True or trust.get("media_verified") is not True or trust.get("mapping_verified") is not True:
        raise RuntimeError(f"{question.get('id')} is missing source, media, or mapping evidence")
    if trust.get("verification_basis") != "publisher-answer-key" or trust.get("manual_question_trust_required") is not False:
        raise RuntimeError(f"{question.get('id')} has an invalid direct-use verification contract")
    if rights.get("student_publication_allowed") is not True or rights.get("public_web_publication_allowed") is not False or metadata.get("student_ready") is not True:
        raise RuntimeError(f"{question.get('id')} is not enabled for authenticated student practice")
    if question.get("type") in {"mcq", "true_false"} and not question.get("correct_choice_ids"):
        raise RuntimeError(f"{question.get('id')} has no publisher answer key")
    if question.get("type") == "fill_blank" and not question.get("accepted_answers"):
        raise RuntimeError(f"{question.get('id')} has no accepted publisher answer")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("package", type=Path)
    parser.add_argument("--organization-id", default=os.getenv("ECHS_ORGANIZATION_ID", ""))
    parser.add_argument("--supabase-url", default=os.getenv("SUPABASE_URL", ""))
    parser.add_argument("--service-role-key", default=os.getenv("SUPABASE_SERVICE_ROLE_KEY", ""))
    parser.add_argument("--expected-course", default="")
    parser.add_argument("--bucket", default="private-question-banks")
    parser.add_argument("--batch-size", type=int, default=100)
    parser.add_argument("--ap-graph", type=Path, default=Path("data/knowledge-graph/ap-precalculus-v1.json"))
    parser.add_argument("--ib-graph", type=Path, default=Path("data/knowledge-graph/ib-math-ai-v1.json"))
    parser.add_argument("--skip-media", action="store_true")
    parser.add_argument("--skip-skill-seed", action="store_true")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    if not args.package.is_file(): raise SystemExit(f"Package not found: {args.package}")
    if not args.organization_id: raise SystemExit("--organization-id or ECHS_ORGANIZATION_ID is required")
    if not args.dry_run and (not args.supabase_url or not args.service_role_key): raise SystemExit("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required")
    if args.batch_size < 1 or args.batch_size > 500: raise SystemExit("--batch-size must be between 1 and 500")
    expected_course = str(args.expected_course or "").strip()
    if expected_course and expected_course not in SUPPORTED_COURSES: raise SystemExit(f"Unsupported --expected-course {expected_course!r}")

    client = Supabase(args.supabase_url or "https://dry-run.invalid", args.service_role_key or "dry-run", args.dry_run)
    if not args.skip_skill_seed: seed_graphs(client, [args.ap_graph, args.ib_graph], args.batch_size)
    package_bytes, now = args.package.read_bytes(), datetime.now(timezone.utc).isoformat()
    package_hash = sha256(package_bytes)
    with zipfile.ZipFile(args.package) as archive:
        bad=archive.testzip()
        if bad: raise RuntimeError(f"ZIP CRC failure: {bad}")
        root = package_root(archive); manifest = json.loads(archive.read(f"{root}/bank-manifest.json"))
        if manifest.get("trust_default") != "publisher_key_direct" or manifest.get("student_visible") is not True or manifest.get("question_trust_review_required") is not False:
            raise RuntimeError("The package was generated with an obsolete manual-Trust policy")
        declared_targets=manifest_target_courses(manifest)
        if expected_course and declared_targets and set(declared_targets)!={expected_course}:
            raise RuntimeError(f"Selected course {expected_course!r} does not match package targets {sorted(declared_targets)}")
        required_targets=declared_targets or ([expected_course] if expected_course else [])
        bank_code, bank_slug = manifest["bank_code"], manifest["bank_slug"]
        storage_path = f"{bank_slug}/imports/{package_hash}.zip"
        package_row = {
            "organization_id": args.organization_id, "bank_code": bank_code, "bank_slug": bank_slug,
            "display_aliases": manifest.get("display_aliases") or {}, "package_fingerprint": manifest.get("package_fingerprint") or bank_code,
            "package_sha256": package_hash, "package_size_bytes": len(package_bytes),
            "question_count": int(manifest.get("questions") or 0), "pool_count": int(manifest.get("pools") or 0),
            "media_count": sum(1 for name in archive.namelist() if "/media/" in name and name.endswith(".zip")),
            "access": "private-school-authenticated", "trust_default": "publisher_key_direct", "deployment_state": "uploading",
            "storage_bucket": args.bucket, "storage_path": storage_path, "manifest": manifest, "imported_at": now, "updated_at": now,
        }
        result = client.upsert("private_bank_packages", [package_row], "organization_id,bank_code")
        package_id = result[0]["id"] if result else "dry-run-package-id"
        if not args.dry_run: client.upload(args.bucket, storage_path, package_bytes, "application/zip")
        print(f"Package {bank_code}: {manifest.get('questions')} questions, {manifest.get('pools')} pools")

        question_rows, seen_questions, inferred_targets = [], set(), []
        question_files = sorted(name for name in archive.namelist() if name.startswith(f"{root}/questions/") and name.endswith(".json"))
        for file_name in question_files:
            for question in json.loads(archive.read(file_name)).get("questions") or []:
                question_id = str(question.get("id") or "")
                if not question_id or question_id in seen_questions: raise RuntimeError(f"Missing or duplicate question ID: {question_id}")
                seen_questions.add(question_id); validate_direct_question(question)
                course_keys, lesson_keys, skill_candidates = direct_mappings(question, required_targets or inferred_targets)
                if not required_targets and not inferred_targets: inferred_targets=list(course_keys)
                source = question.get("source") or {}
                question_rows.append({
                    "organization_id": args.organization_id, "question_id": question_id, "package_id": package_id,
                    "bank_code": bank_code, "pool_id": question.get("pool_id"), "chapter": source.get("chapter"), "section": source.get("section"),
                    "question_type": question.get("type") or "unknown", "course_keys": course_keys, "lesson_keys": lesson_keys,
                    "skill_candidates": skill_candidates, "course_mappings": question.get("course_mappings") or [],
                    "mapping_verified": True, "trust_tier": "publisher_key_direct", "student_visible": True,
                    "payload_sha256": sha256(canonical(question)), "payload": question, "updated_at": now,
                })
        expected_questions = int(manifest.get("questions") or 0)
        if len(question_rows) != expected_questions: raise RuntimeError(f"Question count mismatch: package={expected_questions}, parsed={len(question_rows)}")
        for index, group in enumerate(batches(question_rows, args.batch_size), 1):
            client.upsert("private_bank_questions", group, "organization_id,question_id")
            if index % 10 == 0 or index * args.batch_size >= len(question_rows): print(f"Question rows: {min(index * args.batch_size, len(question_rows))}/{len(question_rows)}")

        media_rows, uploaded_media = [], 0
        if not args.skip_media:
            for media_archive_name in sorted(name for name in archive.namelist() if name.startswith(f"{root}/media/") and name.endswith(".zip")):
                chapter_token = PurePosixPath(media_archive_name).stem.replace("chapter_", "")
                chapter = int(chapter_token) if chapter_token.isdigit() else None
                with zipfile.ZipFile(io.BytesIO(archive.read(media_archive_name))) as media_archive:
                    bad_media=media_archive.testzip()
                    if bad_media: raise RuntimeError(f"Media ZIP {media_archive_name} CRC failure: {bad_media}")
                    for source_path in sorted(name for name in media_archive.namelist() if not name.endswith("/")):
                        data = media_archive.read(source_path); object_path = f"{bank_slug}/chapter_{(chapter or 0):02d}/{source_path.lstrip('/')}"
                        content_type = mimetypes.guess_type(source_path)[0] or "application/octet-stream"
                        client.upload(args.bucket, object_path, data, content_type)
                        media_rows.append({"organization_id": args.organization_id, "package_id": package_id, "object_path": object_path,
                            "source_path": source_path, "chapter": chapter, "size_bytes": len(data), "sha256": sha256(data),
                            "mime_type": content_type, "uploaded_at": now})
                        uploaded_media += 1
                        if len(media_rows) >= args.batch_size:
                            client.upsert("private_bank_media_objects", media_rows, "organization_id,object_path"); media_rows.clear()
                        if uploaded_media % 500 == 0: print(f"Media objects uploaded: {uploaded_media}")
            if media_rows: client.upsert("private_bank_media_objects", media_rows, "organization_id,object_path")
        state = "registered-direct" if args.skip_media else "complete-direct-upload"
        client.patch("private_bank_packages", {"organization_id": args.organization_id, "bank_code": bank_code}, {
            "deployment_state": state, "media_count": uploaded_media, "updated_at": datetime.now(timezone.utc).isoformat()
        })
        effective_targets=required_targets or inferred_targets
        aliases=manifest.get("display_aliases") or {}
        print(json.dumps({"bank_code": bank_code, "display_name": aliases.get("teacher") or aliases.get("student") or bank_code,
            "questions": len(question_rows), "media_uploaded": uploaded_media, "target_courses": effective_targets,
            "package_sha256": package_hash, "deployment_state": state, "trust_tier": "publisher_key_direct", "dry_run": args.dry_run}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
