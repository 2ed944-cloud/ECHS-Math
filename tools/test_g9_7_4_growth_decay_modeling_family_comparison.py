#!/usr/bin/env python3
"""Deterministic release checks for Grade 9 lesson 7.4."""

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
    "g9-7.4-growth-decay-modeling-family-comparison.html"
)
LESSON = ROOT / LESSON_URL


class GradeNineGrowthDecayModelingFamilyComparisonTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
        cls.html = LESSON.read_text(encoding="utf-8")
        cls.lesson = next(
            lesson
            for unit in cls.manifest["paths"]["common"]["units"]
            for lesson in unit["lessons"]
            if lesson["id"] == "7.4"
        )

    def test_authoritative_manifest_row_is_truthfully_ready(self) -> None:
        self.assertEqual(
            self.lesson["title"],
            "Growth/Decay Modeling & Family Comparison",
        )
        self.assertEqual(
            self.lesson["subtopics"],
            [
                "Compound growth; decay; data fitting; compare linear, "
                "quadratic, exponential patterns."
            ],
        )
        self.assertEqual(
            self.lesson["learningOutcomes"],
            [
                "Select an appropriate model family from data/context; fit "
                "and interpret an exponential model; justify model choice "
                "using rate patterns/residual evidence."
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
            '"id":"7.4","title":"Growth/Decay Modeling & Family Comparison"',
            catalog,
        )

    def test_scope_pacing_residuals_and_boundary_are_explicit(self) -> None:
        for phrase in (
            "compound growth", "decay", "structured data fitting",
            "linear", "quadratic", "exponential", "residual evidence",
            "unit pacing: weeks 28–30", "logarithms",
            "solving unmatched exponential equations", "continuous compounding",
            "noisy open regression", "semi-log", "formal residual analysis",
            "open model selection",
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
            "E1": 0, "E2": 1, "E3": 2, "E4": 1,
            "M1": 0, "M2": 1, "M3": 1, "M4": 1, "M5": 1, "M6": 2,
            "H1": 0, "H2": 2, "H3": 1, "H4": 1, "H5": 0, "H6": 1,
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

    def test_growth_decay_and_comparison_values_are_verified(self) -> None:
        self.assertAlmostEqual(240 * 1.05**3, 277.83)
        self.assertAlmostEqual(800 * 0.9**2, 648)
        self.assertAlmostEqual(500 * 1.04**5, 608.3264512)
        self.assertAlmostEqual(640 * 0.5 ** (12 / 4), 80)
        self.assertAlmostEqual(10 * 1.2**3, 17.28)
        self.assertAlmostEqual(2500 * 1.04**3, 2812.16)
        self.assertLess(100 * 1.25**4, 100 + 40 * 4)
        self.assertGreater(100 * 1.25**5, 100 + 40 * 5)
        self.assertEqual([2, 6, 10], [b - a for a, b in zip([3, 5, 11], [5, 11, 21])])

    def test_family_fingerprints_fit_and_residuals_are_correct(self) -> None:
        for phrase in (
            "constant first differences", "constant second differences",
            "constant ratios", "observed minus predicted", "0, 0, −1",
            "small residuals", "systematic pattern", "meaningful domain",
            "interpolation", "extrapolation", "constant-rate assumption",
        ):
            self.assertIn(phrase.lower(), self.html.lower())
        self.assertEqual([170 / 200, 144.5 / 170], [0.85, 0.85])
        self.assertEqual([9 / 6, 13.5 / 9, 20.25 / 13.5], [1.5] * 3)
        observed = [10, 20, 39]
        predicted = [10 * 2**t for t in range(3)]
        self.assertEqual([o - p for o, p in zip(observed, predicted)], [0, 0, -1])

    def test_screen_math_interaction_accessibility_and_responsive_contracts(self) -> None:
        self.assertIn('<meta name="echs-screen-count" content="64">', self.html)
        self.assertIn("const EXPECTED_SCREEN_COUNT=64", self.html)
        self.assertEqual(self.html.count("\n    add("), 44)
        for signal in (
            "Learning outcomes", "Prerequisite retrieval", "Worked example",
            "Student Turn", "Compound growth", "Decay", "Data fitting",
            "Linear", "Quadratic", "Exponential", "Residuals",
            "Differentiated practice", "AP bridge", "Exit ticket",
            "mastery evidence", "localStorage", "exportWork", "ArrowRight",
            'data-check="', 'aria-live="polite"', "details",
            "Score all responses", 'name="viewport"', "focus-visible",
            "prefers-reduced-motion:reduce", "@media(max-width:520px)",
            "Skip to lesson content", 'role="img" aria-labelledby="',
            "<title id=", "<desc id=", "familyTitle", "compareTitle",
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
            "equivalent exponential forms", "exponent-law reference",
            "rational exponents", "common base", "recursive arithmetic",
            "radical equations", "synthetic division",
        ):
            self.assertNotIn(prohibited, lowered)

    def test_calculator_and_no_calculator_labels_are_meaningful(self) -> None:
        self.assertIn("F(t)=500(1.04)^t", self.html)
        self.assertIn("when does E(t)=100(1.25)^t first exceed", self.html)
        self.assertIn("Calculator permitted", self.html)
        self.assertIn("No calculator", self.html)


if __name__ == "__main__":
    unittest.main()
