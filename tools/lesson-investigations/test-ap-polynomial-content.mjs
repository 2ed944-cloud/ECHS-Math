/** Content arithmetic and composition checks; no browser or assessment acceptance. */
import assert from 'node:assert/strict';
import test from 'node:test';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {dirname,resolve} from 'node:path';
const arg=name=>{const i=process.argv.indexOf(name);return i<0?null:process.argv[i+1];};
const location=dirname(fileURLToPath(import.meta.url));
const repo=resolve(arg('--repo')||resolve(location,'../..'));
assert.ok(arg('--baseline-root'),'Supply --baseline-root containing the exact historical lesson HTML.');
const baselineRoot=resolve(arg('--baseline-root'));
const {AP_POLYNOMIAL_CONTENT:content}=await import(pathToFileURL(resolve(repo,'lessons/shared/investigations/ap-polynomial-content.mjs')).href);
const {cubicRates,zeroStructure,polynomialTails,samplePolynomial}=await import(pathToFileURL(resolve(repo,'lessons/shared/investigations/ap-polynomial-model.mjs')).href);

const lessons=Object.values(content),scenes=lessons.flatMap(x=>x.scenes);
const scene=id=>{const value=scenes.find(s=>s.id===id);assert.ok(value,id);return value;};
const words=id=>{const s=scene(id);return [...s.text,...s.prompts,...s.worked].join('\n');};
const says=(id,...fragments)=>fragments.forEach(s=>assert.ok(words(id).includes(s),`${id} lacks ${s}`));
const near=(a,b)=>assert.ok(Math.abs(a-b)<=1e-10*Math.max(1,Math.abs(b)),`${a} != ${b}`);
const minus=n=>String(n).replaceAll('-','−');
const list=values=>values.map(minus).join(',');
const evaluate=(coeff,x)=>coeff.reduce((sum,c,i)=>sum+c*x**i,0);
const successive=a=>a.slice(1).map((value,i)=>value-a[i]);
const frozen=value=>{if(value&&typeof value==='object'){assert.ok(Object.isFrozen(value));Object.values(value).forEach(frozen);}};
const functions={'cubic-rates':cubicRates,'zero-structure':zeroStructure,tails:polynomialTails};

test('three original topic records retain exact 2026–27 objective and source metadata',()=>{
  assert.deepEqual(Object.keys(content),['ap-polynomial-rates','ap-polynomial-zeros','ap-polynomial-tails']);
  const specs=[['1.4',['1.4.A'],5,['2.A','3.A']],['1.5',['1.5.A','1.5.B'],8,['1.B','2.B']],['1.6',['1.6.A'],3,['3.A']]];
  for(let i=0;i<lessons.length;i++){
    const l=lessons[i],[topic,objectives,count,practices]=specs[i];
    assert.equal(l.version,'echs.lesson-investigation.v1');assert.equal(l.course,'AP Precalculus');assert.equal(l.topic,topic);
    assert.equal(l.curriculum.version,'ap-precalculus-2026-27');assert.equal(l.curriculum.assessedOnExam,true);
    assert.deepEqual(l.curriculum.learningObjectives,objectives);assert.equal(l.curriculum.essentialKnowledge.length,count);
    assert.deepEqual(l.curriculum.practices,practices);
    assert.deepEqual(l.sourceRefs.map(x=>x.url),[
      'https://apcentral.collegeboard.org/media/pdf/ap-precalculus-course-and-exam-description.pdf',
      'https://apcentral.collegeboard.org/media/pdf/ap-precalculus-ced-clarification-and-guidance-effective-fall-2026.pdf']);
    for(const ref of l.sourceRefs)assert.equal(ref.checked,'2026-09-14');
    assert.deepEqual(l.provenance,{type:'original-teaching-examples',restrictedMaterialCopied:false,awardsMastery:false,calculatorPolicy:'calculator_optional'});
  }
});

