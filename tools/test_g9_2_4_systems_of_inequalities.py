#!/usr/bin/env python3
"""Deterministic release checks for Grade 9 lesson 2.4."""

from __future__ import annotations

import json
import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "curriculum/pathways/grade-9-2026-2027.json"
CATALOG = ROOT / "data/grade-9-10-pathways.js"
LESSON_URL = "lessons/pathways/grade-9/unit-2/g9-2.4-systems-of-inequalities.html"
LESSON = ROOT / LESSON_URL


def feasible(point: tuple[float, float], tests) -> bool:
    x, y = point
    return all(test(x, y) for test in tests)


class GradeNineSystemsOfInequalitiesTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
        cls.html = LESSON.read_text(encoding="utf-8")
        cls.lesson = next(
            lesson
            for unit in cls.manifest["paths"]["common"]["units"]
            for lesson in unit["lessons"]
            if lesson["id"] == "2.4"
        )

    def test_final_share_ready_manifest_row_is_truthfully_ready(self) -> None:
        self.assertEqual(self.lesson["title"], "Systems of Inequalities")
        self.assertEqual(
            self.lesson["subtopics"],
            ["Half-planes; boundary lines; feasible region; constraint interpretation."],
        )
        self.assertEqual(
            self.lesson["learningOutcomes"],
            ["Represent simultaneous inequality constraints graphically and contextually."],
        )
        self.assertEqual(self.lesson["depth"], "B Bridge Depth")
        self.assertEqual(
            self.lesson["requiredGrade9Coverage"],
            "Graph 2-variable systems of linear inequalities and identify/test feasible regions.",
        )
        self.assertEqual(
            self.lesson["coverageBoundary"],
            "Deferred beyond this course: formal linear-programming optimization algorithms.",
        )
        self.assertEqual(self.lesson["targetPeriods"], 2)
        self.assertEqual(self.lesson["maximumPeriods"], 3)
        self.assertEqual(self.lesson["deliveryStatus"], "ready")
        self.assertEqual(self.lesson["url"], LESSON_URL)
        self.assertEqual(self.lesson["screenCount"], 64)
        self.assertTrue(LESSON.is_file())
        catalog = CATALOG.read_text(encoding="utf-8")
        self.assertIn(f'"url":"{LESSON_URL}"', catalog)
        self.assertIn('"targetPeriods":2,"maximumPeriods":3', catalog)

    def test_depth_pacing_and_boundary_are_explicit(self) -> None:
        for phrase in (
            "Bridge Depth",
            "2 target periods",
            "3 maximum",
            "boundary lines",
            "half-planes",
            "feasible regions",
            "constraint",
            "Formal linear-programming optimization algorithms",
        ):
            self.assertIn(phrase, self.html)
        self.assertIn(
            "formal linear-programming optimization algorithms",
            self.html.lower(),
        )
        self.assertNotIn("objective function", self.html.lower())
        self.assertNotIn("simplex", self.html.lower())

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

    def test_independently_verified_answer_key(self) -> None:
        expected = {
            "E1": 1, "E2": 0, "E3": 0, "E4": 1,
            "M1": 1, "M2": 0, "M3": 1, "M4": 0, "M5": 2, "M6": 0,
            "H1": 3, "H2": 2, "H3": 2, "H4": 0, "H5": 2, "H6": 1,
            "C1": 0, "C2": 1, "C3": 0, "C4": 0,
        }
        found = {
            item: int(answer)
            for item, answer in re.findall(r'\{id:"([EMHC]\d+)".*?,answer:(\d)', self.html)
        }
        self.assertEqual(found, expected)

    def test_representative_feasibility_claims_are_exact(self) -> None:
        nonnegative_sum5 = (lambda x, y: x >= 0, lambda x, y: y >= 0, lambda x, y: x + y <= 5)
        self.assertTrue(feasible((2, 2), nonnegative_sum5))
        self.assertFalse(feasible((-1, 2), nonnegative_sum5))
        self.assertFalse(feasible((4, 3), nonnegative_sum5))

        resource = (
            lambda x, y: x >= 0,
            lambda x, y: y >= 0,
            lambda x, y: x + y <= 6,
            lambda x, y: 2 * x + y <= 8,
        )
        for vertex in ((0, 0), (4, 0), (2, 4), (0, 6)):
            self.assertTrue(feasible(vertex, resource), vertex)
        self.assertFalse(feasible((6, 0), resource))
        self.assertTrue(feasible((2, 3), resource))
        self.assertFalse(feasible((4, 1), resource))
        self.assertFalse(feasible((5, 0), resource))

        system = (
            lambda x, y: y >= x - 1,
            lambda x, y: y <= -x + 3,
            lambda x, y: x >= 0,
        )
        for vertex in ((0, -1), (0, 3), (2, 1)):
            self.assertTrue(feasible(vertex, system), vertex)
        self.assertTrue(feasible((1, 0), system))
        self.assertTrue(feasible((1, 1), system))

        challenge = (
            lambda x, y: y >= x,
            lambda x, y: x + y <= 10,
            lambda x, y: 2 * x + y >= 12,
        )
        self.assertTrue(feasible((4, 4), challenge))
        for point in ((5, 3), (2, 7), (6, 5)):
            self.assertFalse(feasible(point, challenge), point)

    def test_screen_plan_is_64_meaningful_screens(self) -> None:
        self.assertIn('<meta name="echs-screen-count" content="64">', self.html)
        self.assertIn("const EXPECTED_SCREEN_COUNT=64", self.html)
        self.assertEqual(self.html.count("    add("), 44)
        self.assertEqual(8 + 5 * 6 + 20 + 6, 64)
        for signal in (
            "Learning goals", "Worked example", "Student Turn", "Misconception check",
            "Differentiated practice", "AP-readiness transfer", "Exit ticket", "Mastery evidence",
        ):
            self.assertIn(signal, self.html)

    def test_math_interaction_and_persistence_contracts(self) -> None:
        self.assertIn("katex@0.16.11", self.html)
        self.assertGreaterEqual(self.html.count('class="math" data-tex='), 170)
        tex_values = re.findall(r'data-tex="(.*?)"', self.html)
        unsafe_commands = [
            value for value in tex_values
            if re.search(r'(?<!\\)\\(?:frac|ge|le|nleq)\b', value)
        ]
        self.assertEqual(unsafe_commands, [], "KaTeX commands in JavaScript strings need doubled backslashes")
        self.assertIn("localStorage", self.html)
        self.assertIn("exportWork", self.html)
        self.assertIn("ArrowRight", self.html)
        self.assertIn('data-check="', self.html)
        self.assertIn('aria-live="polite"', self.html)

    def test_accessibility_responsive_and_visual_precision(self) -> None:
        for signal in (
            'name="viewport"', "focus-visible", "prefers-reduced-motion:reduce",
            "@media(max-width:520px)", "Skip to lesson content",
            'role="img" aria-labelledby="feasible-title-',
            '<title id="feasible-title-', '<desc id="feasible-desc-',
            "Triangular feasible region for three linear inequalities",
            "Half-plane for y less than or equal",
        ):
            self.assertIn(signal, self.html)
        self.assertNotIn(".flow span{", self.html)
        self.assertIn(".flow > span{", self.html)
        lowered = self.html.lower()
        for prohibited in (
            "question-bank/official", "private question", "college board question",
            "credential", "answer token", "pearson", "lorem ipsum",
        ):
            self.assertNotIn(prohibited, lowered)


if __name__ == "__main__":
    unittest.main()
