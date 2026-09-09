#!/usr/bin/env python3
"""Project the approved official bank into a separate Pages artifact.

This is a distribution boundary, not a confidentiality claim about public Git
source/history or a visual audit of the approved source-page images. Canonical
source is read-only. No question text is included in this tool's reports.
"""
from __future__ import annotations

import argparse
import copy
import hashlib
import html
import json
import re
import shutil
import xml.etree.ElementTree as ET
from pathlib import Path

OFFICIAL = "question-bank/official"
STUDENT = f"{OFFICIAL}/data/student"
TRUST = f"{OFFICIAL}/admin/data/question-trust-manifest.json"
BOUNDARY = f"{STUDENT}/publication-boundary.json"
CONTRACT = "echs.public-question-boundary.v1"
BOUNDARY_SHA256 = "c4fcdce623c44155185719ab4612045a5f3ef7fd1b979a7019c3e68655b13069"
COUNTS = {"student_ready": 1104, "archive_records": 1217, "restricted_archive": 113,
          "direct_media": 1193, "media_files": 1277}
PACKAGING_ROOTS = (".staging", "packages", ".deploy", ".echs-backups", "artifacts")
STUDENT_FILES = frozenset(
    ["archive-id-map.json", "archive-index.json", "catalog.json", "gate.json",
     "id-map.json", "media-manifest.json", "question-index.json"]
    + [f"questions/chunk-{i:03}.json" for i in range(16)]
    + [f"archive-questions/chunk-{i:03}.json" for i in range(21)]
)
RIGHTS_FILES = frozenset(["README.md", "echs-ap-official-student-practice-2026-07-28.json"])
ARCHIVE_MESSAGE = "This record is indexed for reference. Its question content is not included in the public student release."

# A closed metadata projection. Each scalar/list has a checked type and bound;
# no unlisted legacy field is copied (including OCR, hints and reviewer notes).
ARCHIVE_TOP_FIELDS = {
    "id": "str", "course": "str", "courseId": "str", "assessmentFamily": "str",
    "type": "str", "format": "str", "year": "nullable-int", "form": "str",
    "questionNumber": "str", "section": "str", "calculator": "str",
    "maxPoints": "int", "estimatedTime": "nullable-int", "contentStatus": "str",
}
ARCHIVE_NESTED_FIELDS = {
    "source": {"organization": "str", "publisher": "str", "bankName": "str",
               "sourceType": "str", "officialStatus": "str", "releaseStatus": "str",
               "accessLevel": "str", "rightsStatus": "str", "publicPublicationAllowed": "bool",
               "sourcePages": "int-list"},
    "classification": {"primaryUnit": "int", "primaryUnitLabel": "str", "primaryTopic": "str",
                       "topicCode": "str", "lessonIds": "str-list", "learningObjectives": "str-list",
                       "skillCategories": "str-list", "representations": "str-list"},
    "pedagogy": {"difficulty": "int", "difficultyLabel": "str"},
    "audit": {"overallStatus": "str", "reviewRequired": "bool", "auditedAt": "str"},
}
ARCHIVE_FLAGS = {"studentEligible": False, "studentAccessible": True, "studentReady": False,
                 "deploymentAccess": "archive-metadata-only", "archiveMessage": ARCHIVE_MESSAGE}
INDEX_FIELDS = {key: "str" for key in (
    "id course courseId family type form number section calculator unitLabel topic topicCode "
    "difficultyLabel officialStatus accessLevel readiness deploymentAccess contentStatus auditStatus "
    "mediaStatus mappingStatus archiveStatus").split()}
INDEX_FIELDS.update({key: "nullable-int" for key in ("year", "unit", "difficulty")})
INDEX_FIELDS.update({key: "str-list" for key in ("lessons", "learningObjectives", "skills", "concepts", "representations")})
INDEX_FIELDS.update({key: "bool" for key in (
    "publicAllowed needsReview answerVerified mediaVerified mathVerified mappingVerified hasMedia hasHints "
    "studentEligible studentAccessible studentReady reviewRequired").split()})


class ProjectionError(ValueError):
    """A sanitized build failure, without source question content."""


