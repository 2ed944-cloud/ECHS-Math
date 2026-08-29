#!/usr/bin/env python3
"""Deterministic release checks for Grade 10 Path B lesson R1.1."""
from __future__ import annotations
import json,re,unittest
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
MANIFEST=ROOT/'curriculum/pathways/grade-10-2026-2027.json'
CATALOG=ROOT/'data/grade-9-10-pathways.js'
LESSON_URL='lessons/pathways/grade-10/path-b/unit-r1/g10b-r1.1-rates-of-change-foundations.html'
LESSON=ROOT/LESSON_URL

class PathBRatesFoundationsTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.manifest=json.loads(MANIFEST.read_text()); cls.html=LESSON.read_text()
        cls.unit=next(u for u in cls.manifest['paths']['pathB']['units'] if u['code']=='R1')
        cls.lesson=next(l for l in cls.unit['lessons'] if l['id']=='R1.1')

    def test_authoritative_row_truthfully_ready(self):
        self.assertEqual(self.lesson['title'],'Rates of Change Foundations')
        self.assertEqual(self.lesson['subtopics'],['Slope/AROC; units; first differences; second differences; classify linear vs quadratic behavior from clear tables/graphs/formulas.'])
        self.assertEqual(self.lesson['learningOutcomes'],['Compute and interpret average rates and recognize linear versus quadratic change patterns.'])
        self.assertEqual(self.lesson['alignment'],'AP Precalculus 1.2-1.3')
        self.assertEqual((self.lesson['deliveryStatus'],self.lesson['url'],self.lesson['screenCount']),('ready',LESSON_URL,64))
        self.assertTrue(LESSON.is_file())
        catalog=CATALOG.read_text(); self.assertEqual(catalog.count(f'"url":"{LESSON_URL}"'),1)
        self.assertIn('"id":"R1.1","title":"Rates of Change Foundations"',catalog)

    def test_scope_depth_pacing_and_boundary(self):
        self.assertEqual((self.unit['pacing'],self.lesson['depth']),('3-9','B Bridge Depth'))
        self.assertEqual((self.lesson['targetPeriods'],self.lesson['maximumPeriods']),(2,3))
        lowered=self.html.lower()
        for phrase in ('slope/aroc; units; first differences; second differences; classify linear vs quadratic behavior from clear tables/graphs/formulas','compute and interpret aroc over intervals','constant from linearly changing rates','sustained change-in-tandem investigations','concavity from changing rates','polynomial rate-pattern analysis','unfamiliar ap justification','2 periods · 3 maximum'):
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
        expected={'E1':0,'E2':1,'E3':1,'E4':0,'M1':2,'M2':1,'M3':1,'M4':0,'M5':1,'M6':1,'H1':1,'H2':1,'H3':1,'H4':0,'H5':1,'H6':1,'C1':2,'C2':2,'C3':0,'C4':1}
        found={i:int(a) for i,a in re.findall(r'"id":"([EMHC]\d+)".*?"answer":(\d)',self.html)}
        self.assertEqual(found,expected)
        for block in re.findall(r'"options":\[(.*?)\],"answer":',self.html):
            options=json.loads('['+block+']'); self.assertEqual((len(options),len(set(options))),(4,4))

    def test_mathematical_values_verified(self):
        for result in ('9/3=3','kilometers per hour','6/2=3','first differences are 3,3,3','15/3=5','8/4=2','−8/4=−2','first differences 4,4,4','second differences are 2,2','78/6.5=12','−7.5/5=−1.5','6/2=3','second differences are 2,2','rate is constant','2.5/2.5=1','−4,−4,−4','k=14+5=19','k=10+7=17','10.5/3=3.5','48/3=16'):
            self.assertIn(result.lower(),self.html.lower())

    def test_screen_math_interaction_accessibility_responsive(self):
        self.assertIn('<meta name="echs-screen-count" content="64">',self.html)
        self.assertIn('const EXPECTED_SCREEN_COUNT=64',self.html); self.assertEqual(self.html.count('\n    add('),44)
        self.assertGreaterEqual(self.html.count('class="math" data-tex='),3)
        for signal in ('Learning objective','Prerequisite retrieval','Average rate of change','AROC from a formula','AROC from a table','Accessible secant graph','AROC from graph coordinates','Contextual AROC','Units are mathematical evidence','Compare interval rates','First differences','Linear table fingerprint','Unequal input intervals','Linear formula fingerprint','Second differences','Quadratic table fingerprint','Quadratic formula fingerprint','Linear and quadratic fingerprints','Accessible behavior comparison','Table classification protocol','Formula classification','Context classification','Misconception check','Error-analysis protocol','AP-readiness transfer','Cumulative retrieval','Differentiated practice','Exit ticket','mastery evidence','localStorage','exportWork','ArrowRight','data-check="','aria-live="polite"','details','Score all responses','name="viewport"','focus-visible','prefers-reduced-motion:reduce','@media(max-width:520px)','Skip to lesson content','role="img" aria-labelledby="','<title id=','<desc id=','coverTitle','secantTitle','compareTitle'):
            self.assertIn(signal.lower(),self.html.lower())
        self.assertIn('katex@0.16.11',self.html)
        unsafe=re.findall(r'(?<!\\)\\(?:frac|mathrm|circ|quad|text|sqrt|to|pm|le|ge|infty|cup|varnothing|Rightarrow|Longleftrightarrow|cdot)',self.html)
        self.assertEqual(unsafe,[])

    def test_originality_and_no_stale_content(self):
        lowered=self.html.lower()
        for prohibited in ('question-bank/official','private question','college board question','credential','answer token','pearson','lorem ipsum','g9_','systems & right-triangle trig spot repair','function notation, domain & representations','common entry diagnostic.txt'):
            self.assertNotIn(prohibited,lowered)

    def test_rate_reasoning_and_classification_evidence(self):
        for phrase in ('subtract outputs in the same order as inputs','output units per input unit','secant line joins the two endpoint points','not necessarily the rate at every interior point','negative sign means','equal input spacing','raw differences are not rates','constant first differences indicate','constant nonzero second difference','straight line has constant slope','parabola’s secant slopes change','do not infer formal concavity language','full change-in-tandem investigations'):
            self.assertIn(phrase.lower(),self.html.lower())

if __name__=='__main__': unittest.main()
