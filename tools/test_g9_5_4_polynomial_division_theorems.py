#!/usr/bin/env python3
"""Deterministic release checks for Grade 9 lesson 5.4."""

from __future__ import annotations

import json
import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "curriculum/pathways/grade-9-2026-2027.json"
CATALOG = ROOT / "data/grade-9-10-pathways.js"
LESSON_URL = "lessons/pathways/grade-9/unit-5/g9-5.4-polynomial-division-theorems.html"
LESSON = ROOT / LESSON_URL


def synthetic(coefficients: list[int], c: int) -> tuple[list[int], int]:
    """Return descending quotient coefficients and remainder for division by x-c."""
    row = [coefficients[0]]
    for coefficient in coefficients[1:]:
        row.append(coefficient + c * row[-1])
    return row[:-1], row[-1]


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


class GradeNinePolynomialDivisionTheoremsTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
        cls.html = LESSON.read_text(encoding="utf-8")
        cls.lesson = next(
            lesson
            for unit in cls.manifest["paths"]["common"]["units"]
            for lesson in unit["lessons"]
            if lesson["id"] == "5.4"
        )

    def test_authoritative_manifest_row_is_truthfully_ready(self) -> None:
        self.assertEqual(self.lesson["title"], "Polynomial Division & Theorems")
        self.assertEqual(
            self.lesson["subtopics"],
            ["Long division; synthetic division by x-c; remainder theorem; factor theorem."],
        )
        self.assertEqual(
            self.lesson["learningOutcomes"],
            ["Use polynomial division and factor/remainder theorems in standard cases."],
        )
        self.assertEqual(self.lesson["depth"], "B Bridge Depth")
        self.assertEqual(
            self.lesson["requiredGrade9Coverage"],
            "Divide by linear divisors, use synthetic division for x-c, and apply factor/remainder theorem in direct cases.",
        )
        self.assertEqual(
            self.lesson["coverageBoundary"],
            "Not required within this course: advanced transformed divisors, repeated strategic division, or AP-level functional interpretation.",
        )
        self.assertEqual((self.lesson["targetPeriods"], self.lesson["maximumPeriods"]), (3, 4))
        self.assertEqual(self.lesson["deliveryStatus"], "ready")
        self.assertEqual(self.lesson["url"], LESSON_URL)
        self.assertEqual(self.lesson["screenCount"], 64)
        self.assertTrue(LESSON.is_file())
        self.assertIn(f'"url":"{LESSON_URL}"', CATALOG.read_text(encoding="utf-8"))

    def test_depth_pacing_coverage_and_boundary_are_explicit(self) -> None:
        for phrase in (
            "B · Bridge Depth",
            "3 target periods",
            "4 maximum",
            "Divide by linear divisors",
            "synthetic division for x−c",
            "factor/remainder theorem in direct cases",
            "advanced transformed divisors",
            "repeated strategic division",
            "AP-level functional interpretation",
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
        option_blocks = re.findall(r'options:\[(.*?)\],answer:', self.html)
        self.assertEqual(len(option_blocks), 20)
        for block in option_blocks:
            options = re.findall(r'"(.*?)"', block)
            self.assertEqual(len(options), 4)
            self.assertEqual(len(set(options)), 4)

    def test_every_quotient_remainder_and_factor_claim_is_correct(self) -> None:
        division_checks = {
            "E1": ([1, 5, 6], -2, [1, 3], 0),
            "M1": ([1, 0, 0, -8], 2, [1, 2, 4], 0),
            "M2": ([1, 2, -1, 7], -2, [1, 0, -1], 9),
            "M3": ([2, -1, 3, -4], -1, [2, -3, 6], -10),
            "H1": ([2, 3, -8, -12], -2, [2, -1, -6], 0),
            "H2": ([1, 0, -5, 0, 4], 2, [1, 2, -1, -2], 0),
            "H6": ([3, 1, -5, 2], 1, [3, 4, -1], 1),
            "C1": ([1, 0, -5, 0, 4], 1, [1, 1, -4, -4], 0),
            "C3": ([2, -5, -4, 3], 3, [2, 1, -1], 0),
        }
        for item, (coefficients, c, quotient, remainder) in division_checks.items():
            with self.subTest(item=item):
                self.assertEqual(synthetic(coefficients, c), (quotient, remainder))

        self.assertEqual(evaluate([4, -1, 0, 2], -2), -10)  # M5
        self.assertEqual(evaluate([-4, -4, 1, 1], -1), 0)  # M6
        self.assertEqual(evaluate([2, 0, -3, 0, 1], 2), 6)  # student remainder / exit
        self.assertEqual(evaluate([-7, 0, 0, 2, 1], -1), -8)  # H5
        self.assertEqual(evaluate([-6, -1, 0, 1], 2), 0)  # H4 with b=-1
        self.assertEqual(evaluate([-8, -4, 2, 1], -2), 0)  # C2 with k=2

        self.assertEqual(product([-1, 1], [-3, 1], [2, 1]), [6, -5, -2, 1])  # H3
        self.assertEqual(product([-3, 1], [-1, 2], [1, 1]), [3, -4, -5, 2])  # C3
        c4 = multiply([-2, 1], [-3, 1, 1])
        c4[0] += 4
        self.assertEqual(c4, [10, -5, -1, 1])

    def test_screen_plan_is_64_meaningful_screens(self) -> None:
        self.assertIn('<meta name="echs-screen-count" content="64">', self.html)
        self.assertIn("const EXPECTED_SCREEN_COUNT=64", self.html)
        self.assertEqual(self.html.count("\n    add("), 44)
        self.assertEqual(44 + 20, 64)
        for signal in (
            "Learning goals", "Prerequisite retrieval", "Worked example", "Student Turn",
            "polynomial division identity", "long division", "zero placeholders",
            "Synthetic division is reserved for x−c", "Remainder theorem", "Factor theorem",
            "known factor exposes", "method selection", "Differentiated practice",
            "AP bridge", "Exit ticket", "mastery evidence",
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
            "<desc id=", "longDivisionSvg", "syntheticSvg", "theoremSvg",
        ):
            self.assertIn(signal, self.html)

    def test_originality_scope_and_no_stale_lesson_content(self) -> None:
        lowered = self.html.lower()
        for prohibited in (
            "question-bank/official", "private question", "college board question",
            "credential", "answer token", "pearson", "lorem ipsum",
            "zeros, factors & multiplicity", "real/complex classification",
            "crossing/touching", "olympiad-style", "projectile maximum",
            "technology regression", "quadratic modeling",
        ):
            self.assertNotIn(prohibited, lowered)


if __name__ == "__main__":
    unittest.main()