def fail(message: str) -> None:
    raise ProjectionError(message)


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def read_json(path: Path):
    if path.stat().st_size > 32 * 1024 * 1024:
        fail("Question artifact JSON exceeds its bounded input size")

    def pairs(entries):
        result = {}
        for key, value in entries:
            if key in result:
                fail("Question artifact JSON contains duplicate keys")
            result[key] = value
        return result

    try:
        return json.loads(path.read_text(encoding="utf-8"), object_pairs_hook=pairs,
                          parse_constant=lambda _: fail("Nonfinite JSON is not accepted"))
    except (UnicodeError, json.JSONDecodeError):
        fail("Question artifact JSON is malformed")


def write_json(path: Path, value) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes((json.dumps(value, ensure_ascii=False, indent=2, allow_nan=False) + "\n").encode("utf-8"))


def checked_value(value, kind: str):
    if kind == "str":
        valid = isinstance(value, str) and len(value) <= 2048 and not re.search(r"[\x00-\x08\x0b\x0c\x0e-\x1f]", value)
    elif kind == "bool":
        valid = type(value) is bool
    elif kind in ("int", "nullable-int"):
        valid = (value is None and kind == "nullable-int") or (type(value) is int and 0 <= value <= 100000)
    elif kind in ("str-list", "int-list"):
        valid = isinstance(value, list) and len(value) <= 100
        if valid:
            for item in value:
                checked_value(item, "str" if kind == "str-list" else "int")
    else:
        valid = False
    if not valid:
        fail("Archive metadata field has an unsupported type or size")
    return copy.deepcopy(value)


def project_fields(source: dict, schema: dict) -> dict:
    if not isinstance(source, dict) or not set(schema).issubset(source):
        fail("Archive metadata is missing required fields")
    return {key: checked_value(source[key], kind) for key, kind in schema.items()}


def project_archive_record(record: dict) -> dict:
    result = project_fields(record, ARCHIVE_TOP_FIELDS)
    for key, schema in ARCHIVE_NESTED_FIELDS.items():
        result[key] = project_fields(record.get(key), schema)
    result.update(ARCHIVE_FLAGS)
    return result


def validate_archive_record(record: dict) -> bool:
    expected = set(ARCHIVE_TOP_FIELDS) | set(ARCHIVE_NESTED_FIELDS) | set(ARCHIVE_FLAGS)
    if not isinstance(record, dict) or set(record) != expected:
        return False
    if any(type(record[key]) is not type(value) or record[key] != value for key, value in ARCHIVE_FLAGS.items()):
        return False
    try:
        if project_archive_record(record) != record:
            return False
        return all(set(record[key]) == set(schema) for key, schema in ARCHIVE_NESTED_FIELDS.items())
    except ProjectionError:
        return False


def project_archive_index(row: dict) -> dict:
    result = project_fields(row, INDEX_FIELDS)
    # Search is rebuilt from explicitly selected catalog metadata, never OCR or
    # the inherited raw source search string.
    result["search"] = " ".join(str(result[key]) for key in (
        "id", "course", "courseId", "family", "year", "type", "topicCode", "topic", "archiveStatus"
    ) if result[key] is not None).lower()
    result.update({"studentReady": False, "studentEligible": False, "studentAccessible": True,
                   "hasMedia": False, "hasHints": False, "deploymentAccess": "archive-metadata-only"})
    return result


def validate_archive_index(row: dict) -> bool:
    if not isinstance(row, dict) or set(row) != set(INDEX_FIELDS) | {"search"} or not isinstance(row.get("search"), str):
        return False
    try:
        return project_archive_index(row) == row
    except ProjectionError:
        return False


def regular_files(root: Path) -> set[str]:
    if not root.is_dir() or root.is_symlink():
        fail("A required question boundary directory is missing or unsafe")
    result = set()
    for path in root.rglob("*"):
        if path.is_symlink():
            fail("Question boundary does not accept symlinked inputs")
        if path.is_file():
            result.add(path.relative_to(root).as_posix())
    return result


