#!/usr/bin/env python3
"""Deterministic release checks for Grade 9 lesson 9.3."""
from __future__ import annotations
import json, re, unittest
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
MANIFEST=ROOT/'curriculum/pathways/grade-9-2026-2027.json'
CATALOG=ROOT/'data/grade-9-10-pathways.js'
LESSON_URL='lessons/pathways/grade-9/unit-9/g9-9.3-ap-style-multiple-representations.html'
LESSON=ROOT/LESSON_URL

class GradeNineMultipleRepresentationsTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.manifest=json.loads(MANIFEST.read_text())
        cls.html=LESSON.read_text()
        cls.lesson=next(l for u in cls.manifest['paths']['common']['units'] for l in u['lessons'] if l['id']=='9.3')

    def test_authoritative_row_truthfully_ready(self):
        self.assertEqual(self.lesson['title'],'AP-Style Multiple Representations')
        self.assertEqual(self.lesson['subtopics'],['Graph-table-formula-context translation; non-calculator algebra; calculator-supported analysis; written rationale.'])
        self.assertEqual(self.lesson['learningOutcomes'],['Translate among representations; sustain multi-step reasoning; provide a concise rationale for conclusions.'])
        self.assertEqual(self.lesson['alignment'],'AP Precalculus prerequisite profile')
        self.assertEqual((self.lesson['deliveryStatus'],self.lesson['url'],self.lesson['screenCount']),('ready',LESSON_URL,64))
        self.assertTrue(LESSON.is_file())
        catalog=CATALOG.read_text()
        self.assertEqual(catalog.count(f'"url":"{LESSON_URL}"'),1)
        self.assertIn('"id":"9.3","title":"AP-Style Multiple Representations"',catalog)

    def test_scope_pacing_and_boundary(self):
        lowered=self.html.lower()
        for phrase in ('graph–table–formula–context','non-calculator algebra','calculator-supported analysis','multi-step reasoning','concise written rationale','unit pacing: weeks 34–36','open ap model construction','advanced logarithmic/trigonometric families','formal inference','calculus reasoning','extended ap free-response scoring'):
            self.assertIn(phrase,lowered)
        self.assertNotIn('AP Progress Check',self.html)
        self.assertNotIn('question-bank',lowered)

    def test_twenty_differentiated_original_items(self):
        ids=re.findall(r'"id":"([EMHC]\d+)"',self.html)
        self.assertEqual((len(ids),len(set(ids))),(20,20))
        self.assertEqual({k:sum(x.startswith(k) for x in ids) for k in 'EMHC'},{'E':4,'M':6,'H':6,'C':4})
        prompts=re.findall(r'"prompt":"(.*?)","options":',self.html)
        self.assertEqual((len(prompts),len(set(prompts))),(20,20))
        self.assertEqual(self.html.count('"solution":'),20)
        self.assertEqual((self.html.count('"calc":true'),self.html.count('"calc":false')),(2,18))

    def test_complete_answer_key_and_unique_options(self):
        expected={'E1':0,'E2':0,'E3':1,'E4':0,'M1':0,'M2':1,'M3':1,'M4':1,'M5':1,'M6':1,'H1':0,'H2':1,'H3':1,'H4':2,'H5':1,'H6':1,'C1':1,'C2':0,'C3':1,'C4':1}
        found={i:int(a) for i,a in re.findall(r'"id":"([EMHC]\d+)".*?"answer":(\d)',self.html)}
        self.assertEqual(found,expected)
        for block in re.findall(r'"options":\[(.*?)\],"answer":',self.html):
            options=json.loads('['+block+']')
            self.assertEqual((len(options),len(set(options))),(4,4))

    def test_mathematical_values_and_representation_links(self):
        checks={
            'f(3)=9+5=14':'f(x)=3x+5',
            'first differences are −3,−1,1,3':'second differences are 2,2,2',
            'y=(x-1)^2-4':'vertex is (1,-4)',
            'm=(−5−7)/(4−(−2))=−2':'y=−2x+3',
            'ŷ=1.8x+4.2':'1.8(7.5)+4.2=17.7',
            'h(6)≈316.33':'about 316 output units',
            'y=4·2^5=128':'constant ratio 2',
        }
        for result,evidence in checks.items():
            self.assertIn(result,self.html)
            self.assertIn(evidence,self.html)
        self.assertIn('0≤x≤120 for integer x',self.html)
        self.assertIn('Range: y&gt;0',self.html)

    def test_screen_math_interaction_accessibility_responsive(self):
        self.assertIn('<meta name="echs-screen-count" content="64">',self.html)
        self.assertIn('const EXPECTED_SCREEN_COUNT=64',self.html)
        self.assertEqual(self.html.count('\n    add('),44)
        self.assertGreaterEqual(self.html.count('class="math" data-tex='),4)
        for signal in ('Learning outcomes','Prerequisite retrieval','Representation hub','Graph → table','Table pattern scan','Quadratic table translation','Exponential table translation','Linear formula to graph','Quadratic formula to graph','Context to formula','Parameter meaning across representations','Cross-representation consistency','Non-calculator strategy','Calculator-supported workflow','Concise written rationale','Multi-step representation relay','Differentiated practice','AP bridge','Exit ticket','mastery evidence','localStorage','exportWork','ArrowRight','data-check="','aria-live="polite"','details','Score all responses','name="viewport"','focus-visible','prefers-reduced-motion:reduce','@media(max-width:520px)','Skip to lesson content','role="img" aria-labelledby="','<title id=','<desc id=','hubTitle','lineGraphTitle','quadRepTitle','contextGraphTitle'):
            self.assertIn(signal.lower(),self.html.lower())
        self.assertIn('katex@0.16.11',self.html)
        unsafe=re.findall(r'(?<!\\)\\(?:frac|mathrm|circ|quad|text|sqrt|to|pm|le|ge|infty|cup|varnothing|Rightarrow|Longleftrightarrow|cdot)',self.html)
        self.assertEqual(unsafe,[])

    def test_originality_and_no_stale_content(self):
        lowered=self.html.lower()
        for prohibited in ('question-bank/official','private question','college board question','credential','answer token','pearson','lorem ipsum','eye-height adjustment','angle of depression','radical equations','synthetic division','model selection across families'):
            self.assertNotIn(prohibited,lowered)

    def test_calculator_and_no_calculator_labels_meaningful(self):
        self.assertIn('Calculator permitted',self.html)
        self.assertIn('No calculator',self.html)
        self.assertIn('exact first',self.html.lower())
        self.assertIn('enough digits',self.html.lower())
        self.assertIn('rounding',self.html.lower())
        self.assertIn('units',self.html.lower())

if __name__=='__main__': unittest.main()
