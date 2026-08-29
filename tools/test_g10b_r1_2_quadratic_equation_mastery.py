#!/usr/bin/env python3
"""Deterministic release checks for Grade 10 Path B lesson R1.2."""
from __future__ import annotations
import json,re,unittest
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
MANIFEST=ROOT/'curriculum/pathways/grade-10-2026-2027.json'
CATALOG=ROOT/'data/grade-9-10-pathways.js'
LESSON_URL='lessons/pathways/grade-10/path-b/unit-r1/g10b-r1.2-quadratic-equation-mastery.html'
LESSON=ROOT/LESSON_URL

class PathBQuadraticEquationMasteryTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.manifest=json.loads(MANIFEST.read_text()); cls.html=LESSON.read_text()
        cls.unit=next(u for u in cls.manifest['paths']['pathB']['units'] if u['code']=='R1')
        cls.lesson=next(l for l in cls.unit['lessons'] if l['id']=='R1.2')

    def test_authoritative_row_truthfully_ready(self):
        self.assertEqual(self.lesson['title'],'Quadratic Equation Mastery')
        self.assertEqual(self.lesson['subtopics'],['Factoring; completing square; quadratic formula; discriminant; real/complex solutions; checking.'])
        self.assertEqual(self.lesson['learningOutcomes'],['Solve quadratic equations independently by an appropriate method and classify roots.'])
        self.assertEqual(self.lesson['alignment'],'AP Precalculus prerequisite to 1.3-1.5')
        self.assertEqual((self.lesson['deliveryStatus'],self.lesson['url'],self.lesson['screenCount']),('ready',LESSON_URL,64))
        self.assertTrue(LESSON.is_file())
        catalog=CATALOG.read_text(); self.assertEqual(catalog.count(f'"url":"{LESSON_URL}"'),1)
        self.assertIn('"id":"R1.2","title":"Quadratic Equation Mastery"',catalog)

    def test_scope_depth_pacing_and_boundary(self):
        self.assertEqual((self.unit['pacing'],self.lesson['depth']),('3-9','M Prerequisite Mastery'))
        self.assertEqual((self.lesson['targetPeriods'],self.lesson['maximumPeriods']),(4,4))
        lowered=self.html.lower()
        for phrase in ('factoring; completing square; quadratic formula; discriminant; real/complex solutions; checking','solve quadratic equations independently by an appropriate method and classify roots','choose an efficient solving method, solve accurately, classify roots, and connect discriminant information to the number/type of roots','outside current scope','ap-style open contextual model construction','4 periods · 4 maximum'):
            self.assertIn(phrase,lowered)

    def test_twenty_differentiated_items_and_tool_labels(self):
        ids=re.findall(r'"id":"([EMHC]\d+)"',self.html)
        self.assertEqual((len(ids),len(set(ids))),(20,20))
        self.assertEqual({k:sum(x.startswith(k) for x in ids) for k in 'EMHC'},{'E':4,'M':6,'H':6,'C':4})
        prompts=re.findall(r'"prompt":"(.*?)","options":',self.html)
        self.assertEqual((len(prompts),len(set(prompts))),(20,20))
        self.assertEqual(self.html.count('"solution":'),20); self.assertEqual(self.html.count('"strand":'),20)
        self.assertEqual(self.html.count('"calc":true'),4); self.assertEqual(self.html.count('"calc":false'),16)

    def test_complete_answer_key_and_unique_options(self):
        expected={'E1':0,'E2':1,'E3':1,'E4':0,'M1':2,'M2':1,'M3':1,'M4':0,'M5':1,'M6':2,'H1':0,'H2':1,'H3':1,'H4':0,'H5':1,'H6':1,'C1':2,'C2':2,'C3':0,'C4':0}
        found={i:int(a) for i,a in re.findall(r'"id":"([EMHC]\d+)".*?"answer":(\d)',self.html)}
        self.assertEqual(found,expected)
        for block in re.findall(r'"options":\[(.*?)\],"answer":',self.html):
            options=json.loads('['+block+']'); self.assertEqual((len(options),len(set(options))),(4,4))

    def test_mathematical_values_verified(self):
        for result in ('(x−2)(x−3)=0','d=b²−4ac=(−4)²−4(1)(1)=16−4=12>0','(2x−1)(x−3)','x=−1±2√2','x=3±√7','x=−2±3i','(3x+2)(2x−1)','x=−1±√14/2','d=(−2)²−4(5)(4)=4−80=−76<0','(−1±i√14)/3','k²−64=0','x²−4x+1=0','x=(1±√7)/2','x=(3±5)/4'):
            self.assertIn(result.lower(),self.html.lower())

    def test_screen_math_interaction_accessibility_responsive(self):
        self.assertIn('<meta name="echs-screen-count" content="64">',self.html)
        self.assertIn('const EXPECTED_SCREEN_COUNT=64',self.html); self.assertEqual(self.html.count('\n    add('),44)
        self.assertGreaterEqual(self.html.count('class="math" data-tex='),8)
        for signal in ('Learning objective','Prerequisite retrieval','Zero-product property','Standard-form preparation','Method-selection decision tree','Factoring a monic quadratic','Factoring a nonmonic quadratic','Difference and perfect squares','Square-root property','Why completing the square works','Completing the square with a=1','When a is not 1','The quadratic formula','Formula anatomy','Quadratic formula with irrational roots','The discriminant','Classify from the sign of D','Root-classification map','Complex-number prerequisite','Formula with a negative discriminant','Check in the original equation','Repeated roots and multiplicity','Exact and decimal forms','Method efficiency','Misconception check','Error-analysis protocol','AP-readiness transfer','Differentiated practice','Exit ticket','mastery evidence','localStorage','exportWork','ArrowRight','data-check="','aria-live="polite"','details','Score all responses','name="viewport"','focus-visible','prefers-reduced-motion:reduce','@media(max-width:520px)','Skip to lesson content','role="img" aria-labelledby="','<title id=','<desc id=','coverTitle','squareTitle','discTitle'):
            self.assertIn(signal.lower(),self.html.lower())
        self.assertIn('katex@0.16.11',self.html)
        unsafe=re.findall(r'(?<!\\)\\(?:frac|mathrm|circ|quad|text|sqrt|to|pm|le|ge|infty|cup|varnothing|Rightarrow|Longleftrightarrow|cdot)',self.html)
        self.assertEqual(unsafe,[])

    def test_originality_and_no_stale_content(self):
        lowered=self.html.lower()
        for prohibited in ('question-bank/official','private question','college board question','credential','answer token','pearson','lorem ipsum','g9_','rates of change foundations','systems & right-triangle trig spot repair','function notation, domain & representations','common entry diagnostic.txt'):
            self.assertNotIn(prohibited,lowered)

    def test_quadratic_reasoning_and_classification_evidence(self):
        for phrase in ('factoring is a solving method only after one side equals zero','same quantity must be added to both sides','substitute signed coefficients with parentheses','full numerator is divided by 2a','two distinct real roots','one repeated real root','two nonreal complex conjugate roots','negative discriminant means no real roots, not no roots','complex roots of a real-coefficient quadratic occur as conjugates','verify in the original equation','exact first; decimal only when useful','every valid method works; efficiency reduces error risk'):
            self.assertIn(phrase.lower(),self.html.lower())

if __name__=='__main__': unittest.main()
