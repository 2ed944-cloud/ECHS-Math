#!/usr/bin/env python3
"""Independent C01 preservation checks using disposable copies, never source edits.

Only IDs, hashes, counts and safe assertion labels are emitted. This suite checks
the approved distribution snapshot, not rights or image-content correctness.
"""
from __future__ import annotations

import hashlib
import json
import re
import shutil
import sys
import tempfile
import unittest
import urllib.parse
import xml.etree.ElementTree as ET
from pathlib import Path

sys.dont_write_bytecode = True
from project_public_question_bank import project, validate_projection

REPO = Path(__file__).resolve().parents[1]
OFFICIAL = Path("question-bank/official")
STUDENT = OFFICIAL / "data/student"
TRUST = OFFICIAL / "admin/data/question-trust-manifest.json"
CANARY = "C01_PRIVATE_SOURCE_PAYLOAD_MUST_NEVER_BE_PUBLISHED_78af1c"

# Independent contract specification; deliberately not imported from the builder.
TOP = set("id course courseId assessmentFamily type format year form questionNumber section calculator maxPoints estimatedTime contentStatus source classification pedagogy audit studentEligible studentAccessible studentReady deploymentAccess archiveMessage".split())
NESTED = {
    "source": set("organization publisher bankName sourceType officialStatus releaseStatus accessLevel rightsStatus publicPublicationAllowed sourcePages".split()),
    "classification": set("primaryUnit primaryUnitLabel primaryTopic topicCode lessonIds learningObjectives skillCategories representations".split()),
    "pedagogy": {"difficulty", "difficultyLabel"},
    "audit": {"overallStatus", "reviewRequired", "auditedAt"},
}
INDEX = set("id course courseId family type form number section calculator unitLabel topic topicCode difficultyLabel officialStatus accessLevel readiness deploymentAccess contentStatus auditStatus mediaStatus mappingStatus archiveStatus year unit difficulty lessons learningObjectives skills concepts representations publicAllowed needsReview answerVerified mediaVerified mathVerified mappingVerified hasMedia hasHints studentEligible studentAccessible studentReady reviewRequired search".split())
ARCHIVE_MESSAGE = "This record is indexed for reference. Its question content is not included in the public student release."
SAFE_CONFIG = "window.ECHS_ADMIN_MODE=false;window.ECHS_DATA_ROOT='../data/student';window.ECHS_ARCHIVE_DATA_ROOT='../data/student';window.ECHS_ASSET_ROOT='../';"


def load(path):
    return json.loads(path.read_text(encoding="utf-8"))


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def semantic(value):
    return hashlib.sha256(json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode()).hexdigest()


def rows(directory):
    result = {}
    for path in sorted(directory.glob("chunk-*.json")):
        data = load(path)
        if set(data) != {"questions"}:
            raise AssertionError("Unexpected source chunk envelope")
        for row in data["questions"]:
            if row["id"] in result:
                raise AssertionError("Duplicate question identifier")
            result[row["id"]] = row
    return result


def tree_hashes(root):
    return {path.relative_to(root).as_posix(): digest(path) for path in root.rglob("*") if path.is_file()}


def independent_media(official, ready):
    # Actual consumer: official/js/app.js chooseMedia/renderMedia uses media[].path.
    # audit.sourceCropPath is provenance metadata and is not a render seed.
    direct = {entry["path"] for row in ready.values() for entry in row.get("media", []) if entry.get("path")}
    pending = list(direct)
    closure = set()
    media_root = (official / "media").resolve()
    while pending:
        relative = pending.pop()
        if relative in closure:
            continue
        file = (official / relative).resolve()
        if not file.is_relative_to(media_root) or not file.is_file():
            raise AssertionError("Approved media dependency is missing or outside media")
        closure.add(relative)
        if file.suffix.lower() != ".svg":
            continue
        data = file.read_text(encoding="utf-8")
        # XML attribute reading is independent of the builder's href regex.
        element = ET.fromstring(data)
        refs = [value for node in element.iter() for key, value in node.attrib.items() if key.rsplit("}", 1)[-1] == "href"]
        refs += re.findall(r"url\(\s*['\"]?([^)'\"]+)", data)
        for ref in refs:
            if ref.startswith(("#", "data:")):
                continue
            parsed = urllib.parse.urlsplit(ref)
            if parsed.scheme or parsed.netloc or parsed.query or parsed.fragment:
                raise AssertionError("Unexpected external approved media dependency")
            target = (file.parent / urllib.parse.unquote(parsed.path)).resolve()
            if not target.is_relative_to(media_root):
                raise AssertionError("Transitive media dependency escaped media")
            pending.append(target.relative_to(official.resolve()).as_posix())
    return direct, closure