def chunk_rows(root: Path, names: list[str]) -> tuple[dict[str, dict], dict[str, dict]]:
    documents = {}; rows = {}
    for name in names:
        doc = read_json(root / name)
        if not isinstance(doc, dict) or set(doc) != {"questions"} or not isinstance(doc["questions"], list):
            fail("Question chunks have an unsupported shape")
        documents[name] = doc
        for row in doc["questions"]:
            if not isinstance(row, dict) or not isinstance(row.get("id"), str) or row["id"] in rows:
                fail("Question identity is invalid or duplicated")
            rows[row["id"]] = row
    return documents, rows


def media_paths(value) -> set[str]:
    result = set()
    if isinstance(value, dict):
        for key, child in value.items():
            if key == "path" and isinstance(child, str) and child.startswith("media/"):
                result.add(child)
            result.update(media_paths(child))
    elif isinstance(value, list):
        for child in value:
            result.update(media_paths(child))
    return result


def media_closure(official: Path, rows: dict[str, dict]) -> tuple[set[str], set[str]]:
    direct = media_paths(list(rows.values())); closure = set(direct); pending = list(direct)
    media_root = (official / "media").resolve()
    while pending:
        relative = pending.pop()
        if not re.fullmatch(r"media/(?:[A-Za-z0-9_.-]+/)*[A-Za-z0-9_.-]+", relative):
            fail("Approved media has an unsupported local path")
        path = official / relative
        if path.is_symlink() or not path.is_file() or not path.resolve().is_relative_to(media_root):
            fail("Approved media dependency is missing or escapes its root")
        if path.suffix.lower() not in {".svg", ".png", ".jpg", ".jpeg", ".webp"}:
            fail("Approved media has an unsupported file type")
        if path.suffix.lower() != ".svg":
            continue
        if path.stat().st_size > 16 * 1024 * 1024:
            fail("Approved SVG exceeds the bounded dependency reader")
        text = path.read_text(encoding="utf-8")
        if re.search(r"<\s*(?:script|foreignObject)\b|\son[a-z]+\s*=|<!ENTITY|<!DOCTYPE", text, re.I):
            fail("Approved SVG contains unsupported active markup")
        try:
            svg = ET.fromstring(text)
        except ET.ParseError:
            fail("Approved SVG dependency markup is malformed")
        references = []
        for node in svg.iter():
            if node.tag.rsplit("}", 1)[-1].lower() in {"script", "foreignobject"}:
                fail("Approved SVG contains unsupported active elements")
            for attribute, value in node.attrib.items():
                local = attribute.rsplit("}", 1)[-1].lower()
                if local.startswith("on"):
                    fail("Approved SVG contains an event handler")
                if local == "href":
                    references.append(value)
        references += re.findall(r"url\([\"']?([^\)\"']+)", text)
        for raw in references:
            ref = html.unescape(raw)
            if ref.startswith("#"):
                continue
            if ref.startswith("data:"):
                if not re.fullmatch(r"data:image/(?:png|jpeg|webp);base64,[A-Za-z0-9+/=\s]+", ref):
                    fail("Approved SVG contains an unsupported embedded resource")
                continue
            if not re.fullmatch(r"(?:\.\./)*(?:[A-Za-z0-9_.-]+/)*[A-Za-z0-9_.-]+", ref):
                fail("Approved media contains an unsupported external or encoded dependency")
            target = (path.parent / ref).resolve()
            if not target.is_relative_to(media_root):
                fail("Approved media dependency escapes the media root")
            dependency = target.relative_to(official.resolve()).as_posix()
            if dependency not in closure:
                closure.add(dependency); pending.append(dependency)
    return direct, closure


SAFE_CONFIG = "window.ECHS_ADMIN_MODE=false;window.ECHS_DATA_ROOT='../data/student';window.ECHS_ARCHIVE_DATA_ROOT='../data/student';window.ECHS_ASSET_ROOT='../';"
PUBLIC_NOTICE = '<div class="notice" id="public-review-boundary"><strong>Approved public review</strong><p>This Pages workspace reviews approved student-ready questions. Raw archival datasets and correction batches are not served here. <a href="private-bank-center.html">Open the authenticated Private Bank Center</a> for school-managed private content.</p></div>'