test('four ordered scenes per topic are immutable, explicit teaching data with one live model',()=>{
  frozen(content);assert.equal(new Set(scenes.map(s=>s.id)).size,12);
  for(const l of lessons){
    assert.deepEqual(l.scenes.map(s=>s.kind),['warmup','discover','notes','transfer']);
    assert.deepEqual(l.scenes.map(s=>s.model),[null,'polynomial',null,null]);
    for(const s of l.scenes){
      for(const key of ['text','prompts','worked'])assert.ok(Array.isArray(s[key])&&s[key].length>=2&&s[key].every(x=>typeof x==='string'&&x.length>0));
      assert.equal(typeof s.title,'string');
      if(s.model===null){assert.deepEqual(s.initial,{});assert.deepEqual(s.controls,[]);}
    }
  }
  assert.throws(()=>{content['ap-polynomial-rates'].scenes[1].initial.k=99;},TypeError);
  assert.throws(()=>{scenes[0].worked.push('replacement');},TypeError);
});

test('lesson source pins match external retained original bytes and public hash-only baseline metadata',async()=>{
  const baseline=JSON.parse(await readFile(new URL('./polynomial-baseline-pins.json',import.meta.url),'utf8'));
  assert.deepEqual(Object.keys(baseline).sort(),['baseline_main','files']);
  assert.equal(baseline.baseline_main,'dcc65f84dafd2dc5cb4518ea03d18b4087ddf4ff');
  assert.deepEqual(baseline.files.map(r=>r.path),lessons.map(l=>l.pin.path));
  for(const {pin} of lessons){
    assert.equal(pin.kind,'reviewed-existing-lesson-before-addition');assert.match(pin.path,/^lessons\/ap-precalculus\/unit-1\/AP_Precalculus_1\.[456]_[A-Za-z_]+\.html$/);
    const bytes=await readFile(resolve(baselineRoot,pin.path));
    assert.equal(createHash('sha256').update(bytes).digest('hex'),pin.sha256);
    const row=baseline.files.find(r=>r.path===pin.path);assert.ok(row,pin.path);
    assert.deepEqual(Object.keys(row).sort(),['bytes','path','sha256']);
    assert.equal(row.bytes,bytes.length);assert.equal(row.sha256,pin.sha256);
  }
});

test('declared numeric controls stay valid at every tick and joint boundaries with fixed scale',()=>{
  const expected=[['k'],['r','m','u','v'],['n','b','c','window']];
  for(let i=0;i<lessons.length;i++){
    const s=lessons[i].scenes[1],fn=functions[s.family];assert.equal(typeof fn,'function');
    assert.deepEqual(s.controls.map(c=>c.key),expected[i]);assert.equal(s.initial.a,1);
    assert.deepEqual(fn(s.initial).input,s.initial);
    for(const c of s.controls){
      assert.deepEqual(Object.keys(c).sort(),['key','label','max','min','step']);
      assert.equal(typeof c.label,'string');assert.ok(c.min<c.max&&c.step>0);
      const ticks=(c.max-c.min)/c.step;assert.ok(Number.isInteger(ticks)&&ticks<=100);
      assert.ok(s.initial[c.key]>=c.min&&s.initial[c.key]<=c.max);
      for(let j=0;j<=ticks;j++){const input={...s.initial,[c.key]:c.min+j*c.step};assert.deepEqual(fn(input).input,input);}
    }
    // Joint extrema exercise v=0/root collisions and n=1/combined constants too.
    for(let mask=0;mask<2**s.controls.length;mask++){
      const input={...s.initial};s.controls.forEach((c,j)=>{input[c.key]=(mask>>j)&1?c.max:c.min;});
      assert.deepEqual(fn(input).input,input);
    }
  }
});

test('rates warmup: unit averages and midpoint counterexample agree with the actual prose',()=>{
  const id='poly-rates-warmup',f=x=>x**3-3*x,xs=[-2,-1,0,1,2],ys=xs.map(f),differences=successive(ys);
  assert.deepEqual(ys,[-2,2,0,-2,2]);assert.deepEqual(differences,[4,-2,-2,4]);
  says(id,'p(x)=x³−3x',list(ys),list(differences),`p(0.5)=${minus(f(.5))}`);
  assert.equal(f(.5),-1.375);assert.equal((f(0)+f(1))/2,-1);assert.notEqual(f(.5),(f(0)+f(1))/2);
  const state=samplePolynomial({coefficients:[0,-3,0,1],start:-2,step:1,count:4});
  assert.deepEqual(state.rows.map(r=>r.y),ys);assert.deepEqual(state.intervals.map(r=>r.rate),differences);
  assert.equal(state.degree,3);assert.equal(state.leadingCoefficient,1);assert.equal(state.tails.left,'negative-infinity');assert.equal(state.tails.right,'positive-infinity');
});

