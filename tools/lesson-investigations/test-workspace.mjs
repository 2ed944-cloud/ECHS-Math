/* Actual-module DOM controls; no native browser, layout, animation or auth claim. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import {mountInvestigation} from '../../lessons/shared/investigations/workspace.mjs';
import {AP_RATES_CONTENT} from '../../lessons/shared/investigations/ap-rates-content.mjs';
import {IB_CONTENT} from '../../lessons/shared/investigations/ib-content.mjs';
const require=createRequire(import.meta.url);
const {parseHTML}=require(process.env.ECHS_TEST_DOM_MODULE||'linkedom');
let passed=0;
async function group(name,fn){await fn();passed++;console.log('PASS '+name);}
function fixture(key) {
  const {window:dom,document}=parseHTML('<html><head></head><body><main id="legacy"><p>Preserved lesson</p></main><dialog></dialog></body></html>');
  // LinkeDOM lacks select.value setters, focus navigation and animation frames.
  // These three explicit seams are not treated as native behavior evidence.
  Object.defineProperty(dom.HTMLSelectElement.prototype,'value',{configurable:true,
    get(){return this.querySelector('option[selected]')?.value??this.querySelector('option')?.value??'';},
    set(value){for(const opt of this.querySelectorAll('option'))opt.toggleAttribute('selected',opt.value===String(value));}});
  let focus=null,closes=0,id=0;const frames=new Map(),timers=new Map();
  const media={matches:false,addEventListener(){},removeEventListener(){}};
  const events=document.createElement('div');
  const win={document,matchMedia:()=>media,performance:{now:()=>0},
    addEventListener:events.addEventListener.bind(events),removeEventListener:events.removeEventListener.bind(events),
    requestAnimationFrame:fn=>{frames.set(++id,fn);return id;},cancelAnimationFrame:i=>frames.delete(i),
    setTimeout:fn=>{timers.set(++id,fn);return id;},clearTimeout:i=>timers.delete(i)};
  const create=document.createElement.bind(document);document.createElement=function(tag){const n=create(tag);n.focus=()=>{focus=n;};return n;};
  const dialog=document.querySelector('dialog'),legacy=document.getElementById('legacy'),old=legacy.innerHTML;
  const mounted=mountInvestigation({dialog,key,window:win,onClose:()=>closes++});
  const click=node=>{assert.ok(node,'missing click control');node.dispatchEvent(new dom.Event('click',{bubbles:true,cancelable:true}));};
  const input=(node,value,event='input')=>{assert.ok(node,'missing input control');node.value=String(value);node.dispatchEvent(new dom.Event(event,{bubbles:true}));};
  return {document,dom,dialog,mounted,click,input,frames,timers,media,focus:()=>focus,closes:()=>closes,
    nav:()=>[...dialog.querySelectorAll('.ei-nav button')],
    showTitle(title){const node=[...dialog.querySelectorAll('.ei-nav button')].find(n=>n.textContent.includes(title));click(node);},
    checkFinite(){for(const node of dialog.querySelectorAll('svg *'))for(const attr of node.attributes)assert.doesNotMatch(attr.value,/(?:NaN|Infinity)/,attr.name);},
    cleanup(){mounted.dispose();mounted.dispose();assert.equal(dialog.childNodes.length,0);assert.equal(legacy.innerHTML,old);assert.equal(frames.size,0);assert.equal(timers.size,0);},
  };
}
const entries=[['ap-rates',AP_RATES_CONTENT],...Object.entries(IB_CONTENT)];
await group('all four workspaces expose original titles, activity order and labelled dialog',()=>{
  for(const [key,data] of entries){const f=fixture(key);assert.equal(f.dialog.querySelector('h1').textContent,data.title);
    assert.equal(f.dialog.getAttribute('aria-labelledby'),f.dialog.querySelector('h1').id);
    assert.equal(f.focus(),f.dialog.querySelector('h2'),'Initial activity receives explicit focus');
    const names=f.nav().map(n=>n.textContent);assert.equal(names.length,data.scenes.length+(key==='ap-rates'?1:0));
    let previous=-1;for(const scene of data.scenes){const index=names.findIndex(n=>n.includes(scene.title));assert.ok(index>previous);previous=index;}
    assert.equal(f.nav().filter(n=>n.hasAttribute('aria-current')).length,1);f.cleanup();}
});
await group('every actual scene renders its content, explanatory prompts and model alternatives',()=>{
  for(const [key,data] of entries){const f=fixture(key);for(const scene of data.scenes){f.showTitle(scene.title);
    assert.equal(f.dialog.querySelector('h2').textContent,scene.title);
    for(const paragraph of scene.text??[])assert.ok(f.dialog.textContent.includes(paragraph),scene.id);
    assert.ok(f.dialog.querySelector('textarea[maxlength="3000"]')||f.dialog.querySelector('textarea').maxLength===3000);
    if(scene.model&&scene.kind!=='transfer'){assert.ok(f.dialog.querySelector('svg[role="img"]'),scene.id);assert.ok(f.dialog.querySelector('table caption'),scene.id);assert.equal(f.dialog.querySelector('thead th').scope,'col',scene.id);}
    if(scene.kind==='transfer')assert.equal(f.dialog.querySelector('.ei-prediction'),null,'Transfer keeps answers unscaffolded');
    f.checkFinite();}f.cleanup();}
});
await group('actual model controls at min/max remain finite and properly labelled',()=>{
  for(const [key,data] of entries){const f=fixture(key);for(const scene of data.scenes.filter(s=>s.model)){f.showTitle(scene.title);
    for(const control of [...f.dialog.querySelectorAll('.ei-control input[type="range"]')]){
      assert.ok([...f.dialog.querySelectorAll('label')].some(label=>label.htmlFor===control.id));
      for(const value of [control.min,control.max]){f.input(control,value);f.checkFinite();assert.doesNotMatch(f.dialog.querySelector('.ei-main').textContent,/These inputs do not define a valid model/);}
    }
  }f.cleanup();}
});
await group('first numeric predictions independently match four simple calculations',()=>{
  for(const [key,answer] of [['ap-rates',0],['arithmetic',24],['geometric',320],['finance',4410]]){
    const f=fixture(key),wrap=f.dialog.querySelector('.ei-prediction'),field=wrap.querySelector('input'),check=wrap.querySelector('button'),feedback=wrap.querySelector('[role="status"]');
    f.input(field,'not a number');f.click(check);assert.equal(feedback.dataset.result,'retry');
    f.input(field,answer);f.click(check);assert.equal(feedback.dataset.result,'correct',key+': '+feedback.textContent);
    f.input(field,answer+1000);assert.equal(feedback.hasAttribute('data-result'),false);f.click(check);assert.equal(feedback.dataset.result,'retry');
    f.cleanup();
  }
});
await group('changed model invalidates previous correctness; reset restores initial table and clears answer',()=>{
  const f=fixture('arithmetic'),wrap=f.dialog.querySelector('.ei-prediction'),field=wrap.querySelector('input');
  const original=f.dialog.querySelector('table').textContent;
  f.input(field,24);f.click(wrap.querySelector('button'));assert.equal(wrap.querySelector('[role="status"]').dataset.result,'correct');
  f.input(f.dialog.querySelector('input[id$="-difference"]'),8);assert.equal(wrap.querySelector('[role="status"]').hasAttribute('data-result'),false);assert.notEqual(f.dialog.querySelector('table').textContent,original);
  f.click([...f.dialog.querySelectorAll('button')].find(n=>n.textContent==='Reset model and prediction'));assert.equal(field.value,'');assert.equal(f.dialog.querySelector('table').textContent,original);f.cleanup();
});
await group('geometric zero and negative ratio are discrete points with finite tables',()=>{
  const f=fixture('geometric'),ratio=f.dialog.querySelector('input[id$="-ratio"]');
  for(const value of [0,-1,1]){f.input(ratio,value);f.checkFinite();assert.equal(f.dialog.querySelector('.ei-graph polyline'),null);assert.ok(f.dialog.querySelectorAll('.ei-graph circle').length>0);}
  f.cleanup();
});
await group('vessel projection has accessible 2D graph/table and cylinder half-height',()=>{
  const f=fixture('ap-rates');f.showTitle('Fill a vessel in three dimensions');
  const shape=f.dialog.querySelector('select[id$="-shape"]');f.input(shape,'cylinder','change');f.checkFinite();
  assert.ok(f.dialog.querySelector('.ei-vessel[aria-label]'));assert.ok(f.dialog.querySelector('.ei-graph'));assert.ok(f.dialog.querySelector('table'));
  const wrap=f.dialog.querySelector('.ei-prediction');f.input(wrap.querySelector('input'),6);f.click(wrap.querySelector('button'));assert.equal(wrap.querySelector('[role="status"]').dataset.result,'correct');
  for(const value of ['widening','narrowing']){f.input(shape,value,'change');f.checkFinite();}f.cleanup();
});
await group('car mounts through actual scene, uses metres and cancels owned playback on navigation',()=>{
  const f=fixture('ap-rates');f.showTitle('Watch equal time intervals on the track');
  assert.ok(f.dialog.querySelector('.ei-car-view'));assert.equal(f.frames.size,0);
  f.input(f.dialog.querySelector('[data-car-time]'),3);assert.match(f.dialog.querySelector('[data-car-readout]').textContent,/Position 6 m\./);
  f.click(f.dialog.querySelector('[data-car-play]'));assert.equal(f.frames.size,1);
  f.click(f.nav()[0]);assert.equal(f.frames.size,0);assert.equal(f.dialog.querySelector('.ei-car-view'),null);f.cleanup();
});
await group('finance preserves scene controls and all quarters needed for first-threshold proof',()=>{
  const f=fixture('finance');assert.deepEqual([...f.dialog.querySelectorAll('[data-parameter]')].map(n=>n.dataset.parameter),['years']);
  f.showTitle('A threshold needs two nearby checks');const rows=[...f.dialog.querySelectorAll('tbody tr')];assert.equal(rows.length,13);
  const cells=rows.map(row=>[...row.children].map(n=>n.textContent));assert.equal(cells[9][0],'9');assert.equal(cells[9][1],'2.25');assert.equal(cells[10][1],'2.5');
  assert.ok(Number(cells[9][2].replaceAll(',',''))<6000);assert.ok(Number(cells[10][2].replaceAll(',',''))>=6000);
  const prediction=f.dialog.querySelector('.ei-prediction');f.input(prediction.querySelector('input'),10);f.click(prediction.querySelector('button'));assert.equal(prediction.querySelector('[role="status"]').dataset.result,'correct');f.cleanup();
});
await group('owned UI buttons/keys do not reach legacy delegates and Close remains available',()=>{
  const f=fixture('arithmetic');let legacyClick=0,legacyKey=0;
  f.document.addEventListener('click',()=>legacyClick++);f.document.addEventListener('keydown',()=>legacyKey++);
  f.click(f.nav()[1]);const event=new f.dom.Event('keydown',{bubbles:true,cancelable:true});Object.defineProperty(event,'key',{value:'ArrowRight'});f.dialog.querySelector('h2').dispatchEvent(event);
  assert.equal(legacyClick,0);assert.equal(legacyKey,0);assert.equal(event.defaultPrevented,false);
  f.click(f.dialog.querySelector('.ei-header button'));assert.equal(f.closes(),1);f.cleanup();
});
await group('scene replacement detaches old control effects and dispose is idempotent',()=>{
  const f=fixture('arithmetic'),old=f.dialog.querySelector('input[id$="-difference"]');f.click(f.nav()[2]);
  const current=f.dialog.innerHTML;f.input(old,9);assert.equal(f.dialog.innerHTML,current);const nav=f.nav()[0];f.cleanup();f.click(nav);assert.equal(f.dialog.childNodes.length,0);
});
await group('static UI has no private fetch, persistence, navigation or trusted evidence writes',()=>{
  for(const name of ['workspace.mjs','visuals.mjs']){const text=readFileSync(new URL('../../lessons/shared/investigations/'+name,import.meta.url),'utf8');
    for(const pattern of [/localStorage|sessionStorage|indexedDB/,/\bfetch\s*\(/,/\.api\s*\(/,/echs:learning|echs:lesson-completed/,/history\.(pushState|replaceState)/,/location\.(href|hash|search)\s*=/,/\.innerHTML\s*=/])assert.equal(pattern.test(text),false,name+' '+pattern);}
});
console.log(JSON.stringify({status:'PASS',groups:passed,native_browser:false,native_dialog:false,layout_checked:false,backend_calls:0}));
