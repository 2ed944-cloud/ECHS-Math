/** Original teaching-content mathematics and composition checks; no native/assessment acceptance. */
import assert from 'node:assert/strict';
import test from 'node:test';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {dirname,resolve} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const arg=name=>{const i=process.argv.indexOf(name);return i<0?null:process.argv[i+1];};
const repo=resolve(arg('--repo')||resolve(dirname(fileURLToPath(import.meta.url)),'../..'));
assert.ok(arg('--baseline-root'),'Supply --baseline-root containing the four exact historical lesson files.');
const baseline=resolve(arg('--baseline-root'));
const {AP_RATIONAL_CONTENT:content}=await import(pathToFileURL(resolve(repo,'lessons/shared/investigations/ap-rational-content.mjs')));
const {factorLedger,rationalAt}=await import(pathToFileURL(resolve(repo,'lessons/shared/investigations/ap-rational-model.mjs')));
const lessons=Object.values(content),scenes=lessons.flatMap(l=>l.scenes);
const scene=id=>{const s=scenes.find(s=>s.id===id);assert.ok(s,id);return s;};
const prose=id=>{const s=scene(id);return [...s.text,...s.prompts,...s.worked].join('\n');};
const says=(id,...parts)=>parts.forEach(part=>assert.ok(prose(id).includes(part),`${id}: ${part}`));
const near=(a,b)=>assert.ok(Number.isFinite(a)&&Math.abs(a-b)<=1e-8*Math.max(1,Math.abs(b)),`${a} != ${b}`);
const freezeCheck=value=>{if(value&&typeof value==='object'){assert.ok(Object.isFrozen(value));Object.values(value).forEach(freezeCheck);}};
const factor=(root,multiplicity=1)=>({root,multiplicity});
const input=(scale,numerator,denominator)=>({scale,numerator:numerator.map(r=>Array.isArray(r)?factor(...r):factor(r)),denominator:denominator.map(r=>Array.isArray(r)?factor(...r):factor(r))});
const toModel=i=>input(i.scale,[[i.numeratorRoot,i.numeratorMultiplicity],...(i.commonNumeratorMultiplicity?[[i.commonRoot,i.commonNumeratorMultiplicity]]:[])],[[i.denominatorRoot,i.denominatorMultiplicity],...(i.commonDenominatorMultiplicity?[[i.commonRoot,i.commonDenominatorMultiplicity]]:[])]);
const mulPoly=(a,b)=>{const out=Array(a.length+b.length-1).fill(0);a.forEach((x,i)=>b.forEach((y,j)=>out[i+j]+=x*y));return out;};
const expand=(factors,scale=1)=>{let p=[scale];for(const f of factors)for(let n=0;n<f.multiplicity;n++)p=mulPoly(p,[-f.root,1]);return p;};
const evaluate=(p,x)=>p.reduceRight((sum,c)=>sum*x+c,0);
const direct=(m,x)=>evaluate(expand(m.numerator,m.scale),x)/evaluate(expand(m.denominator),x);
const gcd=(a,b)=>{a=a<0n?-a:a;b=b<0n?-b:b;while(b)[a,b]=[b,a%b];return a;};
const Q=(n,d=1n)=>{n=BigInt(n);d=BigInt(d);assert.notEqual(d,0n);if(d<0n){n=-n;d=-d;}const g=gcd(n,d);return[n/g,d/g];};
const add=(a,b)=>Q(a[0]*b[1]+b[0]*a[1],a[1]*b[1]);
const multiply=(a,b)=>Q(a[0]*b[0],a[1]*b[1]);
const divide=(a,b)=>Q(a[0]*b[1],a[1]*b[0]);
const polynomial=(coeff,x)=>coeff.map(c=>Q(c)).reduceRight((y,c)=>add(multiply(y,x),c),Q(0));
const quotient=(n,d,x)=>divide(polynomial(n,x),polynomial(d,x));
const display=q=>(q[1]===1n?String(q[0]):`${q[0]}/${q[1]}`).replaceAll('-','−');
const value=q=>Number(q[0])/Number(q[1]);
const sign=n=>n===0?0:Math.sign(n);
const features=(m)=>factorLedger(m);
const feature=(m,x)=>{const e=features(m).exclusions.find(e=>e.x===x);assert.ok(e);return e;};
const limits=(m,x)=>{const e=feature(m,x);return [e.leftLimit.kind,e.rightLimit.kind];};
const infinity=s=>s>0?'positive-infinity':'negative-infinity';
function signNearPole(m,x){return [-1,1].map(side=>{const sequence=[.01,.001,.0001].map(h=>direct(m,x+side*h));assert.ok(sequence.every(y=>Number.isFinite(y)&&sign(y)===sign(sequence[0])));assert.ok(Math.abs(sequence[2])>Math.abs(sequence[1])&&Math.abs(sequence[1])>Math.abs(sequence[0]));return infinity(sign(sequence[0]));});}
function solutionMember(set,x){return set.replaceAll('−','-').split('∪').some(term=>{if(term.startsWith('{'))return x===Number(term.slice(1,-1));const match=term.match(/^([[(])(-?∞|-?\d+(?:\.\d+)?),(-?∞|-?\d+(?:\.\d+)?)(\]|\))$/);assert.ok(match,term);const number=s=>s==='-∞'?-Infinity:s==='∞'?Infinity:Number(s);const lo=number(match[2]),hi=number(match[3]);return(x>lo||(match[1]==='['&&x===lo))&&(x<hi||(match[4]===']'&&x===hi));});}
function verifySet(set,m,relation){const points=new Set(Array.from({length:129},(_,i)=>-8+i/8));for(const f of [...m.numerator,...m.denominator])for(const d of [0,-.001,.001])points.add(f.root+d);for(const x of points){const excluded=m.denominator.some(f=>f.root===x),y=excluded?NaN:direct(m,x);assert.equal(solutionMember(set,x),!excluded&&relation(y),`${set} at ${x}`);}}
function cartesian(controls,initial){let rows=[{...initial}];for(const c of controls){const ticks=Array.from({length:Math.round((c.max-c.min)/c.step)+1},(_,n)=>c.min+n*c.step);rows=rows.flatMap(row=>ticks.map(x=>({...row,[c.key]:x})));}return rows;}