test('rates explorer: positive secant, both turns, stationary nonturn and all restricted candidates',()=>{
  const id='poly-rates-explorer',s=scene(id),state=cubicRates(s.initial),f=x=>x**3-3*x;
  near(state.secant.rate,(f(.5)-f(-2))/2.5);assert.equal(state.secant.rate,.25);assert.equal(state.secant.change,.625);
  says(id,'0.625/2.5=0.25','(−1,2)','(1,−2)',list(state.restricted.candidates.map(p=>p.y)));
  assert.deepEqual(state.turningPoints.map(p=>[p.x,p.y]),[[-1,2],[1,-2]]);
  assert.equal(state.monotonicIntervals[1].behavior,'decreasing');
  assert.deepEqual(state.restricted.globalMinimum,{value:-52,points:[-4]});assert.deepEqual(state.restricted.globalMaximum,{value:52,points:[4]});
  for(const k of [0,-1]){const s=cubicRates({...scene(id).initial,k});assert.equal(s.turningPoints.length,0);assert.equal(s.inflection.stationary,k===0);assert.equal(s.monotonicIntervals[0].behavior,'increasing');assert.equal(s.inflection.x,0);}
});

test('rates notes: flat cubic and one-sided quadratic endpoint examples are domain-qualified',()=>{
  const id='poly-rates-error-analysis',q=x=>5-(x+1)**2;
  assert.deepEqual([-1,0,1].map(x=>x**3),[-1,0,1]);
  assert.deepEqual([-2,-1,2].map(q),[4,5,-4]);
  for(const h of [.01,.1]){assert.ok(q(-2)<q(-2+h));assert.ok(q(2)<q(2-h));assert.ok(q(-1)>q(-1-h)&&q(-1)>q(-1+h));}
  for(let i=0;i<=400;i++){const value=q(-2+i/100);assert.ok(value>=-4&&value<=5);}
  says(id,'q(x)=5−(x+1)²','q(−2)=4','q(−1)=5','q(2)=−4','one-sided local minima','no global minimum');
  assert.ok(q(-3)<q(-2));assert.ok(q(3)<q(2)); // Former endpoints are not minima on all real inputs.
});

test('rates transfer: negative scale reverses both turns and restricted endpoint directions',()=>{
  const id='poly-rates-transfer',f=x=>-.5*(x**3-12*x),xs=[-3,-2,2,3],ys=xs.map(f);
  assert.deepEqual(ys,[-4.5,-8,8,4.5]);says(id,'h(x)=−0.5(x³−12x)',list(ys),'=1.5');
  const state=cubicRates({a:-.5,k:4,left:-3,right:3,from:-3,to:3});
  assert.deepEqual(state.restricted.candidates.map(p=>p.y),ys);near(state.secant.rate,(f(3)-f(-3))/6);
  assert.equal(state.secant.rate,1.5);assert.equal(state.restricted.globalMinimum.value,-8);assert.equal(state.restricted.globalMaximum.value,8);
  assert.deepEqual(state.monotonicIntervals.map(x=>x.behavior),['decreasing','increasing','decreasing']);
  assert.equal(state.restricted.localExtrema[0].kind,'maximum');assert.equal(state.restricted.localExtrema.at(-1).kind,'minimum');
  assert.equal(state.tails.left,'positive-infinity');assert.equal(state.tails.right,'negative-infinity');
});

test('zeros warmup: the five-zero ledger, real sign changes and independently expanded product agree',()=>{
  const id='poly-zeros-warmup',f=x=>(x+2)**2*(x-1)*(x*x+9),coeff=[-36,0,23,9,3,1];
  for(const x of [-3,-2.1,-2,-1.9,0,.9,1,1.1,3])near(evaluate(coeff,x),f(x));
  assert.equal(f(0),-36);assert.equal(Math.sign(f(-2.1)),Math.sign(f(-1.9)));assert.notEqual(Math.sign(f(.9)),Math.sign(f(1.1)));
  assert.equal(2+1+1+1,5);
  for(const imaginary of [-3,3]){assert.equal(-(imaginary**2)+9,0);near(2*0*imaginary,0);} // Real/imaginary parts of (±3i)²+9; signed numeric zero is still zero.
  says(id,'p(x)=(x+2)²(x−1)(x²+9)','multiplicity 2','3i and −3i','only two distinct real intercepts','=−36');
});

