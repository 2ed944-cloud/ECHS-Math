import assert from 'node:assert/strict';
import test from 'node:test';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {dirname,resolve} from 'node:path';
const arg=name=>{const i=process.argv.indexOf(name);return i<0?null:process.argv[i+1];};
const location=dirname(fileURLToPath(import.meta.url));
const repo=resolve(arg('--repo')||resolve(location,location.endsWith('lesson-investigations')?'../..':'..'));
const {cubicRates,zeroStructure,polynomialTails,samplePolynomial,AP_POLYNOMIAL_MODEL_VERSION}=await import(pathToFileURL(resolve(repo,'lessons/shared/investigations/ap-polynomial-model.mjs')).href);
const near=(a,b,tolerance=1e-9)=>assert.ok(Math.abs(a-b)<=tolerance*Math.max(1,Math.abs(b)),`${a} != ${b}`);
const evalCoefficients=(coeff,x)=>coeff.reduce((sum,c,i)=>sum+c*x**i,0);
const invalid=fn=>assert.throws(fn,e=>e instanceof RangeError&&e.message==='Invalid AP polynomial model input.');
const deepFrozen=value=>{if(value&&typeof value==='object'){assert.equal(Object.isFrozen(value),true);Object.values(value).forEach(deepFrozen);}};
const all=[cubicRates,zeroStructure,polynomialTails,samplePolynomial];

