/** Independent volume/rate checks and deterministic controls QA. No student/account writes. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import fs from 'node:fs';
import vm from 'node:vm';
const require=createRequire(import.meta.url),file=new URL('../lessons/ap-precalculus/unit-1/assets/tandem-context-models-v4.js',import.meta.url),source=fs.readFileSync(file,'utf8'),F=require(file.pathname).forumVessels;
const near=(a,b,e=1e-8)=>assert.ok(Math.abs(a-b)<e,`${a} != ${b}`);
let checks=0;
for(const key of ['A','B','C','D']){
  assert.ok(F.capacity(key)>0);checks++;
  // Midpoint quadrature independently integrates the silhouette's circular area.
  const n=40000,dh=F.height/n;let v=0;
  for(let i=0;i<n;i++)v+=Math.PI*F.radius(key,(i+.5)*dh)**2*dh;
  near(v,F.capacity(key),2e-6);checks++;
  for(const flow of [4,10,18,30,45])for(let i=0;i<=100;i++){
    const s=F.state(key,F.capacity(key)*i/(100*flow),flow);
    near(s.volume,flow*s.time);near(F.volume(key,s.height),s.volume,2e-9);near(s.area,Math.PI*s.radius*s.radius);near(s.rate,flow/s.area);checks+=4;
    if(i<100){const faster=F.state(key,s.time,2*flow);assert.ok(faster.height>=s.height);checks++;}
  }
  near(F.state(key,1e6,10).height,F.height);near(F.state(key,0,10).height,0);checks+=2;
  for(const height of [1.25,3.25,6.25,8.25]){
    const time=F.volume(key,height)/10,eps=.00001,rate=(F.state(key,time+eps,10).height-F.state(key,time-eps,10).height)/(2*eps);
    near(rate,10/(Math.PI*F.radius(key,height)**2),1e-6);checks++;
  }
}
// Only B starts by narrowing continuously, then has a straight-neck linear rise.
assert.ok(F.radius('B',6)<F.radius('B',1));near(F.radius('B',8),F.radius('B',9.5));
assert.ok(F.radius('C',2)>F.radius('C',.25));assert.ok(F.radius('D',3)>F.radius('D',.5));assert.ok(F.radius('A',4)<F.radius('A',1));assert.ok(F.radius('A',9)>F.radius('A',6));checks+=6;
assert.throws(()=>F.state('X',1,10));assert.throws(()=>F.state('A',-1,10));assert.throws(()=>F.state('A',1,0));assert.throws(()=>F.state('A',NaN,10));checks+=4;

// Small deterministic DOM fixture exercises the actual UI code and animation
// callbacks. This checks behavior, not browser layout or production authorization.
class Element {
  constructor(tag='div',attrs={}){this.tag=tag;this.attrs={...attrs};this.dataset={};this.listeners={};this.children=[];this.value=attrs.value??'';this.checked=false;this.hidden='hidden' in attrs;this.disabled=false;this.textContent='';for(const [k,v] of Object.entries(attrs))if(k.startsWith('data-'))this.dataset[k.slice(5).replace(/-([a-z])/g,(_,x)=>x.toUpperCase())]=v;}
  addEventListener(type,fn){(this.listeners[type]??=[]).push(fn);}
  dispatch(type){for(const fn of this.listeners[type]??[])fn({target:this});}
  setAttribute(k,v){this.attrs[k]=String(v);}
  getAttribute(k){return this.attrs[k]??null;}
  set innerHTML(s){this.markup=s;this.children=[];for(const m of s.matchAll(/<([a-z]+)\s+([^>]+)>/g)){const attrs={};for(const a of m[2].matchAll(/([\w-]+)(?:="([^"]*)")?/g))attrs[a[1]]=a[2]??'';this.children.push(new Element(m[1],attrs));}}
  get innerHTML(){return this.markup??'';}
  querySelectorAll(sel){const m=sel.match(/^\[([\w-]+)(?:="([^"]+)")?\]$/);if(!m)return[];return this.children.filter(e=>m[1] in e.attrs&&(m[2]===undefined||e.attrs[m[1]]===m[2]));}
  querySelector(sel){return this.querySelectorAll(sel)[0]??null;}
  closest(sel){return sel==='.slide'?slide:null;}
}
const slide=new Element(),host=new Element('div',{'data-context-lab':'vessel'}),document=new Element();document.hidden=false;document.head=new Element();document.head.appendChild=()=>{};document.createElement=t=>new Element(t);document.getElementById=()=>null;document.querySelector=sel=>sel==='[data-context-lab="vessel"]'?host:null;
const events={},pending=new Map();let serial=0,intervalCallback,reduced=false,mediaChange;
const win={addEventListener:(type,fn)=>{(events[type]??=[]).push(fn);},matchMedia:()=>({get matches(){return reduced;},addEventListener:(_t,fn)=>{mediaChange=fn;}})};
const ctx=vm.createContext({window:win,document,requestAnimationFrame:fn=>{pending.set(++serial,fn);return serial;},cancelAnimationFrame:id=>pending.delete(id),setInterval:fn=>{intervalCallback=fn;return 1;},clearInterval:()=>{},console});vm.runInContext(source,ctx);
for(const fn of events.DOMContentLoaded??[])fn();intervalCallback();
const el=k=>host.querySelector(`[data-apv-${k}]`),choice=k=>host.querySelector(`[data-apv-key="${k}"]`),click=e=>e.dispatch('click'),input=(e,v)=>{e.value=v;e.dispatch('input');},frame=t=>{const callbacks=[...pending.values()];pending.clear();callbacks.forEach(fn=>fn(t));};
const synchronized=()=>{near(Number(el('vessel').dataset.height),Number(el('graph').dataset.height));near(Number(el('vessel').dataset.time),Number(el('graph').dataset.time));checks+=2;};
assert.equal(host.dataset.apVesselEnhanced,'true');assert.equal(host.dataset.vesselKey,'A');assert.equal(el('answer').hidden,true);assert.equal(el('graph').querySelectorAll('[data-apv-prediction]').length,0);checks+=4;
for(const key of ['A','B','C','D']){
  click(choice(key));assert.equal(host.dataset.vesselKey,key);assert.equal(choice(key).getAttribute('aria-pressed'),'true');checks+=2;
  const max=Number(el('fill').max);input(el('fill'),max*.4);synchronized();near(Number(host.dataset.vesselTime),max*.4);checks++;
  const state=F.state(key,max*.4,Number(host.dataset.vesselFlow)),point=el('graph').querySelector('[data-apv-point]');near(Number(point.getAttribute('cy')),310-275*state.height/10);checks++;
  input(el('fill'),max);assert.equal(el('rate').textContent,'Full — model ends');synchronized();checks++;
  click(el('reset'));near(Number(host.dataset.vesselTime),0);assert.equal(host.dataset.vesselPlaying,false);checks+=2;
  click(el('play'));frame(0);frame(1000);near(Number(host.dataset.vesselTime),1);synchronized();checks++;
  click(el('play'));assert.equal(pending.size,0);assert.equal(host.dataset.vesselPlaying,false);checks+=2;
  input(el('flow'),12);near(Number(host.dataset.vesselTime),0);near(Number(el('fill').max),F.capacity(key)/12);checks+=2;
}
el('compare').checked=true;el('compare').dispatch('change');assert.equal(el('graph').querySelectorAll('[data-apv-prediction]').length,4);checks++;
const commonMax=Number(el('graph').dataset.timeMax);
for(const key of ['A','B','C','D']){click(choice(key));near(Number(el('graph').dataset.timeMax),commonMax);assert.equal(el('graph').querySelectorAll('[data-apv-prediction]').length,4);checks+=2;}
// Predicted graphs end at their own filling times, with no fictitious plateau.
for(const key of ['A','B','C','D']){
  const d=el('graph').querySelector(`[data-apv-prediction="${key}"]`).getAttribute('d'),last=[...d.matchAll(/[ML]([\d.]+) ([\d.]+)/g)].at(-1);
  near(Number(last[1]),55+560*(F.capacity(key)/12)/commonMax,.006);near(Number(last[2]),35,.006);checks+=2;
}
click(el('reveal'));assert.equal(el('answer').hidden,false);assert.equal(el('reveal').getAttribute('aria-expanded'),'true');click(choice('C'));assert.equal(el('answer').hidden,true);checks+=3;
reduced=true;mediaChange();assert.equal(el('play').disabled,true);click(el('play'));assert.equal(host.dataset.vesselPlaying,false);input(el('fill'),1);synchronized();checks+=2;
reduced=false;mediaChange();assert.equal(el('play').disabled,false);click(el('reset'));click(el('play'));frame(0);slide.hidden=true;frame(1000);assert.equal(host.dataset.vesselPlaying,false);checks+=2;
console.log(`PASS ${checks} vessel assertions: independent quadrature, volume conservation, slopes, all A–D, elapsed-time playback, pause/reset/scrub/inflow, synchronized water/point, common comparison axes, fill endpoints, answer reveal, reduced motion and hidden-slide stop. DOM fixture does not claim browser layout or signed-in production access.`);
