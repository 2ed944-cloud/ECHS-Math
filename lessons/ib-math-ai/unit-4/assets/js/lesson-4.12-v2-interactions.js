(function(){
'use strict';
const data=window.LESSON_DATA;if(!data||String(data.lesson?.number)!=='4.12')return;
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const fmt=(v,d=4)=>Number(v).toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d});
function erf(x){const sign=x<0?-1:1;x=Math.abs(x);const a1=.254829592,a2=-.284496736,a3=1.421413741,a4=-1.453152027,a5=1.061405429,p=.3275911,t=1/(1+p*x),y=1-(((((a5*t+a4)*t+a3)*t+a2)*t+a1)*t)*Math.exp(-x*x);return sign*y}
function normalCdf(x){return .5*(1+erf(x/Math.SQRT2))}
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}

function initSampling(root){
  root.innerHTML=`<div class="l412-lab-ui"><div class="l412-lab-controls"><label>Sample size n<input type="range" min="10" max="200" step="5" value="25" data-n></label><label>Selection bias shift<input type="range" min="0" max="100" step="5" value="0" data-bias></label><label>Repeated samples<input type="range" min="8" max="30" step="1" value="18" data-reps></label></div><div class="l412-lab-result" data-result></div><svg class="l412-lab-svg" viewBox="0 0 720 230" role="img" aria-label="Simulated distribution of sample means" data-svg></svg></div>`;
  const update=()=>{
    const n=Number($('[data-n]',root).value),bias=Number($('[data-bias]',root).value),reps=Number($('[data-reps]',root).value),sigma=18,spread=sigma/Math.sqrt(n),center=50+bias*.10;
    const values=Array.from({length:reps},(_,i)=>center+spread*(1.35*Math.sin((i+1)*2.17)+.55*Math.cos((i+2)*1.31)));
    const mean=values.reduce((a,b)=>a+b,0)/values.length;
    const xmin=42,xmax=64,mapX=x=>55+(x-xmin)/(xmax-xmin)*620;
    const dots=values.map((v,i)=>`<circle cx="${clamp(mapX(v),55,675).toFixed(1)}" cy="${75+(i%4)*28}" r="7" fill="${bias?'#78183f':'#177e89'}" opacity=".78"/>`).join('');
    root.querySelector('[data-svg]').innerHTML=`<rect x="1" y="1" width="718" height="228" rx="17" fill="#fffdf9"/><line x1="55" y1="190" x2="675" y2="190" stroke="#17324d" stroke-width="2"/><line x1="${mapX(50)}" y1="34" x2="${mapX(50)}" y2="198" stroke="#177e89" stroke-width="3" stroke-dasharray="7 6"/><line x1="${clamp(mapX(center),55,675)}" y1="34" x2="${clamp(mapX(center),55,675)}" y2="198" stroke="#78183f" stroke-width="3" stroke-dasharray="7 6"/>${dots}<text x="${mapX(50)}" y="22" text-anchor="middle" fill="#177e89" font-size="13" font-weight="800">population target 50</text><text x="${clamp(mapX(center),55,675)}" y="218" text-anchor="middle" fill="#78183f" font-size="13" font-weight="800">sampling centre ${center.toFixed(1)}</text>`;
    $('[data-result]',root).innerHTML=`<b>n=${n} · approximate standard error=${spread.toFixed(2)} · simulated average=${mean.toFixed(2)}</b><small>${bias?`The bias slider has shifted the sampling centre by ${(bias*.10).toFixed(1)} units. Increasing n narrows the random spread but does not move that centre back to 50.`:`With no imposed bias, estimates fluctuate around 50. Increasing n narrows the random spread; it does not remove all variation.`}</small>`;
  };
  $$('input',root).forEach(el=>el.addEventListener('input',update));update();
}

