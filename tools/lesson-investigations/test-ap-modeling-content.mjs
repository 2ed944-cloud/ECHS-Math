/** Portable checks for original AP1.12–1.14 scenes.
 * Worked values use independent algebra/integer oracles. Model composition is
 * labeled separately from any browser, regression fitting or assessment proof.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {dirname,resolve} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const option=name=>{const i=process.argv.indexOf(name);return i<0?null:process.argv[i+1];};
const repo=resolve(option('--repo')||resolve(dirname(fileURLToPath(import.meta.url)),'../..'));
assert.ok(option('--baseline-root'),'Supply the exact three original lessons using --baseline-root.');
const baseline=resolve(option('--baseline-root')),sha=raw=>createHash('sha256').update(raw).digest('hex');
const {AP_MODELING_CONTENT:content}=await import(pathToFileURL(resolve(repo,'lessons/shared/investigations/ap-modeling-content.mjs')));
const {transformationModel}=await import(pathToFileURL(resolve(repo,'lessons/shared/investigations/ap-transform-model.mjs')));
const {modelSelection}=await import(pathToFileURL(resolve(repo,'lessons/shared/investigations/ap-model-selection-model.mjs')));
const {openBoxModel}=await import(pathToFileURL(resolve(repo,'lessons/shared/investigations/ap-model-construction-model.mjs')));
const metadata=JSON.parse(await readFile(resolve(dirname(fileURLToPath(import.meta.url)),'modeling-content-baseline-pins.json'),'utf8'));
const expectedPins=[
 ['lessons/ap-precalculus/unit-1/AP_Precalculus_1.12_Transformations_of_Functions_ECHS_Refined.html',1306992,'ac25a0e8da9597e519cc368699d3ef1a11c428a57ec9819881f028c698be0f73'],
 ['lessons/ap-precalculus/unit-1/AP_Precalculus_1.13_Function_Model_Selection_and_Assumption_Articulation_ECHS_Refined.html',1304474,'6c3a6768d4a72e5fe26750aa065b17f3e5147f3a30748863122bde67feb8f0ae'],
 ['lessons/ap-precalculus/unit-1/AP_Precalculus_1.14_Function_Model_Construction_and_Application_ECHS_Refined.html',1322000,'b5f8a7b64d72cb4982abc666f3ca77b49f9ceb8ea5210211caf7389eaf3f4d0e'],
];
const keys=['ap-function-transformations','ap-model-selection','ap-model-construction'];
const lessons=keys.map(k=>content[k]),scenes=lessons.flatMap(l=>l.scenes);
const scene=id=>{const s=scenes.find(s=>s.id===id);assert.ok(s,id);return s;};
const says=(id,...values)=>{const text=[...scene(id).text,...scene(id).prompts,...scene(id).worked].join('\n');for(const value of values)assert.ok(text.includes(value),`${id}: ${value}`);};
const near=(actual,expected)=>assert.ok(Number.isFinite(actual)&&Math.abs(actual-expected)<=2e-11*Math.max(1,Math.abs(expected)),`${actual} != ${expected}`);
function deepFrozen(value){if(value&&typeof value==='object'){assert.ok(Object.isFrozen(value));Object.values(value).forEach(deepFrozen);}}
const pinSnapshot=async()=>Promise.all(expectedPins.map(async([path])=>{const raw=await readFile(resolve(baseline,path));return {path,bytes:raw.length,sha256:sha(raw)};}));
const before=await pinSnapshot();
const rows=expectedPins.map(([path,bytes,sha256])=>({path,bytes,sha256}));
const expandedParent=u=>(u+0.5)**2-0.25;
const values=c=>Array.from({length:Math.round((c.max-c.min)/c.step)+1},(_,i)=>c.min+i*c.step);
const endpointsAndZero=c=>[...new Set([c.min,0,c.max].filter(v=>v>=c.min&&v<=c.max))];

test('01 exact three-topic roster and accepted source hashes are preserved',()=>{
 assert.deepEqual(Object.keys(content),keys);assert.deepEqual(metadata,{baseline_commit:'b6aca24dd2a45103a8f0d238ca40d122329f557b',status:'accepted-parent-source',files:rows});assert.deepEqual(before,rows);
 lessons.forEach((lesson,i)=>{assert.equal(lesson.topic,`1.${12+i}`);assert.equal(lesson.version,'echs.lesson-investigation.v1');assert.equal(lesson.course,'AP Precalculus');assert.deepEqual(lesson.pin,{kind:'reviewed-existing-lesson-before-addition',path:rows[i].path,sha256:rows[i].sha256});});
});
test('02 current curriculum objectives and skill tags map only the taught scope',()=>{
 const expected=[
  [['1.12.A'],['1.12.A.1','1.12.A.2','1.12.A.3','1.12.A.4','1.12.A.5','1.12.A.6'],['1.C','3.A']],
  [['1.13.A','1.13.B'],['1.13.A.1','1.13.A.2','1.13.A.5','1.13.A.6','1.13.A.7','1.13.B.1','1.13.B.2','1.13.B.3','1.13.B.4'],['2.A','3.C']],
  [['1.14.A','1.14.B','1.14.C'],['1.14.A.1','1.14.B.1','1.14.C.1'],['1.C','3.B']],
 ];
 lessons.forEach((l,i)=>assert.deepEqual(l.curriculum,{version:'ap-precalculus-2026-27',assessedOnExam:true,learningObjectives:expected[i][0],essentialKnowledge:expected[i][1],practices:expected[i][2]}));
});
test('03 official references, synthetic provenance and nonassessment flags are explicit',()=>{
 for(const lesson of lessons){assert.deepEqual(lesson.sourceRefs.map(r=>r.url),['https://apcentral.collegeboard.org/media/pdf/ap-precalculus-course-and-exam-description.pdf','https://apcentral.collegeboard.org/media/pdf/ap-precalculus-ced-clarification-and-guidance-effective-fall-2026.pdf']);for(const row of lesson.sourceRefs){assert.equal(row.checked,'2026-09-15');assert.ok(row.title.includes('2026'));}assert.deepEqual(lesson.provenance,{type:'original-teaching-examples',restrictedMaterialCopied:false,syntheticContexts:true,awardsMastery:false,automaticallyGraded:false,calculatorPolicy:'calculator_optional'});}
 says('model-choice-warmup','synthetic','not measurements from an actual experiment');says('model-build-warmup','synthetic geometric design');says('model-choice-transfer','not specifications for a real device');says('model-build-transfer','not a performance claim');
});
test('04 twelve unique immutable scenes use the four-stage public teaching schema',()=>{
 deepFrozen(content);assert.equal(scenes.length,12);assert.equal(new Set(scenes.map(s=>s.id)).size,12);
 for(const lesson of lessons){assert.equal(lesson.scenes.length,4);assert.deepEqual(lesson.scenes.map(s=>s.kind),['warmup','discover','notes','transfer']);assert.deepEqual(lesson.scenes.map(s=>s.model),[null,'modeling',null,null]);for(const s of lesson.scenes){const wanted=['id','title','kind','model','text','prompts','worked','initial','controls',...(s.model?['family']:[])];assert.deepEqual(Object.keys(s).sort(),wanted.sort());for(const k of ['text','prompts','worked'])assert.ok(s[k].length>=2&&s[k].every(v=>typeof v==='string'&&v.length>8&&!/<\/?(?:script|iframe)\b/i.test(v)));if(s.model===null){assert.deepEqual(s.initial,{});assert.deepEqual(s.controls,[]);}}}
 assert.throws(()=>lessons[0].scenes.push({}),TypeError);assert.throws(()=>scene('model-choice-discover').initial.delta=4,TypeError);
});
test('05 all declared control values match the exact model API without input mutation',()=>{
 const initial=[{a:-2,horizontalMagnitude:0.5,reverseInput:1,h:4,k:1,u:-2},{delta:0,candidate:1},{t:2}];
 const controlSpec=[[['a',-3,3,0.5],['horizontalMagnitude',0.5,2,0.5],['reverseInput',0,1,1],['h',-4,4,0.5],['k',-4,4,0.5],['u',-2,3,0.5]],[['delta',-4,4,0.5],['candidate',0,1,1]],[['t',0.25,4.75,0.25]]];
 const apis=[transformationModel,modelSelection,openBoxModel],families=['transform','selection','construction'];let checked=0;
 lessons.forEach((l,i)=>{const s=l.scenes[1];assert.deepEqual(s.initial,initial[i]);assert.equal(s.family,families[i]);assert.deepEqual(s.controls.map(c=>[c.key,c.min,c.max,c.step]),controlSpec[i]);for(const c of s.controls){assert.deepEqual(Object.keys(c).sort(),['key','label','min','max','step'].sort());assert.ok(c.label.length>4);for(const value of values(c)){const input={...s.initial,[c.key]:value},copy={...input},model=apis[i](input);assert.deepEqual(model.input,input);assert.deepEqual(input,copy);deepFrozen(model);checked++;}}});assert.equal(checked,102);
});
test('06 warmup solves the input equation independently of the complete parent rule',()=>{
 // Rearrange -.5*x+2=-2 rather than use the implementation point map.
 const x=(-2-2)/-0.5,y=-2*2+1;assert.deepEqual([x,y],[8,-3]);
 says('transform-map-warmup','(8,−3)','entire graph, domain and range require more information');
});
test('07 starting transformed sets follow completing the square and interval inequalities',()=>{
 const m=transformationModel(scene('transform-map-discover').initial);
 assert.deepEqual(m.parent.domain,[-2,3]);assert.equal(expandedParent(-0.5),-0.25);assert.equal(expandedParent(3),12);
 assert.deepEqual(m.image.domain,[-2,8]);assert.deepEqual(m.image.range,[-23,1.5]);assert.deepEqual(m.selected,{preimage:{x:-2,y:2},image:{x:8,y:-3}});
 assert.deepEqual(m.endpointImages.at(-1),{u:3,x:-2,y:-23});says('transform-map-discover','(−2,−23)','[−2,8]','[−23,1.5]','[−0.25,12]');
});
test('08 paired tables and reversed interval endpoints agree across 144 control corners',()=>{
 let checked=0;for(const a of [-3,0,3])for(const magnitude of [.5,2])for(const reverseInput of [0,1])for(const h of [-4,4])for(const k of [-4,4])for(const u of [-2,-.5,3]){
  const b=reverseInput?-magnitude:magnitude,m=transformationModel({a,horizontalMagnitude:magnitude,reverseInput,h,k,u});
  for(const row of m.table){near(b*(row.x-h),row.u);near(row.parentY,expandedParent(row.u));near(row.imageY,a*expandedParent(row.u)+k);}
  near(b*(m.selected.image.x-h),u);near(m.selected.image.y,a*expandedParent(u)+k);
  const possible=[a*expandedParent(-2)+k,a*expandedParent(-.5)+k,a*expandedParent(3)+k];near(m.image.range[0],Math.min(...possible));near(m.image.range[1],Math.max(...possible));assert.equal(m.inputOrderReversed,reverseInput===1);checked++;
 }assert.equal(checked,144);
});
test('09 zero output factor collapses range while preserving the full mapped domain',()=>{
 const initial=scene('transform-map-discover').initial;
 for(const k of [-4,0,4])for(const reverseInput of [0,1]){const nonzero=transformationModel({...initial,k,reverseInput}),zero=transformationModel({...initial,a:0,k,reverseInput});assert.equal(zero.collapsed,true);assert.deepEqual(zero.image.domain,nonzero.image.domain);assert.deepEqual(zero.image.range,[k,k]);assert.ok(zero.image.points.every(p=>p.y===k));}
 says('transform-map-discover','range is {k}','domain still consists','not an invertible dilation');
});
test('10 notes keep zero-input-scale algebra separate from the allowed explorer controls',()=>{
 const s=scene('transform-map-discover'),c=s.controls.find(c=>c.key==='horizontalMagnitude');assert.ok(values(c).every(v=>v>0));assert.equal(expandedParent(0),0);
 assert.throws(()=>transformationModel({...s.initial,horizontalMagnitude:0}),RangeError);
 says('transform-map-notes','x=h+u/b','horizontal scale of1/2','only when0 belongs to the parent domain','every real x would be an allowed input','not selectable');
});
test('11 transfer sets imply a zero exists but cannot locate all zeros',()=>{
 const transform=x=>-2*(x+1),domain=[-3.5,-1.5];assert.deepEqual(domain.map(transform),[5,1]);assert.deepEqual([-2,4].map(y=>3*y-1),[-7,11]);
 // Two legitimate parents share the stated domain/range but yield different zeros.
 const f1=u=>1.5*u-3.5,f2=u=>-1.5*u+5.5,x1=-41/18,x2=-49/18;
 near(3*f1(transform(x1))-1,0);near(3*f2(transform(x2))-1,0);assert.notEqual(x1,x2);
 says('transform-map-transfer','[−3.5,−1.5]','[−7,11]','at least one','do not locate it or determine how many');
});
test('12 synthetic table differences support a quadratic candidate without unique global identification',()=>{
 const y=[1,2,5,10,17],diff=a=>a.slice(1).map((v,i)=>v-a[i]);assert.deepEqual(diff(y),[1,3,5,7]);assert.deepEqual(diff(diff(y)),[2,2,2]);assert.ok(y.every((v,x)=>v===x*x+1));
 says('model-choice-warmup','1,3,5,7','2,2,2','Equal one-second intervals','finitely many matches alone');
});
test('13 all 34 selection states preserve fixed coefficients and exact signed residual sums',()=>{
 let checked=0;for(let d=-8;d<=8;d++)for(let candidate=0;candidate<=1;candidate++){
  const delta=d/2,m=modelSelection({delta,candidate});assert.deepEqual(m.observations.map(p=>p.y),[1,2,5+delta,10,17]);assert.deepEqual(m.candidates.map(c=>c.coefficients),[[4,-1],[1,0,1]]);
  // Doubled integer residual vectors avoid using model outputs as an oracle.
  const doubled=[[4n,-2n,BigInt(d-4),-2n,4n],[0n,0n,BigInt(d),0n,0n]];
  m.candidates.forEach((c,i)=>{const sse=Number(doubled[i].reduce((s,x)=>s+x*x,0n))/4;assert.equal(c.fitted,false);assert.equal(c.sse,sse);near(c.rmse,Math.sqrt(sse/5));assert.deepEqual(c.rows.map(p=>p.residual),doubled[i].map(x=>Number(x)/2));});
  assert.equal(m.ranking.best,d===7?'tie':d<7?'quadratic':'linear');checked++;
 }assert.equal(checked,34);
});
test('14 residual worked values, units, tie and ranking are consistent without refitting',()=>{
 const start=modelSelection({delta:0,candidate:1}),changed=modelSelection({delta:4,candidate:0}),tie=modelSelection({delta:3.5,candidate:1});
 assert.deepEqual(start.candidates[0].rows.map(p=>p.residual),[2,-1,-2,-1,2]);assert.deepEqual(changed.candidates.map(c=>c.sse),[14,16]);assert.deepEqual(tie.candidates.map(c=>c.sse),[12.25,12.25]);
 says('model-choice-discover','observed position minus predicted position','Neither candidate is refitted','not a fitted regression','14cm²','16cm²','δ=3.5','√(SSE/5) centimeters');
});
test('15 interpolation notes exhibit equal finite data and differing extrapolations',()=>{
 const Q=x=>x*x+1,H=x=>Q(x)+x*(x-1)*(x-2)*(x-3)*(x-4)/10;
 for(let x=0;x<=4;x++)assert.equal(H(x),Q(x));assert.equal(Q(5),26);assert.equal(H(5),38);
 says('model-choice-notes','Q(5)=26','H(5)=38','coefficients remain fixed','unequal time intervals','no observation at x=5');
});
test('16 original piecewise transfer has one rule per input and a continuous switch',()=>{
 for(let n=0;n<=28;n++){const t=n/2,rules=[t>=0&&t<4,t>=4&&t<=14];assert.equal(rules.filter(Boolean).length,1);const y=rules[0]?20+10*t:52+2*t;assert.ok(y>=20&&y<=80);}
 assert.equal(20+10*4,52+2*4);assert.equal(52+2*10,72);assert.equal(52+2*14,80);assert.equal(20+10*10,120);
 says('model-choice-transfer','0≤t<4','4≤t≤14','P(10)=72%','P(14)=80%','120%','percentage points per minute');
});
test('17 all nineteen cut settings match independent integer dimension products',()=>{
 for(let q=1;q<=19;q++){const t=q/4,m=openBoxModel({t}),V=Number(BigInt(q)*BigInt(36-q)*BigInt(20-q))/16;
  assert.deepEqual(m.dimensions,{length:(36-q)/2,width:(20-q)/2,height:t});assert.equal(m.volume,V);assert.ok(V>0);assert.deepEqual(m.contextDomain,{min:0,max:5,minIncluded:false,maxIncluded:false});assert.equal(m.table.length,19);}
 says('model-build-warmup','18−2t,10−2t and t','0<t<5','Neither endpoint gives a usable box');
});
test('18 box worked rates and sample maximum have the stated limited meaning',()=>{
 const volume=t=>4*t*t*t-56*t*t+180*t;assert.deepEqual([1,2,3].map(volume),[128,168,144]);assert.deepEqual([volume(2)-volume(1),volume(3)-volume(2)],[40,-24]);
 const m=openBoxModel(scene('model-build-discover').initial);assert.deepEqual(m.sampleMaximum,{t:2,volume:168,scope:'quarter-step-samples-only'});assert.ok(volume(2.125)>168); // A valid non-grid input refutes a grid-only global inference.
 says('model-build-discover','128','168','144cm³','40 and−24cm³ per cm','not mean the box has negative volume','among the displayed quarter-step samples','requires further reasoning');
});
test('19 box notes separate algebraic extension, contextual domain and non-regression construction',()=>{
 for(let q=-8;q<=28;q++){const t=q/4;assert.equal(t*(18-2*t)*(10-2*t),4*t**3-56*t**2+180*t);}
 assert.equal(6*(18-12)*(10-12),-72);assert.equal(10-2*6,-2);
 says('model-build-notes','4t³−56t²+180t','not a regression fitted to measurements','−72cm³','violates the physical domain','does not replace those other modeling methods');
});
test('20 inverse-model transfer keeps a discrete contextual domain and explicit assumptions',()=>{
 const allowed=[1,2,3,4,5,6],times=allowed.map(n=>36/n);assert.deepEqual(times,[36,18,12,9,7.2,6]);assert.equal(times[2],12);assert.equal(times[5],6);assert.equal(36/0,Infinity);assert.equal(allowed.includes(2.5),false);
 for(let i=0;i<allowed.length;i++)near(allowed[i]*times[i],36);
 says('model-build-transfer','identical independent pumps','n∈{1,2,3,4,5,6}','T(3)=12 minutes and T(6)=6 minutes','fractional pumps are not options','Shared pipe capacity');
});
test('21 baseline source closure is unchanged after all content and model checks',async()=>assert.deepEqual(await pinSnapshot(),before));
