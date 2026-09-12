"""Additive closed source graph over the exact accepted browser prerequisite."""
import argparse,hashlib,importlib.util,json,os
from pathlib import Path

HERE=Path(__file__).resolve().parent
PREFIX='tools/private-learning-current-session-journal-http/'
BASELINE_PREFIX='tools/private-learning-browser-journal-http/'
WORKFLOW='.github/workflows/private-learning-current-session-journal-http.yml'
BASELINE_SHA='d92528f084050bb36254fc5b495cc6792a15821d02601ec98c2a17f072c3f0b8'
SELECTED_SHA='f9c3436ad28a6a2b86c51ebfa0d87e0bfdbda76119dc7fa4301880d806d59340'
FROZEN_BRIDGE_SHA='660bb66c7a37cab21972dc540a32fd2df788f9756333852bb10b848bf95eef76'
NAMES=('session-fixture.mjs','session-https-bridge.mjs','session-controls.py','session-control-client.mjs',
 'test_current_session_http.mjs','current-session-browser-page.mjs','current-session-cases.mjs','selected-source.json',
 'session-run.py','session_contract.py','session_assemble.py','session_report_review.py','report-contract.json','report-shape.json','README.md')

def need(value,code):
 if not value:raise ValueError(code)

def digest(raw):return hashlib.sha256(raw).hexdigest()

def file_path(path):return Path('\\\\?\\'+os.path.abspath(path)) if os.name=='nt' and not str(path).startswith('\\\\?\\') else path

def baseline_module():
 base=HERE.parent/'private-learning-browser-journal-http'
 raw=file_path(base/'source-manifest.json').read_bytes();need(digest(raw)==BASELINE_SHA,'accepted-browser-manifest')
 manifest=json.loads(raw);name=BASELINE_PREFIX+'contract.py';rows=[row for row in manifest['files'] if row['path']==name];need(len(rows)==1,'accepted-contract-row')
 actual=file_path(base/'contract.py').read_bytes();need(len(actual)==rows[0]['bytes'] and digest(actual)==rows[0]['sha256'],'accepted-contract-source')
 spec=importlib.util.spec_from_file_location('accepted_current_session_prerequisite',base/'contract.py');module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module);return module

def sources(repo,published=False):
 repo=Path(os.path.abspath(repo));baseline=baseline_module();retained=baseline.sources(repo,published)
 need(retained['manifest_sha256']==BASELINE_SHA,'accepted-source-pin')
 selected_raw=baseline.guarded_path(HERE/'selected-source.json',HERE).read_bytes();need(digest(selected_raw)==SELECTED_SHA,'selected-source-pin')
 selected=json.loads(selected_raw);need(selected['contract']=='echs.c04.current-session-http-selected-source.v1' and selected['predecessor_manifest_sha256']==FROZEN_BRIDGE_SHA,'selected-source-boundary')
 need(len(selected['files'])==13 and sum(row['served'] is True for row in selected['files'])==12,'selected-source-count')
 for row in selected['files']:
  need(type(row) is dict and set(row)=={'path','bytes','sha256','served'} and type(row['served']) is bool,'selected-row-shape')
  name=baseline.safe_relative(row['path']);need(name.startswith('selected/'),'selected-root')
  current=baseline.info(HERE/name,name,HERE);need({key:current[key] for key in ('path','bytes','sha256')}=={key:row[key] for key in ('path','bytes','sha256')},'selected-byte-identity')
 raw=baseline.guarded_path(HERE/'source-manifest.json',HERE).read_bytes();manifest=json.loads(raw)
 need(type(manifest) is dict and set(manifest)=={'contract','files'} and manifest['contract']=='echs.c04.current-session-journal-http-sources.v1','source-manifest-shape')
 expected={PREFIX+name for name in NAMES}|{PREFIX+row['path'] for row in selected['files']}|{WORKFLOW}
 rows=manifest['files'];need(type(rows) is list and len(rows)==len(expected) and {row['path'] for row in rows}==expected,'additive-exact-closure')
 base=repo if published else HERE.parents[1];baseline.check_rows(base,rows,len(expected))
 inner=baseline.info(baseline.HERE/'source-manifest.json',BASELINE_PREFIX+'source-manifest.json',baseline.HERE)
 inputs=sorted([*retained['source_files'],inner,*retained['inputs']],key=lambda row:row['path'])
 need(len(inputs)==199 and len({row['path'] for row in inputs})==199,'predecessor-exact-closure')
 return {'manifest_sha256':digest(raw),'source_files':rows,'inputs':inputs}

if __name__=='__main__':
 parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--repo',type=Path,required=True);parser.add_argument('--published',action='store_true');args=parser.parse_args()
 result=sources(args.repo,args.published);print(json.dumps({'status':'SOURCE PREFLIGHT PASS; NO EXECUTION','source_files':len(result['source_files']),'inputs':len(result['inputs']),'manifest_sha256':result['manifest_sha256']}))