test('all models are versioned immutable records with declared-model limitations',()=>{
  for(const fn of all){const state=fn();deepFrozen(state);assert.equal(state.version,AP_POLYNOMIAL_MODEL_VERSION);assert.match(state.assumption,/Finite samples do not uniquely/);}
  const input={a:1,k:1};const state=cubicRates(input);input.k=-1;assert.equal(state.input.k,1);
  const coefficients=[1,2,3],sample=samplePolynomial({coefficients});coefficients[0]=99;assert.equal(sample.input.coefficients[0],1);
});
test('cubic secants agree with independent endpoint subtraction and reverse correctly',()=>{
  for(const a of [-4,-1,-.25,.25,1,4])for(const k of [-4,-.25,0,.25,1,4]){
    const opts={a,k,left:-5,right:5,from:-3,to:2},state=cubicRates(opts),back=cubicRates({...opts,from:2,to:-3}),f=x=>a*(x**3-3*k*x);
    state.secant.endpoints.forEach(p=>near(p.y,f(p.x)));near(state.secant.rate,(f(2)-f(-3))/5);
    near(back.secant.rate,state.secant.rate);near(back.secant.change,-state.secant.change);
    for(const x of [-5,-.75,0,2,5])near(evalCoefficients(state.coefficients,x),f(x));
  }
});
test('cubic turns, stationary inflection and monotone cases are distinct',()=>{
  for(const a of [-2,1]){
    const turns=cubicRates({a,k:4});assert.equal(turns.turningPoints.length,2);assert.equal(turns.inflection.stationary,false);
    assert.deepEqual(turns.turningPoints.map(p=>p.x),[-2,2]);
    assert.deepEqual(turns.turningPoints.map(p=>p.kind),a>0?['maximum','minimum']:['minimum','maximum']);
    for(const p of turns.turningPoints){const f=x=>a*(x**3-12*x);near(p.y,f(p.x));assert.ok(p.kind==='maximum'?p.y>f(p.x+.01)&&p.y>f(p.x-.01):p.y<f(p.x+.01)&&p.y<f(p.x-.01));}
    const flat=cubicRates({a,k:0});assert.equal(flat.turningPoints.length,0);assert.equal(flat.inflection.stationary,true);assert.equal(flat.zeroLedger[0].multiplicity,3);
    const mono=cubicRates({a,k:-1});assert.equal(mono.turningPoints.length,0);assert.equal(mono.inflection.stationary,false);assert.equal(mono.monotonicIntervals.length,1);
    assert.equal(mono.monotonicIntervals[0].behavior,a>0?'increasing':'decreasing');
    assert.equal(mono.zeroLedger.filter(z=>z.imaginary!==0).length,2);
  }
});
test('restricted extrema inspect every turn and the two included endpoints',()=>{
  const state=cubicRates({k:1,left:-2,right:1,from:-2,to:1});
  assert.equal(state.restricted.candidates.length,3);
  assert.equal(state.restricted.localExtrema[0].kind,'minimum');
  assert.equal(state.restricted.localExtrema.at(-1).kind,'minimum');
  assert.deepEqual(state.restricted.globalMinimum,{value:-2,points:[-2,1]});
  assert.deepEqual(state.restricted.globalMaximum,{value:2,points:[-1]});
  const exactBoundary=cubicRates({left:-1,right:1,from:-1,to:1});
  assert.equal(exactBoundary.restricted.candidates.length,2);
  assert.equal(exactBoundary.restricted.localExtrema[0].kind,'maximum');
  assert.equal(exactBoundary.restricted.localExtrema[1].kind,'minimum');
  for(const a of [-4,1])for(const k of [-2,0,.25,4])for(const [left,right] of [[-4,4],[-3,-.5],[.5,3]]){
    const result=cubicRates({a,k,left,right,from:left,to:right}),min=result.restricted.globalMinimum.value,max=result.restricted.globalMaximum.value;
    for(let i=0;i<=500;i++){const x=left+(right-left)*i/500,y=a*(x**3-3*k*x);assert.ok(y>=min-1e-8&&y<=max+1e-8);}
  }
});
test('cubic zero ledger counts three zeros in all parameter regimes',()=>{
  for(const k of [-4,-1,0,.5,4]){
    const state=cubicRates({k});assert.equal(state.zeroLedger.reduce((s,z)=>s+z.multiplicity,0),3);
    for(const z of state.zeroLedger){
      // Re(z³−3kz), Im(z³−3kz), computed without the model evaluator.
      near(z.real**3-3*z.real*z.imaginary**2-3*k*z.real,0);
      near(3*z.real**2*z.imaginary-z.imaginary**3-3*k*z.imaginary,0);
    }
  }
});
test('factored model expansion agrees with independent products across its bounded family',()=>{
  for(const a of [-4,.25,2])for(const r of [-4,0,1])for(const m of [1,2,3,4])for(const u of [-2,0,4])for(const v of [0,.5,4]){
    const result=zeroStructure({a,r,m,u,v});assert.equal(result.degree,m+2);assert.equal(result.leadingCoefficient,a);
    assert.equal(result.zeroLedger.reduce((s,z)=>s+z.multiplicity,0),m+2);
    for(const x of [-5,-.75,0,1.25,5])near(evalCoefficients(result.coefficients,x),a*(x-r)**m*((x-u)**2+v*v));
  }
});
test('conjugate arrival and collision merge multiplicities without losing degree',()=>{
  const complex=zeroStructure({r:2,m:3,u:2,v:1});
  assert.equal(complex.realZeroMultiplicity,3);assert.equal(complex.nonrealZeroMultiplicity,2);assert.equal(complex.realZeros.length,1);
  const merged=zeroStructure({r:2,m:3,u:2,v:0});
  assert.deepEqual(merged.zeroLedger,[{real:2,imaginary:0,multiplicity:5}]);
  assert.deepEqual(merged.realZeros,[{x:2,multiplicity:5,behavior:'cross'}]);
  const separate=zeroStructure({r:2,m:3,u:-1,v:0});assert.equal(separate.realZeros.length,2);assert.equal(separate.realZeroMultiplicity,5);
});
test('sign strips use merged multiplicities and actual factor signs',()=>{
  for(const a of [-1,1])for(const m of [1,2,3,4])for(const v of [0,1])for(const u of [-1,2]){
    const result=zeroStructure({a,r:2,m,u,v});
    for(const interval of result.signIntervals){
      const x=interval.left===null?interval.right-1:interval.right===null?interval.left+1:(interval.left+interval.right)/2;
      const y=a*(x-2)**m*((x-u)**2+v*v);assert.equal(Math.sign(y),interval.sign);
    }
    for(const zero of result.realZeros){
      const left=a*(zero.x-.001-2)**m*((zero.x-.001-u)**2+v*v),right=a*(zero.x+.001-2)**m*((zero.x+.001-u)**2+v*v);
      assert.equal(Math.sign(left)===Math.sign(right),zero.behavior==='touch');
    }
  }
});
test('factor symmetry distinguishes degree parity from function parity',()=>{
  assert.equal(zeroStructure({r:0,m:1,u:0,v:2}).symmetry,'odd');
  assert.equal(zeroStructure({r:0,m:2,u:0,v:2}).symmetry,'even');
  assert.equal(zeroStructure({r:.1,m:2,u:-.1,v:0}).symmetry,'even');
  assert.equal(zeroStructure({r:1,m:2,u:0,v:1}).symmetry,'neither');
});
test('all tail parity/sign cases normalize their actual polynomial coefficients',()=>{
  for(const n of [1,2,3,4,5,6])for(const a of [-4,-.25,.25,4]){
    const result=polynomialTails({a,n,b:-3,c:2});assert.equal(result.degree,n);assert.equal(result.leadingCoefficient,a);
    assert.equal(result.tails.right,a>0?'positive-infinity':'negative-infinity');
    assert.equal(result.tails.left,(a>0)===(n%2===0)?'positive-infinity':'negative-infinity');
    for(const row of result.comparisonRows){near(row.full,a*row.x**n-3*row.x**(n-1)+2);near(row.leading,a*row.x**n);near(row.ratio,row.full/row.leading);near(row.relativeDifference,(row.full-row.leading)/row.leading);near(row.absoluteDifference,Math.abs(row.full-row.leading));assert.ok(row.absoluteDifference>=0);}
  }
  assert.deepEqual(polynomialTails({n:1,a:2,b:3,c:-3}).coefficients,[0,2]);
});
test('misleading finite window cannot change tails and relative agreement is not zero vertical gap',()=>{
  const nearWindow=polynomialTails({window:4}),farWindow=polynomialTails({window:24});
  assert.ok(nearWindow.comparisonRows.at(-1).full<0);assert.ok(farWindow.comparisonRows.at(-1).full>0);
  assert.deepEqual(nearWindow.tails,farWindow.tails);assert.equal(farWindow.tails.right,'positive-infinity');
  assert.ok(Math.abs(farWindow.comparisonRows.at(-1).ratio-1)<Math.abs(nearWindow.comparisonRows.at(-1).ratio-1));
  assert.ok(Math.abs(farWindow.comparisonRows.at(-1).absoluteDifference)>Math.abs(nearWindow.comparisonRows.at(-1).absoluteDifference));
});
test('sample rows, AROCs and successive differences retain nonunit dimensions',()=>{
  const state=samplePolynomial({coefficients:[1,-2,3],start:-1,step:2,count:5});
  assert.equal(state.rows.length,6);assert.equal(state.intervals.length,5);assert.equal(state.differences.length,5);
  state.rows.forEach(row=>near(row.y,1-2*row.x+3*row.x**2));
  state.intervals.forEach(row=>near(row.rate,3*(row.left+row.right)-2));
  state.differences[1].values.forEach(v=>near(v,24));
  const cubic=samplePolynomial({coefficients:[0,-3,0,1],start:-2,step:.5,count:8});
  cubic.differences[2].values.forEach(v=>near(v,6*.5**3));
});
test('zero/constant sample polynomials have finite tails and correct identity classification',()=>{
  const zero=samplePolynomial({coefficients:[0,0,0]});assert.equal(zero.degree,null);assert.equal(zero.leadingCoefficient,null);assert.equal(zero.symmetry,'both');assert.deepEqual(zero.tails,{left:'finite',right:'finite',finiteValue:0});
  const constant=samplePolynomial({coefficients:[5,0,0]});assert.equal(constant.degree,0);assert.equal(constant.symmetry,'even');assert.deepEqual(constant.coefficients,[5]);
  assert.equal(samplePolynomial({coefficients:[0,1,0,2]}).symmetry,'odd');
  assert.equal(samplePolynomial({coefficients:[1,1]}).symmetry,'neither');
});
test('reject malformed records and accessors without invoking getters',()=>{
  for(const fn of all)for(const value of [null,false,1,'',[],new Date(),Object.create({}),{extra:1}])invalid(()=>fn(value));
  for(const fn of [cubicRates,zeroStructure,polynomialTails])for(const a of [NaN,Infinity,-Infinity,'1',0,.01,5])invalid(()=>fn({a}));
  let called=0;const getter={};Object.defineProperty(getter,'a',{enumerable:true,get(){called++;throw Error('private');}});invalid(()=>cubicRates(getter));assert.equal(called,0);
  const revoked=Proxy.revocable({},{});revoked.revoke();for(const fn of all)invalid(()=>fn(revoked.proxy));
  const symbol={};symbol[Symbol('extra')]=1;for(const fn of all)invalid(()=>fn(symbol));
});
test('reject family limits and invalid interval/sample geometry',()=>{
  for(const opts of [{k:5},{left:3,right:2},{left:0,right:0},{from:1,to:1},{from:-6},{to:6},{right:26}])invalid(()=>cubicRates(opts));
  for(const opts of [{m:0},{m:1.5},{m:5},{r:5},{u:-5},{v:-1},{v:5}])invalid(()=>zeroStructure(opts));
  for(const opts of [{n:0},{n:7},{n:2.5},{b:17},{c:-17},{window:0},{window:26}])invalid(()=>polynomialTails(opts));
  for(const opts of [{step:0},{step:6},{count:0},{count:129},{count:2.5},{start:26},{start:24,step:1,count:2}])invalid(()=>samplePolynomial(opts));
  for(const c of [[],[NaN],[Infinity],[100001],Array(8).fill(1),[,1]])invalid(()=>samplePolynomial({coefficients:c}));
  const getter=[1,2];let called=0;Object.defineProperty(getter,'0',{get(){called++;return 1;}});invalid(()=>samplePolynomial({coefficients:getter}));assert.equal(called,0);
  const extra=[1,2];extra.note=1;invalid(()=>samplePolynomial({coefficients:extra}));
});
