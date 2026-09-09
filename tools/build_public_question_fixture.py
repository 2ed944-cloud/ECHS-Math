"""Build a bounded, projected UI fixture. Never serve raw source as a fallback."""
from pathlib import Path
import argparse
import json
import shutil
from project_public_question_bank import project, validate_projection
from inject_learning_access_guard import inject_learning_page, page_roles

ROOT=Path(__file__).resolve().parents[1]
def build(target):
    target=Path(target).resolve()
    if target==ROOT or ROOT.is_relative_to(target) or target.exists():
        raise ValueError('Fixture requires a new separate directory')
    target.mkdir(parents=True)
    official='question-bank/official'
    for name in ['data','admin/data','media']:(target/official/name).mkdir(parents=True)
    files=['sw.js','offline.html','login.html','js/institution-client.js','js/login.js','js/portal-access.js','css/learning-access.css','css/platform-usability.css']
    files += [f'{official}/{name}.html' for name in ['index','archive','practice','teacher','import']]
    files += [f'{official}/admin/{name}.html' for name in ['teacher','import']]
    files += [f'{official}/js/{name}.js' for name in ['app','archive','practice','teacher','import']]
    files += [f'{official}/css/app.css']
    for name in files:
        destination=target/name; destination.parent.mkdir(parents=True,exist_ok=True)
        shutil.copyfile(ROOT/name,destination)
    report=project(ROOT,target)
    guarded=[]
    for page in (target/official).rglob('*.html'):
        roles=page_roles(page)
        if roles and inject_learning_page(target,page,roles):guarded.append(page.relative_to(target).as_posix())
    assert not validate_projection(ROOT,target)
    return dict(report,guarded_pages=guarded,fixture_scope='Official public projection and selected unchanged UI/auth modules. Synthetic transport only; no production accounts. Not a complete Pages artifact.')

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('target',type=Path)
    args=parser.parse_args()
    print(json.dumps(build(args.target),indent=2))
