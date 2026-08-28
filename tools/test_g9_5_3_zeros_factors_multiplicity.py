#!/usr/bin/env python3
"""Deterministic release checks for Grade 9 lesson 5.3."""

from __future__ import annotations

import json
import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "curriculum/pathways/grade-9-2026-2027.json"
CATALOG = ROOT / "data/grade-9-10-pathways.js"
LESSON_URL = "lessons/pathways/grade-9/unit-5/g9-5.3-zeros-factors-multiplicity.html"
LESSON = ROOT / LESSON_URL


def multiply(a: list[int], b: list[int]) -> list[int]:
    """Multiply coefficient lists written in ascending powers."""
    result = [0] * (len(a) + len(b) - 1)
    for i, ca in enumerate(a):
        for j, cb in enumerate(b):
            result[i + j] += ca * cb
    return result


def product(*factors: list[int]) -> list[int]:
    result = [1]
    for factor in factors:
        result = multiply(result, factor)
    return result


def evaluate(coefficients: list[int], x: int) -> int:
    return sum(coefficient * x**power for power, coefficient in enumerate(coefficients))


class GradeNineZerosFactorsMultiplicityTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
        cls.html = LESSON.read_text(encoding="utf-8")
        cls.lesson = next(
            lesson
            for unit in cls.manifest["paths"]["common"]["units"]
            for lesson in unit["lessons"]
            if lesson["id"] == "5.3"
        )

    def test_authoritative_manifest_row_is_truthfully_ready(self) -> None:
        self.assertEqual(self.lesson["title"], "Zeros, Factors & Multiplicity")
        self.assertEqual(
            self.lesson["subtopics"],
            ["Factor-zero connection; repeated factors; crossing/touching; real vs complex zeros."],
        )
        self.assertEqual(
            self.lesson["learningOutcomes"],
            ["Connect zeros, factors, multiplicity, and basic graph behavior."],
        )
        self.assertEqual(self.lesson["depth"], "B Bridge Depth")
        self.assertEqual(
            self.lesson["requiredGrade9Coverage"],
            "Connect factored form to real zeros/intercepts and recognize simple even/odd multiplicity behavior; construct low-degree polynomials from given real zeros.",
        )
        self.assertEqual(
            self.lesson["coverageBoundary"],
            "Deferred: full AP Topic 1.6/1.7-style polynomial behavior synthesis, complex-zero structure, and advanced multi-representation reasoning for AP.",
        )
        self.assertEqual((self.lesson["targetPeriods"], self.lesson["maximumPeriods"]), (4, 5))
        self.assertEqual(self.lesson["deliveryStatus"], "ready")
        self.assertEqual(self.lesson["url"], LESSON_URL)
        self.assertEqual(self.lesson["screenCount"], 64)
        self.assertTrue(LESSON.is_file())
        self.assertIn(f'"url":"{LESSON_URL}"', CATALOG.read_text(encoding="utf-8"))

    def test_depth_pacing_coverage_and_boundary_are_explicit(self) -> None:
        for phrase in (
            "B · Bridge Depth",
            "4 target periods",
            "5 maximum",
            "Connect factored form to real zeros/intercepts",
            "construct low-degree polynomials from given real zeros",
            "full AP Topic 1.6/1.7-style polynomial behavior synthesis",
            "advanced multi-representation reasoning",
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
        self.assertNotIn("calc:true", self.html)

    def test_answer_key_is_complete_varied_and_options_are_unique(self) -> None:
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
        for block in re.findall(r'options:\[(.*?)\],answer:', self.html):
            options = re.findall(r'"(.*?)"', block)
            self.assertEqual(len(options), 4)
            self.assertEqual(len(set(options)), 4)

    def test_polynomial_constructions_expansions_and_scale_values_are_correct(self) -> None:
        xm1, xp1 = [-1, 1], [1, 1]
        xm2, xp2 = [-2, 1], [2, 1]
        xm3, xp3 = [-3, 1], [3, 1]
        xm4 = [-4, 1]

        self.assertEqual(product(xm3, xm2, xp2), [12, -4, -3, 1])
        self.assertEqual(product(xm1, xp1, xm2, xp2), [4, 0, -5, 0, 1])
        self.assertEqual(product(xm1, xm1, xp1, xp1), [1, 0, -2, 0, 1])
        self.assertEqual(product(xp1, xp1, xm4), [-4, -7, -2, 1])
        self.assertEqual(product(xp2, xp2, xm3), [-12, -8, 1, 1])
        self.assertEqual(product([0, 1], xp2, xp2, xm3, xm3), [0, 36, 12, -11, -2, 1])

        h4 = product(xm2, xm2, xp3)
        self.assertEqual(evaluate(h4, 0), 12)
        self.assertEqual(24 // evaluate(h4, 0), 2)
        exit_base = product(xp1, xp1, xm2)
        self.assertEqual(evaluate(exit_base, 0), -2)
        self.assertEqual(6 // evaluate(exit_base, 0), -3)

        c4 = product([1, 0, 1], xm4, xm4, xp2)
        self.assertEqual(len(c4) - 1, 5)
        self.assertEqual(evaluate(c4, 4), 0)
        self.assertEqual(evaluate(c4, -2), 0)

    def test_screen_plan_is_64_meaningful_screens(self) -> None:
        self.assertIn('<meta name="echs-screen-count" content="64">', self.html)
        self.assertIn("const EXPECTED_SCREEN_COUNT=64", self.html)
        self.assertEqual(self.html.count("\n    add("), 44)
        self.assertEqual(44 + 20, 64)
        for signal in (
            "Learning goals", "Prerequisite retrieval", "Worked example", "Student Turn",
            "factor-zero connection", "Evaluation verifies a zero", "Multiplicity counts",
            "Odd multiplicity", "Even multiplicity", "Real zeros and complex zeros",
            "Construct a polynomial", "Differentiated practice", "AP bridge",
            "Exit ticket", "mastery evidence",
        ):
            self.assertIn(signal.lower(), self.html.lower())

    def test_math_interaction_accessibility_and_responsiveness_contracts(self) -> None:
        self.assertIn("katex@0.16.11", self.html)
        self.assertGreaterEqual(self.html.count('math("') + self.html.count('class="math" data-tex='), 30)
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
            "<desc id=", "connectionSvg", "multiplicitySvg",
        ):
            self.assertIn(signal, self.html)

    def test_originality_scope_and_no_stale_lesson_content(self) -> None:
        lowered = self.html.lower()
        for prohibited in (
            "question-bank/official", "private question", "college board question",
            "credential", "answer token", "pearson", "lorem ipsum",
            "factoring beyond quadratics", "sum/difference of cubes", "olympiad-style",
            "projectile maximum", "technology regression", "quadratic modeling",
        ):
            self.assertNotIn(prohibited, lowered)


if __name__ == "__main__":
    unittest.main()
