#!/usr/bin/env python3
"""Verify public deployed Unit 1 build hooks and exact adapter bytes; no sign-in."""
import argparse
import hashlib
import json
from pathlib import Path
import time
from urllib.request import Request, urlopen
from inject_precalc_unit1_classroom import PATHS, MARKER

def verify(base, expected_sha, root):
    def fetch(path):
        url=f'{base.rstrip("/")}/{path}?classroomRelease={expected_sha}'
        with urlopen(Request(url,headers={'Cache-Control':'no-cache','User-Agent':'ECHS-release-verifier'}),timeout=25) as response:
            return response.read()
    identity=json.loads(fetch('deployment.json'))
    if identity.get('sha')!=expected_sha:
        raise ValueError('Expected Pages deployment is not live yet')
    for path in PATHS:
        text=fetch(path).decode('utf-8')
        if text.count(MARKER)!=1 or 'classroom/precalc-unit1/entry.js?v=20260930-classroom1' not in text:
            raise ValueError(f'Missing or duplicate classroom hook: {path}')
        if 'id="echsLessonGateStyle"' not in text or 'lesson-access-guard.js' not in text or 'content="ap-precalculus"' not in text:
            raise ValueError(f'Missing existing authenticated guard: {path}')
    files=sorted((root/'lessons/shared/classroom/precalc-unit1').glob('*'))
    assets=[]
    for file in files:
        if file.suffix not in ['.js','.mjs','.css']:continue
        path=file.relative_to(root).as_posix();live=fetch(path)
        if hashlib.sha256(live).digest()!=hashlib.sha256(file.read_bytes()).digest():
            raise ValueError(f'Deployed adapter differs from expected commit: {path}')
        assets.append(path)
    index=fetch('lessons/ap-precalculus/unit-1/index.html').decode('utf-8')
    if 'Fourteen interactive HTML slide lessons' not in index:raise ValueError('Unit index has not updated')
    return {'sha':expected_sha,'lessons':len(PATHS),'verifiedAssets':len(assets),'base':base,'status':'passed','authentication':'Existing guards verified; no production account session tested'}

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--base',default='https://2ed944-cloud.github.io/ECHS-Math/')
    parser.add_argument('--expected-sha',required=True)
    parser.add_argument('--root',type=Path,default=Path('.'))
    parser.add_argument('--report',type=Path)
    args=parser.parse_args();last=None
    for attempt in range(20):
        try:
            result=verify(args.base,args.expected_sha,args.root.resolve())
            if args.report:args.report.parent.mkdir(parents=True,exist_ok=True);args.report.write_text(json.dumps(result,indent=2)+'\n')
            print(json.dumps(result));break
        except Exception as error:
            last=error
            if attempt==19:raise SystemExit(str(last))
            print(f'Waiting for expected Unit 1 release ({attempt+1}/20): {error}',flush=True);time.sleep(5)
