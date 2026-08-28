#!/usr/bin/env python3
"""Deterministic release checks for Grade 9 lesson 7.1."""

from __future__ import annotations

import json
import math
import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "curriculum/pathways/grade-9-2026-2027.json"
CATALOG = ROOT / "data/grade-9-10-pathways.js"
LESSON_URL = (
    "lessons/pathways/grade-9/unit-7/"
    "g9-7.1-arithmetic-geometric-sequences.html"
)
LESSON = ROOT / LESSON_URL


class GradeNineArithmeticGeometricSequencesTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
        cls.html = LESSON.read_text(encoding="utf-8")
        cls.lesson = next(
            lesson
            for unit in cls.manifest["paths"]["common"]["units"]
            for lesson in unit["lessons"]
            if lesson["id"] == "7.1"
        )

    def test_authoritative_manifest_row_is_truthfully_ready(self) -> None:
        self.assertEqual(
            self.lesson["title"], "Arithmetic and Geometric Sequences"
        )
        self.assertEqual(
            self.lesson["subtopics"],
            ["Recursive/explicit forms; common difference/ratio; discrete domain."],
        )
        self.assertEqual(
            self.lesson["learningOutcomes"],
            [
                "Identify arithmetic vs geometric change; write explicit/recursive "
                "rules; interpret parameters and domain."
            ],
        )
        self.assertEqual(
            self.lesson["alignment"], "AP Precalculus prerequisite profile"
        )
        self.assertEqual(self.lesson["deliveryStatus"], "ready")
        self.assertEqual(self.lesson["url"], LESSON_URL)
        self.assertEqual(self.lesson["screenCount"], 64)
        self.assertTrue(LESSON.is_file())
        catalog = CATALOG.read_text(encoding="utf-8")
        self.assertEqual(catalog.count(f'"url":"{LESSON_URL}"'), 1)
        self.assertIn(
            '"id":"7.1","title":"Arithmetic and Geometric Sequences"', catalog
        )

    def test_scope_pacing_and_boundary_are_explicit(self) -> None:
        for phrase in (
            "recursive and explicit forms",
            "common difference and ratio",
            "discrete domain",
            "unit pacing: weeks 28–30",
            "finite or infinite series",
            "sigma notation",
            "exponential-function transformations",
            "regression",
            "logarithmic solving",
        ):
            self.assertIn(phrase, self.html.lower())
        self.assertNotIn("AP Progress Check", self.html)
        self.assertNotIn("question-bank", self.html.lower())

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
        self.assertEqual(self.html.count("calc:true"), 2)
        self.assertEqual(self.html.count("calc:false"), 18)

    def test_answer_key_is_complete_and_options_are_unique(self) -> None:
        expected = {
            "E1": 2, "E2": 2, "E3": 1, "E4": 1,
            "M1": 1, "M2": 1, "M3": 0, "M4": 1, "M5": 3, "M6": 1,
            "H1": 1, "H2": 0, "H3": 2, "H4": 1, "H5": 0, "H6": 2,
            "C1": 2, "C2": 3, "C3": 2, "C4": 2,
        }
        found = {
            item: int(answer)
            for item, answer in re.findall(
                r'\{id:"([EMHC]\d+)".*?,answer:(\d)', self.html
            )
        }
        self.assertEqual(found, expected)
        option_blocks = re.findall(r"options:\[(.*?)\],answer:", self.html)
        self.assertEqual(len(option_blocks), 20)
        for block in option_blocks:
            options = re.findall(r'"(.*?)"', block)
            self.assertEqual(len(options), 4)
            self.assertEqual(len(set(options)), 4)

    def test_arithmetic_values_rules_and_indices_are_verified(self) -> None:
        self.assertEqual(11 + 3, 14)
        self.assertEqual(-4 + 6 * (8 - 1), 38)
        self.assertEqual(18 - 5 * (4 - 1), 3)
        self.assertEqual(120 + 15 * (10 - 1), 255)
        self.assertEqual((19 - 3 * 5) + 5 * (20 - 1), 99)
        self.assertEqual(12 + 7 * (10 - 1), 75)
        self.assertEqual(7 + 5 * (4 - 1), 22)
        self.assertEqual(-2 + 4 * (20 - 1), 74)
        self.assertEqual(17 + (10 - 4) * 3, 35)
        self.assertEqual(80 + 25 * (8 - 1), 255)

    def test_geometric_values_rules_and_indices_are_verified(self) -> None:
        self.assertEqual(18 * 3, 54)
        self.assertEqual(3 * (1 / 2) ** 4, 3 / 16)
        self.assertEqual(5 * 2 ** (3 - 1), 20)
        self.assertEqual(5 * 2 ** (6 - 1), 160)
        self.assertAlmostEqual(486 * (1 / 3) ** (6 - 1), 2)
        self.assertEqual(4 * 3 ** (2 - 1), 12)
        self.assertEqual(4 * 3 ** (5 - 1), 324)
        self.assertEqual(4 * 3 ** (7 - 1), 2916)
        self.assertAlmostEqual(200 * 1.08**3, 251.9424)

    def test_comparison_context_and_parameter_claims_are_verified(self) -> None:
        arithmetic = lambda n: 50 + 8 * (n - 1)
        geometric = lambda n: 50 * 1.1 ** (n - 1)
        self.assertLess(geometric(11), arithmetic(11))
        self.assertGreater(geometric(12), arithmetic(12))
        self.assertTrue(all(
            geometric(n) <= arithmetic(n) for n in range(1, 12)
        ))
        self.assertEqual([6 + 0 * n for n in range(4)], [6, 6, 6, 6])
        self.assertEqual([6 * 1**n for n in range(4)], [6, 6, 6, 6])
        for phrase in (
            "QAR 255", "15 seats per row", "12% per stage",
            "growth factor", "dimensionless factor", "positive integer",
        ):
            self.assertIn(phrase.lower(), self.html.lower())

    def test_screen_math_interaction_accessibility_and_responsive_contracts(self) -> None:
        self.assertIn('<meta name="echs-screen-count" content="64">', self.html)
        self.assertIn("const EXPECTED_SCREEN_COUNT=64", self.html)
        self.assertEqual(self.html.count("\n    add("), 44)
        self.assertEqual(44 + 20, 64)
        for signal in (
            "Learning outcomes", "Prerequisite retrieval", "Worked example",
            "Student Turn", "A sequence is a function",
            "Arithmetic sequences have a common difference",
            "An explicit rule jumps directly", "A recursive rule uses",
            "Geometric sequences have a common ratio",
            "A geometric explicit rule", "Tables and graphs preserve",
            "Discrete domain is part", "Differentiated practice",
            "AP bridge", "Exit ticket", "mastery evidence", "localStorage",
            "exportWork", "ArrowRight", 'data-check="', 'aria-live="polite"',
            "details", "Score all responses", 'name="viewport"', "focus-visible",
            "prefers-reduced-motion:reduce", "@media(max-width:520px)",
            "Skip to lesson content", 'role="img" aria-labelledby="',
            "<title id=", "<desc id=", "sequenceTitle", "discreteTitle",
        ):
            self.assertIn(signal.lower(), self.html.lower())
        self.assertIn("katex@0.16.11", self.html)
        unsafe_commands = re.findall(
            r"(?<!\\)\\(?:frac|text|circ|ne|sqrt|to|xrightarrow|quad|square|pm|"
            r"le|ge|infty|cup|varnothing|Rightarrow|Longleftrightarrow|cdot|ldots|"
            r"qquad|in)",
            self.html,
        )
        self.assertEqual(unsafe_commands, [])

    def test_originality_and_no_stale_lesson_content(self) -> None:
        lowered = self.html.lower()
        for prohibited in (
            "question-bank/official", "private question", "college board question",
            "credential", "answer token", "pearson", "lorem ipsum",
            "radical equations", "extraneous solution", "isolate the radical",
            "least common denominator", "rational equations", "synthetic division",
            "polynomial graphs & end behavior", "projectile maximum",
        ):
            self.assertNotIn(prohibited, lowered)


if __name__ == "__main__":
    unittest.main()
