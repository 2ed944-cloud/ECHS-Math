(function(){
'use strict';
const data=window.LESSON_DATA;
if(!data||String(data.lesson?.number)!=='6.2')return;
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const prefix='echs:ib-ai:u6:6.2:';
const fmt=(v,d=6)=>Number.isFinite(v)?Number(v.toFixed(d)).toLocaleString('en-US',{maximumFractionDigits:d}):'undefined';
const store={
  get(k,f=''){try{const v=localStorage.getItem(prefix+k);return v===null?f:v;}catch{return f;}},
  set(k,v){try{localStorage.setItem(prefix+k,String(v));}catch{}}
};

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
  if(node){node.textContent='Lesson 6.2 completion saved on this device and shared with the platform bridge.';node.classList.add('show');}
}

function initQuestionAudit(root=document){
  $$('[data-u62-question-audit]',root).forEach(lab=>{
    if(lab.dataset.ready==='1')return;
    lab.dataset.ready='1';
    const rq=$('[data-u62-audit-rq]',lab);
    const checks=$$('[data-u62-audit-item]',lab);
    const out=$('[data-u62-audit-output]',lab);
    rq.value=store.get('audit-rq','');
    checks.forEach((box,index)=>{
      box.checked=store.get(`audit-check-${index}`,'0')==='1';
      box.addEventListener('change',()=>{store.set(`audit-check-${index}`,box.checked?'1':'0');run();});
    });
    rq.addEventListener('input',()=>{store.set('audit-rq',rq.value);});
    function run(){
      const score=checks.reduce((sum,box)=>sum+(box.checked?Number(box.value)||0:0),0);
      const missing=checks.filter(box=>!box.checked).map(box=>box.parentElement.textContent.trim());
      let band='Not ready for a full pilot.';
      if(score>=10)band='Promising question—test it with a small pilot before approval.';
      else if(score>=7)band='Viable direction, but important design evidence is still missing.';
      else if(score>=4)band='The topic needs substantial narrowing and mathematical planning.';
      const wording=rq.value.trim().length<20?' The wording is still too short to communicate a complete question.':'';
      out.innerHTML=`<strong>Evidence score: ${score} / 12</strong><p>${band}${wording}</p>${missing.length?`<p><b>Next revision:</b> ${missing.slice(0,2).join(' · ')}</p>`:'<p><b>Next revision:</b> run the data-access, ethics, and model-feasibility pilot.</p>'}`;
    }
    $('[data-u62-audit-run]',lab)?.addEventListener('click',run);
    run();
  });
}

function initScopeLab(root=document){
  $$('[data-u62-scope-lab]',root).forEach(lab=>{
    if(lab.dataset.ready==='1')return;
    lab.dataset.ready='1';
    const inputs=$$('[data-u62-scope]',lab);
    const flags=$$('[data-u62-scope-flag]',lab);
    const out=$('[data-u62-scope-output]',lab);
    inputs.forEach(input=>{
      const key=`scope-${input.dataset.u62Scope}`;
      input.value=store.get(key,input.value);
      input.addEventListener('change',()=>{store.set(key,input.value);run();});
    });
    flags.forEach(flag=>{
      const key=`scope-flag-${flag.dataset.u62ScopeFlag}`;
      flag.checked=store.get(key,flag.checked?'1':'0')==='1';
      flag.addEventListener('change',()=>{store.set(key,flag.checked?'1':'0');run();});
    });
    function run(){
      const values=Object.fromEntries(inputs.map(input=>[input.dataset.u62Scope,Number(input.value)]));
      const hasDomain=flags.find(f=>f.dataset.u62ScopeFlag==='domain')?.checked;
      const hasMetric=flags.find(f=>f.dataset.u62ScopeFlag==='metric')?.checked;
      let score=0;const warnings=[];const strengths=[];
      if(values.variables>=2&&values.variables<=4){score+=2;strengths.push('manageable variable set');}
      else if(values.variables>4)warnings.push('too many variables may dilute the argument');
      else warnings.push('define at least one input/objective and one response or comparison quantity');
      if(values.stages>=3&&values.stages<=6){score+=2;strengths.push('connected mathematical sequence is possible');}
      else if(values.stages>6)warnings.push('verify that the methods form one chain rather than a technique parade');
      else warnings.push('add enough connected stages for representation, analysis, and evaluation');
      if(values.validation>=1){score+=2;strengths.push('independent checking is planned');}
      else warnings.push('add a validation or second-representation check');
      if(values.observations>=10){score+=2;strengths.push('a useful pilot/data set may be possible');}
      else warnings.push('pilot the design and judge whether the available evidence reveals the intended pattern');
      if(hasDomain){score+=1;}else warnings.push('state domain and units');
      if(hasMetric){score+=1;}else warnings.push('define the decision criterion');
      const band=score>=9?'Strong architecture signal':score>=6?'Promising but incomplete':'Redesign before full collection';
      out.innerHTML=`<strong>${band} · ${score}/10</strong><p>${strengths.length?strengths.join(' · '):'No design strength has yet been evidenced.'}</p><p><b>Audit:</b> ${warnings.length?warnings.join(' · '):'No structural warning detected; a real pilot and teacher review are still required.'}</p><p class="u62-muted">Observation count is not a universal quality threshold; adequacy depends on purpose, variability, sampling, and domain coverage.</p>`;
    }
    $('[data-u62-scope-run]',lab)?.addEventListener('click',run);
    run();
  });
}

function parseNumbers(text){
  return String(text||'').split(/[\s,;]+/).filter(Boolean).map(Number);
}
function linearFit(xs,ys){
  const n=xs.length;
  const mx=xs.reduce((a,b)=>a+b,0)/n, my=ys.reduce((a,b)=>a+b,0)/n;
  const den=xs.reduce((s,x)=>s+(x-mx)**2,0);
  if(Math.abs(den)<1e-12)throw new Error('The input values must not all be equal.');
  const a=xs.reduce((s,x,i)=>s+(x-mx)*(ys[i]-my),0)/den;
  return [a,my-a*mx];
}
function solve3(A,b){
  const M=A.map((row,i)=>[...row,b[i]]);
  for(let col=0;col<3;col++){
    let pivot=col;
    for(let r=col+1;r<3;r++)if(Math.abs(M[r][col])>Math.abs(M[pivot][col]))pivot=r;
    if(Math.abs(M[pivot][col])<1e-12)throw new Error('At least three distinct input values are needed for a quadratic fit.');
    [M[col],M[pivot]]=[M[pivot],M[col]];
    const p=M[col][col];
    for(let j=col;j<4;j++)M[col][j]/=p;
    for(let r=0;r<3;r++)if(r!==col){
      const f=M[r][col];
      for(let j=col;j<4;j++)M[r][j]-=f*M[col][j];
    }
  }
  return [M[0][3],M[1][3],M[2][3]];
}
function quadraticFit(xs,ys){
  const n=xs.length;
  const s1=xs.reduce((a,b)=>a+b,0),s2=xs.reduce((a,x)=>a+x*x,0),s3=xs.reduce((a,x)=>a+x**3,0),s4=xs.reduce((a,x)=>a+x**4,0);
  const sy=ys.reduce((a,b)=>a+b,0),sxy=xs.reduce((a,x,i)=>a+x*ys[i],0),sx2y=xs.reduce((a,x,i)=>a+x*x*ys[i],0);
  const [c,b,a]=solve3([[n,s1,s2],[s1,s2,s3],[s2,s3,s4]],[sy,sxy,sx2y]);
  return [a,b,c];
}
function evaluate(coef,x){return coef.reduce((sum,c,i)=>sum+c*x**(coef.length-1-i),0);}
function modelMetrics(coef,xs,ys){
  const pred=xs.map(x=>evaluate(coef,x));
  const residuals=ys.map((y,i)=>y-pred[i]);
  const mean=ys.reduce((a,b)=>a+b,0)/ys.length;
  const sse=residuals.reduce((s,e)=>s+e*e,0);
  const sst=ys.reduce((s,y)=>s+(y-mean)**2,0);
  return {pred,residuals,sse,r2:sst>1e-12?1-sse/sst:NaN,mae:residuals.reduce((s,e)=>s+Math.abs(e),0)/ys.length,rmse:Math.sqrt(sse/ys.length)};
}
function plotSvg(xs,ys,lin,quad){
  const W=720,H=360,m={l:58,r:24,t:26,b:48};
  let xmin=Math.min(...xs),xmax=Math.max(...xs),ymin=Math.min(...ys),ymax=Math.max(...ys);
  const xpad=(xmax-xmin||1)*.08,ypad=(ymax-ymin||1)*.12;xmin-=xpad;xmax+=xpad;ymin-=ypad;ymax+=ypad;
  const sx=x=>m.l+(x-xmin)/(xmax-xmin)*(W-m.l-m.r);
  const sy=y=>H-m.b-(y-ymin)/(ymax-ymin)*(H-m.t-m.b);
  const samples=Array.from({length:101},(_,i)=>xmin+(xmax-xmin)*i/100);
  const path=coef=>samples.map((x,i)=>`${i?'L':'M'}${sx(x).toFixed(2)} ${sy(evaluate(coef,x)).toFixed(2)}`).join(' ');
  const points=xs.map((x,i)=>`<circle cx="${sx(x).toFixed(2)}" cy="${sy(ys[i]).toFixed(2)}" r="5.5" fill="#7a1733"><title>x=${fmt(x)}, y=${fmt(ys[i])}</title></circle>`).join('');
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Pilot points with linear and quadratic least-squares models">
    <rect x="1" y="1" width="${W-2}" height="${H-2}" rx="18" fill="#fffdf9" stroke="#ded5ca"/>
    <path d="M${m.l} ${H-m.b}H${W-m.r}M${m.l} ${H-m.b}V${m.t}" stroke="#17324d" stroke-width="2"/>
    <path d="${path(lin)}" fill="none" stroke="#d4a72c" stroke-width="4" stroke-dasharray="10 7"/>
    <path d="${path(quad)}" fill="none" stroke="#177e89" stroke-width="4"/>
    ${points}
    <text x="${m.l}" y="18" fill="#596977" font-size="13">response</text>
    <text x="${W-m.r}" y="${H-15}" text-anchor="end" fill="#596977" font-size="13">input</text>
    <g transform="translate(${W-280} 20)" font-size="13" font-weight="800"><line x1="0" x2="34" y1="0" y2="0" stroke="#d4a72c" stroke-width="4" stroke-dasharray="8 5"/><text x="42" y="5" fill="#17324d">linear</text><line x1="120" x2="154" y1="0" y2="0" stroke="#177e89" stroke-width="4"/><text x="162" y="5" fill="#17324d">quadratic</text></g>
  </svg>`;
}
function initModelLab(root=document){
  $$('[data-u62-model-lab]',root).forEach(lab=>{
    if(lab.dataset.ready==='1')return;
    lab.dataset.ready='1';
    const xNode=$('[data-u62-model-x]',lab),yNode=$('[data-u62-model-y]',lab);
    const out=$('[data-u62-model-output]',lab),plot=$('[data-u62-model-plot]',lab);
    xNode.value=store.get('model-x',xNode.value);yNode.value=store.get('model-y',yNode.value);
    xNode.addEventListener('input',()=>store.set('model-x',xNode.value));
    yNode.addEventListener('input',()=>store.set('model-y',yNode.value));
    function run(){
      try{
        const xs=parseNumbers(xNode.value),ys=parseNumbers(yNode.value);
        if(xs.length!==ys.length)throw new Error('The two lists must contain the same number of paired values.');
        if(xs.length<3)throw new Error('Enter at least three paired observations.');
        if(!xs.every(Number.isFinite)||!ys.every(Number.isFinite))throw new Error('Use finite numerical values only.');
        const lin=linearFit(xs,ys),quad=quadraticFit(xs,ys);
        const lm=modelMetrics(lin,xs,ys),qm=modelMetrics(quad,xs,ys);
        const sign=n=>n<0?'−':'+';
        out.innerHTML=`<strong>Pilot comparison · ${xs.length} paired observations</strong>
          <p><b>Linear:</b> ŷ = ${fmt(lin[0],6)}x ${sign(lin[1])} ${fmt(Math.abs(lin[1]),6)} · R² = ${fmt(lm.r2,6)} · MAE = ${fmt(lm.mae,6)} · RMSE = ${fmt(lm.rmse,6)}</p>
          <p><b>Quadratic:</b> ŷ = ${fmt(quad[0],6)}x² ${sign(quad[1])} ${fmt(Math.abs(quad[1]),6)}x ${sign(quad[2])} ${fmt(Math.abs(quad[2]),6)} · R² = ${fmt(qm.r2,6)} · MAE = ${fmt(qm.mae,6)} · RMSE = ${fmt(qm.rmse,6)}</p>
          <p><b>Question-design judgement:</b> compare residual pattern, validation error, parameter meaning, and domain plausibility before selecting a model.</p>`;
        plot.innerHTML=plotSvg(xs,ys,lin,quad);
      }catch(error){out.innerHTML=`<strong>Model audit stopped</strong><p>${error.message}</p>`;plot.innerHTML='';}
    }
    $('[data-u62-model-run]',lab)?.addEventListener('click',run);
    run();
  });
}

function initBuilder(root=document){
  $$('[data-u62-builder]',root).forEach(lab=>{
    if(lab.dataset.ready==='1')return;
    lab.dataset.ready='1';
    const fields=$$('[data-u62-builder-field]',lab);
    const out=$('[data-u62-builder-output]',lab);
    fields.forEach(field=>{
      const key=`builder-${field.dataset.u62BuilderField}`;
      field.value=store.get(key,field.value);
      field.addEventListener('input',()=>store.set(key,field.value));
      field.addEventListener('change',()=>store.set(key,field.value));
    });
    function run(){
      const v=Object.fromEntries(fields.map(field=>[field.dataset.u62BuilderField,field.value.trim()]));
      const missing=Object.entries(v).filter(([,value])=>!value).map(([key])=>key);
      if(missing.length){out.textContent=`Complete: ${missing.join(', ')}.`;return;}
      const question=`Within ${v.domain}, to what extent can ${v.action} the relationship between ${v.input} and ${v.response} for ${v.context}, judged by ${v.evidence}?`;
      out.textContent=question;
      store.set('builder-output',question);
    }
    $('[data-u62-builder-run]',lab)?.addEventListener('click',run);
    const saved=store.get('builder-output','');if(saved)out.textContent=saved;else run();
  });
}

function initShell(){
  const start=$('#start-lesson');
  if(start&&!start.dataset.u62){start.dataset.u62='1';start.addEventListener('click',()=>{location.hash='#learn';window.scrollTo({top:0,behavior:'smooth'});start.textContent='Learning';});}
  const full=$('#toggle-fullscreen');
  if(full&&!full.dataset.u62){full.dataset.u62='1';full.addEventListener('click',async()=>{try{if(!document.fullscreenElement)await document.documentElement.requestFullscreen();else await document.exitFullscreen();}catch{}});}
  const menu=$('#toggle-route-menu'),route=$('#lesson-route-menu');
  if(menu&&route&&!menu.dataset.u62){menu.dataset.u62='1';menu.addEventListener('click',()=>{const open=route.classList.toggle('u62-open');menu.setAttribute('aria-expanded',String(open));});}
}
function initDynamic(root=$('#app')||document){initQuestionAudit(root);initScopeLab(root);initModelLab(root);initBuilder(root);}
function init(){
  initShell();initDynamic();
  const app=$('#app');if(app)new MutationObserver(()=>initDynamic(app)).observe(app,{childList:true,subtree:true});
  document.addEventListener('click',event=>{
    const completion=event.target.closest?.('#mark-lesson-complete');
    if(completion){event.preventDefault();event.stopImmediatePropagation();saveCompletion();}
  },true);
  document.addEventListener('keydown',event=>{
    if(event.key.toLowerCase()==='t'&&!/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName||'')){
      document.dispatchEvent(new CustomEvent('echs:ti84:simulator'));
    }
  });
  data.questionDesignAudit={
    release:'6.2.0',
    screens:data.slides.length,
    practice:data.practice.length,
    extendedTasks:data.exam.length,
    quiz:data.quiz.length,
    interactive:['question audit','scope audit','linear/quadratic pilot lab','research-question builder'],
    assessmentVersionGate:true,
    ethicsAndProvenance:true,
    completionUnit:6
  };
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
