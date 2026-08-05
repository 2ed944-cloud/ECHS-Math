#!/usr/bin/env python3
"""Organization-only regression checks for IB AI SL Lesson 1.4 teaching blocks."""
from __future__ import annotations

import json
import subprocess
import sys
from collections import Counter
from pathlib import Path

ROOT=Path(sys.argv[1] if len(sys.argv)>1 else '.').resolve()
U1=Path('lessons/ib-math-ai/unit-1')
HTML=U1/'lessons/IB_AI_SL_1.4_financial_models_ECHS.html'
ENGINE=U1/'assets/js/engine.js'
OVERLAY=U1/'data/lesson-1.4-teaching-blocks-v6-1.js'
BASE_FILES=[
 U1/'data/lesson-1.4.js',
 U1/'data/lesson-1.4-v3.js',
 U1/'data/unit-1-v5-content-data.js',
 U1/'data/unit-1-v5-apply.js',
 U1/'data/lesson-1.4-financial-v6-foundations.js',
 U1/'data/lesson-1.4-financial-v6-cashflows.js',
 U1/'data/lesson-1.4-financial-v6-practice.js',
 U1/'data/lesson-1.4-financial-v6-assessment.js',
 U1/'data/lesson-1.4-financial-v6-polish.js',
]
errors=[]

def read(path:Path)->str:
    target=ROOT/path
    if not target.is_file():
        errors.append(f'Missing file: {path}')
        return ''
    return target.read_text(encoding='utf-8',errors='replace')

def assemble(files:list[Path])->dict:
    program=f"""
const fs=require('fs'),vm=require('vm');
const files={json.dumps([str(path) for path in files])};
const sandbox={{window:{{}},console}};sandbox.window.window=sandbox.window;vm.createContext(sandbox);
for(const file of files)vm.runInContext(fs.readFileSync(file,'utf8'),sandbox,{{filename:file}});
const d=sandbox.window.LESSON_DATA;if(!d)throw new Error('LESSON_DATA missing');
process.stdout.write(JSON.stringify({{
 version:d.version,
 slides:d.slides.map(s=>({{
   title:s.title,html:s.html,kind:s.kind,section:s.section,eyebrow:s.eyebrow,
   originalSection:s.originalSection,originalEyebrow:s.originalEyebrow,
   teachingBlock:s.teachingBlock,teachingBlockTitle:s.teachingBlockTitle,
   estimatedClassroomTime:s.estimatedClassroomTime,learningFocus:s.learningFocus,
   classification:s.classification,classificationIcon:s.classificationIcon,
   blockBoundary:s.blockBoundary,originalLearnIndex:s.originalLearnIndex
 }})),
 practice:d.practice,quiz:d.quiz,exam:d.exam,review:d.review,
 lesson:d.lesson,teachingBlocks:d.teachingBlocks,audit:d.v6Audit,
 organizationSchemaVersion:d.organizationSchemaVersion,
 organizationBuildDate:d.organizationBuildDate
}}));
"""
    result=subprocess.run(['node','-e',program],cwd=ROOT,text=True,capture_output=True)
    if result.returncode:
        errors.append(f"Assembly failed for {files[-1]}: {result.stderr.strip()}")
        return {}
    try:return json.loads(result.stdout)
    except json.JSONDecodeError as exc:
        errors.append(f'Assembly returned invalid JSON: {exc}')
        return {}

html=read(HTML)
engine=read(ENGINE)
overlay=read(OVERLAY)
syntax=subprocess.run(['node','--check',str(ROOT/OVERLAY)],text=True,capture_output=True)
if syntax.returncode:errors.append(f'Overlay JavaScript syntax failure: {syntax.stderr.strip()}')

marker='lesson-1.4-teaching-blocks-v6-1.js?v=6.1.0'
if marker not in html:errors.append('Lesson wrapper does not load the teaching-block metadata layer')
if marker in html:
    if not (html.index('lesson-1.4-financial-v6-polish.js?v=6.0.0')<html.index(marker)<html.index('../assets/js/katex-global.js')<html.index('../assets/js/engine.js')):
        errors.append('Teaching-block metadata must load after content audit and before the lesson engine')
