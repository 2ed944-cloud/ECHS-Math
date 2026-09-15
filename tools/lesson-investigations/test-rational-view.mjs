import assert from 'node:assert/strict';
import test from 'node:test';
import {createRequire} from 'node:module';
import {resolve,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const require=createRequire(import.meta.url), {parseHTML}=require(process.env.ECHS_TEST_DOM_MODULE||'linkedom');
const i=process.argv.indexOf('--repo'),repo=resolve(i<0?resolve(dirname(fileURLToPath(import.meta.url)),'../..'):process.argv[i+1]);
const {mountRational}=await import(pathToFileURL(resolve(repo,'lessons/shared/investigations/rational-view.mjs')));
const {factorLedger,rationalAt}=await import(pathToFileURL(resolve(repo,'lessons/shared/investigations/ap-rational-model.mjs')));
const {AP_RATIONAL_CONTENT}=await import(pathToFileURL(resolve(repo,'lessons/shared/investigations/ap-rational-content.mjs')));
const initial={scale:1,numeratorRoot:-1,numeratorMultiplicity:1,denominatorRoot:2,denominatorMultiplicity:1,commonRoot:0,commonNumeratorMultiplicity:1,commonDenominatorMultiplicity:1};
const allControls=Object.keys(initial).map(key=>({key,label:key,min:key.includes('Multiplicity')?(key.startsWith('common')?0:1):-4,max:key.includes('Multiplicity')?3:4,step:key.includes('Multiplicity')?1:.25}));
const scene=(values=initial,controls=allControls)=>({model:'rational',family:'linear-factors',initial:{...values},controls:controls.map(c=>({...c}))});
const pure=values=>factorLedger({scale:values.scale,numerator:[{root:values.numeratorRoot,multiplicity:values.numeratorMultiplicity},...(values.commonNumeratorMultiplicity?[{root:values.commonRoot,multiplicity:values.commonNumeratorMultiplicity}]:[])],denominator:[{root:values.denominatorRoot,multiplicity:values.denominatorMultiplicity},...(values.commonDenominatorMultiplicity?[{root:values.commonRoot,multiplicity:values.commonDenominatorMultiplicity}]:[])]});
const mount=(data=scene())=>{const {window,document}=parseHTML('<html><body><main><p id="retained">Retained sibling</p></main></body></html>'),root=document.querySelector('main'),view=mountRational({root,window,scene:data});return{window,document,root,view};};
const near=(a,b)=>assert.ok(Number.isFinite(a)&&Math.abs(a-b)<1e-8*Math.max(1,Math.abs(b)),`${a} != ${b}`);
const svg=h=>h.root.querySelector('[data-rational-plot]');
const decode=(plot,x,y)=>({x:-5+(x-70)/500*10,y:Number(plot.dataset.ymin)+(282-y)/240*(Number(plot.dataset.ymax)-Number(plot.dataset.ymin))});
const rows=(h,key)=>[...h.root.querySelectorAll(`[data-rational-table="${key}"] tbody tr`)].map(row=>[...row.children].map(cell=>cell.textContent));
function assertGraph(h,input){
  const state=pure(input),plot=svg(h),all=plot.querySelectorAll('polyline[data-rational-branch]');
  assert.ok(all.length>0);assert.ok(plot.querySelector('clipPath rect'));
  for(const line of all){const points=line.getAttribute('points').split(' ').map(pair=>{const [x,y]=pair.split(',').map(Number);assert.ok(x>=70-1e-8&&x<=570+1e-8&&y>=42-1e-8&&y<=282+1e-8);return decode(plot,x,y);});
    for(const point of points)near(point.y,rationalAt(state.input,point.x).y);
    for(const excluded of state.exclusions)assert.ok(!(Math.min(...points.map(p=>p.x))<excluded.x&&Math.max(...points.map(p=>p.x))>excluded.x),'no branch joins across an original exclusion');
  }
  for(const circle of plot.querySelectorAll('[data-rational-hole]')){const cx=Number(circle.getAttribute('cx')),cy=Number(circle.getAttribute('cy'));assert.ok(cx>=76&&cx<=564&&cy>=48&&cy<=276,'complete hollow marker lies inside plot bounds');const p=decode(plot,cx,cy),hole=state.exclusions.find(row=>row.x===Number(circle.dataset.rationalHole));near(p.x,hole.x);near(p.y,hole.y);assert.equal(circle.getAttribute('fill'),'#fff');assert.match(circle.querySelector('title').textContent,/undefined/);}
}

test('01 accessible native-range controls, outputs, readonly tables and scroll region mount',()=>{
 const h=mount();assert.equal(h.root.querySelectorAll('input[type=range]').length,8);
 for(const c of allControls){const input=h.root.querySelector(`[data-rational-control="${c.key}"]`);assert.equal(input.value,String(initial[c.key]));assert.equal(input.getAttribute('aria-labelledby'),input.id+'-label');assert.ok(h.document.getElementById(input.id+'-label'));assert.ok(h.root.querySelector(`output[for="${input.id}"]`));}
 assert.equal(h.root.querySelectorAll('table').length,5);assert.ok([...h.root.querySelectorAll('table')].every(t=>t.querySelector('caption')&&t.querySelectorAll('thead th').length));
 assert.equal(h.root.querySelector('.ei-graph-scroll').getAttribute('role'),'region');assert.equal(h.root.querySelector('.ei-graph-scroll').getAttribute('tabindex'),'0');assert.equal(h.root.querySelector('[data-rational-status]').getAttribute('aria-live'),'polite');assert.ok(h.root.querySelector('#retained'));h.view.dispose();
});
test('02 original domain, zero versus hole ledger and graph all use the declared factors',()=>{
 const h=mount();assert.match(h.root.querySelector('[data-rational-domain]').textContent,/except 0, 2/);
 assert.deepEqual(rows(h,'exclusions'),[['0','hole','undefined','-0.5','-0.5'],['2','pole','undefined','−∞','+∞']]);
 assert.deepEqual(rows(h,'zeros'),[['-1','1','crosses']]);assert.equal(svg(h).querySelectorAll('[data-rational-hole]').length,1);assert.equal(svg(h).querySelectorAll('[data-rational-pole]').length,1);assert.equal(svg(h).querySelectorAll('[data-rational-zero]').length,1);assertGraph(h,initial);h.view.dispose();
});
test('03 exact common-factor collision updates multiplicities, valid zeros and hole height',()=>{
 const h=mount(),input={...initial,commonRoot:2,commonNumeratorMultiplicity:2,commonDenominatorMultiplicity:1};h.view.update(input);
 assert.deepEqual(rows(h,'exclusions'),[['2','hole','undefined','3','3']]);assert.equal(svg(h).querySelectorAll('[data-rational-pole]').length,0);assertGraph(h,input);h.view.dispose();
});
test('04 unequal common cancellation leaves a pole; original numerator zero is excluded',()=>{
 const h=mount(),input={...initial,commonNumeratorMultiplicity:1,commonDenominatorMultiplicity:3};h.view.update(input);
 assert.deepEqual(rows(h,'exclusions')[0],['0','pole','undefined','−∞','−∞']);assert.equal(svg(h).querySelectorAll('[data-rational-hole]').length,0);assert.equal(svg(h).querySelectorAll('[data-rational-pole]').length,2);assertGraph(h,input);h.view.dispose();
});
test('05 zero scale retains hollow domain exclusions and declares all retained inputs zeros',()=>{
 const h=mount(),input={...initial,scale:0};h.view.update(input);assert.match(h.root.textContent,/every original-domain input/);assert.match(h.root.textContent,/zero polynomial has no degree/);
 assert.equal(rows(h,'zeros').length,0);assert.ok(rows(h,'exclusions').every(row=>row[1]==='hole'&&row[2]==='undefined'&&row[3]==='0'&&row[4]==='0'));
 assert.equal(svg(h).querySelectorAll('[data-rational-pole]').length,0);assert.equal(svg(h).querySelectorAll('[data-rational-hole]').length,2);assert.ok(rows(h,'signs').every(row=>row[1]==='zero'));assertGraph(h,input);h.view.dispose();
});
test('06 nearby distinct root produces a finite large hole with truthful expanded vertical scale',()=>{
 const h=mount(),input={...initial,scale:4,numeratorRoot:-4,numeratorMultiplicity:3,denominatorRoot:4,denominatorMultiplicity:3,commonRoot:3.75};h.view.update(input);
 const hole=svg(h).querySelector('[data-rational-hole]');near(Number(hole.dataset.holeY),4*(3.75+4)**3/(3.75-4)**3);assert.equal(svg(h).querySelectorAll('[data-rational-pole]').length,1);
 assert.ok(Number(svg(h).dataset.ymin)<-100000);assert.match(h.root.textContent,/Read the axis scale/);assert.match(h.root.textContent,/omitted, never clamped/);assertGraph(h,input);h.view.dispose();
});
test('07 both separated finite holes stay completely in view with unequal ordinates',()=>{
 const h=mount(),input={...initial,scale:4,numeratorRoot:-4,numeratorMultiplicity:3,denominatorRoot:-4,denominatorMultiplicity:1,commonRoot:4,commonNumeratorMultiplicity:3,commonDenominatorMultiplicity:1};h.view.update(input);assert.equal(svg(h).querySelectorAll('[data-rational-hole]').length,2);assertGraph(h,input);h.view.dispose();
});
test('08 all scale slider ticks update graph, tail direction, table and displayed control together',()=>{
 const h=mount(),input=h.root.querySelector('[data-rational-control="scale"]');
 for(let n=-16;n<=16;n++){input.value=String(n/4);input.dispatchEvent(new h.window.Event('input',{bubbles:true}));assert.equal(h.root.querySelector(`output[for="${input.id}"]`).value,String(n/4));assertGraph(h,{...initial,scale:n/4});assert.match(h.root.querySelector('[data-rational-formula]').textContent,new RegExp('^R\\(x\\) = '+String(n/4).replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));}
 assert.equal(h.root.querySelector('[data-rational-error]').hidden,true);h.view.dispose();
});
test('09 finite table explicitly includes noninteger excluded inputs without claiming equal spacing',()=>{
 const h=mount(),input={...initial,denominatorRoot:2.25,commonRoot:.75};h.view.update(input);const table=rows(h,'samples');
 assert.ok(table.some(row=>row[0]==='0.75'&&row[1]==='undefined'&&row[2]==='excluded hole'));
 assert.ok(table.some(row=>row[0]==='2.25'&&row[1]==='undefined'&&row[2]==='excluded pole'));
 assert.match(h.root.querySelector('[data-rational-table="samples"] caption').textContent,/not equally spaced/);assertGraph(h,input);h.view.dispose();
});
test('10 negative scale and odd degree difference change algebraic tails independently of samples',()=>{
 const h=mount(),input={...initial,scale:-2,numeratorMultiplicity:3,denominatorMultiplicity:2,commonNumeratorMultiplicity:0,commonDenominatorMultiplicity:0};h.view.update(input);
 const text=h.root.querySelector('[data-rational-tails]').textContent;assert.match(text,/−∞, R\(x\) → \+∞/);assert.match(text,/\+∞, R\(x\) → −∞/);assertGraph(h,input);h.view.dispose();
});
test('11 invalid scene/control inputs reject before root mutation without invoking getters',()=>{
 const {window,document}=parseHTML('<html><body><main>Retained</main></body></html>'),root=document.querySelector('main');let calls=0;
 const evil=()=>{calls++;throw Error('private');},getter=scene();Object.defineProperty(getter.initial,'scale',{get:evil,enumerable:true});
 const badScenes=[null,{},scene({...initial,scale:.1}),scene({...initial,commonRoot:0.1}),scene({...initial,numeratorMultiplicity:0}),scene({...initial,extra:1}),{...scene(),family:'other'},getter,scene(initial,[allControls[0],allControls[0]]),scene(initial,[{...allControls[0],step:.1}]),scene(initial,[{...allControls[0],key:'foreign'}]),scene(initial,[{...allControls[0],label:''}])];
 for(const data of badScenes){assert.throws(()=>mountRational({root,window,scene:data}),RangeError);assert.equal(root.innerHTML,'Retained');}
 assert.equal(calls,0);
});
test('12 update failure is atomic, UI failure retains prior state and exposes a fixed alert',()=>{
 const h=mount(),before=h.root.querySelector('.ei-rational-results').innerHTML;
 for(const input of [{...initial,scale:NaN},{...initial,numeratorRoot:4.25},{...initial,commonNumeratorMultiplicity:4},{scale:1}]){assert.throws(()=>h.view.update(input),RangeError);assert.equal(h.root.querySelector('.ei-rational-results').innerHTML,before);}
 const control=h.root.querySelector('[data-rational-control="scale"]');control.value='.1';control.dispatchEvent(new h.window.Event('input',{bubbles:true}));assert.equal(control.value,'1');assert.equal(h.root.querySelector('.ei-rational-results').innerHTML,before);assert.equal(h.root.querySelector('[data-rational-error]').hidden,false);assert.equal(h.root.querySelector('[data-rational-error]').textContent,'This selection is outside the declared model controls.');h.view.dispose();
});
test('13 captured reset ignores caller mutation, optional controls work, and mounts have unique labels',()=>{
 const data=scene(),h=mount(data);data.initial.scale=4;data.controls[0].label='changed';h.view.update({...initial,scale:-2});h.root.querySelector('[data-rational-reset]').click();assert.equal(h.root.querySelector('[data-rational-control="scale"]').value,'1');assert.ok(!h.root.textContent.includes('changed'));
 const second=mountRational({root:h.root,window:h.window,scene:scene(initial,[])});assert.equal(h.root.querySelectorAll('.ei-rational-view').length,2);
 const ids=[...h.root.querySelectorAll('[id]')].map(node=>node.id);assert.equal(ids.length,new Set(ids).size);second.dispose();assert.equal(h.root.querySelectorAll('.ei-rational-view').length,1);h.view.dispose();
});
test('14 disposal removes only owned DOM/listeners and rejects further programmatic updates',()=>{
 const h=mount(),input=h.root.querySelector('[data-rational-control="scale"]'),button=h.root.querySelector('[data-rational-reset]');h.view.dispose();h.view.dispose();assert.equal(h.root.innerHTML,'<p id="retained">Retained sibling</p>');
 assert.throws(()=>h.view.update(initial),/disposed/);input.value='2';input.dispatchEvent(new h.window.Event('input'));button.click();assert.equal(h.root.innerHTML,'<p id="retained">Retained sibling</p>');
});

test('15 four actual original-content explorer scenes compose with the declared controls',()=>{
 const explorers=Object.values(AP_RATIONAL_CONTENT).flatMap(lesson=>lesson.scenes.filter(s=>s.model==='rational'));
 assert.equal(explorers.length,4);
 for(const data of explorers){const h=mount(data);assertGraph(h,data.initial);assert.equal(h.root.querySelectorAll('input[type=range]').length,data.controls.length);
  for(const c of data.controls){const input=h.root.querySelector(`[data-rational-control="${c.key}"]`);assert.equal(input.value,String(data.initial[c.key]));for(const value of [c.min,c.max]){input.value=String(value);input.dispatchEvent(new h.window.Event('input',{bubbles:true}));assert.equal(h.root.querySelector('[data-rational-error]').hidden,true);assert.equal(h.root.querySelector(`output[for="${input.id}"]`).value,String(value));}h.root.querySelector('[data-rational-reset]').click();assert.equal(input.value,String(data.initial[c.key]));}
  assertGraph(h,data.initial);h.view.dispose();assert.equal(h.root.querySelectorAll('.ei-rational-view').length,0);
 }
});

test('16 small nonzero hole limits and table values never display as zero',()=>{
 const h=mount();
 for(const root of [1.75,2.25]){const input={...initial,scale:.25,numeratorRoot:root,numeratorMultiplicity:3,denominatorRoot:4,denominatorMultiplicity:3,commonRoot:2};h.view.update(input);
  const hole=svg(h).querySelector('[data-rational-hole]'),expected=.25*(2-root)**3/(2-4)**3;assert.ok(Math.abs(expected)>=.0001&&Math.abs(expected)<.0005);assert.ok(Math.abs(Number(hole.dataset.holeY)-expected)<1e-14);
  const excluded=rows(h,'exclusions').find(row=>row[0]==='2');for(const value of excluded.slice(3)){assert.notEqual(Number(value),0);assert.equal(Math.sign(Number(value)),Math.sign(expected));}
  assert.match(hole.querySelector('title').textContent,/4\.883e-4/);assertGraph(h,input);
 }
 const input={...initial,scale:.25,numeratorRoot:2.25,numeratorMultiplicity:3,denominatorRoot:4,denominatorMultiplicity:3,commonNumeratorMultiplicity:0,commonDenominatorMultiplicity:0};h.view.update(input);const sample=rows(h,'samples').find(row=>row[0]==='2');assert.equal(sample[2],'in original domain');assert.notEqual(Number(sample[1]),0);assert.match(sample[1],/e-4/);h.view.dispose();
});
