(function(){
  'use strict';
  const data=window.LESSON_DATA;
  if(String(data?.lesson?.number)!=='2.5'||typeof document==='undefined')return;
  const URL='https://ti84calc.com/ti84calc';
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));

  let panel=null,backdrop=null,frame=null,routeButton=null,headerButton=null,previousFocus=null,loaded=false,loadTimer=null;
  function currentTitle(){return $('.slide-title')?.textContent?.trim()||data.lesson?.title||'Lesson 2.5';}
  function updateContext(){const title=panel?.querySelector('[data-u1-ti84-current]');if(title)title.textContent=`Current lesson view: ${currentTitle()}`;}
  function simulatorMarkup(){
    const aside=document.createElement('aside');aside.id='tci5-ti84-simulator';aside.className='u1-ti84-sim';aside.setAttribute('aria-hidden','true');aside.setAttribute('role','dialog');aside.setAttribute('aria-modal','true');aside.setAttribute('aria-label','TI-84 Plus CE simulator for Lesson 2.5');
    aside.innerHTML=`<header class="u1-ti84-sim-head"><div><span>ECHS · TI‑84 PLUS CE</span><h2>Interactive calculator simulator · Lesson 2.5</h2></div><button type="button" class="u1-ti84-sim-close" aria-label="Close TI-84 simulator">×</button></header><div class="u1-ti84-sim-guide"><p><b>Use it with the lesson pathway:</b> predict, enter, collect relevant evidence, interpret, then verify mathematically. <span data-u1-ti84-current></span></p><button type="button" class="u1-ti84-sim-reload">Reload</button><a href="${URL}" target="_blank" rel="noopener noreferrer">Open separately ↗</a></div><div class="u1-ti84-sim-stage"><div class="u1-ti84-sim-placeholder"><strong>TI‑84 Plus CE simulator</strong><p>The simulator loads only when opened. Use the exact key route in the ECHS guide, and do not enter personal information.</p><button type="button" class="u1-ti84-sim-load">Load simulator</button><span class="u1-ti84-sim-status">Interactive simulator · internet connection required for the embedded calculator.</span></div><iframe title="TI-84 Plus CE interactive calculator simulator for IB Mathematics AI SL Lesson 2.5" src="about:blank" data-src="${URL}" loading="lazy" sandbox="allow-scripts allow-same-origin allow-forms allow-pointer-lock allow-popups allow-modals allow-downloads" allow="fullscreen; clipboard-read; clipboard-write" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div>`;
    return aside;
  }
  function simulatorFocusables(){return panel?[...panel.querySelectorAll('button,a[href],select,input,[tabindex]:not([tabindex="-1"])')].filter(el=>!el.disabled&&!el.hidden&&el.getClientRects().length):[];}
  function setSimulatorButtons(active){[routeButton,headerButton].forEach(button=>{if(!button)return;button.classList.toggle('is-active',active);button.setAttribute('aria-pressed',String(active));});}
  function markLoaded(){panel?.querySelector('.u1-ti84-sim-stage')?.classList.add('is-loaded');if(loadTimer){clearTimeout(loadTimer);loadTimer=null;}}
  function loadSimulator(force=false){buildSimulator();if(!frame)return;if(force){loaded=false;frame.src='about:blank';panel.querySelector('.u1-ti84-sim-stage')?.classList.remove('is-loaded');}if(loaded)return;loaded=true;frame.addEventListener('load',markLoaded,{once:true});frame.src=frame.dataset.src;loadTimer=setTimeout(markLoaded,9000);}
  function openSimulator(){closeGuide();buildSimulator();updateContext();previousFocus=document.activeElement;panel.classList.add('is-open');backdrop.classList.add('is-open');panel.setAttribute('aria-hidden','false');document.body.classList.add('u1-ti84-sim-open');setSimulatorButtons(true);loadSimulator();panel.querySelector('.u1-ti84-sim-close')?.focus();}
  function closeSimulator(){if(!panel)return;panel.classList.remove('is-open');backdrop.classList.remove('is-open');panel.setAttribute('aria-hidden','true');document.body.classList.remove('u1-ti84-sim-open');setSimulatorButtons(false);previousFocus?.focus?.();}
  function toggleSimulator(){panel?.classList.contains('is-open')?closeSimulator():openSimulator();}
  function buildSimulator(){
    if(panel?.isConnected)return;
    backdrop=document.createElement('div');backdrop.className='u1-ti84-sim-backdrop';document.body.append(backdrop);
    panel=simulatorMarkup();document.body.append(panel);frame=$('iframe',panel);
    backdrop.addEventListener('click',closeSimulator);$('.u1-ti84-sim-close',panel)?.addEventListener('click',closeSimulator);$('.u1-ti84-sim-load',panel)?.addEventListener('click',()=>loadSimulator());$('.u1-ti84-sim-reload',panel)?.addEventListener('click',()=>loadSimulator(true));
  }
  function installSimulatorLaunchers(){
    const route=$('.routebar');
    if(route&&!$('.tci5-ti84-sim-launch',route)){routeButton=document.createElement('button');routeButton.type='button';routeButton.className='u1-ti84-sim-launch tci5-ti84-sim-launch';routeButton.setAttribute('aria-controls','tci5-ti84-simulator');routeButton.setAttribute('aria-pressed','false');routeButton.innerHTML='<span>84</span><b>TI‑84 Simulator</b>';routeButton.addEventListener('click',toggleSimulator);route.append(routeButton);}else if(route)routeButton=$('.tci5-ti84-sim-launch',route);
    const actions=$('.header-actions');
    if(actions&&!$('#tci5-ti84-header-launch',actions)){headerButton=document.createElement('button');headerButton.id='tci5-ti84-header-launch';headerButton.type='button';headerButton.className='header-tool';headerButton.setAttribute('aria-controls','tci5-ti84-simulator');headerButton.setAttribute('aria-pressed','false');headerButton.setAttribute('aria-label','Open TI-84 simulator');headerButton.title='TI-84 Simulator';headerButton.innerHTML='84<span class="tool-label">TI‑84</span>';headerButton.addEventListener('click',toggleSimulator);const menu=$('#toggle-route-menu',actions);menu?actions.insertBefore(headerButton,menu):actions.append(headerButton);}else if(actions)headerButton=$('#tci5-ti84-header-launch',actions);
  }

  const workflows={
    'transform-overlay':{
      title:'Overlay a base graph and its translation',tag:'GRAPH · TABLE · POINT MAP',problem:'Compare Y₁=X² with Y₂=(X−2)²−3 and verify a translation 2 right and 3 down.',
      manual:['Predict the base vertex (0,0) and image vertex (2,−3).','Use the coordinate map (u,v)→(u+2,v−3).','Map at least two base points, for example (2,4)→(4,1).','Predict the ranges y≥0 and y≥−3 before graphing.'],
      keys:['Press [Y=].','Enter X² in Y₁.','Enter (X−2)²−3 in Y₂, keeping the horizontal shift inside parentheses.','Press [WINDOW] and use Xmin=−5, Xmax=7, Ymin=−5, Ymax=12, Xscl=1, Yscl=1.','Press [GRAPH].','Press [2nd] [GRAPH] for TABLE; compare values at X=0,2,4.','Use [TRACE] only to support the exact mapped points, not to guess them.'],
      entry:'Y₁=X²; Y₂=(X−2)²−3',output:'Vertices (0,0) and (2,−3); mapped pair (2,4)→(4,1).',verify:'Substitute x=4 into Y₂: (4−2)²−3=1, matching the mapped point.',ib:'The image is translated 2 units right and 3 units down. The TI‑84 overlay and table verify the exact point map (u,v)→(u+2,v−3).'
    },
    'inverse-overlay':{
      title:'Verify an inverse by reflection',tag:'GRAPH · y=x · SWAPPED POINTS',problem:'Verify that f(x)=2x−3 and f⁻¹(x)=(x+3)/2 are reflections in y=x.',
      manual:['Derive the inverse by swapping x and y and solving.','Predict the pairs (0,−3)↔(−3,0) and (2,1)↔(1,2).','Solve f(x)=x to predict the fixed point (3,3).','Use a square visual scale so reflection is not distorted.'],
      keys:['Press [Y=].','Enter 2X−3 in Y₁.','Enter (X+3)/2 in Y₂.','Enter X in Y₃ and choose a dotted line style if available.','Use Xmin=−5, Xmax=8, Ymin=−7, Ymax=8 with matching pixel scale as closely as possible.','Press [GRAPH].','Use [TRACE] or TABLE to confirm the swapped pairs and the common point (3,3).'],
      entry:'Y₁=2X−3; Y₂=(X+3)/2; Y₃=X',output:'The graphs are mirror images; mapped pairs swap coordinates; all three meet at (3,3).',verify:'Compute f⁻¹(f(x))=((2x−3)+3)/2=x and f(f⁻¹(x))=2((x+3)/2)−3=x.',ib:'The graph of f⁻¹ is the reflection of f in y=x. Swapped point pairs and both composition identities confirm the inverse.'
    },
    'composition-check':{
      title:'Check a forward and reverse conversion',tag:'Y-VARS · NESTED EVALUATION · UNITS',problem:'Store Celsius-to-Fahrenheit and its inverse, then evaluate both composition directions.',
      manual:['Forward model: F(C)=1.8C+32.','Inverse model: F⁻¹(x)=(x−32)/1.8.','Predict F⁻¹(F(30))=30 and F(F⁻¹(86))=86.','Keep the units attached to the interpretation.'],
      keys:['Press [Y=].','Enter 1.8X+32 in Y₁ and (X−32)/1.8 in Y₂.','Return to the home screen with [2nd] [MODE] (QUIT).','Press [VARS] → Y‑VARS → 1:Function → 2:Y₂, then open parentheses.','Insert Y₁ in the same way and evaluate Y₂(Y₁(30)).','Evaluate Y₁(Y₂(86)).','Record the expressions and outputs, not only the final display.'],
      entry:'Y₂(Y₁(30)); Y₁(Y₂(86))',output:'30 and 86.',verify:'Algebraically simplify both compositions to the identity.',ib:'The stored functions give F⁻¹(F(30))=30 and F(F⁻¹(86))=86, verifying the reverse conversion. The first output is 30°C; the second is 86°F.'
    }
  };
  let guide=null,active='transform-overlay',mode='teacher',manualIndex=0,keyIndex=0,revealed=false,guidePreviousFocus=null;
  function guideMarkup(){
    const overlay=document.createElement('div');overlay.id='tci5-ti-guide';overlay.className='tci5-ti-overlay';overlay.setAttribute('aria-hidden','true');overlay.innerHTML=`<section class="tci5-ti-coach" role="dialog" aria-modal="true" aria-labelledby="tci5-ti-guide-title"><header><div><span>ECHS · MANUAL-FIRST CALCULATOR TRAINING</span><h1 id="tci5-ti-guide-title">TI‑84 Classroom Guide</h1></div><button type="button" data-guide-close aria-label="Close TI-84 guide">×</button></header><div class="tci5-ti-toolbar"><label>Workflow<select data-guide-select></select></label><div class="tci5-ti-modes"><button type="button" data-guide-mode="teacher">Teacher demo</button><button type="button" data-guide-mode="follow">Students follow</button><button type="button" data-guide-mode="exam">Exam drill</button></div><button type="button" data-guide-reset>Reset</button></div><main data-guide-body></main></section>`;return overlay;
  }
  function ensureGuide(){
    if(guide?.isConnected)return guide;guide=guideMarkup();document.body.append(guide);
    const select=$('[data-guide-select]',guide);select.innerHTML=Object.entries(workflows).map(([key,item])=>`<option value="${key}">${esc(item.title)}</option>`).join('');select.addEventListener('change',()=>{active=select.value;resetGuide();});$('[data-guide-close]',guide).addEventListener('click',closeGuide);$('[data-guide-reset]',guide).addEventListener('click',resetGuide);$$('[data-guide-mode]',guide).forEach(button=>button.addEventListener('click',()=>{mode=button.dataset.guideMode;resetGuide();}));guide.addEventListener('click',event=>{if(event.target===guide)closeGuide();});return guide;
  }
  const stepList=(items,index,showAll)=>items.map((item,i)=>`<li class="${showAll||i<=index?'shown':'hidden'}"><b>${i+1}</b><span>${showAll||i<=index?esc(item):'step hidden'}</span></li>`).join('');
  function renderGuide(){
    const overlay=ensureGuide(),workflow=workflows[active],body=$('[data-guide-body]',overlay);const teacher=mode==='teacher',follow=mode==='follow',exam=mode==='exam',hidden=exam&&!revealed;
    $('[data-guide-select]',overlay).value=active;$$('[data-guide-mode]',overlay).forEach(button=>button.classList.toggle('active',button.dataset.guideMode===mode));
    body.innerHTML=`<div class="tci5-ti-problem"><span>${esc(workflow.tag)}</span><h2>${esc(workflow.problem)}</h2></div><div class="tci5-ti-columns"><article><h3><i>1</i> Manual mathematics</h3><ol>${hidden?'<li class="hidden"><b>?</b><span>method hidden for exam drill</span></li>':stepList(workflow.manual,manualIndex,follow||revealed)}</ol>${teacher?'<button type="button" data-next-manual>Reveal next manual step</button>':''}</article><article><h3><i>2</i> TI‑84 key route</h3><ol>${hidden?'<li class="hidden"><b>?</b><span>key route hidden for exam drill</span></li>':stepList(workflow.keys,keyIndex,revealed)}</ol>${!exam?'<button type="button" data-next-key>Reveal next key step</button>':''}<div class="tci5-ti-entry"><b>Calculator entry</b><span>${esc(workflow.entry)}</span></div></article><article><h3><i>3</i> Evidence and communication</h3><div class="tci5-ti-actions"><button type="button" data-guide-open-sim>Open simulator beside lesson</button>${exam&&!revealed?'<button type="button" data-guide-reveal>Reveal method and answer</button>':''}</div><div class="tci5-ti-output ${hidden?'concealed':''}"><b>Expected output</b><span>${hidden?'Complete the drill before revealing.':esc(workflow.output)}</span></div></article></div><div class="tci5-ti-evidence-grid ${hidden?'concealed':''}"><article><b>Independent verification</b><span>${hidden?'Hidden in exam drill.':esc(workflow.verify)}</span></article><article><b>IB communication</b><span>${hidden?'Hidden in exam drill.':esc(workflow.ib)}</span></article></div>`;
    $('[data-next-manual]',body)?.addEventListener('click',()=>{manualIndex=Math.min(workflow.manual.length-1,manualIndex+1);renderGuide();});$('[data-next-key]',body)?.addEventListener('click',()=>{keyIndex=Math.min(workflow.keys.length-1,keyIndex+1);renderGuide();});$('[data-guide-open-sim]',body)?.addEventListener('click',()=>{closeGuide();openSimulator();});$('[data-guide-reveal]',body)?.addEventListener('click',()=>{revealed=true;manualIndex=workflow.manual.length-1;keyIndex=workflow.keys.length-1;renderGuide();});
  }
  function resetGuide(){manualIndex=0;keyIndex=0;revealed=false;renderGuide();}
  function openGuide(key='transform-overlay'){closeSimulator();if(workflows[key])active=key;const overlay=ensureGuide();guidePreviousFocus=document.activeElement;overlay.classList.add('open');overlay.setAttribute('aria-hidden','false');document.body.classList.add('tci5-ti-modal-open');renderGuide();$('[data-guide-close]',overlay)?.focus();}
  function closeGuide(){if(!guide)return;guide.classList.remove('open');guide.setAttribute('aria-hidden','true');document.body.classList.remove('tci5-ti-modal-open');guidePreviousFocus?.focus?.();}
  function installGuideLauncher(){const route=$('.routebar');if(route&&!$('#tci5-ti-guide-launch',route)){const button=document.createElement('button');button.id='tci5-ti-guide-launch';button.type='button';button.className='route-btn tci5-ti-guide-launch';button.innerHTML='<b aria-hidden="true">84</b> TI‑84 Guide';button.addEventListener('click',()=>openGuide(active));route.append(button);}}

  function init(){
    buildSimulator();installSimulatorLaunchers();installGuideLauncher();updateContext();
    const app=$('#app');if(app)new MutationObserver(()=>{installSimulatorLaunchers();installGuideLauncher();updateContext();}).observe(app,{childList:true,subtree:true});
    document.addEventListener('click',event=>{
      const direct=event.target.closest?.('[data-open-ti84]');if(direct){event.preventDefault();openSimulator();return;}
      const workflow=event.target.closest?.('[data-tci5-ti-workflow]');if(workflow){event.preventDefault();openGuide(workflow.dataset.tci5TiWorkflow);return;}
      const route=event.target.closest?.('[data-route]');if(route&&route.dataset.route!=='learn'){closeSimulator();closeGuide();}
    });
    document.addEventListener('keydown',event=>{
      if(event.key==='Escape'){closeGuide();closeSimulator();return;}
      if(panel?.classList.contains('is-open')&&event.key==='Tab'){
        const items=simulatorFocusables();if(!items.length)return;const first=items[0],last=items[items.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
      }
    });
    document.addEventListener('echs:ti84:simulator',openSimulator);
    data.ti84Simulator={release:'5.0.0',provider:'existing ECHS simulator shell',model:'TI-84 Plus CE',lesson:'2.5',embedded:true,lazy:true,manualFirst:true,workflows:Object.keys(workflows)};
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
  window.ECHS_TCI5_TI84={workflows,openGuide,openSimulator,closeGuide,closeSimulator,release:'5.0.0',manualFirst:true};
})();
