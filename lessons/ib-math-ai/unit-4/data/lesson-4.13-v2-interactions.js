(function(){
  'use strict';
  const data=window.LESSON_DATA,U=window.U413_STATS,D=window.U413_DATASETS;
  if(!data||String(data.lesson?.number)!=='4.13'||!U||!D)return;
  const $=(selector,root=document)=>root.querySelector(selector);
  const $$=(selector,root=document)=>Array.from(root.querySelectorAll(selector));
  const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const G=()=>window.ECHS_U413_GRAPHICS;

  function readout(items){return `<div class="u413-readout">${items.map(([label,value])=>`<div><span>${esc(label)}</span><b>${esc(value)}</b></div>`).join('')}</div>`;}
  function alternativeLabel(value){return value==='lt'?'μ₁ < μ₂':value==='gt'?'μ₁ > μ₂':'μ₁ ≠ μ₂';}
  function decisionSentence(result,alpha=0.05){
    const reject=result.p<=alpha;
    return `${reject?'Reject H₀':'Do not reject H₀'} because p=${U.fmt(result.p,5)} ${reject?'≤': '>'} α=${U.fmt(alpha,2)}.`;
  }

  function tailExplorer(root){
    root.innerHTML=`<div class="u413-controls"><label>Observed t <input type="range" min="-4" max="4" step="0.05" value="-1.85" data-t></label><label>Degrees of freedom <input type="range" min="2" max="60" step="1" value="16" data-df></label><label>Alternative <select data-alt><option value="lt">μ₁ &lt; μ₂</option><option value="neq">μ₁ ≠ μ₂</option><option value="gt">μ₁ &gt; μ₂</option></select></label></div><div data-readout></div><div class="u413-live-chart u413-plot" data-chart></div><div class="u413-message" data-message></div>`;
    const update=()=>{
      const t=Number($('[data-t]',root).value),df=Number($('[data-df]',root).value),alternative=$('[data-alt]',root).value,p=U.pValue(t,df,alternative);
      $('[data-readout]',root).innerHTML=readout([['t',U.fmt(t,3)],['df',df],['H₁',alternativeLabel(alternative)],['p-value',U.fmt(p,5)]]);
      $('[data-chart]',root).innerHTML=G()?.tDistributionSvg({df,t,alternative,title:'Exact Student-t tail area',subtitle:'The shaded area follows the selected alternative'})||'';
      const direction=(alternative==='lt'&&t<0)||(alternative==='gt'&&t>0)||alternative==='neq';
      const message=$('[data-message]',root);message.classList.toggle('warn',!direction);message.textContent=direction?'The sign of t points into the selected alternative tail. Compare p with α only after confirming this direction.':'Warning: the sign of t points away from the selected one-tailed alternative, so the p-value is large.';
    };
    $$('input,select',root).forEach(node=>node.addEventListener('input',update));update();
  }

  function pooledExplorer(root){
    root.innerHTML=`<div class="u413-controls"><label>x̄₁ <input type="number" step="0.1" value="18.25" data-m1></label><label>Sx₁ <input type="number" min="0.01" step="0.1" value="2.454" data-s1></label><label>n₁ <input type="number" min="2" step="1" value="12" data-n1></label><label>x̄₂ <input type="number" step="0.1" value="16" data-m2></label><label>Sx₂ <input type="number" min="0.01" step="0.1" value="1.5" data-s2></label><label>n₂ <input type="number" min="2" step="1" value="9" data-n2></label><label>Alternative <select data-alt><option value="neq">μ₁ ≠ μ₂</option><option value="gt" selected>μ₁ &gt; μ₂</option><option value="lt">μ₁ &lt; μ₂</option></select></label><label>Significance α <select data-alpha><option value="0.10">0.10</option><option value="0.05" selected>0.05</option><option value="0.01">0.01</option></select></label></div><div data-readout></div><div class="u413-live-chart u413-plot" data-chart></div><div class="u413-message" data-message></div>`;
    const update=()=>{
      const values=['m1','s1','n1','m2','s2','n2'].map(key=>Number($(`[data-${key}]`,root).value));
      if(values.some(value=>!Number.isFinite(value))||values[1]<=0||values[4]<=0||values[2]<2||values[5]<2){$('[data-message]',root).textContent='Enter valid positive standard deviations and sample sizes of at least 2.';return;}
      const alternative=$('[data-alt]',root).value,alpha=Number($('[data-alpha]',root).value),result=U.pooledSummary(...values,alternative);
      $('[data-readout]',root).innerHTML=readout([['sₚ',U.fmt(result.sp,4)],['SE',U.fmt(result.se,4)],['t',U.fmt(result.t,4)],['df',result.df],['p-value',U.fmt(result.p,5)],['decision',result.p<=alpha?'Reject H₀':'Do not reject H₀']]);
      $('[data-chart]',root).innerHTML=G()?.tDistributionSvg({df:result.df,t:result.t,alternative,title:'Pooled test evidence',subtitle:`Difference=${U.fmt(result.difference,3)}; SE=${U.fmt(result.se,3)}`})||'';
      const message=$('[data-message]',root);message.classList.toggle('warn',Math.max(result.s1,result.s2)/Math.min(result.s1,result.s2)>2);message.textContent=`${decisionSentence(result,alpha)} A numerical result is meaningful only when independence, approximate normality, and the equal-variance model are defensible.`;
    };
    $$('input,select',root).forEach(node=>node.addEventListener('input',update));update();
  }

  function assumptionAudit(root){
    const cases={
      clean:{label:'Clean comparison',dataset:D.feature,note:'Both small samples are reasonably compact, with no dominating point. The model is plausible if the design supplies independent random observations and equal population variances.'},
      skew:{label:'Strong skew',dataset:D.skew,note:'The right tails are uneven and sample sizes are small. A pooled t-test may be sensitive; investigate the sampling process and whether a robust alternative is required.'},
      outlier:{label:'Outlier contamination',dataset:D.outlier,note:'The value 41 strongly changes the mean and variance of sample 2. Audit data quality and report sensitivity rather than hiding the point.'}
    };
    root.innerHTML=`<div class="u413-assumption-tabs">${Object.entries(cases).map(([key,item],index)=>`<button type="button" class="${index===0?'active':''}" data-case="${key}">${esc(item.label)}</button>`).join('')}</div><div data-readout></div><div class="u413-live-chart u413-plot" data-chart></div><div class="u413-message" data-message></div>`;
    let active='clean';
    const update=()=>{
      const item=cases[active],dataset=item.dataset,result=U.pooledArrays(dataset.a,dataset.b,'neq');
      $('[data-readout]',root).innerHTML=readout([['x̄₁',U.fmt(result.m1,3)],['Sx₁',U.fmt(result.s1,3)],['x̄₂',U.fmt(result.m2,3)],['Sx₂',U.fmt(result.s2,3)],['t',U.fmt(result.t,3)],['two-tail p',U.fmt(result.p,5)]]);
      $('[data-chart]',root).innerHTML=G()?.dotRows(dataset,item.label)||'';
      const message=$('[data-message]',root);message.classList.toggle('warn',active!=='clean');message.textContent=item.note;
      $$('[data-case]',root).forEach(button=>button.classList.toggle('active',button.dataset.case===active));
    };
    $$('[data-case]',root).forEach(button=>button.addEventListener('click',()=>{active=button.dataset.case;update();}));update();
  }

  function alphaChart(p,alpha){
    const width=610,left=35,right=645,y=116,max=0.15,x=value=>left+Math.min(max,Math.max(0,value))/max*(right-left),reject=p<=alpha;
    const ticks=Array.from({length:7},(_,index)=>index*0.025);
    return `<svg viewBox="0 0 680 220" role="img" aria-label="Number line comparing p-value ${U.fmt(p,3)} with significance level ${U.fmt(alpha,2)}"><rect x="8" y="8" width="664" height="204" rx="24" fill="#fffdf9" stroke="#d6dce2"/><text x="34" y="42" class="label">Decision threshold</text><rect x="${left}" y="91" width="${Math.max(0,x(alpha)-left)}" height="50" rx="13" fill="rgba(31,122,77,.16)"/><line x1="${left}" y1="${y}" x2="${right}" y2="${y}" class="axis"/>${ticks.map(value=>`<line x1="${x(value)}" y1="${y-6}" x2="${x(value)}" y2="${y+6}" class="axis"/><text x="${x(value)}" y="${y+25}" text-anchor="middle" class="tick">${U.fmt(value,3)}</text>`).join('')}<line x1="${x(alpha)}" y1="70" x2="${x(alpha)}" y2="155" stroke="#1f7a4d" stroke-width="4"/><text x="${x(alpha)}" y="61" text-anchor="middle" class="label">α=${U.fmt(alpha,2)}</text><circle cx="${x(p)}" cy="${y}" r="9" fill="#78183f"/><text x="${x(p)}" y="180" text-anchor="middle" class="label">p=${U.fmt(p,3)}</text><text x="640" y="42" text-anchor="end" class="label">${reject?'Reject H₀':'Do not reject H₀'}</text></svg>`;
  }
  function alphaExplorer(root){
    root.innerHTML=`<div class="u413-controls"><label>Fixed p-value <input type="range" min="0.001" max="0.150" step="0.001" value="0.039" data-p></label><label>Significance level α <select data-alpha><option value="0.10">0.10</option><option value="0.05" selected>0.05</option><option value="0.01">0.01</option></select></label></div><div data-readout></div><div class="u413-live-chart u413-plot" data-chart></div><div class="u413-message" data-message></div>`;
    const update=()=>{
      const p=Number($('[data-p]',root).value),alpha=Number($('[data-alpha]',root).value),reject=p<=alpha;
      $('[data-readout]',root).innerHTML=readout([['p-value',U.fmt(p,3)],['α',U.fmt(alpha,2)],['comparison',`p ${reject?'≤':'>'} α`],['decision',reject?'Reject H₀':'Do not reject H₀']]);
      $('[data-chart]',root).innerHTML=alphaChart(p,alpha);
      $('[data-message]',root).textContent=`The p-value is determined by the data, test statistic, degrees of freedom, and chosen tail. Changing α changes the decision threshold—not the evidence.`;
    };
    $$('input,select',root).forEach(node=>node.addEventListener('input',update));update();
  }

  function hydrateElement(root){
    const type=root.dataset.u413Lab;
    if(type==='tail-explorer')tailExplorer(root);
    else if(type==='pooled-explorer')pooledExplorer(root);
    else if(type==='assumption-audit')assumptionAudit(root);
    else if(type==='alpha-explorer')alphaExplorer(root);
    else if(type==='ti84-inline')return;
    else root.innerHTML='<div class="u413-message warn">Interactive model unavailable.</div>';
    root.dataset.u413Hydrated='1';
  }
  function hydrate(root=document){root.querySelectorAll?.('[data-u413-lab]:not([data-u413-hydrated])').forEach(hydrateElement);}
  function init(){hydrate();const app=document.getElementById('app');if(app)new MutationObserver(()=>hydrate(app)).observe(app,{childList:true,subtree:true});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
  window.ECHS_U413_INTERACTIONS={hydrate,release:'2.0.0',exactStudentT:true};
})();
