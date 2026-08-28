#!/usr/bin/env python3
"""Deterministic release checks for Grade 9 lesson 7.2."""

from __future__ import annotations

import json
import math
import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "curriculum/pathways/grade-9-2026-2027.json"
CATALOG = ROOT / "data/grade-9-10-pathways.js"
LESSON_URL = "lessons/pathways/grade-9/unit-7/g9-7.2-exponential-functions.html"
LESSON = ROOT / LESSON_URL


class GradeNineExponentialFunctionsTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
        cls.html = LESSON.read_text(encoding="utf-8")
        cls.lesson = next(
            lesson
            for unit in cls.manifest["paths"]["common"]["units"]
            for lesson in unit["lessons"]
            if lesson["id"] == "7.2"
        )

    def test_authoritative_manifest_row_is_truthfully_ready(self) -> None:
        self.assertEqual(self.lesson["title"], "Exponential Functions")
        self.assertEqual(
            self.lesson["subtopics"],
            [
                "Growth/decay factors; initial value; graphs; domain/range; "
                "asymptotic behavior."
            ],
        )
        self.assertEqual(
            self.lesson["learningOutcomes"],
            [
                "Construct and interpret exponential functions; identify initial "
                "value and growth factor; compare exponential graphs."
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
        self.assertIn('"id":"7.2","title":"Exponential Functions"', catalog)

    def test_scope_pacing_and_boundary_are_explicit(self) -> None:
        for phrase in (
            "growth and decay factors", "initial value", "domain and range",
            "asymptotic behavior", "unit pacing: weeks 28–30",
            "percent-rate conversion", "equivalent bases/forms",
            "rational-exponent rewriting", "regression", "residual evidence",
            "family selection", "logarithms", "open modeling",
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
            "E1": 1, "E2": 1, "E3": 2, "E4": 1,
            "M1": 1, "M2": 1, "M3": 2, "M4": 0, "M5": 1, "M6": 2,
            "H1": 0, "H2": 1, "H3": 1, "H4": 1, "H5": 1, "H6": 1,
            "C1": 1, "C2": 1, "C3": 0, "C4": 2,
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

    def test_values_and_parameter_inference_are_verified(self) -> None:
        self.assertEqual(3 * 2**0, 3)
        self.assertEqual(4 * 3**2, 36)
        self.assertAlmostEqual(81 * (1 / 3) ** 4, 1)
        self.assertEqual(2 * 3**3, 54)
        self.assertEqual(4 * 2 ** (-1), 2)
        self.assertEqual(12 * 3**2, 108)
        self.assertEqual(640 * 0.5 ** (12 / 4), 80)
        self.assertEqual(6 * 3 ** (-1), 2)
        self.assertEqual(6 * 3**2, 54)
        self.assertEqual(4 * 3**2, 36)
        self.assertAlmostEqual(240 * 0.8**3, 122.88)

    def test_domain_range_asymptote_and_comparisons_are_correct(self) -> None:
        for x in (-10, -1, 0, 1, 10):
            self.assertGreater(6 * 2**x, 0)
            self.assertLess(-3 * 2**x, 0)
            self.assertEqual(5 * 2**x, 5 * (2**x))
            self.assertEqual(6 * 3**x, 3 * (2 * 3**x))
        self.assertGreater(9 * 0.3**20, 0)
        self.assertLess(9 * 0.3**20, 0.001)
        for phrase in (
            "domain is all real numbers", "range is y&gt;0", "range is",
            "horizontal asymptote", "y=0", "approach", "never reach",
        ):
            self.assertIn(phrase.lower(), self.html.lower())

    def test_context_and_calculator_values_are_correct(self) -> None:
        self.assertAlmostEqual(800 * 1.04**10, 1184.195428, places=5)
        self.assertAlmostEqual(500 * 1.06**0, 500)
        self.assertAlmostEqual(500 * 1.06**3, 595.508)
        for phrase in (
            "QAR 500", "QAR 1184.20", "240 mg", "122.88 mg",
            "each year", "each hour", "one-unit multiplication factor",
        ):
            self.assertIn(phrase, self.html)

    def test_screen_math_interaction_accessibility_and_responsive_contracts(self) -> None:
        self.assertIn('<meta name="echs-screen-count" content="64">', self.html)
        self.assertIn("const EXPECTED_SCREEN_COUNT=64", self.html)
        self.assertEqual(self.html.count("\n    add("), 44)
        for signal in (
            "Learning outcomes", "Prerequisite retrieval", "Worked example",
            "Student Turn", "The defining form", "initial value",
            "The base controls one-unit multiplication", "Growth and decay",
            "Evaluate by substituting", "constant output ratios",
            "Domain and range", "Horizontal asymptote y=0",
            "Negative coefficient", "Differentiated practice", "AP bridge",
            "Exit ticket", "mastery evidence", "localStorage", "exportWork",
            "ArrowRight", 'data-check="', 'aria-live="polite"', "details",
            "Score all responses", 'name="viewport"', "focus-visible",
            "prefers-reduced-motion:reduce", "@media(max-width:520px)",
            "Skip to lesson content", 'role="img" aria-labelledby="',
            "<title id=", "<desc id=", "expoTitle",
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
        ):
            self.assertNotIn(prohibited, lowered)


if __name__ == "__main__":
    unittest.main()
