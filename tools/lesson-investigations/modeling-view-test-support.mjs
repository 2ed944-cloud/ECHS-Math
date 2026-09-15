import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {pathToFileURL,fileURLToPath} from 'node:url';
import path from 'node:path';
const arg=key=>{const i=process.argv.indexOf(key);return i<0?null:process.argv[i+1];};
const repo=path.resolve(arg('--repo')||path.join(path.dirname(fileURLToPath(import.meta.url)),'../..'));
const require=createRequire(import.meta.url),{parseHTML}=require(process.env.ECHS_TEST_DOM_MODULE||'linkedom');
const load=name=>import(pathToFileURL(path.join(repo,'lessons/shared/investigations',name)));
const {mountModeling}=await load('modeling-view.mjs');
const {numeric}=await load('modeling-view-helpers.mjs');
const {AP_MODELING_CONTENT}=await load('ap-modeling-content.mjs');
const scenes=Object.values(AP_MODELING_CONTENT).flatMap(lesson=>lesson.scenes).filter(scene=>scene.model==='modeling');
const close=(a,b,scale=1)=>assert.ok(Number.isFinite(a)&&Math.abs(a-b)<=1e-8*Math.max(scale,Math.abs(b)),`${a} != ${b}`);
const number=s=>Number(String(s).replaceAll(',',''));
function fixture(family,scene=structuredClone(scenes.find(s=>s.family===family))) {
  const {window,document}=parseHTML('<html><head></head><body><dialog class="ei-dialog"><div id="root"><p id="sentinel">Existing caller content</p></div></dialog></body></html>');
  // LinkeDOM has no native selected-value setter. Layout and keyboard are tested separately in Chrome.
  Object.defineProperty(window.HTMLSelectElement.prototype,'value',{configurable:true,get(){return this.querySelector('option[selected]')?.value??'';},set(value){for(const option of this.querySelectorAll('option'))option.toggleAttribute('selected',option.value===String(value));}});
  const root=document.querySelector('#root'),handle=mountModeling({root,window,scene});
  const section=root.querySelector('.ei-modeling-view');
  const control=key=>section.querySelector(`[data-modeling-control="${key}"]`);
  const input=(key,value)=>{const node=control(key);assert.ok(node);node.value=String(value);node.dispatchEvent(new window.Event(node.tagName==='SELECT'?'change':'input'));};
  return {window,document,root,handle,section,scene,control,input};
}
function coordinates(svg,node) {
  const xmin=Number(svg.dataset.xmin),xmax=Number(svg.dataset.xmax),ymin=Number(svg.dataset.ymin),ymax=Number(svg.dataset.ymax);
  assert.ok(xmax>xmin&&ymax>ymin);
  const raw=node.tagName.toLowerCase()==='polyline'?node.getAttribute('points').trim().split(/\s+/).map(pair=>pair.split(',').map(Number)):
    node.tagName.toLowerCase()==='polygon'?[node.getAttribute('points').split(/\s+/).map(pair=>pair.split(',').map(Number)).reduce((s,p)=>[s[0]+p[0]/4,s[1]+p[1]/4],[0,0])]:[[Number(node.getAttribute('cx')),Number(node.getAttribute('cy'))]];
  return raw.map(([px,py])=>{assert.ok(Number.isFinite(px)&&Number.isFinite(py)&&px>=70&&px<=570&&py>=42&&py<=282);return{x:xmin+(px-70)/500*(xmax-xmin),y:ymin+(282-py)/240*(ymax-ymin)};});
}
const rows=(f,key)=>[...f.section.querySelectorAll(`[data-modeling-table="${key}"] tbody tr`)].map(tr=>[...tr.children].map(td=>td.textContent));
function checksTransform(f,v) {
  const b=(v.reverseInput?-1:1)*v.horizontalMagnitude,svg=f.section.querySelector('[data-modeling-plot="transform"]');
  const domain=[v.h-2/b,v.h+3/b].sort((a,b)=>a-b),range=[v.k-v.a/4,v.k+12*v.a].sort((a,b)=>a-b);
  for(const key of ['parent','image']) {
    const points=coordinates(svg,svg.querySelector(`[data-modeling-series="${key}"]`));assert.equal(points.length,101);
    for(const p of points){const u=key==='parent'?p.x:b*(p.x-v.h);close(p.y,key==='parent'?u*u+u:v.a*(u*u+u)+v.k);}
    close(points[0].x,key==='parent'?-2:domain[0]);close(points.at(-1).x,key==='parent'?3:domain[1]);
    if(key==='image'){close(Math.min(...points.map(p=>p.y)),range[0]);close(Math.max(...points.map(p=>p.y)),range[1]);}
  }
  for(const [key,expected]of [['preimage',{x:v.u,y:v.u*v.u+v.u}],['image',{x:v.h+v.u/b,y:v.a*(v.u*v.u+v.u)+v.k}]]){const p=coordinates(svg,svg.querySelector(`[data-modeling-feature="${key}"]`))[0];close(p.x,expected.x);close(p.y,expected.y);}
  const table=rows(f,'transform-pairs');assert.equal(table.length,7);
  for(const row of table){const [u,p,x,y]=row.map(number);close(p,u*u+u);close(x,v.h+u/b,1e3);close(y,v.a*p+v.k);}
  const ledger=f.section.querySelector('[data-transform-ledger]').textContent;
  const parsed=[...ledger.matchAll(/\[([^\]]+)\]/g)].map(match=>match[1].split(',').map(number));assert.equal(parsed.length,4);
  for(const [actual,expected]of [[parsed[0],[-2,3]],[parsed[1],[-.25,12]],[parsed[2],domain],[parsed[3],range]])actual.forEach((n,i)=>close(n,expected[i],1e3));
}
function checksSelection(f,v) {
  const svg=f.section.querySelector('[data-modeling-plot="selection-data"]');
  for(const [key,fn]of [['linear',x=>4*x-1],['quadratic',x=>x*x+1]])for(const p of coordinates(svg,svg.querySelector(`[data-modeling-series="${key}"]`)))close(p.y,fn(p.x));
  const observed=[1,2,5+v.delta,10,17],expected=observed.map((y,x)=>({x,observed:y,predicted:v.candidate?x*x+1:4*x-1,residual:y-(v.candidate?x*x+1:4*x-1)}));
  const residual=f.section.querySelector('[data-modeling-plot="selection-residuals"]'),circles=residual.querySelectorAll('[data-modeling-point="residuals"]');assert.equal(circles.length,5);
  [...circles].forEach((circle,i)=>{const p=coordinates(residual,circle)[0];close(p.x,i);close(p.y,expected[i].residual);});
  const zero=residual.querySelector('[data-modeling-zero-line]'),ymin=Number(residual.dataset.ymin),ymax=Number(residual.dataset.ymax);close(Number(zero.getAttribute('y1')),282-(0-ymin)/(ymax-ymin)*240);
  const table=rows(f,'selection-residuals');assert.equal(table.length,5);table.forEach((r,i)=>assert.deepEqual(r.map(number),[i,expected[i].observed,expected[i].predicted,expected[i].residual,expected[i].residual**2]));
  const statistics=rows(f,'selection-statistics');assert.equal(statistics.length,2);
  statistics.forEach((row,index)=>{const errors=observed.map((y,x)=>y-(index?x*x+1:4*x-1)),sse=errors.reduce((n,r)=>n+r*r,0);assert.equal(number(row[1]),sse);close(number(row[2]),Math.sqrt(sse/5),1e3);assert.equal(row[3],'No');});
  assert.match(f.section.querySelector('[data-selection-candidate]').textContent,v.candidate?/Q\(x\)=x²\+1/:/L\(x\)=4x-1/);
}
function checksBox(f,v) {
  const L=18-2*v.t,W=10-2*v.t,V=v.t*L*W,net=f.section.querySelector('[data-modeling-diagram="net"]');
  assert.equal(net.querySelectorAll('[data-box-cut]').length,4);
  for(const rect of net.querySelectorAll('[data-box-cut]')){close(Number(rect.getAttribute('width')),20*v.t);close(Number(rect.getAttribute('height')),20*v.t);}
  const base=net.querySelector('[data-box-base]');close(Number(base.getAttribute('width')),20*L);close(Number(base.getAttribute('height')),20*W);close(Number(base.getAttribute('x')),100+20*v.t);close(Number(base.getAttribute('y')),50+20*v.t);
  const iso=f.section.querySelector('[data-modeling-diagram="isometric"]');assert.equal(iso.querySelectorAll('[data-box-face]').length,5);
  for(const face of iso.querySelectorAll('[data-box-face]')){const world=JSON.parse(face.getAttribute('data-world')),pixels=face.getAttribute('points').split(/\s+/).map(p=>p.split(',').map(Number));assert.equal(world.length,4);world.forEach(([x,z,h],i)=>{assert.ok([0,L].includes(x)&&[0,W].includes(z)&&[0,v.t].includes(h));close(pixels[i][0],300+5*Math.sqrt(3)*(x-z));close(pixels[i][1],100+5*(x+z)-10*h);assert.ok(pixels[i][0]>70&&pixels[i][0]<570&&pixels[i][1]>42&&pixels[i][1]<260);});}
  const svg=f.section.querySelector('[data-modeling-plot="box-volume"]'),points=coordinates(svg,svg.querySelector('[data-modeling-series="volume"]'));assert.equal(points.length,101);
  for(const p of points)close(p.y,180*p.x-56*p.x*p.x+4*p.x**3,10);
  const selected=coordinates(svg,svg.querySelector('[data-modeling-feature="selected-box"]'))[0];close(selected.x,v.t);close(selected.y,V);
  const endpoints=svg.querySelectorAll('[data-modeling-feature="excluded-boundary"]');assert.equal(endpoints.length,2);[...endpoints].forEach((node,i)=>{assert.equal(node.getAttribute('fill'),'#fff');const p=coordinates(svg,node)[0];close(p.x,i*5);close(p.y,0);assert.match(node.textContent,/not a usable box/);});
  const data=rows(f,'box-dimensions');assert.equal(data.length,19);data.forEach((r,i)=>{const t=(i+1)/4;assert.deepEqual(r.map(number),[t,18-2*t,10-2*t,t,t*(18-2*t)*(10-2*t)]);});
  const rates=rows(f,'box-rates');assert.equal(rates.length,18);rates.forEach((r,i)=>{const a=(i+1)/4,b=(i+2)/4,change=b*(18-2*b)*(10-2*b)-a*(18-2*a)*(10-2*a);assert.deepEqual(r.map(number),[a,b,change,4*change]);});
}
export async function run(family) {
  assert.equal(scenes.length,3);let passed=0,ticks=0;
  const group=async(name,fn)=>{await fn();passed++;console.log('PASS '+name);};
  const verify={transform:checksTransform,selection:checksSelection,construction:checksBox}[family];
  await group('actual content scene mounts with labelled controls, live summary and semantic tables',()=>{const f=fixture(family);assert.equal(f.section.dataset.modelingFamily,family);assert.equal(f.section.querySelector('[role="alert"]').hidden,true);assert.ok(f.section.querySelector('[role="status"]').textContent);for(const node of f.section.querySelectorAll('[data-modeling-control]')){assert.ok(f.document.getElementById(node.getAttribute('aria-labelledby')).textContent);assert.equal(number(f.section.querySelector(`output[for="${node.id}"]`).textContent),Number(node.value));}for(const wrap of f.section.querySelectorAll('[data-modeling-table]')){assert.equal(wrap.getAttribute('role'),'region');assert.equal(wrap.getAttribute('tabindex'),'0');assert.ok(wrap.querySelector('caption').textContent);for(const th of wrap.querySelectorAll('thead th'))assert.equal(th.scope,'col');}verify(f,f.scene.initial);f.handle.dispose();});
  await group('every declared control tick renders independently checked numeric and SVG coordinates',()=>{
    const f=fixture(family);
    if(family==='selection')for(let delta=-4;delta<=4;delta+=.5)for(let candidate=0;candidate<=1;candidate++){f.handle.update({delta,candidate});verify(f,{delta,candidate});ticks++;}
    else for(const c of f.scene.controls)for(let value=c.min;value<=c.max;value+=c.step){f.handle.update(f.scene.initial);f.input(c.key,value);const expected={...f.scene.initial,[c.key]:value};assert.equal(f.section.querySelector('[data-modeling-error]').hidden,true);verify(f,expected);ticks++;}
    f.handle.dispose();
  });
  await group('reset restores captured defaults even after original input and controls mutate',()=>{const f=fixture(family),initial={...f.scene.initial},c=f.scene.controls[0];f.input(c.key,c.max);f.scene.initial[c.key]=c.min;f.scene.controls[0].min=-999;f.section.querySelector('[data-modeling-reset]').dispatchEvent(new f.window.Event('click'));verify(f,initial);assert.equal(Number(f.control(c.key).value),initial[c.key]);f.handle.dispose();});
  await group('invalid complete inputs leave committed display unchanged and errors disclose no hostile getter text',()=>{const f=fixture(family),before=f.root.innerHTML,key=Object.keys(f.scene.initial)[0];const bad=[{}, {...f.scene.initial,extra:1},{...f.scene.initial,[key]:NaN},{...f.scene.initial,[key]:Infinity},{...f.scene.initial,[key]:true},{...f.scene.initial,[key]:'1'}];for(const value of bad){assert.throws(()=>f.handle.update(value),/Invalid modeling view configuration/);assert.equal(f.root.innerHTML,before);}const hostile=new Proxy({}, {ownKeys(){throw Error('private-marker');}});assert.throws(()=>f.handle.update(hostile),error=>!error.message.includes('private-marker'));assert.equal(f.root.innerHTML,before);f.handle.dispose();});
  await group('scene and controls are validated before caller DOM mutation',()=>{const original=structuredClone(scenes.find(s=>s.family===family));for(const edit of [s=>s.model='unknown',s=>s.family='__proto__',s=>s.initial={},s=>s.controls.push(s.controls[0]),s=>s.controls[0].step=0,s=>s.controls[0].key='unknown']){const {window,document}=parseHTML('<div id="r"><p>Keep</p></div>'),root=document.querySelector('#r'),scene=structuredClone(original);edit(scene);assert.throws(()=>mountModeling({root,window,scene}));assert.equal(root.innerHTML,'<p>Keep</p>');}});
  await group('optional controls allow read-only model displays and configured subsets remain enforced',()=>{const scene=structuredClone(scenes.find(s=>s.family===family));scene.controls=[];const f=fixture(family,scene);assert.equal(f.section.querySelectorAll('[data-modeling-control]').length,0);verify(f,scene.initial);f.handle.dispose();const limited=structuredClone(scenes.find(s=>s.family===family)),c=limited.controls[0];c.max=limited.initial[c.key]===c.min?c.min+c.step:limited.initial[c.key];const g=fixture(family,limited);const before=g.root.innerHTML;assert.throws(()=>g.handle.update({...limited.initial,[c.key]:c.max+c.step}));assert.equal(g.root.innerHTML,before);g.handle.dispose();});
  await group('dispose is idempotent, removes only owned section and detaches old controls',()=>{const f=fixture(family),old=f.section,input=f.control(f.scene.controls[0].key);f.handle.dispose();f.handle.dispose();input.value='999';const before=old.innerHTML;input.dispatchEvent(new f.window.Event(input.tagName==='SELECT'?'change':'input'));assert.equal(old.innerHTML,before);assert.equal(f.root.querySelector('#sentinel').textContent,'Existing caller content');assert.equal(f.root.querySelector('.ei-modeling-view'),null);assert.throws(()=>f.handle.update(f.scene.initial),/disposed/);});
  await group('labels are text only, numeric formatting preserves small signs, graph size remains bounded',()=>{const scene=structuredClone(scenes.find(s=>s.family===family));scene.controls[0].label='<img src=x onerror=alert(1)>';const f=fixture(family,scene);assert.equal(f.section.querySelector('img'),null);assert.ok(f.section.textContent.includes('<img'));for(const n of [1e-7,-1e-7,.000004,-.000004]){const shown=numeric(n);assert.notEqual(number(shown),0);assert.equal(Math.sign(number(shown)),Math.sign(n));}assert.equal(numeric(-0),'0');assert.throws(()=>numeric(NaN));for(const svg of f.section.querySelectorAll('svg')){assert.ok(svg.outerHTML.length<100000);assert.doesNotMatch(svg.outerHTML,/NaN|Infinity/);assert.ok(svg.closest('.ei-graph-scroll'));}f.handle.dispose();});
  if(family==='transform') {
    await group('negative b reverses endpoints without losing selected warmup image',()=>{const f=fixture(family);f.handle.update({a:-2,horizontalMagnitude:.5,reverseInput:1,h:4,k:1,u:-2});checksTransform(f,{a:-2,horizontalMagnitude:.5,reverseInput:1,h:4,k:1,u:-2});assert.match(f.section.querySelector('[data-transform-selected]').textContent,/\(8, -3\)/);assert.deepEqual(rows(f,'transform-endpoints').map(r=>number(r[1])),[8,-2]);f.handle.dispose();});
    await group('zero a is a restricted constant collapse, with range reduced to one value',()=>{const f=fixture(family),v={...f.scene.initial,a:0,k:3};f.handle.update(v);checksTransform(f,v);assert.match(f.section.querySelector('[data-transform-interpretation]').textContent,/not an invertible dilation/);assert.match(f.section.querySelector('[data-transform-ledger]').textContent,/image range \[3, 3\]/);f.handle.dispose();});
  } else if(family==='selection') {
    await group('δ4 reverses SSE ranking while both candidate coefficients stay fixed',()=>{const f=fixture(family);f.handle.update({delta:4,candidate:0});checksSelection(f,{delta:4,candidate:0});assert.deepEqual(rows(f,'selection-statistics').map(r=>number(r[1])),[14,16]);assert.match(f.section.querySelector('[data-selection-error-summary]').textContent,/L has the smaller SSE/);f.handle.update({delta:3.5,candidate:1});assert.match(f.section.querySelector('[data-selection-error-summary]').textContent,/tie in SSE/);f.handle.dispose();});
    await group('five exact zero residuals remain visible as dots on the explicit zero baseline',()=>{const f=fixture(family);f.handle.update({delta:0,candidate:1});const svg=f.section.querySelector('[data-modeling-plot="selection-residuals"]'),zero=Number(svg.querySelector('[data-modeling-zero-line]').getAttribute('y1'));for(const circle of svg.querySelectorAll('[data-modeling-point]')){close(Number(circle.getAttribute('cy')),zero);assert.equal(Number(circle.getAttribute('r')),5);}f.handle.dispose();});
  } else {
    await group('quarter-sample maximum and boundary limits cannot be read as global optimum or usable boxes',()=>{const f=fixture(family);assert.match(f.section.querySelector('[data-box-sample-maximum]').textContent,/168 cm³ at t = 2 cm/);assert.match(f.section.querySelector('[data-box-sample-maximum]').textContent,/not a proof of the global maximum/);const before=f.root.innerHTML;for(const t of [0,5,-1,5.25,.1]){assert.throws(()=>f.handle.update({t}));assert.equal(f.root.innerHTML,before);}f.handle.dispose();});
    await group('volume128,168,144 and interval rates40,-24 agree independently with geometry',()=>{const f=fixture(family),v=t=>t*(18-2*t)*(10-2*t);assert.deepEqual([1,2,3].map(v),[128,168,144]);assert.deepEqual([v(2)-v(1),v(3)-v(2)],[40,-24]);for(const t of [1,2,3]){f.handle.update({t});assert.match(f.section.querySelector('[data-box-formula]').textContent,new RegExp(`V = ${v(t)} cm³`));}f.handle.dispose();});
  }
  console.log(JSON.stringify({status:'PASS',family,groups:passed,controlStates:ticks,native_browser:false,layout_checked:false,assessment_writes:0}));
}
