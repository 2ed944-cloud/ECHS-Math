(function(){
  'use strict';
  const data=window.LESSON_DATA,U=window.U413_STATS,D=window.U413_DATASETS;
  if(!data||String(data.lesson?.number)!=='4.13'||!U||!D)return;

  const NS='http://www.w3.org/2000/svg';
  const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
  const normalPdf=x=>Math.exp(-0.5*x*x)/Math.sqrt(2*Math.PI);
  const scale=(value,d0,d1,r0,r1)=>r0+(value-d0)/(d1-d0)*(r1-r0);
  const pathFrom=(points,close=false)=>points.map((point,index)=>`${index?'L':'M'}${point[0].toFixed(2)},${point[1].toFixed(2)}`).join(' ')+(close?' Z':'');

  function shell(title,description,inner,view='0 0 680 360'){
    const id=`u413-${Math.random().toString(36).slice(2,9)}`;
    return `<svg viewBox="${view}" role="img" aria-labelledby="${id}-title ${id}-desc"><title id="${id}-title">${esc(title)}</title><desc id="${id}-desc">${esc(description)}</desc>${inner}</svg>`;
  }
  function frame(title,subtitle=''){
    return `<rect x="8" y="8" width="664" height="344" rx="26" fill="#fffdf9" stroke="#d6dce2"/><text x="34" y="43" class="label" font-size="17">${esc(title)}</text>${subtitle?`<text x="34" y="63" class="small">${esc(subtitle)}</text>`:''}`;
  }
  function ticks(min,max,count=5){return Array.from({length:count},(_,index)=>min+(max-min)*index/(count-1));}
  function axisX(min,max,y=300,left=56,right=646){
    const values=ticks(min,max,6);
    return `<line x1="${left}" y1="${y}" x2="${right}" y2="${y}" class="axis"/>${values.map(value=>{const x=scale(value,min,max,left,right);return `<line x1="${x}" y1="${y}" x2="${x}" y2="${y+6}" class="axis"/><text x="${x}" y="${y+22}" text-anchor="middle" class="tick">${U.fmt(value,2)}</text>`;}).join('')}`;
  }
  function tCurve(df,{xmin=-4.5,xmax=4.5,left=55,right=645,top=78,bottom=292,className='curve'}={}){
    const ymax=U.tPdf(0,df)*1.08;
    const points=Array.from({length:241},(_,index)=>{const t=xmin+(xmax-xmin)*index/240;return [scale(t,xmin,xmax,left,right),scale(U.tPdf(t,df),0,ymax,bottom,top)];});
    return {path:`<path d="${pathFrom(points)}" class="${className}"/>`,points,ymax};
  }
  function tTail(df,t,alternative,{xmin=-4.5,xmax=4.5,left=55,right=645,top=78,bottom=292}={}){
    const ymax=U.tPdf(0,df)*1.08;
    const polygons=[];
    const add=(a,b,className)=>{
      const lo=clamp(a,xmin,xmax),hi=clamp(b,xmin,xmax);if(!(hi>lo))return;
      const curve=Array.from({length:121},(_,index)=>{const x=lo+(hi-lo)*index/120;return [scale(x,xmin,xmax,left,right),scale(U.tPdf(x,df),0,ymax,bottom,top)];});
      const points=[[scale(lo,xmin,xmax,left,right),bottom],...curve,[scale(hi,xmin,xmax,left,right),bottom]];
      polygons.push(`<path d="${pathFrom(points,true)}" class="${className}"/>`);
    };
    if(alternative==='lt')add(xmin,t,'tail-alt');
    else if(alternative==='gt')add(t,xmax,'tail');
    else {const a=Math.abs(t);add(xmin,-a,'tail-alt');add(a,xmax,'tail');}
    return polygons.join('');
  }
  function tDistributionSvg({df=16,t=1.85,alternative='neq',title='Student-t evidence',subtitle='Shaded area is the p-value'}={}){
    const xmin=-4.5,xmax=4.5,left=55,right=645,top=78,bottom=292;
    const curve=tCurve(df,{xmin,xmax,left,right,top,bottom});
    const tx=scale(clamp(t,xmin,xmax),xmin,xmax,left,right);
    const p=U.pValue(t,df,alternative);
    return shell(title,`${subtitle}. t equals ${U.fmt(t,3)}, degrees of freedom ${df}, p-value ${U.fmt(p,4)}.`,`${frame(title,subtitle)}${tTail(df,t,alternative,{xmin,xmax,left,right,top,bottom})}<line x1="${tx}" y1="${bottom}" x2="${tx}" y2="${top+15}" stroke="#d4a72c" stroke-width="3" stroke-dasharray="6 5"/>${curve.path}${axisX(xmin,xmax,bottom,left,right)}<text x="${tx+(t>=0?8:-8)}" y="98" text-anchor="${t>=0?'start':'end'}" class="label">t = ${U.fmt(t,3)}</text><text x="640" y="42" text-anchor="end" class="label">p = ${U.fmt(p,4)}</text>`);
  }

  function stackPoints(values,min,max,left,right,base,step=13){
    const counts=new Map();
    return values.slice().sort((a,b)=>a-b).map(value=>{const key=Number(value).toFixed(6),level=counts.get(key)||0;counts.set(key,level+1);return {value,x:scale(value,min,max,left,right),y:base-level*step};});
  }
  function dotRows(dataset,title=dataset.name){
    const all=[...dataset.a,...dataset.b],pad=Math.max(0.4,(Math.max(...all)-Math.min(...all))*.07),min=Math.min(...all)-pad,max=Math.max(...all)+pad,left=64,right=642;
    const a=stackPoints(dataset.a,min,max,left,right,155),b=stackPoints(dataset.b,min,max,left,right,255);
    const m1=U.mean(dataset.a),m2=U.mean(dataset.b);
    const ticksMarkup=ticks(min,max,6).map(value=>{const x=scale(value,min,max,left,right);return `<line x1="${x}" y1="286" x2="${x}" y2="292" class="axis"/><text x="${x}" y="309" text-anchor="middle" class="tick">${U.fmt(value,1)}</text>`;}).join('');
    return shell(`${title}: two independent samples`,`Dot plots for sample 1 and sample 2. The vertical gold lines mark the sample means.`,`${frame(title,`${dataset.units} · dots are observations; gold lines are sample means`)}<text x="43" y="151" text-anchor="end" class="label">1</text><text x="43" y="251" text-anchor="end" class="label">2</text><line x1="${left}" y1="166" x2="${right}" y2="166" class="grid"/><line x1="${left}" y1="266" x2="${right}" y2="266" class="grid"/>${a.map(point=>`<circle cx="${point.x}" cy="${point.y}" r="6" class="point-a"/>`).join('')}${b.map(point=>`<circle cx="${point.x}" cy="${point.y}" r="6" class="point-b"/>`).join('')}<line x1="${scale(m1,min,max,left,right)}" y1="92" x2="${scale(m1,min,max,left,right)}" y2="174" class="mean-line"/><line x1="${scale(m2,min,max,left,right)}" y1="192" x2="${scale(m2,min,max,left,right)}" y2="274" class="mean-line"/><text x="${scale(m1,min,max,left,right)}" y="84" text-anchor="middle" class="small">x̄₁=${U.fmt(m1,2)}</text><text x="${scale(m2,min,max,left,right)}" y="187" text-anchor="middle" class="small">x̄₂=${U.fmt(m2,2)}</text><line x1="${left}" y1="286" x2="${right}" y2="286" class="axis"/>${ticksMarkup}<text x="353" y="338" text-anchor="middle" class="small">Observed sample values (${esc(dataset.units)})</text>`);
  }
  function coverGraphic(){
    const result=U.pooledArrays(D.shuttle.a,D.shuttle.b,'lt');
    const leftPlot=`<g transform="translate(0,18)"><text x="32" y="72" class="label">Independent samples</text><line x1="42" y1="154" x2="302" y2="154" class="axis"/><line x1="42" y1="254" x2="302" y2="254" class="axis"/>${stackPoints(D.shuttle.a,7.4,9.9,48,296,142,11).map(point=>`<circle cx="${point.x}" cy="${point.y}" r="5" class="point-a"/>`).join('')}${stackPoints(D.shuttle.b,7.4,9.9,48,296,242,11).map(point=>`<circle cx="${point.x}" cy="${point.y}" r="5" class="point-b"/>`).join('')}<text x="28" y="146" text-anchor="end" class="small">A</text><text x="28" y="246" text-anchor="end" class="small">B</text><text x="172" y="286" text-anchor="middle" class="small">Observed waiting times</text></g>`;
    const xmin=-4.5,xmax=4.5,left=365,right=648,top=98,bottom=273,curve=tCurve(result.df,{xmin,xmax,left,right,top,bottom});
    const tx=scale(result.t,xmin,xmax,left,right);
    return shell('Two independent samples become standardized t evidence','A dot plot of two route samples connects to a left-tailed Student-t distribution with exact pooled test evidence.',`${frame('From two samples to a population conclusion','Pooled independent-samples t-test')}${leftPlot}<path d="M310,184 C330,184 338,184 354,184" fill="none" stroke="#177e89" stroke-width="4"/><path d="M350,178 L362,184 L350,190 Z" fill="#177e89"/>${tTail(result.df,result.t,'lt',{xmin,xmax,left,right,top,bottom})}<line x1="${tx}" y1="${bottom}" x2="${tx}" y2="${top+12}" class="mean-line"/>${curve.path}<line x1="${left}" y1="${bottom}" x2="${right}" y2="${bottom}" class="axis"/><text x="506" y="78" text-anchor="middle" class="label">Student-t null model</text><text x="506" y="304" text-anchor="middle" class="small">t=${U.fmt(result.t,3)} · df=${result.df} · p=${U.fmt(result.p,4)}</text><text x="506" y="326" text-anchor="middle" class="small">left tail matches H₁: μ₁&lt;μ₂</text>`);
  }
  function equalSpreadGraphic(){
    const min=-4,max=8,left=56,right=646,top=84,bottom=295,sd=1.25,m1=0,m2=3.2,ymax=1/(sd*Math.sqrt(2*Math.PI))*1.08;
    const curve=(mean,className)=>{const pts=Array.from({length:201},(_,index)=>{const x=min+(max-min)*index/200,y=Math.exp(-0.5*((x-mean)/sd)**2)/(sd*Math.sqrt(2*Math.PI));return [scale(x,min,max,left,right),scale(y,0,ymax,bottom,top)];});return `<path d="${pathFrom(pts)}" class="${className}"/>`;};
    return shell('Equal variance does not mean equal means','Two normal population models have the same standard deviation and different means.',`${frame('Same spread, different centres','Both curves use σ = 1.25; only μ changes')}${curve(m1,'curve')}${curve(m2,'curve secondary')}<line x1="${scale(m1,min,max,left,right)}" y1="${bottom}" x2="${scale(m1,min,max,left,right)}" y2="126" class="mean-line"/><line x1="${scale(m2,min,max,left,right)}" y1="${bottom}" x2="${scale(m2,min,max,left,right)}" y2="126" class="mean-line"/>${axisX(min,max,bottom,left,right)}<text x="${scale(m1,min,max,left,right)}" y="112" text-anchor="middle" class="label">μ₁</text><text x="${scale(m2,min,max,left,right)}" y="112" text-anchor="middle" class="label">μ₂</text><line x1="${scale(m1-sd,min,max,left,right)}" y1="250" x2="${scale(m1+sd,min,max,left,right)}" y2="250" stroke="#78183f" stroke-width="5"/><line x1="${scale(m2-sd,min,max,left,right)}" y1="267" x2="${scale(m2+sd,min,max,left,right)}" y2="267" stroke="#177e89" stroke-width="5"/><text x="${scale(m1,min,max,left,right)}" y="242" text-anchor="middle" class="small">same σ</text><text x="${scale(m2,min,max,left,right)}" y="259" text-anchor="middle" class="small">same σ</text>`);
  }
  function orderSignGraphic(dataset){
    const result=U.pooledArrays(dataset.a,dataset.b,'lt');
    const reverse=U.pooledArrays(dataset.b,dataset.a,'gt');
    return shell('List order determines the sign of t','With route A in list 1 and route B in list 2 the difference and t-statistic are negative. Reversing both list order and inequality preserves the one-tailed p-value.',`${frame('Order → difference → sign → tail','Keep parameter definitions, list order, and H₁ synchronized')}<rect x="42" y="92" width="276" height="102" rx="18" fill="#fff" stroke="#78183f" stroke-width="2"/><rect x="362" y="92" width="276" height="102" rx="18" fill="#fff" stroke="#177e89" stroke-width="2"/><text x="180" y="120" text-anchor="middle" class="label">L1 = Route A · L2 = Route B</text><text x="180" y="147" text-anchor="middle" class="small">x̄₁ − x̄₂ = ${U.fmt(result.difference,3)}</text><text x="180" y="174" text-anchor="middle" class="label">t = ${U.fmt(result.t,3)} · H₁: μ₁&lt;μ₂</text><text x="500" y="120" text-anchor="middle" class="label">L1 = Route B · L2 = Route A</text><text x="500" y="147" text-anchor="middle" class="small">x̄₁ − x̄₂ = ${U.fmt(reverse.difference,3)}</text><text x="500" y="174" text-anchor="middle" class="label">t = ${U.fmt(reverse.t,3)} · H₁: μ₁&gt;μ₂</text><path d="M318,143 C336,128 344,128 362,143" fill="none" stroke="#d4a72c" stroke-width="4"/><path d="M354,135 L364,143 L352,148 Z" fill="#d4a72c"/><rect x="154" y="232" width="372" height="62" rx="19" fill="#edf8f7" stroke="#b9ddd9"/><text x="340" y="257" text-anchor="middle" class="label">One-tailed p-value is unchanged: ${U.fmt(result.p,5)}</text><text x="340" y="280" text-anchor="middle" class="small">because both subtraction order and alternative direction were reversed</text>`);
  }
  function tVsNormalGraphic(){
    const xmin=-4.5,xmax=4.5,left=56,right=646,top=80,bottom=294,ymax=normalPdf(0)*1.06;
    const make=(pdf,className)=>{const pts=Array.from({length:241},(_,index)=>{const x=xmin+(xmax-xmin)*index/240;return [scale(x,xmin,xmax,left,right),scale(pdf(x),0,ymax,bottom,top)];});return `<path d="${pathFrom(pts)}" class="${className}"/>`;};
    return shell('Student-t has heavier tails than the normal curve','An exact density comparison between a Student-t distribution with 4 degrees of freedom and the standard normal distribution.',`${frame('Estimated spread creates heavier tails','Solid: t with df = 4 · dashed: standard normal')}${make(x=>U.tPdf(x,4),'curve')}${make(normalPdf,'curve secondary')}${axisX(xmin,xmax,bottom,left,right)}<line x1="435" y1="92" x2="472" y2="92" class="curve"/><text x="482" y="97" class="small">t₄</text><line x1="525" y1="92" x2="562" y2="92" class="curve secondary"/><text x="572" y="97" class="small">N(0,1)</text><text x="340" y="334" text-anchor="middle" class="small">The curves converge as df increases.</text>`);
  }
  function pooledWeightsGraphic(n1,n2){
    const w1=n1-1,w2=n2-1,total=w1+w2,max=Math.max(w1,w2),bar=value=>value/max*190;
    return shell('Sample variances are weighted by degrees of freedom','The pooled variance assigns weights n1 minus 1 and n2 minus 1 to the two sample variances.',`${frame('Pooled-variance weights',`n₁=${n1}, n₂=${n2}, df=${total}`)}<text x="54" y="128" class="label">Sample 1 variance</text><rect x="190" y="101" width="${bar(w1)}" height="42" rx="10" fill="#78183f" opacity=".86"/><text x="${200+bar(w1)}" y="128" class="label">weight n₁−1 = ${w1}</text><text x="54" y="210" class="label">Sample 2 variance</text><rect x="190" y="183" width="${bar(w2)}" height="42" rx="10" fill="#177e89" opacity=".86"/><text x="${200+bar(w2)}" y="210" class="label">weight n₂−1 = ${w2}</text><rect x="104" y="270" width="472" height="48" rx="16" fill="#f3eee7"/><text x="340" y="291" text-anchor="middle" class="label">sₚ² = [${w1}s₁² + ${w2}s₂²] / ${total}</text><text x="340" y="310" text-anchor="middle" class="small">Pooling combines variance evidence—not observations.</text>`);
  }
  function seLeversGraphic(){
    const cases=[
      {label:'Baseline',sp:2,n1:10,n2:10},
      {label:'Double both n',sp:2,n1:20,n2:20},
      {label:'Double spread',sp:4,n1:10,n2:10}
    ].map(item=>({...item,se:item.sp*Math.sqrt(1/item.n1+1/item.n2)}));
    const max=Math.max(...cases.map(item=>item.se));
    return shell('Standard error changes with spread and sample size','Three exact standard-error calculations show that larger samples reduce standard error while larger pooled spread increases it.',`${frame('SE levers','SE = sₚ√(1/n₁ + 1/n₂)')}${cases.map((item,index)=>{const y=103+index*75,width=item.se/max*330;return `<text x="48" y="${y+20}" class="label">${esc(item.label)}</text><rect x="204" y="${y}" width="${width}" height="35" rx="9" fill="${index===1?'#177e89':index===2?'#d4a72c':'#78183f'}" opacity=".86"/><text x="${214+width}" y="${y+22}" class="small">SE=${U.fmt(item.se,3)}</text><text x="205" y="${y+52}" class="small">sₚ=${item.sp}, n₁=${item.n1}, n₂=${item.n2}</text>`;}).join('')}<text x="340" y="337" text-anchor="middle" class="small">Holding everything else fixed: larger n → smaller SE; larger sₚ → larger SE.</text>`);
  }
  function tiOutputGraphic(dataset){
    const result=U.pooledArrays(dataset.a,dataset.b,'gt');
    return shell('TI-84 2-SampTTest output','A calculator-style output screen showing t, p, df, sample means, sample standard deviations, and sample sizes for the measured-feature data.',`${frame('Read every output line','Data mode · μ₁ > μ₂ · Pooled: Yes')}<rect x="112" y="77" width="456" height="238" rx="22" fill="#20262c"/><rect x="135" y="98" width="410" height="194" rx="10" fill="#c8d4b0" stroke="#0d1410" stroke-width="5"/><text x="155" y="126" class="screen-text">2-SampTTest</text><text x="155" y="152" class="screen-small">μ₁&gt;μ₂</text><text x="155" y="176" class="screen-small">t=${U.fmt(result.t,6)}</text><text x="155" y="200" class="screen-small">p=${U.fmt(result.p,7)}</text><text x="155" y="224" class="screen-small">df=${result.df}</text><text x="355" y="152" class="screen-small">x̄1=${U.fmt(result.m1,4)}</text><text x="355" y="176" class="screen-small">x̄2=${U.fmt(result.m2,4)}</text><text x="355" y="200" class="screen-small">Sx1=${U.fmt(result.s1,4)}</text><text x="355" y="224" class="screen-small">Sx2=${U.fmt(result.s2,4)}</text><text x="155" y="252" class="screen-small">n1=${result.n1}</text><text x="355" y="252" class="screen-small">n2=${result.n2}</text><text x="155" y="276" class="screen-small">Pooled=Yes</text>`);
  }
  function reverseOrderGraphic(dataset){
    const forward=U.pooledArrays(dataset.a,dataset.b,'neq'),reverse=U.pooledArrays(dataset.b,dataset.a,'neq');
    return shell('Reversing lists changes the sign of t but not a two-tailed p-value','Two exact pooled tests compare the same groups in opposite orders.',`${frame('Same comparison, opposite subtraction order','Two-tailed test')}${[forward,reverse].map((result,index)=>{const x=index?362:42,label=index?'B − A':'A − B',color=index?'#177e89':'#78183f';return `<rect x="${x}" y="92" width="276" height="164" rx="20" fill="#fff" stroke="${color}" stroke-width="2"/><text x="${x+138}" y="122" text-anchor="middle" class="label">${label}</text><text x="${x+28}" y="156" class="small">difference = ${U.fmt(result.difference,4)}</text><text x="${x+28}" y="184" class="label">t = ${U.fmt(result.t,5)}</text><text x="${x+28}" y="212" class="label">p = ${U.fmt(result.p,5)}</text><text x="${x+28}" y="239" class="small">df = ${result.df} · SE = ${U.fmt(result.se,4)}</text>`;}).join('')}<path d="M318,173 C335,155 345,155 362,173" fill="none" stroke="#d4a72c" stroke-width="4"/><path d="M353,165 L364,173 L352,179 Z" fill="#d4a72c"/><text x="340" y="304" text-anchor="middle" class="label">t changes sign; |t|, df, SE, and two-tailed p stay the same.</text>`);
  }

  function render(el){
    const type=el.dataset.u413Plot;let markup='';
    if(type==='cover')markup=coverGraphic();
    else if(type==='sample-to-population')markup=dotRows(D[el.dataset.a]||D.shuttle);
    else if(type==='equal-spread')markup=equalSpreadGraphic();
    else if(type==='order-sign')markup=orderSignGraphic(D[el.dataset.a]||D.shuttle);
    else if(type==='t-vs-normal')markup=tVsNormalGraphic();
    else if(type==='pooled-weights')markup=pooledWeightsGraphic(Number(el.dataset.n1)||15,Number(el.dataset.n2)||13);
    else if(type==='se-levers')markup=seLeversGraphic();
    else if(type==='ti-output')markup=tiOutputGraphic(D[el.dataset.a]||D.feature);
    else if(type==='reverse-order')markup=reverseOrderGraphic(D[el.dataset.a]||D.weights);
    else markup=shell('Statistical graphic','A precise statistical graphic for this lesson.',`${frame('Statistical graphic')}<text x="340" y="190" text-anchor="middle" class="label">Graphic unavailable</text>`);
    el.innerHTML=markup;el.dataset.u413Hydrated='1';
  }
  function hydrate(root=document){root.querySelectorAll?.('[data-u413-plot]:not([data-u413-hydrated])').forEach(render);}
  function init(){hydrate();const app=document.getElementById('app');if(app)new MutationObserver(()=>hydrate(app)).observe(app,{childList:true,subtree:true});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
  window.ECHS_U413_GRAPHICS={hydrate,tDistributionSvg,dotRows,release:'2.0.0',exactStudentT:true};
})();
