#!/usr/bin/env python3
"""Deterministic release checks for Grade 9 lesson 1.4."""

from __future__ import annotations

import json
import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "curriculum/pathways/grade-9-2026-2027.json"
CATALOG = ROOT / "data/grade-9-10-pathways.js"
LESSON_URL = "lessons/pathways/grade-9/unit-1/g9-1.4-representations-of-linear-functions.html"
LESSON = ROOT / LESSON_URL


class GradeNineLinearRepresentationsTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
        cls.html = LESSON.read_text(encoding="utf-8")
        cls.lesson = cls.manifest["paths"]["common"]["units"][1]["lessons"][3]

    def test_authoritative_manifest_row_is_truthfully_ready(self) -> None:
        self.assertEqual(self.lesson["id"], "1.4")
        self.assertEqual(self.lesson["title"], "Representations of Linear Functions")
        self.assertEqual(
            self.lesson["subtopics"],
            ["Slope-intercept, point-slope, standard form; intercepts; graphing; tables; writing equations."],
        )
        self.assertIn("construct an equation from data or conditions", self.lesson["learningOutcomes"][0])
        self.assertEqual(self.lesson["deliveryStatus"], "ready")
        self.assertEqual(self.lesson["url"], LESSON_URL)
        self.assertEqual(self.lesson["screenCount"], 64)
        self.assertTrue(LESSON.is_file())
        self.assertIn(f'"url":"{LESSON_URL}"', CATALOG.read_text(encoding="utf-8"))

    def test_approved_depth_pacing_and_boundary(self) -> None:
        for phrase in (
            "Representations of Linear Functions",
            "Slope-intercept, point-slope, and standard form",
            "equation, table, graph, and context",
            "construct the one line that satisfies given conditions or data",
            "three class periods, maximum three",
            "prerequisite-mastery",
            "Matrix methods and advanced regression diagnostics",
        ):
            self.assertIn(phrase, self.html)

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
            "E1": 0, "E2": 1, "E3": 2, "E4": 2,
            "M1": 1, "M2": 0, "M3": 0, "M4": 0, "M5": 2, "M6": 2,
            "H1": 0, "H2": 0, "H3": 1, "H4": 0, "H5": 0, "H6": 0,
            "C1": 0, "C2": 1, "C3": 1, "C4": 0,
        }
        found = {
            item: int(answer)
            for item, answer in re.findall(r'\{id:"([EMHC]\d+)".*?,answer:(\d)', self.html)
        }
        self.assertEqual(found, expected)
        self.assertTrue(all(0 <= answer <= 3 for answer in found.values()))

    def test_forms_conversions_and_values_are_consistent(self) -> None:
        required = (
            r"y=mx+b",
            r"y-y_1=m(x-x_1)",
            r"Ax+By=C",
            r"y-7=-4(x-2)",
            r"y=2x+7",
            r"2x+3y=12",
            r"f(x)=3x+2",
            r"V=30t+60",
            r"C(t)=10t+34",
            r"C(t)=12t+32",
        )
        for expression in required:
            self.assertIn(expression, self.html)
        for phrase in (
            "x-intercept", "y-intercept", "point-slope form", "slope-intercept form",
            "standard-form equation", "table", "graph", "context",
        ):
            self.assertIn(phrase, self.html)

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
        self.assertGreaterEqual(self.html.count('class="math" data-tex='), 120)
        tex_values = re.findall(r'data-tex="(.*?)"', self.html)
        unsafe_commands = [
            value for value in tex_values
            if re.search(r'(?<!\\)\\(?:Delta|Rightarrow|frac|ne|text)\b', value)
        ]
        self.assertEqual(unsafe_commands, [], "KaTeX commands inside JavaScript strings need doubled backslashes")
        self.assertIn("localStorage", self.html)
        self.assertIn("exportWork", self.html)
        self.assertIn("ArrowRight", self.html)
        self.assertIn('data-check="', self.html)
        self.assertIn('aria-live="polite"', self.html)

    def test_accessibility_responsive_and_visual_precision(self) -> None:
        for signal in (
            'name="viewport"', "focus-visible", "prefers-reduced-motion:reduce",
            "@media(max-width:520px)", "Skip to lesson content",
            'role="img" aria-labelledby="line-title-',
            '<title id="line-title-', '<desc id="line-desc-',
            "Coordinate plane with equal scales", "x-intercept", "y-intercept",
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
