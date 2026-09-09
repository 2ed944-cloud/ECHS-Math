import test from 'node:test';
import assert from 'node:assert/strict';
import katex from '../../lessons/ib-math-ai/unit-1/assets/js/katex.js';
import {IB13_REFERENCE as reference} from '../../js/lesson-studio/ib13-reference.mjs';
import {NATIVE_IB13} from './native-ib13.mjs';

const near=(actual,expected)=>assert.ok(Math.abs(actual-expected)<=1e-10*Math.max(1,Math.abs(expected)),`${actual} versus ${expected}`);
const terms=(a,r,n)=>{const result=[];let value=a;for(let index=0;index<n;index++){result.push(value);value*=r;}return result;};
const sum=(a,r,n)=>r===1?a*n:a*(1-r**n)/(1-r);
function nodes(value,predicate,result=[]){if(value&&typeof value==='object'){if(predicate(value))result.push(value);Object.values(value).forEach(child=>nodes(child,predicate,result));}return result;}
const content=index=>JSON.stringify(reference.slides[index-1].nativeSlide);

test('every authored expression compiles with strict actual KaTeX and reviewed spoken alternatives',()=>{
  const sources=nodes(reference.slides.filter(row=>row.nativeSlide),node=>node.mode==='tex');assert.ok(sources.length>=35);
  for(const source of sources)assert.doesNotThrow(()=>katex.renderToString(source.tex,{throwOnError:true,strict:'error',trust:false,maxExpand:100,maxSize:20}));
  const math=nodes(reference.slides.filter(row=>row.nativeSlide),node=>node.source?.mode==='tex');
  assert.equal(math.length,sources.length);for(const node of math)assert.ok(typeof node.spoken==='string'&&node.spoken.length>=10);
});

test('reviewed ratio and difference examples agree with independent arithmetic',()=>{
  const arithmetic=[4,7,10,13],geometric=[4,12,36,108],ratio=[18,54,162,486];
  assert.deepEqual(arithmetic.slice(1).map((v,i)=>v-arithmetic[i]),[3,3,3]);
  for(const sequence of [geometric,ratio])assert.deepEqual(sequence.slice(1).map((v,i)=>v/sequence[i]),[3,3,3]);
  near(120/100,1.2);near(144/120,1.2);near(80/100,.8);near(64/80,.8);
  assert.match(content(8),/54\/18=3/);assert.match(content(13),/0\.8/);
});

test('six ratio cases separate sign and magnitude, including negative initial and zero exceptions',()=>{
  for(const a of [5,-5])for(const r of [2,.5,1,-.5,-1,-2]){
    const sequence=terms(a,r,5);for(let i=1;i<sequence.length;i++){
      assert.equal(Math.sign(sequence[i])===Math.sign(sequence[i-1]),r>0);
      assert.equal(Math.sign(Math.abs(sequence[i])-Math.abs(sequence[i-1])),Math.sign(Math.abs(r)-1));
    }
  }
  assert.deepEqual(terms(0,2,4),[0,0,0,0]);assert.deepEqual(terms(7,0,4),[7,0,0,0]);
  assert.match(content(9),/nonzero/);assert.match(content(9),/more negative/);
});

test('separated-term parity supports both real signs only for positive even-gap quotient',()=>{
  for(const r of [-3,-.5,.5,3])for(const p of [1,3])for(const gap of [1,2,3,4]){
    const q=p+gap,sequence=terms(7,r,q);near(sequence[q-1]/sequence[p-1],r**gap);
    if(gap%2===0)assert.ok(r**gap>0);else assert.equal(Math.sign(r**gap),Math.sign(r));
  }
  assert.match(content(26),/both given terms are nonzero/);assert.match(content(26),/none when c is negative/);
});

test('strict integer thresholds and adjacent checks match iterative growth and decay including exact boundaries',()=>{
  for(const [a,r,threshold,expected]of [[2,2,8,4],[10,2,9,1],[3,1.5,15,5],[16,.5,4,4],[3,.5,4,1],[100,.8,41,5]]){
    const qualifies=value=>r>1?value>threshold:value<threshold;let n=1,value=a;while(!qualifies(value)&&n<100){value*=r;n++;}
    assert.equal(n,expected);assert.ok(qualifies(a*r**(n-1)));if(n>1)assert.equal(qualifies(a*r**(n-2)),false);
    const boundary=Math.log(threshold/a)/Math.log(r);assert.ok(n-1>boundary-1e-12); // exact comparisons above govern strictness, not tolerance
  }
  for(const index of [34,35,37,39])assert.match(content(index),/positive|Positive/);
  assert.match(content(35),/strict/);assert.match(content(37),/reverses/);assert.match(content(39),/monotone/);
});

