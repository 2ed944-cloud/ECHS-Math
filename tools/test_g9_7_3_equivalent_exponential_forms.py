#!/usr/bin/env python3
"""Deterministic release checks for Grade 9 lesson 7.3."""

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
    "g9-7.3-equivalent-exponential-forms.html"
)
LESSON = ROOT / LESSON_URL


class GradeNineEquivalentExponentialFormsTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
        cls.html = LESSON.read_text(encoding="utf-8")
        cls.lesson = next(
            lesson
            for unit in cls.manifest["paths"]["common"]["units"]
            for lesson in unit["lessons"]
            if lesson["id"] == "7.3"
        )

    def test_authoritative_manifest_row_is_truthfully_ready(self) -> None:
        self.assertEqual(self.lesson["title"], "Equivalent Exponential Forms")
        self.assertEqual(
            self.lesson["subtopics"],
            [
                "Exponent laws; percent rate vs growth factor; equivalent "
                "bases; rational exponents."
            ],
        )
        self.assertEqual(
            self.lesson["learningOutcomes"],
            [
                "Rewrite exponential expressions usefully; convert between "
                "percent rate and factor; explain how equivalent forms reveal "
                "different information."
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
            '"id":"7.3","title":"Equivalent Exponential Forms"', catalog
        )

    def test_scope_pacing_and_boundary_are_explicit(self) -> None:
        for phrase in (
            "exponent laws", "percent rate versus growth factor",
            "equivalent bases", "rational exponents",
            "unit pacing: weeks 28–30", "logarithms",
            "solving unmatched exponential equations", "continuous compounding",
            "regression", "semi-log", "open model selection",
            "residual analysis",
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
            "E1": 0, "E2": 1, "E3": 2, "E4": 1,
            "M1": 0, "M2": 1, "M3": 1, "M4": 1, "M5": 1, "M6": 2,
            "H1": 2, "H2": 2, "H3": 1, "H4": 1, "H5": 0, "H6": 1,
            "C1": 1, "C2": 0, "C3": 2, "C4": 2,
        }
        found = {
            item: int(answer)
            for item, answer in re.findall(
                r'\{id:"([EMHC]\d+)".*?,answer:(\d)', self.html
            )
        }
        self.assertEqual(found, expected)
        blocks = re.findall(r"options:\[(.*?)\],answer:", self.html)
        self.assertEqual(len(blocks), 20)
        for block in blocks:
            options = re.findall(r'"(.*?)"', block)
            self.assertEqual(len(options), 4)
            self.assertEqual(len(set(options)), 4)

    def test_exponent_rewrites_are_verified(self) -> None:
        for x in (-3, -1, 0, 1, 2, 2.5):
            self.assertAlmostEqual(4**x, 2 ** (2 * x))
            self.assertAlmostEqual(9 ** (x / 2), 3**x)
            self.assertAlmostEqual(64 ** (x / 3), 4**x)
            self.assertAlmostEqual(32 ** (2 * x / 5), 4**x)
            self.assertAlmostEqual(81 ** ((x - 2) / 4), 3 ** (x - 2))
            self.assertAlmostEqual(2 ** (x + 3), 8 * 2**x)
            self.assertAlmostEqual(3 * 9 ** (x - 1), 3 ** (2 * x - 1))
        self.assertAlmostEqual(16 ** (3 / 4), 8)
        self.assertAlmostEqual(125 ** (1 / 3), 5)

    def test_rate_factor_and_interval_values_are_verified(self) -> None:
        self.assertAlmostEqual(1 + 0.12, 1.12)
        self.assertAlmostEqual(1 - 0.07, 0.93)
        self.assertAlmostEqual(1 - 0.84, 0.16)
        self.assertAlmostEqual(1.125 - 1, 0.125)
        self.assertAlmostEqual(1.02**12, 1.2682417945625455)
        self.assertAlmostEqual(math.sqrt(0.92) ** 2, 0.92)
        for phrase in (
            "12% growth", "b=1+0.12=1.12", "7% decay", "b=1−0.07=0.93",
            "16% decay", "12.5% growth", "1.26824", "√0.92",
        ):
            self.assertIn(phrase, self.html)

    def test_forms_are_interpreted_and_verified(self) -> None:
        for phrase in (
            "same output", "what becomes visible", "one-unit factor",
            "common base", "percent growth", "growth/decay",
            "verify algebraically and numerically", "preserve the coefficient",
            "same table", "same points", "same function",
        ):
            self.assertIn(phrase.lower(), self.html.lower())

    def test_screen_math_interaction_accessibility_and_responsive_contracts(self) -> None:
        self.assertIn('<meta name="echs-screen-count" content="64">', self.html)
        self.assertIn("const EXPECTED_SCREEN_COUNT=64", self.html)
        self.assertEqual(self.html.count("\n    add("), 44)
        for signal in (
            "Learning outcomes", "Prerequisite retrieval", "Worked example",
            "Student Turn", "Exponent-law reference", "Percent rate",
            "Growth factor", "Decay factor", "Equivalent bases",
            "Rational exponents", "Differentiated practice", "AP bridge",
            "Exit ticket", "mastery evidence", "localStorage", "exportWork",
            "ArrowRight", 'data-check="', 'aria-live="polite"', "details",
            "Score all responses", 'name="viewport"', "focus-visible",
            "prefers-reduced-motion:reduce", "@media(max-width:520px)",
            "Skip to lesson content", 'role="img" aria-labelledby="',
            "<title id=", "<desc id=", "equivTitle",
        ):
            self.assertIn(signal.lower(), self.html.lower())
        self.assertIn("katex@0.16.11", self.html)
        unsafe = re.findall(
            r"(?<!\\)\\(?:frac|text|circ|ne|sqrt|to|xrightarrow|quad|square|pm|"
            r"le|ge|infty|cup|varnothing|Rightarrow|Longleftrightarrow|cdot)",
            self.html,
        )
        self.assertEqual(unsafe, [])

    def test_originality_and_no_stale_lesson_content(self) -> None:
        lowered = self.html.lower()
        for prohibited in (
            "question-bank/official", "private question", "college board question",
            "credential", "answer token", "pearson", "lorem ipsum",
            "arithmetic and geometric sequences", "common difference",
            "recursive arithmetic", "radical equations", "extraneous solution",
            "least common denominator", "synthetic division",
            "negative coefficient", "constant output ratios",
        ):
            self.assertNotIn(prohibited, lowered)


if __name__ == "__main__":
    unittest.main()
