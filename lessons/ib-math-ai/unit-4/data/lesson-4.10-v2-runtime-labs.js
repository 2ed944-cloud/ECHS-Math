(function(){
'use strict';
const R=window.U410_RUNTIME;if(!R)return;
const {U,$,$$,esc,drawPMF}=R;
const parseNum=(el,fallback=0)=>{const v=Number(el?.value);return Number.isFinite(v)?v:fallback};
const eventTypes=[['exact','Exactly X = k'],['atMost','At most X ≤ k'],['lessThan','Fewer than X < k'],['atLeast','At least X ≥ k'],['moreThan','More than X > k'],['between','Between a ≤ X ≤ b']];
const typeOptions=sel=>eventTypes.map(([v,t])=>`<option value="${v}" ${v===sel?'selected':''}>${t}</option>`).join('');
function shell(title,subtitle,body){return`<section class="u410-lab-shell"><header><div><span>Interactive probability laboratory</span><h3>${title}</h3></div>${subtitle?`<p>${subtitle}</p>`:''}</header>${body}</section>`}
function readEvent(root){
  const n=Math.max(0,Math.min(120,Math.round(parseNum($('[data-n]',root),12)))),p=Math.max(0,Math.min(1,parseNum($('[data-p]',root),.4))),type=$('[data-type]',root)?.value||'exact',a=Math.round(parseNum($('[data-a]',root),3)),b=Math.round(parseNum($('[data-b]',root),6));
  return{n,p,type,a,b};
}
function toggleB(root,type){const e=$('[data-b-wrap]',root);if(e)e.hidden=type!=='between'}
function eventForm(v={n:12,p:.4,type:'exact',a:4,b:7}){return`<div class="u410-controls"><label>Trials n<input data-n type="number" min="0" max="120" step="1" value="${v.n}"></label><label>Probability p<input data-p type="number" min="0" max="1" step="0.01" value="${v.p}"></label><label class="wide">Event<select data-type>${typeOptions(v.type)}</select></label><label>Boundary k / a<input data-a type="number" step="1" value="${v.a}"></label><label data-b-wrap>Upper b<input data-b type="number" step="1" value="${v.b}"></label><button class="primary-btn" type="button" data-run>Calculate</button></div>`}
function validEvent(e){return U.valid(e.n,e.p)&&e.a>=0&&e.a<=e.n&&(e.type!=='between'||(e.b>=e.a&&e.b<=e.n))}
function eventResult(root,e,includeMoments=true){
  const valid=validEvent(e),prob=valid?U.event(e.n,e.p,e.type,e.a,e.b):NaN,syntax=valid?U.syntax(e.n,e.p,e.type,e.a,e.b):'Check n, p, and integer boundaries.';
  const out=$('[data-out]',root);if(out)out.innerHTML=`<div class="u410-readout"><article><span>TI‑84 expression</span><b>${esc(syntax)}</b></article><article><span>Probability</span><b>${U.fmt(prob,9)}</b></article>${includeMoments?`<article><span>Mean</span><b>${U.fmt(U.mean(e.n,e.p),5)}</b></article><article><span>Standard deviation</span><b>${U.fmt(U.sd(e.n,e.p),5)}</b></article>`:''}</div><p class="u410-message ${valid?'':'warn'}">${valid?'Event translated and calculated from the exact binomial distribution.':'Use integer n≥0, 0≤p≤1, and boundaries inside 0,…,n.'}</p>`;
  const canvas=$('[data-canvas]',root);if(canvas&&valid)drawPMF(canvas,{n:e.n,p:e.p,type:e.type,a:e.a,b:e.b,title:eventTypes.find(t=>t[0]===e.type)?.[1]||'Event',subtitle:`${syntax} = ${U.fmt(prob,7)}`,showMean:true,h:330});
  return{valid,prob,syntax};
}
function mountEvent(root){
  root.innerHTML=shell('Discrete-event translator','Move a boundary and inspect exactly which bars are selected.',`${eventForm({n:15,p:.35,type:'atLeast',a:6,b:9})}<div data-out></div><div class="u410-lab-canvas" data-canvas></div>`);
  const run=()=>{const e=readEvent(root);toggleB(root,e.type);eventResult(root,e)};$('[data-run]',root).onclick=run;$$('input,select',root).forEach(n=>n.addEventListener('change',run));$('[data-type]',root).addEventListener('input',run);run();
}

const scenarios=[
 {name:'Independent sensors',desc:'Test exactly 20 separately produced sensors; each has defect probability .04.',checks:[1,1,1,1],verdict:'Exact binomial model is plausible.'},
 {name:'Cards without replacement',desc:'Draw 10 cards from a 30-card deck without replacement and count red cards.',checks:[1,0,1,0],verdict:'Not exactly binomial: dependence and changing p.'},
 {name:'Shoot until first score',desc:'Take shots until the first score and record the trial number.',checks:[1,1,0,1],verdict:'Not binomial: the number of trials is random.'},
 {name:'Five response categories',desc:'Record ratings 1–5 for 40 respondents without combining categories.',checks:[0,1,1,1],verdict:'Not binomial until success/failure is defined.'},
 {name:'Consecutive weather days',desc:'Count rainy days over the next 14 days using one fixed historical p.',checks:[1,0,1,0],verdict:'Serial dependence and changing weather probabilities are concerns.'},
 {name:'Large finite population',desc:'Sample 20 of 800 items without replacement; 8% are defective.',checks:[1,0,1,0],verdict:'Not exact, but a binomial approximation may be reasonable because the sample fraction is 2.5%.'}
];
function mountBins(root){
  root.innerHTML=shell('BINS condition auditor','Select a scenario and separate exact validity from approximation.',`<div class="u410-controls"><label class="wide">Scenario<select data-scenario>${scenarios.map((s,i)=>`<option value="${i}">${s.name}</option>`).join('')}</select></label></div><div data-description></div><div class="u410-bins-audit" data-audit></div><p class="u410-message" data-verdict></p>`);
  const run=()=>{const s=scenarios[Number($('[data-scenario]',root).value)]||scenarios[0],labels=[['B','Binary'],['I','Independent'],['N','Fixed n'],['S','Same p']];$('[data-description]',root).innerHTML=`<p>${esc(s.desc)}</p>`;$('[data-audit]',root).innerHTML=labels.map((v,i)=>`<article class="${s.checks[i]?'pass':'fail'}"><b>${v[0]} · ${v[1]}</b><span>${s.checks[i]?'PASS':'CONCERN'}</span></article>`).join('');$('[data-verdict]',root).textContent=s.verdict};$('[data-scenario]',root).onchange=run;run();
}

function mountExplorer(root){
  root.innerHTML=shell('Distribution explorer','Change n, p, and the selected event. The graph and TI‑84 syntax use the same exact engine.',`${eventForm({n:20,p:.30,type:'between',a:4,b:8})}<div data-out></div><div class="u410-lab-canvas" data-canvas></div>`);
  const run=()=>{const e=readEvent(root);toggleB(root,e.type);eventResult(root,e)};$('[data-run]',root).onclick=run;$$('input,select',root).forEach(n=>{n.addEventListener('input',run);n.addEventListener('change',run)});run();
}

function sampleBinomial(n,p){let x=0;for(let i=0;i<n;i++)if(Math.random()<p)x++;return x}
function mountSimulation(root){
  root.innerHTML=shell('Repeated-sample simulator','Compare empirical frequencies with the exact binomial probabilities.',`<div class="u410-controls"><label>Trials n<input data-n type="number" min="1" max="50" step="1" value="12"></label><label>Probability p<input data-p type="number" min="0" max="1" step=".01" value=".72"></label><label>Repeated groups<input data-r type="number" min="20" max="10000" step="20" value="500"></label><label>Track exact x<input data-k type="number" min="0" max="50" step="1" value="9"></label><button class="primary-btn" type="button" data-run>Run simulation</button></div><div data-out></div><div class="u410-simulation-bars" data-bars></div>`);
  const run=()=>{const n=Math.max(1,Math.min(50,Math.round(parseNum($('[data-n]',root),12)))),p=Math.max(0,Math.min(1,parseNum($('[data-p]',root),.72))),reps=Math.max(20,Math.min(10000,Math.round(parseNum($('[data-r]',root),500)))),k=Math.max(0,Math.min(n,Math.round(parseNum($('[data-k]',root),9)))),counts=Array(n+1).fill(0);for(let r=0;r<reps;r++)counts[sampleBinomial(n,p)]++;const empirical=counts[k]/reps,theoretical=U.pmf(n,p,k),max=Math.max(...counts,1);$('[data-out]',root).innerHTML=`<div class="u410-readout"><article><span>Tracked event</span><b>X=${k}</b></article><article><span>Empirical frequency</span><b>${U.fmt(empirical,5)}</b></article><article><span>Exact probability</span><b>${U.fmt(theoretical,5)}</b></article><article><span>Absolute gap</span><b>${U.fmt(Math.abs(empirical-theoretical),5)}</b></article></div><p class="u410-message">A different run will fluctuate. Increase the number of repeated groups to see long-run stabilization.</p>`;$('[data-bars]',root).innerHTML=counts.map((v,i)=>`<i data-x="${i}" title="x=${i}: ${v}" style="height:${Math.max(1,100*v/max)}%"></i>`).join('')};$('[data-run]',root).onclick=run;run();
}

function mountRecover(root){
  root.innerHTML=shell('Recover n and p from moments','Test whether a proposed mean and variance are compatible with a binomial model.',`<div class="u410-controls"><label>Mean μ<input data-mu type="number" min="0" step=".01" value="9.6"></label><label>Variance v<input data-v type="number" min="0" step=".01" value="5.76"></label><button class="primary-btn" type="button" data-run>Recover parameters</button></div><div data-out></div>`);
  const run=()=>{const mu=parseNum($('[data-mu]',root),9.6),v=parseNum($('[data-v]',root),5.76),r=U.recover(mu,v);$('[data-out]',root).innerHTML=`<div class="u410-readout"><article><span>Recovered p</span><b>${U.fmt(r.p,7)}</b></article><article><span>Recovered n</span><b>${U.fmt(r.n,7)}</b></article><article><span>Check np</span><b>${r.valid?U.fmt(r.n*r.p,7):'—'}</b></article><article><span>Status</span><b>${r.valid?'VALID':'INVALID'}</b></article></div><p class="u410-message ${r.valid?'':'warn'}">${esc(r.reason)}</p>`};$('[data-run]',root).onclick=run;$$('input',root).forEach(n=>n.onchange=run);run();
}

function mountThreshold(root){
  root.innerHTML=shell('At-least-one threshold','Find the first integer number of trials that reaches a target probability.',`<div class="u410-controls"><label>Success probability p<input data-p type="number" min=".0001" max=".9999" step=".01" value=".08"></label><label>Target probability<input data-target type="number" min=".0001" max=".9999" step=".01" value=".95"></label><button class="primary-btn" type="button" data-run>Solve threshold</button></div><div data-out></div>`);
  const run=()=>{const p=parseNum($('[data-p]',root),.08),target=parseNum($('[data-target]',root),.95),n=U.thresholdAtLeastOne(p,target),before=Number.isFinite(n)?1-(1-p)**(n-1):NaN,at=Number.isFinite(n)?1-(1-p)**n:NaN,valid=Number.isFinite(n);$('[data-out]',root).innerHTML=`<div class="u410-readout"><article><span>Smallest n</span><b>${U.fmt(n,0)}</b></article><article><span>P at n−1</span><b>${U.fmt(before,7)}</b></article><article><span>P at n</span><b>${U.fmt(at,7)}</b></article><article><span>Target</span><b>${U.fmt(target,7)}</b></article></div><p class="u410-message ${valid?'':'warn'}">${valid?'Minimality verified: n−1 fails while n reaches the target.':'Require 0<p<1 and 0<target<1.'}</p>`};$('[data-run]',root).onclick=run;$$('input',root).forEach(n=>n.onchange=run);run();
}

function tiTable(n,p){const d=U.dist(n,p),m=U.modes(n,p),lo=Math.max(0,Math.min(...m)-5),hi=Math.min(n,Math.max(...m)+5),rows=d.filter(r=>r.x>=lo&&r.x<=hi);return`<table class="u410-ti-table"><thead><tr><th>x</th><th>binompdf</th><th>binomcdf</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${r.x}</td><td>${U.fmt(r.p,8)}</td><td>${U.fmt(r.cdf,8)}</td></tr>`).join('')}</tbody></table>`}
function simulator(root){
  root.innerHTML=`<section class="u410-ti-shell"><div class="u410-ti-brand"><span>TI‑84 PLUS CE · focused simulator</span><span>DISTR</span></div><div class="u410-ti-screen">${eventForm({n:20,p:.04,type:'atLeast',a:2,b:5})}<div data-out></div><div data-table></div></div></section>`;
  const run=()=>{const e=readEvent(root);toggleB(root,e.type);const r=eventResult(root,e,false);if(r.valid){const modes=U.modes(e.n,e.p).join(' and ');$('[data-out]',root).innerHTML=`<div class="u410-ti-output"><article><span>Expression</span><b>${esc(r.syntax)}</b></article><article><span>Answer</span><b>${U.fmt(r.prob,10)}</b></article><article><span>μ / σ</span><b>${U.fmt(U.mean(e.n,e.p),4)} / ${U.fmt(U.sd(e.n,e.p),4)}</b></article><article><span>Mode(s)</span><b>${modes}</b></article></div>`;$('[data-table]',root).innerHTML=tiTable(e.n,e.p)}else{$('[data-table]',root).innerHTML=''}};$('[data-run]',root).onclick=run;$$('input,select',root).forEach(n=>{n.addEventListener('change',run);n.addEventListener('input',run)});run();
}

const labs={event:mountEvent,bins:mountBins,explorer:mountExplorer,simulation:mountSimulation,recover:mountRecover,threshold:mountThreshold},mounted=new WeakSet();
function mountLab(node){if(mounted.has(node))return;const f=labs[node.dataset.u410Lab];if(!f)return;mounted.add(node);try{f(node)}catch(e){console.error('Lesson 4.10 lab failed',e);node.innerHTML='<p class="u410-message warn">The interactive lab could not load.</p>'}}
function hydrateLabs(root=document){root.querySelectorAll?.('[data-u410-lab]').forEach(mountLab)}
function start(){hydrateLabs();new MutationObserver(rs=>rs.forEach(r=>r.addedNodes.forEach(n=>{if(n.nodeType===1)hydrateLabs(n)}))).observe(document.body,{childList:true,subtree:true})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
Object.assign(R,{mountLab,hydrateLabs,simulator});
})();