const hypCases={
  'means-different':{label:'Two numerical groups · different',h0:'H₀: μ₁ = μ₂',h1:'H₁: μ₁ ≠ μ₂',test:'Pooled two-sample t-test',tail:'Two-sided',audit:'Equality is in H₀; both directions count as evidence.'},
  'means-lower':{label:'Method A predicted lower than B',h0:'H₀: μA = μB',h1:'H₁: μA < μB',test:'Pooled two-sample t-test',tail:'Left-sided for A − B',audit:'The direction must be fixed before seeing the sample result.'},
  'independence':{label:'Two categorical variables · association',h0:'H₀: the variables are independent',h1:'H₁: the variables are not independent',test:'Chi-square test for independence',tail:'Upper chi-square tail',audit:'Use frequency counts and inspect expected frequencies.'},
  'gof':{label:'One categorical variable · claimed proportions',h0:'H₀: the population follows the claimed distribution',h1:'H₁: the population does not follow the claimed distribution',test:'Chi-square goodness-of-fit test',tail:'Upper chi-square tail',audit:'Expected counts come from the claimed proportions.'}
};
function initHypotheses(root){
  root.innerHTML=`<div class="l412-lab-ui"><div class="l412-lab-controls"><label>Research structure<select data-case>${Object.entries(hypCases).map(([k,v])=>`<option value="${k}">${esc(v.label)}</option>`).join('')}</select></label><label>Notation check<select data-notation><option value="population">Population parameters</option><option value="sample">Sample statistics (diagnose)</option></select></label><label>Direction timing<select data-timing><option value="before">Chosen before data</option><option value="after">Chosen after data (diagnose)</option></select></label></div><div class="l412-hyp-output" data-output></div><div class="l412-lab-result" data-result></div></div>`;
  const update=()=>{const c=hypCases[$('[data-case]',root).value],notation=$('[data-notation]',root).value,timing=$('[data-timing]',root).value;let warning='';if(notation==='sample')warning+=' Hypotheses must use population parameters, not observed sample statistics.';if(timing==='after'&&c.tail.includes('sided'))warning+=' A directional alternative chosen after seeing the data is not a valid pre-planned test.';$('[data-output]',root).innerHTML=`<article><b>${esc(c.h0)}</b><span>Null model</span></article><article><b>${esc(c.h1)}</b><span>Alternative claim</span></article>`;$('[data-result]',root).innerHTML=`<b>${esc(c.test)} · ${esc(c.tail)}</b><small>${esc(c.audit+warning)}</small>`};
  $$('select',root).forEach(el=>el.addEventListener('change',update));update();
}

function curveGeometry(z,tail){
  const points=[];for(let i=0;i<=260;i++){const x=-3.7+7.4*i/260,y=Math.exp(-.5*x*x),px=48+(x+3.7)/7.4*624,py=183-y*137;points.push({x,px,py})}
  const line=points.map(p=>`${p.px.toFixed(1)},${p.py.toFixed(1)}`).join(' '),base=183;
  const polygon=arr=>arr.length?`${arr[0].px.toFixed(1)},${base} `+arr.map(p=>`${p.px.toFixed(1)},${p.py.toFixed(1)}`).join(' ')+` ${arr[arr.length-1].px.toFixed(1)},${base}`:'';
  const right=points.filter(p=>p.x>=z),left=points.filter(p=>p.x<=-z);
  return {line,right:polygon(right),left:polygon(left),map:x=>48+(x+3.7)/7.4*624};
}
function initPvalue(root){
  root.innerHTML=`<div class="l412-lab-ui"><div class="l412-lab-controls"><label>Observed |z|<input type="range" min="0" max="350" step="1" value="217" data-z></label><label>Alternative<select data-tail><option value="two">Two-sided</option><option value="one">Right-sided</option></select></label><label>Null model<select><option>Standard normal illustration</option></select></label></div><div class="l412-lab-result" data-result></div><svg class="l412-lab-svg" viewBox="0 0 720 225" role="img" aria-label="P-value tail area" data-svg></svg></div>`;
  const update=()=>{const z=Number($('[data-z]',root).value)/100,tail=$('[data-tail]',root).value,g=curveGeometry(z,tail),one=1-normalCdf(z),p=tail==='two'?Math.min(1,2*one):one;root.querySelector('[data-svg]').innerHTML=`<rect x="1" y="1" width="718" height="223" rx="17" fill="#fffdf9"/><line x1="48" y1="183" x2="672" y2="183" stroke="#17324d" stroke-width="2"/>${tail==='two'?`<polygon points="${g.left}" fill="#78183f" opacity=".28"/>`:''}<polygon points="${g.right}" fill="${tail==='two'?'#78183f':'#177e89'}" opacity=".28"/><polyline points="${g.line}" fill="none" stroke="#17324d" stroke-width="4"/><line x1="${g.map(z)}" y1="183" x2="${g.map(z)}" y2="${Math.max(39,183-137*Math.exp(-.5*z*z))}" stroke="#78183f" stroke-width="3" stroke-dasharray="6 5"/>${tail==='two'?`<line x1="${g.map(-z)}" y1="183" x2="${g.map(-z)}" y2="${Math.max(39,183-137*Math.exp(-.5*z*z))}" stroke="#78183f" stroke-width="3" stroke-dasharray="6 5"/>`:''}<text x="360" y="215" text-anchor="middle" fill="#5b6875" font-size="13">shaded area = probability of a statistic at least as extreme under H₀</text>`;$('[data-result]',root).innerHTML=`<b>|z|=${z.toFixed(2)} · ${tail==='two'?'two-sided':'right-sided'} p≈${fmt(p,5)}</b><small>This is a normal-curve illustration of the conditional tail-area logic. The lesson-specific t and chi-square tests use their own null distributions.</small>`};
  $$('input,select',root).forEach(el=>el.addEventListener('input',update));update();
}

