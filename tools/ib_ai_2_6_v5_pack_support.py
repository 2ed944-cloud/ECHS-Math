from __future__ import annotations
import base64,gzip,hashlib,json,subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
UNIT=ROOT/'lessons'/'ib-math-ai'/'unit-2';DATA=UNIT/'data'
HTML=UNIT/'lessons'/'IB_AI_SL_2.6_regression_technology_validation_ECHS.html'
MANIFEST=DATA/'lesson-2.6-v5-pack-manifest.json';LOADER=DATA/'lesson-2.6-v5-loader.js'
def archive():
 m=json.loads(MANIFEST.read_text());parts=[]
 for i in range(m['chunkCount']):
  text=(DATA/f'lesson-2.6-v5-pack-{i:02d}.js').read_text();parts.append(text.split("='",1)[1].rsplit("';",1)[0])
 compressed=base64.b64decode(''.join(parts),validate=True)
 assert len(compressed)==m['compressedBytes'] and hashlib.sha256(compressed).hexdigest()==m['compressedSha256']
 raw=gzip.decompress(compressed)
 assert len(raw)==m['uncompressedBytes'] and hashlib.sha256(raw).hexdigest()==m['payloadSha256']
 return m,json.loads(raw)
def sources(payload):return{x['path']:x['source'] for group in('styles','beforeEngine','afterEngine') for x in payload[group]}
def node(code):return subprocess.run(['node'],input=code,text=True,capture_output=True,check=True,cwd=ROOT).stdout.strip()
def regression(xs,ys):
 n=len(xs);mx=sum(xs)/n;my=sum(ys)/n;sxx=sum((x-mx)**2 for x in xs);syy=sum((y-my)**2 for y in ys);sxy=sum((x-mx)*(y-my) for x,y in zip(xs,ys));a=sxy/sxx;b=my-a*mx
 return a,b,sxy*sxy/(sxx*syy),[y-(a*x+b) for x,y in zip(xs,ys)]

def browser_boot():
 paths=[str(DATA/f'lesson-2.6-v5-pack-{i:02d}.js') for i in range(11)]
 code=f"""
const fs=require('fs');global.window=global;global.location={{href:'https://example.test/lessons/lesson.html'}};
let resolveDone;const done=new Promise(r=>resolveDone=r);global.dispatchEvent=e=>{{if(e.type==='echs:ib-ai:2.6:v5-ready')resolveDone(e.detail)}};
global.CustomEvent=function(type,init){{this.type=type;this.detail=init.detail}};global.MutationObserver=function(){{}};
const app={{innerHTML:''}};global.document={{currentScript:{{src:'https://example.test/data/lesson-2.6-v5-loader.js'}},readyState:'loading',body:{{dataset:{{}}}},head:{{appendChild(n){{if(n.src)queueMicrotask(()=>n.onload&&n.onload());}}}},createElement(tag){{return tag==='style'?{{dataset:{{}},textContent:''}}:{{src:'',async:false,onload:null,onerror:null}};}},addEventListener(){{}},querySelector(){{return null}},querySelectorAll(){{return[]}},getElementById(id){{return id==='app'?app:null}}}};
(0,eval)(fs.readFileSync({json.dumps(str(DATA/'lesson-2.6.js'))},'utf8'));for(const p of {json.dumps(paths)})(0,eval)(fs.readFileSync(p,'utf8'));(0,eval)(fs.readFileSync({json.dumps(str(LOADER))},'utf8'));
Promise.race([done,new Promise((_,j)=>setTimeout(()=>j(new Error('timeout')),3000))]).then(x=>console.log(JSON.stringify(x))).catch(e=>{{console.error(e);process.exit(1)}});
"""
 return json.loads(node(code))
