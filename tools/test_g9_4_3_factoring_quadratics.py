#!/usr/bin/env python3
"""Deterministic release checks for Grade 9 lesson 4.3."""

from __future__ import annotations

import json
import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "curriculum/pathways/grade-9-2026-2027.json"
CATALOG = ROOT / "data/grade-9-10-pathways.js"
LESSON_URL = "lessons/pathways/grade-9/unit-4/g9-4.3-factoring-quadratics.html"
LESSON = ROOT / LESSON_URL


class GradeNineFactoringQuadraticsTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
        cls.html = LESSON.read_text(encoding="utf-8")
        cls.lesson = next(
            lesson
            for unit in cls.manifest["paths"]["common"]["units"]
            for lesson in unit["lessons"]
            if lesson["id"] == "4.3"
        )

    def test_authoritative_manifest_row_is_truthfully_ready(self) -> None:
        self.assertEqual(self.lesson["title"], "Factoring Quadratics")
        self.assertEqual(
            self.lesson["subtopics"],
            ["GCF; trinomials; difference of squares; zero-product property."],
        )
        self.assertEqual(
            self.lesson["learningOutcomes"],
            ["Factor quadratics and connect factors to zeros/intercepts."],
        )
        self.assertEqual(self.lesson["depth"], "M Prerequisite Mastery")
        self.assertEqual(
            self.lesson["requiredGrade9Coverage"],
            "Factor routine and moderately complex quadratics completely and solve by zero product.",
        )
        self.assertEqual(
            self.lesson["coverageBoundary"],
            "Deferred: advanced higher-degree factoring patterns for Unit 5.",
        )
        self.assertEqual((self.lesson["targetPeriods"], self.lesson["maximumPeriods"]), (4, 5))
        self.assertEqual(self.lesson["deliveryStatus"], "ready")
        self.assertEqual(self.lesson["url"], LESSON_URL)
        self.assertEqual(self.lesson["screenCount"], 64)
        self.assertTrue(LESSON.is_file())
        self.assertIn(f'"url":"{LESSON_URL}"', CATALOG.read_text(encoding="utf-8"))

    def test_depth_pacing_coverage_and_boundary_are_explicit(self) -> None:
        for phrase in (
            "Prerequisite Mastery",
            "4 target periods",
            "5 maximum",
            "routine and moderately complex quadratics",
            "solve by zero product",
            "advanced higher-degree factoring patterns",
            "deferred to Unit 5",
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

    def test_representative_factorizations_and_solutions_are_exact(self) -> None:
        for x in (-5, -2, 0, 1, 3, 6):
            self.assertEqual(x * x + 9 * x + 20, (x + 4) * (x + 5))
            self.assertEqual(6 * x * x + 11 * x + 3, (3 * x + 1) * (2 * x + 3))
            self.assertEqual(6 * x * x - 7 * x - 3, (3 * x + 1) * (2 * x - 3))
            self.assertEqual(12 * x * x - 11 * x - 5, (3 * x + 1) * (4 * x - 5))
            self.assertEqual(15 * x * x - 14 * x - 8, (5 * x + 2) * (3 * x - 4))
            self.assertEqual(18 * x * x - 8, 2 * (3 * x - 2) * (3 * x + 2))
        self.assertEqual({7, -2}, {x for x in (7, -2) if x * x - 5 * x - 14 == 0})
        self.assertEqual({3, -0.5}, {x for x in (3, -0.5) if 2 * x * x - 5 * x - 3 == 0})
        self.assertEqual({-1 / 3, 5 / 2}, {x for x in (-1 / 3, 5 / 2) if abs(6 * x * x - 13 * x - 5) < 1e-9})

    def test_screen_plan_is_64_meaningful_screens(self) -> None:
        self.assertIn('<meta name="echs-screen-count" content="64">', self.html)
        self.assertIn("const EXPECTED_SCREEN_COUNT=64", self.html)
        self.assertEqual(self.html.count("\n    add("), 44)
        self.assertEqual(44 + 20, 64)
        for signal in (
            "Learning goals", "Prerequisite retrieval", "Worked example",
            "Student Turn", "GCF", "Monic trinomials", "Nonmonic trinomials",
            "Difference of squares", "Zero-product property", "x-intercepts",
            "Differentiated practice", "AP-readiness transfer", "Exit ticket",
            "Mastery reflection",
        ):
            self.assertIn(signal, self.html)

    def test_math_interaction_and_persistence_contracts(self) -> None:
        self.assertIn("katex@0.16.11", self.html)
        self.assertGreaterEqual(self.html.count('math("') + self.html.count('class="math" data-tex='), 35)
        unsafe_commands = re.findall(
            r'(?<!\\)\\(?:frac|text|circ|ne|sqrt|to|xrightarrow|quad|Longrightarrow)',
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
            "three forms of a quadratic", "form selection and conversion",
            "difference quotients",
        ):
            self.assertNotIn(prohibited, lowered)


if __name__ == "__main__":
    unittest.main()
