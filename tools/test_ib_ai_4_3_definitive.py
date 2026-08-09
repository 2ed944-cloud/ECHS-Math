#!/usr/bin/env python3
"""Release gate for the definitive IB AI SL Lesson 4.3 source pack."""
from __future__ import annotations
import base64, gzip, hashlib, json, math, re, subprocess
from pathlib import Path

HERE=Path(__file__).resolve(); ROOT=HERE.parents[1] if HERE.parent.name=='tools' else HERE.parent
UNIT=ROOT/'lessons/ib-math-ai/unit-4'; DATA=UNIT/'data'
HTML=UNIT/'lessons/IB_AI_SL_4.3_frequency_grouped_cumulative_data_ECHS.html'
LOADER=DATA/'lesson-4.3-v3-loader.js'; VERSION='3.0.0'; FORMAT='echs-ib-ai-4.3-v3-source-pack'

def run_node(args,input=None):
    return subprocess.run(['node',*args],input=input,text=True,capture_output=True,check=True).stdout

def main():
    packs=sorted(DATA.glob('lesson-4.3-v3-pack-*.js'))
    assert HTML.is_file() and LOADER.is_file() and len(packs)==16
    pat=re.compile(r"PACK_CHUNKS\[(\d+)\]='([A-Za-z0-9+/=]+)';")
    chunks={int(m.group(1)):m.group(2) for p in packs if (m:=pat.search(p.read_text()))}
    assert sorted(chunks)==list(range(16))
    compressed=base64.b64decode(''.join(chunks[i] for i in range(16)),validate=True)
    raw=gzip.decompress(compressed); pack=json.loads(raw)
    assert (pack['format'],pack['version'],pack['lesson'])==(FORMAT,VERSION,'4.3')
    assert pack['counts']=={'slides':60,'practice':80,'examTasks':3,'examMarks':49,'quiz':10}
    assert (len(pack['styles']),len(pack['beforeEngine']),len(pack['afterEngine']))==(1,6,2)

    loader=LOADER.read_text(); run_node(['--check',str(LOADER)])
    for needle in (f"chunks:{len(packs)}",hashlib.sha256(compressed).hexdigest(),hashlib.sha256(raw).hexdigest(),FORMAT,VERSION,"DecompressionStream('gzip')","crypto.subtle.digest('SHA-256'"):
        assert needle in loader,needle
    for module in [*pack['beforeEngine'],*pack['afterEngine']]:
        assert module['path'].startswith('data/') and module['source'].strip()
        run_node(['--check','-'],module['source'])

    node="""const vm=require('vm'),fs=require('fs'),s=JSON.parse(fs.readFileSync(0,'utf8')),c={window:{},console};vm.createContext(c);s.forEach(x=>vm.runInContext(x,c));process.stdout.write(JSON.stringify(c.window.LESSON_DATA));"""
    lesson=json.loads(run_node(['-e',node],json.dumps([m['source'] for m in pack['beforeEngine']])))
    assert (lesson['schemaVersion'],lesson['version'],lesson['lesson']['number'])==('4.3.0',VERSION,'4.3')
    assert [len(lesson[k]) for k in ('slides','practice','exam','quiz')]==[60,80,3,10]
    for key in ('slides','practice','quiz'):
        ids=[x['id'] for x in lesson[key]]; assert len(ids)==len(set(ids))
    assert not {q['id'] for q in lesson['practice']} & {q['id'] for q in lesson['quiz']}

    levels={x:0 for x in ('Foundation','Application','Reasoning','Challenge','HOT')}
    for q in lesson['practice']:
        levels[q['level']]+=1; assert q['marks']>0 and q['prompt'].strip() and q['answer'].strip() and q['solution'].strip()
        assert q['calculator'] in {'No calculator','Calculator appropriate'} and q['type'] in {'mcq','numeric','short'}
        if q['type']=='mcq': assert len(q['choices'])==len(set(q['choices']))==4 and 0<=q['correct_index']<4
        if q['type']=='numeric': assert math.isfinite(float(q['numeric_answer'])) and float(q['tolerance'])>0
    assert levels=={'Foundation':20,'Application':20,'Reasoning':16,'Challenge':12,'HOT':12}
    assert sum(t['total_marks'] for t in lesson['exam'])==49
    assert all(t['total_marks']==sum(p['marks'] for p in t['parts']) for t in lesson['exam'])

    lookup={q['id']:q for q in lesson['practice']+lesson['quiz']}
    expected={'IBAI-4.3-P26':11.377060252982753,'IBAI-4.3-P27':11.521996799878494,'IBAI-4.3-P57':9.63716763369819,'IBAI-4.3-P64':10.555555555555555,'IBAI-4.3-P65':11.875,'IBAI-4.3-P75':8/3,'IBAI-4.3-Q10':32.5}
    assert all(math.isclose(float(lookup[k]['numeric_answer']),v,abs_tol=1e-9) for k,v in expected.items())

    html=HTML.read_text()
    assert all(f'lesson-4.3-v3-pack-{i:02d}.js?v={VERSION}' in html for i in range(16))
    assert f'lesson-4.3-v3-loader.js?v={VERSION}' in html and 'unit-1-ti84-simulator-v7.css?v=7.1.2' in html
    assert html.index('pack-00.js')<html.index('v3-loader.js') and 'lesson-4.3-content-a.js' not in html
    corpus=json.dumps(lesson,ensure_ascii=False).lower()
    for phrase in ('frequency density','class boundary','linear interpolation','population standard deviation','sample standard deviation','cumsum','1-var stats','rectangle area equals frequency','uniform distribution within'):
        assert phrase in corpus,phrase
    all_text='\n'.join([html,loader,*[m['source'] for m in pack['styles']+pack['beforeEngine']+pack['afterEngine']]])
    assert 'TODO' not in all_text and 'undefined' not in all_text and not re.search(r'[\x00-\x08\x0b\x0c\x0e-\x1f]',all_text)
    print('Lesson 4.3 definitive release gate passed: 16 verified chunks, 60 screens, 80 practice questions, 3 IB tasks (49 marks), 10 quiz questions, TI-84 and grouped-statistics evidence validated.')

if __name__=='__main__': main()
