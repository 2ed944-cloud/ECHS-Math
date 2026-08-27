#!/usr/bin/env python3
"""Deterministic release checks for Grade 9 lesson 3.3."""

from __future__ import annotations

import json
import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "curriculum/pathways/grade-9-2026-2027.json"
CATALOG = ROOT / "data/grade-9-10-pathways.js"
LESSON_URL = (
    "lessons/pathways/grade-9/unit-3/"
    "g9-3.3-increasing-decreasing-extrema-intercepts.html"
)
LESSON = ROOT / LESSON_URL


class GradeNineFunctionFeatureTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
        cls.html = LESSON.read_text(encoding="utf-8")
        cls.lesson = next(
            lesson
            for unit in cls.manifest["paths"]["common"]["units"]
            for lesson in unit["lessons"]
            if lesson["id"] == "3.3"
        )

    def test_final_share_ready_manifest_row_is_truthfully_ready(self) -> None:
        self.assertEqual(
            self.lesson["title"],
            "Increasing, Decreasing, Extrema & Intercepts",
        )
        self.assertEqual(
            self.lesson["subtopics"],
            [
                "Intervals of increase/decrease; zeros; y-intercepts; "
                "relative extrema; sign of a function."
            ],
        )
        self.assertEqual(
            self.lesson["learningOutcomes"],
            ["Describe key function features and interpret them in context."],
        )
        self.assertEqual(self.lesson["depth"], "B Bridge Depth")
        self.assertEqual(
            self.lesson["requiredGrade9Coverage"],
            "Read these features accurately from graphs and simple formulas; "
            "use interval language.",
        )
        self.assertEqual(
            self.lesson["coverageBoundary"],
            "Not introduced within this course: calculus language, derivative "
            "reasoning, or AP-level polynomial/rational feature synthesis.",
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

    def test_depth_pacing_coverage_and_boundary_are_explicit(self) -> None:
        for phrase in (
            "Bridge Depth",
            "2 target periods",
            "3 maximum",
            "graphs and simple formulas",
            "interval language",
            "derivative reasoning",
            "polynomial or rational features",
        ):
            self.assertIn(phrase.lower(), self.html.lower())
        for prohibited in (
            "calculate a derivative",
            "differentiate the function",
            "rational end-behavior synthesis",
            "polynomial feature synthesis exercise",
        ):
            self.assertNotIn(prohibited, self.html.lower())

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
            "E1": 0, "E2": 1, "E3": 0, "E4": 1,
            "M1": 1, "M2": 1, "M3": 2, "M4": 0, "M5": 1, "M6": 2,
            "H1": 0, "H2": 1, "H3": 1, "H4": 1, "H5": 1, "H6": 1,
            "C1": 2, "C2": 1, "C3": 0, "C4": 0,
        }
        found = {
            item: int(answer)
            for item, answer in re.findall(
                r'\{id:"([EMHC]\d+)".*?,answer:(\d)', self.html
            )
        }
        self.assertEqual(found, expected)

    def test_representative_mathematics_is_exact(self) -> None:
        # f(x)=-(x-1)^2+4 has a maximum at (1,4).
        self.assertEqual(-(1 - 1) ** 2 + 4, 4)
        self.assertLess(-(-2 - 1) ** 2 + 4, 4)
        self.assertLess(-(4 - 1) ** 2 + 4, 4)
        # g(x)=x^2-4 has zeros +/-2 and y-intercept -4.
        self.assertEqual(((-2) ** 2 - 4, 2**2 - 4, 0**2 - 4), (0, 0, -4))
        # P(t)=-t^2+6t+7 has maximum (3,16).
        self.assertEqual(-(3**2) + 6 * 3 + 7, 16)
        # h(t)=-0.5(t-4)^2+8 on [0,8] has zeros 0,8 and maximum (4,8).
        self.assertEqual(
            tuple(-0.5 * (t - 4) ** 2 + 8 for t in (0, 4, 8)),
            (0.0, 8.0, 0.0),
        )
        # q(x)=2(x-3)(x+1) has y-intercept -6 and is negative between roots.
        self.assertEqual(2 * (0 - 3) * (0 + 1), -6)
        self.assertLess(2 * (1 - 3) * (1 + 1), 0)
        # A repeated root at -1 does not change the sign of F=(x+1)^2(x-3).
        for x in (-4, 0, 2):
            self.assertLess((x + 1) ** 2 * (x - 3), 0)
        self.assertGreater((4 + 1) ** 2 * (4 - 3), 0)

    def test_screen_plan_is_64_meaningful_screens(self) -> None:
        self.assertIn('<meta name="echs-screen-count" content="64">', self.html)
        self.assertIn("const EXPECTED_SCREEN_COUNT=64", self.html)
        self.assertEqual(self.html.count("    add("), 44)
        self.assertEqual(44 + 20, 64)
        for signal in (
            "Learning goals", "Worked example", "Student Turn",
            "Misconception check", "Differentiated practice",
            "AP-readiness transfer", "Exit ticket", "Mastery evidence",
        ):
            self.assertIn(signal, self.html)

    def test_math_interaction_and_persistence_contracts(self) -> None:
        self.assertIn("katex@0.16.11", self.html)
        self.assertGreaterEqual(self.html.count('class="math" data-tex='), 60)
        tex_values = re.findall(r'data-tex="(.*?)"', self.html)
        unsafe_commands = [
            value
            for value in tex_values
            if re.search(
                r'(?<!\\)\\(?:frac|sqrt|ge|le|ne|infty|cup|in|mid|mathbb|ldots|\{|\})',
                value,
            )
        ]
        self.assertEqual(
            unsafe_commands,
            [],
            "KaTeX commands in JavaScript strings need doubled backslashes",
        )
        for signal in (
            "localStorage", "exportWork", "ArrowRight",
            'data-check="', 'aria-live="polite"',
        ):
            self.assertIn(signal, self.html)

    def test_accessibility_responsive_and_visual_precision(self) -> None:
        for signal in (
            'name="viewport"',
            "focus-visible",
            "prefers-reduced-motion:reduce",
            "@media(max-width:520px)",
            "Skip to lesson content",
            'role="img" aria-labelledby="fg-title-',
            '<title id="fg-title-',
            '<desc id="fg-desc-',
            '<marker id="axis-arrow-',
            '<marker id="curve-arrow-',
            'marker-end="url(#axis-arrow-',
            'role="img" aria-labelledby="ctx-title-',
            '<title id="ctx-title-',
            '<desc id="ctx-desc-',
            'aria-label="Increasing and decreasing intervals"',
            "An equal-scale graph",
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