def public_shell(source: str, kind: str) -> str:
    if kind not in ("teacher", "import"):
        fail("Unsupported public review shell")
    configs = re.findall(r"<script>(window\.ECHS_ADMIN_MODE=true;.*?)</script>", source, re.S)
    if len(configs) != 1 or not configs[0].startswith("window.ECHS_ADMIN_MODE=true;window.ECHS_DATA_ROOT='../data';window.ECHS_ARCHIVE_DATA_ROOT='../data/student';window.ECHS_ASSET_ROOT='../';"):
        fail("Public review source configuration drifted")
    # The exact inline configuration must contain only fixed ECHS declarations.
    expected = "window.ECHS_ADMIN_MODE=true;window.ECHS_DATA_ROOT='../data';window.ECHS_ARCHIVE_DATA_ROOT='../data/student';window.ECHS_ASSET_ROOT='../';"
    if kind == "teacher":
        urls = ["../data/admin-audit-overrides.json", "../data/admin-audit-overrides-1970.json", "../data/admin-audit-overrides-1971-1975.json"]
        urls += [f"../data/admin-audit-overrides-{year}.json" for year in range(1976, 1996)]
        expected += "window.ECHS_AUDIT_OVERRIDES_URLS=[" + ",".join("'" + url + "'" for url in urls) + "];"
    if configs[0] != expected:
        fail("Public review inline configuration has unsupported changes")
    result = source.replace(configs[0], SAFE_CONFIG)
    if kind == "teacher":
        tag = '<script src="audit-overrides.js"></script>'
        if result.count(tag) != 1:
            fail("Public review overlay script shape drifted")
        result = result.replace(tag, "")
        old = "The full 1,217-record canonical bank is available here. Independently verified correction overlays are applied before records are displayed. Student-ready status cannot be changed by this browser page; promotion still requires the audited release pipeline and applicable publication rights."
        new = "This public review uses the 1,104 approved student-ready records. Raw canonical records and correction overlays remain outside the Pages artifact. Student-ready status cannot be changed by this browser page; promotion still requires the audited release pipeline and applicable publication rights."
        if result.count(old) != 1:
            fail("Public review description drifted")
        result = result.replace(old, new)
    # Insert one explicit notice immediately inside main, retaining all existing
    # form IDs and navigable URLs used by the read-only public tooling.
    match = re.search(r"<main\b[^>]*>", result)
    if not match or len(re.findall(r"<main\b", result)) != 1:
        fail("Public review shell main element drifted")
    result = result[:match.end()] + PUBLIC_NOTICE + result[match.end():]
    return result


def expected_projection(source_root: Path) -> dict:
    official = source_root / OFFICIAL; student = source_root / STUDENT
    if regular_files(student) != STUDENT_FILES or regular_files(official / "data/rights") != RIGHTS_FILES:
        fail("Public question source file set drifted; explicit boundary review is required")
    ready_docs, ready = chunk_rows(student, sorted(x for x in STUDENT_FILES if x.startswith("questions/")))
    archive_docs, archive = chunk_rows(student, sorted(x for x in STUDENT_FILES if x.startswith("archive-questions/")))
    restricted = set(archive) - set(ready)
    if len(ready) != COUNTS["student_ready"] or len(archive) != COUNTS["archive_records"] or len(restricted) != COUNTS["restricted_archive"]:
        fail("Approved question/archive counts changed; explicit boundary review is required")
    if any(row.get("studentReady") is not True for row in ready.values()):
        fail("Public student pool contains a non-ready record")
    if any(archive[key].get("studentReady") is not False for key in restricted):
        fail("Restricted archive readiness disagrees with the approved pool")
    for key in ready:
        if archive.get(key) != ready[key]:
            fail("Ready archive content disagrees with the approved student record")
    projected_chunks = {}
    for name, doc in archive_docs.items():
        projected_chunks[name] = {"questions": [project_archive_record(row) if row["id"] in restricted else row for row in doc["questions"]]}
    index = read_json(student / "archive-index.json")
    if not isinstance(index, list) or len(index) != len(archive) or {row.get("id") for row in index} != set(archive):
        fail("Archive index identity does not match the archive")
    projected_index = [project_archive_index(row) if row["id"] in restricted else row for row in index]
    direct, media = media_closure(official, ready)
    if len(direct) != COUNTS["direct_media"] or len(media) != COUNTS["media_files"]:
        fail("Approved media closure changed; explicit boundary review is required")
    shells = {kind: public_shell((official / f"admin/{kind}.html").read_text(encoding="utf-8"), kind) for kind in ("teacher", "import")}
    manifest = {"contract": CONTRACT, "counts": COUNTS, "media": sorted(media)}
    manifest_bytes = (json.dumps(manifest, ensure_ascii=False, indent=2, allow_nan=False) + "\n").encode("utf-8")
    if hashlib.sha256(manifest_bytes).hexdigest() != BOUNDARY_SHA256:
        fail("Approved media manifest differs from its reviewed worker pin")
    worker = (source_root / "sw.js").read_text(encoding="utf-8")
    if f'const PUBLIC_QUESTION_BOUNDARY_SHA256 = "{BOUNDARY_SHA256}";' not in worker:
        fail("Source worker does not pin this public media manifest")
    return {"ready": ready, "restricted": restricted, "archive": archive, "chunks": projected_chunks,
            "index": projected_index, "media": media, "manifest": manifest, "shells": shells}