class PublicQuestionPreservation(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp = tempfile.TemporaryDirectory(prefix="echs_public_bank_test_")
        cls.addClassCleanup(cls.temp.cleanup)
        scratch = Path(cls.temp.name).resolve()
        cls.source = scratch / "source"
        cls.artifact = scratch / "artifact"
        cls.source.mkdir()
        # Private scratch source contains real data; test canaries mutate this
        # copy only. Neither the repository nor an original hardlink is touched.
        shutil.copytree(REPO / OFFICIAL, cls.source / OFFICIAL, ignore=shutil.ignore_patterns("node_modules", "tools", "reports", "__pycache__"))
        shutil.copyfile(REPO / "sw.js", cls.source / "sw.js")
        cls.original_ready = rows(REPO / STUDENT / "questions")
        cls.original_archive = rows(REPO / STUDENT / "archive-questions")
        cls.ready_ids = set(cls.original_ready)
        cls.restricted_ids = set(cls.original_archive) - cls.ready_ids
        if (len(cls.ready_ids), len(cls.original_archive), len(cls.restricted_ids)) != (1104, 1217, 113):
            raise AssertionError("Approved source counts drifted; explicit review required")
        # Known legacy leak fields and an unknown nested field cannot survive.
        changed = False
        for file in sorted((cls.source / STUDENT / "archive-questions").glob("*.json")):
            doc = load(file)
            for row in doc["questions"]:
                if row["id"] in cls.restricted_ids:
                    row["machineExtractedText"] = CANARY
                    row["commonMistakes"] = [{"private": CANARY}]
                    row["audit"]["reviewerNotes"] = CANARY
                    row["quality"]["reviewReasons"] = [CANARY]
                    row["classification"]["privatePrompt"] = {"nested": CANARY}
                    row["unrecognizedPrivateRecord"] = {"answer": CANARY}
                    changed = True
            file.write_text(json.dumps(doc, ensure_ascii=False), encoding="utf-8")
        if not changed:
            raise AssertionError("Canary fixture did not cover restricted records")
        archive_index = cls.source / STUDENT / "archive-index.json"
        doc = load(archive_index)
        for row in doc:
            if row["id"] in cls.restricted_ids:
                row["search"] = CANARY
                row["privateIndexBody"] = {"question": CANARY}
        archive_index.write_text(json.dumps(doc, ensure_ascii=False), encoding="utf-8")
        cls.before = tree_hashes(cls.source)
        # The projector rebuilds media from source. Avoid a second 284MB fixture
        # copy; an explicit unused staged media canary still proves its removal.
        shutil.copytree(cls.source, cls.artifact, ignore=shutil.ignore_patterns("media"))
        staged_media = cls.artifact / OFFICIAL / "media/unused-private-canary.svg"
        staged_media.parent.mkdir(parents=True)
        staged_media.write_text(CANARY, encoding="utf-8")
        # Independently prove broad staging copies are removed by the projector.
        for name in (".staging", "packages", ".deploy", ".echs-backups", "artifacts"):
            file = cls.artifact / name / "private-copy.json"
            file.parent.mkdir(parents=True)
            file.write_text(CANARY, encoding="utf-8")
        cls.result = project(cls.source, cls.artifact)
        cls.actual_ready = rows(cls.artifact / STUDENT / "questions")
        cls.actual_archive = rows(cls.artifact / STUDENT / "archive-questions")
        cls.direct, cls.closure = independent_media(cls.source / OFFICIAL, cls.original_ready)

    def test_01_all_ready_records_and_chunk_bytes_preserved(self):
        self.assertEqual(set(self.actual_ready), self.ready_ids)
        for identifier in sorted(self.ready_ids):
            self.assertEqual(semantic(self.actual_ready[identifier]), semantic(self.original_ready[identifier]), identifier)
        for source in (REPO / STUDENT / "questions").glob("*.json"):
            self.assertEqual(digest(source), digest(self.artifact / STUDENT / "questions" / source.name), source.name)

    def test_02_ready_archive_rows_and_all_archive_ids_preserved(self):
        self.assertEqual(set(self.actual_archive), set(self.original_archive))
        for identifier in sorted(self.ready_ids):
            self.assertEqual(semantic(self.actual_archive[identifier]), semantic(self.original_archive[identifier]), identifier)
        for name, identifiers in (("id-map.json", self.ready_ids), ("archive-id-map.json", set(self.original_archive))):
            lookup = load(self.artifact / STUDENT / name)
            self.assertEqual(set(lookup), identifiers)
            directory = "questions" if name == "id-map.json" else "archive-questions"
            chunk_ids = {chunk: {row["id"] for row in load(self.artifact / STUDENT / directory / chunk)["questions"]} for chunk in set(lookup.values())}
            for identifier, chunk in lookup.items():
                self.assertIn(identifier, chunk_ids[chunk])

    def test_03_every_restricted_row_is_closed_metadata(self):
        for identifier in sorted(self.restricted_ids):
            row = self.actual_archive[identifier]
            self.assertEqual(set(row), TOP, identifier)
            for name, expected in NESTED.items():
                self.assertEqual(set(row[name]), expected, identifier + ":" + name)
                original = {key: self.original_archive[identifier][name][key] for key in expected}
                self.assertEqual(semantic(row[name]), semantic(original), identifier + ":" + name)
            metadata = TOP - set(NESTED) - {"studentEligible", "studentAccessible", "studentReady", "deploymentAccess", "archiveMessage"}
            self.assertEqual(semantic({key: row[key] for key in metadata}), semantic({key: self.original_archive[identifier][key] for key in metadata}), identifier)
            self.assertIs(row["studentReady"], False)
            self.assertIs(row["studentEligible"], False)
            self.assertIs(row["studentAccessible"], True)
            self.assertEqual(row["deploymentAccess"], "archive-metadata-only")
            self.assertEqual(row["archiveMessage"], ARCHIVE_MESSAGE)

    def test_04_restricted_index_is_closed_and_ready_index_unchanged(self):
        old = {row["id"]: row for row in load(REPO / STUDENT / "archive-index.json")}
        current = {row["id"]: row for row in load(self.artifact / STUDENT / "archive-index.json")}
        self.assertEqual(set(current), set(self.original_archive))
        for identifier, row in current.items():
            if identifier in self.ready_ids:
                self.assertEqual(semantic(row), semantic(old[identifier]), identifier)
            else:
                self.assertEqual(set(row), INDEX, identifier)
                for flag in ("studentReady", "studentEligible", "hasMedia", "hasHints"):
                    self.assertIs(row[flag], False)
                self.assertNotIn(CANARY, json.dumps(row))
        self.assertEqual(digest(REPO / STUDENT / "question-index.json"), digest(self.artifact / STUDENT / "question-index.json"))

    def test_05_actual_renderable_media_and_svg_dependencies_preserved(self):
        self.assertEqual((len(self.direct), len(self.closure)), (1193, 1277))
        actual = {file.relative_to(self.artifact / OFFICIAL).as_posix() for file in (self.artifact / OFFICIAL / "media").rglob("*") if file.is_file()}
        self.assertEqual(actual, self.closure)
        self.assertEqual(len(self.closure - self.direct), 84)
        for relative in sorted(self.closure):
            self.assertEqual(digest(self.source / OFFICIAL / relative), digest(self.artifact / OFFICIAL / relative), relative)

    def test_06_raw_datasets_and_canaries_absent_from_staged_outputs(self):
        data = self.artifact / OFFICIAL / "data"
        self.assertEqual({item.name for item in data.iterdir()}, {"student", "rights"})
        self.assertEqual({file.name for file in (self.artifact / OFFICIAL / "admin/data").iterdir()}, {"question-trust-manifest.json"})
        for name in (".staging", "packages", ".deploy", ".echs-backups", "artifacts"):
            self.assertFalse((self.artifact / name).exists(), name)
        for file in (self.artifact / OFFICIAL).rglob("*.json"):
            self.assertNotIn(CANARY.encode(), file.read_bytes(), file.relative_to(self.artifact).as_posix())

    def test_07_teacher_import_routes_keep_safe_tools_and_fixed_data_roots(self):
        for kind in ("teacher", "import"):
            alias = self.artifact / OFFICIAL / (kind + ".html")
            self.assertEqual(digest(REPO / OFFICIAL / (kind + ".html")), digest(alias))
            body = (self.artifact / OFFICIAL / "admin" / (kind + ".html")).read_text(encoding="utf-8")
            self.assertEqual(body.count(SAFE_CONFIG), 1)
            self.assertEqual(body.count('id="public-review-boundary"'), 1)
            self.assertNotIn("ECHS_ADMIN_MODE=true", body)
            self.assertNotIn("ECHS_AUDIT_OVERRIDES_URLS", body)
            self.assertNotIn('src="audit-overrides.js"', body)
            self.assertNotIn("The full 1,217-record canonical bank is available here.", body)
            before = (REPO / OFFICIAL / "admin" / (kind + ".html")).read_text(encoding="utf-8")
            self.assertTrue(set(re.findall(r'\bid="([^"]+)"', before)).issubset(set(re.findall(r'\bid="([^"]+)"', body))), kind)
            for script in ("app.js", kind + ".js"):
                self.assertEqual(digest(REPO / OFFICIAL / "js" / script), digest(self.artifact / OFFICIAL / "js" / script))

    def test_08_trust_rights_gate_and_published_closure_manifest(self):
        self.assertEqual(digest(REPO / TRUST), digest(self.artifact / TRUST))
        self.assertEqual(digest(REPO / STUDENT / "gate.json"), digest(self.artifact / STUDENT / "gate.json"))
        for file in (REPO / OFFICIAL / "data/rights").iterdir():
            self.assertEqual(digest(file), digest(self.artifact / OFFICIAL / "data/rights" / file.name))
        gate = load(self.artifact / STUDENT / "gate.json")
        self.assertEqual(set(gate["studentReadyIds"]), self.ready_ids)
        self.assertEqual(set(gate["restrictedIds"]), self.restricted_ids)
        boundary = load(self.artifact / STUDENT / "publication-boundary.json")
        self.assertEqual(boundary["contract"], "echs.public-question-boundary.v1")
        self.assertEqual(set(boundary["media"]), self.closure)

    def test_09_source_immutability_and_public_validator(self):
        self.assertEqual(tree_hashes(self.source), self.before)
        self.assertEqual(validate_projection(self.source, self.artifact), [])
        self.assertNotIn(CANARY, json.dumps(self.result))

    def test_10_validator_rejects_nested_archive_payload_reintroduction(self):
        file = next(file for file in (self.artifact / STUDENT / "archive-questions").glob("*.json") if any(row["id"] in self.restricted_ids for row in load(file)["questions"]))
        original = file.read_bytes()
        try:
            doc = load(file)
            row = next(row for row in doc["questions"] if row["id"] in self.restricted_ids)
            row["audit"]["reviewerNotes"] = CANARY
            file.write_text(json.dumps(doc, ensure_ascii=False), encoding="utf-8")
            self.assertTrue(validate_projection(self.source, self.artifact), "Nested private payload was accepted")
        finally:
            file.write_bytes(original)

    def test_11_validator_rejects_missing_transitive_media(self):
        path = self.artifact / OFFICIAL / sorted(self.closure - self.direct)[0]
        original = path.read_bytes()
        try:
            path.unlink()
            self.assertTrue(validate_projection(self.source, self.artifact), "Missing nested image was accepted")
        finally:
            path.write_bytes(original)

    def test_12_validator_rejects_broad_raw_data_reintroduction(self):
        path = self.artifact / OFFICIAL / "data/raw-private-canary.json"
        try:
            path.write_text(CANARY, encoding="utf-8")
            self.assertTrue(validate_projection(self.source, self.artifact), "Broad raw dataset was accepted")
        finally:
            path.unlink()


if __name__ == "__main__":
    unittest.main(verbosity=2)
