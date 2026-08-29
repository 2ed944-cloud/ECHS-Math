#!/usr/bin/env python3
"""Deterministic release checks for Grade 10 Path B lesson R0.2."""
from __future__ import annotations
import json, re, unittest
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
MANIFEST=ROOT/'curriculum/pathways/grade-10-2026-2027.json'
CATALOG=ROOT/'data/grade-9-10-pathways.js'
LESSON_URL='lessons/pathways/grade-10/path-b/unit-r0/g10b-r0.2-algebra-precision-repair.html'
LESSON=ROOT/LESSON_URL

class PathBAlgebraPrecisionRepairTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.manifest=json.loads(MANIFEST.read_text())
        cls.html=LESSON.read_text()
        cls.unit=next(u for u in cls.manifest['paths']['pathB']['units'] if u['code']=='R0')
        cls.lesson=next(l for l in cls.unit['lessons'] if l['id']=='R0.2')

    def test_authoritative_row_truthfully_ready(self):
        self.assertEqual(self.lesson['title'],'Algebra Precision Repair')
        self.assertEqual(self.lesson['subtopics'],['Signs/fractions; exponent laws; equation transformations; factoring basics; radicals; notation; checking equivalence.'])
        self.assertEqual(self.lesson['learningOutcomes'],['Execute core algebra accurately and explain why valid transformations preserve equivalence.'])
        self.assertEqual(self.lesson['alignment'],'AP Precalculus prerequisites to Units 1-2')
        self.assertEqual((self.lesson['deliveryStatus'],self.lesson['url'],self.lesson['screenCount']),('ready',LESSON_URL,64))
        self.assertTrue(LESSON.is_file())
        catalog=CATALOG.read_text()
        self.assertEqual(catalog.count(f'"url":"{LESSON_URL}"'),1)
        self.assertIn('"id":"R0.2","title":"Algebra Precision Repair"',catalog)

    def test_scope_depth_pacing_endpoint_and_boundary(self):
        self.assertEqual(self.unit['pacing'],'1-2')
        self.assertEqual(self.lesson['depth'],'D Diagnostic / Repair')
        self.assertEqual((self.lesson['targetPeriods'],self.lesson['maximumPeriods']),(3,4))
        lowered=self.html.lower()
        for phrase in ('signs/fractions','exponent laws','equation transformations','factoring basics','radicals','notation','checking equivalence','routine symbolic work is reliable','mixed non-calculator evidence','return to the core sequence','not a multi-week algebra 1 review','does not introduce new ap modeling content','use a fourth period only'):
            self.assertIn(phrase,lowered)

    def test_twenty_differentiated_original_items(self):
        ids=re.findall(r'"id":"([EMHC]\d+)"',self.html)
        self.assertEqual((len(ids),len(set(ids))),(20,20))
        self.assertEqual({k:sum(x.startswith(k) for x in ids) for k in 'EMHC'},{'E':4,'M':6,'H':6,'C':4})
        prompts=re.findall(r'"prompt":"(.*?)","options":',self.html)
        self.assertEqual((len(prompts),len(set(prompts))),(20,20))
        self.assertEqual(self.html.count('"solution":'),20)
        self.assertEqual(self.html.count('"strand":'),20)
        self.assertEqual((self.html.count('"calc":true'),self.html.count('"calc":false')),(0,20))

    def test_complete_answer_key_and_unique_options(self):
        expected={'E1':2,'E2':0,'E3':0,'E4':0,'M1':1,'M2':2,'M3':1,'M4':0,'M5':1,'M6':1,'H1':2,'H2':1,'H3':2,'H4':1,'H5':2,'H6':0,'C1':1,'C2':1,'C3':0,'C4':1}
        found={i:int(a) for i,a in re.findall(r'"id":"([EMHC]\d+)".*?"answer":(\d)',self.html)}
        self.assertEqual(found,expected)
        for block in re.findall(r'"options":\[(.*?)\],"answer":',self.html):
            options=json.loads('['+block+']')
            self.assertEqual((len(options),len(set(options))),(4,4))

    def test_mathematical_values_independently_verified(self):
        for result in ('−3(−3)+2=9+2=11','−10/12+3/12=−7/12','x³⁺⁵=x⁸','6x+18=6(x+3)','3x=18, so x=6','−6a⁵b³','√75=√(25·3)=5√3','(x−4)(x+3)','6x−15+4=6x−11','x=2','4x−23=9','y⁴/x³','5x=20 and x=4','(2x+3)(x−5)','5√2','only when x≠3','x+7=5 and x=−2','√25=5','(3x+2)(2x−1)','−6x+8=10'):
            self.assertIn(result,self.html)

    def test_screen_math_interaction_accessibility_responsive(self):
        self.assertIn('<meta name="echs-screen-count" content="64">',self.html)
        self.assertIn('const EXPECTED_SCREEN_COUNT=64',self.html)
        self.assertEqual(self.html.count('\n    add('),44)
        self.assertGreaterEqual(self.html.count('class="math" data-tex='),7)
        for signal in ('Learning objective','Prerequisite retrieval','Meaning of equivalence','Sign precision','Fraction structure','Exponent-law map','Equation transformations','Factoring basics','Radical meaning','Notation precision','Equivalence checks','Error-analysis protocol','Differentiated practice','AP-readiness transfer','Exit ticket','mastery evidence','localStorage','exportWork','ArrowRight','data-check="','aria-live="polite"','details','Score all responses','name="viewport"','focus-visible','prefers-reduced-motion:reduce','@media(max-width:520px)','Skip to lesson content','role="img" aria-labelledby="','<title id=','<desc id=','precisionTitle','balanceTitle','exponentTitle'):
            self.assertIn(signal.lower(),self.html.lower())
        self.assertIn('katex@0.16.11',self.html)
        unsafe=re.findall(r'(?<!\\)\\(?:frac|mathrm|circ|quad|text|sqrt|to|pm|le|ge|infty|cup|varnothing|Rightarrow|Longleftrightarrow|cdot)',self.html)
        self.assertEqual(unsafe,[])

    def test_originality_and_no_stale_content(self):
        lowered=self.html.lower()
        for prohibited in ('question-bank/official','private question','college board question','credential','answer token','pearson','lorem ipsum','grade 9','g9_','common entry diagnostic.txt','cumulative ap readiness capstone','whole-course restart'):
            self.assertNotIn(prohibited,lowered)

    def test_equivalence_error_analysis_and_tool_labels_meaningful(self):
        for phrase in ('No calculator','preserves equivalence','same solution set','state restrictions','cancel factors, not terms','Multiply every term on both sides','principal square root','first invalid transformation','compare domains','AP Precalculus Units 1–2','Targeted follow-up'):
            self.assertIn(phrase.lower(),self.html.lower())

if __name__=='__main__': unittest.main()
