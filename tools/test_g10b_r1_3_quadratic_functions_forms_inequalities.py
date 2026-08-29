#!/usr/bin/env python3
"""Deterministic release checks for Grade 10 Path B lesson R1.3."""
from __future__ import annotations
import json,re,unittest
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
MANIFEST=ROOT/'curriculum/pathways/grade-10-2026-2027.json'
CATALOG=ROOT/'data/grade-9-10-pathways.js'
LESSON_URL='lessons/pathways/grade-10/path-b/unit-r1/g10b-r1.3-quadratic-functions-forms-inequalities.html'
LESSON=ROOT/LESSON_URL

class PathBQuadraticFunctionsTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.manifest=json.loads(MANIFEST.read_text()); cls.html=LESSON.read_text()
        cls.unit=next(u for u in cls.manifest['paths']['pathB']['units'] if u['code']=='R1')
        cls.lesson=next(l for l in cls.unit['lessons'] if l['id']=='R1.3')

    def test_authoritative_row_truthfully_ready(self):
        self.assertEqual(self.lesson['title'],'Quadratic Functions, Forms & Inequalities')
        self.assertEqual(self.lesson['subtopics'],['Standard/vertex/factored forms; vertex/intercepts; transformations; quadratic inequalities; basic model interpretation.'])
        self.assertEqual(self.lesson['learningOutcomes'],['Analyze quadratic functions fluently and solve associated inequalities.'])
        self.assertEqual(self.lesson['alignment'],'AP Precalculus prerequisite/bridge to 1.3')
        self.assertEqual((self.lesson['deliveryStatus'],self.lesson['url'],self.lesson['screenCount']),('ready',LESSON_URL,64))
        self.assertTrue(LESSON.is_file())
        catalog=CATALOG.read_text(); self.assertEqual(catalog.count(f'"url":"{LESSON_URL}"'),1)
        self.assertIn('"id":"R1.3","title":"Quadratic Functions, Forms & Inequalities"',catalog)

    def test_scope_depth_pacing_and_boundary(self):
        self.assertEqual((self.unit['pacing'],self.lesson['depth']),('3-9','M Prerequisite Mastery'))
        self.assertEqual((self.lesson['targetPeriods'],self.lesson['maximumPeriods']),(3,3))
        lowered=self.html.lower()
        for phrase in ('standard/vertex/factored forms; vertex/intercepts; transformations; quadratic inequalities; basic model interpretation','analyze quadratic functions fluently and solve associated inequalities','move among forms, identify key features, solve quadratic inequalities, and connect algebraic form to graph behavior','ap-style rates-of-change arguments','complex model validation','unfamiliar multi-representation tasks','3 periods · 3 maximum'):
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
        expected={'E1':0,'E2':1,'E3':0,'E4':1,'M1':0,'M2':1,'M3':2,'M4':1,'M5':2,'M6':0,'H1':0,'H2':1,'H3':1,'H4':1,'H5':0,'H6':0,'C1':1,'C2':1,'C3':0,'C4':0}
        found={i:int(a) for i,a in re.findall(r'"id":"([EMHC]\d+)".*?"answer":(\d)',self.html)}
        self.assertEqual(found,expected)
        for block in re.findall(r'"options":\[(.*?)\],"answer":',self.html):
            options=json.loads('['+block+']'); self.assertEqual((len(options),len(set(options))),(4,4))

    def test_mathematical_values_verified(self):
        for result in ('a=1, b=−6, and c=5','vertex is (h,k)','−3<x<3','(x−2)²−3','−2x²−4x+6','x²+3x−4','vertex (3,4), opens down','(−∞,−3]∪[2,∞)','f(0)=3(−2)²−12=12−12=0','5=4a−3, so a=2','−8=−4a, so a=2','x=1±√5','−1<x<3','maximum value is 12 at x=2','h(2)=−20+40+1=21','k=−6','−3≤x≤5','x²−6x+5=(x−3)²−4=(x−1)(x−5)','[−1,5]'):
            self.assertIn(result.lower(),self.html.lower())

    def test_screen_math_interaction_accessibility_responsive(self):
        self.assertIn('<meta name="echs-screen-count" content="64">',self.html)
        self.assertIn('const EXPECTED_SCREEN_COUNT=64',self.html); self.assertEqual(self.html.count('\n    add('),44)
        self.assertGreaterEqual(self.html.count('data-tex='),3)
        for signal in ('Learning objective','Prerequisite retrieval','Function versus equation','The parent quadratic','Three-form map','Standard form','Leading coefficient and opening','Vertex form','Read vertex form','Axis and symmetric points','Factored form','Read factored form','Standard to vertex form','Vertex to standard form','Factored to standard form','Three equivalent forms','Graph-feature protocol','Accessible feature graph','Transformations from vertex form','Build from features','Build from zeros','What a quadratic inequality asks','Sign-chart method','Accessible inequality sign chart','Solve a quadratic inequality','Basic model interpretation','Differentiated practice','Exit ticket','mastery evidence','localStorage','exportWork','ArrowRight','data-check="','aria-live="polite"','details','Score all responses','name="viewport"','focus-visible','prefers-reduced-motion:reduce','@media(max-width:520px)','Skip to lesson content','role="img" aria-labelledby="','<title id=','<desc id=','coverTitle','featureTitle','signTitle'):
            self.assertIn(signal.lower(),self.html.lower())
        self.assertIn('katex@0.16.11',self.html)
        unsafe=re.findall(r'(?<!\\)\\(?:frac|mathrm|circ|quad|text|sqrt|to|pm|le|ge|infty|cup|varnothing|Rightarrow|Longleftrightarrow|cdot)',self.html)
        self.assertEqual(unsafe,[])

    def test_originality_and_no_stale_content(self):
        lowered=self.html.lower()
        for prohibited in ('question-bank/official','private question','college board question','credential','answer token','pearson','lorem ipsum','g9_','quadratic equation mastery','rates of change foundations','systems & right-triangle trig spot repair','common entry diagnostic.txt'):
            self.assertNotIn(prohibited,lowered)

    def test_form_graph_and_inequality_reasoning_evidence(self):
        for phrase in ('solving x²−6x+5=0 finds only the inputs','inside signs reverse','equal horizontal distances give equal outputs','axis lies midway between distinct zeros','plot structure, not a random table','same function, different evidence','select the form matching the evidence','find where the graph is above or below','zeros partition the number line','determine the sign on each interval','use open endpoints','physically meaningful time domain'):
            self.assertIn(phrase.lower(),self.html.lower())

if __name__=='__main__': unittest.main()
