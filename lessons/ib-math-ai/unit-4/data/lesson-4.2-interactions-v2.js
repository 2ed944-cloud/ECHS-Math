(function(){
  'use strict';
  if(String(window.LESSON_DATA?.lesson?.number)!=='4.2')return;

  const api=window.ECHS_IB_AI_4_2_DEFINITIVE||{};
  const ordered=values=>values.slice().map(Number).sort((a,b)=>a-b);
  const median=values=>{const x=ordered(values),n=x.length,m=Math.floor(n/2);return n%2?x[m]:(x[m-1]+x[m])/2;};
  const quartiles=api.quartiles||function(values){
    const x=ordered(values),n=x.length,m=Math.floor(n/2);
    return {min:x[0],q1:median(x.slice(0,m)),med:median(x),q3:median(x.slice(n%2?m+1:m)),max:x[n-1]};
  };
  const stats=api.stats||function(values){
    const x=values.map(Number),n=x.length,sum=x.reduce((a,b)=>a+b,0),mean=sum/n;
    const ss=x.reduce((a,b)=>a+(b-mean)**2,0),five=quartiles(x),iqr=five.q3-five.q1,lower=five.q1-1.5*iqr,upper=five.q3+1.5*iqr;
    return {...five,n,mean,sigma:Math.sqrt(ss/n),sx:n>1?Math.sqrt(ss/(n-1)):NaN,iqr,lower,upper,outliers:ordered(x.filter(v=>v<lower||v>upper))};
  };
  const fmt=(value,d=3)=>Number.isFinite(Number(value))?Number(Number(value).toFixed(d)).toString():'—';
  const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const initialized=new WeakSet();

  function dotPlot(values,{title='Distribution',min,max,color='#78183f'}={}){
    const x=ordered(values);
    if(!x.length)return '<div class="u42-ti84-error">At least one observation is required.</div>';
    const lo=Number.isFinite(min)?min:Math.floor(Math.min(...x)-2),hi=Number.isFinite(max)?max:Math.ceil(Math.max(...x)+2);
    const width=720,height=270,left=65,right=680,base=196,span=Math.max(1,hi-lo),pos=v=>left+(v-lo)/span*(right-left);
    const seen=new Map();
    const dots=x.map(v=>{const c=seen.get(v)||0;seen.set(v,c+1);return `<circle cx="${pos(v).toFixed(2)}" cy="${base-16-c*17}" r="6.5" fill="${color}" stroke="#fff" stroke-width="2"><title>${esc(v)}</title></circle>`;}).join('');
    const step=span<=12?1:span<=35?5:10,ticks=[];for(let v=Math.ceil(lo/step)*step;v<=hi;v+=step)ticks.push(v);
    const axis=ticks.map(v=>`<line x1="${pos(v)}" x2="${pos(v)}" y1="${base}" y2="${base+8}" stroke="#17324d"/><text x="${pos(v)}" y="${base+28}" text-anchor="middle" font-size="11" fill="#536779">${v}</text>`).join('');
    return `<svg class="u42-stat-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(title)}"><rect x="4" y="4" width="712" height="262" rx="22" fill="#fffdf9" stroke="#d8dee5"/><text x="24" y="34" fill="#17324d" font-size="18" font-weight="850">${esc(title)}</text><line x1="${left}" x2="${right}" y1="${base}" y2="${base}" stroke="#17324d" stroke-width="2"/>${dots}${axis}</svg>`;
  }

  function frequencyPlot(values,freqs){
    const data=[];values.forEach((v,i)=>{for(let j=0;j<freqs[i];j++)data.push(v);});
    const width=720,height=285,left=82,right=660,base=218,pos=v=>left+(v-1)/4*(right-left);
    const bars=values.map((v,i)=>{const h=freqs[i]*18;return `<rect x="${pos(v)-24}" y="${base-h}" width="48" height="${h}" rx="8" fill="${i===2?'#137f78':'#78183f'}" fill-opacity=".82"/><text x="${pos(v)}" y="${base-h-8}" text-anchor="middle" font-size="13" fill="#17324d" font-weight="850">${freqs[i]}</text><text x="${pos(v)}" y="${base+27}" text-anchor="middle" font-size="13" fill="#43576a">${v}</text>`;}).join('');
    return `<svg class="u42-stat-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="Frequency distribution"><rect x="4" y="4" width="712" height="277" rx="22" fill="#fffdf9" stroke="#d8dee5"/><text x="24" y="34" fill="#17324d" font-size="18" font-weight="850">Frequency distribution · n = ${data.length}</text><line x1="${left-42}" x2="${right+42}" y1="${base}" y2="${base}" stroke="#17324d" stroke-width="2"/>${bars}<text x="360" y="274" text-anchor="middle" font-size="12" fill="#607183">score value</text></svg>`;
  }

  function modifiedBoxPlot(values){
    const s=stats(values),x=ordered(values),out=s.outliers,non=x.filter(v=>!out.includes(v)),low=non[0],high=non[non.length-1];
    const lo=Math.min(...x,s.lower)-3,hi=Math.max(...x,s.upper)+3,width=720,height=285,left=65,right=680,y=142,pos=v=>left+(v-lo)/(hi-lo)*(right-left);
    const outDots=out.map(v=>`<circle cx="${pos(v)}" cy="${y}" r="7" fill="#a93446" stroke="#fff" stroke-width="2"><title>outlier ${v}</title></circle>`).join('');
    const step=(hi-lo)<=35?5:10,ticks=[];for(let v=Math.ceil(lo/step)*step;v<=hi;v+=step)ticks.push(v);
    const axis=ticks.map(v=>`<line x1="${pos(v)}" x2="${pos(v)}" y1="214" y2="222" stroke="#17324d"/><text x="${pos(v)}" y="242" text-anchor="middle" font-size="11" fill="#536779">${v}</text>`).join('');
    return `<svg class="u42-stat-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="Dynamic modified box plot"><rect x="4" y="4" width="712" height="277" rx="22" fill="#fffdf9" stroke="#d8dee5"/><text x="24" y="34" fill="#17324d" font-size="18" font-weight="850">Modified box plot · fences are thresholds, not whisker endpoints</text><line x1="${pos(s.lower)}" x2="${pos(s.lower)}" y1="70" y2="202" stroke="#c99322" stroke-width="2" stroke-dasharray="6 5"/><line x1="${pos(s.upper)}" x2="${pos(s.upper)}" y1="70" y2="202" stroke="#c99322" stroke-width="2" stroke-dasharray="6 5"/><text x="${pos(s.lower)}" y="61" text-anchor="middle" font-size="11" fill="#9a6916">LF ${fmt(s.lower,1)}</text><text x="${pos(s.upper)}" y="61" text-anchor="middle" font-size="11" fill="#9a6916">UF ${fmt(s.upper,1)}</text><line x1="${pos(low)}" x2="${pos(high)}" y1="${y}" y2="${y}" stroke="#17324d" stroke-width="4"/><line x1="${pos(low)}" x2="${pos(low)}" y1="${y-17}" y2="${y+17}" stroke="#17324d" stroke-width="3"/><line x1="${pos(high)}" x2="${pos(high)}" y1="${y-17}" y2="${y+17}" stroke="#17324d" stroke-width="3"/><rect x="${pos(s.q1)}" y="${y-28}" width="${Math.max(2,pos(s.q3)-pos(s.q1))}" height="56" fill="#d9efec" stroke="#137f78" stroke-width="3"/><line x1="${pos(s.med)}" x2="${pos(s.med)}" y1="${y-28}" y2="${y+28}" stroke="#78183f" stroke-width="4"/>${outDots}<line x1="${left}" x2="${right}" y1="214" y2="214" stroke="#17324d" stroke-width="2"/>${axis}</svg>`;
  }

  function initOutlierLab(root){
    const input=root.querySelector('[data-u42-extreme]');if(!input)return;
    const value=root.querySelector('[data-u42-extreme-value]'),mean=root.querySelector('[data-u42-live-mean]'),med=root.querySelector('[data-u42-live-median]'),iqr=root.querySelector('[data-u42-live-iqr]'),sigma=root.querySelector('[data-u42-live-sigma]'),plot=root.querySelector('[data-u42-live-plot]');
    const render=()=>{const extreme=Number(input.value),data=[10,12,13,14,15,16,extreme],s=stats(data);value.textContent=fmt(extreme,0);mean.textContent=fmt(s.mean);med.textContent=fmt(s.med);iqr.textContent=fmt(s.iqr);sigma.textContent=fmt(s.sigma);plot.innerHTML=dotPlot(data,{title:`Moving one value · upper fence ${fmt(s.upper,1)} · ${s.outliers.length?`${extreme} is an outlier`:'no outlier'}`,min:8,max:82});};
    input.addEventListener('input',render);render();
  }

  function initFrequencyLab(root){
    const values=[1,2,3,4,5],defaults=[2,3,4,3,2],inputs=[...root.querySelectorAll('[data-u42-freq-index]')];
    const nNode=root.querySelector('[data-u42-f-n]'),mean=root.querySelector('[data-u42-f-mean]'),med=root.querySelector('[data-u42-f-med]'),sigma=root.querySelector('[data-u42-f-sigma]'),plot=root.querySelector('[data-u42-frequency-plot]');
    const render=()=>{
      const freqs=inputs.map(input=>Math.max(0,Math.round(Number(input.value))));
      freqs.forEach((f,i)=>{const node=root.querySelector(`[data-u42-freq-value="${i}"]`);if(node)node.textContent=String(f);});
      const data=[];values.forEach((v,i)=>{for(let j=0;j<freqs[i];j++)data.push(v);});
      nNode.textContent=String(data.length);
      if(data.length){const s=stats(data);mean.textContent=fmt(s.mean);med.textContent=fmt(s.med);sigma.textContent=fmt(s.sigma);plot.innerHTML=frequencyPlot(values,freqs);}
      else{mean.textContent=med.textContent=sigma.textContent='—';plot.innerHTML='<div class="u42-ti84-error">Set at least one positive frequency.</div>';}
    };
    inputs.forEach(input=>input.addEventListener('input',render));
    root.querySelector('[data-u42-frequency-reset]')?.addEventListener('click',()=>{inputs.forEach((input,i)=>input.value=String(defaults[i]));render();});
    render();
  }

  function initFenceLab(root){
    const input=root.querySelector('[data-u42-max]');if(!input)return;
    const value=root.querySelector('[data-u42-max-value]'),q1=root.querySelector('[data-u42-f-q1]'),q3=root.querySelector('[data-u42-f-q3]'),upper=root.querySelector('[data-u42-f-upper]'),status=root.querySelector('[data-u42-f-status]'),plot=root.querySelector('[data-u42-fence-plot]');
    const render=()=>{const max=Number(input.value),data=[4,6,7,8,9,10,12,13,max],s=stats(data),isOut=max>s.upper;value.textContent=fmt(max,0);q1.textContent=fmt(s.q1);q3.textContent=fmt(s.q3);upper.textContent=fmt(s.upper);status.textContent=isOut?'outlier':'not an outlier';status.classList.toggle('u42-status-outlier',isOut);status.classList.toggle('u42-status-ok',!isOut);plot.innerHTML=modifiedBoxPlot(data);};
    input.addEventListener('input',render);render();
  }

  function scan(root=document){
    root.querySelectorAll?.('[data-u42-outlier-lab],[data-u42-frequency-lab],[data-u42-fence-lab]').forEach(node=>{
      if(initialized.has(node))return;initialized.add(node);
      if(node.matches('[data-u42-outlier-lab]'))initOutlierLab(node);
      else if(node.matches('[data-u42-frequency-lab]'))initFrequencyLab(node);
      else initFenceLab(node);
    });
  }
  function init(){
    document.body.classList.add('u42-definitive');scan();
    const app=document.getElementById('app');if(app)new MutationObserver(()=>scan(app)).observe(app,{childList:true,subtree:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
  window.ECHS_IB_AI_4_2_INTERACTIONS={release:'2.0.0',scan,stats,quartiles};
})();