def roots(source_root: Path, artifact_root: Path) -> tuple[Path, Path]:
    source = Path(source_root).resolve(); artifact = Path(artifact_root).resolve()
    if source == artifact or source.is_relative_to(artifact) or not source.is_dir() or not artifact.is_dir():
        fail("Projection requires separate source and staged artifact directories")
    for base in (source, artifact):
        for relative in (f"{OFFICIAL}/data", f"{OFFICIAL}/admin/data", f"{OFFICIAL}/media"):
            regular_files(base / relative)  # No dependency/source-tool traversal.
        for kind in ("teacher", "import"):
            path = base / OFFICIAL / f"admin/{kind}.html"
            if path.is_symlink() or not path.is_file():
                fail("Public review shell is missing or symlinked")
    return source, artifact


def remove_staged(root: Path, relative: str) -> None:
    path = root / relative
    if path.is_symlink() or not path.resolve().is_relative_to(root) or path.resolve() == root:
        fail("Refusing an unsafe staged removal target")
    if path.is_dir():
        # The absolute target was checked above, and every descendant is checked
        # before Python performs this single-shell-independent staged operation.
        regular_files(path)
        shutil.rmtree(path)
    elif path.exists():
        path.unlink()


def project(source_root: Path, artifact_root: Path) -> dict:
    source, artifact = roots(source_root, artifact_root)
    expected = expected_projection(source)  # Validate all source before mutation.
    for relative in (f"{OFFICIAL}/data", f"{OFFICIAL}/admin/data", f"{OFFICIAL}/media", *PACKAGING_ROOTS):
        remove_staged(artifact, relative)
    for relative in STUDENT_FILES:
        target = artifact / STUDENT / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        if relative in expected["chunks"]:
            write_json(target, expected["chunks"][relative])
        elif relative == "archive-index.json":
            write_json(target, expected["index"])
        else:
            shutil.copyfile(source / STUDENT / relative, target)
    for relative in RIGHTS_FILES:
        target = artifact / OFFICIAL / "data/rights" / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(source / OFFICIAL / "data/rights" / relative, target)
    (artifact / TRUST).parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(source / TRUST, artifact / TRUST)
    for relative in expected["media"]:
        target = artifact / OFFICIAL / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(source / OFFICIAL / relative, target)
    for kind, body in expected["shells"].items():
        (artifact / OFFICIAL / f"admin/{kind}.html").write_bytes(body.encode("utf-8"))
    write_json(artifact / BOUNDARY, expected["manifest"])
    errors = validate_projection(source, artifact, expected=expected)
    if errors:
        fail("Staged public question validation failed: " + "; ".join(errors))
    return {"contract": CONTRACT, "status": "PASS", "counts": COUNTS,
            "source_mutated": False, "question_content_in_report": False,
            "media_tree_sha256": hashlib.sha256("".join(f"{name}\0{digest(source / OFFICIAL / name)}\n" for name in sorted(expected["media"])).encode()).hexdigest(),
            "limits": ["Public Git source/history and previously saved copies are outside this Pages boundary.",
                       "Approved source-page images are preserved; no new visual-content audit is asserted."]}