test('zeros explorer: conjugate arrival, merged multiplicity and even/odd identities retain degree',()=>{
  const id='poly-zeros-explorer',initial=zeroStructure(scene(id).initial);
  assert.equal(initial.degree,4);assert.deepEqual(initial.realZeros,[{x:1,multiplicity:2,behavior:'touch'}]);
  assert.deepEqual(initial.zeroLedger.filter(z=>z.imaginary!==0),[{real:-1,imaginary:-1,multiplicity:1},{real:-1,imaginary:1,multiplicity:1}]);
  const arrival=zeroStructure({...scene(id).initial,v:0});assert.equal(arrival.degree,4);assert.equal(arrival.symmetry,'even');
  assert.deepEqual(arrival.realZeros.map(z=>[z.x,z.multiplicity]),[[-1,2],[1,2]]);
  const merged=zeroStructure({a:1,r:1,u:1,v:0,m:3});assert.equal(merged.degree,5);assert.deepEqual(merged.realZeros,[{x:1,multiplicity:5,behavior:'cross'}]);
  for(const m of [1,2]){const s=zeroStructure({a:1,r:0,u:0,v:2,m});assert.equal(s.symmetry,m===1?'odd':'even');for(const x of [-2,-.5,1])near(evaluate(s.coefficients,-x),(m===1?-1:1)*x**m*(x*x+4));}
  says(id,'−1±i','(x−1)⁵','multiplicity 5','x(x²+4)','x²(x²+4)');
});

test('zeros notes: neither-symmetry counterexample and zero-polynomial exception are correct',()=>{
  const id='poly-zeros-error-analysis',g=x=>(x-1)**2*(x*x+4);
  assert.deepEqual([g(2),g(-2),g(0)],[8,72,4]);
  const state=zeroStructure({a:1,r:1,m:2,u:0,v:2});assert.equal(state.degree,4);assert.equal(state.symmetry,'neither');
  says(id,'g(2)=8','g(−2)=72','g(0)=4','neither even nor odd','complex plane','no nonzero leading term');
  const zero=samplePolynomial({coefficients:[0],start:-1,step:1,count:2});assert.equal(zero.degree,null);assert.equal(zero.leadingCoefficient,null);assert.equal(zero.symmetry,'both');
});

test('zeros transfer: constructed scale, nonunit differences and a concrete finite-table alternative',()=>{
  const id='poly-zeros-transfer',f=x=>2*(x+1)**3*((x-2)**2+1),q=x=>2*x*x-3*x+1;
  assert.equal(f(0),10);const s=zeroStructure({a:2,r:-1,m:3,u:2,v:1});assert.equal(s.degree,5);assert.equal(s.leadingCoefficient,2);assert.equal(s.realZeros[0].behavior,'cross');
  for(const x of [-2,-.5,0,1,3])near(evaluate(s.coefficients,x),f(x));
  const xs=[-1,1,3,5],ys=xs.map(q),first=successive(ys),second=successive(first),rates=first.map(v=>v/2);
  assert.deepEqual(ys,[6,0,10,36]);assert.deepEqual(second,[16,16]);assert.deepEqual(rates,[-3,5,13]);
  says(id,'p(x)=2(x+1)³[(x−2)²+1]',list(ys),list(first),list(second),list(rates),'not a unique global rule');
  const sample=samplePolynomial({coefficients:[1,-3,2],start:-1,step:2,count:3});assert.deepEqual(sample.rows.map(r=>r.y),ys);assert.deepEqual(sample.intervals.map(r=>r.rate),rates);
  const alternative=x=>q(x)+(x+1)*(x-1)*(x-3)*(x-5);xs.forEach(x=>assert.equal(alternative(x),q(x)));assert.notEqual(alternative(0),q(0));
});

