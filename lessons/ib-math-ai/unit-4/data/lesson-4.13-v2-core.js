(function(){
  'use strict';
  const data=window.LESSON_DATA;
  if(!data||String(data.lesson?.number)!=='4.13')return;

  const U=window.U413_STATS={
    release:'2.0.0',
    mean(values){return values.reduce((sum,value)=>sum+Number(value),0)/values.length;},
    sampleSd(values){const m=this.mean(values);return Math.sqrt(values.reduce((sum,value)=>sum+(Number(value)-m)**2,0)/(values.length-1));},
    logGamma(z){
      const p=[0.99999999999980993,676.5203681218851,-1259.1392167224028,771.32342877765313,-176.6150291621406,12.507343278686905,-0.13857109526572012,9.984369578019571e-6,1.5056327351493116e-7];
      if(z<0.5)return Math.log(Math.PI)-Math.log(Math.sin(Math.PI*z))-this.logGamma(1-z);
      z-=1;let x=p[0];for(let i=1;i<p.length;i++)x+=p[i]/(z+i);const t=z+7.5;return 0.5*Math.log(2*Math.PI)+(z+0.5)*Math.log(t)-t+Math.log(x);
    },
    betaCf(a,b,x){
      const max=220,eps=3e-14,fpmin=1e-300;let qab=a+b,qap=a+1,qam=a-1,c=1,d=1-qab*x/qap;if(Math.abs(d)<fpmin)d=fpmin;d=1/d;let h=d;
      for(let m=1;m<=max;m++){
        const m2=2*m;let aa=m*(b-m)*x/((qam+m2)*(a+m2));d=1+aa*d;if(Math.abs(d)<fpmin)d=fpmin;c=1+aa/c;if(Math.abs(c)<fpmin)c=fpmin;d=1/d;h*=d*c;
        aa=-(a+m)*(qab+m)*x/((a+m2)*(qap+m2));d=1+aa*d;if(Math.abs(d)<fpmin)d=fpmin;c=1+aa/c;if(Math.abs(c)<fpmin)c=fpmin;d=1/d;const del=d*c;h*=del;if(Math.abs(del-1)<eps)break;
      }
      return h;
    },
    betaRegularized(x,a,b){
      if(x<=0)return 0;if(x>=1)return 1;
      const bt=Math.exp(this.logGamma(a+b)-this.logGamma(a)-this.logGamma(b)+a*Math.log(x)+b*Math.log(1-x));
      return x<(a+1)/(a+b+2)?bt*this.betaCf(a,b,x)/a:1-bt*this.betaCf(b,a,1-x)/b;
    },
    tCdf(t,df){if(!Number.isFinite(t)||!(df>0))return NaN;if(t===0)return 0.5;const x=df/(df+t*t),ib=this.betaRegularized(x,df/2,0.5);return t>0?1-0.5*ib:0.5*ib;},
    tPdf(t,df){return Math.exp(this.logGamma((df+1)/2)-this.logGamma(df/2)-0.5*Math.log(df*Math.PI)-((df+1)/2)*Math.log(1+t*t/df));},
    pValue(t,df,alternative='neq'){const cdf=this.tCdf(t,df);if(alternative==='gt')return 1-cdf;if(alternative==='lt')return cdf;return Math.min(1,2*Math.min(cdf,1-cdf));},
    pooledSummary(m1,s1,n1,m2,s2,n2,alternative='neq'){
      [m1,s1,n1,m2,s2,n2]=[m1,s1,n1,m2,s2,n2].map(Number);const df=n1+n2-2;const sp2=((n1-1)*s1*s1+(n2-1)*s2*s2)/df,sp=Math.sqrt(sp2),se=sp*Math.sqrt(1/n1+1/n2),t=(m1-m2)/se;
      return {m1,m2,s1,s2,n1,n2,sp2,sp,se,t,df,p:this.pValue(t,df,alternative),alternative,difference:m1-m2};
    },
    pooledArrays(a,b,alternative='neq'){return this.pooledSummary(this.mean(a),this.sampleSd(a),a.length,this.mean(b),this.sampleSd(b),b.length,alternative);},
    fmt(value,digits=4){const n=Number(value);if(!Number.isFinite(n))return '—';if(n!==0&&(Math.abs(n)<0.0001||Math.abs(n)>=1e6))return n.toExponential(3);return Number(n.toFixed(digits)).toLocaleString('en-US',{maximumFractionDigits:digits});},
    alphaDecision(p,alpha){return Number(p)<=Number(alpha)?'Reject H₀':'Do not reject H₀';},
    alternativeSymbol(alternative){return alternative==='gt'?'>':alternative==='lt'?'<':'≠';}
  };

  const D=window.U413_DATASETS={
    weights:{name:'Package masses',units:'g',a:[65,70,74,69,57,64,61,78,83,80],b:[71,65,68,59,70,65,55,52]},
    feature:{name:'Measured feature',units:'units',a:[17,23,19,14,17,18,21,15,19,16,20,20],b:[18,14,17,16,15,15,18,16,15]},
    shuttle:{name:'ECHS shuttle waiting time',units:'min',a:[8.4,7.9,8.7,9.1,8.2,7.6,8.8,8.5,7.7,8.0,9.0,8.3],b:[9.3,8.8,9.1,9.7,8.5,9.4,8.9,9.2,8.6,9.5,8.7]},
    battery:{name:'Device battery duration',units:'h',a:[11.2,10.8,11.5,11.1,10.9,11.4,11.0,11.3,10.7,11.6],b:[10.5,10.9,10.6,10.8,10.4,10.7,10.3,10.8,10.6,10.5]},
    reaction:{name:'Reaction time',units:'ms',a:[241,235,247,252,238,244,249,233,246,240],b:[229,236,231,234,238,227,233,230,235,232,228,237]},
    service:{name:'Cafeteria service time',units:'min',a:[4.8,5.1,4.6,5.0,4.9,5.2,4.7,5.3,4.8,4.9],b:[5.2,5.4,5.0,5.1,5.5,5.3,5.2,5.6,5.1,5.4]},
    exam:{name:'Assessment score',units:'marks',a:[72,76,68,81,75,79,73,77,70,74,78,80],b:[69,71,74,72,68,75,70,73,71,76,69]},
    outlier:{name:'Outlier audit',units:'units',a:[17,18,18,19,19,20,20,21,21,22],b:[16,17,17,18,18,19,19,20,20,41]},
    skew:{name:'Skew audit',units:'units',a:[3,4,4,5,5,5,6,6,7,8],b:[3,3,4,4,4,5,5,6,9,15]}
  };

  const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const slide=(id,section,eyebrow,title,kind,html)=>({id,section,eyebrow,title,kind,html});
  const notes=(id,placeholder='Record your reasoning, calculator evidence, and contextual conclusion…')=>`<textarea class="student-note" data-note="${esc(id)}" placeholder="${esc(placeholder)}"></textarea>`;
  const reveal=(summary,html)=>`<details><summary>${esc(summary)}</summary><div class="solution-panel">${html}</div></details>`;
  const plot=(type,attrs='')=>`<div class="u413-plot" data-u413-plot="${type}" ${attrs}><div class="u413-plot-fallback">Precise statistical graphic loading…</div></div>`;
  const lab=(type)=>`<div class="u413-live" data-u413-lab="${type}"><div class="u413-live-loading">Interactive statistical model loading…</div></div>`;
  const student=(prompt,id,solution)=>`<div class="student-turn"><span class="mini-label">Student turn</span><h2>${prompt}</h2>${notes(id)}${solution?reveal('Reveal a model response',solution):''}</div>`;
  const worked=(prompt,steps,exam)=>`<div class="worked-grid"><article class="worked-prompt"><span class="mini-label">Worked example</span><p>${prompt}</p><div class="workspace-lines"></div></article><article class="worked-solution"><span class="mini-label">Complete reasoning</span><ol class="worked-steps">${steps.map((step,index)=>`<li><span>${index+1}</span><div>${step}</div></li>`).join('')}</ol>${exam?`<div class="exam-language"><b>IB-ready conclusion</b><p>${exam}</p></div>`:''}</article></div>`;

  const weightsTwo=U.pooledArrays(D.weights.a,D.weights.b,'neq');
  const weightsGt=U.pooledArrays(D.weights.a,D.weights.b,'gt');
  const featureGt=U.pooledArrays(D.feature.a,D.feature.b,'gt');
  const shuttleLt=U.pooledArrays(D.shuttle.a,D.shuttle.b,'lt');
  const summaryExample=U.pooledSummary(418,35,15,391,32,13,'neq');

  data.schemaVersion='4.13.2';data.version='2.0.0';data.buildDate='2026-08-08';
  data.lesson={...data.lesson,number:'4.13',slug:'two_sample_t_tests_means',lesson_key:'u4-two-sample-t-test',title:'Two-Sample t-Tests for Comparing Means',subtitle:'Select, execute, interpret, and audit the pooled two-sample t-test for independent means using exact statistical reasoning and TI-84 evidence.',objectives:['Decide whether a pooled two-sample t-test is appropriate for two independent samples.','Define the population parameters and state directionally correct null and alternative hypotheses.','Understand the pooled standard error, test statistic, degrees of freedom, and p-value.','Execute Data and Stats workflows on the TI-84 Plus CE with Pooled: Yes.','Make a valid decision and write a cautious contextual conclusion.','Audit normality, independence, equal-variance, design, tail, list-order, and calculator-output issues.'],vocab:['independent samples','population mean','sample mean','pooled variance','standard error','test statistic','degrees of freedom','one-tailed','two-tailed','p-value','significance level','statistical significance'],technology:'Use STAT > TESTS > 4:2-SampTTest. Choose Data or Stats, set the alternative to match H₁, use Pooled: Yes for this equal-variance course model, and record t, p, df, sample summaries, decision, and contextual conclusion.',inquiry:'When is an observed difference between two sample means too large to attribute plausibly to random sampling variation?',source_sections:['4.17 Hypothesis test for two means μ₁ and μ₂ (pooled t-test)','TI-84 Plus CE 2-SampTTest workflow']};
  const slides=[];
  window.U413_CORE_BUILDER={data,U,D,esc,slide,notes,reveal,plot,lab,student,worked,weightsTwo,weightsGt,featureGt,shuttleLt,summaryExample,slides};
})();
