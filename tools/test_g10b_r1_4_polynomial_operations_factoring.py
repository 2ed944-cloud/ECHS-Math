#!/usr/bin/env python3
"""Deterministic release checks for Grade 10 Path B lesson R1.4."""
from __future__ import annotations

import json
import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "curriculum/pathways/grade-10-2026-2027.json"
CATALOG = ROOT / "data/grade-9-10-pathways.js"
LESSON_URL = "lessons/pathways/grade-10/path-b/unit-r1/g10b-r1.4-polynomial-operations-factoring.html"
LESSON = ROOT / LESSON_URL


class PathBPolynomialOperationsTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.manifest = json.loads(MANIFEST.read_text())
        cls.html = LESSON.read_text()
        cls.unit = next(u for u in cls.manifest["paths"]["pathB"]["units"] if u["code"] == "R1")
        cls.lesson = next(l for l in cls.unit["lessons"] if l["id"] == "R1.4")
        match = re.search(r"const practice=(\[.*?\]);\n", cls.html)
        assert match
        cls.practice = json.loads(match.group(1))

    def test_authoritative_row_truthfully_ready(self):
        self.assertEqual(self.lesson["title"], "Polynomial Operations & Factoring")
        self.assertEqual(self.lesson["subtopics"], ["Add/subtract/multiply; special products; GCF; trinomials; grouping; sum/difference of cubes; solve factored equations."])
        self.assertEqual(self.lesson["learningOutcomes"], ["Manipulate and factor polynomials accurately and use factored structure to solve equations."])
        self.assertEqual(self.lesson["alignment"], "AP Precalculus prerequisite to 1.4-1.6")
        self.assertEqual((self.lesson["deliveryStatus"], self.lesson["url"], self.lesson["screenCount"]), ("ready", LESSON_URL, 64))
        self.assertTrue(LESSON.is_file())
        catalog = CATALOG.read_text()
        self.assertEqual(catalog.count(f'"url":"{LESSON_URL}"'), 1)
        self.assertIn('"id":"R1.4","title":"Polynomial Operations & Factoring"', catalog)

    def test_scope_depth_pacing_and_boundary(self):
        self.assertEqual((self.unit["pacing"], self.lesson["depth"]), ("3-9", "M Prerequisite Mastery"))
        self.assertEqual((self.lesson["targetPeriods"], self.lesson["maximumPeriods"]), (4, 4))
        lowered = self.html.lower()
        for phrase in (
            "add/subtract/multiply; special products; gcf; trinomials; grouping; sum/difference of cubes; solve factored equations",
            "manipulate and factor polynomials accurately and use factored structure to solve equations",
            "polynomial algebra is expected to be sufficiently fluent that later function analysis is not slowed by manipulation errors",
            "binomial theorem as a required topic",
            "exotic contest-style factoring",
            "4 periods · 4 maximum",
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
        expected = {"E1":0,"E2":1,"E3":2,"E4":0,"M1":1,"M2":2,"M3":0,"M4":1,"M5":3,"M6":2,"H1":0,"H2":1,"H3":2,"H4":3,"H5":0,"H6":1,"C1":2,"C2":0,"C3":1,"C4":3}
        self.assertEqual({q["id"]: q["answer"] for q in self.practice}, expected)
        for q in self.practice:
            self.assertEqual((len(q["options"]), len(set(q["options"]))), (4, 4))
            self.assertIn(q["options"][q["answer"]], {
                "4x²+5x+4","8x³−12x²+20x","x²+x−6","3x(2x+3)","3x²+4x−11",
                "4x²−20x+25","(x−7)(x+7)","(x+4)(x+5)","−12.75","(3x+1)(2x+3)",
                "(x+3)(x²+2)","(2x−3)(4x²+6x+9)","(3x+2)(9x²−6x+4)","−7.896",
                "2x(x−2)(x+2)","x=−1,1,4","(a−2)(a+2)(a²+4)","x=−3,−1/2,3",
                "x³+3x²−6x−8","3x(x−2)(x²+2x+4)",
            })

    def test_mathematical_values_recomputed(self):
        def mul(a, b):
            out = [0] * (len(a) + len(b) - 1)
            for i, x in enumerate(a):
                for j, y in enumerate(b):
                    out[i + j] += x * y
            return out

        self.assertEqual(mul([-4, 1], [6, 1]), [-24, 2, 1])
        self.assertAlmostEqual((-1.5) * 8.5, -12.75)
        self.assertEqual(mul([1, 3], [3, 2]), [3, 11, 6])
        self.assertEqual(mul([-3, 2], [9, 6, 4]), [-27, 0, 0, 8])
        self.assertEqual(mul([2, 3], [4, -6, 9]), [8, 0, 0, 27])
        self.assertAlmostEqual((-1.4) * 5.64, -7.896)
        self.assertEqual(mul([-4, 1], mul([-1, 1], [1, 1])), [4, -1, -4, 1])
        self.assertEqual(mul([1, 2], mul([-3, 1], [3, 1])), [-9, -18, 1, 2])
        self.assertEqual(mul([-2, 1], mul([1, 1], [4, 1])), [-8, -6, 3, 1])
        self.assertAlmostEqual(3 * 1.5 * (1.5 - 2) * (1.5**2 + 2 * 1.5 + 4), -20.8125)

    def test_screen_math_interaction_accessibility_responsive(self):
        self.assertIn('<meta name="echs-screen-count" content="64">', self.html)
        self.assertIn("const EXPECTED_SCREEN_COUNT=64", self.html)
        self.assertEqual(self.html.count("\n    add("), 44)
        self.assertGreaterEqual(self.html.count("data-tex="), 3)
        for signal in (
            "Learning objective","Prerequisite retrieval","Polynomial vocabulary","Standard form as an alignment tool",
            "Add polynomials","Subtract polynomials","Multiply by a monomial","Accessible area model",
            "Multiply two binomials","Special products","Factoring reverses multiplication","Greatest common factor first",
            "Monic trinomials","Nonmonic trinomials","Factor four terms by grouping","Sum and difference of cubes",
            "Accessible factoring decision tree","Factor until every factor is irreducible","Solve factored equations",
            "Differentiated practice","Exit ticket","mastery evidence","localStorage","exportWork","ArrowRight",
            'data-check="','aria-live="polite"',"details","Score all responses",'name="viewport"',"focus-visible",
            "prefers-reduced-motion:reduce","@media(max-width:520px)","Skip to lesson content",
            'role="img" aria-labelledby="','<title id=','<desc id=',"coverTitle","areaTitle","treeTitle",
        ):
            self.assertIn(signal.lower(), self.html.lower())
        self.assertIn("katex@0.16.11", self.html)
        unsafe = re.findall(r"(?<!\\)\\(?:frac|mathrm|circ|quad|text|sqrt|to|pm|le|ge|infty|cup|varnothing|Rightarrow|Longleftrightarrow|cdot)", self.html)
        self.assertEqual(unsafe, [])

    def test_originality_and_no_stale_content(self):
        lowered = self.html.lower()
        for prohibited in (
            "question-bank/official","private question","college board question","credential","answer token","pearson",
            "lorem ipsum","g9_","quadratic functions, forms & inequalities","vertex-form features","parabola",
            "common entry diagnostic.txt","echs-g10b-r1.3",
        ):
            self.assertNotIn(prohibited, lowered)

    def test_structural_reasoning_evidence(self):
        for phrase in (
            "only like terms combine","distribute the negative to every term","four products appear before like terms combine",
            "middle term is twice the product","factoring reverses multiplication","greatest common factor first",
            "multiply to verify","split the middle term using ac","create a common binomial factor",
            "same sign, opposite sign, always positive last term","repeat the decision process inside each factor",
            "zero-product property requires an equation equal to zero","substitute each value into the original equation",
            "do not apply zero-product reasoning when the product equals a nonzero number",
        ):
            self.assertIn(phrase, self.html.lower())


if __name__ == "__main__":
    unittest.main()
