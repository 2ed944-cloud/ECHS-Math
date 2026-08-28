#!/usr/bin/env python3
"""Deterministic release checks for Grade 9 lesson 3.5."""

from __future__ import annotations

import json
import math
import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "curriculum/pathways/grade-9-2026-2027.json"
CATALOG = ROOT / "data/grade-9-10-pathways.js"
LESSON_URL = "lessons/pathways/grade-9/unit-3/g9-3.5-average-rate-of-change.html"
LESSON = ROOT / LESSON_URL


class GradeNineAverageRateTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
        cls.html = LESSON.read_text(encoding="utf-8")
        cls.lesson = next(
            lesson
            for unit in cls.manifest["paths"]["common"]["units"]
            for lesson in unit["lessons"]
            if lesson["id"] == "3.5"
        )

    def test_final_share_ready_manifest_row_is_truthfully_ready(self) -> None:
        self.assertEqual(self.lesson["title"], "Average Rate of Change")
        self.assertEqual(
            self.lesson["subtopics"],
            ["Difference quotient over an interval; secant slope; units; comparison across intervals."],
        )
        self.assertEqual(
            self.lesson["learningOutcomes"],
            ["Compute and interpret average rate of change over an interval."],
        )
        self.assertEqual(self.lesson["depth"], "B Bridge Depth")
        self.assertEqual(
            self.lesson["requiredGrade9Coverage"],
            "Compute AROC for linear/quadratic/simple polynomial/exponential examples and interpret units.",
        )
        self.assertEqual(
            self.lesson["coverageBoundary"],
            "Deferred beyond this course: sustained covariation investigations, instantaneous-rate language, and complex multi-representation AP tasks associated with AP Topic 1.2 depth.",
        )
        self.assertEqual((self.lesson["targetPeriods"], self.lesson["maximumPeriods"]), (3, 3))
        self.assertEqual(self.lesson["deliveryStatus"], "ready")
        self.assertEqual(self.lesson["url"], LESSON_URL)
        self.assertEqual(self.lesson["screenCount"], 64)
        self.assertTrue(LESSON.is_file())
        catalog = CATALOG.read_text(encoding="utf-8")
        self.assertIn(f'"url":"{LESSON_URL}"', catalog)

    def test_depth_pacing_coverage_and_boundary_are_explicit(self) -> None:
        for phrase in (
            "Bridge Depth",
            "3 target periods",
            "3 maximum",
            "linear, quadratic, simple polynomial, and exponential",
            "interpret units",
            "sustained covariation",
            "instantaneous-rate language",
            "AP Topic 1.2",
        ):
            self.assertIn(phrase.lower(), self.html.lower())
        self.assertNotIn("derivative", self.html.lower())
        self.assertNotIn("tangent-line approximation", self.html.lower())

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

    def test_independently_verified_answer_key(self) -> None:
        expected = {
            "E1": 0, "E2": 1, "E3": 2, "E4": 3,
            "M1": 0, "M2": 1, "M3": 2, "M4": 1, "M5": 3, "M6": 2,
            "H1": 0, "H2": 1, "H3": 2, "H4": 3, "H5": 1, "H6": 2,
            "C1": 3, "C2": 1, "C3": 2, "C4": 3,
        }
        found = {
            item: int(answer)
            for item, answer in re.findall(r'\{id:"([EMHC]\d+)".*?,answer:(\d)', self.html)
        }
        self.assertEqual(found, expected)

    def test_representative_mathematics_is_exact(self) -> None:
        aroc = lambda f, a, b: (f(b) - f(a)) / (b - a)
        self.assertEqual(aroc(lambda x: x * x, 1, 4), 5)
        self.assertEqual(aroc(lambda x: x * x - 2 * x, 0, 4), 2)
        self.assertEqual(aroc(lambda x: x**3 - 2 * x, -1, 2), 1)
        self.assertEqual(aroc(lambda x: 2**x, 0, 2), 1.5)
        self.assertEqual(aroc(lambda x: 2**x, 2, 4), 6)
        self.assertTrue(math.isclose(aroc(lambda x: 1.5**x, 0, 3), 0.7916666667))
        self.assertEqual(aroc(lambda x: x**3 - 4 * x, -2, 2), 0)
        self.assertEqual((18 - 4) / (3 - 1), 7)
        self.assertEqual((45 - 18) / (6 - 3), 9)

    def test_screen_plan_is_64_meaningful_screens(self) -> None:
        self.assertIn('<meta name="echs-screen-count" content="64">', self.html)
        self.assertIn("const EXPECTED_SCREEN_COUNT=64", self.html)
        self.assertEqual(self.html.count("\n    add("), 44)
        self.assertEqual(44 + 20, 64)
        for signal in (
            "Learning goals", "Worked example", "Student Turn", "Secant slope",
            "Multiple representations", "Differentiated practice", "AP-readiness transfer",
            "Exit ticket", "Mastery reflection",
        ):
            self.assertIn(signal, self.html)

    def test_math_interaction_and_persistence_contracts(self) -> None:
        self.assertIn("katex@0.16.11", self.html)
        self.assertGreaterEqual(self.html.count('math("') + self.html.count('class="math" data-tex='), 30)
        unsafe_commands = re.findall(
            r'(?<!\\)\\(?:frac|text|Delta|cdot|sqrt|infty|le|ge)',
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
            "marker-end=", "Equal scales are used on both axes.", ".flow > span{",
        ):
            self.assertIn(signal, self.html)
        self.assertNotIn(".flow span{", self.html)
        lowered = self.html.lower()
        for prohibited in (
            "question-bank/official", "private question", "college board question",
            "credential", "answer token", "pearson", "lorem ipsum",
        ):
            self.assertNotIn(prohibited, lowered)


if __name__ == "__main__":
    unittest.main()
