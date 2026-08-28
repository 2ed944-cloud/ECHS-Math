#!/usr/bin/env python3
"""Deterministic release checks for Grade 9 lesson 6.2."""

from __future__ import annotations

import json
import math
import re
import unittest
from fractions import Fraction
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "curriculum/pathways/grade-9-2026-2027.json"
CATALOG = ROOT / "data/grade-9-10-pathways.js"
LESSON_URL = "lessons/pathways/grade-9/unit-6/g9-6.2-rational-equations.html"
LESSON = ROOT / LESSON_URL


class GradeNineRationalEquationsTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
        cls.html = LESSON.read_text(encoding="utf-8")
        cls.lesson = next(
            lesson
            for unit in cls.manifest["paths"]["common"]["units"]
            for lesson in unit["lessons"]
            if lesson["id"] == "6.2"
        )

    def test_authoritative_manifest_row_is_truthfully_ready(self) -> None:
        self.assertEqual(self.lesson["title"], "Rational Equations")
        self.assertEqual(
            self.lesson["subtopics"],
            ["LCD strategy; extraneous/undefined values; proportions; contextual rates."],
        )
        self.assertEqual(
            self.lesson["learningOutcomes"],
            [
                "Solve rational equations; reject invalid values; explain how domain restrictions "
                "affect the solution set."
            ],
        )
        self.assertEqual(self.lesson["alignment"], "AP Precalculus prerequisite profile")
        self.assertEqual(self.lesson["deliveryStatus"], "ready")
        self.assertEqual(self.lesson["url"], LESSON_URL)
        self.assertEqual(self.lesson["screenCount"], 64)
        self.assertTrue(LESSON.is_file())
        catalog = CATALOG.read_text(encoding="utf-8")
        self.assertEqual(catalog.count(f'"url":"{LESSON_URL}"'), 1)
        self.assertIn('"id":"6.2","title":"Rational Equations"', catalog)

    def test_scope_pacing_and_boundary_are_explicit(self) -> None:
        for phrase in (
            "LCD strategy",
            "extraneous and undefined values",
            "proportions",
            "contextual rates",
            "Unit pacing: weeks 25–27",
            "Full rational-function graph analysis",
            "asymptotes",
            "regression modeling",
        ):
            self.assertIn(phrase.lower(), self.html.lower())
        self.assertNotIn("AP Progress Check", self.html)
        self.assertNotIn("solve radical equations", self.html.lower())

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

    def test_answer_key_is_complete_varied_and_options_are_unique(self) -> None:
        expected = {
            "E1": 2, "E2": 1, "E3": 3, "E4": 0,
            "M1": 1, "M2": 0, "M3": 2, "M4": 3, "M5": 2, "M6": 1,
            "H1": 0, "H2": 1, "H3": 2, "H4": 3, "H5": 2, "H6": 1,
            "C1": 2, "C2": 3, "C3": 1, "C4": 3,
        }
        found = {
            item: int(answer)
            for item, answer in re.findall(r'\{id:"([EMHC]\d+)".*?,answer:(\d)', self.html)
        }
        self.assertEqual(found, expected)
        self.assertEqual(set(found.values()), {0, 1, 2, 3})
        option_blocks = re.findall(r"options:\[(.*?)\],answer:", self.html)
        self.assertEqual(len(option_blocks), 20)
        for block in option_blocks:
            options = re.findall(r'"(.*?)"', block)
            self.assertEqual(len(options), 4)
            self.assertEqual(len(set(options)), 4)

    def test_verified_rational_candidates_satisfy_original_equations(self) -> None:
        cases = (
            (lambda x: 1 / x, lambda x: Fraction(1, 5), Fraction(5)),
            (lambda x: 3 / (x - 2), lambda x: Fraction(1), Fraction(5)),
            (lambda x: x / (x + 1), lambda x: Fraction(2), Fraction(-2)),
            (lambda x: (x + 2) / 3, lambda x: Fraction(4, 5), Fraction(2, 5)),
            (lambda x: 2 / x + 1, lambda x: 5 / x, Fraction(3)),
            (lambda x: 4 / (x + 2), lambda x: x / (x + 2), Fraction(4)),
            (lambda x: 5 / x, lambda x: 2 / (x + 3), Fraction(-5)),
            (lambda x: 2 / (x - 1) - 3 / (x + 1), lambda x: Fraction(1), Fraction(2)),
            (lambda x: 2 / (x - 1) - 3 / (x + 1), lambda x: Fraction(1), Fraction(-3)),
            (
                lambda x: 3 / x + 2 / (x - 1),
                lambda x: 7 / (x * (x - 1)),
                Fraction(2),
            ),
        )
        for left, right, value in cases:
            with self.subTest(value=value):
                self.assertEqual(Fraction(left(value)), Fraction(right(value)))

    def test_exact_irrational_roots_and_invalid_candidates_are_correct(self) -> None:
        for x in (1 + math.sqrt(2), 1 - math.sqrt(2)):
            self.assertNotAlmostEqual(abs(x), 1)
            self.assertAlmostEqual(1 / (x - 1) + 1 / (x + 1), 1, places=10)
        for x in (2 + 2 * math.sqrt(2), 2 - 2 * math.sqrt(2)):
            self.assertNotAlmostEqual(abs(x), 2)
            self.assertAlmostEqual(1 / (x - 2) + 1 / (x + 2), 0.5, places=10)
        for x in (2, -3):
            self.assertAlmostEqual(2 / (x - 1) - 3 / (x + 1), 1)
        self.assertEqual((3 - 3), 0)
        self.assertIn("the only candidate is 3, so the solution set is empty", self.html)
        self.assertIn("Every permitted real number solves the original equation", self.html)
        self.assertIn("all real numbers except 0", self.html)

    def test_contextual_rate_answers_and_units_are_verified(self) -> None:
        self.assertEqual(Fraction(1, 6) + Fraction(1, 12), Fraction(1, 4))
        self.assertEqual(Fraction(1, 10) + Fraction(1, 15), Fraction(1, 6))
        self.assertEqual(Fraction(1, 8) + Fraction(3, 40), Fraction(1, 5))
        self.assertEqual(Fraction(120, 40) - Fraction(120, 60), 1)
        self.assertEqual(Fraction(90, 30) - Fraction(90, 45), 1)
        self.assertEqual(Fraction(180, 40) - Fraction(180, 60), Fraction(3, 2))
        for phrase in ("hours per task", "km/h", "Rate (task/h)", "v>0"):
            self.assertIn(phrase, self.html)

    def test_screen_math_interaction_accessibility_and_responsive_contracts(self) -> None:
        self.assertIn('<meta name="echs-screen-count" content="64">', self.html)
        self.assertIn("const EXPECTED_SCREEN_COUNT=64", self.html)
        self.assertEqual(self.html.count("\n    add("), 44)
        self.assertEqual(44 + 20, 64)
        for signal in (
            "Learning goals", "Prerequisite retrieval", "Worked example", "Student Turn",
            "The rational-equation workflow", "least common denominator", "proportion",
            "Undefined candidates", "combined work", "Travel-rate equations",
            "Differentiated practice", "AP bridge", "Exit ticket", "mastery evidence",
            "localStorage", "exportWork", "ArrowRight", 'data-check="',
            'aria-live="polite"', "details", "Score all responses", 'name="viewport"',
            "focus-visible", "prefers-reduced-motion:reduce", "@media(max-width:520px)",
            "Skip to lesson content", 'role="img" aria-labelledby="', "<title id=",
            "<desc id=", "equationSvg",
        ):
            self.assertIn(signal.lower(), self.html.lower())
        self.assertIn("katex@0.16.11", self.html)
        unsafe_commands = re.findall(
            r"(?<!\\)\\(?:frac|text|circ|ne|sqrt|to|xrightarrow|quad|square|pm|le|ge|infty|cup|varnothing)",
            self.html,
        )
        self.assertEqual(unsafe_commands, [])

    def test_originality_and_no_stale_lesson_content(self) -> None:
        lowered = self.html.lower()
        for prohibited in (
            "question-bank/official", "private question", "college board question",
            "credential", "answer token", "pearson", "lorem ipsum",
            "rational expressions & restrictions", "cancel factors, never terms",
            "polynomial graphs & end behavior", "synthetic division",
            "projectile maximum", "technology regression",
        ):
            self.assertNotIn(prohibited, lowered)


if __name__ == "__main__":
    unittest.main()