function initDecision(root){
  root.innerHTML=`<div class="l412-lab-ui"><div class="l412-lab-controls"><label>p-value<input type="range" min="1" max="150" step="1" value="24" data-p></label><label>Significance level<select data-alpha><option value="0.01">1%</option><option value="0.05" selected>5%</option><option value="0.10">10%</option></select></label><label>Alternative claim<select data-claim><option value="different">population values differ</option><option value="lower">population mean for A is lower</option><option value="association">variables are associated</option></select></label></div><div class="l412-lab-result" data-result></div><div class="l412-decision-rule" data-cards></div></div>`;
  const update=()=>{const p=Number($('[data-p]',root).value)/1000,a=Number($('[data-alpha]',root).value),claim=$('[data-claim]',root).selectedOptions[0].textContent,reject=p<a;root.querySelector('[data-cards]').innerHTML=`<article class="reject" style="opacity:${reject?1:.32}"><span>p &lt; α</span><h2>Reject H₀</h2></article><article class="not-reject" style="opacity:${reject?.32:1}"><span>p ≥ α</span><h2>Do not reject H₀</h2></article>`;$('[data-result]',root).innerHTML=`<b>p=${p.toFixed(3)} ${reject?'&lt;':'≥'} α=${a.toFixed(2)} → ${reject?'reject H₀':'do not reject H₀'}</b><small>${reject?`There is statistically significant evidence at the ${(a*100).toFixed(0)}% level that ${claim}.`:`There is insufficient evidence at the ${(a*100).toFixed(0)}% level to conclude that ${claim}. This does not prove H₀.`}</small>`};
  $$('input,select',root).forEach(el=>el.addEventListener('input',update));update();
}

const selectCases={
  means:{test:'Pooled two-sample t-test',why:'Numerical response, two independent groups, and a question about two population means.',evidence:'Lists or summary statistics; group order; one/two-sided alternative; Pooled: Yes; t, df, p.'},
  independence:{test:'Chi-square test for independence',why:'Frequency counts classified by two categorical variables on each observational unit.',evidence:'Observed matrix; expected matrix; χ², df, p; expected-frequency check.'},
  gof:{test:'Chi-square goodness-of-fit test',why:'One categorical outcome is compared with fully stated population proportions.',evidence:'Observed and expected lists; df; χ² and p; category/expected-count check.'},
  none:{test:'None of the 4.13–4.15 tests',why:'The stated structure does not match two independent means, two categorical variables, or one categorical distribution.',evidence:'Revisit the research question and variable structure before opening a test menu.'}
};
function initSelector(root){
  root.innerHTML=`<div class="l412-lab-ui"><div class="l412-lab-controls"><label>Response variable<select data-response><option value="numerical">Numerical</option><option value="categorical">Categorical</option></select></label><label>Structure<select data-structure><option value="two-groups">Two independent groups</option><option value="two-categorical">Two categorical variables</option><option value="claimed-distribution">One variable vs claimed proportions</option><option value="paired">Paired/repeated observations</option></select></label><label>Target<select data-target><option value="means">Compare population means</option><option value="association">Test association</option><option value="distribution">Test a distribution</option></select></label></div><div class="l412-lab-result l412-selector-answer" data-result></div></div>`;
  const update=()=>{const r=$('[data-response]',root).value,s=$('[data-structure]',root).value,t=$('[data-target]',root).value;let key='none';if(r==='numerical'&&s==='two-groups'&&t==='means')key='means';if(r==='categorical'&&s==='two-categorical'&&t==='association')key='independence';if(r==='categorical'&&s==='claimed-distribution'&&t==='distribution')key='gof';const c=selectCases[key];$('[data-result]',root).innerHTML=`<strong>${esc(c.test)}</strong><span>${esc(c.why)}</span><span><b>Record:</b> ${esc(c.evidence)}</span>`};
  $$('select',root).forEach(el=>el.addEventListener('change',update));update();
}

function initLabs(){
  $$('[data-l412-lab]').forEach(root=>{if(root.dataset.ready)return;root.dataset.ready='1';const type=root.dataset.l412Lab;if(type==='sampling')initSampling(root);else if(type==='hypotheses')initHypotheses(root);else if(type==='pvalue')initPvalue(root);else if(type==='decision')initDecision(root);else if(type==='selector')initSelector(root)});
}
function bindLaunch(){
  $$('[data-l412-start]').forEach(button=>{if(button.dataset.bound)return;button.dataset.bound='1';button.addEventListener('click',()=>document.getElementById('next-slide')?.click())});
}
function refresh(){bindLaunch();initLabs()}
function init(){document.documentElement.classList.add('lesson-4-12-v2');refresh();const app=document.getElementById('app');if(app)new MutationObserver(refresh).observe(app,{childList:true,subtree:true});data.release.interactive_labs=['sampling variability','hypothesis builder','p-value tails','decision threshold','test selector'];}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
