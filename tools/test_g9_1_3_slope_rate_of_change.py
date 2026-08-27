#!/usr/bin/env python3
"""Deterministic release checks for Grade 9 lesson 1.3."""

from __future__ import annotations

import json
import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "curriculum/pathways/grade-9-2026-2027.json"
CATALOG = ROOT / "data/grade-9-10-pathways.js"
LESSON_URL = "lessons/pathways/grade-9/unit-1/g9-1.3-slope-rate-of-change.html"
LESSON = ROOT / LESSON_URL


class GradeNineSlopeRateTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
        cls.html = LESSON.read_text(encoding="utf-8")
        cls.lesson = cls.manifest["paths"]["common"]["units"][1]["lessons"][2]

    def test_authoritative_manifest_row_is_truthfully_ready(self) -> None:
        self.assertEqual(self.lesson["id"], "1.3")
        self.assertEqual(self.lesson["title"], "Slope and Rate of Change")
        self.assertEqual(self.lesson["deliveryStatus"], "ready")
        self.assertEqual(self.lesson["url"], LESSON_URL)
        self.assertEqual(self.lesson["screenCount"], 64)
        self.assertTrue(LESSON.is_file())
        self.assertIn(f'"url":"{LESSON_URL}"', CATALOG.read_text(encoding="utf-8"))

    def test_approved_scope_depth_pacing_and_boundary(self) -> None:
        for phrase in (
            "Slope and Rate of Change",
            "Constant rates from points, tables, graphs, formulas, and contexts",
            "positive, negative, zero, and undefined slope",
            "three class periods, maximum three",
            "prerequisite-mastery",
            "AP-style changing-rate and covariation analysis",
            "Variable-function average rate of change returns at bridge depth in Unit 3",
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

    def test_independently_verified_answer_key(self) -> None:
        expected = {
            "E1": 1, "E2": 1, "E3": 0, "E4": 2,
            "M1": 0, "M2": 3, "M3": 1, "M4": 0, "M5": 1, "M6": 1,
            "H1": 0, "H2": 1, "H3": 1, "H4": 1, "H5": 1, "H6": 0,
            "C1": 2, "C2": 3, "C3": 0, "C4": 2,
        }
        found = {
            item: int(answer)
            for item, answer in re.findall(r'\{id:"([EMHC]\d+)".*?,answer:(\d)', self.html)
        }
        self.assertEqual(found, expected)
        self.assertEqual(self.html.count("solution:'"), 20)

    def test_slope_calculations_and_units_are_consistent(self) -> None:
        required = (
            r"m=(11-3)/(6-2)=8/4=2",
            r"m=(-8-4)/(5-(-3))=-12/8=-3/2",
            r"(19-7)/(3-1)=12/2=6\\text{ km/h}",
            r"(390-150)/(7-2)=240/5=48\\text{ people/min}",
            r"-12/(k+4)=-2",
            r"(f(b)-f(a))/(b-a)",
        )
        for expression in required:
            self.assertIn(expression, self.html)
        for unit in (r"\\text{ QAR/kg}", r"\\text{ km/h}", r"\\text{ people/min}", r"\\text{ °F/min}"):
            self.assertIn(unit, self.html)

    def test_screen_plan_is_64_meaningful_screens(self) -> None:
        self.assertIn('<meta name="echs-screen-count" content="64">', self.html)
        self.assertIn("const EXPECTED_SCREEN_COUNT=64", self.html)
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

    def test_accessibility_responsive_and_publication_safety(self) -> None:
        for signal in (
            'name="viewport"', "focus-visible", "prefers-reduced-motion:reduce",
            "@media(max-width:520px)", "Skip to lesson content",
            'role="img" aria-labelledby="graph-title-',
            "<title id=\"graph-title-", "<desc id=\"graph-desc-",
        ):
            self.assertIn(signal, self.html)
        self.assertNotIn(".flow span{", self.html)
        lowered = self.html.lower()
        for prohibited in (
            "question-bank/official", "private question", "college board question",
            "credential", "answer token", "pearson", "lorem ipsum",
        ):
            self.assertNotIn(prohibited, lowered)


if __name__ == "__main__":
    unittest.main()
