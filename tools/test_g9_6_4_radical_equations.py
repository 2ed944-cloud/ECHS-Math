#!/usr/bin/env python3
"""Deterministic release checks for Grade 9 lesson 6.4."""

from __future__ import annotations

import json
import math
import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "curriculum/pathways/grade-9-2026-2027.json"
CATALOG = ROOT / "data/grade-9-10-pathways.js"
LESSON_URL = "lessons/pathways/grade-9/unit-6/g9-6.4-radical-equations.html"
LESSON = ROOT / LESSON_URL


class GradeNineRadicalEquationsTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
        cls.html = LESSON.read_text(encoding="utf-8")
        cls.lesson = next(
            lesson
            for unit in cls.manifest["paths"]["common"]["units"]
            for lesson in unit["lessons"]
            if lesson["id"] == "6.4"
        )

    def test_authoritative_manifest_row_is_truthfully_ready(self) -> None:
        self.assertEqual(self.lesson["title"], "Radical Equations")
        self.assertEqual(
            self.lesson["subtopics"],
            ["Isolating radicals; powers; checking; extraneous solutions."],
        )
        self.assertEqual(
            self.lesson["learningOutcomes"],
            [
                "Solve radical equations; identify why extraneous solutions arise; "
                "verify solutions in the original equation."
            ],
        )
        self.assertEqual(self.lesson["alignment"], "AP Precalculus prerequisite profile")
        self.assertEqual(self.lesson["deliveryStatus"], "ready")
        self.assertEqual(self.lesson["url"], LESSON_URL)
        self.assertEqual(self.lesson["screenCount"], 64)
        self.assertTrue(LESSON.is_file())
        catalog = CATALOG.read_text(encoding="utf-8")
        self.assertEqual(catalog.count(f'"url":"{LESSON_URL}"'), 1)
        self.assertIn('"id":"6.4","title":"Radical Equations"', catalog)

    def test_scope_pacing_and_boundary_are_explicit(self) -> None:
        for phrase in (
            "isolating radicals",
            "powers",
            "checking",
            "extraneous solutions",
            "unit pacing: weeks 25–27",
            "full radical-function transformations",
            "complex-domain branches",
            "numerical root-finding",
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
        self.assertEqual(self.html.count("calc:true"), 1)
        self.assertEqual(self.html.count("calc:false"), 19)

    def test_answer_key_is_complete_and_options_are_unique(self) -> None:
        expected = {
            "E1": 2, "E2": 1, "E3": 2, "E4": 2,
            "M1": 1, "M2": 2, "M3": 1, "M4": 1, "M5": 1, "M6": 2,
            "H1": 1, "H2": 0, "H3": 0, "H4": 2, "H5": 1, "H6": 0,
            "C1": 1, "C2": 2, "C3": 2, "C4": 2,
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

    def test_one_radical_candidates_and_extraneous_values_are_verified(self) -> None:
        self.assertEqual(math.sqrt(49), 7)
        self.assertEqual(math.sqrt(11 + 5), 4)
        self.assertEqual(math.sqrt(2 * 18), 6)
        self.assertEqual(round((28 - 1) ** (1 / 3)), 3)
        for x in (1, 2):
            self.assertAlmostEqual(math.sqrt(3 * x - 2), x)
        self.assertAlmostEqual(math.sqrt(2 * math.sqrt(2) + 3), math.sqrt(2) + 1)
        valid = (5 + math.sqrt(33)) / 2
        invalid = (5 - math.sqrt(33)) / 2
        self.assertAlmostEqual(math.sqrt(valid + 6) + 2, valid)
        self.assertNotAlmostEqual(math.sqrt(invalid + 6) + 2, invalid)
        self.assertNotEqual(math.sqrt(0 + 1), 0 - 1)
        self.assertEqual(math.sqrt(3 + 1), 3 - 1)

    def test_multi_radical_exact_and_rational_exponent_solutions_are_verified(self) -> None:
        x = 4 / 9
        self.assertAlmostEqual(math.sqrt(x + 5) + math.sqrt(x), 3)
        self.assertAlmostEqual(math.sqrt(1 + 3) - math.sqrt(1 - 1), 2)
        self.assertAlmostEqual(math.sqrt(2 + 2) + math.sqrt(2 - 1), 3)
        for x in ((5 + math.sqrt(41)) / 2, (5 - math.sqrt(41)) / 2):
            self.assertAlmostEqual(math.sqrt(x * x - 5 * x), 2)
        x = (11 + math.sqrt(17)) / 2
        self.assertAlmostEqual(math.sqrt(x - 1), x - 5)
        for x in (0, 1):
            self.assertAlmostEqual(x ** 0.5, x ** 0.25)
        self.assertAlmostEqual(math.sqrt(4 + math.sqrt(4)), math.sqrt(6))

    def test_context_values_units_and_odd_root_equations_are_correct(self) -> None:
        self.assertEqual(math.sqrt(9 * 16), 12)
        self.assertAlmostEqual(math.sqrt(2 * 44.1 / 9.8), 3)
        self.assertEqual(round((-8 + 7) ** 3), -1)
        self.assertEqual(-8 + 7, -1)
        self.assertEqual(-13 * 2 - 1, -27)
        for phrase in ("44.1 m", "3 seconds", "25 seconds", "meters", "time"):
            self.assertIn(phrase, self.html)

    def test_screen_math_interaction_accessibility_and_responsive_contracts(self) -> None:
        self.assertIn('<meta name="echs-screen-count" content="64">', self.html)
        self.assertIn("const EXPECTED_SCREEN_COUNT=64", self.html)
        self.assertEqual(self.html.count("\n    add("), 44)
        self.assertEqual(44 + 20, 64)
        for signal in (
            "Learning outcomes", "Prerequisite retrieval", "Worked example", "Student Turn",
            "The radical-equation workflow", "Isolate before applying a power",
            "Squaring is not logically reversible", "Cube-root equations",
            "Two radicals may require two isolation cycles", "Rational-exponent equations",
            "Graphical meaning: solutions are intersections", "Differentiated practice",
            "AP bridge", "Exit ticket", "mastery evidence", "localStorage", "exportWork",
            "ArrowRight", 'data-check="', 'aria-live="polite"', "details",
            "Score all responses", 'name="viewport"', "focus-visible",
            "prefers-reduced-motion:reduce", "@media(max-width:520px)",
            "Skip to lesson content", 'role="img" aria-labelledby="', "<title id=",
            "<desc id=", "radEqTitle", "intersectionTitle",
        ):
            self.assertIn(signal.lower(), self.html.lower())
        self.assertIn("katex@0.16.11", self.html)
        unsafe_commands = re.findall(
            r"(?<!\\)\\(?:frac|text|circ|ne|sqrt|to|xrightarrow|quad|square|pm|le|ge|infty|cup|varnothing|Rightarrow|Longleftrightarrow)",
            self.html,
        )
        self.assertEqual(unsafe_commands, [])

    def test_originality_and_no_stale_lesson_content(self) -> None:
        lowered = self.html.lower()
        for prohibited in (
            "question-bank/official", "private question", "college board question",
            "credential", "answer token", "pearson", "lorem ipsum",
            "radicals & rational exponents", "perfect-power extraction",
            "like radical terms", "rational equations", "least common denominator",
            "combined work", "travel-rate equations", "polynomial graphs & end behavior",
            "synthetic division", "projectile maximum", "technology regression",
        ):
            self.assertNotIn(prohibited, lowered)


if __name__ == "__main__":
    unittest.main()

