(function(){
  'use strict';
  const data=window.LESSON_DATA,U=window.U413_STATS,D=window.U413_DATASETS;
  if(!data||String(data.lesson?.number)!=='4.13'||!U||!D)return;
  const $=(selector,root=document)=>root.querySelector(selector);
  const $$=(selector,root=document)=>Array.from(root.querySelectorAll(selector));
  const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const FULL_URL='https://ti84calc.com/ti84calc';
  const workflows={
    feature:{title:'Measured feature · greater-than',mode:'data',alternative:'gt',dataset:D.feature,alpha:0.05,claim:'Test whether population mean 1 is greater than population mean 2.'},
    shuttle:{title:'Shuttle waits · lower-than',mode:'data',alternative:'lt',dataset:D.shuttle,alpha:0.05,claim:'Test whether Route A has a lower population mean waiting time than Route B.'},
    weights:{title:'Package masses · two-tailed',mode:'data',alternative:'neq',dataset:D.weights,alpha:0.05,claim:'Test whether the two population mean package masses differ.'},
    solar:{title:'Solar output · summary statistics',mode:'stats',alternative:'neq',summary:{m1:418,s1:35,n1:15,m2:391,s2:32,n2:13},alpha:0.05,claim:'Test whether the two population mean outputs differ.'}
  };
  let activeWorkflow='feature',modal=null,previousFocus=null;

  function fmtList(values){return values.join(', ');}
  function parseList(value){return String(value||'').trim().split(/[\s,;]+/).map(Number).filter(Number.isFinite);}
  function altSymbol(alt){return alt==='lt'?'μ₁<μ₂':alt==='gt'?'μ₁>μ₂':'μ₁≠μ₂';}
  function outputMarkup(result,alpha){
    const reject=result.p<=alpha;
    return `<div class="u413-ti-output"><b class="wide">2-SampTTest</b><span>${esc(altSymbol(result.alternative))}</span><span>Pooled=Yes</span><span>t=${esc(U.fmt(result.t,7))}</span><span>p=${esc(U.fmt(result.p,8))}</span><span>df=${result.df}</span><span>x̄1=${esc(U.fmt(result.m1,5))}</span><span>x̄2=${esc(U.fmt(result.m2,5))}</span><span>Sx1=${esc(U.fmt(result.s1,5))}</span><span>Sx2=${esc(U.fmt(result.s2,5))}</span><span>n1=${result.n1}</span><span>n2=${result.n2}</span><b class="wide">${reject?'Reject H₀':'Do not reject H₀'} at α=${U.fmt(alpha,2)}</b></div>`;
  }
  function simulatorMarkup(workflow){
    const dataset=workflow.dataset||D.feature,summary=workflow.summary||U.pooledArrays(dataset.a,dataset.b,'neq');
    return `<div class="u413-ti-shell" data-ti-sim><div class="u413-ti-brand"><b>TI‑84 Plus CE · ECHS workflow simulator</b><span>STAT · TESTS · 4</span></div><div class="u413-ti-screen"><h3>2-SampTTest</h3><div class="u413-ti-tabs"><button type="button" data-ti-mode="data">Data</button><button type="button" data-ti-mode="stats">Stats</button></div><div data-ti-data><div class="u413-ti-grid"><label>List1<textarea data-list1>${esc(fmtList(dataset.a))}</textarea></label><label>List2<textarea data-list2>${esc(fmtList(dataset.b))}</textarea></label><label>Freq1<input value="1" readonly></label><label>Freq2<input value="1" readonly></label></div></div><div data-ti-stats><div class="u413-ti-grid"><label>x̄1<input type="number" step="any" data-m1 value="${summary.m1}"></label><label>Sx1<input type="number" min="0.0001" step="any" data-s1 value="${summary.s1}"></label><label>n1<input type="number" min="2" step="1" data-n1 value="${summary.n1}"></label><label>x̄2<input type="number" step="any" data-m2 value="${summary.m2}"></label><label>Sx2<input type="number" min="0.0001" step="any" data-s2 value="${summary.s2}"></label><label>n2<input type="number" min="2" step="1" data-n2 value="${summary.n2}"></label></div></div><div class="u413-ti-alt"><button type="button" data-ti-alt="lt">μ₁&lt;μ₂</button><button type="button" data-ti-alt="neq">μ₁≠μ₂</button><button type="button" data-ti-alt="gt">μ₁&gt;μ₂</button></div><div class="u413-ti-grid" style="margin-top:10px"><label>Pooled<select data-pooled disabled><option selected>Yes</option></select></label><label>α for interpretation<select data-alpha><option value="0.10">0.10</option><option value="0.05" selected>0.05</option><option value="0.01">0.01</option></select></label></div><div class="u413-ti-actions"><button type="button" class="u413-ti-key stat" data-ti-copy>Data → Stats</button><button type="button" class="u413-ti-key calc" data-ti-calc>Calculate</button></div><div data-ti-result style="margin-top:12px"></div></div><div class="u413-ti-coach-note" data-ti-note><b>Workflow:</b> ${esc(workflow.claim)} Define μ₁ and μ₂ before choosing the inequality.</div></div>`;
  }
  function activateSimulator(root,workflowKey='feature'){
    const workflow=workflows[workflowKey]||workflows.feature;
    root.innerHTML=simulatorMarkup(workflow);
    const shell=$('[data-ti-sim]',root);let mode=workflow.mode||'data',alternative=workflow.alternative||'neq';
    const setMode=next=>{mode=next;$$('[data-ti-mode]',shell).forEach(button=>button.classList.toggle('active',button.dataset.tiMode===mode));$('[data-ti-data]',shell).hidden=mode!=='data';$('[data-ti-stats]',shell).hidden=mode!=='stats';};
    const setAlternative=next=>{alternative=next;$$('[data-ti-alt]',shell).forEach(button=>button.classList.toggle('active',button.dataset.tiAlt===alternative));};
    const copyDataToStats=()=>{
      const a=parseList($('[data-list1]',shell).value),b=parseList($('[data-list2]',shell).value);
      if(a.length<2||b.length<2){$('[data-ti-note]',shell).innerHTML='<b>Input error:</b> Each list needs at least two numerical observations.';return;}
      const summary=U.pooledArrays(a,b,alternative);['m1','s1','n1','m2','s2','n2'].forEach(key=>{$(`[data-${key}]`,shell).value=summary[key];});setMode('stats');
    };
    const calculate=()=>{
      let result;
      if(mode==='data'){
        const a=parseList($('[data-list1]',shell).value),b=parseList($('[data-list2]',shell).value);
        if(a.length<2||b.length<2){$('[data-ti-result]',shell).innerHTML='<b>ERR: DATA</b><br>Each list needs at least two numerical observations.';return;}
        result=U.pooledArrays(a,b,alternative);
      }else{
        const values=['m1','s1','n1','m2','s2','n2'].map(key=>Number($(`[data-${key}]`,shell).value));
        if(values.some(value=>!Number.isFinite(value))||values[1]<=0||values[4]<=0||values[2]<2||values[5]<2){$('[data-ti-result]',shell).innerHTML='<b>ERR: DOMAIN</b><br>Check Sx and n entries.';return;}
        result=U.pooledSummary(...values,alternative);
      }
      const alpha=Number($('[data-alpha]',shell).value);$('[data-ti-result]',shell).innerHTML=outputMarkup(result,alpha);
      $('[data-ti-note]',shell).innerHTML=`<b>IB evidence:</b> pooled 2-SampTTest; ${esc(altSymbol(alternative))}; t=${esc(U.fmt(result.t,4))}, p=${esc(U.fmt(result.p,5))}, df=${result.df}. ${result.p<=alpha?'Reject H₀':'Do not reject H₀'} because p ${result.p<=alpha?'≤':'>'} α.`;
    };
    $$('[data-ti-mode]',shell).forEach(button=>button.addEventListener('click',()=>setMode(button.dataset.tiMode)));
    $$('[data-ti-alt]',shell).forEach(button=>button.addEventListener('click',()=>setAlternative(button.dataset.tiAlt)));
    $('[data-ti-copy]',shell).addEventListener('click',copyDataToStats);$('[data-ti-calc]',shell).addEventListener('click',calculate);
    setMode(mode);setAlternative(alternative);calculate();root.dataset.u413Hydrated='1';
    return {root,shell,workflowKey,calculate};
  }
  function hydrateInline(root=document){root.querySelectorAll?.('[data-u413-lab="ti84-inline"]:not([data-u413-hydrated])').forEach(node=>activateSimulator(node,'feature'));}

  function ensureModal(){
    if(modal?.isConnected)return modal;
    modal=document.createElement('div');modal.className='u413-ti-overlay';modal.id='u413-ti-coach';modal.setAttribute('aria-hidden','true');modal.innerHTML=`<section class="u413-ti-dialog" role="dialog" aria-modal="true" aria-labelledby="u413-ti-dialog-title"><header><div><span>ECHS · IB AI SL · Lesson 4.13</span><h2 id="u413-ti-dialog-title">Pooled 2-SampTTest Coach</h2></div><button type="button" class="u413-ti-close" data-ti-modal-close aria-label="Close calculator coach">×</button></header><main><div class="u413-ti-workflow-bar">${Object.entries(workflows).map(([key,item])=>`<button type="button" data-workflow="${key}">${esc(item.title)}</button>`).join('')}</div><div data-modal-simulator></div></main></section>`;document.body.append(modal);
    modal.addEventListener('click',event=>{if(event.target===modal)closeModal();});$('[data-ti-modal-close]',modal).addEventListener('click',closeModal);$$('[data-workflow]',modal).forEach(button=>button.addEventListener('click',()=>{activeWorkflow=button.dataset.workflow;renderModal();}));return modal;
  }
  function renderModal(){const overlay=ensureModal();$$('[data-workflow]',overlay).forEach(button=>button.classList.toggle('active',button.dataset.workflow===activeWorkflow));activateSimulator($('[data-modal-simulator]',overlay),activeWorkflow);}
  function openModal(key){if(workflows[key])activeWorkflow=key;previousFocus=document.activeElement;const overlay=ensureModal();renderModal();overlay.classList.add('open');overlay.setAttribute('aria-hidden','false');document.body.classList.add('u413-ti-modal-open');$('[data-ti-modal-close]',overlay)?.focus();}
  function closeModal(){if(!modal)return;modal.classList.remove('open');modal.setAttribute('aria-hidden','true');document.body.classList.remove('u413-ti-modal-open');previousFocus?.focus?.();}

  /* Full TI-84 panel: same lazy, focus-safe simulator pattern used elsewhere on the platform. */
  let fullPanel=null,fullBackdrop=null,fullFrame=null,fullLoaded=false,fullPreviousFocus=null,fullRouteButton=null,fullHeaderButton=null,loadTimer=null;
  function currentTitle(){return $('.slide-title')?.textContent?.trim()||data.lesson.title;}
  function fullMarkup(){
    const aside=document.createElement('aside');aside.id='u413-ti84-full';aside.className='u1-ti84-sim';aside.setAttribute('aria-hidden','true');aside.setAttribute('role','dialog');aside.setAttribute('aria-modal','true');aside.setAttribute('aria-label','Full TI-84 Plus CE simulator for lesson 4.13');aside.innerHTML=`<header class="u1-ti84-sim-head"><div><span>ECHS · TI‑84 PLUS CE</span><h2>Full interactive calculator · Lesson 4.13</h2></div><button type="button" class="u1-ti84-sim-close" aria-label="Close TI-84 simulator">×</button></header><div class="u1-ti84-sim-guide"><p><b>Current lesson view:</b> <span data-full-current>${esc(currentTitle())}</span>. Follow STAT → TESTS → 4:2-SampTTest, set the alternative, and choose Pooled: Yes.</p><button type="button" class="u1-ti84-sim-reload">Reload</button><a href="${FULL_URL}" target="_blank" rel="noopener noreferrer">Open separately ↗</a></div><div class="u1-ti84-sim-stage"><div class="u1-ti84-sim-placeholder"><strong>TI‑84 Plus CE simulator</strong><p>The calculator loads only when opened. Use the local coach for verified numerical output and this panel for authentic key practice.</p><button type="button" class="u1-ti84-sim-load">Load simulator</button><span class="u1-ti84-sim-status">External interactive simulator · internet connection required.</span></div><iframe title="TI-84 Plus CE interactive calculator simulator for pooled two-sample t-tests" src="about:blank" data-src="${FULL_URL}" loading="lazy" sandbox="allow-scripts allow-same-origin allow-forms allow-pointer-lock allow-popups allow-modals allow-downloads" allow="fullscreen; clipboard-read; clipboard-write" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div>`;return aside;
  }
  function buildFull(){
    if(fullPanel?.isConnected)return;fullBackdrop=document.createElement('div');fullBackdrop.className='u1-ti84-sim-backdrop';document.body.append(fullBackdrop);fullPanel=fullMarkup();document.body.append(fullPanel);fullFrame=$('iframe',fullPanel);fullBackdrop.addEventListener('click',closeFull);$('.u1-ti84-sim-close',fullPanel).addEventListener('click',closeFull);$('.u1-ti84-sim-load',fullPanel).addEventListener('click',()=>loadFull());$('.u1-ti84-sim-reload',fullPanel).addEventListener('click',()=>loadFull(true));
  }
  function markFullLoaded(){fullPanel?.querySelector('.u1-ti84-sim-stage')?.classList.add('is-loaded');if(loadTimer){clearTimeout(loadTimer);loadTimer=null;}}
  function loadFull(force=false){buildFull();if(force){fullLoaded=false;fullFrame.src='about:blank';$('.u1-ti84-sim-stage',fullPanel).classList.remove('is-loaded');}if(fullLoaded)return;fullLoaded=true;fullFrame.addEventListener('load',markFullLoaded,{once:true});fullFrame.src=fullFrame.dataset.src;loadTimer=setTimeout(markFullLoaded,9000);}
  function openFull(){closeModal();buildFull();fullPreviousFocus=document.activeElement;$('[data-full-current]',fullPanel).textContent=currentTitle();fullPanel.classList.add('is-open');fullBackdrop.classList.add('is-open');fullPanel.setAttribute('aria-hidden','false');document.body.classList.add('u1-ti84-sim-open');[fullRouteButton,fullHeaderButton].forEach(button=>{button?.classList.add('is-active');button?.setAttribute('aria-pressed','true');});loadFull();$('.u1-ti84-sim-close',fullPanel)?.focus();}
  function closeFull(){if(!fullPanel)return;fullPanel.classList.remove('is-open');fullBackdrop.classList.remove('is-open');fullPanel.setAttribute('aria-hidden','true');document.body.classList.remove('u1-ti84-sim-open');[fullRouteButton,fullHeaderButton].forEach(button=>{button?.classList.remove('is-active');button?.setAttribute('aria-pressed','false');});fullPreviousFocus?.focus?.();}
  function focusable(root){return $$('button,a[href],select,input,textarea,[tabindex]:not([tabindex="-1"])',root).filter(node=>!node.disabled&&!node.hidden&&node.getClientRects().length);}

  function installLaunchers(){
    const route=$('.routebar');if(route&&!$('#u413-ti-coach-route',route)){const button=document.createElement('button');button.id='u413-ti-coach-route';button.type='button';button.className='u413-ti-route';button.innerHTML='<span>2T</span> 2-SampTTest Coach';button.addEventListener('click',()=>openModal(activeWorkflow));route.append(button);}
    if(route&&!$('#u413-ti-full-route',route)){fullRouteButton=document.createElement('button');fullRouteButton.id='u413-ti-full-route';fullRouteButton.type='button';fullRouteButton.className='u1-ti84-sim-launch';fullRouteButton.setAttribute('aria-pressed','false');fullRouteButton.innerHTML='<span>84</span><b>TI‑84 Simulator</b>';fullRouteButton.addEventListener('click',openFull);route.append(fullRouteButton);}else fullRouteButton=$('#u413-ti-full-route');
    const actions=$('.header-actions');if(actions&&!$('#u413-ti-coach-header',actions)){const coach=document.createElement('button');coach.id='u413-ti-coach-header';coach.type='button';coach.className='icon-btn header-tool u413-header-tool';coach.setAttribute('aria-label','Open pooled 2-SampTTest coach');coach.title='2-SampTTest Coach';coach.innerHTML='2T<span class="tool-label">2-Samp t</span>';coach.addEventListener('click',()=>openModal(activeWorkflow));const menu=$('#toggle-route-menu',actions);menu?actions.insertBefore(coach,menu):actions.append(coach);}
    if(actions&&!$('#u413-ti-full-header',actions)){fullHeaderButton=document.createElement('button');fullHeaderButton.id='u413-ti-full-header';fullHeaderButton.type='button';fullHeaderButton.className='icon-btn header-tool u413-header-tool';fullHeaderButton.setAttribute('aria-label','Open full TI-84 simulator');fullHeaderButton.setAttribute('aria-pressed','false');fullHeaderButton.title='TI-84 Simulator';fullHeaderButton.innerHTML='84<span class="tool-label">TI‑84</span>';fullHeaderButton.addEventListener('click',openFull);const menu=$('#toggle-route-menu',actions);menu?actions.insertBefore(fullHeaderButton,menu):actions.append(fullHeaderButton);}else fullHeaderButton=$('#u413-ti-full-header');
  }
  function init(){
    buildFull();ensureModal();installLaunchers();hydrateInline();const app=$('#app');if(app)new MutationObserver(()=>{hydrateInline(app);installLaunchers();if(fullPanel)$('[data-full-current]',fullPanel).textContent=currentTitle();}).observe(app,{childList:true,subtree:true});
    document.addEventListener('click',event=>{const local=event.target.closest?.('[data-u413-ti84="open"]');if(local){event.preventDefault();openModal(local.dataset.u413Ti84Example||activeWorkflow);return;}if(event.target.closest?.('[data-open-ti84]')){event.preventDefault();openFull();}});
    document.addEventListener('keydown',event=>{
      if(event.key==='Escape'){if(modal?.classList.contains('open')){event.preventDefault();closeModal();return;}if(fullPanel?.classList.contains('is-open')){event.preventDefault();closeFull();return;}}
      const openRoot=modal?.classList.contains('open')?modal:fullPanel?.classList.contains('is-open')?fullPanel:null;if(event.key==='Tab'&&openRoot){const items=focusable(openRoot);if(!items.length)return;const first=items[0],last=items[items.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
  window.ECHS_U413_TI84={workflows,openCoach:openModal,openFull,hydrateInline,release:'2.0.0',model:'TI-84 Plus CE',test:'2-SampTTest',pooled:true,localExactEngine:true,fullSimulatorProvider:'ti84calc.com'};
})();