for route in ('data-route="learn"','data-route="practice"','data-route="exam"','data-route="quiz"','data-route="review"'):
    if route not in html:errors.append(f'Existing route missing after organization refactor: {route}')
for stable in ('IB_AI_SL_1.4_financial_models_ECHS.html','../assets/js/engine.js?v=3.0.0'):
    if stable not in (str(HTML) if stable.endswith('.html') else html):errors.append(f'Stable lesson contract missing: {stable}')

baseline=assemble(BASE_FILES)
final=assemble([*BASE_FILES,OVERLAY])
if baseline and final:
    if baseline.get('version')!='6.0.0' or final.get('version')!='6.0.0':
        errors.append('Mathematical/content release version must remain 6.0.0')
    before=baseline.get('slides',[]);after=final.get('slides',[])
    if len(before)!=100 or len(after)!=100:errors.append(f'Learn screen count changed: {len(before)} -> {len(after)}')
    if [s.get('title') for s in before]!=[s.get('title') for s in after]:
        errors.append('Existing Learn screen order or titles changed')
    for index,(old,new) in enumerate(zip(before,after)):
        for field in ('title','html','kind'):
            if old.get(field)!=new.get(field):errors.append(f'Existing {field} changed on slide {index+1}: {old.get("title")}')
        if new.get('originalSection')!=old.get('section'):
            errors.append(f'Original section was not preserved on slide {index+1}')
        if new.get('originalEyebrow')!=old.get('eyebrow'):
            errors.append(f'Original eyebrow was not preserved on slide {index+1}')
        if new.get('originalLearnIndex')!=index:
            errors.append(f'Original slide index was not preserved on slide {index+1}')
    for field in ('practice','quiz','exam','review'):
        if baseline.get(field)!=final.get(field):errors.append(f'{field} changed during Learn-route organization')

    expected_blocks=[
      ('1.4A','Percentage Change and Financial Growth','1.4 · Financial Applications'),
      ('1.4B','Compounding and Rate Conventions','Nominal annual rate is not the periodic rate'),
      ('1.4C','Depreciation, Inflation and Real Value','Reducing-balance depreciation is compound decay'),
      ('1.4D','Regular Deposits and Savings','Regular deposits accumulate as a geometric sum'),
      ('1.4E','Loans and Repayment','TVM variables encode a cash-flow equation'),
      ('1.4F','Financial Decision Making','Extra principal paid early reduces many future interest charges'),
      ('1.4G','Mastery and Mixed Financial Applications','Integrated IB-style financial decision'),
    ]
    blocks=final.get('lesson',{}).get('teaching_blocks',[])
    if [(b.get('code'),b.get('title')) for b in blocks]!=[(code,title) for code,title,_ in expected_blocks]:
        errors.append('Teaching-block metadata does not match the required 1.4A–1.4G sequence')
    if final.get('teachingBlocks')!=blocks:errors.append('Top-level and lesson teaching-block metadata disagree')
    if final.get('lesson',{}).get('organization_release')!='6.1.0':errors.append('Organization release metadata is missing')
    if final.get('organizationSchemaVersion')!='1.0.0':errors.append('Organization schema version is missing')
    if final.get('organizationBuildDate')!='2026-08-05':errors.append('Organization build date is missing')
    pacing=final.get('lesson',{}).get('pacing',{})
    if pacing.get('block_sequence')!=[item[0] for item in expected_blocks]:errors.append('Pacing block sequence is incorrect')
    if pacing.get('total_learn_screens')!=100:errors.append('Pacing metadata changed Learn screen total')
    for flag in ('practice_studio_unchanged','timed_quiz_unchanged','ib_tasks_unchanged','mastery_route_unchanged'):
        if pacing.get(flag) is not True:errors.append(f'Pacing preservation flag is not true: {flag}')

    block_sequence=[]
    boundary_count=0
    by_title={slide.get('title'):slide for slide in after}
    for code,title,start_title in expected_blocks:
        item=by_title.get(start_title)
        if not item:
            errors.append(f'Missing teaching-block boundary screen: {start_title}')
            continue
        if item.get('teachingBlock')!=code or item.get('teachingBlockTitle')!=title:
            errors.append(f'Boundary metadata mismatch for {code}')
        if item.get('blockBoundary') is not True:errors.append(f'{code} start screen is not marked as a boundary')
        boundary_count+=1 if item.get('blockBoundary') else 0
        eyebrow=str(item.get('eyebrow') or '')
        for required in ('Teaching Block',f'Lesson {code}','Estimated classroom time: 60–75 minutes','Learning focus:'):
            if required not in eyebrow:errors.append(f'{code} boundary annotation missing: {required}')
    if sum(1 for slide_item in after if slide_item.get('blockBoundary'))!=7:errors.append('Expected exactly seven teaching-block boundary annotations')

    allowed={'Core':'🟢','Practice':'🔵','Extension':'🟠','Revision':'🟣'}
    counts=Counter()
    previous=-1
    code_index={code:index for index,(code,_,_) in enumerate(expected_blocks)}
    for index,slide_item in enumerate(after):
        code=slide_item.get('teachingBlock');classification=slide_item.get('classification')
        if code not in code_index:errors.append(f'Invalid block code on slide {index+1}: {code!r}');continue
        if code_index[code]<previous:errors.append('Teaching blocks are not contiguous and ordered')
        previous=max(previous,code_index[code]);block_sequence.append(code)
        if classification not in allowed:errors.append(f'Invalid classification on slide {index+1}: {classification!r}')
        elif slide_item.get('classificationIcon')!=allowed[classification]:errors.append(f'Classification icon mismatch on slide {index+1}')
        counts[classification]+=1
        section=str(slide_item.get('section') or '')
        if f'Lesson {code}' not in section or f'{allowed.get(classification,"")} {classification}' not in section:
            errors.append(f'Lesson Map annotation incomplete on slide {index+1}')
        if str(slide_item.get('originalSection') or '') not in section:
            errors.append(f'Original section label not retained in annotation on slide {index+1}')
    for classification in allowed:
        if counts[classification]<1:errors.append(f'No screens classified as {classification}')

    required_extension_sections=('Payment timing','Mixed savings','Withdrawal annuities','Outstanding balance','Decision modelling','Extension')
    for section in required_extension_sections:
        matching=[slide_item for slide_item in after if slide_item.get('originalSection')==section]
        if not matching:errors.append(f'No existing screens found for required extension topic: {section}')
        elif any(slide_item.get('classification')!='Extension' for slide_item in matching):
            errors.append(f'Not every {section} screen is classified as Extension')
    for slide_item in after:
        title=str(slide_item.get('title') or '').lower()
        if ('sensitivity' in title or 'risk analysis' in title) and slide_item.get('classification')!='Extension':
            errors.append(f'Sensitivity/risk screen is not classified as Extension: {slide_item.get("title")}')

    audit=final.get('audit') or {}
    for flag in ('organizationOnlyRefactor','learnScreenCountPreserved','originalLearnOrderPreserved','existingSlideHtmlPreserved','existingSlideTitlesPreserved','practiceStudioPreserved','timedQuizPreserved','ibTasksPreserved','masteryRoutePreserved','legacyRoutesPreserved'):
        if audit.get(flag) is not True:errors.append(f'Organization audit flag is not true: {flag}')

if '${escapeHtml(slide.section)}' not in engine:
    errors.append('Lesson Map no longer displays slide section metadata')
if '((learnIndex + 1) / data.slides.length) * 100' not in engine or 'progressLabel.textContent = `${learnIndex + 1} / ${data.slides.length}`' not in engine:
    errors.append('Existing progress and slide-number logic is not intact')

print('IB AI SL Lesson 1.4 teaching-block organization validation')
print(f'Root: {ROOT}')
print(f'Errors: {len(errors)}')
for error in errors:print(f'  ERROR: {error}')
if errors:raise SystemExit(1)
print('Status: PASS')
