#!/usr/bin/env python3
"""Deterministic release checks for Grade 10 Path B lesson R1.5."""
from __future__ import annotations

import json
import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "curriculum/pathways/grade-10-2026-2027.json"
CATALOG = ROOT / "data/grade-9-10-pathways.js"
LESSON_URL = "lessons/pathways/grade-10/path-b/unit-r1/g10b-r1.5-polynomial-division-theorems.html"
LESSON = ROOT / LESSON_URL


class PathBPolynomialDivisionTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.manifest = json.loads(MANIFEST.read_text())
        cls.html = LESSON.read_text()
        cls.unit = next(u for u in cls.manifest["paths"]["pathB"]["units"] if u["code"] == "R1")
        cls.lesson = next(l for l in cls.unit["lessons"] if l["id"] == "R1.5")
        match = re.search(r"const practice=(\[.*?\]);\n", cls.html)
        assert match
        cls.practice = json.loads(match.group(1))

    def test_authoritative_row_truthfully_ready(self):
        self.assertEqual(self.lesson["title"], "Polynomial Division & Theorems")
        self.assertEqual(self.lesson["subtopics"], ["Long division; synthetic division; Remainder Theorem; Factor Theorem; quotient/remainder interpretation."])
        self.assertEqual(self.lesson["learningOutcomes"], ["Use polynomial division and factor/remainder relationships accurately in standard cases."])
        self.assertEqual(self.lesson["alignment"], "AP Precalculus supports 1.11")
        self.assertEqual((self.lesson["deliveryStatus"], self.lesson["url"], self.lesson["screenCount"]), ("ready", LESSON_URL, 64))
        self.assertTrue(LESSON.is_file())
        catalog = CATALOG.read_text()
        self.assertEqual(catalog.count(f'"url":"{LESSON_URL}"'), 1)
        self.assertIn('"id":"R1.5","title":"Polynomial Division & Theorems"', catalog)

    def test_scope_depth_pacing_and_boundary(self):
        self.assertEqual((self.unit["pacing"], self.lesson["depth"]), ("3-9", "M Prerequisite Mastery"))
        self.assertEqual((self.lesson["targetPeriods"], self.lesson["maximumPeriods"]), (2, 2))
        lowered = self.html.lower()
        for phrase in (
            "divide standard polynomials, evaluate remainders efficiently, and use the factor theorem to test or confirm zeros",
            "use polynomial division and factor/remainder relationships accurately in standard cases",
            "full equivalent-representation strategy and slant-asymptote analysis",
            "2 periods · 2 maximum",
            "prerequisite tool, deliberately bounded",
        ):
            self.assertIn(phrase, lowered)

    def test_twenty_differentiated_items_and_tool_labels(self):
        ids = [q["id"] for q in self.practice]
        self.assertEqual((len(ids), len(set(ids))), (20, 20))
        self.assertEqual({k: sum(x.startswith(k) for x in ids) for k in "EMHC"}, {"E": 4, "M": 6, "H": 6, "C": 4})
        prompts = [q["prompt"] for q in self.practice]
        self.assertEqual((len(prompts), len(set(prompts))), (20, 20))
        self.assertTrue(all(q["solution"] and q["strand"] for q in self.practice))
        self.assertEqual(sum(q["calc"] for q in self.practice), 4)
        self.assertEqual(sum(not q["calc"] for q in self.practice), 16)

    def test_complete_answer_key_and_unique_options(self):
        expected = {"E1":1,"E2":1,"E3":0,"E4":1,"M1":0,"M2":0,"M3":0,"M4":2,"M5":1,"M6":0,"H1":0,"H2":0,"H3":0,"H4":1,"H5":3,"H6":0,"C1":0,"C2":0,"C3":0,"C4":0}
        self.assertEqual({q["id"]: q["answer"] for q in self.practice}, expected)
        for q in self.practice:
            self.assertEqual((len(q["options"]), len(set(q["options"]))), (4, 4))
            self.assertTrue(q["options"][q["answer"]])

    def test_mathematical_values_recomputed(self):
        def div_linear(coeffs, c):
            row = [coeffs[0]]
            for value in coeffs[1:]:
                row.append(value + c * row[-1])
            return row[:-1], row[-1]

        self.assertEqual(div_linear([1, 2, -5, -6], -3), ([1, -1, -2], 0))
        self.assertEqual(div_linear([2, -3, 4, -5], 2), ([2, 1, 6], 7))
        self.assertEqual(div_linear([1, 0, -5, 0, 4], -1), ([1, -1, -4, 4], 0))
        self.assertEqual(div_linear([2, -3, 0, 5, -7], 1), ([2, -1, -1, 4], -3))
        self.assertEqual(div_linear([3, 1, -10, -8], -2), ([3, -5, 0], -8))
        self.assertAlmostEqual(2 * 2.5**3 - 3 * 2.5 + 1, 24.75)
        self.assertAlmostEqual((-1.2)**4 - 2 * (-1.2)**2 + 3 * (-1.2) - 1, -5.4064)
        self.assertEqual(8 + 4 * 3 - 8 - 12, 0)
        self.assertAlmostEqual(1.7**4 - 1, 7.3521)

    def test_screen_math_interaction_accessibility_responsive(self):
        self.assertIn('<meta name="echs-screen-count" content="64">', self.html)
        self.assertIn("const EXPECTED_SCREEN_COUNT=64", self.html)
        self.assertEqual(self.html.count("\n    add("), 44)
        self.assertGreaterEqual(self.html.count("data-tex="), 3)
        for signal in (
            "Learning objective","Prerequisite retrieval","Polynomial division identity","Long division protocol",
            "Missing-term discipline","Long division · exact","Long division · remainder","Accessible long-division structure",
            "Synthetic division conditions","Synthetic division · exact","Synthetic division · remainder","Choose a division method",
            "Remainder Theorem","Why the theorem works","Factor Theorem","Nonfactor evidence",
            "Theorem relationship","Factors and zeros","Theorem decision protocol","Method-selection map",
            "AP-readiness transfer","Differentiated practice","Exit ticket","mastery evidence","localStorage","exportWork","ArrowRight",
            'data-check="','aria-live="polite"',"details","Score all responses",'name="viewport"',"focus-visible",
            "prefers-reduced-motion:reduce","@media(max-width:520px)","Skip to lesson content",
            'role="img" aria-labelledby="','<title id=','<desc id=',"coverTitle","longTitle","theoremTitle","methodTitle",
        ):
            self.assertIn(signal.lower(), self.html.lower())
        self.assertIn("katex@0.16.11", self.html)
        unsafe = re.findall(r"(?<!\\)\\(?:frac|mathrm|circ|quad|text|sqrt|to|pm|le|ge|infty|cup|varnothing|Rightarrow|Longleftrightarrow|cdot)", self.html)
        self.assertEqual(unsafe, [])

    def test_originality_and_no_stale_content(self):
        lowered = self.html.lower()
        for prohibited in (
            "question-bank/official","private question","college board question","credential","answer token","pearson",
            "lorem ipsum","g9_","polynomial operations & factoring","binomial theorem","slant-asymptote analysis is included",
            "echs-g10b-r1.4","r1.4_polynomial_operations_factoring",
        ):
            self.assertNotIn(prohibited, lowered)

    def test_theorem_and_verification_reasoning(self):
        for phrase in (
            "dividend = divisor × quotient + remainder","deg r &lt; deg d","with a linear divisor, the remainder is a constant",
            "remainder zero means exact division","divide · multiply · subtract · bring down","insert zero placeholders",
            "rebuild the dividend","synthetic division compresses linear division","the divisor x−c determines c",
            "dividing by x−c leaves remainder p(c)","substitute x=c into the division identity",
            "a linear factor is equivalent to a zero remainder","a nonzero evaluation rejects the factor",
            "need only the remainder? evaluate p(c)","always verify sign, missing terms, and p=dq+r",
        ):
            self.assertIn(phrase, self.html.lower())


if __name__ == "__main__":
    unittest.main()
