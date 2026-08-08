(function(){
'use strict';
const data=window.LESSON_DATA;
if(!data||String(data.lesson?.number)!=='6.1')return;
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const fmt=(v,d=6)=>Number.isFinite(v)?Number(v.toFixed(d)).toLocaleString('en-US',{maximumFractionDigits:d}):'undefined';

function saveCompletion(){
  const params=new URLSearchParams(location.search);
  const key=params.get('lessonKey')||`ib-math-ai::6::${data.lesson.number}::${data.lesson.title}`;
  let rows=[];
  try{rows=JSON.parse(localStorage.getItem('echs_math_complete')||'[]');if(!Array.isArray(rows))rows=[];}catch{rows=[];}
  if(!rows.includes(key))rows.push(key);
  try{localStorage.setItem('echs_math_complete',JSON.stringify(rows));}catch{}
  const detail={course:'ib-math-ai',unit:6,topic:data.lesson.number,lessonKey:key,title:data.lesson.title,completed:true,at:new Date().toISOString()};
  document.dispatchEvent(new CustomEvent('echs:lesson-complete',{detail}));
  try{window.parent?.postMessage({type:'echs:lesson-complete',detail},'*');}catch{}
  const node=$('#completion-feedback');
  if(node){node.textContent='Lesson 6.1 completion saved on this device and shared with the platform bridge.';node.classList.add('show');}
}

document.addEventListener('click',event=>{
  const completion=event.target.closest?.('#mark-lesson-complete');
  if(completion){event.preventDefault();event.stopImmediatePropagation();saveCompletion();return;}
},true);

function initWindowLab(root=document){
  $$('[data-u61-window-lab]',root).forEach(lab=>{
    if(lab.dataset.ready==='1')return;lab.dataset.ready='1';
    const run=()=>{
      const values=Object.fromEntries($$('[data-w]',lab).map(input=>[input.dataset.w,Number(input.value)]));
      const out=$('[data-w-output]',lab);
      if(!Object.values(values).every(Number.isFinite)||values.xmin>=values.xmax||values.ymin>=values.ymax){out.textContent='Use finite bounds with minimum less than maximum on each axis.';return;}
      const zeroL=4-Math.sqrt(20),zeroR=4+Math.sqrt(20),vx=4,vy=10;
      const includesVertex=values.xmin<=vx&&vx<=values.xmax&&values.ymin<=vy&&vy<=values.ymax;
      const includesBoth=zeros=>values.xmin<=zeroL&&zeroR<=values.xmax&&values.ymin<=0&&0<=values.ymax;
      const visible=[];
      if(includesVertex)visible.push('the maximum (4,10)');
      if(includesBoth())visible.push('both zeros');
      const missing=[];
      if(!includesVertex)missing.push('the maximum');
      if(!includesBoth())missing.push('both zeros together');
      out.textContent=`This window ${visible.length?'shows '+visible.join(' and '):'does not show the required features'}.${missing.length?' It misses '+missing.join(' and ')+'.':''}`;
    };
    $('[data-w-run]',lab)?.addEventListener('click',run);
    $$('[data-w]',lab).forEach(input=>input.addEventListener('change',run));
    run();
  });
}

function erf(x){
  const sign=x<0?-1:1; x=Math.abs(x);
  const a1=.254829592,a2=-.284496736,a3=1.421413741,a4=-1.453152027,a5=1.061405429,p=.3275911;
  const t=1/(1+p*x);
  const y=1-(((((a5*t+a4)*t)+a3)*t+a2)*t+a1)*t*Math.exp(-x*x);
  return sign*y;
}
function normalCdf(x,mu,sigma){return .5*(1+erf((x-mu)/(sigma*Math.SQRT2)));}
function binomPmf(n,p,k){
  if(!Number.isInteger(n)||!Number.isInteger(k)||n<0||k<0||k>n||p<0||p>1)return NaN;
  let c=1;for(let i=1;i<=k;i++)c=c*(n-k+i)/i;
  return c*p**k*(1-p)**(n-k);
}

const workflows={
  exponential:{label:'Solve a^t = T',fields:[['a','Base a',2.7],['target','Target T',18]],run:v=>{
    if(v.a<=0||v.a===1||v.target<=0)return {result:'Invalid exponential parameters.',verify:'Require a>0, a≠1 and T>0.'};
    const t=Math.log(v.target)/Math.log(v.a);return {result:`t = ${fmt(t,9)}`,verify:`Check: ${fmt(v.a**t,8)} ≈ ${fmt(v.target,8)}.`};}},
  binomial:{label:'Binomial exact probability',fields:[['n','Trials n',12],['p','Success probability p',.35],['k','Successes k',5]],run:v=>{const q=binomPmf(v.n,v.p,v.k);return {result:`P(X=${v.k}) = ${fmt(q,9)}`,verify:'Use binompdf because the event is one exact count.'};}},
  normal:{label:'Normal probability between bounds',fields:[['mu','Mean μ',72],['sigma','Standard deviation σ',8],['lo','Lower bound',65],['hi','Upper bound',84]],run:v=>{if(v.sigma<=0||v.lo>v.hi)return {result:'Invalid normal parameters.',verify:'Require σ>0 and lower≤upper.'};const q=normalCdf(v.hi,v.mu,v.sigma)-normalCdf(v.lo,v.mu,v.sigma);return {result:`P(${fmt(v.lo)}<X<${fmt(v.hi)}) = ${fmt(q,9)}`,verify:`z-bounds: ${fmt((v.lo-v.mu)/v.sigma,4)} to ${fmt((v.hi-v.mu)/v.sigma,4)}.`};}},
  derivative:{label:'Derivative of ax²+bx+c at x₀',fields:[['a','a',-.06],['b','b',.75],['c','c',4.2],['x0','x₀',3]],run:v=>({result:`f′(${fmt(v.x0)}) = ${fmt(2*v.a*v.x0+v.b,9)}`,verify:'For f(x)=ax²+bx+c, f′(x)=2ax+b.'})},
  integral:{label:'Integral of ax²+bx+c',fields:[['a','a',-1.5],['b','b',18],['c','c',120],['lo','Lower bound',0],['hi','Upper bound',8]],run:v=>{const F=x=>v.a*x**3/3+v.b*x**2/2+v.c*x;return {result:`Accumulation = ${fmt(F(v.hi)-F(v.lo),9)}`,verify:'Verify units: integrand units × input units.'};}},
  residual:{label:'Residual y − ŷ',fields:[['y','Observed y',72],['yhat','Predicted ŷ',73.4166667]],run:v=>({result:`Residual = ${fmt(v.y-v.yhat,9)}`,verify:v.y-v.yhat<0?'Negative: the model overpredicted.':v.y-v.yhat>0?'Positive: the model underpredicted.':'Zero: the point lies on the model.'})}
};
function initMiniLab(root=document){
  $$('#lesson-lab[data-lab="6.1"]',root).forEach(lab=>{
    if(lab.dataset.ready==='1')return;lab.dataset.ready='1';
    lab.innerHTML=`<h3>TI‑84 evidence builder</h3><p>Choose a routine, edit the mathematical inputs, predict the result, then calculate and verify.</p><label>Routine<select data-u61-routine>${Object.entries(workflows).map(([key,w])=>`<option value="${key}">${w.label}</option>`).join('')}</select></label><div class="lab-grid" data-u61-fields></div><button type="button" class="primary-btn" data-u61-run>Calculate and build evidence</button><div class="lab-output" data-u61-result>Choose a routine.</div>`;
    const select=$('[data-u61-routine]',lab),fields=$('[data-u61-fields]',lab),result=$('[data-u61-result]',lab);
    const drawFields=()=>{const w=workflows[select.value];fields.innerHTML=w.fields.map(([key,label,value])=>`<label>${label}<input type="number" step="any" data-u61-field="${key}" value="${value}"></label>`).join('');run();};
    const run=()=>{const w=workflows[select.value];const values=Object.fromEntries($$('[data-u61-field]',lab).map(input=>[input.dataset.u61Field,Number(input.value)]));const out=w.run(values);result.innerHTML=`<b>Output:</b> ${out.result}<br><b>Verification/interpretation:</b> ${out.verify}`;};
    select.addEventListener('change',drawFields);$('[data-u61-run]',lab).addEventListener('click',run);fields.addEventListener('change',run);drawFields();
  });
}
function initShell(){
  const start=$('#start-lesson');
  if(start&&!start.dataset.u61){start.dataset.u61='1';start.addEventListener('click',()=>{location.hash='#learn';window.scrollTo({top:0,behavior:'smooth'});start.textContent='Learning';});}
  const full=$('#toggle-fullscreen');
  if(full&&!full.dataset.u61){full.dataset.u61='1';full.addEventListener('click',async()=>{try{if(!document.fullscreenElement)await document.documentElement.requestFullscreen();else await document.exitFullscreen();}catch{}});}
  const menu=$('#toggle-route-menu'),route=$('#lesson-route-menu');
  if(menu&&route&&!menu.dataset.u61){menu.dataset.u61='1';menu.addEventListener('click',()=>{const open=route.classList.toggle('u61-open');menu.setAttribute('aria-expanded',String(open));});}
}
function initDynamic(){initWindowLab($('#app')||document);initMiniLab($('#app')||document);}
function init(){initShell();initDynamic();const app=$('#app');if(app)new MutationObserver(initDynamic).observe(app,{childList:true,subtree:true});
  document.addEventListener('keydown',event=>{if(event.key.toLowerCase()==='t'&&!/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName||'')){document.dispatchEvent(new CustomEvent('echs:ti84:simulator'));}});
  data.technologyAudit={release:'6.1.0',protocol:['model','setup','output','verify','interpret'],completionUnit:6,interactiveWindowAudit:true,evidenceBuilder:true};
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
