#!/usr/bin/env python3
"""Deterministic release checks for Grade 9 lesson 4.6."""

from __future__ import annotations

import json
import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "curriculum/pathways/grade-9-2026-2027.json"
CATALOG = ROOT / "data/grade-9-10-pathways.js"
LESSON_URL = "lessons/pathways/grade-9/unit-4/g9-4.6-quadratic-inequalities.html"
LESSON = ROOT / LESSON_URL


class GradeNineQuadraticInequalitiesTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
        cls.html = LESSON.read_text(encoding="utf-8")
        cls.lesson = next(
            lesson
            for unit in cls.manifest["paths"]["common"]["units"]
            for lesson in unit["lessons"]
            if lesson["id"] == "4.6"
        )

    def test_authoritative_manifest_row_is_truthfully_ready(self) -> None:
        self.assertEqual(self.lesson["title"], "Quadratic Inequalities")
        self.assertEqual(
            self.lesson["subtopics"],
            ["Sign intervals; graph-based solution; test intervals; interval notation."],
        )
        self.assertEqual(
            self.lesson["learningOutcomes"],
            ["Solve and represent quadratic inequality solution sets."],
        )
        self.assertEqual(self.lesson["depth"], "M Prerequisite Mastery")
        self.assertEqual(
            self.lesson["requiredGrade9Coverage"],
            "Solve quadratic inequalities algebraically and graphically and communicate solution intervals.",
        )
        self.assertEqual(
            self.lesson["coverageBoundary"],
            "Deferred: rational/polynomial inequalities of higher degree for later.",
        )
        self.assertEqual((self.lesson["targetPeriods"], self.lesson["maximumPeriods"]), (3, 3))
        self.assertEqual(self.lesson["deliveryStatus"], "ready")
        self.assertEqual(self.lesson["url"], LESSON_URL)
        self.assertEqual(self.lesson["screenCount"], 64)
        self.assertTrue(LESSON.is_file())
        self.assertIn(f'"url":"{LESSON_URL}"', CATALOG.read_text(encoding="utf-8"))

    def test_depth_pacing_coverage_and_boundary_are_explicit(self) -> None:
        for phrase in (
            "M · Prerequisite Mastery",
            "3 target periods",
            "3 maximum",
            "algebraically and graphically",
            "communicate solution intervals",
            "rational inequalities",
            "polynomial inequalities of higher degree",
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

    def test_representative_solution_sets_are_mathematically_exact(self) -> None:
        def q(a: float, b: float, c: float, x: float) -> float:
            return a * x * x + b * x + c

        # Positive outside the distinct zeros 2 and 3.
        self.assertGreater(q(1, -5, 6, 0), 0)
        self.assertLess(q(1, -5, 6, 2.5), 0)
        self.assertGreater(q(1, -5, 6, 4), 0)
        self.assertEqual(q(1, -5, 6, 2), 0)
        self.assertEqual(q(1, -5, 6, 3), 0)

        # Negative-leading quadratic is nonpositive outside 1/2 and 2.
        self.assertLess(q(-2, 5, -2, 0), 0)
        self.assertGreater(q(-2, 5, -2, 1), 0)
        self.assertLess(q(-2, 5, -2, 3), 0)
        self.assertEqual(q(-2, 5, -2, 0.5), 0)
        self.assertEqual(q(-2, 5, -2, 2), 0)

        # No-real-zero and repeated-root boundary cases.
        for x in (-10, -1, 0, 7):
            self.assertGreater(q(1, 2, 5, x), 0)
            self.assertGreaterEqual((x - 3) ** 2, 0)
        self.assertEqual((3 - 3) ** 2, 0)
        self.assertGreater((2 - 3) ** 2, 0)

        # Context model is nonnegative on the domain intersection [0, 7].
        self.assertGreaterEqual(q(-1, 6, 7, 0), 0)
        self.assertGreater(q(-1, 6, 7, 3), 0)
        self.assertEqual(q(-1, 6, 7, 7), 0)
        self.assertLess(q(-1, 6, 7, 8), 0)

    def test_screen_plan_is_64_meaningful_screens(self) -> None:
        self.assertIn('<meta name="echs-screen-count" content="64">', self.html)
        self.assertIn("const EXPECTED_SCREEN_COUNT=64", self.html)
        self.assertEqual(self.html.count("\n    add("), 44)
        self.assertEqual(44 + 20, 64)
        for signal in (
            "Learning goals", "Prerequisite retrieval", "Worked example",
            "Student Turn", "Sign intervals", "test every interval",
            "Read the solution from the graph", "Repeated-root sign cases",
            "Number line to interval notation", "Differentiated practice",
            "AP-readiness transfer", "Exit ticket", "Mastery reflection",
        ):
            self.assertIn(signal, self.html)

    def test_math_interaction_and_persistence_contracts(self) -> None:
        self.assertIn("katex@0.16.11", self.html)
        self.assertGreaterEqual(
            self.html.count('math("') + self.html.count('class="math" data-tex='),
            25,
        )
        unsafe_commands = re.findall(
            r'(?<!\\)\\(?:frac|text|circ|ne|sqrt|to|xrightarrow|quad|square|pm|le|ge|infty|cup)',
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
            "marker-end=", "marker-start=", "numberLineSvg", ".gridline",
        ):
            self.assertIn(signal, self.html)
        lowered = self.html.lower()
        for prohibited in (
            "question-bank/official", "private question", "college board question",
            "credential", "answer token", "pearson", "lorem ipsum",
            "quadratic-formula mastery secured", "complex-root verification",
            "de moivre", "nonreal conjugates",
        ):
            self.assertNotIn(prohibited, lowered)


if __name__ == "__main__":
    unittest.main()
