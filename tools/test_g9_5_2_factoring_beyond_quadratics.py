#!/usr/bin/env python3
"""Deterministic release checks for Grade 9 lesson 5.2."""

from __future__ import annotations

import json
import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "curriculum/pathways/grade-9-2026-2027.json"
CATALOG = ROOT / "data/grade-9-10-pathways.js"
LESSON_URL = "lessons/pathways/grade-9/unit-5/g9-5.2-factoring-beyond-quadratics.html"
LESSON = ROOT / LESSON_URL


def poly(*terms: tuple[int, int]) -> dict[int, int]:
    return {power: coefficient for power, coefficient in terms if coefficient}


def multiply(a: dict[int, int], b: dict[int, int]) -> dict[int, int]:
    result: dict[int, int] = {}
    for pa, ca in a.items():
        for pb, cb in b.items():
            result[pa + pb] = result.get(pa + pb, 0) + ca * cb
    return {power: coefficient for power, coefficient in result.items() if coefficient}


def product(*factors: dict[int, int]) -> dict[int, int]:
    result = poly((0, 1))
    for factor in factors:
        result = multiply(result, factor)
    return result


def scale_shift(a: dict[int, int], coefficient: int, shift: int = 0) -> dict[int, int]:
    return {power + shift: coefficient * value for power, value in a.items() if coefficient * value}


class GradeNineFactoringBeyondQuadraticsTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
        cls.html = LESSON.read_text(encoding="utf-8")
        cls.lesson = next(
            lesson
            for unit in cls.manifest["paths"]["common"]["units"]
            for lesson in unit["lessons"]
            if lesson["id"] == "5.2"
        )

    def test_authoritative_manifest_row_is_truthfully_ready(self) -> None:
        self.assertEqual(self.lesson["title"], "Factoring Beyond Quadratics")
        self.assertEqual(
            self.lesson["subtopics"],
            ["Grouping; sum/difference of cubes; repeated factors; simple substitution patterns."],
        )
        self.assertEqual(
            self.lesson["learningOutcomes"],
            ["Select and apply productive factoring strategies for common higher-degree expressions."],
        )
        self.assertEqual(self.lesson["depth"], "B Bridge Depth")
        self.assertEqual(
            self.lesson["requiredGrade9Coverage"],
            "Factor common higher-degree patterns likely to appear in later polynomial work; verify by multiplication.",
        )
        self.assertEqual(
            self.lesson["coverageBoundary"],
            "Not required within this course: exhaustive olympiad-style factoring or obscure identities.",
        )
        self.assertEqual((self.lesson["targetPeriods"], self.lesson["maximumPeriods"]), (4, 4))
        self.assertEqual(self.lesson["deliveryStatus"], "ready")
        self.assertEqual(self.lesson["url"], LESSON_URL)
        self.assertEqual(self.lesson["screenCount"], 64)
        self.assertTrue(LESSON.is_file())
        self.assertIn(f'"url":"{LESSON_URL}"', CATALOG.read_text(encoding="utf-8"))

    def test_depth_pacing_coverage_and_boundary_are_explicit(self) -> None:
        for phrase in (
            "B · Bridge Depth",
            "4 target periods",
            "4 maximum",
            "Factor common higher-degree patterns",
            "verify by multiplication",
            "exhaustive olympiad-style factoring",
            "obscure identities",
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

    def test_answer_key_is_complete_varied_and_has_unique_options(self) -> None:
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

    def test_every_practice_factorization_expands_to_its_prompt(self) -> None:
        x_minus_1, x_plus_1 = poly((1, 1), (0, -1)), poly((1, 1), (0, 1))
        x_minus_2, x_plus_2 = poly((1, 1), (0, -2)), poly((1, 1), (0, 2))
        x_minus_3, x_plus_3 = poly((1, 1), (0, -3)), poly((1, 1), (0, 3))

        checks = {
            "E1": (scale_shift(poly((1, 2), (0, -3)), 3, 3), poly((4, 6), (3, -9))),
            "E2": (product(x_plus_2, poly((2, 1), (0, 3))), poly((3, 1), (2, 2), (1, 3), (0, 6))),
            "E3": (product(x_minus_3, poly((2, 1), (1, 3), (0, 9))), poly((3, 1), (0, -27))),
            "E4": (product(x_plus_2, poly((2, 1), (1, -2), (0, 4))), poly((3, 1), (0, 8))),
            "M1": (product(x_plus_3, poly((2, 2), (0, 5))), poly((3, 2), (2, 6), (1, 5), (0, 15))),
            "M2": (scale_shift(product(x_minus_2, poly((2, 1), (1, 2), (0, 4))), 3, 1), poly((4, 3), (1, -24))),
            "M3": (product(poly((2, 2), (0, 1)), poly((2, 1), (0, 3))), poly((4, 2), (2, 7), (0, 3))),
            "M4": (product(x_minus_2, x_plus_2, poly((2, 1), (0, 4))), poly((4, 1), (0, -16))),
            "M5": (scale_shift(product(x_plus_1, x_plus_1), 1, 3), poly((5, 1), (4, 2), (3, 1))),
            "M6": (product(poly((1, 1), (0, -4)), poly((2, 1), (1, 4), (0, 16))), poly((3, 1), (0, -64))),
            "H1": (product(poly((1, 1), (0, -4)), x_minus_3, x_plus_3), poly((3, 1), (2, -4), (1, -9), (0, 36))),
            "H2": (product(poly((1, 2), (0, -3)), poly((1, 2), (0, 3)), x_minus_1, x_plus_1), poly((4, 4), (2, -13), (0, 9))),
            "H3": (product(poly((1, 2), (0, 5)), poly((2, 4), (1, -10), (0, 25))), poly((3, 8), (0, 125))),
            "H4": (product(poly((1, 2), (0, -3)), poly((1, 2), (0, 3)), poly((2, 4), (0, 9))), poly((4, 16), (0, -81))),
            "H5": (scale_shift(product(x_minus_2, poly((2, 1), (1, 2), (0, 4))), 5, 4), poly((7, 5), (4, -40))),
            "H6": (scale_shift(product(poly((1, 2), (0, -3)), poly((1, 2), (0, -3))), 1, 3), poly((5, 4), (4, -12), (3, 9))),
            "C2": (scale_shift(product(x_minus_1, x_plus_1, x_minus_2, x_plus_2), 3, 1), poly((5, 3), (3, -15), (1, 12))),
            "C4": (product(x_minus_1, poly((2, 1), (1, 1), (0, 1)), x_minus_2, poly((2, 1), (1, 2), (0, 4))), poly((6, 1), (3, -9), (0, 8))),
        }
        for item, (expanded, target) in checks.items():
            with self.subTest(item=item):
                self.assertEqual(expanded, target)

        # C1 becomes t^3 - 64 when t = ab.
        self.assertEqual(product(poly((1, 1), (0, -4)), poly((2, 1), (1, 4), (0, 16))), poly((3, 1), (0, -64)))
        # C3 must hold for arbitrary k; sample distinct positive, zero, and negative values.
        for k in (-5, 0, 7):
            self.assertEqual(
                product(poly((1, 1), (0, k)), x_minus_2, x_plus_2),
                poly((3, 1), (2, k), (1, -4), (0, -4 * k)),
            )

    def test_screen_plan_is_64_meaningful_screens(self) -> None:
        self.assertIn('<meta name="echs-screen-count" content="64">', self.html)
        self.assertIn("const EXPECTED_SCREEN_COUNT=64", self.html)
        self.assertEqual(self.html.count("\n    add("), 44)
        self.assertEqual(44 + 20, 64)
        for signal in (
            "Learning goals", "Prerequisite retrieval", "Worked example", "Student Turn",
            "greatest common factor", "factor by grouping", "Sum and difference of cubes",
            "Repeated factors", "Substitution reveals", "factor completely",
            "Differentiated practice", "AP bridge", "Exit ticket", "mastery evidence",
        ):
            self.assertIn(signal.lower(), self.html.lower())

    def test_math_interaction_and_persistence_contracts(self) -> None:
        self.assertIn("katex@0.16.11", self.html)
        self.assertGreaterEqual(self.html.count('math("') + self.html.count('class="math" data-tex='), 25)
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

    def test_accessibility_responsive_visuals_and_originality(self) -> None:
        for signal in (
            'name="viewport"', "focus-visible", "prefers-reduced-motion:reduce",
            "@media(max-width:520px)", "Skip to lesson content",
            'role="img" aria-labelledby="', "<title id=", "<desc id=",
            "marker-end=", "strategySvg", "groupingSvg",
        ):
            self.assertIn(signal, self.html)
        lowered = self.html.lower()
        for prohibited in (
            "question-bank/official", "private question", "college board question",
            "credential", "answer token", "pearson", "lorem ipsum",
            "quadratic modeling", "technology regression", "projectile maximum",
            "polynomial operations", "degree predictions",
        ):
            self.assertNotIn(prohibited, lowered)


if __name__ == "__main__":
    unittest.main()
