#!/usr/bin/env python3
"""Validate generated ECHS private Blackboard packages without publishing source content."""
from __future__ import annotations
import argparse, collections, hashlib, io, json, re, sys, zipfile
from pathlib import Path

PRIVATE_URI_RE = re.compile(r'^private-bank://(?P<slug>[a-z0-9-]+)/chapter_(?P<chapter>\d{2})/(?P<path>.+)$')
ALLOWED_TYPES = {'mcq','true_false','fill_blank','essay'}
ALLOWED_TRUST = {'teacher_review_required','indexed_only','rights_restricted'}


def main() -> int:
    parser=argparse.ArgumentParser()
    parser.add_argument('packages',nargs='*',type=Path)
    parser.add_argument('--root',type=Path)
    parser.add_argument('--registry',type=Path,default=Path('question-bank/private-sources/data/private-bank-registry.json'))
    parser.add_argument('--output-dir',type=Path,default=Path('.'))
    args=parser.parse_args()
    packages=list(args.packages)
    if args.root: packages.extend(sorted(args.root.glob('*-private-import.zip')))
    packages=sorted({path.resolve() for path in packages})
    if not packages: raise SystemExit('No private import packages were supplied')
    registry=json.loads(args.registry.read_text(encoding='utf-8')) if args.registry.is_file() else {}
    registry_by_code={row.get('bank_code'):row for row in registry.get('banks') or []}
    report={'schema_version':'1.0.0','status':'PASS','packages':[],'totals':{},'errors':[],'warnings':[]}
    all_ids=set();totals=collections.Counter()
    def error(message,bank=None,question=None):
        item={'message':message}
        if bank:item['bank']=bank
        if question:item['question_id']=question
        report['errors'].append(item)
    def warning(message,bank=None,question=None):
        item={'message':message}
        if bank:item['bank']=bank
        if question:item['question_id']=question
        report['warnings'].append(item)

    for package_path in packages:
        package_bytes=package_path.read_bytes();package_hash=hashlib.sha256(package_bytes).hexdigest()
        with zipfile.ZipFile(io.BytesIO(package_bytes)) as outer:
            bad=outer.testzip()
            if bad:error(f'Outer ZIP CRC failure: {bad}',package_path.name)
            names=outer.namelist();roots={name.split('/',1)[0] for name in names if '/' in name}
            if len(roots)!=1:error(f'Package must have exactly one root directory, found {sorted(roots)}',package_path.name);continue
            slug=next(iter(roots));manifest_name=f'{slug}/bank-manifest.json'
            if manifest_name not in names:error('Missing bank-manifest.json',slug);continue
            manifest=json.loads(outer.read(manifest_name));bank_code=manifest.get('bank_code') or slug;registry_row=registry_by_code.get(bank_code) or {}
            if registry_row and registry_row.get('package_sha256')!=package_hash:error('Package SHA-256 does not match registry',bank_code)
            info={'file':package_path.name,'sha256':package_hash,'size_bytes':len(package_bytes),'bank_code':bank_code,'bank_slug':slug,'display_aliases':manifest.get('display_aliases') or {},'manifest_questions':manifest.get('questions'),'manifest_pools':manifest.get('pools'),'question_types':{},'questions_counted':0,'unique_ids':0,'media_references':0,'media_files':0,'mapping_counts':{},'fallback_counts':{},'essay_without_solution':0,'errors':0,'warnings':0}
            start_errors=len(report['errors']);start_warnings=len(report['warnings']);media_inventory={}
            for rel in manifest.get('media_packages') or []:
                inner_name=f'{slug}/{rel}'
                if inner_name not in names:error(f'Missing media package {rel}',bank_code);continue
                chapter_match=re.search(r'chapter_(\d{2})\.zip$',rel);chapter=chapter_match.group(1) if chapter_match else None
                try:
                    with zipfile.ZipFile(io.BytesIO(outer.read(inner_name))) as media_zip:
                        bad_media=media_zip.testzip()
                        if bad_media:error(f'Media ZIP {rel} CRC failure: {bad_media}',bank_code)
                        files={name.lstrip('/') for name in media_zip.namelist() if not name.endswith('/')}
                        if chapter:media_inventory[chapter]=files
                        info['media_files']+=len(files)
                except Exception as exc:error(f'Cannot read media package {rel}: {exc}',bank_code)
            ids=[];types=collections.Counter();mapping_counts=collections.Counter();fallbacks=collections.Counter();pool_uids=set()
            for chunk in manifest.get('chunks') or []:
                rel=chunk.get('file','');inner_name=f'{slug}/{rel}'
                if inner_name not in names:error(f'Missing question chunk {rel}',bank_code);continue
                try:payload=json.loads(outer.read(inner_name))
                except Exception as exc:error(f'Invalid JSON in {rel}: {exc}',bank_code);continue
                questions=payload.get('questions') or []
                if chunk.get('questions') is not None and len(questions)!=chunk.get('questions'):error(f'Chunk {rel} count mismatch',bank_code)
                for question in questions:
                    qid=str(question.get('id') or '')
                    if not qid:error('Question missing ID',bank_code);continue
                    if qid in all_ids:error('Duplicate question ID across packages',bank_code,qid)
                    all_ids.add(qid);ids.append(qid);pool_uids.add(str(question.get('pool_uid') or ''))
                    qtype=question.get('type');types[qtype]+=1
                    if qtype not in ALLOWED_TYPES:error(f'Unsupported type {qtype}',bank_code,qid)
                    if not (question.get('prompt_text') or question.get('prompt_html')):error('Missing prompt',bank_code,qid)
                    choices=question.get('choices') or [];correct=question.get('correct_choice_ids') or [];choice_ids={str(choice.get('id')) for choice in choices}
                    if qtype in {'mcq','true_false'}:
                        if len(choices)<2:error('Selected-response item has fewer than two choices',bank_code,qid)
                        if not correct:error('Selected-response item has no correct answer',bank_code,qid)
                        if not set(map(str,correct)).issubset(choice_ids):error('Correct answer references missing choice',bank_code,qid)
                    if qtype=='fill_blank' and not (question.get('accepted_answers') or []):error('Fill-blank item has no accepted answer',bank_code,qid)
                    if qtype=='essay' and not (question.get('solution_text') or question.get('solution_html')):info['essay_without_solution']+=1;warning('Essay item has no publisher solution and remains review-blocked',bank_code,qid)
                    rights=question.get('rights') or {};trust=question.get('trust') or {};metadata=question.get('metadata') or {}
                    if rights.get('student_publication_allowed') is not False:error('Restricted question permits student publication',bank_code,qid)
                    if trust.get('student_visible') is not False or trust.get('tier') not in ALLOWED_TRUST:error('Unsafe student visibility or trust tier',bank_code,qid)
                    if trust.get('mathematical_verified') is not False or trust.get('mapping_verified') is not False:error('Imported question is incorrectly marked verified',bank_code,qid)
                    if metadata.get('student_accessible') is not False or metadata.get('student_ready') is not False:error('Metadata exposes imported question',bank_code,qid)
                    course_maps=question.get('course_mappings') or []
                    for course in ('ap-precalculus','ib-math-ai'):
                        if not any(row.get('course')==course for row in course_maps):error(f'Missing {course} mapping or readiness fallback',bank_code,qid)
                    for mapping in course_maps:
                        course=str(mapping.get('course'));unit=mapping.get('unit');mapping_counts[(course,str(unit))]+=1
                        if unit==0:fallbacks[course]+=1
                        if course=='ap-precalculus' and unit not in {0,1,2,3,4}:error(f'Invalid AP Precalculus unit {unit}',bank_code,qid)
                        if course=='ib-math-ai' and unit not in {0,1,2,3,4,5}:error(f'Invalid IB unit {unit}',bank_code,qid)
                        if mapping.get('confidence')=='readiness-fallback' and unit!=0:error('Readiness fallback must use Unit 0',bank_code,qid)
                    for image in question.get('images') or []:
                        info['media_references']+=1;source_path=str(image.get('source_path') or '').lstrip('/');private_path=str(image.get('private_path') or '')
                        chapter_match=re.search(r'/chapter_(\d{2})/',private_path);chapter=chapter_match.group(1) if chapter_match else f"{int((question.get('source') or {}).get('chapter') or 0):02d}"
                        if source_path and source_path not in media_inventory.get(chapter,set()):error(f'Media missing from chapter_{chapter}.zip: {source_path}',bank_code,qid)
                        expected=f'{slug}/chapter_{chapter}/{source_path}'
                        if private_path and private_path!=expected:error(f'Private media path mismatch: {private_path} != {expected}',bank_code,qid)
                        uri=f'private-bank://{slug}/chapter_{chapter}/{source_path}'
                        html_blob=(question.get('prompt_html') or '')+' '.join(str(choice.get('html') or '') for choice in choices)+(question.get('solution_html') or '')+' '.join(str(value or '') for value in (question.get('feedback_html') or {}).values())
                        if source_path and uri not in html_blob:warning(f'Media reference absent from rendered HTML: {source_path}',bank_code,qid)
            info['questions_counted']=len(ids);info['unique_ids']=len(set(ids));info['question_types']=dict(types);info['mapping_counts']={f'{course}:U{unit}':count for (course,unit),count in sorted(mapping_counts.items())};info['fallback_counts']=dict(fallbacks)
            if manifest.get('questions')!=len(ids):error(f'Manifest question count {manifest.get("questions")} != {len(ids)}',bank_code)
            if manifest.get('pools')!=len(pool_uids):error(f'Manifest pool count {manifest.get("pools")} != {len(pool_uids)}',bank_code)
            if dict(manifest.get('question_types') or {})!=dict(types):error('Manifest question type counts do not match chunks',bank_code)
            info['errors']=len(report['errors'])-start_errors;info['warnings']=len(report['warnings'])-start_warnings;report['packages'].append(info)
            totals['packages']+=1;totals['questions']+=len(ids);totals['pools']+=len(pool_uids);totals['media_references']+=info['media_references'];totals['media_files']+=info['media_files'];totals['essay_without_solution']+=info['essay_without_solution']
            for item_type,count in types.items():totals[f'type:{item_type}']+=count
    expected=registry.get('totals') or {}
    if expected.get('banks') is not None and totals['packages']!=expected.get('banks'):error(f'Expected {expected.get("banks")} packages, found {totals["packages"]}')
    if expected.get('questions') is not None and totals['questions']!=expected.get('questions'):error(f'Expected {expected.get("questions")} questions, found {totals["questions"]}')
    report['status']='FAIL' if report['errors'] else 'PASS';report['totals']={'packages':totals['packages'],'questions':totals['questions'],'pools':totals['pools'],'question_types':{key.split(':',1)[1]:value for key,value in totals.items() if key.startswith('type:')},'media_references':totals['media_references'],'media_files':totals['media_files'],'essay_without_solution':totals['essay_without_solution'],'unique_question_ids':len(all_ids),'errors':len(report['errors']),'warnings':len(report['warnings'])}
    args.output_dir.mkdir(parents=True,exist_ok=True);json_path=args.output_dir/'PRIVATE_BANK_VALIDATION.json';md_path=args.output_dir/'PRIVATE_BANK_VALIDATION.md';json_path.write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
    lines=['# ECHS Private Blackboard Bank Validation','',f'**Result: {report["status"]}**','','## Combined inventory','','| Measure | Result |','| --- | ---: |',f'| Private bank packages | {report["totals"]["packages"]:,} |',f'| Questions | {report["totals"]["questions"]:,} |',f'| Source pools | {report["totals"]["pools"]:,} |',f'| Unique stable IDs | {report["totals"]["unique_question_ids"]:,} |',f'| Media references | {report["totals"]["media_references"]:,} |',f'| Media files packaged | {report["totals"]["media_files"]:,} |',f'| Errors | {report["totals"]["errors"]:,} |',f'| Warnings | {report["totals"]["warnings"]:,} |','','## Access and trust boundary','','- Every imported record is private teacher/archive content.','- No imported record is student-visible or student-ready.','- Publisher answer keys are source evidence, not independent mathematical verification.','- Readiness fallback records remain in Unit 0 instead of being forced into a lesson.','- Publisher names remain internal; student-facing aliases are neutral ECHS bank names.','']
    md_path.write_text('\n'.join(lines),encoding='utf-8');print(json.dumps({'status':report['status'],'totals':report['totals'],'json':str(json_path),'markdown':str(md_path)},indent=2));return 1 if report['errors'] else 0


if __name__=='__main__':raise SystemExit(main())
