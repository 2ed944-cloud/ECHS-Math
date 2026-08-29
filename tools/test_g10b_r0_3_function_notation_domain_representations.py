#!/usr/bin/env python3
"""Deterministic release checks for Grade 10 Path B lesson R0.3."""
from __future__ import annotations
import json,re,unittest
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
MANIFEST=ROOT/'curriculum/pathways/grade-10-2026-2027.json'
CATALOG=ROOT/'data/grade-9-10-pathways.js'
LESSON_URL='lessons/pathways/grade-10/path-b/unit-r0/g10b-r0.3-function-notation-domain-representations.html'
LESSON=ROOT/LESSON_URL

class PathBFunctionNotationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.manifest=json.loads(MANIFEST.read_text())
        cls.html=LESSON.read_text()
        cls.unit=next(u for u in cls.manifest['paths']['pathB']['units'] if u['code']=='R0')
        cls.lesson=next(l for l in cls.unit['lessons'] if l['id']=='R0.3')

    def test_authoritative_row_truthfully_ready(self):
        self.assertEqual(self.lesson['title'],'Function Notation, Domain & Representations')
        self.assertEqual(self.lesson['subtopics'],['f(x); input/output; image/preimage; domain/range; interval notation; graph/table/formula/context; simple AROC language.'])
        self.assertEqual(self.lesson['learningOutcomes'],['Interpret function notation/domains and move confidently among standard representations.'])
        self.assertEqual(self.lesson['alignment'],'AP Precalculus supports 1.1-1.2')
        self.assertEqual((self.lesson['deliveryStatus'],self.lesson['url'],self.lesson['screenCount']),('ready',LESSON_URL,64))
        self.assertTrue(LESSON.is_file())
        catalog=CATALOG.read_text()
        self.assertEqual(catalog.count(f'"url":"{LESSON_URL}"'),1)
        self.assertIn('"id":"R0.3","title":"Function Notation, Domain & Representations"',catalog)

    def test_scope_depth_pacing_endpoint_and_boundary(self):
        self.assertEqual(self.unit['pacing'],'1-2')
        self.assertEqual(self.lesson['depth'],'M Prerequisite Mastery')
        self.assertEqual((self.lesson['targetPeriods'],self.lesson['maximumPeriods']),(2,2))
        lowered=self.html.lower()
        for phrase in ('f(x); input/output; image/preimage; domain/range; interval notation; graph/table/formula/context; simple aroc language','independently evaluate functions','interpret domain and range','read key graph/table information','translate standard information among representations','full ap covariation','concavity-as-rate language','open graph construction from verbal scenarios','dense multi-representation tasks','2 periods · 2 maximum'):
            self.assertIn(phrase,lowered)

    def test_twenty_differentiated_original_items(self):
        ids=re.findall(r'"id":"([EMHC]\d+)"',self.html)
        self.assertEqual((len(ids),len(set(ids))),(20,20))
        self.assertEqual({k:sum(x.startswith(k) for x in ids) for k in 'EMHC'},{'E':4,'M':6,'H':6,'C':4})
        prompts=re.findall(r'"prompt":"(.*?)","options":',self.html)
        self.assertEqual((len(prompts),len(set(prompts))),(20,20))
        self.assertEqual(self.html.count('"solution":'),20)
        self.assertEqual(self.html.count('"strand":'),20)

    def test_complete_answer_key_and_unique_options(self):
        expected={'E1':1,'E2':2,'E3':0,'E4':1,'M1':1,'M2':1,'M3':1,'M4':0,'M5':1,'M6':0,'H1':2,'H2':2,'H3':0,'H4':1,'H5':1,'H6':1,'C1':0,'C2':1,'C3':0,'C4':0}
        found={i:int(a) for i,a in re.findall(r'"id":"([EMHC]\d+)".*?"answer":(\d)',self.html)}
        self.assertEqual(found,expected)
        for block in re.findall(r'"options":\[(.*?)\],"answer":',self.html):
            options=json.loads('['+block+']')
            self.assertEqual((len(options),len(set(options))),(4,4))

    def test_mathematical_values_and_domains_verified(self):
        for result in ('f(5)=2(5)−3=10−3=7','f(2)=5','{0,1,2,3}','[−2,4)','p(−3)=−(−3)²+4=−9+4=−5','3x+1=13','[2,∞)','x≠−3','{1,4,9}','four items cost 13 riyals','h(3)=(3+2)/(3−1)=5/2','x=3 and x=−3','x=−3 and x=3','integers from 0 through 120','(15−3)/(4−1)=12/3=4','f(x)=2x+5','f(2)=2²=4','(−∞,−1)∪(−1,3]','domain is {0,2,4}','output assigned to input 2'):
            self.assertIn(result.lower(),self.html.lower())

    def test_screen_math_interaction_accessibility_responsive(self):
        self.assertIn('<meta name="echs-screen-count" content="64">',self.html)
        self.assertIn('const EXPECTED_SCREEN_COUNT=64',self.html)
        self.assertEqual(self.html.count('\n    add('),44)
        self.assertGreaterEqual(self.html.count('class="math" data-tex='),7)
        for signal in ('Learning objective','Prerequisite retrieval','Function machine','Anatomy of f(x)','Image and preimage','Interval notation','Accessible number line','Formula restrictions','Contextual domain','Domain and range from a table','Accessible graph reading','Four standard representations','Formula to table','Table to graph','Graph to context','Context to formula','Simple average rate of change','Error-analysis protocol','AP-readiness transfer','Differentiated practice','Exit ticket','mastery evidence','localStorage','exportWork','ArrowRight','data-check="','aria-live="polite"','details','Score all responses','name="viewport"','focus-visible','prefers-reduced-motion:reduce','@media(max-width:520px)','Skip to lesson content','role="img" aria-labelledby="','<title id=','<desc id=','functionTitle','intervalTitle','graphTitle'):
            self.assertIn(signal.lower(),self.html.lower())
        self.assertIn('katex@0.16.11',self.html)
        unsafe=re.findall(r'(?<!\\)\\(?:frac|mathrm|circ|quad|text|sqrt|to|pm|le|ge|infty|cup|varnothing|Rightarrow|Longleftrightarrow|cdot)',self.html)
        self.assertEqual(unsafe,[])

    def test_originality_and_no_stale_content(self):
        lowered=self.html.lower()
        for prohibited in ('question-bank/official','private question','college board question','credential','answer token','pearson','lorem ipsum','grade 9','g9_','common entry diagnostic.txt','cumulative ap readiness capstone','r0.2 algebra precision repair'):
            self.assertNotIn(prohibited,lowered)

    def test_function_language_and_representation_evidence(self):
        for phrase in ('one output for each allowed input','does not mean f multiplied by x','image of 4','preimage of 9','domain is the complete set of inputs','endpoint included','denominator ≠ 0','radicand ≥ 0','do not fill unlisted values','connect points only when','output units per input unit','not full ap covariation','representation and what it guarantees'):
            self.assertIn(phrase.lower(),self.html.lower())

if __name__=='__main__': unittest.main()