const expected=[
 ['ap-rational-tails','1.7','AP_Precalculus_1.7_Rational_Functions_and_End_Behavior_ECHS_Refined.html','e8a25483949458b822453c3bf218200d20eeff9bb53cb62e210dfb63125921ae',6],
 ['ap-rational-zeros','1.8','AP_Precalculus_1.8_Rational_Functions_and_Zeros_ECHS_Refined.html','d32dd693d7fa634261d0e8f9c831332a865a9c1174a2394d4e6e35fc9e9cea4f',2],
 ['ap-rational-poles','1.9','AP_Precalculus_1.9_Rational_Functions_and_Vertical_Asymptotes_ECHS_Refined.html','ccbf5d31c70547ba9a97b0bc0b48c63d3935468448afcb4377343b9430bbfd6f',2],
 ['ap-rational-holes','1.10','AP_Precalculus_1.10_Rational_Functions_and_Holes_ECHS_Refined.html','24a70414208984e6d3fccc05674193a9a8b5a1fe1fb6412ff5b7d4223871c56a',2]
];
test('01 four routes retain exact Fall 2026 curriculum IDs and original/public provenance',()=>{
 assert.deepEqual(Object.keys(content),expected.map(r=>r[0]));
 for(const [key,topic,filename,hash,count]of expected){const l=content[key];assert.equal(l.course,'AP Precalculus');assert.equal(l.topic,topic);assert.equal(l.curriculum.version,'ap-precalculus-2026-27');assert.equal(l.curriculum.assessedOnExam,true);assert.deepEqual(l.curriculum.learningObjectives,[topic+'.A']);assert.deepEqual(l.curriculum.essentialKnowledge,Array.from({length:count},(_,i)=>topic+'.A.'+(i+1)));assert.equal(l.pin.path,'lessons/ap-precalculus/unit-1/'+filename);assert.equal(l.pin.sha256,hash);assert.equal(l.pin.kind,'reviewed-existing-lesson-before-addition');assert.deepEqual(l.provenance,{type:'original-teaching-examples',restrictedMaterialCopied:false,awardsMastery:false,calculatorPolicy:'calculator_optional'});assert.deepEqual(l.sourceRefs.map(r=>r.url),['https://apcentral.collegeboard.org/media/pdf/ap-precalculus-course-and-exam-description.pdf','https://apcentral.collegeboard.org/media/pdf/ap-precalculus-ced-clarification-and-guidance-effective-fall-2026.pdf']);for(const r of l.sourceRefs)assert.equal(r.checked,'2026-09-14');for(const id of l.curriculum.practices)assert.match(id,/^[123]\.[ABC]$/);}
});
test('02 all sixteen scenes are immutable, populated and ordered with one explicit live family per route',()=>{
 freezeCheck(content);assert.equal(scenes.length,16);assert.equal(new Set(scenes.map(s=>s.id)).size,16);
 for(const l of lessons){assert.deepEqual(l.scenes.map(s=>s.kind),['warmup','discover','notes','transfer']);assert.deepEqual(l.scenes.map(s=>s.model),[null,'rational',null,null]);for(const s of l.scenes){for(const key of ['id','title'])assert.ok(typeof s[key]==='string'&&s[key].length>5);for(const key of ['text','prompts','worked'])assert.ok(Array.isArray(s[key])&&s[key].length>=2&&s[key].every(x=>typeof x==='string'&&x.trim().length>0));if(s.model===null){assert.deepEqual(s.initial,{});assert.deepEqual(s.controls,[]);}else assert.equal(s.family,'linear-factors');}}
});
test('03 each provenance hash matches separately supplied exact historical HTML bytes',async()=>{
 for(const [key]of expected){const p=content[key].pin,raw=await readFile(resolve(baseline,p.path));assert.equal(createHash('sha256').update(raw).digest('hex'),p.sha256,p.path);assert.ok(raw.length>1000000);}
});
test('04 all 628 reachable explorer settings round-trip the exact eight-field shape and independent polynomial oracle',()=>{
 const keys=['scale','numeratorRoot','numeratorMultiplicity','denominatorRoot','denominatorMultiplicity','commonRoot','commonNumeratorMultiplicity','commonDenominatorMultiplicity'].sort();let total=0;
 for(const s of scenes.filter(s=>s.model)){assert.deepEqual(Object.keys(s.initial).sort(),keys);assert.equal(new Set(s.controls.map(c=>c.key)).size,s.controls.length);for(const c of s.controls){assert.deepEqual(Object.keys(c).sort(),['key','label','min','max','step'].sort());assert.ok(keys.includes(c.key)&&c.min<c.max&&c.step>0&&Number.isInteger((c.max-c.min)/c.step));assert.ok(s.initial[c.key]>=c.min&&s.initial[c.key]<=c.max);}
  for(const state of cartesian(s.controls,s.initial)){const m=toModel(state),ledger=factorLedger(m);assert.deepEqual(ledger.input,m);assert.deepEqual(factorLedger(ledger.input),ledger);assert.equal(ledger.zeroEverywhereOnDomain,state.scale===0);
   for(const x of [-3.75,-.75,.5,1.5,3.75,5]){const row=rationalAt(m,x);if(m.denominator.some(f=>f.root===x)){assert.notEqual(row.kind,'defined');assert.equal(row.y,null);}else{assert.equal(row.kind,'defined');near(row.y,direct(m,x));}}
   for(const root of new Set(m.denominator.map(f=>f.root)))assert.equal(rationalAt(m,root).y,null);
   const numerator=expand(m.numerator,m.scale),denominator=expand(m.denominator);if(state.scale===0){assert.ok(numerator.every(n=>n===0));assert.equal(ledger.tails.degreeDifference,null);assert.equal(ledger.tails.leadingTerm,null);assert.ok(ledger.exclusions.every(e=>e.kind==='hole'&&e.y===0));}else{assert.equal(ledger.tails.degreeDifference,numerator.length-denominator.length);near(ledger.tails.leadingTerm.coefficient,numerator.at(-1)/denominator.at(-1));}
   total++;
  }
 }assert.equal(total,628);
});
test('05 tails warmup: exact quotients, independent degree limits and A identity',()=>{
 const id='rational-tails-warmup';const a=quotient([1,1],[-2,1],Q(-10)),b=quotient([1,1],[-2,1],Q(10));assert.deepEqual(a,Q(3,4));assert.deepEqual(b,Q(11,8));says(id,`A(−10)=${display(a)}`,`A(10)=${display(b)}`,'both limits are 1','both limits are 0');for(const x of [-20,-4,0,4,20])near((x+1)/(x-2),1+3/(x-2));assert.ok(((-20+1)**2/(-20-2))<0&&((20+1)**2/(20-2))>0);
});
test('06 tails explorer: negative finite tails, signed degree differences and the zero-scale domain',()=>{
 const id='rational-tails-explorer',base=scene(id).initial;assert.deepEqual(toModel(base),input(-2,[-1],[2]));const expectedPairs=[['finite','finite'],['positive-infinity','negative-infinity'],['negative-infinity','negative-infinity']];for(const [[n,d],pair]of [[[1,2],expectedPairs[0]],[[2,1],expectedPairs[1]],[[3,1],expectedPairs[2]]]){const m=toModel({...base,numeratorMultiplicity:n,denominatorMultiplicity:d}),l=features(m);assert.deepEqual([l.tails.left.kind,l.tails.right.kind],pair);for(const x of [-20,20])assert.equal(sign(direct(m,x)),sign(-2*x**(n-d)));}const zero=features(toModel({...base,scale:0}));assert.deepEqual(zero.exclusions.map(e=>[e.x,e.kind,e.y]),[[2,'hole',0]]);says(id,'(0,0), (+∞,−∞) and (−∞,−∞)','still excludes x=2');
});
test('07 tails notes: division identity differs from leading term, and asymptote crossing is valid',()=>{
 const id='rational-tails-notes';assert.deepEqual(mulPoly([-2,1],[4,1]).map((v,i)=>v+(i===0?9:0)),[1,2,1]);for(const x of [-20,-3,0,4,20])near((x+1)**2/(x-2)-(x+4),9/(x-2));says(id,'x+4+9/(x−2)','C(x)−x approaches 4','F(0)=1');for(const x of [-10,-1,1,10])assert.equal(sign((1+x/(x*x+1))-1),sign(x));
});
test('08 cost transfer: QAR-per-item units, integer domain and strict threshold checked at both neighbors',()=>{
 const id='rational-tails-transfer';const cost=n=>divide(add(multiply(Q(14),Q(n)),Q(210)),Q(n));assert.deepEqual(cost(30),Q(21));assert.deepEqual(cost(210),Q(15));assert.ok(value(cost(211))<15);assert.ok(value(cost(210))>=15);for(let n=1;n<=210;n++)assert.ok(value(cost(n))>=15);says(id,'positive integer','QAR per item','smallest allowed order is 211','never equals 14');
});
test('09 zeros warmup: domain-aware inequality includes valid zero but excludes interior hole',()=>{
 const id='rational-zeros-warmup',m=input(1,[-2,1],[1,3]);assert.deepEqual(features(m).zeros.map(z=>z.x),[-2]);near(feature(m,1).y,-1.5);assert.equal(feature(m,3).kind,'pole');const set=scene(id).worked[2].match(/solution is ([^.]+)\./)[1];verifySet(set,m,y=>y<=0);says(id,'(1,−3/2)');
});
test('10 zeros explorer: even root, odd root and sign reversal across an excluded zero-height hole',()=>{
 const id='rational-zeros-explorer',base=scene(id).initial,m=toModel(base);near(feature(m,1).y,-4.5);assert.equal(sign(direct(m,-2.1)),sign(direct(m,-1.9)));const odd=toModel({...base,numeratorMultiplicity:1});assert.equal(sign(direct(odd,-2.1)),-sign(direct(odd,-1.9)));const hole=toModel({...base,commonNumeratorMultiplicity:2});assert.equal(feature(hole,1).y,0);assert.equal(rationalAt(hole,1).y,null);assert.equal(sign(direct(hole,.9)),-sign(direct(hole,1.1)));assert.ok(!features(hole).zeros.some(z=>z.x===1));says(id,'−9/2','sign reverses there','excluded input');
});
test('11 zeros notes: identical cancelled factors do not add a zero; zero polynomial has a full domain zero set',()=>{
 const id='rational-zeros-notes',one=input(1,[1],[1]),zero=input(0,[-2],[3]);assert.deepEqual(features(one).zeros,[]);assert.equal(rationalAt(one,1).kind,'hole');for(const x of [-3,0,2,4])assert.equal(rationalAt(zero,x).y,0);assert.equal(rationalAt(zero,3).y,null);assert.equal(features(zero).tails.degreeDifference,null);says(id,'Every real number except 3','degree is undefined');
});
test('12 zeros transfer: nonnegative interval and isolated equality point pass independent sign-cell membership',()=>{
 const id='rational-zeros-transfer',m=input(-1,[[2,2]],[-1,4]);const positive=scene(id).worked[1].match(/solution is (?:the whole interval )?([([][^.]+)\./)[1],negative=scene(id).worked[2].match(/solution is ([^.]+)\./)[1];verifySet(positive,m,y=>y>=0);verifySet(negative,m,y=>y<=0);assert.equal(solutionMember(negative,2),true);assert.equal(solutionMember(negative,2.01),false);assert.deepEqual(features(m).zeros.map(z=>z.x),[2]);
});
test('13 poles warmup: direct one-sided sequences confirm odd/even poles and scale reversal',()=>{
 const id='rational-poles-warmup';for(const mult of [1,2])for(const scale of [1,-1]){const m=input(scale,[-1],[[2,mult]]);assert.deepEqual(limits(m,2),signNearPole(m,2));assert.deepEqual(limits(m,2),mult===1?[infinity(-scale),infinity(scale)]:[infinity(scale),infinity(scale)]);}says(id,'(+∞,−∞)','(−∞,−∞)');
});
test('14 poles explorer: poles at 0 and 2, common multiplicity holes and negative-scale directions',()=>{
 const id='rational-poles-explorer',base=scene(id).initial,m=toModel(base);for(const x of [0,2])assert.deepEqual(limits(m,x),signNearPole(m,x));assert.deepEqual(limits(m,0),['positive-infinity','negative-infinity']);assert.deepEqual(limits(m,2),['negative-infinity','positive-infinity']);near(feature(toModel({...base,commonNumeratorMultiplicity:2}),0).y,-.5);assert.equal(feature(toModel({...base,commonNumeratorMultiplicity:3}),0).y,0);for(const x of [0,2])assert.deepEqual(limits(toModel({...base,scale:-1}),x),limits(m,x).map(k=>k==='positive-infinity'?'negative-infinity':'positive-infinity'));says(id,'(0,−1/2)','(0,0)');
});
test('15 poles notes: rule qualification covers zero numerator as well as cancelling ordinary multiplicities',()=>{
 const id='rational-poles-notes',f=input(1,[[1,2]],[1]),g=input(1,[1],[[1,3]]);assert.equal(feature(f,1).y,0);assert.deepEqual(limits(g,1),['positive-infinity','positive-infinity']);assert.deepEqual(limits(g,1),signNearPole(g,1));const zero=input(0,[-1],[2]);assert.equal(feature(zero,2).kind,'hole');assert.equal(feature(zero,2).y,0);assert.match(scene(id).worked[2],/nonzero numerator/i);assert.match(scene(id).worked[2],/zero scale|scale is zero/i);assert.match(scene(id).worked[2],/Neither case restores an excluded input/i);
});
test('16 poles transfer: retained hole -1/3, even negative pole and no valid zeros',()=>{
 const id='rational-poles-transfer',m=input(-3,[1],[[-2,2],1]);near(feature(m,1).y,-1/3);assert.deepEqual(limits(m,-2),['negative-infinity','negative-infinity']);assert.deepEqual(limits(m,-2),signNearPole(m,-2));assert.deepEqual(features(m).zeros,[]);says(id,'(1,−1/3)','both one-sided limits are −∞','There are no zeros');
});
test('17 holes warmup: exact missing point height differs from undefined function value',()=>{
 const id='rational-holes-warmup',m=input(1,[2,-1],[2,3]);assert.equal(rationalAt(m,2).y,null);assert.equal(feature(m,2).y,-3);assert.equal(feature(m,3).kind,'pole');says(id,'F(2) is undefined','(2,−3)');
});
test('18 holes explorer: exact rational heights and c=2 collision produce a pole rather than division by zero',()=>{
 const id='rational-holes-explorer',base=scene(id).initial;for(const [c,height]of [[1,-2],[1.75,-11],[2.25,13]]){const m=toModel({...base,commonRoot:c});near(feature(m,c).y,height);near(value(divide(add(Q(c*4,4),Q(1)),add(Q(c*4,4),Q(-2)))),height);}const collision=features(toModel({...base,commonRoot:2}));assert.equal(collision.exclusions.length,1);assert.equal(collision.exclusions[0].kind,'pole');assert.equal(collision.exclusions[0].remainingDenominatorMultiplicity,1);assert.equal(collision.exclusions[0].y,null);says(id,'(1,−2), (1.75,−11) and (2.25,13)','no finite hole');
});
test('19 holes notes: axis-height exclusion is not a zero and filling it changes the domain',()=>{
 const id='rational-holes-notes',m=input(1,[[1,3]],[1,-2]);assert.equal(feature(m,1).y,0);assert.equal(rationalAt(m,1).y,null);assert.equal(feature(m,-2).kind,'pole');assert.deepEqual(features(m).zeros,[]);for(const x of [0,.5,1.5,3])near(direct(m,x),(x-1)**2/(x+2));says(id,'no valid zeros','different domain','continuous extension');
});
test('20 holes transfer: exact nearby fractions, finite limit and unequal symmetric output distances',()=>{
 const id='rational-holes-transfer';const left=quotient([2,1],[4,1],Q(29,10)),right=quotient([2,1],[4,1],Q(31,10)),limit=quotient([2,1],[4,1],Q(3));assert.deepEqual(left,Q(49,69));assert.deepEqual(right,Q(51,71));assert.deepEqual(limit,Q(5,7));assert.notDeepEqual(divide(add(left,right),Q(2)),limit);const m=input(1,[3,-2],[3,-4]);near(feature(m,3).y,value(limit));assert.deepEqual(features(m).zeros.map(z=>z.x),[-2]);assert.equal(feature(m,-4).kind,'pole');says(id,`P(2.9)=${display(left)}`,`P(3.1)=${display(right)}`,`(3,${display(limit)})`,'not linear');
});
