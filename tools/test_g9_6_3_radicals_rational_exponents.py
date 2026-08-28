#!/usr/bin/env python3
"""Deterministic release checks for Grade 9 lesson 6.3."""

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
LESSON_URL = (
    "lessons/pathways/grade-9/unit-6/"
    "g9-6.3-radicals-rational-exponents.html"
)
LESSON = ROOT / LESSON_URL


class GradeNineRadicalsRationalExponentsTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
        cls.html = LESSON.read_text(encoding="utf-8")
        cls.lesson = next(
            lesson
            for unit in cls.manifest["paths"]["common"]["units"]
            for lesson in unit["lessons"]
            if lesson["id"] == "6.3"
        )

    def test_authoritative_manifest_row_is_truthfully_ready(self) -> None:
        self.assertEqual(self.lesson["title"], "Radicals & Rational Exponents")
        self.assertEqual(
            self.lesson["subtopics"],
            ["Nth roots; rational exponents; exponent laws; simplifying radicals; operations."],
        )
        self.assertEqual(
            self.lesson["learningOutcomes"],
            [
                "Rewrite between radical and rational-exponent forms; simplify radical "
                "expressions; apply exponent rules consistently."
            ],
        )
        self.assertEqual(self.lesson["alignment"], "AP Precalculus prerequisite profile")
        self.assertEqual(self.lesson["deliveryStatus"], "ready")
        self.assertEqual(self.lesson["url"], LESSON_URL)
        self.assertEqual(self.lesson["screenCount"], 64)
        self.assertTrue(LESSON.is_file())
        catalog = CATALOG.read_text(encoding="utf-8")
        self.assertEqual(catalog.count(f'"url":"{LESSON_URL}"'), 1)
        self.assertIn(
            '"id":"6.3","title":"Radicals & Rational Exponents"', catalog
        )

    def test_scope_pacing_and_boundary_are_explicit(self) -> None:
        for phrase in (
            "nth roots",
            "rational exponents",
            "exponent laws",
            "simplifying radicals",
            "operations",
            "unit pacing: weeks 25–27",
            "deferred to 6.4",
            "extraneous solutions",
            "full radical-function transformations",
        ):
            self.assertIn(phrase, self.html.lower())
        self.assertNotIn("AP Progress Check", self.html)
        self.assertNotIn("question-bank", self.html.lower())
        self.assertNotIn("solve: √", self.html)

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
        self.assertEqual(self.html.count('calc:true'), 1)
        self.assertEqual(self.html.count('calc:false'), 19)

    def test_answer_key_is_complete_varied_and_options_are_unique(self) -> None:
        expected = {
            "E1": 1, "E2": 0, "E3": 0, "E4": 1,
            "M1": 1, "M2": 0, "M3": 1, "M4": 1, "M5": 1, "M6": 1,
            "H1": 1, "H2": 0, "H3": 1, "H4": 0, "H5": 1, "H6": 0,
            "C1": 2, "C2": 1, "C3": 0, "C4": 2,
        }
        found = {
            item: int(answer)
            for item, answer in re.findall(
                r'\{id:"([EMHC]\d+)".*?,answer:(\d)', self.html
            )
        }
        self.assertEqual(found, expected)
        self.assertEqual(set(found.values()), {0, 1, 2})
        option_blocks = re.findall(r"options:\[(.*?)\],answer:", self.html)
        self.assertEqual(len(option_blocks), 20)
        for block in option_blocks:
            options = re.findall(r'"(.*?)"', block)
            self.assertEqual(len(options), 4)
            self.assertEqual(len(set(options)), 4)
        for equivalent_distractor in ("4|a|²", "6√4", "2|x|²∛(3x)"):
            self.assertNotIn(equivalent_distractor, self.html)

    def test_numeric_roots_and_approximations_are_verified(self) -> None:
        self.assertEqual(math.isqrt(144), 12)
        self.assertEqual((-6) ** 3, -216)
        self.assertEqual(round(32 ** Fraction(2, 5)), 4)
        self.assertAlmostEqual(81 ** (-3 / 4), 1 / 27, places=12)
        self.assertAlmostEqual(7 ** (2 / 3), 3.6593057100, places=9)
        self.assertEqual(round(7 ** (2 / 3), 2), 3.66)
        self.assertEqual(6 * math.sqrt(3), math.sqrt(108))

    def test_radical_simplifications_and_operations_are_verified(self) -> None:
        for x in (0, 1, 4, 9):
            self.assertAlmostEqual(
                math.sqrt(18 * x**3),
                3 * x * math.sqrt(2 * x),
            )
        self.assertAlmostEqual(
            2 * (54 ** (1 / 3)) - 16 ** (1 / 3),
            4 * (2 ** (1 / 3)),
            places=10,
        )
        for x in (-3, -1, 0, 2):
            cube_root = math.copysign(abs(24 * x**7) ** (1 / 3), 24 * x**7)
            rhs = 2 * x**2 * math.copysign(abs(3 * x) ** (1 / 3), 3 * x)
            self.assertAlmostEqual(cube_root, rhs, places=9)
            self.assertEqual((16 * x**8) ** Fraction(1, 4), 2 * x**2)
        self.assertAlmostEqual(
            math.sqrt(75) + 2 * math.sqrt(12),
            9 * math.sqrt(3),
        )
        self.assertEqual(round(math.sqrt(6) * math.sqrt(24)), 12)

    def test_domains_exponent_laws_and_principal_values_are_correct(self) -> None:
        for x in (-8, -1, 0, 1, 8):
            inner = math.copysign(abs(x) ** (1 / 3), x) ** 2
            self.assertAlmostEqual(inner ** (3 / 2), abs(x), places=10)
            self.assertEqual(math.sqrt(x**2), abs(x))
        self.assertTrue(all(5 - 2 * x >= 0 for x in (-10, 0, 2.5)))
        self.assertTrue(all(5 - 2 * x < 0 for x in (3, 10)))
        self.assertEqual(
            Fraction(5, 6) + Fraction(1, 3) - Fraction(1, 2),
            Fraction(2, 3),
        )
        self.assertEqual(
            Fraction(7, 8) + Fraction(1, 4) - Fraction(3, 8),
            Fraction(3, 4),
        )
        self.assertIn("x² with x≠0", self.html)
        self.assertIn("x>4", self.html)
        self.assertIn("√(x²)=|x|", self.html)

    def test_screen_math_interaction_accessibility_and_responsive_contracts(self) -> None:
        self.assertIn('<meta name="echs-screen-count" content="64">', self.html)
        self.assertIn("const EXPECTED_SCREEN_COUNT=64", self.html)
        self.assertEqual(self.html.count("\n    add("), 44)
        self.assertEqual(44 + 20, 64)
        for signal in (
            "Learning outcomes", "Prerequisite retrieval", "Worked example", "Student Turn",
            "Nth roots undo powers", "Rational exponents encode roots",
            "Root parity controls the real domain", "Extract perfect powers",
            "Multiply and divide compatible radicals", "Add only like radical terms",
            "Differentiated practice", "AP bridge", "Exit ticket", "mastery evidence",
            "localStorage", "exportWork", "ArrowRight", 'data-check="',
            'aria-live="polite"', "details", "Score all responses", 'name="viewport"',
            "focus-visible", "prefers-reduced-motion:reduce", "@media(max-width:520px)",
            "Skip to lesson content", 'role="img" aria-labelledby="', "<title id=",
            "<desc id=", "rootMapTitle", "expFlowTitle",
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
            "rational equations", "least common denominator", "combined work",
            "travel-rate equations", "polynomial graphs & end behavior",
            "synthetic division", "projectile maximum", "technology regression",
        ):
            self.assertNotIn(prohibited, lowered)


if __name__ == "__main__":
    unittest.main()
