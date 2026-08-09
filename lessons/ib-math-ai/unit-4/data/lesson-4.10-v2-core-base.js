(function(){
'use strict';
const data=window.LESSON_DATA;
if(!data||String(data.lesson?.number)!=='4.10')return;

const U={
  clamp:(x,a=0,b=1)=>Math.max(a,Math.min(b,x)),
  sum:a=>a.reduce((s,v)=>s+Number(v),0),
  logGamma(z){
    const c=[.99999999999980993,676.5203681218851,-1259.1392167224028,771.32342877765313,-176.6150291621406,12.507343278686905,-.13857109526572012,9.984369578019571e-6,1.5056327351493116e-7];
    if(z<.5)return Math.log(Math.PI)-Math.log(Math.sin(Math.PI*z))-this.logGamma(1-z);
    z-=1;let x=c[0];for(let i=1;i<c.length;i++)x+=c[i]/(z+i);const t=z+7.5;
    return .5*Math.log(2*Math.PI)+(z+.5)*Math.log(t)-t+Math.log(x);
  },
  logChoose(n,x){
    n=Number(n);x=Number(x);
    if(!Number.isInteger(n)||!Number.isInteger(x)||n<0||x<0||x>n)return-Infinity;
    return this.logGamma(n+1)-this.logGamma(x+1)-this.logGamma(n-x+1);
  },
  choose(n,x){const z=this.logChoose(n,x);return z===-Infinity?0:Math.round(Math.exp(z))},
  valid(n,p){return Number.isInteger(n)&&n>=0&&Number.isFinite(p)&&p>=0&&p<=1},
  logPmf(n,p,x){
    n=Number(n);p=Number(p);x=Number(x);
    if(!this.valid(n,p)||!Number.isInteger(x)||x<0||x>n)return-Infinity;
    if(p===0)return x===0?0:-Infinity;
    if(p===1)return x===n?0:-Infinity;
    return this.logChoose(n,x)+x*Math.log(p)+(n-x)*Math.log1p(-p);
  },
  pmf(n,p,x){const z=this.logPmf(n,p,x);return z===-Infinity?0:Math.exp(z)},
  logSumExp(logs){
    const finite=logs.filter(Number.isFinite);if(!finite.length)return-Infinity;
    const m=Math.max(...finite);return m+Math.log(finite.reduce((s,v)=>s+Math.exp(v-m),0));
  },
  range(n,p,a,b){
    n=Number(n);p=Number(p);a=Math.max(0,Math.ceil(Number(a)));b=Math.min(n,Math.floor(Number(b)));
    if(!this.valid(n,p)||a>b)return 0;
    const logs=[];for(let x=a;x<=b;x++)logs.push(this.logPmf(n,p,x));
    const z=this.logSumExp(logs);return z===-Infinity?0:this.clamp(Math.exp(z));
  },
  cdf(n,p,k){
    n=Number(n);p=Number(p);k=Math.floor(Number(k));
    if(!this.valid(n,p))return NaN;if(k<0)return 0;if(k>=n)return 1;
    return k<n*p?this.range(n,p,0,k):this.clamp(1-this.range(n,p,k+1,n));
  },
  sf(n,p,k){
    n=Number(n);p=Number(p);k=Math.floor(Number(k));
    if(!this.valid(n,p))return NaN;if(k<0)return 1;if(k>=n)return 0;
    return k>=n*p?this.range(n,p,k+1,n):this.clamp(1-this.range(n,p,0,k));
  },
  event(n,p,type,a,b){
    const k=Math.floor(Number(a));
    if(type==='exact')return this.pmf(n,p,k);
    if(type==='atMost')return this.cdf(n,p,k);
    if(type==='lessThan')return this.cdf(n,p,k-1);
    if(type==='atLeast')return this.sf(n,p,k-1);
    if(type==='moreThan')return this.sf(n,p,k);
    if(type==='between')return this.clamp(this.cdf(n,p,Math.floor(Number(b)))-this.cdf(n,p,k-1));
    return NaN;
  },
  dist(n,p){
    if(!this.valid(n,p))return[];
    const values=Array.from({length:n+1},(_,x)=>this.pmf(n,p,x)),s=this.sum(values);
    let run=0;return values.map((v,x)=>{const q=s?v/s:0;run+=q;return{x,p:this.clamp(q),cdf:this.clamp(run)}});
  },
  mean:(n,p)=>Number(n)*Number(p),
  variance:(n,p)=>Number(n)*Number(p)*(1-Number(p)),
  sd(n,p){return Math.sqrt(this.variance(n,p))},
  skewness(n,p){const v=this.variance(n,p);return v>0?(1-2*p)/Math.sqrt(v):0},
  modes(n,p){
    n=Number(n);p=Number(p);if(!this.valid(n,p))return[];
    if(p===0)return[0];if(p===1)return[n];
    const t=(n+1)*p,r=Math.round(t);
    return Math.abs(t-r)<1e-12?[r-1,r].filter(x=>x>=0&&x<=n):[Math.floor(t)];
  },
  recover(mu,v){
    mu=Number(mu);v=Number(v);
    if(!(mu>0)||!(v>=0))return{valid:false,p:NaN,n:NaN,reason:'Require μ>0 and variance ≥0.'};
    const p=1-v/mu,n=p>0?mu/p:NaN,integer=Number.isFinite(n)&&Math.abs(n-Math.round(n))<1e-9;
    const valid=p>0&&p<=1&&integer;
    return{valid,p,n:integer?Math.round(n):n,reason:valid?'Valid binomial parameters.':'Require 0<p≤1 and integer n.'};
  },
  thresholdAtLeastOne(p,target){
    p=Number(p);target=Number(target);
    if(!(p>0&&p<1&&target>0&&target<1))return NaN;
    return Math.ceil(Math.log1p(-target)/Math.log1p(-p)-1e-12);
  },
  hypergeomPmf(N,K,n,x){
    N=Number(N);K=Number(K);n=Number(n);x=Number(x);
    if(![N,K,n,x].every(Number.isInteger)||N<0||K<0||K>N||n<0||n>N||x<0||x>n||x>K||n-x>N-K)return 0;
    return Math.exp(this.logChoose(K,x)+this.logChoose(N-K,n-x)-this.logChoose(N,n));
  },
  hypergeomRange(N,K,n,a,b){let s=0;for(let x=Math.max(0,Math.ceil(a));x<=Math.min(n,Math.floor(b));x++)s+=this.hypergeomPmf(N,K,n,x);return this.clamp(s)},
  fmt(v,d=5){
    v=Number(v);if(!Number.isFinite(v))return'—';
    if(v!==0&&(Math.abs(v)<1e-5||Math.abs(v)>=1e8))return v.toExponential(4);
    return Number(v.toFixed(d)).toLocaleString('en-US',{maximumFractionDigits:d});
  },
  pct(v,d=2){return`${this.fmt(100*Number(v),d)}%`},
  syntax(n,p,type,a,b){
    const N=this.fmt(n,0),P=this.fmt(p,8),A=this.fmt(a,0),B=this.fmt(b,0);
    if(type==='exact')return`binompdf(${N},${P},${A})`;
    if(type==='atMost')return`binomcdf(${N},${P},${A})`;
    if(type==='lessThan')return`binomcdf(${N},${P},${Number(a)-1})`;
    if(type==='atLeast')return`1−binomcdf(${N},${P},${Number(a)-1})`;
    if(type==='moreThan')return`1−binomcdf(${N},${P},${A})`;
    if(type==='between')return`binomcdf(${N},${P},${B})−binomcdf(${N},${P},${Number(a)-1})`;
    return'';
  }
};

const D={
  freeThrows:{name:'Free throws',n:12,p:.72,context:'A player makes each free throw with probability 0.72.'},
  defects:{name:'Defective sensors',n:20,p:.04,context:'Each independently produced sensor is defective with probability 0.04.'},
  messages:{name:'Priority messages',n:15,p:.35,context:'Each incoming message is priority with probability 0.35.'},
  survey:{name:'Survey support',n:30,p:.60,context:'Each randomly selected resident supports the proposal with probability 0.60.'},
  reliability:{name:'Working modules',n:8,p:.92,context:'Each independent module works through the test with probability 0.92.'},
  sixes:{name:'Rolling sixes',n:10,p:1/6,context:'A fair die is rolled 10 times and success means rolling a six.'},
  guesses:{name:'Correct guesses',n:20,p:.25,context:'Each four-option question is guessed independently.'},
  delays:{name:'Delayed flights',n:25,p:.08,context:'Each selected flight is delayed with probability 0.08.'},
  redCards:{name:'Red access cards',n:16,p:.45,context:'Each independently issued access card is red with probability 0.45.'},
  arrivals:{name:'Late arrivals',n:40,p:.12,context:'Each student arrival is late with probability 0.12.'},
  rare:{name:'Rare fault',n:60,p:.03,context:'Each independent unit has probability 0.03 of a rare fault.'},
  symmetric:{name:'Balanced trials',n:14,p:.5,context:'Fourteen independent trials have success probability 0.5.'}
};
Object.values(D).forEach(d=>Object.assign(d,{mu:U.mean(d.n,d.p),variance:U.variance(d.n,d.p),sd:U.sd(d.n,d.p),modes:U.modes(d.n,d.p),dist:U.dist(d.n,d.p)}));

const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const slide=(id,section,eyebrow,title,kind,html)=>({id,section,eyebrow,title,kind,html});
const note=(id,p='Record your reasoning, TI-84 evidence, and contextual interpretation…')=>`<textarea class="student-note" data-note="${id}" placeholder="${esc(p)}"></textarea>`;
const reveal=(label,html)=>`<details><summary>${label}</summary><div class="solution-panel">${html}</div></details>`;
const plot=(type,size='')=>`<div class="u410-plot ${size}" data-u410-plot="${esc(type)}"><div class="u410-plot-fallback">Exact binomial graphic loading…</div></div>`;
const lab=type=>`<div class="u410-live" data-u410-lab="${esc(type)}"><div class="u410-live-loading">Interactive probability model loading…</div></div>`;
const turn=(prompt,id,answer,visual='')=>`<div class="student-turn"><span class="mini-label">Student turn</span><h2>${prompt}</h2>${visual}${note(id)}${reveal('Reveal a model response',answer)}</div>`;
const worked=(prompt,steps,conclusion='',visual='')=>`<div class="worked-grid"><article class="worked-prompt"><span class="mini-label">Worked example</span><p>${prompt}</p>${visual}<div class="workspace-lines"></div></article><article class="worked-solution"><span class="mini-label">Complete reasoning</span><ol class="worked-steps">${steps.map((x,i)=>`<li><span>${i+1}</span><div>${x}</div></li>`).join('')}</ol>${conclusion?`<div class="exam-language"><b>IB-ready statement</b><p>${conclusion}</p></div>`:''}</article></div>`;
const formula=(label,math,text='')=>`<div class="u410-formula-card"><span>${label}</span><div>\\(${math}\\)</div>${text?`<p>${text}</p>`:''}</div>`;
const probTable=(n,p,selected=[])=>{const rows=U.dist(n,p);return`<div class="u410-table-wrap"><table class="u410-table"><thead><tr><th>\\(x\\)</th>${rows.map(r=>`<th class="${selected.includes(r.x)?'selected':''}">${r.x}</th>`).join('')}</tr></thead><tbody><tr><th>\\(P(X=x)\\)</th>${rows.map(r=>`<td class="${selected.includes(r.x)?'selected':''}">${U.fmt(r.p,5)}</td>`).join('')}</tr><tr><th>\\(P(X\\le x)\\)</th>${rows.map(r=>`<td class="${selected.includes(r.x)?'selected':''}">${U.fmt(r.cdf,5)}</td>`).join('')}</tr></tbody></table></div>`};
const cards=(items,cls='u410-card-grid')=>`<div class="${cls}">${items.map((x,i)=>`<article><span>${x[0]??i+1}</span><h3>${x[1]}</h3><p>${x[2]}</p></article>`).join('')}</div>`;
const slides=[];const A=(...x)=>slides.push(slide(...x));

data.schemaVersion='4.10.2';data.version='2.0.0';data.buildDate='2026-08-09';
data.lesson={...data.lesson,
  number:'4.10',slug:'binomial_distribution_repeated_trials',lesson_key:'u4-distributions-binomial',
  title:'Binomial Distribution and Repeated Trials',
  subtitle:'Model a fixed number of independent two-outcome trials, calculate exact and cumulative probabilities, interpret parameters, and audit every TI‑84 result.',
  objectives:[
    'Verify the four BINS conditions before using a binomial model.',
    'Define the binomial random variable and its integer support.',
    'Calculate and interpret exact binomial probabilities.',
    'Translate at most, fewer than, at least, more than, and inclusive interval events exactly.',
    'Use binompdf and binomcdf efficiently on a TI‑84 Plus CE.',
    'Calculate and interpret the mean, variance, and standard deviation.',
    'Identify the exact mode rule, including the two-mode case.',
    'Evaluate model assumptions, independence, constant probability, and sampling without replacement.',
    'Use complements and technology to solve repeated-trial thresholds.',
    'Communicate probability evidence with correct context, notation, and rounding.'
  ],
  technology:'Use 2nd → VARS (DISTR) → binompdf for exact values and binomcdf for lower cumulative values. Translate upper tails and intervals before entering the command; keep full calculator precision until the final answer.',
  source_sections:['Binomial distribution','Repeated independent trials','TI-84 Plus CE binompdf and binomcdf workflows']
};
window.U410_CORE={data,U,D,esc,slide,note,reveal,plot,lab,turn,worked,formula,probTable,cards,slides,A};
})();
