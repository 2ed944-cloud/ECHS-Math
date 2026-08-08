(function(){
  'use strict';
  const data=window.LESSON_DATA;
  if(!data||String(data.lesson?.number)!=='4.15')return;

  const $=(selector,root=document)=>root.querySelector(selector);
  const $$=(selector,root=document)=>Array.from(root.querySelectorAll(selector));
  const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
  const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const storagePrefix='echs:ib-ai:u4:4.15:v2:';
  const memory=new Map();
  const storage={
    get(key){try{return localStorage.getItem(storagePrefix+key)}catch{return memory.get(key)??null}},
    set(key,value){try{localStorage.setItem(storagePrefix+key,String(value))}catch{memory.set(key,String(value))}}
  };

  /* Lanczos log-gamma and regularized gamma functions.  The chi-square p-value is
     Q(df/2, x/2), the upper-tail probability. */
  function logGamma(z){
    const coefficients=[
      0.99999999999980993,
      676.5203681218851,
      -1259.1392167224028,
      771.32342877765313,
      -176.61502916214059,
      12.507343278686905,
      -0.13857109526572012,
      9.9843695780195716e-6,
      1.5056327351493116e-7
    ];
    if(z<0.5)return Math.log(Math.PI)-Math.log(Math.sin(Math.PI*z))-logGamma(1-z);
    z-=1;
    let series=coefficients[0];
    for(let i=1;i<coefficients.length;i++)series+=coefficients[i]/(z+i);
    const t=z+7.5;
    return 0.5*Math.log(2*Math.PI)+(z+0.5)*Math.log(t)-t+Math.log(series);
  }
  function regularizedGammaP(a,x){
    if(!(a>0)||x<0||!Number.isFinite(a)||!Number.isFinite(x))return NaN;
    if(x===0)return 0;
    if(x>=a+1)return 1-regularizedGammaQ(a,x);
    let sum=1/a;
    let term=sum;
    let ap=a;
    for(let n=1;n<=240;n++){
      ap+=1;
      term*=x/ap;
      sum+=term;
      if(Math.abs(term)<Math.abs(sum)*1e-15)break;
    }
    return clamp(sum*Math.exp(-x+a*Math.log(x)-logGamma(a)),0,1);
  }
  function regularizedGammaQ(a,x){
    if(!(a>0)||x<0||!Number.isFinite(a)||!Number.isFinite(x))return NaN;
    if(x===0)return 1;
    if(x<a+1)return clamp(1-regularizedGammaP(a,x),0,1);
    const tiny=1e-300;
    let b=x+1-a;
    let c=1/tiny;
    let d=1/Math.max(Math.abs(b),tiny);
    if(b<0)d=-d;
    let h=d;
    for(let i=1;i<=240;i++){
      const an=-i*(i-a);
      b+=2;
      d=an*d+b;
      if(Math.abs(d)<tiny)d=tiny;
      c=b+an/c;
      if(Math.abs(c)<tiny)c=tiny;
      d=1/d;
      const delta=d*c;
      h*=delta;
      if(Math.abs(delta-1)<1e-14)break;
    }
    return clamp(Math.exp(-x+a*Math.log(x)-logGamma(a))*h,0,1);
  }
  function chiSquareSF(statistic,df){
    if(!(statistic>=0)||!(df>0))return NaN;
    return regularizedGammaQ(df/2,statistic/2);
  }
  function chiSquarePdf(x,df){
    if(x<=0||df<=0)return 0;
    const a=df/2;
    return Math.exp((a-1)*Math.log(x)-x/2-a*Math.log(2)-logGamma(a));
  }
  function format(value,digits=4){
    if(!Number.isFinite(value))return '—';
    if(value!==0&&Math.abs(value)<1e-4)return value.toExponential(3);
    return Number(value.toFixed(digits)).toLocaleString('en-US',{maximumFractionDigits:digits});
  }

  function bindRouteJumps(root=document){
    $$('[data-go]',root).forEach(button=>{
      if(button.dataset.gofBound)return;
      button.dataset.gofBound='1';
      button.addEventListener('click',event=>{
        const target=button.dataset.go;
        const route=$(`.route-btn[data-route="${CSS.escape(target)}"]`);
        if(route){event.preventDefault();route.click();}
      });
    });
  }
  function bindStartButtons(root=document){
    $$('[data-gof-start]',root).forEach(button=>{
      if(button.dataset.gofBound)return;
      button.dataset.gofBound='1';
      button.addEventListener('click',()=>$('#next-slide')?.click());
    });
    const headerStart=$('#start-lesson');
    if(headerStart&&!headerStart.dataset.gofBound){
      headerStart.dataset.gofBound='1';
      headerStart.addEventListener('click',()=>{
        const learn=$('.route-btn[data-route="learn"]');
        if(learn&&!learn.classList.contains('active'))learn.click();
        else $('#next-slide')?.click();
      });
    }
  }
  function bindHeaderControls(){
    const fullscreen=$('#toggle-fullscreen');
    if(fullscreen&&!fullscreen.dataset.gofBound){
      fullscreen.dataset.gofBound='1';
      fullscreen.addEventListener('click',async()=>{
        try{
          if(!document.fullscreenElement)await document.documentElement.requestFullscreen();
          else await document.exitFullscreen();
        }catch(error){console.warn('Fullscreen unavailable',error)}
      });
      document.addEventListener('fullscreenchange',()=>{
        fullscreen.classList.toggle('active',Boolean(document.fullscreenElement));
        fullscreen.setAttribute('aria-pressed',document.fullscreenElement?'true':'false');
      });
    }
    const menu=$('#toggle-route-menu');
    const routebar=$('#lesson-route-menu');
    if(menu&&routebar&&!menu.dataset.gofBound){
      menu.dataset.gofBound='1';
      menu.addEventListener('click',()=>{
        const open=routebar.classList.toggle('mobile-open');
        menu.setAttribute('aria-expanded',open?'true':'false');
      });
      $$('.route-btn,.menu-home',routebar).forEach(button=>button.addEventListener('click',()=>{
        routebar.classList.remove('mobile-open');
        menu.setAttribute('aria-expanded','false');
      }));
    }
  }
  function bindCompletion(root=document){
    $$('[data-mark-complete]',root).forEach(button=>{
      if(button.dataset.gofV2Bound)return;
      button.dataset.gofV2Bound='1';
      button.addEventListener('click',()=>{
        storage.set('complete','1');
        button.textContent='Lesson marked complete';
        button.classList.add('completed');
      });
    });
  }

  function renderClassifier(root){
    const scenarios=[
      {label:'A die is rolled 240 times; compare six counts with probabilities 1/6 each.',answer:'GOF',why:'One categorical variable is compared with one specified probability distribution.'},
      {label:'Survey students by year group and preferred learning resource.',answer:'Independence',why:'Two categorical variables are measured on each student.'},
      {label:'Compare the mean commute time of two independent groups.',answer:'Other',why:'The response is quantitative, so a chi-square categorical test is not the appropriate method.'},
      {label:'Compare observed numbers of 0, 1, 2, 3, 4 successes with B(4, 0.35).',answer:'GOF',why:'A single discrete frequency distribution is checked against a specified binomial model.'}
    ];
    root.innerHTML=`<div class="gof-lab-controls"><label>Scenario<select data-scenario>${scenarios.map((item,index)=>`<option value="${index}">${esc(item.label)}</option>`).join('')}</select></label></div><div class="gof-method-buttons" role="group" aria-label="Select the statistical method"><button type="button" data-method="GOF">Goodness of fit</button><button type="button" data-method="Independence">Independence</button><button type="button" data-method="Other">Another method</button></div><div class="gof-lab-result" data-result><b>Commit to a method.</b><span>Use the number and type of variables—not keywords alone.</span></div>`;
    let chosen='';
    const update=()=>{
      const scenario=scenarios[Number($('[data-scenario]',root).value)];
      $$('[data-method]',root).forEach(button=>button.classList.toggle('active',button.dataset.method===chosen));
      const output=$('[data-result]',root);
      if(!chosen){output.className='gof-lab-result';output.innerHTML='<b>Commit to a method.</b><span>Use the number and type of variables—not keywords alone.</span>';return;}
      const correct=chosen===scenario.answer;
      output.className=`gof-lab-result ${correct?'correct':'incorrect'}`;
      output.innerHTML=`<b>${correct?'Correct selection':'Reconsider the structure'}</b><span>${esc(scenario.why)}</span>`;
    };
    $('[data-scenario]',root).addEventListener('change',()=>{chosen='';update()});
    $$('[data-method]',root).forEach(button=>button.addEventListener('click',()=>{chosen=button.dataset.method;update()}));
    update();
  }

  function renderBuilder(root){
    root.innerHTML=`<div class="gof-lab-controls four"><label>Sample size n<input type="number" min="20" max="5000" step="1" value="120" data-n></label><label>p₁<input type="number" min="0" max="1" step="0.01" value="0.20" data-p="0"></label><label>p₂<input type="number" min="0" max="1" step="0.01" value="0.30" data-p="1"></label><label>p₃<input type="number" min="0" max="1" step="0.01" value="0.35" data-p="2"></label><label>p₄<input type="number" min="0" max="1" step="0.01" value="0.15" data-p="3"></label></div><div class="gof-lab-result" data-result></div><div data-chart></div>`;
    const update=()=>{
      const n=Number($('[data-n]',root).value);
      const probabilities=$$('[data-p]',root).map(input=>Number(input.value));
      const total=probabilities.reduce((sum,value)=>sum+value,0);
      const valid=Number.isFinite(n)&&n>0&&probabilities.every(value=>Number.isFinite(value)&&value>=0&&value<=1)&&Math.abs(total-1)<1e-9;
      const output=$('[data-result]',root);
      const chart=$('[data-chart]',root);
      if(!valid){output.className='gof-lab-result incorrect';output.innerHTML=`<b>Invalid probability model</b><span>Current probability sum = ${format(total,4)}. It must equal 1 before expected counts are calculated.</span>`;chart.innerHTML='';return;}
      const expected=probabilities.map(value=>n*value);
      const minimum=Math.min(...expected);
      const condition=minimum>=5;
      output.className=`gof-lab-result ${condition?'correct':'warning'}`;
      output.innerHTML=`<b>Expected vector: (${expected.map(value=>format(value,3)).join(', ')})</b><span>ΣE = ${format(expected.reduce((sum,value)=>sum+value,0),3)} = n · minimum expected = ${format(minimum,3)} · ${condition?'condition satisfied':'merge meaningful categories before testing'}</span>`;
      const maximum=Math.max(...expected,1);
      chart.innerHTML=`<div class="gof-mini-bars" aria-label="Expected-frequency bars">${expected.map((value,index)=>`<div><span style="height:${Math.max(5,value/maximum*100)}%"></span><b>E${index+1}</b><small>${format(value,2)}</small></div>`).join('')}</div>`;
    };
    $$('input',root).forEach(input=>input.addEventListener('input',update));
    update();
  }

  function renderContributions(root){
    const expected=[20,20,20,20];
    root.innerHTML=`<div class="gof-lab-controls"><label>Shift from category 2 to category 1<input type="range" min="-16" max="16" step="1" value="0" data-shift><output data-shift-value>0</output></label></div><div class="gof-lab-result" data-result></div><div class="gof-contribution-table" data-table></div><div data-chart></div>`;
    const update=()=>{
      const shift=Number($('[data-shift]',root).value);
      const observed=[20+shift,20-shift,24,16];
      $('[data-shift-value]',root).value=String(shift);
      const residuals=observed.map((value,index)=>value-expected[index]);
      const contributions=residuals.map((value,index)=>value*value/expected[index]);
      const statistic=contributions.reduce((sum,value)=>sum+value,0);
      const p=chiSquareSF(statistic,3);
      const largest=contributions.indexOf(Math.max(...contributions));
      $('[data-result]',root).className='gof-lab-result';
      $('[data-result]',root).innerHTML=`<b>χ² = ${format(statistic,4)}; df = 3; p = ${format(p,4)}</b><span>Largest current contribution: category ${largest+1}. Moving counts in either direction increases squared discrepancy.</span>`;
      $('[data-table]',root).innerHTML=`<table class="gof-table"><thead><tr><th>Category</th>${observed.map((_,index)=>`<th>${index+1}</th>`).join('')}</tr></thead><tbody><tr><td>Observed</td>${observed.map(value=>`<td>${value}</td>`).join('')}</tr><tr><td>Expected</td>${expected.map(value=>`<td>${value}</td>`).join('')}</tr><tr><td>O−E</td>${residuals.map(value=>`<td>${value}</td>`).join('')}</tr><tr><td>Contribution</td>${contributions.map(value=>`<td>${format(value,3)}</td>`).join('')}</tr></tbody></table>`;
      const maxContribution=Math.max(...contributions,0.01);
      $('[data-chart]',root).innerHTML=`<div class="gof-mini-bars contributions" aria-label="Chi-square contributions">${contributions.map((value,index)=>`<div><span style="height:${Math.max(3,value/maxContribution*100)}%"></span><b>C${index+1}</b><small>${format(value,2)}</small></div>`).join('')}</div>`;
    };
    $('[data-shift]',root).addEventListener('input',update);
    update();
  }

  function tailSvg(statistic,df){
    const width=660,height=250,left=54,right=22,top=22,bottom=42;
    const plotW=width-left-right,plotH=height-top-bottom;
    const xMax=Math.max(18,df+7*Math.sqrt(2*df),statistic*1.25+2);
    const samples=180;
    const points=[];
    let yMax=0;
    for(let i=0;i<=samples;i++){
      const x=xMax*i/samples;
      const y=chiSquarePdf(Math.max(x,1e-8),df);
      yMax=Math.max(yMax,y);
      points.push([x,y]);
    }
    yMax=Math.max(yMax,0.01)*1.12;
    const sx=x=>left+x/xMax*plotW;
    const sy=y=>top+plotH-y/yMax*plotH;
    const curve=points.map(([x,y],index)=>`${index?'L':'M'}${sx(x).toFixed(2)},${sy(y).toFixed(2)}`).join(' ');
    const tailPoints=points.filter(([x])=>x>=statistic);
    if(!tailPoints.length)tailPoints.push([statistic,chiSquarePdf(statistic,df)],[xMax,chiSquarePdf(xMax,df)]);
    const tailPath=`M${sx(statistic).toFixed(2)},${sy(0).toFixed(2)} L${sx(statistic).toFixed(2)},${sy(chiSquarePdf(statistic,df)).toFixed(2)} ${tailPoints.map(([x,y])=>`L${sx(x).toFixed(2)},${sy(y).toFixed(2)}`).join(' ')} L${sx(xMax).toFixed(2)},${sy(0).toFixed(2)} Z`;
    const ticks=6;
    return `<svg class="gof-tail-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="Chi-square density with upper tail shaded"><rect x="0" y="0" width="${width}" height="${height}" rx="18" fill="#fff"/><path d="${tailPath}" fill="#d4a72c" opacity=".35"/><path d="${curve}" fill="none" stroke="#17324d" stroke-width="3"/><line x1="${left}" y1="${top+plotH}" x2="${width-right}" y2="${top+plotH}" stroke="#17324d" stroke-width="2"/><line x1="${sx(statistic)}" y1="${top}" x2="${sx(statistic)}" y2="${top+plotH}" stroke="#78183f" stroke-width="2" stroke-dasharray="7 6"/>${Array.from({length:ticks+1},(_,i)=>{const value=xMax*i/ticks;return `<line x1="${sx(value)}" y1="${top+plotH}" x2="${sx(value)}" y2="${top+plotH+6}" stroke="#17324d"/><text x="${sx(value)}" y="${height-15}" text-anchor="middle" font-size="12" fill="#5b6875">${format(value,1)}</text>`}).join('')}<text x="${sx(statistic)+7}" y="${top+17}" font-size="13" font-weight="800" fill="#78183f">χ²=${format(statistic,2)}</text><text x="${width-right-6}" y="${top+18}" text-anchor="end" font-size="13" font-weight="800" fill="#9a7316">upper-tail p-value</text></svg>`;
  }

  function renderTail(root){
    root.innerHTML=`<div class="gof-lab-controls three"><label>Degrees of freedom<input type="range" min="1" max="18" step="1" value="5" data-df><output data-df-out>5</output></label><label>χ² statistic<input type="range" min="0" max="30" step="0.1" value="11.1" data-stat><output data-stat-out>11.1</output></label><label>Significance α<input type="range" min="1" max="10" step="1" value="5" data-alpha><output data-alpha-out>0.05</output></label></div><div class="gof-lab-result" data-result></div><div data-chart></div>`;
    const update=()=>{
      const df=Number($('[data-df]',root).value);
      const statistic=Number($('[data-stat]',root).value);
      const alpha=Number($('[data-alpha]',root).value)/100;
      const p=chiSquareSF(statistic,df);
      const reject=p<=alpha;
      $('[data-df-out]',root).value=String(df);
      $('[data-stat-out]',root).value=statistic.toFixed(1);
      $('[data-alpha-out]',root).value=alpha.toFixed(2);
      $('[data-result]',root).className=`gof-lab-result ${reject?'warning':'correct'}`;
      $('[data-result]',root).innerHTML=`<b>p = ${format(p,5)}; ${reject?'reject H₀':'fail to reject H₀'}</b><span>The p-value is P(Χ² ≥ ${format(statistic,2)} | H₀, df=${df}). It is a right-tail area, not the probability that H₀ is true.</span>`;
      $('[data-chart]',root).innerHTML=tailSvg(statistic,df);
    };
    $$('input',root).forEach(input=>input.addEventListener('input',update));
    update();
  }

  function initializeLabs(root=document){
    $$('[data-gof-lab]',root).forEach(card=>{
      if(card.dataset.ready)return;
      const runtime=$('[data-gof-runtime]',card);
      if(!runtime)return;
      card.dataset.ready='1';
      const type=card.dataset.gofLab;
      if(type==='classifier')renderClassifier(runtime);
      else if(type==='builder')renderBuilder(runtime);
      else if(type==='contributions')renderContributions(runtime);
      else if(type==='tail')renderTail(runtime);
    });
  }

  function initialize(root=document){
    bindStartButtons(root);
    bindRouteJumps(root);
    bindCompletion(root);
    initializeLabs(root);
  }

  function init(){
    bindHeaderControls();
    initialize(document);
    const app=$('#app');
    if(app){
      const observer=new MutationObserver(()=>initialize(app));
      observer.observe(app,{childList:true,subtree:true});
    }
    document.addEventListener('keydown',event=>{
      if(event.key==='Home'&&!/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName||'')){$('#prev-slide')?.click()}
    });
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
  window.GOF415Math=Object.freeze({logGamma,regularizedGammaP,regularizedGammaQ,chiSquareSF,chiSquarePdf,release:'2.0.0'});
})();
