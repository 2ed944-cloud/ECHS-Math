#!/usr/bin/env python3
"""Prevent pathway lesson math from inheriting decorative component styles."""

from __future__ import annotations

import json
import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
MANIFESTS = (
    ROOT / "curriculum/pathways/grade-9-2026-2027.json",
    ROOT / "curriculum/pathways/grade-10-2026-2027.json",
)


def ready_lesson_files() -> list[Path]:
    files: list[Path] = []
    for manifest_path in MANIFESTS:
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        for pathway in manifest["paths"].values():
            for unit in pathway["units"]:
                for lesson in unit["lessons"]:
                    if lesson.get("deliveryStatus") == "ready" and lesson.get("url"):
                        path = ROOT / lesson["url"]
                        if "lessons/pathways/" in path.as_posix():
                            files.append(path)
    return files


class PathwayLessonStyleSafetyTests(unittest.TestCase):
    def test_ready_pathway_lessons_exist(self) -> None:
        files = ready_lesson_files()
        self.assertGreaterEqual(len(files), 4)
        for path in files:
            self.assertTrue(path.is_file(), path)

    def test_katex_is_not_targeted_by_broad_flow_selectors(self) -> None:
        for path in ready_lesson_files():
            html = path.read_text(encoding="utf-8")
            with self.subTest(path=path.relative_to(ROOT)):
                self.assertNotRegex(html, re.compile(r"\.flow\s+span\s*\{"))
                self.assertNotRegex(html, re.compile(r"\.flow\s+b\s*\{"))
                if 'class="flow"' in html:
                    self.assertIn(".flow > span{", html)
                    self.assertIn(".flow > b{", html)

    def test_student_facing_terminology_is_mathematically_precise(self) -> None:
        prohibited = (
            "Exponent and Equation Repair",
            "Diagnostic / repair depth",
            "The repair loop",
        )
        for path in ready_lesson_files():
            html = path.read_text(encoding="utf-8")
            with self.subTest(path=path.relative_to(ROOT)):
                for phrase in prohibited:
                    self.assertNotIn(phrase, html)

    def test_svg_figures_have_accessible_labels(self) -> None:
        for path in ready_lesson_files():
            html = path.read_text(encoding="utf-8")
            with self.subTest(path=path.relative_to(ROOT)):
                for tag in re.findall(r"<svg\b[^>]*>", html):
                    self.assertIn('role="img"', tag)
                    self.assertTrue(
                        "aria-label=" in tag or "aria-labelledby=" in tag,
                        f"Unlabelled SVG in {path.relative_to(ROOT)}: {tag}",
                    )


if __name__ == "__main__":
    unittest.main()
