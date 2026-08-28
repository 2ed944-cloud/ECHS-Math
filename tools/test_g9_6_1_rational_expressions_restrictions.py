#!/usr/bin/env python3
"""Deterministic release checks for Grade 9 lesson 6.1."""

from __future__ import annotations

import json
import re
import unittest
from fractions import Fraction
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "curriculum/pathways/grade-9-2026-2027.json"
CATALOG = ROOT / "data/grade-9-10-pathways.js"
LESSON_URL = "lessons/pathways/grade-9/unit-6/g9-6.1-rational-expressions-restrictions.html"
LESSON = ROOT / LESSON_URL


class GradeNineRationalExpressionsRestrictionsTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
        cls.html = LESSON.read_text(encoding="utf-8")
        cls.lesson = next(
            lesson
            for unit in cls.manifest["paths"]["common"]["units"]
            for lesson in unit["lessons"]
            if lesson["id"] == "6.1"
        )

    def test_authoritative_manifest_row_is_truthfully_ready(self) -> None:
        self.assertEqual(self.lesson["title"], "Rational Expressions & Restrictions")
        self.assertEqual(
            self.lesson["subtopics"],
            ["Factoring; simplifying; excluded values; multiplication/division; common denominators."],
        )
        self.assertEqual(
            self.lesson["learningOutcomes"],
            [
                "Simplify rational expressions while preserving restrictions; perform operations; "
                "distinguish equivalent expressions from equivalent functions with domain restrictions."
            ],
        )
        self.assertEqual(self.lesson["alignment"], "AP Precalculus prerequisite profile")
        self.assertEqual(self.lesson["deliveryStatus"], "ready")
        self.assertEqual(self.lesson["url"], LESSON_URL)
        self.assertEqual(self.lesson["screenCount"], 64)
        self.assertTrue(LESSON.is_file())
        catalog = CATALOG.read_text(encoding="utf-8")
        self.assertEqual(catalog.count(f'"url":"{LESSON_URL}"'), 1)
        self.assertIn('"id":"6.1","title":"Rational Expressions & Restrictions"', catalog)

    def test_scope_pacing_and_cross_lesson_boundary_are_explicit(self) -> None:
        for phrase in (
            "Factoring; simplifying; excluded values",
            "multiplication and division",
            "common denominators",
            "Unit pacing: weeks 25–27",
            "Solving rational equations belongs to Lesson 6.2",
            "Full rational-function graph analysis",
        ):
            self.assertIn(phrase.lower(), self.html.lower())
        self.assertNotIn("solve rational equations and reject", self.html.lower())
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
        self.assertNotIn("calc:true", self.html)

    def test_answer_key_is_complete_varied_and_options_are_unique(self) -> None:
        expected = {
            "E1": 0, "E2": 0, "E3": 1, "E4": 1,
            "M1": 0, "M2": 1, "M3": 0, "M4": 1, "M5": 0, "M6": 2,
            "H1": 2, "H2": 3, "H3": 1, "H4": 2, "H5": 3, "H6": 1,
            "C1": 2, "C2": 2, "C3": 1, "C4": 3,
        }
        found = {
            item: int(answer)
            for item, answer in re.findall(r'\{id:"([EMHC]\d+)".*?,answer:(\d)', self.html)
        }
        self.assertEqual(found, expected)
        self.assertEqual(set(found.values()), {0, 1, 2, 3})
        option_blocks = re.findall(r'options:\[(.*?)\],answer:', self.html)
        self.assertEqual(len(option_blocks), 20)
        for block in option_blocks:
            options = re.findall(r'"(.*?)"', block)
            self.assertEqual(len(options), 4)
            self.assertEqual(len(set(options)), 4)

    def test_all_rational_results_hold_on_their_allowed_domains(self) -> None:
        samples = tuple(range(-7, 8))

        def check(left, right, excluded):
            for value in samples:
                if value in excluded:
                    continue
                x = Fraction(value)
                with self.subTest(x=value, excluded=excluded):
                    self.assertEqual(Fraction(left(x)), Fraction(right(x)))

        check(lambda x: (x * x - 9) / (x - 3), lambda x: x + 3, {3})       # E3
        check(lambda x: (x * x - 4) / (x * x + x - 6), lambda x: (x + 2) / (x + 3), {2, -3})  # M1
        check(lambda x: (3 * x / 4) * (8 / (x * x)), lambda x: 6 / x, {0})  # M2
        check(
            lambda x: ((x * x - 1) / (x + 2)) / ((x - 1) / (x + 2)),
            lambda x: x + 1,
            {-2, 1},
        )  # M3
        check(lambda x: 2 / x + 3 / (2 * x), lambda x: 7 / (2 * x), {0})  # M4
        check(
            lambda x: 1 / (x - 1) - 2 / (x + 1),
            lambda x: (3 - x) / (x * x - 1),
            {-1, 1},
        )  # M5
        check(
            lambda x: (x * x - 5 * x + 6) / (x * x - 4),
            lambda x: (x - 3) / (x + 2),
            {-2, 2},
        )  # H1
        check(
            lambda x: ((x * x - 9) / (x * x - x - 6)) * ((x - 3) / (x + 3)),
            lambda x: (x - 3) / (x + 2),
            {-3, -2, 3},
        )  # H2
        check(
            lambda x: ((x * x - 4) / (x * x - 1)) / ((x - 2) / (x + 1)),
            lambda x: (x + 2) / (x - 1),
            {-1, 1, 2},
        )  # H3
        check(
            lambda x: 3 / (x + 2) - 1 / (x - 2),
            lambda x: 2 * (x - 4) / (x * x - 4),
            {-2, 2},
        )  # H4
        check(lambda x: 1 / x + 1 / (x + 1), lambda x: (2 * x + 1) / (x * (x + 1)), {-1, 0})  # H5
        check(
            lambda x: ((x * x - 1) / ((x + 1) ** 2)) * ((x + 1) / (x - 1)),
            lambda x: 1,
            {-1, 1},
        )  # H6
        check(
            lambda x: x / (x - 1) - 1 / (x + 1),
            lambda x: (x * x + 1) / (x * x - 1),
            {-1, 1},
        )  # C3
        check(
            lambda x: ((x * x - 4) / (x * x - 2 * x)) / ((x + 2) / x),
            lambda x: 1,
            {-2, 0, 2},
        )  # C4

    def test_screen_plan_is_64_meaningful_screens(self) -> None:
        self.assertIn('<meta name="echs-screen-count" content="64">', self.html)
        self.assertIn("const EXPECTED_SCREEN_COUNT=64", self.html)
        self.assertEqual(self.html.count("\n    add("), 44)
        self.assertEqual(44 + 20, 64)
        for signal in (
            "Learning goals", "Prerequisite retrieval", "Worked example", "Student Turn",
            "Restrictions begin with the original denominator", "Cancel factors, never terms",
            "Multiplication uses factored structure", "Division adds a nonzero-divisor condition",
            "Build the LCD", "Differentiated practice", "AP bridge", "Exit ticket",
            "mastery evidence",
        ):
            self.assertIn(signal.lower(), self.html.lower())

    def test_math_interaction_accessibility_and_responsiveness_contracts(self) -> None:
        self.assertIn("katex@0.16.11", self.html)
        self.assertGreaterEqual(self.html.count('math("') + self.html.count('class="math" data-tex='), 25)
        unsafe_commands = re.findall(
            r'(?<!\\)\\(?:frac|text|circ|ne|sqrt|to|xrightarrow|quad|square|pm|le|ge|infty|cup)',
            self.html,
        )
        self.assertEqual(unsafe_commands, [])
        for signal in (
            "localStorage", "exportWork", "ArrowRight", 'data-check="',
            'aria-live="polite"', "details", "Score all responses", 'name="viewport"',
            "focus-visible", "prefers-reduced-motion:reduce", "@media(max-width:520px)",
            "Skip to lesson content", 'role="img" aria-labelledby="', "<title id=",
            "<desc id=", "domainSvg",
        ):
            self.assertIn(signal, self.html)

    def test_originality_scope_and_no_stale_lesson_content(self) -> None:
        lowered = self.html.lower()
        for prohibited in (
            "question-bank/official", "private question", "college board question",
            "credential", "answer token", "pearson", "lorem ipsum",
            "polynomial graphs & end behavior", "leading-term test", "turning-point",
            "synthetic division", "projectile maximum", "technology regression",
        ):
            self.assertNotIn(prohibited, lowered)


if __name__ == "__main__":
    unittest.main()