test('finite-sum identities agree with direct addition for signed, zero, unit and fractional ratios',()=>{
  for(const a of [0,3,-7])for(const r of [-3,-1,-.5,0,.25,1,2])for(const n of [1,2,7,12]){
    const direct=terms(a,r,n).reduce((x,y)=>x+y,0);near(sum(a,r,n),direct);
    if(r!==1)near(a*(r**n-1)/(r-1),direct);
    near((1-r)*direct,a*(1-r**n));
  }
  assert.match(content(44),/finite-sum derivation/);assert.match(content(45),/r=1/);assert.match(content(45),/dividing by zero/);
});

test('sigma endpoints and shifted sums use the first included term and inclusive count',()=>{
  const sequence=terms(5,2,12);assert.equal(sequence.slice(0,8).length,8);assert.equal(sequence.slice(0,8).reduce((a,b)=>a+b,0),1275);
  for(const [p,q]of [[1,1],[1,8],[3,7],[12,12]]){
    const selected=sequence.slice(p-1,q);assert.equal(selected.length,q-p+1);near(sum(sequence[p-1],2,q-p+1),selected.reduce((a,b)=>a+b,0));
  }
  assert.match(content(42),/k=1/);assert.match(content(43),/q-p\+1/);assert.match(content(43),/exactly one term/);
});

test('all three runtime sigma presets retain exact expressions, bounds, first terms and inclusive counts',()=>{
  const cases=[
    {tex:'\\sum_{k=1}^{8}5(2)^{k-1}',low:1,high:8,term:k=>5*2**(k-1),first:5,count:8,total:1275},
    {tex:'\\sum_{r=3}^{9}4(1.5)^{r-1}',low:3,high:9,term:r=>4*1.5**(r-1),first:9,count:7,total:289.546875},
    {tex:'\\sum_{j=0}^{5}12(-0.5)^j',low:0,high:5,term:j=>12*(-.5)**j,first:12,count:6,total:7.875}
  ];
  const slide=reference.slides[41].nativeSlide,expressions=nodes(slide,node=>node.mode==='tex').map(node=>node.tex);
  for(const item of cases){
    assert.ok(expressions.includes(item.tex),item.tex);
    const direct=[];for(let index=item.low;index<=item.high;index++)direct.push(item.term(index));
    assert.equal(direct.length,item.count);assert.equal(direct[0],item.first);near(direct.reduce((a,b)=>a+b,0),item.total);
  }
  const comparison=slide.blocks.filter(block=>block.type==='table').at(-1);
  assert.deepEqual(comparison.content.rows.map(row=>row.cells[2][0].text),['8 − 1 + 1 = 8','9 − 3 + 1 = 7','5 − 0 + 1 = 6']);
  assert.match(content(42),/r is the running index/);assert.match(content(42),/index 0 is valid/);
  assert.match(reference.slides[41].reviewNotes.join(' '),/controls remain in the original/);
});

test('compounding and synthetic residual table preserve exact values and stated rounding',()=>{
  assert.equal(11**3,1331);near(1.1**3,1331/1000);near((1.1**3-1)*100,33.1);near(1+3*.1,1.3);
  const observed=[100,121,143,174],model=terms(100,1.2,4),expected=['1.000','1.008','0.993','1.007'];
  assert.deepEqual(observed.map((value,index)=>(value/model[index]).toFixed(3)),expected);
  const table=reference.slides[61].nativeSlide.blocks.find(block=>block.type==='table');
  assert.deepEqual(table.content.rows.map(row=>row.cells[3][0].text),expected);assert.match(content(62),/synthetic/);
});

test('financial time-zero indexing and cumulative interpretation remain explicit',()=>{
  for(const n of [0,1,4,10])near(terms(100,1.05,n+1)[n],100*(1+.05)**n);
  assert.match(content(72),/time 0/);assert.match(content(72),/completed periods/);assert.match(content(55),/count the same material/);
});

test('mathematical review exceptions and official scope stay explicit',()=>{
  assert.equal(Object.keys(NATIVE_IB13).length,20);assert.equal(NATIVE_IB13[69],undefined);
  assert.equal(reference.slides[68].disposition,'reference');assert.equal(reference.slides[72].disposition,'reference');
  assert.match(reference.slides[72].reason,/AHL 1\.11/);assert.match(reference.review.objectivePolicy,/Teacher-entered/);
});
