#!/usr/bin/env python3
from __future__ import annotations
import json, subprocess, sys
from pathlib import Path

ROOT=Path(__file__).resolve().parent
subprocess.run([sys.executable,str(ROOT/'build_canonical.py')],check=True)
DATA=json.loads((ROOT/'canonical-preview.json').read_text(encoding='utf-8'))
QUESTIONS=DATA.get('questions',[])
errors=[]; warnings=[]
required={'id','course','courseId','type','classification','quality','source','prompt','parts'}
ids=[]
for q in QUESTIONS:
    qid=q.get('id','?'); ids.append(qid)
    missing=required-set(q)
    if missing: errors.append(f'{qid}: missing {sorted(missing)}')
    if q.get('type')!='frq': errors.append(f'{qid}: expected frq type')
    if len(q.get('parts') or [])!=1: errors.append(f'{qid}: expected exactly one part')
    if not q.get('source',{}).get('sourcePages'): errors.append(f'{qid}: missing source page')
    qual=q.get('quality',{})
    if not qual.get('transcriptionVerified'): errors.append(f'{qid}: transcription not verified')
    if not qual.get('answerVerified'): errors.append(f'{qid}: answer not verified')
    if not qual.get('mathematicalVerificationPassed'): errors.append(f'{qid}: math verification not passed')
    if qual.get('studentReadyGatePassed'): errors.append(f'{qid}: import candidate must not pass student gate')
    for field in ('prompt','workedSolution','explanation','noncalculatorSolution'):
        text=str(q.get(field,''))
        if text.count('\\(')!=text.count('\\)'): errors.append(f'{qid}: unmatched inline math in {field}')
        if text.count('\\[')!=text.count('\\]'): errors.append(f'{qid}: unmatched display math in {field}')
    for part in q.get('parts',[]):
        for field in ('prompt','answer'):
            text=str(part.get(field,''))
            if text.count('\\(')!=text.count('\\)'): errors.append(f'{qid}: unmatched inline math in part {field}')
        if not part.get('rubric'): errors.append(f'{qid}: missing part rubric')
if len(ids)!=len(set(ids)): errors.append('duplicate IDs in batch')
if len(QUESTIONS)!=10: errors.append(f'expected 10 questions, found {len(QUESTIONS)}')
result={'questionCount':len(QUESTIONS),'errors':errors,'warnings':warnings,'result':'PASS' if not errors else 'FAIL'}
print(json.dumps(result,indent=2))
sys.exit(1 if errors else 0)
