(function(){
  'use strict';
  const data=window.LESSON_DATA;
  if(!data||String(data.lesson?.number)!=='4.15')return;

  const $=(selector,root=document)=>root.querySelector(selector);
  const $$=(selector,root=document)=>Array.from(root.querySelectorAll(selector));
  const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));

  const workflows={
    fair:{
      short:'Fair die',
      title:'Test a uniform distribution',
      tag:'UNIFORM MODEL · SIX CATEGORIES',
      problem:'A die is rolled 60 times with observed counts (10, 8, 11, 10, 8, 13). Test whether the outcomes fit a uniform distribution.',
      manual:[
        'State H₀: p₁=p₂=⋯=p₆=1/6; H₁: the outcome probabilities are not all 1/6.',
        'Calculate expected counts: Eᵢ=60(1/6)=10 for every face.',
        'Audit the condition: every expected count is at least 5.',
        'Use df=6−1=5 because the model is fully specified.'
      ],
      keys:[
        'Press [STAT], choose 1:Edit, and clear old list data if necessary.',
        'Enter 10, 8, 11, 10, 8, 13 in L1.',
        'Enter 10, 10, 10, 10, 10, 10 in L2.',
        'Press [STAT], move to TESTS, and choose D:χ²GOF-Test.',
        'Set Observed:L1, Expected:L2, df:5, then select Calculate.',
        'Read χ², p, df, and the CNTRB list. Do not use χ²-Test, which is for a contingency table.'
      ],
      lists:'L1 = {10,8,11,10,8,13}\nL2 = {10,10,10,10,10,10}\ndf = 5',
      output:'χ² = 1.8\np = 0.8760684003\ndf = 5\nCNTRB = {0,0.4,0.1,0,0.4,0.9}',
      verify:'Manual contribution audit: 0+0.4+0.1+0+0.4+0.9=1.8. Both list totals equal 60.',
      ib:'Since p≈0.876>0.10, fail to reject H₀. There is insufficient evidence that the die outcomes differ from a uniform distribution.'
    },
    specified:{
      short:'Specified p-vector',
      title:'Test a non-uniform specified model',
      tag:'MODEL PROBABILITIES · EXPECTED LIST',
      problem:'Observed counts are (26, 18, 30, 16, 10) and the specified probabilities are (0.25, 0.20, 0.30, 0.15, 0.10).',
      manual:[
        'Check that the specified probabilities sum to 1.',
        'The sample total is n=100, so E=np gives (25,20,30,15,10).',
        'All expected counts are at least 5.',
        'The model is fully specified, so df=5−1=4.'
      ],
      keys:[
        'Press [STAT] → 1:Edit.',
        'Enter the observed counts in L1 and expected counts in L2.',
        'Press [STAT] → TESTS → D:χ²GOF-Test.',
        'Set Observed:L1, Expected:L2, df:4.',
        'Choose Calculate and record the complete output.'
      ],
      lists:'L1 = {26,18,30,16,10}\nL2 = {25,20,30,15,10}\ndf = 4',
      output:'χ² = 0.3066666667\np = 0.9893797643\ndf = 4',
      verify:'The contributions are 0.04, 0.20, 0, 0.0666667, 0; their sum is 0.3066667.',
      ib:'Since p≈0.989>0.05, fail to reject H₀. The data do not provide sufficient evidence that the category probabilities differ from the specified model.'
    },
    binomial:{
      short:'Binomial model',
      title:'Build expected counts from B(4, 0.5)',
      tag:'BINOMPDF · EXPECTED FREQUENCIES',
      problem:'Four coins are flipped in each of 80 trials. The observed numbers of 0, 1, 2, 3, 4 heads are (2, 11, 36, 24, 7).',
      manual:[
        'Under H₀, X~B(4,0.5).',
        'Calculate P(X=x) for x=0,1,2,3,4: (0.0625,0.25,0.375,0.25,0.0625).',
        'Multiply by 80 to obtain expected counts (5,20,30,20,5).',
        'An expected count equal to 5 satisfies the lesson condition; df=5−1=4.'
      ],
      keys:[
        'Press [STAT] → 1:Edit and enter 2,11,36,24,7 in L1.',
        'On the home screen, enter 80*binompdf(4,0.5)→L2. Use [2nd] [DISTR] to insert binompdf.',
        'Inspect L2 and confirm {5,20,30,20,5}; do not round intermediate probabilities early.',
        'Press [STAT] → TESTS → D:χ²GOF-Test.',
        'Set Observed:L1, Expected:L2, df:4 and select Calculate.'
      ],
      lists:'L1 = {2,11,36,24,7}\n80*binompdf(4,.5)→L2\nL2 = {5,20,30,20,5}\ndf = 4',
      output:'χ² = 8.65\np = 0.0704686543\ndf = 4',
      verify:'At α=0.10, p<α; at α=0.05, p>α. The same sample therefore gives different decisions at the two stated significance levels.',
      ib:'At 10%, reject H₀ and conclude that there is evidence the distribution differs from B(4,0.5). At 5%, fail to reject H₀.'
    },
    normal:{
      short:'Normal model',
      title:'Build interval expectations from N(70, 8²)',
      tag:'NORMALCDF · FULL-LINE PARTITION',
      problem:'For 150 measurements, observed interval counts are (15, 43, 37, 34, 21) with boundaries 60.5, 67.5, 72.5, and 79.5.',
      manual:[
        'Use the five intervals (−∞,60.5), [60.5,67.5), [67.5,72.5), [72.5,79.5), [79.5,∞).',
        'Calculate each probability under N(70,8²), then multiply by 150.',
        'Expected counts are approximately (17.6273,38.9723,36.8009,38.9723,17.6273).',
        'All expected counts exceed 5 and the fully specified model gives df=4.'
      ],
      keys:[
        'Press [STAT] → 1:Edit and enter 15,43,37,34,21 in L1.',
        'Use normalcdf(lower,upper,70,8) for each interval. Represent −∞ and +∞ by −1E99 and 1E99.',
        'Multiply each probability by 150 and enter the full-precision expected values in L2.',
        'Check that sum(L2) is 150 apart from display rounding.',
        'Press [STAT] → TESTS → D:χ²GOF-Test; set Observed:L1, Expected:L2, df:4; Calculate.'
      ],
      lists:'L1 = {15,43,37,34,21}\nL2 ≈ {17.62728424,38.97225799,36.80091554,38.97225799,17.62728424}\ndf = 4',
      output:'χ² ≈ 2.088629058\np ≈ 0.7194616972\ndf = 4',
      verify:'The interval probabilities cover the entire real line and sum to 1. The expected counts sum to 150.',
      ib:'Since p≈0.719>0.05, fail to reject H₀. There is insufficient evidence that the population distribution differs from N(70,8²).'
    }
  };

  let active='fair';
  let revealManual=0;
  let revealKeys=0;

  function addRouteButtons(){
    const route=$('#lesson-route-menu')||$('.routebar');
    if(!route)return;
    if(!$('#gof-ti84-simulator')){
      const simulator=document.createElement('button');
      simulator.type='button';simulator.id='gof-ti84-simulator';simulator.className='route-btn gof-ti-route';
      simulator.innerHTML='<span aria-hidden="true">▣</span> TI‑84 Simulator';
      simulator.addEventListener('click',openDock);route.append(simulator);
    }
    if(!$('#gof-ti84-classroom')){
      const classroom=document.createElement('button');
      classroom.type='button';classroom.id='gof-ti84-classroom';classroom.className='route-btn gof-ti-route';
      classroom.innerHTML='<b aria-hidden="true">84</b> TI‑84 Classroom';
      classroom.addEventListener('click',()=>openClassroom(active));route.append(classroom);
    }
  }

  function ensureDock(){
    let dock=$('#ti84-gof-dock');
    if(dock)return dock;
    dock=document.createElement('aside');
    dock.id='ti84-gof-dock';dock.className='ti84-gof-dock';dock.setAttribute('aria-hidden','true');
    dock.innerHTML=`<header class="ti84-gof-dock-head"><strong>TI‑84 Plus CE practice</strong><small>Lesson stays visible</small><button type="button" data-ti-reload title="Reload simulator">↻</button><button type="button" data-ti-close aria-label="Close TI-84 simulator">×</button></header><div class="ti84-gof-dock-body"><div class="ti84-gof-placeholder" data-ti-placeholder><div><b>External practice simulator</b><h3>Load only when you are ready</h3><p>This optional interface mirrors TI‑84 key practice. Do not enter personal information. The mathematical workflow and answer verification remain inside ECHS.</p><button type="button" data-ti-load>Load TI‑84 simulator</button></div></div><iframe title="TI-84 Plus CE online practice simulator" data-ti-frame loading="lazy" sandbox="allow-scripts allow-same-origin allow-forms allow-pointer-lock allow-popups allow-modals allow-downloads" referrerpolicy="no-referrer"></iframe></div>`;
    document.body.append(dock);
    $('[data-ti-close]',dock).addEventListener('click',closeDock);
    $('[data-ti-load]',dock).addEventListener('click',()=>loadSimulator(false));
    $('[data-ti-reload]',dock).addEventListener('click',()=>loadSimulator(true));
    return dock;
  }
  function loadSimulator(force){
    const dock=ensureDock();
    const frame=$('[data-ti-frame]',dock),placeholder=$('[data-ti-placeholder]',dock);
    if(force){frame.removeAttribute('src');placeholder.hidden=false;placeholder.innerHTML='<div><b>Reloading simulator…</b><p>The calculator will appear when the external page finishes loading.</p></div>';}
    if(!frame.getAttribute('src')){
      if(!force)placeholder.innerHTML='<div><b>Loading TI‑84 simulator…</b><p>The active lesson remains available beside it.</p></div>';
      frame.src='https://ti84calc.com/ti84calc';
      frame.addEventListener('load',()=>{placeholder.hidden=true;frame.classList.add('ready');},{once:true});
    }
  }
  function openDock(){
    closeClassroom();
    const dock=ensureDock();
    dock.classList.add('open');dock.setAttribute('aria-hidden','false');
    document.body.classList.add('ti84-gof-dock-open');
    $('[data-ti-close]',dock)?.focus();
  }
  function closeDock(){
    const dock=$('#ti84-gof-dock');
    dock?.classList.remove('open');dock?.setAttribute('aria-hidden','true');
    document.body.classList.remove('ti84-gof-dock-open');
  }

  function ensureModal(){
    let modal=$('#ti84-gof-modal');
    if(modal)return modal;
    modal=document.createElement('div');modal.id='ti84-gof-modal';modal.className='ti84-gof-modal';modal.setAttribute('aria-hidden','true');
    modal.innerHTML=`<section class="ti84-gof-dialog" role="dialog" aria-modal="true" aria-labelledby="ti84-gof-title"><header class="ti84-gof-dialog-head"><strong id="ti84-gof-title">TI‑84 χ²GOF-Test Classroom</strong><small>manual mathematics → key route → verified output</small><button type="button" data-modal-close aria-label="Close TI-84 classroom">×</button></header><div class="ti84-gof-dialog-body"><nav class="ti84-gof-workflow-tabs" aria-label="Calculator examples" data-tabs></nav><div data-workflow></div></div></section>`;
    document.body.append(modal);
    $('[data-modal-close]',modal).addEventListener('click',closeClassroom);
    modal.addEventListener('click',event=>{if(event.target===modal)closeClassroom()});
    return modal;
  }
  function listSteps(items,revealed){
    return `<ol class="gof-numbered">${items.map((item,index)=>`<li class="${index<=revealed?'shown':'concealed'}">${index<=revealed?esc(item):'<span aria-label="hidden step">Complete this step before revealing.</span>'}</li>`).join('')}</ol>`;
  }
  function renderClassroom(){
    const modal=ensureModal(),workflow=workflows[active];
    $('[data-tabs]',modal).innerHTML=Object.entries(workflows).map(([key,item])=>`<button type="button" data-tab="${key}" class="${key===active?'active':''}">${esc(item.short)}</button>`).join('');
    $$('[data-tab]',modal).forEach(button=>button.addEventListener('click',()=>{active=button.dataset.tab;revealManual=0;revealKeys=0;renderClassroom()}));
    $('[data-workflow]',modal).innerHTML=`<div class="gof-ti-problem"><span class="mini-label">${esc(workflow.tag)}</span><h2>${esc(workflow.title)}</h2><p>${esc(workflow.problem)}</p></div><div class="ti84-gof-workflow-grid"><article><h3>1 · Manual mathematical structure</h3>${listSteps(workflow.manual,revealManual)}<div class="ti84-gof-modal-actions"><button class="secondary" type="button" data-reveal-manual>${revealManual>=workflow.manual.length-1?'Manual method complete':'Reveal next manual step'}</button></div><div class="ti84-gof-proof"><b>Independent verification</b><p>${esc(workflow.verify)}</p></div></article><article><h3>2 · TI‑84 key route</h3><div class="ti84-gof-keyline"><span>STAT</span><span>EDIT</span><span>L1 observed</span><span>L2 expected</span><span>STAT</span><span>TESTS</span><span>χ²GOF-Test</span></div>${listSteps(workflow.keys,revealKeys)}<div class="ti84-gof-modal-actions"><button class="secondary" type="button" data-reveal-keys>${revealKeys>=workflow.keys.length-1?'Key route complete':'Reveal next key step'}</button><button class="primary" type="button" data-open-dock>Open simulator beside lesson</button></div></article></div><div class="ti84-gof-workflow-grid"><article><h3>3 · Exact list setup</h3><div class="ti84-gof-listbox">${esc(workflow.lists)}</div><div class="ti84-gof-caution"><b>Frequent error</b><p>Use χ²GOF-Test with two lists. The separate χ²-Test command is for independence in a matrix.</p></div></article><article><h3>4 · Output and IB communication</h3><div class="ti84-gof-listbox">${esc(workflow.output)}</div><div class="ti84-gof-proof"><b>Exam-ready conclusion</b><p>${esc(workflow.ib)}</p></div></article></div>`;
    $('[data-reveal-manual]',modal).addEventListener('click',()=>{revealManual=Math.min(workflow.manual.length-1,revealManual+1);renderClassroom()});
    $('[data-reveal-keys]',modal).addEventListener('click',()=>{revealKeys=Math.min(workflow.keys.length-1,revealKeys+1);renderClassroom()});
    $('[data-open-dock]',modal).addEventListener('click',()=>{closeClassroom();openDock()});
  }
  function openClassroom(key='fair'){
    closeDock();
    if(workflows[key])active=key;
    revealManual=0;revealKeys=0;
    const modal=ensureModal();
    modal.classList.add('open');modal.setAttribute('aria-hidden','false');
    document.body.classList.add('ti84-gof-modal-open');
    renderClassroom();
    $('[data-modal-close]',modal)?.focus();
  }
  function closeClassroom(){
    const modal=$('#ti84-gof-modal');
    modal?.classList.remove('open');modal?.setAttribute('aria-hidden','true');
    document.body.classList.remove('ti84-gof-modal-open');
  }

  function init(){
    addRouteButtons();
    document.addEventListener('click',event=>{
      const workflowButton=event.target.closest('[data-gof-ti-workflow]');
      if(workflowButton){event.preventDefault();openClassroom(workflowButton.dataset.gofTiWorkflow||'fair');return;}
      if(event.target.closest('[data-gof-open-simulator]')){event.preventDefault();openDock();}
    });
    document.addEventListener('keydown',event=>{
      if(event.key==='Escape'){closeClassroom();closeDock();}
    });
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
  window.ECHS_GOF_TI84=Object.freeze({workflows,openClassroom,openDock,closeClassroom,closeDock,release:'2.0.0',model:'TI-84 Plus CE',manualFirst:true});
})();