def validate_projection(source_root: Path, artifact_root: Path, *, expected: dict | None = None) -> list[str]:
    errors = []
    try:
        source, artifact = roots(source_root, artifact_root)
        expected = expected or expected_projection(source)
        data_files = regular_files(artifact / OFFICIAL / "data")
        wanted_data = {f"student/{name}" for name in STUDENT_FILES} | {"student/publication-boundary.json"} | {f"rights/{name}" for name in RIGHTS_FILES}
        if data_files != wanted_data:
            errors.append("Public official data differs from the closed path allowlist")
        if regular_files(artifact / OFFICIAL / "admin/data") != {"question-trust-manifest.json"}:
            errors.append("Admin data contains a non-public dataset")
        if any((artifact / root).exists() for root in PACKAGING_ROOTS):
            errors.append("Pages contains a development packaging or backup root")
        actual_media = {f"media/{name}" for name in regular_files(artifact / OFFICIAL / "media")}
        if actual_media != expected["media"]:
            errors.append("Pages media differs from the exact approved dependency closure")
        for name in expected["media"]:
            if not (artifact / OFFICIAL / name).is_file() or digest(source / OFFICIAL / name) != digest(artifact / OFFICIAL / name):
                errors.append("Approved media bytes changed or are missing"); break
        for name in STUDENT_FILES:
            path = artifact / STUDENT / name
            if not path.is_file():
                errors.append("A required public student data file is missing"); continue
            if name in expected["chunks"]:
                actual = read_json(path)
                if actual != expected["chunks"][name]:
                    errors.append("Archive projection or approved archive content changed")
                if any(not validate_archive_record(row) for row in actual.get("questions", []) if row.get("id") in expected["restricted"]):
                    errors.append("Restricted archive contains unapproved fields or types")
            elif name == "archive-index.json":
                actual_index = read_json(path)
                if actual_index != expected["index"]:
                    errors.append("Archive index is not the closed metadata projection")
                if not isinstance(actual_index, list) or any(not validate_archive_index(row) for row in actual_index if row.get("id") in expected["restricted"]):
                    errors.append("Restricted archive index contains unsupported fields or types")
            elif digest(path) != digest(source / STUDENT / name):
                errors.append("Approved student data bytes changed")
        if digest(artifact / BOUNDARY) != BOUNDARY_SHA256 or read_json(artifact / BOUNDARY) != expected["manifest"]:
            errors.append("Public media boundary manifest differs from the validated closure")
        for name in [TRUST] + [f"{OFFICIAL}/data/rights/{name}" for name in RIGHTS_FILES]:
            if digest(artifact / name) != digest(source / name):
                errors.append("Public trust or rights metadata changed")
        for kind in ("teacher", "import"):
            body = (artifact / OFFICIAL / f"admin/{kind}.html").read_text(encoding="utf-8")
            # Guard injection after projection is allowed, but must not change
            # this exact safe configuration or restore raw overlay scripts.
            if body.count(SAFE_CONFIG) != 1 or body.count('id="public-review-boundary"') != 1 or "ECHS_ADMIN_MODE=true" in body or 'src="audit-overrides.js"' in body:
                errors.append("Public teacher/import shell has unsafe data configuration")
    except (ProjectionError, OSError, KeyError, TypeError, AttributeError) as exc:
        errors.append(str(exc) if isinstance(exc, ProjectionError) else "Public projection validation could not read its required shape")
    return errors


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path)
    parser.add_argument("artifact", type=Path)
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    try:
        if args.check:
            errors = validate_projection(args.source, args.artifact)
            report = {"contract": CONTRACT, "status": "FAIL" if errors else "PASS", "errors": errors}
        else:
            report = project(args.source, args.artifact)
        print(json.dumps(report, indent=2))
        return int(report["status"] != "PASS")
    except (ProjectionError, OSError):
        # Do not expose arbitrary source values from malformed payloads.
        print(json.dumps({"contract": CONTRACT, "status": "FAIL", "error": "Public question projection rejected its source or artifact; inspect the bounded local validation test."}))
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
