#!/usr/bin/env python3
"""Deterministic release checks for Grade 9 lesson 9.1."""
from __future__ import annotations
import json, re, unittest
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
MANIFEST=ROOT/'curriculum/pathways/grade-9-2026-2027.json'
CATALOG=ROOT/'data/grade-9-10-pathways.js'
LESSON_URL='lessons/pathways/grade-9/unit-9/g9-9.1-function-toolkit-synthesis.html'
LESSON=ROOT/LESSON_URL

class GradeNineFunctionToolkitTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.manifest=json.loads(MANIFEST.read_text())
        cls.html=LESSON.read_text()
        cls.lesson=next(l for u in cls.manifest['paths']['common']['units'] for l in u['lessons'] if l['id']=='9.1')

    def test_authoritative_row_truthfully_ready(self):
        self.assertEqual(self.lesson['title'],'Function Toolkit Synthesis')
        self.assertEqual(self.lesson['subtopics'],['Domain/range; transformations; composition; inverse; rates of change; piecewise review.'])
        self.assertEqual(self.lesson['learningOutcomes'],['Use multiple function tools in one task; choose a representation strategically; explain reasoning with precise notation.'])
        self.assertEqual(self.lesson['alignment'],'AP Precalculus prerequisite profile')
        self.assertEqual((self.lesson['deliveryStatus'],self.lesson['url'],self.lesson['screenCount']),('ready',LESSON_URL,64))
        self.assertTrue(LESSON.is_file())
        catalog=CATALOG.read_text()
        self.assertEqual(catalog.count(f'"url":"{LESSON_URL}"'),1)
        self.assertIn('"id":"9.1","title":"Function Toolkit Synthesis"',catalog)

    def test_scope_pacing_and_boundary(self):
        lowered=self.html.lower()
        for phrase in ('domain/range','transformations','composition','inverse','average rates of change','piecewise review','choose a representation','precise notation','unit pacing: weeks 34–36','formal continuity','instantaneous rate','advanced functional equations','open model construction','full ap learning objectives'):
            self.assertIn(phrase,lowered)
        self.assertNotIn('AP Progress Check',self.html)
        self.assertNotIn('question-bank',lowered)

    def test_twenty_differentiated_original_items(self):
        ids=re.findall(r'\{id:"([EMHC]\d+)"',self.html)
        self.assertEqual((len(ids),len(set(ids))),(20,20))
        self.assertEqual({k:sum(x.startswith(k) for x in ids) for k in 'EMHC'},{'E':4,'M':6,'H':6,'C':4})
        prompts=re.findall(r",prompt:'(.*?)',options:",self.html)
        self.assertEqual((len(prompts),len(set(prompts))),(20,20))
        self.assertEqual(self.html.count("solution:'"),20)
        self.assertEqual((self.html.count('calc:true'),self.html.count('calc:false')),(1,19))

    def test_complete_answer_key_and_unique_options(self):
        expected={'E1':1,'E2':1,'E3':0,'E4':1,'M1':1,'M2':0,'M3':1,'M4':0,'M5':1,'M6':2,'H1':1,'H2':1,'H3':0,'H4':2,'H5':2,'H6':1,'C1':2,'C2':1,'C3':1,'C4':0}
        found={i:int(a) for i,a in re.findall(r'\{id:"([EMHC]\d+)".*?,answer:(\d)',self.html)}
        self.assertEqual(found,expected)
        for block in re.findall(r'options:\[(.*?)\],answer:',self.html):
            options=re.findall(r'"(.*?)"',block)
            self.assertEqual((len(options),len(set(options))),(4,4))

    def test_mathematical_values_and_restrictions(self):
        checks={
            'sqrt(x²−1)':'x≤−1 or x≥1',
            '(x−7)/3':'f⁻¹(x)=(x−7)/3',
            '(2x+1)/(x−1)':'x≠1',
            '(−∞,−3)∪(−3,3)∪(3,∞)':'x cannot be 3 or −3',
            '(−∞,−1)∪(−1,5]':'5−x≥0',
            'Range:</strong> (−∞,3]':'vertex is (2,3)',
            'Average rate=(16−4)/(5−1)=12/4=<strong>3':'output units per input unit',
        }
        for result,evidence in checks.items():
            self.assertIn(result,self.html)
            self.assertIn(evidence,self.html)
        self.assertIn('(2x+1)^2-4=5',self.html)
        self.assertIn('x=1 or -2',self.html)

    def test_screen_math_interaction_accessibility_responsive(self):
        self.assertIn('<meta name="echs-screen-count" content="64">',self.html)
        self.assertIn('const EXPECTED_SCREEN_COUNT=64',self.html)
        self.assertEqual(self.html.count('\n    add('),44)
        self.assertGreaterEqual(self.html.count('class="math" data-tex='),4)
        for signal in ('Learning outcomes','Prerequisite retrieval','Worked example','Student Turn','Domain from a formula','Transformation order','Composition meaning','Inverse method','Average rate of change','Piecewise functions','Strategic representation choice','Differentiated practice','AP bridge','Exit ticket','mastery evidence','localStorage','exportWork','ArrowRight','data-check="','aria-live="polite"','details','Score all responses','name="viewport"','focus-visible','prefers-reduced-motion:reduce','@media(max-width:520px)','Skip to lesson content','role="img" aria-labelledby="','<title id=','<desc id=','toolkitTitle','quadTitle','pieceTitle'):
            self.assertIn(signal.lower(),self.html.lower())
        self.assertIn('katex@0.16.11',self.html)
        unsafe=re.findall(r'(?<!\\)\\(?:frac|mathrm|circ|quad|text|sqrt|to|pm|le|ge|infty|cup|varnothing|Rightarrow|Longleftrightarrow|cdot)',self.html)
        self.assertEqual(unsafe,[])

    def test_originality_and_no_stale_content(self):
        lowered=self.html.lower()
        for prohibited in ('question-bank/official','private question','college board question','credential','answer token','pearson','lorem ipsum','eye-height adjustment','angle of depression','radical equations','synthetic division','growth/decay modeling'):
            self.assertNotIn(prohibited,lowered)

    def test_calculator_and_no_calculator_labels_meaningful(self):
        self.assertIn('Calculator permitted',self.html)
        self.assertIn('No calculator',self.html)
        self.assertIn('exact value',self.html.lower())
        self.assertIn('values may be approximate',self.html.lower())
        self.assertIn('restrictions',self.html.lower())

if __name__=='__main__': unittest.main()
