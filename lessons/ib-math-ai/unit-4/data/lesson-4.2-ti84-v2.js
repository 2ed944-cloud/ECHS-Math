(function(){
  'use strict';
  if(String(window.LESSON_DATA?.lesson?.number)!=='4.2')return;

  const lessonApi=window.ECHS_IB_AI_4_2_DEFINITIVE||{};
  const $=(selector,root=document)=>root.querySelector(selector);
  const $$=(selector,root=document)=>Array.from(root.querySelectorAll(selector));
  const ordered=values=>values.slice().map(Number).sort((a,b)=>a-b);
  const median=values=>{const x=ordered(values),n=x.length,m=Math.floor(n/2);return n%2?x[m]:(x[m-1]+x[m])/2;};
  const quartiles=lessonApi.quartiles||function(values){const x=ordered(values),n=x.length,m=Math.floor(n/2);return {min:x[0],q1:median(x.slice(0,m)),med:median(x),q3:median(x.slice(n%2?m+1:m)),max:x[n-1]};};
  const stats=lessonApi.stats||function(values){
    const x=values.map(Number),n=x.length,sum=x.reduce((a,b)=>a+b,0),sum2=x.reduce((a,b)=>a+b*b,0),mean=sum/n,ss=x.reduce((a,b)=>a+(b-mean)**2,0),five=quartiles(x),iqr=five.q3-five.q1,lower=five.q1-1.5*iqr,upper=five.q3+1.5*iqr;
    return {...five,n,sum,sum2,mean,sigma:Math.sqrt(ss/n),sx:n>1?Math.sqrt(ss/(n-1)):NaN,iqr,lower,upper,outliers:ordered(x.filter(v=>v<lower||v>upper))};
  };
  const fmt=(value,d=6)=>{
    const n=Number(value);if(!Number.isFinite(n))return '—';
    const a=Math.abs(n);if((a>0&&a<1e-5)||a>=1e8)return n.toExponential(5);
    return Number(n.toFixed(d)).toString();
  };
  const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));

  const workflows={
    raw:{
      title:'Raw data · 1‑Var Stats',short:'Raw data',tag:'STAT · EDIT · CALC',
      problem:'The complete population of response times is 12, 15, 15, 18, 20, 20, 20, 24 minutes. Find the mean, population standard deviation, and five-number summary.',
      values:[12,15,15,18,20,20,20,24],freqs:[],status:'population',
      steps:['Press STAT and choose 1:Edit.','Enter every raw observation in L₁. Leave L₂ unused.','Press STAT, move to CALC, and choose 1:1‑Var Stats.','Set List=L₁ and leave FreqList blank.','Choose Calculate; verify n=8 before reading the other output.','Report x̄ and σx because the eight values form the complete population.'],
      interpretation:s=>'The mean response time is '+fmt(s.mean,3)+' minutes and the population standard deviation is approximately '+fmt(s.sigma,3)+' minutes.'
    },
    frequency:{
      title:'Values with frequencies',short:'Frequency list',tag:'L₁ VALUES · L₂ FREQUENCIES',
      problem:'Ratings 10, 15, 20, 25, 30 have frequencies 2, 4, 7, 5, 2. Find n, mean, median, IQR, and population standard deviation.',
      values:[10,15,20,25,30],freqs:[2,4,7,5,2],status:'population',
      steps:['Press STAT and choose 1:Edit.','Enter the distinct values in L₁ and their frequencies in L₂.','Before calculating, check that each frequency is a non-negative integer.','Press STAT → CALC → 1:1‑Var Stats.','Set List=L₁ and FreqList=L₂.','Choose Calculate and verify n=Σf=20.','Read x̄, σx, Med, Q₁, and Q₃; calculate IQR=Q₃−Q₁.'],
      interpretation:s=>'The average rating is '+fmt(s.mean,3)+', and ratings vary around it on a population-standard-deviation scale of about '+fmt(s.sigma,3)+' rating units.'
    },
    symbols:{
      title:'Output audit · Sx or σx?',short:'Output audit',tag:'SYMBOL DECISION · CONTEXT',
      problem:'Use the same numerical data twice: once as a complete population and once as a sample from a wider population. Identify which standard-deviation line must be reported.',
      values:[12,15,15,18,20,20,20,24],freqs:[],status:'sample',
      steps:['Run 1‑Var Stats correctly and verify n.','Read both Sx and σx from the same output.','Ask what the listed data represent—not which number is smaller.','For a complete population report σx.','For a sample used to describe a wider population report Sx.','Include the variable and units in the final sentence.'],
      interpretation:(s,status)=>status==='sample'?'For this sample, the mean is '+fmt(s.mean,3)+' minutes and the sample standard deviation is approximately '+fmt(s.sx,3)+' minutes.':'For this complete population, the mean is '+fmt(s.mean,3)+' minutes and the population standard deviation is approximately '+fmt(s.sigma,3)+' minutes.'
    },
    box:{
      title:'Modified box plot and fences',short:'Modified box plot',tag:'STAT PLOT · ZOOMSTAT',
      problem:'For 4, 6, 7, 8, 9, 10, 12, 13, 30, identify the outlier and the modified-box-plot whisker endpoints.',
      values:[4,6,7,8,9,10,12,13,30],freqs:[],status:'population',
      steps:['Enter the raw data in L₁.','Run 1‑Var Stats and record Q₁, Med, and Q₃.','Calculate IQR and the lower and upper fences.','Press 2nd then Y= to open STAT PLOT.','Turn Plot1 on and select the modified box-plot icon.','Set Xlist=L₁ and leave Freq blank.','Press ZOOM and choose 9:ZoomStat, or use GRAPH in this trainer.','Whiskers end at observed non-outliers; fences are not drawn as whisker endpoints.'],
      interpretation:s=>s.outliers.length?`${s.outliers.join(', ')} ${s.outliers.length===1?'is':'are'} flagged as ${s.outliers.length===1?'an outlier':'outliers'}. The whiskers end at the most extreme non-outlying observations.`:'No observation lies strictly beyond either 1.5-IQR fence.'
    }
  };

  let panel=null,backdrop=null,routeButton=null,headerButton=null,previousFocus=null;
  let active='raw',stepIndex=0,screenMode='home',second=false,computed=null,error='',dataStatus='population';

  function expand(values,freqs){
    if(!freqs.length)return values.slice();
    const out=[];values.forEach((v,i)=>{for(let j=0;j<freqs[i];j++)out.push(v);});return out;
  }
  function parseInputs(){
    const rows=$$('.u42-ti84-list-table tbody tr',panel),values=[],freqs=[];
    let frequencyUsed=active==='frequency';
    rows.forEach(row=>{
      const rawValue=$('[data-list-value]',row)?.value.trim()||'',rawFreq=$('[data-list-freq]',row)?.value.trim()||'';
      if(rawValue==='')return;
      const value=Number(rawValue);if(!Number.isFinite(value))throw new Error('Every non-blank L₁ entry must be a finite number.');
      values.push(value);
      if(frequencyUsed){
        if(rawFreq==='')throw new Error('Each used L₁ row needs a frequency in L₂.');
        const freq=Number(rawFreq);if(!Number.isInteger(freq)||freq<0)throw new Error('Frequencies must be non-negative integers.');freqs.push(freq);
      }
    });
    if(!values.length)throw new Error('Enter at least one observation in L₁.');
    if(frequencyUsed&&freqs.every(f=>f===0))throw new Error('At least one frequency must be positive.');
    const expanded=expand(values,freqs);if(!expanded.length)throw new Error('The frequency list produces no observations.');
    if(expanded.length>5000)throw new Error('This focused simulator limits expanded frequency data to 5000 observations.');
    return {values,freqs,expanded};
  }
  function compute(){
    try{
      const lists=parseInputs();computed={...lists,summary:{...stats(lists.expanded),sum2:lists.expanded.reduce((total,value)=>total+value*value,0)}};error='';screenMode='result1';
    }catch(err){computed=null;error=err.message;screenMode='error';}
    renderDynamic();
  }

  function boxPlotSvg(s,data){
    const x=ordered(data),out=s.outliers,non=x.filter(v=>!out.includes(v)),low=non[0],high=non[non.length-1];
    const lo=Math.min(...x,s.lower)-2,hi=Math.max(...x,s.upper)+2,left=28,right=592,y=92,pos=v=>left+(v-lo)/(hi-lo)*(right-left);
    const outDots=out.map(v=>`<circle cx="${pos(v)}" cy="${y}" r="6" fill="#a93446" stroke="#fff" stroke-width="2"/>`).join('');
    return `<svg class="u42-ti84-boxplot" viewBox="0 0 620 175" role="img" aria-label="Modified box plot"><rect x="1" y="1" width="618" height="173" rx="15" fill="#f8fbf7" stroke="#7b9474"/><line x1="${pos(low)}" x2="${pos(high)}" y1="${y}" y2="${y}" stroke="#172b22" stroke-width="3"/><line x1="${pos(low)}" x2="${pos(low)}" y1="${y-12}" y2="${y+12}" stroke="#172b22" stroke-width="3"/><line x1="${pos(high)}" x2="${pos(high)}" y1="${y-12}" y2="${y+12}" stroke="#172b22" stroke-width="3"/><rect x="${pos(s.q1)}" y="${y-23}" width="${Math.max(2,pos(s.q3)-pos(s.q1))}" height="46" fill="#b8d8b0" stroke="#172b22" stroke-width="3"/><line x1="${pos(s.med)}" x2="${pos(s.med)}" y1="${y-23}" y2="${y+23}" stroke="#172b22" stroke-width="4"/>${outDots}<text x="310" y="153" text-anchor="middle" font-family="monospace" font-size="13" fill="#172b22">whiskers: ${fmt(low,2)} to ${fmt(high,2)} · outliers: ${out.length?out.join(', '):'none'}</text></svg>`;
  }

  function screenMarkup(){
    if(screenMode==='error')return `<div class="u42-ti84-screen-head"><span>ERR: DATA</span><span>QUIT</span></div><div>${esc(error)}</div>`;
    if(screenMode==='stat')return `<div class="u42-ti84-screen-head"><span>STAT</span><span>EDIT CALC TESTS</span></div><div>1:Edit...</div><div>2:SortA(</div><div>3:SortD(</div><div>4:ClrList</div><div class="u42-ti84-screen-grid" style="margin-top:14px"><span>CALC</span><span>1:1-Var Stats</span></div>`;
    if(screenMode==='plot'&&computed){return `<div class="u42-ti84-screen-head"><span>PLOT1 ON</span><span>MODBOX</span></div>${boxPlotSvg(computed.summary,computed.expanded)}`;}
    if((screenMode==='result1'||screenMode==='result2')&&computed){
      const s=computed.summary;
      if(screenMode==='result2')return `<div class="u42-ti84-screen-head"><span>1-Var Stats</span><span>▼</span></div><div class="u42-ti84-screen-grid"><span>minX=</span><span>${fmt(s.min)}</span><span>Q₁=</span><span>${fmt(s.q1)}</span><span>Med=</span><span>${fmt(s.med)}</span><span>Q₃=</span><span>${fmt(s.q3)}</span><span>maxX=</span><span>${fmt(s.max)}</span></div>`;
      return `<div class="u42-ti84-screen-head"><span>1-Var Stats</span><span>▼</span></div><div class="u42-ti84-screen-grid"><span>x̄=</span><span>${fmt(s.mean)}</span><span>Σx=</span><span>${fmt(s.sum)}</span><span>Σx²=</span><span>${fmt(s.sum2)}</span><span>Sx=</span><span>${fmt(s.sx)}</span><span>σx=</span><span>${fmt(s.sigma)}</span><span>n=</span><span>${s.n}</span></div>`;
    }
    if(screenMode==='plotmenu')return `<div class="u42-ti84-screen-head"><span>STAT PLOTS</span><span>1:</span></div><div>Plot1: On</div><div>Type: modified box plot</div><div>Xlist: L₁</div><div>Freq: ${active==='frequency'?'L₂':'1'}</div><div>Mark: □</div>`;
    return `<div class="u42-ti84-screen-head"><span>NORMAL FLOAT AUTO</span><span>${second?'2nd':''}</span></div><div style="margin-top:46px">ECHS TI‑84 Statistics</div><div>Lesson 4.2 focused trainer</div><div style="margin-top:18px">Press STAT or Calculate.</div>`;
  }

  function listRows(){
    const workflow=workflows[active],maxRows=Math.max(10,workflow.values.length+2);
    return Array.from({length:maxRows},(_,i)=>`<tr><td>${i+1}</td><td><input inputmode="decimal" aria-label="L1 row ${i+1}" data-list-value value="${workflow.values[i]??''}"></td><td><input inputmode="numeric" aria-label="L2 row ${i+1}" data-list-freq value="${workflow.freqs[i]??''}" ${active==='frequency'?'':'disabled'}></td></tr>`).join('');
  }
  function keypad(){
    const keys=[
      ['2nd','gold'],['MODE','dark'],['DEL','dark'],['ALPHA','green'],['STAT','blue'],
      ['MATH','dark'],['APPS','dark'],['PRGM','dark'],['VARS','dark'],['CLEAR','dark'],
      ['x⁻¹',''],['SIN',''],['COS',''],['TAN',''],['^',''],
      ['x²',''],[',',''],['(',''],[')',''],['÷',''],
      ['LOG',''],['7',''],['8',''],['9',''],['×',''],
      ['LN',''],['4',''],['5',''],['6',''],['−',''],
      ['STO→',''],['1',''],['2',''],['3',''],['+',''],
      ['ON','dark'],['0',''],['.',''],['(−)',''],['ENTER','green']
    ];
    return keys.map(([key,klass])=>`<button type="button" class="u42-ti84-key ${klass}" data-ti-key="${esc(key)}">${esc(key)}</button>`).join('');
  }
  function rightMarkup(){
    const workflow=workflows[active],s=computed?.summary;
    const interpretation=s?workflow.interpretation(s,dataStatus):'Calculate the statistics to generate a contextual response.';
    const frequency=active==='frequency'?'L₂':'blank / 1';
    return `<div class="u42-ti84-card u42-ti84-workflow"><h3>Guided key route</h3><div class="u42-ti84-problem"><b>${esc(workflow.tag)}</b><br>${esc(workflow.problem)}</div><ol>${workflow.steps.map((step,i)=>`<li class="${i===stepIndex?'is-current':''}"><b>${i+1}</b><span>${esc(step)}</span></li>`).join('')}</ol><div class="u42-ti84-list-actions"><button type="button" data-ti-prev-step ${stepIndex===0?'disabled':''}>Previous step</button><button type="button" data-ti-next-step ${stepIndex===workflow.steps.length-1?'disabled':''}>Next step</button></div><div class="u42-ti84-evidence"><div><b>Calculator setup</b><span>List=L₁ · FreqList=${frequency}${s?` · verified n=${s.n}`:''}</span></div><div><b>Symbol decision</b><label><span class="u42-ti84-sr-only">Data status</span><select data-ti-status><option value="population" ${dataStatus==='population'?'selected':''}>Complete population → report σx</option><option value="sample" ${dataStatus==='sample'?'selected':''}>Sample from a wider population → report Sx</option></select></label></div><div><b>IB communication</b><span>${esc(interpretation)}</span></div>${s&&active==='box'?`<div><b>1.5-IQR audit</b><span>IQR=${fmt(s.iqr,3)} · fences ${fmt(s.lower,3)} and ${fmt(s.upper,3)} · ${esc(workflow.interpretation(s,dataStatus))}</span></div>`:''}</div></div>`;
  }

  function panelMarkup(){
    const workflow=workflows[active];
    return `<header><div><span>ECHS · OFFLINE FOCUSED TRAINER</span><h2>TI‑84 Plus CE Statistics Simulator · Lesson 4.2</h2></div><button type="button" class="u42-ti84-close" data-ti-close aria-label="Close TI-84 statistics simulator">×</button></header><div class="u42-ti84-toolbar"><div class="u42-ti84-tabs">${Object.entries(workflows).map(([key,item])=>`<button type="button" class="u42-ti84-tab ${key===active?'is-active':''}" data-ti-workflow="${key}">${esc(item.short)}</button>`).join('')}</div><div><button type="button" class="u42-ti84-mode" data-ti-reset>Reset current example</button></div></div><main class="u42-ti84-main"><div class="u42-ti84-card"><h3>STAT list editor</h3><div class="u42-ti84-problem">${esc(workflow.problem)}</div><table class="u42-ti84-list-table"><thead><tr><th>#</th><th>L₁ · value</th><th>L₂ · frequency</th></tr></thead><tbody>${listRows()}</tbody></table><div class="u42-ti84-list-actions"><button type="button" data-ti-clear>Clear lists</button><button type="button" data-ti-load-example>Load example</button><button type="button" class="u42-ti84-primary" data-ti-calculate>Calculate 1‑Var Stats</button></div><div data-ti-message></div></div><div class="u42-ti84-card"><h3>Focused TI‑84 screen and keys</h3><div class="u42-ti84-calc"><div class="u42-ti84-brand"><span>Texas Instruments workflow trainer</span><b>TI‑84 PLUS CE</b></div><div class="u42-ti84-screen" data-ti-screen aria-live="polite">${screenMarkup()}</div><div class="u42-ti84-keypad">${keypad()}</div></div><div class="u42-ti84-list-actions" style="justify-content:center"><button type="button" data-ti-scroll-output>Toggle output page</button><button type="button" data-ti-show-plot>Show modified box plot</button></div><p style="margin:12px 0 0;color:#607183;font-size:.82rem;line-height:1.5">This local component accurately trains the Lesson 4.2 statistics workflow and output interpretation; it is not a complete emulation of every TI‑84 operating-system function.</p></div>${rightMarkup()}</main>`;
  }

  function build(){
    if(panel?.isConnected)return;
    backdrop=document.createElement('div');backdrop.className='u42-ti84-backdrop';document.body.append(backdrop);
    panel=document.createElement('section');panel.id='u42-ti84-panel';panel.className='u42-ti84-panel';panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-hidden','true');panel.setAttribute('aria-labelledby','u42-ti84-title');document.body.append(panel);
    backdrop.addEventListener('click',close);
  }
  function renderPanel(){
    build();panel.innerHTML=panelMarkup();
    const heading=$('header h2',panel);if(heading)heading.id='u42-ti84-title';
    $('[data-ti-close]',panel)?.addEventListener('click',close);
    $$('[data-ti-workflow]',panel).forEach(button=>button.addEventListener('click',()=>selectWorkflow(button.dataset.tiWorkflow)));
    $('[data-ti-reset]',panel)?.addEventListener('click',()=>selectWorkflow(active));
    $('[data-ti-clear]',panel)?.addEventListener('click',()=>{$$('[data-list-value],[data-list-freq]',panel).forEach(input=>input.value='');computed=null;error='';screenMode='home';renderDynamic();});
    $('[data-ti-load-example]',panel)?.addEventListener('click',()=>selectWorkflow(active));
    $('[data-ti-calculate]',panel)?.addEventListener('click',compute);
    $('[data-ti-scroll-output]',panel)?.addEventListener('click',()=>{if(!computed){compute();return;}screenMode=screenMode==='result2'?'result1':'result2';renderDynamic();});
    $('[data-ti-show-plot]',panel)?.addEventListener('click',()=>{if(!computed){compute();if(!computed)return;}screenMode='plot';renderDynamic();});
    $('[data-ti-prev-step]',panel)?.addEventListener('click',()=>{stepIndex=Math.max(0,stepIndex-1);refreshRight();});
    $('[data-ti-next-step]',panel)?.addEventListener('click',()=>{stepIndex=Math.min(workflows[active].steps.length-1,stepIndex+1);refreshRight();});
    $('[data-ti-status]',panel)?.addEventListener('change',event=>{dataStatus=event.target.value;refreshRight();});
    $$('[data-ti-key]',panel).forEach(button=>button.addEventListener('click',()=>handleKey(button.dataset.tiKey)));
    renderDynamic();
  }
  function refreshRight(){
    const old=$('.u42-ti84-main>.u42-ti84-card:last-child',panel);if(!old)return;
    const template=document.createElement('template');template.innerHTML=rightMarkup().trim();old.replaceWith(template.content.firstElementChild);
    $('[data-ti-prev-step]',panel)?.addEventListener('click',()=>{stepIndex=Math.max(0,stepIndex-1);refreshRight();});
    $('[data-ti-next-step]',panel)?.addEventListener('click',()=>{stepIndex=Math.min(workflows[active].steps.length-1,stepIndex+1);refreshRight();});
    $('[data-ti-status]',panel)?.addEventListener('change',event=>{dataStatus=event.target.value;refreshRight();});
  }
  function renderDynamic(){
    const screen=$('[data-ti-screen]',panel);if(screen)screen.innerHTML=screenMarkup();
    const message=$('[data-ti-message]',panel);
    if(message)message.innerHTML=error?`<div class="u42-ti84-error" style="margin-top:12px">${esc(error)}</div>`:computed?`<div class="u42-ti84-success" style="margin-top:12px">Calculation complete · n=${computed.summary.n}. Verify this before interpreting the output.</div>`:'';
    refreshRight();
  }
  function selectWorkflow(key){
    if(!workflows[key])key='raw';active=key;stepIndex=0;screenMode='home';second=false;computed=null;error='';dataStatus=workflows[key].status;renderPanel();
  }
  function handleKey(key){
    if(key==='2nd'){second=!second;screenMode='home';renderDynamic();return;}
    if(key==='STAT'){screenMode='stat';second=false;renderDynamic();return;}
    if(key==='CLEAR'||key==='ON'){screenMode='home';second=false;error='';renderDynamic();return;}
    if(key==='ENTER'){compute();return;}
    if(key==='MODE'){screenMode='home';renderDynamic();return;}
    if(key==='VARS'){if(!computed)compute();else{screenMode='result1';renderDynamic();}return;}
    if(key==='APPS'||key==='PRGM'){if(!computed)compute();else{screenMode='result2';renderDynamic();}return;}
  }
  function open(key){
    build();if(workflows[key])active=key;previousFocus=document.activeElement;selectWorkflow(active);
    panel.classList.add('is-open');backdrop.classList.add('is-open');panel.setAttribute('aria-hidden','false');document.body.classList.add('u42-ti84-open');setLauncherState(true);$('[data-ti-close]',panel)?.focus();
  }
  function close(){
    if(!panel)return;panel.classList.remove('is-open');backdrop.classList.remove('is-open');panel.setAttribute('aria-hidden','true');document.body.classList.remove('u42-ti84-open');setLauncherState(false);previousFocus?.focus?.();
  }
  function setLauncherState(opened){[routeButton,headerButton].forEach(button=>{if(!button)return;button.classList.toggle('is-active',opened);button.setAttribute('aria-pressed',String(opened));});}
  function focusables(){return panel?$$('button,input,select,[href],[tabindex]:not([tabindex="-1"])',panel).filter(node=>!node.disabled&&!node.hidden&&node.getClientRects().length):[];}
  function installLaunchers(){
    const route=$('.routebar');
    if(route&&!$('.u42-ti84-launch',route)){
      routeButton=document.createElement('button');routeButton.type='button';routeButton.className='route-btn u42-ti84-launch';routeButton.setAttribute('aria-controls','u42-ti84-panel');routeButton.setAttribute('aria-pressed','false');routeButton.innerHTML='<span class="u42-84-mark">84</span><b>TI‑84 Stats</b>';routeButton.addEventListener('click',()=>open(active));route.append(routeButton);
    }else if(route)routeButton=$('.u42-ti84-launch',route);
    const actions=$('.header-actions');
    if(actions&&!$('.u42-ti84-header',actions)){
      headerButton=document.createElement('button');headerButton.type='button';headerButton.className='icon-btn u42-ti84-header';headerButton.setAttribute('aria-controls','u42-ti84-panel');headerButton.setAttribute('aria-pressed','false');headerButton.title='Open TI-84 statistics simulator';headerButton.textContent='TI‑84';headerButton.addEventListener('click',()=>open(active));actions.prepend(headerButton);
    }else if(actions)headerButton=$('.u42-ti84-header',actions);
  }
  function init(){
    build();installLaunchers();
    document.addEventListener('click',event=>{
      const direct=event.target.closest?.('[data-open-u42-ti84]');if(direct){event.preventDefault();open(direct.dataset.u42Workflow||'raw');return;}
      const route=event.target.closest?.('[data-route]');if(route&&route.dataset.route!=='learn')close();
    });
    document.addEventListener('keydown',event=>{
      if(!panel?.classList.contains('is-open'))return;
      if(event.key==='Escape'){event.preventDefault();close();return;}
      if(event.key==='Tab'){
        const items=focusables();if(!items.length)return;const first=items[0],last=items[items.length-1];
        if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
        else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
      }
    });
    const app=$('#app');if(app)new MutationObserver(()=>installLaunchers()).observe(app,{childList:true,subtree:true});
    window.addEventListener('echs:u42:open-ti84',event=>open(event.detail?.workflow||'raw'));
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
  window.ECHS_IB_AI_4_2_TI84={release:'2.0.0',model:'TI-84 Plus CE',focusedStatisticsSimulator:true,offline:true,workflows,open,close,stats};
})();
