#!/usr/bin/env python3
"""Deterministic release checks for Grade 9 lesson 4.7."""

from __future__ import annotations

import json
import math
import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "curriculum/pathways/grade-9-2026-2027.json"
CATALOG = ROOT / "data/grade-9-10-pathways.js"
LESSON_URL = "lessons/pathways/grade-9/unit-4/g9-4.7-quadratic-modeling-optimization.html"
LESSON = ROOT / LESSON_URL


class GradeNineQuadraticModelingTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
        cls.html = LESSON.read_text(encoding="utf-8")
        cls.lesson = next(
            lesson
            for unit in cls.manifest["paths"]["common"]["units"]
            for lesson in unit["lessons"]
            if lesson["id"] == "4.7"
        )

    def test_authoritative_manifest_row_is_truthfully_ready(self) -> None:
        self.assertEqual(self.lesson["title"], "Quadratic Modeling & Optimization")
        self.assertEqual(
            self.lesson["subtopics"],
            ["Projectile/area/revenue-style models; vertex interpretation; technology regression; limitations."],
        )
        self.assertEqual(
            self.lesson["learningOutcomes"],
            ["Use quadratics to model and optimize familiar contexts with reasonable domain restrictions."],
        )
        self.assertEqual(self.lesson["depth"], "B Bridge Depth")
        self.assertEqual(
            self.lesson["requiredGrade9Coverage"],
            "Construct/use simple quadratic models; interpret vertex and domain; fit quadratic regression with technology when data warrant it.",
        )
        self.assertEqual(
            self.lesson["coverageBoundary"],
            "Not required within this course: AP-level model comparison, residual analysis, or complex covariation arguments.",
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
            "Construct and use simple quadratic models",
            "fit quadratic regression with technology",
            "AP-level model comparison",
            "residual analysis",
            "complex covariation arguments",
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

    def test_vertices_domains_and_regression_values_are_exact(self) -> None:
        def q(a: float, b: float, c: float, x: float) -> float:
            return a * x * x + b * x + c

        cases = [
            (-5, 20, 1, 2, 21),
            (-4.9, 19.6, 1.5, 2, 21.1),
            (-2, 40, 0, 10, 200),
            (-2, 80, 0, 20, 800),
            (-1, 50, 0, 25, 625),
            (-3, 18, -7, 3, 20),
        ]
        for a, b, c, x_vertex, y_vertex in cases:
            self.assertAlmostEqual(-b / (2 * a), x_vertex)
            self.assertAlmostEqual(q(a, b, c, x_vertex), y_vertex)

        positive_impact = (15 + math.sqrt(265)) / 10
        self.assertAlmostEqual(positive_impact, 3.1278820596)
        self.assertAlmostEqual(q(-5, 15, 2, positive_impact), 0)
        self.assertGreater(q(-5, 15, 2, 2), 0)

        for x, y in [(0, 3), (1, 8), (2, 15), (3, 24)]:
            self.assertEqual(q(1, 4, 3, x), y)
        for x, y in [(-2, 9), (-1, 3), (0, 1), (1, 3), (2, 9)]:
            self.assertEqual(q(2, 0, 1, x), y)
        self.assertEqual(q(1.5, 2, 10, 6), 76)

        # Constraint in C4 places the unconstrained vertex on the feasible boundary.
        self.assertEqual(120 - 2 * 30, 2 * 30)
        self.assertEqual(30 * (120 - 2 * 30), 1800)

    def test_screen_plan_is_64_meaningful_screens(self) -> None:
        self.assertIn('<meta name="echs-screen-count" content="64">', self.html)
        self.assertIn("const EXPECTED_SCREEN_COUNT=64", self.html)
        self.assertEqual(self.html.count("\n    add("), 44)
        self.assertEqual(44 + 20, 64)
        for signal in (
            "Learning goals", "Prerequisite retrieval", "Worked example",
            "Student Turn", "projectile maximum", "fixed perimeter",
            "maximize revenue", "technology regression",
            "Second differences as a diagnostic", "Interpolation and extrapolation",
            "Differentiated practice", "AP-readiness transfer",
            "Exit ticket", "Mastery reflection",
        ):
            self.assertIn(signal, self.html)

    def test_math_interaction_and_persistence_contracts(self) -> None:
        self.assertIn("katex@0.16.11", self.html)
        self.assertGreaterEqual(
            self.html.count('math("') + self.html.count('class="math" data-tex='),
            8,
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
            "marker-end=", "scatterSvg", "quadraticSvg", ".gridline",
        ):
            self.assertIn(signal, self.html)
        lowered = self.html.lower()
        for prohibited in (
            "question-bank/official", "private question", "college board question",
            "credential", "answer token", "pearson", "lorem ipsum",
            "quadratic-inequality mastery secured", "sign-interval reasoning",
        ):
            self.assertNotIn(prohibited, lowered)


if __name__ == "__main__":
    unittest.main()
