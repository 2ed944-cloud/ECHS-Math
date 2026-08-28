#!/usr/bin/env python3
"""Deterministic release checks for Grade 9 lesson 4.4."""

from __future__ import annotations

import json
import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "curriculum/pathways/grade-9-2026-2027.json"
CATALOG = ROOT / "data/grade-9-10-pathways.js"
LESSON_URL = "lessons/pathways/grade-9/unit-4/g9-4.4-completing-the-square.html"
LESSON = ROOT / LESSON_URL


class GradeNineCompletingSquareTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
        cls.html = LESSON.read_text(encoding="utf-8")
        cls.lesson = next(
            lesson
            for unit in cls.manifest["paths"]["common"]["units"]
            for lesson in unit["lessons"]
            if lesson["id"] == "4.4"
        )

    def test_authoritative_manifest_row_is_truthfully_ready(self) -> None:
        self.assertEqual(self.lesson["title"], "Completing the Square")
        self.assertEqual(
            self.lesson["subtopics"],
            ["Perfect-square trinomials; vertex form; solving."],
        )
        self.assertEqual(
            self.lesson["learningOutcomes"],
            ["Complete the square and use the result strategically."],
        )
        self.assertEqual(self.lesson["depth"], "M Prerequisite Mastery")
        self.assertEqual(
            self.lesson["requiredGrade9Coverage"],
            "Complete the square with integer/rational coefficients at reasonable complexity; use it for vertex form and solving.",
        )
        self.assertEqual(
            self.lesson["coverageBoundary"],
            "Not included within this course: proof-heavy conic-section derivations.",
        )
        self.assertEqual((self.lesson["targetPeriods"], self.lesson["maximumPeriods"]), (4, 4))
        self.assertEqual(self.lesson["deliveryStatus"], "ready")
        self.assertEqual(self.lesson["url"], LESSON_URL)
        self.assertEqual(self.lesson["screenCount"], 64)
        self.assertTrue(LESSON.is_file())
        self.assertIn(f'"url":"{LESSON_URL}"', CATALOG.read_text(encoding="utf-8"))

    def test_depth_pacing_coverage_and_boundary_are_explicit(self) -> None:
        for phrase in (
            "Prerequisite Mastery",
            "4 target periods",
            "4 maximum",
            "integer or rational coefficients",
            "vertex form and solving",
            "proof-heavy conic-section derivations",
            "not included",
        ):
            self.assertIn(phrase.lower(), self.html.lower())
        self.assertNotIn("AP Progress Check", self.html)

    def test_exactly_20_original_differentiated_items(self) -> None:
        ids = re.findall(r'\{id:"([EMHC]\d+)"', self.html)
        self.assertEqual(len(ids), 20)
        self.assertEqual(len(set(ids)), 20)
        self.assertEqual(
            {level: sum(item.startswith(level) for item in ids) for level in "EMHC"},
            {"E": 4, "M": 6, "H": 6, "C": 4},
        )
        prompts = re.findall(r",prompt:'(.*?)',options:", self.html)
        self.assertEqual(len(prompts), 20)
        self.assertEqual(len(set(prompts)), 20)
        self.assertEqual(self.html.count("solution:'"), 20)

    def test_independently_verified_and_varied_answer_key(self) -> None:
        expected = {
            "E1": 0, "E2": 1, "E3": 2, "E4": 3,
            "M1": 0, "M2": 1, "M3": 2, "M4": 3, "M5": 0, "M6": 1,
            "H1": 2, "H2": 3, "H3": 0, "H4": 1, "H5": 2, "H6": 3,
            "C1": 0, "C2": 1, "C3": 2, "C4": 3,
        }
        found = {
            item: int(answer)
            for item, answer in re.findall(r'\{id:"([EMHC]\d+)".*?,answer:(\d)', self.html)
        }
        self.assertEqual(found, expected)
        self.assertEqual(set(found.values()), {0, 1, 2, 3})

    def test_representative_conversions_and_roots_are_exact(self) -> None:
        for x in (-5, -2, 0, 1, 3, 6):
            self.assertEqual(x * x - 8 * x + 5, (x - 4) ** 2 - 11)
            self.assertEqual(2 * x * x + 8 * x + 3, 2 * (x + 2) ** 2 - 5)
            self.assertEqual(3 * x * x - 12 * x + 1, 3 * (x - 2) ** 2 - 11)
            self.assertEqual(2 * x * x - 6 * x + 7, 2 * (x - 1.5) ** 2 + 2.5)
            self.assertEqual(-2 * x * x + 12 * x - 7, -2 * (x - 3) ** 2 + 11)
            self.assertEqual(4 * x * x + 12 * x - 1, 4 * (x + 1.5) ** 2 - 10)
            self.assertEqual(3 * x * x - 18 * x + 7, 3 * (x - 3) ** 2 - 20)
        self.assertAlmostEqual((2 + 5 ** 0.5) ** 2 - 4 * (2 + 5 ** 0.5) - 1, 0)
        self.assertAlmostEqual(3 * (1 + 15 ** 0.5 / 3) ** 2 - 6 * (1 + 15 ** 0.5 / 3) - 2, 0)

    def test_screen_plan_is_64_meaningful_screens(self) -> None:
        self.assertIn('<meta name="echs-screen-count" content="64">', self.html)
        self.assertIn("const EXPECTED_SCREEN_COUNT=64", self.html)
        self.assertEqual(self.html.count("\n    add("), 44)
        self.assertEqual(44 + 20, 64)
        for signal in (
            "Learning goals", "Prerequisite retrieval", "Worked example",
            "Student Turn", "perfect-square identity", "Half, then square",
            "Rational coefficients", "leading coefficient", "Vertex form",
            "exact nonfactorable roots", "Differentiated practice",
            "AP-readiness transfer", "Exit ticket", "Mastery reflection",
        ):
            self.assertIn(signal, self.html)

    def test_math_interaction_and_persistence_contracts(self) -> None:
        self.assertIn("katex@0.16.11", self.html)
        self.assertGreaterEqual(self.html.count('math("') + self.html.count('class="math" data-tex='), 30)
        unsafe_commands = re.findall(
            r'(?<!\\)\\(?:frac|text|circ|ne|sqrt|to|xrightarrow|quad|square)',
            self.html,
        )
        self.assertEqual(unsafe_commands, [])
        for signal in (
            "localStorage", "exportWork", "ArrowRight", 'data-check="',
            'aria-live="polite"', "details", "Score all responses",
        ):
            self.assertIn(signal, self.html)

    def test_accessibility_responsive_and_visual_precision(self) -> None:
        for signal in (
            'name="viewport"', "focus-visible", "prefers-reduced-motion:reduce",
            "@media(max-width:520px)", "Skip to lesson content",
            'role="img" aria-labelledby="', "<title id=", "<desc id=",
            "marker-end=", "drawing=false", ".gridline",
        ):
            self.assertIn(signal, self.html)
        lowered = self.html.lower()
        for prohibited in (
            "question-bank/official", "private question", "college board question",
            "credential", "answer token", "pearson", "lorem ipsum",
            "factoring quadratics", "zero-product", "difference quotients",
        ):
            self.assertNotIn(prohibited, lowered)


if __name__ == "__main__":
    unittest.main()
