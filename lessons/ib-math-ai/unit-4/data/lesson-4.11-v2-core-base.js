(function(){
'use strict';
const data=window.LESSON_DATA;
if(!data||String(data.lesson?.number)!=='4.11')return;

const U={
  polevl(x,c){let a=c[0];for(let i=1;i<c.length;i++)a=a*x+c[i];return a},
  p1evl(x,c){let a=x+c[0];for(let i=1;i<c.length;i++)a=a*x+c[i];return a},
  erf(x){
    const ax=Math.abs(x);
    if(ax>1)return x<0?this.erfc(ax)-1:1-this.erfc(ax);
    const T=[9.60497373987051638749,90.0260197203842689217,2232.00534594684319226,7003.32514112805075473,55592.3013010394962768];
    const V=[33.5617141647503099647,521.357949780152679795,4594.32382970980127987,22629.0000613890934246,49267.3942608635921086];
    const z=x*x;
    return x*this.polevl(z,T)/this.p1evl(z,V);
  },
  erfc(a){
    const x=Math.abs(a);
    if(x<1)return 1-this.erf(a);
    const P=[2.46196981473530512524e-10,.564189564831068821977,7.46321056442269912687,48.6371970985681366614,196.520832956077098242,526.445194995477358631,934.52852717195760754,1027.55188689515710272,557.535335369399327526];
    const Q=[13.2281951154744992508,86.7072140885989742329,354.937778887819891062,975.708501743205489753,1823.90916687909736289,2246.33760818710981792,1656.66309194161350182,557.535340817727675546];
    const R=[.564189583547755073984,1.27536670759978104416,5.01905042251180477414,6.16021097993053585195,7.4097426995044893916,2.9788666537210024067];
    const S=[2.2605286322011727659,9.39603524938001434673,12.0489539808096656605,17.0814450747565897222,9.60896809063285878198,3.3690764510008151605];
    const z=-x*x;
    if(z<-745)return a<0?2:0;
    const e=Math.exp(z);
    const y=e*(x<8?this.polevl(x,P)/this.p1evl(x,Q):this.polevl(x,R)/this.p1evl(x,S));
    return a<0?2-y:y;
  },
  pdf(x,mu=0,sd=1){
    x=Number(x);mu=Number(mu);sd=Number(sd);
    if(!(sd>0)||!Number.isFinite(x)||!Number.isFinite(mu))return NaN;
    const z=(x-mu)/sd;
    return Math.exp(-.5*z*z)/(sd*Math.sqrt(2*Math.PI));
  },
  cdf(x,mu=0,sd=1){
    x=Number(x);mu=Number(mu);sd=Number(sd);
    if(!(sd>0)||!Number.isFinite(mu))return NaN;
    if(x===Infinity)return 1;if(x===-Infinity)return 0;
    return .5*this.erfc(-(x-mu)/(sd*Math.SQRT2));
  },
  sf(x,mu=0,sd=1){
    x=Number(x);mu=Number(mu);sd=Number(sd);
    if(!(sd>0)||!Number.isFinite(mu))return NaN;
    if(x===Infinity)return 0;if(x===-Infinity)return 1;
    return .5*this.erfc((x-mu)/(sd*Math.SQRT2));
  },
  prob(lower,upper,mu=0,sd=1){
    lower=Number(lower);upper=Number(upper);mu=Number(mu);sd=Number(sd);
    if(!(sd>0)||Number.isNaN(lower)||Number.isNaN(upper)||!Number.isFinite(mu))return NaN;
    if(lower>=upper)return 0;
    let p;
    if(lower===-Infinity)p=this.cdf(upper,mu,sd);
    else if(upper===Infinity)p=this.sf(lower,mu,sd);
    else if(lower>=mu)p=this.sf(lower,mu,sd)-this.sf(upper,mu,sd);
    else p=this.cdf(upper,mu,sd)-this.cdf(lower,mu,sd);
    return Math.max(0,Math.min(1,p));
  },
  inv(p,mu=0,sd=1){
    p=Number(p);mu=Number(mu);sd=Number(sd);
    if(!(sd>0)||!Number.isFinite(mu)||!(p>0&&p<1))return p===0?-Infinity:p===1?Infinity:NaN;
    const a=[-39.69683028665376,220.9460984245205,-275.9285104469687,138.357751867269,-30.66479806614716,2.506628277459239];
    const b=[-54.47609879822406,161.5858368580409,-155.6989798598866,66.80131188771972,-13.28068155288572];
    const c=[-.007784894002430293,-.3223964580411365,-2.400758277161838,-2.549732539343734,4.374664141464968,2.938163982698783];
    const d=[.007784695709041462,.3224671290700398,2.445134137142996,3.754408661907416];
    const pl=.02425,ph=1-pl;let x,q,r;
    if(p<pl){q=Math.sqrt(-2*Math.log(p));x=(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5])/((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1)}
    else if(p>ph){q=Math.sqrt(-2*Math.log(1-p));x=-(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5])/((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1)}
    else{q=p-.5;r=q*q;x=(((((a[0]*r+a[1])*r+a[2])*r+a[3])*r+a[4])*r+a[5])*q/(((((b[0]*r+b[1])*r+b[2])*r+b[3])*r+b[4])*r+1)}
    for(let i=0;i<2;i++){
      const phi=Math.exp(-.5*x*x)/Math.sqrt(2*Math.PI);
      const e=p>.5?(1-p)-this.sf(x):this.cdf(x)-p;
      const u=e/phi;
      x-=u/(1+.5*x*u);
    }
    return mu+sd*x;
  },
  z(x,mu,sd){return (Number(x)-Number(mu))/Number(sd)},
  central(area,mu=0,sd=1){const t=(1-Number(area))/2;return{lo:this.inv(t,mu,sd),hi:this.inv(1-t,mu,sd),tail:t}},
  solveMean(x,p,sd){return Number(x)-Number(sd)*this.inv(Number(p))},
  solveSd(x,p,mu){const z=this.inv(Number(p));return (Number(x)-Number(mu))/z},
  solveTwo(x1,p1,x2,p2){const z1=this.inv(p1),z2=this.inv(p2),sd=(x2-x1)/(z2-z1);return{sd,mu:x1-sd*z1,z1,z2}},
  fmt(v,d=4){
    v=Number(v);if(!Number.isFinite(v))return v===Infinity?'∞':v===-Infinity?'−∞':'—';
    if(v!==0&&(Math.abs(v)<1e-5||Math.abs(v)>=1e7))return v.toExponential(4);
    return Number(v.toFixed(d)).toLocaleString('en-US',{maximumFractionDigits:d});
  },
  pct(v,d=2){return `${this.fmt(100*Number(v),d)}%`},
  clamp(v,a,b){return Math.max(a,Math.min(b,v))}
};

const D={
  commute:{name:'Morning commute time',unit:'minutes',mu:32,sd:6},
  fill:{name:'Bottle fill volume',unit:'mL',mu:500,sd:8},
  score:{name:'Assessment score',unit:'points',mu:68,sd:10},
  height:{name:'Student height',unit:'cm',mu:172,sd:7},
  delivery:{name:'Campus delivery time',unit:'minutes',mu:28,sd:4.5},
  battery:{name:'Device battery life',unit:'hours',mu:11.5,sd:1.2},
  mass:{name:'Package mass',unit:'g',mu:250,sd:12},
  temp:{name:'Laboratory temperature',unit:'°C',mu:21.5,sd:1.8}
};

const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const enc=o=>encodeURIComponent(JSON.stringify(o||{}));
const slide=(id,section,eyebrow,title,kind,html)=>({id,section,eyebrow,title,kind,html});
const note=(id,p='Record the model, calculator command, result, and contextual interpretation…')=>`<textarea class="student-note" data-note="${id}" placeholder="${esc(p)}"></textarea>`;
const reveal=(label,html)=>`<details><summary>${label}</summary><div class="solution-panel">${html}</div></details>`;
const plot=(type,cfg={})=>`<div class="u411-plot" data-u411-plot="${esc(type)}" data-config="${enc(cfg)}"><div class="u411-plot-fallback">Precise normal-distribution graphic loading…</div></div>`;
const lab=(type,cfg={})=>`<div class="u411-live" data-u411-lab="${esc(type)}" data-config="${enc(cfg)}"><div class="u411-live-loading">Interactive normal-distribution model loading…</div></div>`;
const tiButton=(label='Open the verified TI‑84 coach',mode='normalcdf')=>`<button class="u411-ti-button" type="button" data-u411-coach="${esc(mode)}">${esc(label)}</button>`;
const worked=(prompt,steps,conclusion='',visual='')=>`<div class="worked-grid"><article class="worked-prompt"><span class="mini-label">Worked example</span><p>${prompt}</p>${visual}<div class="workspace-lines"></div></article><article class="worked-solution"><span class="mini-label">Complete reasoning</span><ol class="worked-steps">${steps.map((x,i)=>`<li><span>${i+1}</span><div>${x}</div></li>`).join('')}</ol>${conclusion?`<div class="exam-language"><b>IB-ready interpretation</b><p>${conclusion}</p></div>`:''}</article></div>`;
const turn=(prompt,id,answer,visual='')=>`<div class="student-turn"><span class="mini-label">Student turn</span><h2>${prompt}</h2>${visual}${note(id)}${reveal('Reveal a model response',answer)}</div>`;
const cards=items=>`<div class="u411-grid u411-${items.length===2?'two':items.length===4?'four':'three'}">${items.map((x,i)=>`<article class="u411-card ${x.tone||['maroon','teal','gold'][i%3]}">${x.label?`<span class="u411-label">${x.label}</span>`:''}<h2>${x.title}</h2>${x.body}</article>`).join('')}</div>`;
const keyRoute=keys=>`<div class="u411-key-route">${keys.map((k,i)=>`${i?'<i>→</i>':''}<span class="${k==='2nd'?'second':''}">${k}</span>`).join('')}</div>`;
const screen=lines=>`<div class="u411-output-screen">${lines.map(x=>`<span>${x}</span>`).join('')}</div>`;

const slides=[];const A=(...x)=>slides.push(slide(...x));

data.schemaVersion='4.11.2';
data.version='2.0.0';
data.buildDate='2026-08-09';
data.lesson={...data.lesson,
  number:'4.11',
  slug:'normal_distribution_probabilities_quantiles',
  lesson_key:'u4-normal-probability-quantiles',
  title:'Normal Distribution: Probabilities and Quantiles',
  subtitle:'Translate context into area, calculate accurately with normalcdf, reverse area with invNorm, and communicate what a normal model does—and does not—say.',
  objectives:[
    'Interpret X~N(μ,σ²), including the distinct roles and units of μ, σ, and σ².',
    'Connect inequalities with exact shaded regions under a continuous density curve.',
    'Calculate lower-tail, upper-tail, interval, and outside probabilities.',
    'Use z-scores as a reasoning and reasonableness tool.',
    'Execute and audit TI‑84 normalcdf and ShadeNorm workflows.',
    'Find percentiles, cut scores, and central intervals with invNorm.',
    'Convert top-tail and central-area wording into the correct lower-tail area.',
    'Use normal probabilities for expected counts and solve selected inverse-parameter problems.',
    'Judge model appropriateness and write contextual conclusions with sensible precision.'
  ],
  technology:'Use 2nd → VARS → DISTR. For probability, normalcdf(lower, upper, μ, σ). For quantiles, invNorm(area, μ, σ), with area interpreted as a lower-tail probability unless a supported tail option is deliberately selected. Preserve full calculator precision before final rounding.',
  source_sections:['Normal distribution probabilities','Inverse normal distribution and quantiles','TI‑84 Plus CE DISTR workflows']
};
window.U411_CORE={data,U,D,esc,enc,slide,note,reveal,plot,lab,tiButton,worked,turn,cards,keyRoute,screen,slides,A};
})();
