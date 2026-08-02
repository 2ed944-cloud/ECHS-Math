#!/usr/bin/env python3
"""Strict structural, mathematical-data and routing validation for Unit 2 v3."""
from __future__ import annotations
import json, math, re, subprocess, sys
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
UNIT=ROOT/'lessons/ib-math-ai/unit-2'
CATALOG=ROOT/'data/ib-math-ai-unit-2-delivery-catalog.json'

def load_js(path:Path):
    text=path.read_text(encoding='utf-8')
    prefix='window.LESSON_DATA = '
    if not text.startswith(prefix) or not text.endswith(';\n'):
        raise AssertionError(f'{path}: invalid wrapper')
    return json.loads(text[len(prefix):-2])

def main():
    errors=[]; ids=set(); prompts=set(); totals={k:0 for k in ('slides','practice','quiz','exam')}
    catalog=json.loads(CATALOG.read_text(encoding='utf-8'))
    if catalog.get('release')!='3.0.0' or len(catalog.get('lessons',[]))!=19: errors.append('catalog must describe 19 v3 lessons')
    expected=[f'2.{i}' for i in range(1,20)]
    if [r['number'] for r in catalog['lessons']]!=expected: errors.append('lesson sequence must be 2.1 through 2.19')
    for row in catalog['lessons']:
        html=UNIT/'lessons'/row['file']; data_path=UNIT/'data'/row['data']
        if not html.is_file(): errors.append(f'missing {html.relative_to(ROOT)}'); continue
        if not data_path.is_file(): errors.append(f'missing {data_path.relative_to(ROOT)}'); continue
        text=html.read_text(encoding='utf-8')
        for ref in (f'../data/{row["data"]}?v=3.0.0','../assets/js/engine.js?v=3.0.0','../assets/css/theme.css?v=3.0.0'):
            if ref not in text: errors.append(f'{row["file"]}: missing {ref}')
        try: data=load_js(data_path)
        except Exception as exc: errors.append(str(exc)); continue
        if data.get('version')!='3.0.0' or data.get('lesson',{}).get('number')!=row['number']: errors.append(f'{row["number"]}: version/lesson mismatch')
        target={'slides':36,'practice':32,'quiz':10,'exam':3}
        for key,count in target.items():
            actual=len(data.get(key,[]));totals[key]+=actual
            if actual!=count: errors.append(f'{row["number"]}: {key}={actual}, expected {count}')
        levels=[q.get('level') for q in data.get('practice',[])]
        for level in ('Foundation','Application','Reasoning','Challenge'):
            if levels.count(level)!=8: errors.append(f'{row["number"]}: {level} count is {levels.count(level)}')
        for q in data.get('practice',[])+data.get('quiz',[]):
            qid=q.get('id'); prompt=' '.join(str(q.get('prompt','')).split())
            if not qid or qid in ids: errors.append(f'duplicate/missing id {qid}')
            if not prompt or prompt in prompts: errors.append(f'duplicate/missing prompt {prompt[:80]}')
            ids.add(qid);prompts.add(prompt)
            check=q.get('check',{})
            if check.get('mode')=='number' and not math.isfinite(float(check.get('value',float('nan')))): errors.append(f'{qid}: non-finite target')
            if not q.get('solution') or not q.get('answer'): errors.append(f'{qid}: incomplete answer/solution')
        for task in data.get('exam',[]):
            if len(task.get('parts',[]))<4 or sum(int(p.get('marks',0)) for p in task.get('parts',[]))!=task.get('total_marks'): errors.append(f'{task.get("id")}: invalid marks/parts')
            for part in task.get('parts',[]):
                if not part.get('answer') or not part.get('markscheme'): errors.append(f'{task.get("id")}({part.get("label")}): incomplete key')
        data_text=data_path.read_text(encoding='utf-8')
        if data_text.count(r'\\(')!=data_text.count(r'\\)'): errors.append(f'{row["number"]}: inline math delimiters unbalanced')
        if data_text.count(r'\\[')!=data_text.count(r'\\]'): errors.append(f'{row["number"]}: display math delimiters unbalanced')
    if totals!={'slides':684,'practice':608,'quiz':190,'exam':57}: errors.append(f'wrong totals {totals}')
    root_index=(ROOT/'index.html').read_text(encoding='utf-8')
    if 'ib-math-ai-unit-2-update.js?v=20260803-unit2-v3' not in root_index: errors.append('root index does not load Unit 2 v3')
    for path in (ROOT/'data/ib-math-ai-unit-2-update.js',UNIT/'assets/js/engine.js'):
        result=subprocess.run(['node','--check',str(path)],capture_output=True,text=True)
        if result.returncode: errors.append(f'{path.relative_to(ROOT)} syntax: {result.stderr.strip()}')
    print(json.dumps({'release':'3.0.0','lessons':len(catalog['lessons']),'totals':totals,'questionIds':len(ids),'uniquePrompts':len(prompts),'errors':errors},indent=2))
    return 1 if errors else 0

if __name__=='__main__': raise SystemExit(main())
