(function(){
'use strict';
const data=window.LESSON_DATA;if(!data||String(data.lesson?.number)!=='4.15')return;
const U={
 sum:a=>a.reduce((s,v)=>s+Number(v),0),
 logGamma(z){const p=[.99999999999980993,676.5203681218851,-1259.1392167224028,771.32342877765313,-176.6150291621406,12.507343278686905,-.13857109526572012,9.984369578019571e-6,1.5056327351493116e-7];if(z<.5)return Math.log(Math.PI)-Math.log(Math.sin(Math.PI*z))-this.logGamma(1-z);z-=1;let x=p[0];for(let i=1;i<p.length;i++)x+=p[i]/(z+i);const t=z+7.5;return .5*Math.log(2*Math.PI)+(z+.5)*Math.log(t)-t+Math.log(x)},
 gammaP(a,x){let sum=1/a,term=sum,ap=a;for(let n=1;n<=1000;n++){ap++;term*=x/ap;sum+=term;if(Math.abs(term)<Math.abs(sum)*3e-14)break}return sum*Math.exp(-x+a*Math.log(x)-this.logGamma(a))},
 gammaQcf(a,x){const fp=1e-300;let b=x+1-a,c=1/fp,d=1/b,h=d;for(let i=1;i<=1000;i++){const an=-i*(i-a);b+=2;d=an*d+b;if(Math.abs(d)<fp)d=fp;c=b+an/c;if(Math.abs(c)<fp)c=fp;d=1/d;const del=d*c;h*=del;if(Math.abs(del-1)<3e-14)break}return Math.exp(-x+a*Math.log(x)-this.logGamma(a))*h},
 sf(x,df){if(!(df>0)||x<0)return NaN;if(x===0)return 1;const a=df/2,z=x/2,q=z<a+1?1-this.gammaP(a,z):this.gammaQcf(a,z);return Math.max(0,Math.min(1,q))},
 pdf(x,df){if(!(x>0)||!(df>0))return 0;const a=df/2;return Math.exp((a-1)*Math.log(x)-x/2-a*Math.log(2)-this.logGamma(a))},
 critical(alpha,df){let lo=0,hi=Math.max(10,df+12*Math.sqrt(2*df)+25);while(this.sf(hi,df)>alpha)hi*=2;for(let i=0;i<100;i++){const m=(lo+hi)/2;if(this.sf(m,df)>alpha)lo=m;else hi=m}return(lo+hi)/2},
 gof(O,P,dfOverride){O=O.map(Number);P=P.map(Number);const n=this.sum(O),E=P.map(p=>n*p),contrib=O.map((o,i)=>(o-E[i])**2/E[i]),residual=O.map((o,i)=>(o-E[i])/Math.sqrt(E[i])),stat=this.sum(contrib),df=dfOverride??O.length-1;return{O,P,E,n,contrib,residual,stat,df,p:this.sf(stat,df),minE:Math.min(...E)}},
 fmt(v,d=4){v=Number(v);if(!Number.isFinite(v))return'—';if(v!==0&&(Math.abs(v)<1e-4||Math.abs(v)>=1e7))return v.toExponential(3);return Number(v.toFixed(d)).toLocaleString('en-US',{maximumFractionDigits:d})}
};
const D={
 transport:{name:'ECHS transport choices',cats:['Bus','Car','Metro','Walk'],O:[60,32,18,10],P:[.40,.25,.20,.15]},
 clubs:{name:'Student activity choices',cats:['STEM','Sport','Arts','Service'],O:[34,27,21,18],P:[.30,.30,.25,.15]},
 die:{name:'Fair six-sided die',cats:['1','2','3','4','5','6'],O:[18,22,17,21,19,23],P:Array(6).fill(1/6)},
 colours:{name:'Bottle colours',cats:['Maroon','Teal','Navy','Gold','White'],O:[19,28,34,30,9],P:[.20,.20,.25,.25,.10]},
 menu:{name:'Cafeteria meals',cats:['A','B','C','D'],O:[52,38,31,29],P:[.30,.25,.25,.20]},
 jersey:{name:'Jersey sizes',cats:['XS','S','M','L','XL'],O:[21,37,56,42,24],P:[.12,.20,.30,.25,.13]},
 house:{name:'House participation',cats:['North','South','East','West'],O:[45,39,44,32],P:[.25,.25,.25,.25]},
 library:{name:'Library resource use',cats:['Print','Laptop','Tablet','Room'],O:[40,52,18,30],P:[.25,.40,.15,.20]},
 arrivals:{name:'Arrival bands',cats:['Early','On time','0–5 late','>5 late'],O:[24,43,51,32],P:[.15,.30,.35,.20]},
 devices:{name:'Device platform',cats:['A','B','C','D','Other'],O:[62,45,38,25,10],P:[.35,.25,.20,.15,.05]},
 weekdays:{name:'Weekday events',cats:['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],O:[21,19,23,18,20,17,22],P:Array(7).fill(1/7)},
 strong:{name:'Strong mismatch',cats:['A','B','C','D'],O:[62,18,11,9],P:[.35,.30,.20,.15]},
 sparse:{name:'Sparse rare outcomes',cats:['Common','Occasional','Rare','Very rare'],O:[91,6,2,1],P:[.90,.06,.03,.01]}
};Object.values(D).forEach(d=>d.r=U.gof(d.O,d.P));
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const slide=(id,section,eyebrow,title,kind,html)=>({id,section,eyebrow,title,kind,html});
const note=(id,p='Record your reasoning, calculator evidence, and contextual conclusion…')=>`<textarea class="student-note" data-note="${id}" placeholder="${esc(p)}"></textarea>`;
const reveal=(label,html)=>`<details><summary>${label}</summary><div class="solution-panel">${html}</div></details>`;
const plot=type=>`<div class="u415-plot" data-u415-plot="${type}"><div class="u415-plot-fallback">Precise statistical graphic loading…</div></div>`;
const lab=type=>`<div class="u415-live" data-u415-lab="${type}"><div class="u415-live-loading">Interactive statistical model loading…</div></div>`;
const turn=(prompt,id,answer,visual='')=>`<div class="student-turn"><span class="mini-label">Student turn</span><h2>${prompt}</h2>${visual}${note(id)}${reveal('Reveal a model response',answer)}</div>`;
const worked=(prompt,steps,conclusion='',visual='')=>`<div class="worked-grid"><article class="worked-prompt"><span class="mini-label">Worked example</span><p>${prompt}</p>${visual}<div class="workspace-lines"></div></article><article class="worked-solution"><span class="mini-label">Complete reasoning</span><ol class="worked-steps">${steps.map((x,i)=>`<li><span>${i+1}</span><div>${x}</div></li>`).join('')}</ol>${conclusion?`<div class="exam-language"><b>IB-ready conclusion</b><p>${conclusion}</p></div>`:''}</article></div>`;
const table=d=>`<div class="table-wrap"><table class="u415-table"><thead><tr><th>Category</th><th>Observed \\(O\\)</th><th>Claimed \\(p_i\\)</th><th>Expected \\(E=np_i\\)</th><th>Contribution</th></tr></thead><tbody>${d.cats.map((c,i)=>`<tr><th>${c}</th><td>${U.fmt(d.O[i],2)}</td><td>${U.fmt(d.P[i],4)}</td><td>${U.fmt(d.r.E[i],3)}</td><td>${U.fmt(d.r.contrib[i],4)}</td></tr>`).join('')}</tbody><tfoot><tr><th>Total</th><td>${d.r.n}</td><td>${U.fmt(U.sum(d.P),4)}</td><td>${U.fmt(U.sum(d.r.E),3)}</td><td>${U.fmt(d.r.stat,4)}</td></tr></tfoot></table></div>`;
const slides=[];const A=(...x)=>slides.push(slide(...x));
data.schemaVersion='4.15.2';data.version='2.0.0';data.buildDate='2026-08-09';
data.lesson={...data.lesson,number:'4.15',slug:'chi_square_goodness_of_fit',lesson_key:'u4-chi-square-gof',title:'Chi-Square Goodness-of-Fit Test',subtitle:'Compare observed categorical counts with a fully specified probability distribution, diagnose departures, and communicate upper-tail evidence using exact TI‑84 workflows.',objectives:['Distinguish goodness of fit from independence.','State contextual hypotheses for one categorical population distribution.','Calculate and audit expected frequencies.','Check independence and every expected frequency greater than 5.','Explain and calculate Pearson category contributions and χ².','Use df=k−1 and upper-tail evidence.','Execute and audit the TI‑84 χ²GOF-Test workflow.','Write precise contextual conclusions without accepting H₀ or claiming causation.'],technology:'Enter observed counts in L1 and expected counts in L2; use STAT → TESTS → χ²GOF-Test with df=k−1; record χ², p, df, decision, and conclusion.',source_sections:['4.19 Chi-square goodness-of-fit test','TI-84 Plus CE χ²GOF-Test workflow']};
window.U415_CORE={data,U,D,esc,slide,note,reveal,plot,lab,turn,worked,table,slides,A};
})();
