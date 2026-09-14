// Actual candidate component + unchanged visual helpers in Linkedom. Controlled
// DOM/event evidence only: no browser layout, remote services or mastery activity.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {dirname,resolve} from 'node:path';
const arg=name=>{const i=process.argv.indexOf(name);return i<0?null:process.argv[i+1];};
const location=dirname(fileURLToPath(import.meta.url));
const repo=resolve(arg('--repo')||resolve(location,location.endsWith('lesson-investigations')?'../..':'..'));
const {mountPolynomial}=await import(pathToFileURL(resolve(repo,'lessons/shared/investigations/polynomial-view.mjs')).href);
const {cubicRates,zeroStructure,polynomialTails}=await import(pathToFileURL(resolve(repo,'lessons/shared/investigations/ap-polynomial-model.mjs')).href);
const require = createRequire(import.meta.url);
const {parseHTML} = require(process.env.ECHS_TEST_DOM_MODULE || 'linkedom');
const cubic = {model:'polynomial',family:'cubic-rates',initial:{a:1,k:1,left:-4,right:4,from:-2,to:.5},controls:[{key:'k',label:'Shape parameter k',min:-4,max:4,step:.25}]};
const zeros = {model:'polynomial',family:'zero-structure',initial:{a:1,r:1,m:2,u:-1,v:1},controls:[
  {key:'r',label:'Real zero r',min:-4,max:4,step:.25},{key:'m',label:'Multiplicity m',min:1,max:4,step:1},
  {key:'u',label:'Conjugate real part u',min:-4,max:4,step:.25},{key:'v',label:'Conjugate imaginary magnitude v',min:0,max:4,step:.25},
]};
const tails = {model:'polynomial',family:'tails',initial:{a:1,n:4,b:-8,c:1,window:4},controls:[
  {key:'n',label:'Degree n',min:1,max:6,step:1},{key:'b',label:'Next coefficient b',min:-16,max:16,step:1},
  {key:'c',label:'Constant c',min:-16,max:16,step:1},{key:'window',label:'Window radius',min:1,max:25,step:1},
]};
const clone = value => structuredClone(value);
function fixture(scene = cubic) {
  const {window,document} = parseHTML('<html><body><main><p>Retained sibling</p></main></body></html>');
  const root = document.querySelector('main'), sibling = root.firstElementChild, tracked = [];
  const create = document.createElement.bind(document);
  document.createElement = (...args) => {
    const element = create(...args), active = new Map();
    const add = element.addEventListener.bind(element), remove = element.removeEventListener.bind(element);
    element.addEventListener = (type,fn,options) => { if(!active.has(type)) active.set(type,new Set());active.get(type).add(fn);add(type,fn,options); };
    element.removeEventListener = (type,fn,options) => {active.get(type)?.delete(fn);remove(type,fn,options);};
    tracked.push({element,active});return element;
  };
  // The component has no reason to touch a Window capability beyond its presence.
  const forbidden = new Proxy({}, {get() {throw new Error('Unexpected window capability');}});
  const view = mountPolynomial({root,window:forbidden,scene:clone(scene)});
  const q = selector => root.querySelector(selector), qa = selector => [...root.querySelectorAll(selector)];
  const fire = (element,type) => element.dispatchEvent(new window.Event(type,{bubbles:true}));
  const set = (key,value) => {const input=q(`[data-polynomial-control="${key}"]`);input.value=String(value);fire(input,'input');};
  const table = key => qa(`[data-polynomial-table="${key}"] tbody tr`).map(row=>[...row.children].map(cell=>cell.textContent));
  return {root,sibling,document,window,view,q,qa,set,table,fire,tracked};
}
const near = (actual,expected) => assert.ok(Math.abs(actual-expected) <= 1e-8*Math.max(1,Math.abs(expected)), `${actual} != ${expected}`);
const num = text => Number(text.replaceAll(',',''));
function xy(polyline) {return polyline.getAttribute('points').split(' ').map(pair=>pair.split(',').map(Number));}
function withinGraph(f) {
  for(const line of f.qa('[data-polynomial-real-graph] polyline')) for(const [x,y] of xy(line)) {
    assert.ok(Number.isFinite(x)&&Number.isFinite(y));assert.ok(x>=70-1e-7&&x<=570+1e-7);assert.ok(y>=42-1e-7&&y<=282+1e-7);
  }
  for(const point of f.qa('[data-polynomial-real-graph] circle')) {assert.ok(+point.getAttribute('cx')>=70-1e-7&&+point.getAttribute('cx')<=570+1e-7);assert.ok(+point.getAttribute('cy')>=42-1e-7&&+point.getAttribute('cy')<=282+1e-7);}
}

