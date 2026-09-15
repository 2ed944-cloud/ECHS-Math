import assert from 'node:assert/strict';
import test from 'node:test';
import {createRequire} from 'node:module';
import {resolve,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const require=createRequire(import.meta.url),{parseHTML}=require(process.env.ECHS_TEST_DOM_MODULE||'linkedom');
const i=process.argv.indexOf('--repo'),repo=resolve(i<0?resolve(dirname(fileURLToPath(import.meta.url)),'../..'):process.argv[i+1]);
const {mountEquivalence}=await import(pathToFileURL(resolve(repo,'lessons/shared/investigations/equivalence-view.mjs')));
const {AP_EQUIVALENCE_CONTENT}=await import(pathToFileURL(resolve(repo,'lessons/shared/investigations/ap-equivalence-content.mjs')));
const q={a:1,b:1,c:2,r:3},bin={a:2,b:-1,n:3};
const controls=input=>Object.keys(input).map(key=>({key,label:`Control ${key}`,min:key==='n'?1:-4,max:key==='n'?8:4,step:key==='n'?1:.25}));
const scene=(family='quotient-remainder',initial=family==='binomial'?bin:q,list=controls(initial))=>({model:'equivalence',family,initial:{...initial},controls:list.map(value=>({...value}))});
function mount(data=scene()) {
  const {window,document}=parseHTML('<html><body><main><p id="retained">Retained sibling</p></main></body></html>');
  const root=document.querySelector('main'),view=mountEquivalence({root,window,scene:data});
  return {window,document,root,view};
}
const tableRows=(h,key)=>[...h.root.querySelectorAll(`[data-equivalence-table="${key}"] tbody tr`)].map(row=>[...row.children].map(cell=>cell.textContent));
const text=(h,key)=>h.root.querySelector(`[data-equivalence-${key}]`).textContent;
const near=(a,b)=>assert.ok(Number.isFinite(a)&&Math.abs(a-b)<1e-8*Math.max(1,Math.abs(b)),`${a} != ${b}`);
const plot=h=>h.root.querySelector('[data-equivalence-plot]');
const decode=(svg,x,y)=>({x:-5+(x-70)/50,y:Number(svg.dataset.ymin)+(282-y)/240*(Number(svg.dataset.ymax)-Number(svg.dataset.ymin))});
function assertQuotient(h,input) {
  const svg=plot(h),paths=svg.querySelectorAll('[data-equivalence-branch]');
  assert.ok(paths.length>0);assert.ok(svg.querySelector('clipPath rect'));
  const xmin=-5,xmax=5;
  for(const path of paths) {
    const points=path.getAttribute('points').split(' ').map(pair=>{
      const [x,y]=pair.split(',').map(Number);
      assert.ok(x>=70-1e-8&&x<=570+1e-8&&y>=42-1e-8&&y<=282+1e-8,'graph omits out-of-bounds points instead of clamping');
      const point=decode(svg,x,y);assert.notEqual(point.x,input.c);
      near(point.y,input.a*point.x+input.b+input.r/(point.x-input.c));return point;
    });
    assert.ok(!(points[0].x<input.c&&points.at(-1).x>input.c),'no solid function path crosses an original exclusion');
  }
  const trend=svg.querySelector('[data-equivalence-trend]');
  const first=decode(svg,Number(trend.getAttribute('x1')),Number(trend.getAttribute('y1'))),last=decode(svg,Number(trend.getAttribute('x2')),Number(trend.getAttribute('y2')));
  near(first.x,xmin);near(last.x,xmax);near(first.y,input.a*xmin+input.b);near(last.y,input.a*xmax+input.b);
  assert.ok(trend.getAttribute('stroke-dasharray'));
  const hole=svg.querySelector('[data-equivalence-hole]'),pole=svg.querySelector('[data-equivalence-pole]');
  assert.equal(!!hole,input.r===0);assert.equal(!!pole,input.r!==0);
  if(hole){const x=Number(hole.getAttribute('cx')),y=Number(hole.getAttribute('cy'));assert.ok(x>=76&&x<=564&&y>=48&&y<=276);const point=decode(svg,x,y);near(point.x,input.c);near(point.y,input.a*input.c+input.b);assert.equal(hole.getAttribute('fill'),'#fff');assert.match(hole.querySelector('title').textContent,/undefined/);}
  const sampleRows=tableRows(h,'samples');
  for(const row of sampleRows) {
    const x=Number(row[0]);assert.equal(Number(row[2]),input.a*x+input.b);
    if(x===input.c){assert.equal(row[1],'undefined');assert.equal(row[3],'undefined');assert.equal(row[4],input.r===0?'excluded hole':'excluded pole');}
    else{near(Number(row[1]),input.a*x+input.b+input.r/(x-input.c));near(Number(row[3]),input.r/(x-input.c));}
  }
  assert.ok(sampleRows.some(row=>Number(row[0])===input.c),'table includes every original exclusion');
}
function convolution(a,b,n) {
  let row=[1];
  for(let k=0;k<n;k++){const next=Array(row.length+1).fill(0);row.forEach((value,index)=>{next[index]+=value*a;next[index+1]+=value*b;});row=next;}
  return row;
}
function assertBinomial(h,input) {
  const expected=convolution(input.a,input.b,input.n),rows=tableRows(h,'terms');
  assert.equal(rows.length,input.n+1);
  const choose=convolution(1,1,input.n);
  rows.forEach((row,k)=>{
    assert.equal(Number(row[0]),k);assert.equal(Number(row[1]),choose[k]);assert.equal(Number(row[2]),input.n-k);
    assert.equal(Number(row[3]),k);assert.equal(Number(row[4]),input.n-k);assert.equal(Number(row[6]),expected[k]===0?0:expected[k]);
  });
  for(const row of tableRows(h,'binomial-values')){const x=Number(row[0]),value=(input.a*x+input.b)**input.n;assert.equal(Number(row[1]),value);assert.equal(Number(row[2]),value);}
  assert.equal(h.root.querySelectorAll('svg').length,0,'binomial view does not force a graph');
}

test('01 semantic controls, output associations, live status and scrollable tables/graph are present',()=>{
  const h=mount();assert.equal(h.root.querySelectorAll('input[type=range]').length,4);
  for(const control of controls(q)){const input=h.root.querySelector(`[data-equivalence-control="${control.key}"]`);assert.equal(input.value,String(q[control.key]));assert.equal(input.getAttribute('aria-labelledby'),input.id+'-label');assert.ok(h.document.getElementById(input.id+'-label'));assert.ok(h.root.querySelector(`output[for="${input.id}"]`));}
  for(const region of h.root.querySelectorAll('.ei-table-scroll,.ei-graph-scroll')){assert.equal(region.getAttribute('role'),'region');assert.equal(region.getAttribute('tabindex'),'0');assert.ok(region.getAttribute('aria-label'));}
  assert.equal(h.root.querySelector('[data-equivalence-status]').getAttribute('aria-live'),'polite');
  assert.ok([...h.root.querySelectorAll('table')].every(value=>value.querySelector('caption')&&[...value.querySelectorAll('thead th')].every(header=>header.scope==='col')));
  assert.match(text(h,'expanded'),/P\(x\) = x² − x \+ 1/);assert.match(text(h,'identity'),/\(x − \(2\)\) × \(x \+ 1\) \+ \(3\)/);assertQuotient(h,q);h.view.dispose();
});

test('02 zero remainder renders a hollow excluded hole with a separately defined quotient trend',()=>{
  const h=mount(),input={...q,r:0};h.view.update(input);
  assert.deepEqual(tableRows(h,'exclusion'),[['2','hole','undefined','3','3']]);
  assert.match(text(h,'domain'),/except 2.*R\(2\) is undefined/);assert.match(h.root.textContent,/Q still includes that input/);
  assertQuotient(h,input);h.view.dispose();
});

test('03 positive and negative remainders render correct one-sided signs and avoid false holes',()=>{
  const h=mount();for(const r of [-4,-.25,.25,4]){const input={...q,r};h.view.update(input);const row=tableRows(h,'exclusion')[0];assert.equal(row[1],'pole');assert.equal(row[3],r>0?'−∞':'+∞');assert.equal(row[4],r>0?'+∞':'−∞');assertQuotient(h,input);}h.view.dispose();
});

test('04 constant and zero trends disclose actual degrees without ratio or slant misclassification',()=>{
  const h=mount();
  for(const input of [{a:0,b:1,c:2,r:3},{a:0,b:0,c:2,r:3},{a:0,b:0,c:2,r:0}]){
    h.view.update(input);assert.match(h.root.textContent,/horizontal quotient trend/);assert.ok(!h.root.textContent.includes('slant quotient trend'));assertQuotient(h,input);
  }
  assert.match(text(h,'degrees'),/Numerator degree: undefined \(zero polynomial\).*Quotient degree: undefined \(zero polynomial\)/);
  assert.match(h.root.textContent,/zero at every original-domain input/);h.view.dispose();
});

test('05 graph scale contains every extreme finite hole and truthfully decodes function points',()=>{
  const h=mount();
  for(const a of [-4,4])for(const b of [-4,4])for(const c of [-4,4]){const input={a,b,c,r:0};h.view.update(input);assertQuotient(h,input);assert.ok(Number(plot(h).dataset.ymin)<a*c+b);assert.ok(Number(plot(h).dataset.ymax)>a*c+b);}
  h.view.update({a:0,b:0,c:.25,r:4});assertQuotient(h,{a:0,b:0,c:.25,r:4});assert.match(h.root.textContent,/omitted, never clamped/);assert.match(h.root.textContent,/between sampled inputs/);h.view.dispose();
});

test('06 all 132 quotient control ticks synchronize identity, finite graph and table',()=>{
  const h=mount();let count=0;
  for(const control of controls(q)){
    h.root.querySelector('[data-equivalence-reset]').click();const input=h.root.querySelector(`[data-equivalence-control="${control.key}"]`);
    for(let tick=-16;tick<=16;tick++){const value=tick/4;input.value=String(value);input.dispatchEvent(new h.window.Event('input',{bubbles:true}));assert.equal(h.root.querySelector(`output[for="${input.id}"]`).value,String(value));assert.equal(h.root.querySelector('[data-equivalence-error]').hidden,true);assertQuotient(h,{...q,[control.key]:value});count++;}
  }
  assert.equal(count,132);h.view.dispose();
});

test('07 exact coefficient strings preserve quarter-grid products beyond shared display rounding',()=>{
  const h=mount();h.view.update({a:.25,b:.25,c:.25,r:0});
  assert.match(text(h,'expanded'),/0\.25x² \+ 0\.1875x − 0\.0625/);assert.match(tableRows(h,'exclusion')[0][3],/^0\.3125$/);h.view.dispose();
  const b=mount(scene('binomial',{a:.25,b:.25,n:8}));assertBinomial(b,{a:.25,b:.25,n:8});
  assert.equal(tableRows(b,'terms')[0][6],'0.0000152587890625');assert.ok(!text(b,'binomial').includes('0x⁸'));b.view.dispose();
});

test('08 binomial Pascal row, every power term and evaluation table match independent convolution',()=>{
  const h=mount(scene('binomial'));assertBinomial(h,bin);
  assert.match(text(h,'binomial'),/\(2x − 1\)³ = 8x³ − 12x² \+ 6x − 1/);
  assert.equal(text(h,'pascal'),'Pascal row n = 3: 1, 3, 3, 1.');
  assert.deepEqual(tableRows(h,'binomial-values'),[['0','-1','-1'],['1','1','1'],['2','27','27']]);
  assert.match(h.root.textContent,/they do not prove an identity/);h.view.dispose();
});

test('09 binomial zero, constant and monomial cases retain all n+1 terms and actual degree',()=>{
  const h=mount(scene('binomial'));
  for(let n=1;n<=8;n++)for(const [a,b] of [[0,0],[0,-2],[-2,0]]){
    const input={a,b,n};h.view.update(input);assertBinomial(h,input);
    assert.equal(text(h,'degree'),`Actual polynomial degree: ${a===0?(b===0?'undefined (zero polynomial)':'0'):n}.`);
    assert.match(h.root.textContent,/Exponent zero supplies the multiplicative identity/);
  }h.view.dispose();
});

test('10 all 74 binomial control ticks update actual signs, powers, coefficient values and reset',()=>{
  const h=mount(scene('binomial'));let count=0;
  for(const control of controls(bin)){
    h.root.querySelector('[data-equivalence-reset]').click();const input=h.root.querySelector(`[data-equivalence-control="${control.key}"]`);
    for(let value=control.min;value<=control.max;value+=control.step){input.value=String(value);input.dispatchEvent(new h.window.Event('input'));assertBinomial(h,{...bin,[control.key]:value});assert.equal(h.root.querySelector(`output[for="${input.id}"]`).value,String(value));assert.equal(h.root.querySelector('[data-equivalence-error]').hidden,true);count++;}
  }
  assert.equal(count,74);h.root.querySelector('[data-equivalence-reset]').click();assertBinomial(h,bin);h.view.dispose();
});

test('11 malformed, getter and hostile control records reject before DOM mutation',()=>{
  const {window,document}=parseHTML('<html><body><main>Retained</main></body></html>'),root=document.querySelector('main');let calls=0;
  const evil=()=>{calls++;throw Error('private input');},getter=scene();Object.defineProperty(getter.initial,'a',{get:evil,enumerable:true});
  const controlGetter=scene();Object.defineProperty(controlGetter.controls[0],'min',{get:evil,enumerable:true});
  const hostileKey=scene();hostileKey.controls[0].key={[Symbol.toPrimitive]:evil};
  const sparse=scene();sparse.controls=Array(1);
  const cases=[null,{},scene('wrong'),{...scene(),model:'other'},scene('quotient-remainder',{...q,a:.1}),scene('quotient-remainder',{...q,extra:1}),
    scene('binomial',{...bin,n:1.5}),scene('binomial',{...bin,a:NaN}),getter,controlGetter,hostileKey,sparse,
    scene('quotient-remainder',q,[controls(q)[0],controls(q)[0]]),scene('quotient-remainder',q,[{...controls(q)[0],step:.1}]),
    scene('quotient-remainder',q,[{...controls(q)[0],label:''}]),scene('quotient-remainder',q,[{...controls(q)[0],max:5}])];
  for(const data of cases){assert.throws(()=>mountEquivalence({root,window,scene:data}),RangeError);assert.equal(root.innerHTML,'Retained');}
  assert.equal(calls,0);
});

test('12 programmatic and DOM update failures retain prior results with fixed private-free alert',()=>{
  const h=mount(),before=h.root.querySelector('.ei-equivalence-results').innerHTML;
  for(const input of [{...q,a:NaN},{...q,c:4.25},{...q,r:.1},{a:1}]){assert.throws(()=>h.view.update(input),RangeError);assert.equal(h.root.querySelector('.ei-equivalence-results').innerHTML,before);}
  const input=h.root.querySelector('[data-equivalence-control="a"]');
  for(const invalid of ['','.1','NaN','Infinity','PRIVATE']){input.value=invalid;input.dispatchEvent(new h.window.Event('input'));assert.equal(input.value,'1');assert.equal(h.root.querySelector('.ei-equivalence-results').innerHTML,before);assert.equal(h.root.querySelector('[data-equivalence-error]').textContent,'This selection is outside the declared model controls.');assert.equal(h.root.querySelector('[data-equivalence-error]').hidden,false);}
  input.value='2';input.dispatchEvent(new h.window.Event('input'));assert.equal(h.root.querySelector('[data-equivalence-error]').hidden,true);h.view.dispose();
});

test('13 reset captures initial inputs/labels, optional controls work and mount IDs stay unique',()=>{
  const data=scene();data.controls[0].label='<img src=x onerror=private()>';const h=mount(data);
  assert.equal(h.root.querySelectorAll('img').length,0);assert.ok(h.root.textContent.includes('<img src=x onerror=private()>'));
  data.initial.a=4;data.controls[0].label='changed';h.view.update({...q,a:2});h.root.querySelector('[data-equivalence-reset]').click();assertQuotient(h,q);assert.ok(!h.root.textContent.includes('changed'));
  const second=mountEquivalence({root:h.root,window:h.window,scene:scene('binomial',bin,[])}),ids=[...h.root.querySelectorAll('[id]')].map(value=>value.id);
  assert.equal(ids.length,new Set(ids).size);assert.equal(h.root.querySelectorAll('.ei-equivalence-view').length,2);second.dispose();assert.equal(h.root.querySelectorAll('.ei-equivalence-view').length,1);h.view.dispose();
});

test('14 disposal removes owned nodes/listeners, preserves siblings and prevents further updates',()=>{
  const h=mount(),input=h.root.querySelector('[data-equivalence-control="a"]'),reset=h.root.querySelector('[data-equivalence-reset]');
  h.view.dispose();h.view.dispose();assert.equal(h.root.innerHTML,'<p id="retained">Retained sibling</p>');assert.throws(()=>h.view.update(q),/disposed/);
  input.value='4';input.dispatchEvent(new h.window.Event('input'));reset.click();assert.equal(h.root.innerHTML,'<p id="retained">Retained sibling</p>');
});

test('15 both actual original-content explorers compose and traverse every declared control',()=>{
  const explorers=Object.values(AP_EQUIVALENCE_CONTENT).flatMap(value=>value.scenes.filter(item=>item.model==='equivalence'));
  assert.deepEqual(explorers.map(item=>item.family),['quotient-remainder','binomial']);
  for(const data of explorers){const h=mount(data);assert.equal(h.root.querySelectorAll('input[type=range]').length,data.controls.length);
    const verify=input=>data.family==='binomial'?assertBinomial(h,input):assertQuotient(h,input);verify(data.initial);
    for(const control of data.controls){const input=h.root.querySelector(`[data-equivalence-control="${control.key}"]`);
      for(const value of [control.min,control.max]){h.root.querySelector('[data-equivalence-reset]').click();input.value=String(value);input.dispatchEvent(new h.window.Event('input'));verify({...data.initial,[control.key]:value});assert.equal(h.root.querySelector('[data-equivalence-error]').hidden,true);}
    }h.root.querySelector('[data-equivalence-reset]').click();verify(data.initial);h.view.dispose();
  }
});
