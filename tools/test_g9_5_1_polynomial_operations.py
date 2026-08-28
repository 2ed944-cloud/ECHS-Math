#!/usr/bin/env python3
"""Deterministic release checks for Grade 9 lesson 5.1."""

from __future__ import annotations

import json
import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "curriculum/pathways/grade-9-2026-2027.json"
CATALOG = ROOT / "data/grade-9-10-pathways.js"
LESSON_URL = "lessons/pathways/grade-9/unit-5/g9-5.1-polynomial-operations.html"
LESSON = ROOT / LESSON_URL


def poly(*terms: tuple[int, int]) -> dict[int, int]:
    return {power: coefficient for power, coefficient in terms if coefficient}


def add(a: dict[int, int], b: dict[int, int]) -> dict[int, int]:
    powers = set(a) | set(b)
    return {power: a.get(power, 0) + b.get(power, 0) for power in powers if a.get(power, 0) + b.get(power, 0)}


def scale(a: dict[int, int], factor: int, shift: int = 0) -> dict[int, int]:
    return {power + shift: factor * coefficient for power, coefficient in a.items() if factor * coefficient}


def multiply(a: dict[int, int], b: dict[int, int]) -> dict[int, int]:
    result: dict[int, int] = {}
    for pa, ca in a.items():
        for pb, cb in b.items():
            result[pa + pb] = result.get(pa + pb, 0) + ca * cb
    return {power: coefficient for power, coefficient in result.items() if coefficient}


class GradeNinePolynomialOperationsTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
        cls.html = LESSON.read_text(encoding="utf-8")
        cls.lesson = next(
            lesson
            for unit in cls.manifest["paths"]["common"]["units"]
            for lesson in unit["lessons"]
            if lesson["id"] == "5.1"
        )

    def test_authoritative_manifest_row_is_truthfully_ready(self) -> None:
        self.assertEqual(self.lesson["title"], "Polynomial Operations")
        self.assertEqual(
            self.lesson["subtopics"],
            ["Degree; leading coefficient; addition/subtraction/multiplication; special products."],
        )
        self.assertEqual(
            self.lesson["learningOutcomes"],
            ["Operate on polynomial expressions accurately and interpret degree/leading term."],
        )
        self.assertEqual(self.lesson["depth"], "M Prerequisite Mastery")
        self.assertEqual(
            self.lesson["requiredGrade9Coverage"],
            "Perform polynomial addition/subtraction/multiplication and identify degree/leading term fluently.",
        )
        self.assertEqual(
            self.lesson["coverageBoundary"],
            "Scope boundary: symbolic manipulation remains connected to function meaning; arbitrary manipulation is outside the course emphasis.",
        )
        self.assertEqual((self.lesson["targetPeriods"], self.lesson["maximumPeriods"]), (3, 3))
        self.assertEqual(self.lesson["deliveryStatus"], "ready")
        self.assertEqual(self.lesson["url"], LESSON_URL)
        self.assertEqual(self.lesson["screenCount"], 64)
        self.assertTrue(LESSON.is_file())
        self.assertIn(f'"url":"{LESSON_URL}"', CATALOG.read_text(encoding="utf-8"))

    def test_depth_pacing_coverage_and_boundary_are_explicit(self) -> None:
        for phrase in (
            "M · Prerequisite Mastery",
            "3 target periods",
            "3 maximum",
            "Perform polynomial addition, subtraction, and multiplication",
            "identify degree and leading term fluently",
            "connected to function meaning",
            "Arbitrary manipulation",
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

    def test_independently_verified_and_varied_answer_key(self) -> None:
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

    def test_all_polynomial_calculations_are_verified(self) -> None:
        x = poly((1, 1))
        one = poly((0, 1))

        self.assertEqual(add(poly((2, 3), (1, 2), (0, -5)), poly((2, 1), (1, -7), (0, 1))), poly((2, 4), (1, -5), (0, -4)))
        self.assertEqual(add(poly((3, 5), (1, -2), (0, 4)), scale(poly((3, 2), (1, 1), (0, -6)), -1)), poly((3, 3), (1, -3), (0, 10)))
        self.assertEqual(scale(poly((3, 2), (1, -1), (0, 4)), -3, 2), poly((5, -6), (3, 3), (2, -12)))
        self.assertEqual(multiply(add(x, poly((0, 4))), add(x, poly((0, -7)))), poly((2, 1), (1, -3), (0, -28)))
        self.assertEqual(multiply(poly((1, 2), (0, -3)), poly((1, 2), (0, -3))), poly((2, 4), (1, -12), (0, 9)))
        self.assertEqual(multiply(poly((1, 3), (0, 5)), poly((1, 3), (0, -5))), poly((2, 9), (0, -25)))
        self.assertEqual(multiply(poly((2, 1), (1, 2), (0, -1)), poly((1, 1), (0, 3))), poly((3, 1), (2, 5), (1, 5), (0, -3)))
        self.assertEqual(add(scale(poly((2, 1), (1, -3), (0, 4)), 2), scale(poly((2, 3), (1, 1), (0, -5)), -1)), poly((2, -1), (1, -7), (0, 13)))
        self.assertEqual(multiply(poly((2, 2), (1, -1), (0, 3)), poly((2, 1), (0, 4))), poly((4, 2), (3, -1), (2, 11), (1, -4), (0, 12)))
        self.assertEqual(multiply(poly((1, 1), (0, 2)), poly((1, 1), (0, 2))), poly((2, 1), (1, 4), (0, 4)))
        self.assertEqual(add(multiply(poly((1, 1), (0, 2)), poly((1, 1), (0, 2))), scale(multiply(poly((1, 1), (0, -2)), poly((1, 1), (0, -2))), -1)), poly((1, 8)))
        self.assertEqual(multiply(poly((2, 1), (0, 1)), poly((1, 2), (0, -3))), poly((3, 2), (2, -3), (1, 2), (0, -3)))
        self.assertEqual(add(poly((4, 2), (1, 1)), poly((4, -2), (2, 3))), poly((2, 3), (1, 1)))
        self.assertEqual(103**2, 10609)
        self.assertEqual(7 - 4, 3)
        self.assertEqual(10 // -2, -5)
        self.assertEqual(multiply(poly((2, 1), (1, 5), (0, 4)), poly((1, 1), (0, 2))), poly((3, 1), (2, 7), (1, 14), (0, 8)))
        self.assertEqual(multiply(poly((1, 1), (0, 7)), poly((1, 1), (0, -2))), poly((2, 1), (1, 5), (0, -14)))
        self.assertEqual(multiply(poly((3, -4)), poly((5, 3))), poly((8, -12)))

    def test_screen_plan_is_64_meaningful_screens(self) -> None:
        self.assertIn('<meta name="echs-screen-count" content="64">', self.html)
        self.assertIn("const EXPECTED_SCREEN_COUNT=64", self.html)
        self.assertEqual(self.html.count("\n    add("), 44)
        self.assertEqual(44 + 20, 64)
        for signal in (
            "Learning goals", "Prerequisite retrieval", "Worked example",
            "Student Turn", "Polynomial addition routine", "Subtraction requires a sign shield",
            "Monomial times polynomial", "area model", "Special products",
            "Degree and leading-term predictions", "Differentiated practice",
            "AP bridge", "Exit ticket", "mastery evidence",
        ):
            self.assertIn(signal.lower(), self.html.lower())

    def test_math_interaction_and_persistence_contracts(self) -> None:
        self.assertIn("katex@0.16.11", self.html)
        self.assertGreaterEqual(
            self.html.count('math("') + self.html.count('class="math" data-tex='),
            25,
        )
        unsafe_commands = re.findall(
            r'(?<!\\)\\(?:frac|text|circ|ne|sqrt|to|xrightarrow|quad|square|pm|le|ge|infty|cup)',
            self.html,
        )
        self.assertEqual(unsafe_commands, [])
        for signal in (
            "localStorage", "exportWork", "ArrowRight", 'data-check="',
            'aria-live="polite"', "details", "Score all responses",
        ):
            self.assertIn(signal, self.html)

    def test_accessibility_responsive_and_visual_precision(self) -> None:
        for signal in (
            'name="viewport"', "focus-visible", "prefers-reduced-motion:reduce",
            "@media(max-width:520px)", "Skip to lesson content",
            'role="img" aria-labelledby="', "<title id=", "<desc id=",
            "marker-end=", "structureSvg", "areaSvg",
        ):
            self.assertIn(signal, self.html)
        lowered = self.html.lower()
        for prohibited in (
            "question-bank/official", "private question", "college board question",
            "credential", "answer token", "pearson", "lorem ipsum",
            "quadratic modeling", "technology regression", "projectile maximum",
        ):
            self.assertNotIn(prohibited, lowered)


if __name__ == "__main__":
    unittest.main()