test('mount supplies semantic controls, captions, keyboard graph region and no window activity',()=>{
  const f=fixture();assert.equal(f.q('label').getAttribute('for'),f.q('input').id);assert.equal(f.q('output').getAttribute('for'),f.q('input').id);
  assert.equal(f.q('input').min,'-4');assert.equal(f.q('input').max,'4');assert.equal(f.q('input').step,'.25'.replace(/^\./,'0.'));
  assert.equal(f.q('.ei-graph-scroll').getAttribute('tabindex'),'0');assert.equal(f.q('.ei-graph-scroll').getAttribute('role'),'region');
  assert.ok(f.qa('caption').length>=4);assert.equal(f.q('tbody th').scope,'row');assert.equal(f.q('[data-polynomial-status]').getAttribute('aria-live'),'polite');
  assert.match(f.root.textContent,/finite samples/);assert.equal(f.q('[data-polynomial-error]').hidden,true);assert.equal(f.root.firstElementChild,f.sibling);f.view.dispose();
});
test('cubic plot contains both secant endpoints, full domain and analytic extrema on one scale',()=>{
  const f=fixture();
  for(const input of [{...cubic.initial,from:-4,to:4},{...cubic.initial,a:-2,k:4,from:3.5,to:-4},{...cubic.initial,left:-25,right:25,from:25,to:-25}]) {
    f.view.update(input);const model=cubicRates(input), first=xy(f.q('[data-polynomial-real-graph] polyline')), secant=xy(f.qa('[data-polynomial-real-graph] polyline')[1]);
    const min=Math.min(0,...model.restricted.candidates.map(p=>p.y)),max=Math.max(0,...model.restricted.candidates.map(p=>p.y)),pad=(max-min)*.08;
    for(let i=0;i<2;i++) {
      const p=model.secant.endpoints[i];near(secant[i][0],70+(p.x-input.left)/(input.right-input.left)*500);near(secant[i][1],282-(p.y-(min-pad))/(max-min+2*pad)*240);
      assert.ok(first.some(pair=>Math.abs(pair[0]-secant[i][0])<1e-8&&Math.abs(pair[1]-secant[i][1])<1e-8));
    }
    assert.equal(first[0][0],70);assert.equal(first.at(-1)[0],570);withinGraph(f);
    assert.equal(f.table('extrema').length,model.restricted.localExtrema.length);assert.match(f.q('[data-polynomial-secant]').textContent,new RegExp(`average rate = ${model.secant.rate.toLocaleString('en-US')}`));
  }
  f.view.dispose();
});
test('restricted endpoint extrema and stationary inflection are not confused with full-domain turns',()=>{
  const f=fixture();f.view.update({...cubic.initial,k:0,left:1,right:3,from:1,to:2});
  assert.deepEqual(f.table('extrema'),[['1','1','minimum','included left endpoint'],['3','27','maximum','included right endpoint']]);
  assert.deepEqual(f.table('monotonic'),[['(−∞, ∞)','increasing']]);assert.match(f.root.textContent,/stationary, but not a turning point/);assert.match(f.root.textContent,/0 turning points/);
  assert.match(f.root.textContent,/Global minimum 1 at x = 1/);assert.match(f.root.textContent,/Global maximum 27 at x = 3/);f.view.dispose();
});
test('dispatched input event updates cubic graph, rate and sample table from the same formula',()=>{
  const f=fixture(),before=f.q('[data-polynomial-real-graph] polyline').getAttribute('points');f.set('k',2);
  assert.equal(f.q('output').textContent,'2');assert.match(f.q('[data-polynomial-formula]').textContent,/x\^3 − 6x/);
  assert.match(f.q('[data-polynomial-secant]').textContent,/average rate = -2.75/);
  assert.notEqual(f.q('[data-polynomial-real-graph] polyline').getAttribute('points'),before);
  for(const [x,y] of f.table('samples')) {const t=num(x);assert.ok(Math.abs(num(y)-(t**3-6*t)) <= .0006 + .0005*(3*(Math.abs(t)+.001)**2+6));}
  assert.ok(f.table('samples').some(([x])=>x==='-2'));assert.ok(f.table('samples').some(([x])=>x==='0.5'));f.view.dispose();
});
test('zero ledger distinguishes real intercepts and a conjugate pair in a separate equal-scale plane',()=>{
  const f=fixture(zeros),rows=f.table('zeros');assert.deepEqual(rows,[['-1 − 1i','1','not a real x-intercept'],['-1 + 1i','1','not a real x-intercept'],['1','2','touch']]);
  assert.equal(f.qa('[data-polynomial-real-graph] circle').length,1);assert.equal(f.qa('[data-polynomial-complex-plane] circle').length,3);
  const points=f.qa('[data-polynomial-complex-plane] circle');for(const p of points) {near(+p.getAttribute('cx'),300+24* +p.getAttribute('data-real'));near(+p.getAttribute('cy'),160-24* +p.getAttribute('data-imaginary'));}
  assert.equal(points[0].getAttribute('cx'),points[1].getAttribute('cx'));assert.match(f.root.textContent,/Real multiplicity 2 \+ nonreal multiplicity 2 = degree 4/);
  assert.match(f.q('[data-polynomial-complex-plane]').textContent,/Real part/);assert.match(f.q('[data-polynomial-complex-plane]').textContent,/Imaginary part/);withinGraph(f);f.view.dispose();
});
test('coalescing real zeros combine multiplicity and change the sign ledger without adding duplicate dots',()=>{
  const f=fixture(zeros);f.set('u',1);f.set('v',0);f.set('m',3);
  assert.deepEqual(f.table('zeros'),[['1','5','cross']]);assert.deepEqual(f.table('signs'),[['(−∞, 1)','negative'],['(1, ∞)','positive']]);
  assert.equal(f.qa('[data-polynomial-real-graph] circle').length,1);assert.equal(f.qa('[data-polynomial-complex-plane] circle').length,1);
  assert.equal(f.q('[data-polynomial-complex-plane] circle').getAttribute('data-multiplicity'),'5');
  assert.match(f.root.textContent,/Real multiplicity 5 \+ nonreal multiplicity 0 = degree 5/);assert.match(f.root.textContent,/No turning-point count is inferred/);f.view.dispose();
});
test('negative scale reverses zero signs and tails while preserving the declared zero locations',()=>{
  const f=fixture(zeros);f.view.update({...zeros.initial,a:-1,r:0,u:0,v:0,m:4});
  assert.deepEqual(f.table('zeros'),[['0','6','touch']]);assert.deepEqual(f.table('signs'),[['(−∞, 0)','negative'],['(0, ∞)','negative']]);
  assert.match(f.root.textContent,/Symmetry: even/);assert.match(f.q('[data-polynomial-tails]').textContent,/x → −∞, p\(x\) → −∞; as x → \+∞, p\(x\) → −∞/);f.view.dispose();
});
test('tails compare ratio and absolute gap as different values; n=1 uses the combined constant',()=>{
  const f=fixture(tails);assert.deepEqual(f.table('tails').map(row=>num(row[5])),[513,65,63,511]);
  assert.deepEqual(f.table('tails').map(row=>num(row[3])),[3.004,5.063,-2.938,-0.996]);
  assert.match(f.root.textContent,/Absolute gap = \|p\(x\) − ax\^n\|/);assert.match(f.root.textContent,/does not require an absolute vertical difference approaching zero/);
  f.view.update({...tails.initial,n:1,b:-3,c:5});assert.equal(f.q('[data-polynomial-formula]').textContent,'p(x) = x + 2');
  assert.deepEqual(f.table('tails').map(row=>num(row[5])),[2,2,2,2]);assert.deepEqual(f.table('tails').map(row=>num(row[3])),[.5,0,2,1.5]);withinGraph(f);f.view.dispose();
});
test('maximum degree/window and signed tail cases produce finite shared plot coordinates',()=>{
  const f=fixture(tails);
  for(const a of [-4,.25,4]) for(const n of [1,5,6]) {
    const input={a,n,b:16,c:-16,window:25};f.view.update(input);withinGraph(f);
    const expected=polynomialTails(input), rows=f.table('tails');
    assert.equal(rows.length,4);rows.forEach((row,i)=>{near(num(row[0]),expected.comparisonRows[i].x);assert.ok(num(row[5])>=0);});
    assert.equal(f.qa('[data-polynomial-real-graph] polyline').length,2);
  }
  f.view.dispose();
});
test('malformed scene/control boundaries reject before adding owned DOM',()=>{
  const negatives=[null,{}, {...cubic,model:null},{...cubic,family:'eval'}, {...cubic,initial:{k:1}}, {...cubic,initial:{...cubic.initial,extra:0}},
    {...cubic,controls:[{...cubic.controls[0],key:'unknown'}]}, {...cubic,controls:[...cubic.controls,...cubic.controls]},
    {...cubic,controls:[{...cubic.controls[0],label:''}]}, {...cubic,controls:[{...cubic.controls[0],step:0}]},
    {...cubic,controls:[{...cubic.controls[0],min:2}]}, {...zeros,controls:[{...zeros.controls[1],step:.5}]}];
  for(const scene of negatives) {const {document}=parseHTML('<main><p>Keep</p></main>'),root=document.querySelector('main');assert.throws(()=>mountPolynomial({root,window:{},scene}),RangeError);assert.equal(root.innerHTML,'<p>Keep</p>');}
  let calls=0;const hostile={...cubic};Object.defineProperty(hostile,'initial',{get(){calls++;throw Error('getter');},enumerable:true});
  const {document}=parseHTML('<main></main>');assert.throws(()=>mountPolynomial({root:document.querySelector('main'),window:{},scene:hostile}),RangeError);assert.equal(calls,0);
});
test('invalid programmatic updates are atomic and invalid events retain values with a bounded inline error',()=>{
  const f=fixture();const before=f.q('.ei-polynomial-results').innerHTML;
  for(const input of [{...cubic.initial,from:.5},{...cubic.initial,k:5},{...cubic.initial,a:0},{...cubic.initial,k:NaN},{k:2}]) assert.throws(()=>f.view.update(input),RangeError);
  assert.equal(f.q('.ei-polynomial-results').innerHTML,before);assert.equal(f.q('input').value,'1');
  for(const value of ['not-a-number','','9']) {f.set('k',value);assert.equal(f.q('.ei-polynomial-results').innerHTML,before);assert.equal(f.q('input').value,'1');assert.equal(f.q('[data-polynomial-error]').hidden,false);assert.match(f.q('[data-polynomial-error]').textContent,/previous graph and values are retained/);}
  f.set('k',0);assert.equal(f.q('[data-polynomial-error]').hidden,true);assert.equal(f.q('[data-polynomial-error]').textContent,'');f.view.dispose();
});
test('captured inputs reset independently of caller mutation and each mount has distinct label IDs',()=>{
  const f=fixture(),scene=clone(cubic),second=mountPolynomial({root:f.root,window:{},scene});
  scene.initial.k=4;scene.controls[0].max=1;scene.controls[0].label='Changed outside';
  assert.equal(new Set(f.qa('input').map(n=>n.id)).size,2);const secondInput=f.qa('input')[1];secondInput.value='3';f.fire(secondInput,'input');
  assert.equal(f.qa('output')[1].textContent,'3');f.fire(f.qa('[data-polynomial-reset]')[1],'click');assert.equal(secondInput.value,'1');
  assert.equal(f.qa('label')[1].textContent,'Shape parameter k');assert.equal(f.q('input').value,'1');second.dispose();f.view.dispose();
});
test('dispose removes owned listeners/subtree, is idempotent, and cannot be revived by retained nodes',()=>{
  const f=fixture(zeros),oldInput=f.q('input'),oldReset=f.q('[data-polynomial-reset]');
  assert.ok(f.tracked.some(row=>[...row.active.values()].some(set=>set.size)));
  f.view.dispose();f.view.dispose();oldInput.value='4';f.fire(oldInput,'input');f.fire(oldReset,'click');
  assert.deepEqual([...f.root.children],[f.sibling]);for(const row of f.tracked) for(const set of row.active.values()) assert.equal(set.size,0);
  assert.throws(()=>f.view.update(zeros.initial),/disposed/);
});
test('a valid very narrow restricted domain and reverse secant still render without a sample-step failure',()=>{
  const f=fixture();f.view.update({...cubic.initial,left:24.9998,right:25,from:25,to:24.9998});withinGraph(f);
  assert.ok(f.table('samples').length>0);assert.equal(f.qa('[data-polynomial-real-graph] circle').length,4);f.view.dispose();
});
