#!/usr/bin/env python3
"""Deterministic release checks for Grade 9 lesson 2.5."""

from __future__ import annotations

import json
import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "curriculum/pathways/grade-9-2026-2027.json"
CATALOG = ROOT / "data/grade-9-10-pathways.js"
LESSON_URL = (
    "lessons/pathways/grade-9/unit-2/"
    "g9-2.5-absolute-value-equations-inequalities.html"
)
LESSON = ROOT / LESSON_URL


class GradeNineAbsoluteValueTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
        cls.html = LESSON.read_text(encoding="utf-8")
        cls.lesson = next(
            lesson
            for unit in cls.manifest["paths"]["common"]["units"]
            for lesson in unit["lessons"]
            if lesson["id"] == "2.5"
        )

    def test_final_share_ready_manifest_row_is_truthfully_ready(self) -> None:
        self.assertEqual(
            self.lesson["title"], "Absolute Value Equations & Inequalities"
        )
        self.assertEqual(
            self.lesson["subtopics"],
            [
                "Distance interpretation; two-case equations; compound "
                "inequalities; graphical interpretation."
            ],
        )
        self.assertEqual(
            self.lesson["learningOutcomes"],
            [
                "Connect absolute value to distance and solve standard "
                "equations/inequalities."
            ],
        )
        self.assertEqual(self.lesson["depth"], "B Bridge Depth")
        self.assertEqual(
            self.lesson["requiredGrade9Coverage"],
            "Solve standard absolute-value equations/inequalities using "
            "distance and case reasoning.",
        )
        self.assertEqual(
            self.lesson["coverageBoundary"],
            "Not developed within this course: a full transformed "
            "absolute-value function unit or parameter analysis.",
        )
        self.assertEqual(self.lesson["targetPeriods"], 3)
        self.assertEqual(self.lesson["maximumPeriods"], 3)
        self.assertEqual(self.lesson["deliveryStatus"], "ready")
        self.assertEqual(self.lesson["url"], LESSON_URL)
        self.assertEqual(self.lesson["screenCount"], 64)
        self.assertTrue(LESSON.is_file())
        catalog = CATALOG.read_text(encoding="utf-8")
        self.assertIn(f'"url":"{LESSON_URL}"', catalog)
        self.assertIn('"targetPeriods":3,"maximumPeriods":3', catalog)

    def test_depth_pacing_and_boundary_are_explicit(self) -> None:
        for phrase in (
            "Bridge Depth",
            "3 target periods",
            "3 maximum",
            "distance",
            "two-case",
            "compound inequalities",
            "graphical interpretation",
            "full transformed absolute-value function unit",
            "parameter analysis",
        ):
            self.assertIn(phrase.lower(), self.html.lower())
        lowered = self.html.lower()
        self.assertNotIn("parameter family", lowered)
        self.assertNotIn("general transformed family", lowered)

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
            "E1": 2, "E2": 0, "E3": 1, "E4": 1,
            "M1": 1, "M2": 0, "M3": 1, "M4": 0, "M5": 0, "M6": 2,
            "H1": 0, "H2": 0, "H3": 0, "H4": 1, "H5": 3, "H6": 0,
            "C1": 0, "C2": 1, "C3": 0, "C4": 0,
        }
        found = {
            item: int(answer)
            for item, answer in re.findall(
                r'\{id:"([EMHC]\d+)".*?,answer:(\d)', self.html
            )
        }
        self.assertEqual(found, expected)

    def test_representative_mathematics_is_exact(self) -> None:
        self.assertEqual(
            {x for x in range(-20, 21) if abs(x - 3) == 5}, {-2, 8}
        )
        self.assertEqual(
            {x for x in range(-20, 21) if abs(2 * x - 1) == 7}, {-3, 4}
        )
        self.assertEqual(
            {x for x in range(-20, 21) if abs(4 - 2 * x) == 10}, {-3, 7}
        )
        self.assertEqual(
            [x for x in range(-10, 11) if abs(2 * x - 6) < 8],
            list(range(0, 7)),
        )
        self.assertEqual(
            [x for x in range(-10, 11) if abs(3 * x - 6) > 9],
            list(range(-10, -1)) + list(range(6, 11)),
        )
        for value in (-5, 3):
            self.assertLessEqual(5 - 2 * abs(value + 1), -3)
        for value in (-4.9, 2.9):
            self.assertGreater(5 - 2 * abs(value + 1), -3)
        self.assertAlmostEqual((-2 + 8) / 2, 3)
        self.assertEqual(abs(-2 - 3), 5)
        self.assertEqual(abs(8 - 3), 5)

    def test_screen_plan_is_64_meaningful_screens(self) -> None:
        self.assertIn('<meta name="echs-screen-count" content="64">', self.html)
        self.assertIn("const EXPECTED_SCREEN_COUNT=64", self.html)
        self.assertEqual(self.html.count("    add("), 44)
        self.assertEqual(8 + 5 * 6 + 20 + 6, 64)
        for signal in (
            "Learning goals", "Worked example", "Student Turn",
            "Misconception check", "Differentiated practice",
            "AP-readiness transfer", "Exit ticket", "Mastery evidence",
        ):
            self.assertIn(signal, self.html)

    def test_math_interaction_and_persistence_contracts(self) -> None:
        self.assertIn("katex@0.16.11", self.html)
        self.assertGreaterEqual(self.html.count('class="math" data-tex='), 150)
        tex_values = re.findall(r'data-tex="(.*?)"', self.html)
        unsafe_commands = [
            value
            for value in tex_values
            if re.search(r'(?<!\\)\\(?:frac|ge|le|Rightarrow)\b', value)
        ]
        self.assertEqual(
            unsafe_commands,
            [],
            "KaTeX commands in JavaScript strings need doubled backslashes",
        )
        self.assertIn("localStorage", self.html)
        self.assertIn("exportWork", self.html)
        self.assertIn("ArrowRight", self.html)
        self.assertIn('data-check="', self.html)
        self.assertIn('aria-live="polite"', self.html)

    def test_accessibility_responsive_and_visual_precision(self) -> None:
        for signal in (
            'name="viewport"',
            "focus-visible",
            "prefers-reduced-motion:reduce",
            "@media(max-width:520px)",
            "Skip to lesson content",
            'role="img" aria-labelledby="nl-title-',
            '<title id="nl-title-',
            '<desc id="nl-desc-',
            "equal spacing",
            "Equal-scale axes",
            "V-shaped graph",
            'd="M110 30L410 330L660 80"',
            'cx="160" cy="150"',
            'cx="410" cy="150"',
            'cx="660" cy="150"',
        ):
            self.assertIn(signal, self.html)
        self.assertNotIn(".flow span{", self.html)
        self.assertIn(".flow > span{", self.html)
        lowered = self.html.lower()
        for prohibited in (
            "question-bank/official",
            "private question",
            "college board question",
            "credential",
            "answer token",
            "pearson",
            "lorem ipsum",
        ):
            self.assertNotIn(prohibited, lowered)


if __name__ == "__main__":
    unittest.main()
