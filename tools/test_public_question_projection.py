#!/usr/bin/env python3
"""Bounded fail-closed tests for the Pages-only official-bank projection."""
from __future__ import annotations
import copy
import json
from pathlib import Path
import tempfile
import unittest
from project_public_question_bank import (
    ARCHIVE_NESTED_FIELDS, ARCHIVE_TOP_FIELDS, ProjectionError, project_archive_record,
    project_archive_index, validate_archive_record, validate_archive_index, public_shell, media_closure,
    read_json, roots,
)

ROOT = Path(__file__).resolve().parents[1]
TEMP_ROOT = ROOT / "artifacts/public-question-boundary"
TEMP_ROOT.mkdir(parents=True, exist_ok=True)


class PublicQuestionProjectionTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        rows = []
        for path in (ROOT / "question-bank/official/data/student/archive-questions").glob("chunk-*.json"):
            rows.extend(read_json(path)["questions"])
        cls.row = next(row for row in rows if not row.get("studentReady"))
        index = read_json(ROOT / "question-bank/official/data/student/archive-index.json")
        cls.index = next(row for row in index if row["id"] == cls.row["id"])

    def test_01_closed_archive_projection(self):
        source = copy.deepcopy(self.row)
        source["machineExtractedText"] = "PRIVATE OCR CANARY"
        source["commonMistakes"] = ["PRIVATE ANSWER CANARY"]
        source["audit"]["reviewerNotes"] = "PRIVATE REVIEW CANARY"
        source["classification"]["unknown"] = {"answer": "PRIVATE NESTED CANARY"}
        before = copy.deepcopy(source)
        result = project_archive_record(source)
        self.assertEqual(source, before)
        self.assertNotIn("PRIVATE", json.dumps(result))
        self.assertTrue(validate_archive_record(result))

    def test_02_metadata_types_are_checked(self):
        for key in ARCHIVE_TOP_FIELDS:
            source = copy.deepcopy(self.row); source[key] = {"unsupported": True}
            with self.assertRaises(ProjectionError):
                project_archive_record(source)
        for parent, schema in ARCHIVE_NESTED_FIELDS.items():
            for key in schema:
                source = copy.deepcopy(self.row); source[parent][key] = {"unsupported": True}
                with self.assertRaises(ProjectionError):
                    project_archive_record(source)

    def test_03_unknown_fields_cannot_pass_validation(self):
        result = project_archive_record(self.row)
        for parent in [None, *ARCHIVE_NESTED_FIELDS]:
            altered = copy.deepcopy(result)
            (altered if parent is None else altered[parent])["private_note"] = "CANARY"
            self.assertFalse(validate_archive_record(altered))
        for key in ("studentEligible", "studentAccessible", "studentReady"):
            altered = copy.deepcopy(result); altered[key] = int(altered[key])
            self.assertFalse(validate_archive_record(altered), "Numeric values cannot substitute for booleans")

    def test_04_search_rebuilt_without_raw_text(self):
        source = copy.deepcopy(self.index); source["search"] = "PRIVATE OCR CANARY"
        result = project_archive_index(source)
        self.assertNotIn("PRIVATE", json.dumps(result))
        self.assertIn(result["id"].lower(), result["search"])
        self.assertFalse(result["hasMedia"])
        self.assertFalse(result["studentReady"])
        self.assertTrue(validate_archive_index(result))
        result["studentReady"] = 0
        self.assertFalse(validate_archive_index(result))

    def test_05_shells_fail_on_configuration_drift(self):
        for kind in ["teacher", "import"]:
            source = (ROOT / f"question-bank/official/admin/{kind}.html").read_text(encoding="utf-8")
            result = public_shell(source, kind)
            self.assertIn("window.ECHS_ADMIN_MODE=false", result)
            self.assertNotIn('src="audit-overrides.js"', result)
            self.assertEqual(result.count('id="public-review-boundary"'), 1)
            with self.assertRaises(ProjectionError):
                public_shell(source.replace("window.ECHS_DATA_ROOT='../data'", "window.ECHS_DATA_ROOT='../other'"), kind)

    def test_06_duplicate_json_and_nonfinite_rejected(self):
        with tempfile.TemporaryDirectory(dir=TEMP_ROOT, prefix="echs-projection-json-") as directory:
            path = Path(directory) / "input.json"
            for body in ['{"id":1,"id":2}', '{"value":NaN}', '{"value":Infinity}']:
                path.write_text(body, encoding="utf-8")
                with self.assertRaises(ProjectionError):
                    read_json(path)

    def test_07_same_or_parent_root_rejected(self):
        with self.assertRaises(ProjectionError):
            roots(ROOT, ROOT)
        with self.assertRaises(ProjectionError):
            roots(ROOT, ROOT.parent)

    def test_08_transitive_media_and_escaping_dependencies(self):
        with tempfile.TemporaryDirectory(dir=TEMP_ROOT, prefix="echs-media-closure-") as directory:
            root = Path(directory); (root / "media/crops").mkdir(parents=True)
            (root / "media/pages").mkdir(); (root / "media/pages/source.png").write_bytes(b"synthetic")
            path = root / "media/crops/figure.svg"
            rows = {"original": {"media": [{"path": "media/crops/figure.svg"}]}}
            path.write_text('<svg xmlns="http://www.w3.org/2000/svg"><image href="../pages/source.png"/></svg>', encoding="utf-8")
            direct, closure = media_closure(root, rows)
            self.assertEqual(len(direct), 1); self.assertEqual(len(closure), 2)
            for ref in ["https://example.test/private.png", "../../../private.png", "%2e%2e/private.png", "data:text/html;base64,PHNjcmlwdD4="]:
                path.write_text(f'<svg xmlns="http://www.w3.org/2000/svg"><image href="{ref}"/></svg>', encoding="utf-8")
                with self.assertRaises(ProjectionError):
                    media_closure(root, rows)

    def test_09_active_or_malformed_svg_rejected(self):
        with tempfile.TemporaryDirectory(dir=TEMP_ROOT, prefix="echs-media-active-") as directory:
            root = Path(directory); (root / "media").mkdir()
            path = root / "media/figure.svg"
            rows = {"original": {"media": [{"path": "media/figure.svg"}]}}
            for body in ['<svg><script/></svg>', '<svg onload="alert(1)"/>', '<svg><foreignObject/></svg>', '<svg xmlns:s="http://www.w3.org/2000/svg"><s:script/></svg>', '<svg>']:
                path.write_text(body, encoding="utf-8")
                with self.assertRaises(ProjectionError):
                    media_closure(root, rows)


if __name__ == "__main__":
    unittest.main(verbosity=2)