test('tails warmup: both finite signs can disagree with the eventual left tail',()=>{
  const id='poly-tails-warmup',q=x=>-2*x**5+7*x**3-9;
  assert.deepEqual([q(-2),q(2)],[-1,-17]);says(id,'q(x)=−2x⁵+7x³−9','q(−2)=−1','q(2)=−17','q(x)→+∞','q(x)→−∞');
  const state=samplePolynomial({coefficients:[-9,0,0,7,0,-2],start:-2,step:4,count:1});assert.equal(state.degree,5);assert.equal(state.leadingCoefficient,-2);
  const shifted=samplePolynomial({coefficients:[500,0,0,7,0,-2],start:-2,step:4,count:1});assert.deepEqual(shifted.tails,state.tails);assert.equal(state.tails.left,'positive-infinity');assert.equal(state.tails.right,'negative-infinity');
});

test('tails explorer: stated integer values, rounded ratio and relative/absolute comparison are consistent',()=>{
  const id='poly-tails-explorer',s=scene(id),first=polynomialTails(s.initial),wide=polynomialTails({...s.initial,window:24}),a=first.comparisonRows.at(-1),b=wide.comparisonRows.at(-1);
  assert.equal(4**4-8*4**3+1,-255);assert.equal(24**4-8*24**3+1,221185);
  assert.deepEqual([a.full,a.leading,a.absoluteDifference],[-255,256,511]);assert.deepEqual([b.full,b.leading,b.absoluteDifference],[221185,331776,110591]);
  assert.equal(b.ratio.toFixed(6),'0.666670');says(id,'p(4)=−255','absolute gap is 511','p(24)=221185','24⁴=331776','≈0.666670','absolute gap is 110591');
  assert.ok(Math.abs(b.ratio-1)<Math.abs(a.ratio-1));assert.ok(b.absoluteDifference>a.absoluteDifference);assert.deepEqual(first.tails,wide.tails);
  const odd=polynomialTails({...s.initial,n:5});assert.equal(odd.tails.left,'negative-infinity');assert.equal(odd.tails.right,'positive-infinity');
  assert.deepEqual(polynomialTails({...s.initial,n:1}).coefficients,[-7,1]);says(id,'x−7, not a quadratic');
});

test('tails notes: shrinking relative error can coexist with a growing absolute gap; constants are finite',()=>{
  const id='poly-tails-error-analysis',f=x=>x**3+2*x;
  const rows=[10,20].map(x=>({full:f(x),leading:x**3,ratio:f(x)/x**3,gap:Math.abs(f(x)-x**3)}));
  assert.deepEqual(rows,[{full:1020,leading:1000,ratio:1.02,gap:20},{full:8040,leading:8000,ratio:1.005,gap:40}]);
  says(id,'s(x)=x³+2x','1020 and 1000','ratio is 1.02','8040 and 8000','ratio is 1.005','absolute gap is 40');
  for(const x of [-20,-10,10,20])near(f(x)/x**3,1+2/(x*x));
  for(const c of [0,5]){const state=samplePolynomial({coefficients:[c],start:-1,step:1,count:2});assert.equal(state.degree,c===0?null:0);assert.deepEqual(state.tails,{left:'finite',right:'finite',finiteValue:c});}
});

test('tails transfer: negative even and odd leading terms match original factored and context claims',()=>{
  const id='poly-tails-transfer',r=x=>-.5*x**6+3*x**5-1,t=x=>-3*(x+2)**2*(x-1)**3;
  assert.equal(r(2),63);says(id,'r(x)=−0.5x⁶+3x⁵−1','r(2)=−32+96−1=63','−3x⁵','0≤x≤8','does not justify the extrapolation');
  const even=polynomialTails({a:-.5,n:6,b:3,c:-1,window:2});assert.equal(even.degree,6);assert.equal(even.tails.left,'negative-infinity');assert.equal(even.tails.right,'negative-infinity');
  const odd=zeroStructure({a:-3,r:1,m:3,u:-2,v:0});assert.equal(odd.degree,5);assert.equal(odd.leadingCoefficient,-3);assert.equal(odd.tails.left,'positive-infinity');assert.equal(odd.tails.right,'negative-infinity');
  for(const x of [-3,-1,0,2,3])near(evaluate(odd.coefficients,x),t(x));
});
