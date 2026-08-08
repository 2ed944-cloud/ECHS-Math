(function(){
'use strict';
const data=window.LESSON_DATA;if(!data||String(data.lesson?.number)!=='4.12')return;
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const keys=[
 ['2nd','second'],['MODE','dark'],['DEL','dark'],['ALPHA','alpha'],['X,T,θ,n','dark'],
 ['STAT','dark'],['MATH','dark'],['APPS','dark'],['PRGM','dark'],['VARS','dark'],
 ['x⁻¹','dark'],['SIN','dark'],['COS','dark'],['TAN','dark'],['^','dark'],
 ['x²','dark'],[',',''],['(',''],[')',''],['÷',''],
 ['LOG','dark'],['7',''],['8',''],['9',''],['×',''],
 ['LN','dark'],['4',''],['5',''],['6',''],['−',''],
 ['STO▶','dark'],['1',''],['2',''],['3',''],['+',''],
 ['ON','dark'],['0',''],['.',''],['(−)',''],['ENTER','dark'],
 ['↑','dark'],['←','dark'],['→','dark'],['↓','dark'],['CLEAR','dark']
];
const workflows={
 't-test':{
  tab:'2-SampTTest',title:'Pooled two-sample t-test',context:'Support programme (sample 1) versus standard programme (sample 2). Test μ₁ < μ₂.',
  evidence:'Record: 2-SampTTest, Stats input, μ₁<μ₂, Pooled: Yes, t=−2.234061, df=36, p=0.0158905. At 5%, reject H₀ and conclude that the support programme has a lower population mean completion time.',
  steps:[
   {title:'Open the test menu',route:'[STAT] [→] 4:2-SampTTest [ENTER]',keys:['STAT','→','4','ENTER'],screen:`STAT TESTS\n1:Z-Test\n2:T-Test\n3:2-SampZTest\n4:2-SampTTest`,instruction:'Press STAT, move to TESTS, choose 4:2-SampTTest, then press ENTER.'},
   {title:'Choose summary-statistics input',route:'Inpt: Stats',keys:['→','ENTER'],screen:`2-SampTTest\nInpt: Data  Stats\nx̄1:           \nSx1:           \nn1:`,instruction:'Highlight Stats because the problem supplies sample summaries rather than raw lists.'},
   {title:'Enter sample 1 summaries',route:'x̄₁=42.8, Sx₁=5.6, n₁=18',keys:['4','2','.','8','ENTER','5','.','6','ENTER','1','8','ENTER'],screen:`2-SampTTest  Stats\nx̄1:42.8\nSx1:5.6\nn1:18\nx̄2:`,instruction:'Sample 1 is the support programme. Enter the mean, sample standard deviation, and sample size exactly.'},
   {title:'Enter sample 2 summaries',route:'x̄₂=47.1, Sx₂=6.2, n₂=20',keys:['4','7','.','1','ENTER','6','.','2','ENTER','2','0','ENTER'],screen:`2-SampTTest  Stats\nx̄2:47.1\nSx2:6.2\nn2:20\nμ1: ≠  <  > μ2`,instruction:'Sample 2 is the standard programme. Group order controls the sign and the one-sided direction.'},
   {title:'Match the alternative hypothesis',route:'Select μ₁ < μ₂',keys:['→','ENTER'],screen:`2-SampTTest\nμ1:  ≠μ2   <μ2   >μ2\n             ^\nPooled: No  Yes`,instruction:'The support programme is sample 1 and the claim is a lower population mean, so select μ₁<μ₂.'},
   {title:'Use the course pooled setting',route:'Pooled: Yes',keys:['↓','→','ENTER'],screen:`2-SampTTest\nμ1:<μ2\nPooled: No  Yes\n             ^\nCalculate  Draw`,instruction:'Select Pooled: Yes. This setting must agree with the course method and its equal-variance assumption.'},
   {title:'Calculate',route:'Highlight Calculate [ENTER]',keys:['↓','ENTER'],screen:`2-SampTTest\nμ1:<μ2\nPooled:Yes\n\nCalculate  Draw`,instruction:'Highlight Calculate and press ENTER.'},
   {title:'Read and interpret the output',route:'t, p, df, x̄₁, x̄₂, n₁, n₂',keys:[],screen:`2-SampTTest\nμ1<μ2\nt=-2.234061\np=.0158905\ndf=36\nx̄1=42.8  x̄2=47.1\nSx1=5.6  Sx2=6.2\nn1=18  n2=20`,instruction:'Check the tail, sign, sample sizes, t, df, and p. Then compare p with the pre-selected α and write the contextual conclusion.'}
  ]
 },
 'chi-ind':{
  tab:'χ² Independence',title:'Chi-square test for independence',context:'Rows are Years 10–12; columns are bus, car, metro. Enter the 3×3 observed table in [A].',
  evidence:'Record: χ²-Test with Observed:[A], Expected:[B], χ²=14.6000, df=4, p=0.00560697. Inspect [B]: every expected count is 20. At 1%, reject independence and conclude that there is evidence of association.',
  steps:[
   {title:'Open matrix editor',route:'[2nd] [x⁻¹] → EDIT → 1:[A]',keys:['2nd','x⁻¹','→','→','1','ENTER'],screen:`MATRIX  EDIT\n1:[A]  0×0\n2:[B]  0×0\n3:[C]  0×0`,instruction:'Open the MATRIX menu, move to EDIT, and choose 1:[A] for the observed frequencies.'},
   {title:'Set matrix dimensions',route:'3 [ENTER] 3 [ENTER]',keys:['3','ENTER','3','ENTER'],screen:`MATRIX [A]  3×3\n     C1  C2  C3\nR1   [ ] [ ] [ ]\nR2   [ ] [ ] [ ]\nR3   [ ] [ ] [ ]`,instruction:'Set [A] to three rows and three columns.'},
   {title:'Enter row 1',route:'26, 18, 16',keys:['2','6','ENTER','1','8','ENTER','1','6','ENTER'],screen:`MATRIX [A]  3×3\nR1  26  18  16\nR2  [ ] [ ] [ ]\nR3  [ ] [ ] [ ]`,instruction:'Enter Year 10 counts in row order: bus, car, metro.'},
   {title:'Enter row 2',route:'15, 29, 16',keys:['1','5','ENTER','2','9','ENTER','1','6','ENTER'],screen:`MATRIX [A]  3×3\nR1  26  18  16\nR2  15  29  16\nR3  [ ] [ ] [ ]`,instruction:'Enter Year 11 counts.'},
   {title:'Enter row 3',route:'19, 13, 28',keys:['1','9','ENTER','1','3','ENTER','2','8','ENTER'],screen:`MATRIX [A]  3×3\nR1  26  18  16\nR2  15  29  16\nR3  19  13  28`,instruction:'Enter Year 12 counts, then verify all nine frequencies.'},
   {title:'Open χ²-Test',route:'[STAT] [→] → C:χ²-Test [ENTER]',keys:['STAT','→','↓','ENTER'],screen:`STAT TESTS\n...\nB:2-PropZInt\nC:χ²-Test\nD:χ²GOF-Test`,instruction:'Open STAT TESTS and select C:χ²-Test. The menu route is more important than memorizing a scroll count.'},
   {title:'Confirm observed and expected matrices',route:'Observed:[A] · Expected:[B]',keys:['ENTER'],screen:`χ²-Test\nObserved:[A]\nExpected:[B]\n\nCalculate  Draw`,instruction:'Use [A] for observed frequencies. The calculator stores expected frequencies in [B].'},
   {title:'Calculate',route:'Highlight Calculate [ENTER]',keys:['ENTER'],screen:`χ²-Test\nObserved:[A]\nExpected:[B]\n\nCalculate`,instruction:'Press ENTER on Calculate.'},
   {title:'Read the test output',route:'χ², p, df',keys:[],screen:`χ²-Test\nχ²=14.6000\np=.00560697\ndf=4`,instruction:'Compare p with α=0.01. The small p-value supports association, not causation.'},
   {title:'Inspect expected frequencies',route:'[2nd] [x⁻¹] → NAMES → 2:[B]',keys:['2nd','x⁻¹','2','ENTER'],screen:`MATRIX [B]  3×3\nR1  20  20  20\nR2  20  20  20\nR3  20  20  20`,instruction:'Open [B] and check the expected-frequency condition. Here every expected count is 20.'}
  ]
 },
 'chi-gof':{
  tab:'χ² GOF',title:'Chi-square goodness-of-fit test',context:'Observed counts L1=(66,28,16,10); expected counts L2=(48,36,24,12); df=3.',
  evidence:'Record: χ²GOF-Test with Observed:L1, Expected:L2, df=3, χ²=11.5277778, p=0.00918894. At 1%, reject the claimed 40:30:20:10 distribution.',
  steps:[
   {title:'Open the list editor',route:'[STAT] 1:Edit [ENTER]',keys:['STAT','1','ENTER'],screen:`STAT EDIT\n1:Edit...\n2:SortA(\n3:SortD(`,instruction:'Open STAT and choose 1:Edit to enter observed and expected frequency lists.'},
   {title:'Enter observed counts in L1',route:'66, 28, 16, 10',keys:['6','6','ENTER','2','8','ENTER','1','6','ENTER','1','0','ENTER'],screen:`     L1     L2\n1    66\n2    28\n3    16\n4    10`,instruction:'Enter observed frequencies in L1. Use counts, not proportions.'},
   {title:'Move to L2 and enter expected counts',route:'48, 36, 24, 12',keys:['→','4','8','ENTER','3','6','ENTER','2','4','ENTER','1','2','ENTER'],screen:`     L1     L2\n1    66     48\n2    28     36\n3    16     24\n4    10     12`,instruction:'Expected counts are 120 times the claimed proportions. Enter them in L2.'},
   {title:'Open χ²GOF-Test',route:'[STAT] [→] → D:χ²GOF-Test [ENTER]',keys:['STAT','→','↓','ENTER'],screen:`STAT TESTS\n...\nC:χ²-Test\nD:χ²GOF-Test\nE:2-SampFTest`,instruction:'From STAT TESTS choose D:χ²GOF-Test.'},
   {title:'Set lists and degrees of freedom',route:'Observed:L1 · Expected:L2 · df:3',keys:['2nd','1','ENTER','2nd','2','ENTER','3','ENTER'],screen:`χ²GOF-Test\nObserved:L1\nExpected:L2\ndf:3\nCalculate  Draw`,instruction:'Choose L1 for observed, L2 for expected, and enter df=4−1=3.'},
   {title:'Calculate',route:'Highlight Calculate [ENTER]',keys:['ENTER'],screen:`χ²GOF-Test\nObserved:L1\nExpected:L2\ndf:3\n\nCalculate`,instruction:'Press ENTER on Calculate.'},
   {title:'Read and interpret the output',route:'χ² and p',keys:[],screen:`χ²GOF-Test\nχ²=11.5277778\np=.00918894\ndf=3`,instruction:'At α=0.01, p<α. Reject the claimed distribution and conclude in context; do not claim that the test explains why categories differ.'}
  ]
 }
};
let dock=null,active='t-test',mode='follow',stepIndex=0,keyIndex=0,previousFocus=null,status='';
function current(){return workflows[active]}
function currentStep(){return current().steps[stepIndex]}
function build(){
 if(dock?.isConnected)return dock;
 dock=document.createElement('aside');dock.id='l412-ti-dock';dock.className='l412-ti-dock';dock.setAttribute('aria-hidden','true');dock.setAttribute('aria-label','TI-84 Plus CE statistical workflow simulator');dock.innerHTML=`<header class="l412-ti-dock-head"><div><span>ECHS · LOCAL TI‑84 PLUS CE WORKFLOW</span><h2>Statistics calculator beside the lesson</h2></div><button type="button" class="l412-ti-close" aria-label="Close TI-84 simulator">×</button></header><nav class="l412-ti-tabs" aria-label="Calculator workflows"></nav><main class="l412-ti-body"></main><footer class="l412-ti-footer"><span>Offline · no external calculator dependency</span><button type="button" data-ti-reset-all>Reset</button></footer>`;document.body.append(dock);
 dock.querySelector('.l412-ti-close').addEventListener('click',close);
 dock.querySelector('[data-ti-reset-all]').addEventListener('click',reset);
 return dock;
}
function render(){
 build();const flow=current(),step=currentStep(),done=stepIndex===flow.steps.length-1&&step.keys.length===0,percent=(stepIndex+(step.keys.length?keyIndex/step.keys.length:1))/flow.steps.length*100;
 dock.querySelector('.l412-ti-tabs').innerHTML=Object.entries(workflows).map(([id,w])=>`<button type="button" data-ti-workflow="${id}" class="${id===active?'active':''}">${esc(w.tab)}</button>`).join('');
 dock.querySelectorAll('[data-ti-workflow]').forEach(b=>b.addEventListener('click',()=>{active=b.dataset.tiWorkflow;stepIndex=0;keyIndex=0;status='';render()}));
 const required=step.keys[keyIndex]||'';
 const screenHidden=mode==='exam'&&!done&&stepIndex>=flow.steps.length-2;
 dock.querySelector('.l412-ti-body').innerHTML=`<section class="l412-ti-context"><b>${esc(flow.title)}</b><p>${esc(flow.context)}</p></section><div class="l412-ti-modebar"><button type="button" data-ti-mode="teacher" class="${mode==='teacher'?'active':''}">Teacher demo</button><button type="button" data-ti-mode="follow" class="${mode==='follow'?'active':''}">Students follow</button><button type="button" data-ti-mode="exam" class="${mode==='exam'?'active':''}">Exam drill</button></div><section class="l412-ti-device"><div class="l412-ti-brand"><span>TI‑84 PLUS CE</span><span>STATISTICS</span></div><div class="l412-ti-screen"><div class="screen-title"><span>${esc(step.title)}</span><span>${stepIndex+1}/${flow.steps.length}</span></div><pre class="${screenHidden?'screen-hidden':''}">${esc(step.screen)}${required?'\n\nNext: ['+esc(required)+']':''}</pre></div><div class="l412-ti-keys">${keys.map(([k,cls])=>`<button type="button" class="l412-ti-key ${cls} ${required===k?'next':''}" data-ti-key="${esc(k)}">${esc(k)}</button>`).join('')}</div></section><section class="l412-ti-guide"><article class="l412-ti-step"><header><b>${mode==='exam'&&!done?'Complete the key route':esc(step.title)}</b><span>${mode==='exam'&&!done?'route hidden':esc(step.route)}</span></header><p>${mode==='exam'&&!done?'Use the hypotheses, variable structure, and calculator memory to complete the route without the written cue.':esc(step.instruction)}</p><div class="l412-ti-progress"><i style="width:${percent.toFixed(1)}%"></i></div>${status?`<p role="status"><b>${esc(status)}</b></p>`:''}<div class="l412-ti-actions">${mode==='teacher'?'<button type="button" class="primary" data-ti-advance>Demonstrate next step</button>':''}<button type="button" class="secondary" data-ti-back ${stepIndex===0&&keyIndex===0?'disabled':''}>Back</button><button type="button" class="secondary" data-ti-reset>Reset workflow</button></div></article>${done?`<article class="l412-ti-evidence"><b>Calculator evidence and IB communication</b><p>${esc(flow.evidence)}</p></article>`:''}</section>`;
 dock.querySelectorAll('[data-ti-mode]').forEach(b=>b.addEventListener('click',()=>{mode=b.dataset.tiMode;status='';render()}));
 dock.querySelectorAll('[data-ti-key]').forEach(b=>b.addEventListener('click',()=>press(b.dataset.tiKey)));
 dock.querySelector('[data-ti-advance]')?.addEventListener('click',advanceStep);
 dock.querySelector('[data-ti-back]')?.addEventListener('click',back);
 dock.querySelector('[data-ti-reset]')?.addEventListener('click',reset);
 }
function press(key){const step=currentStep(),wanted=step.keys[keyIndex];if(!wanted){status='This screen is output evidence. Read it, then write the decision and conclusion.';render();return}if(key!==wanted){status=`Check the route: the next key is [${wanted}].`;render();return}status='';keyIndex+=1;if(keyIndex>=step.keys.length){if(stepIndex<current().steps.length-1){stepIndex+=1;keyIndex=0}else status='Workflow complete.'}render()}
function advanceStep(){if(stepIndex<current().steps.length-1){stepIndex+=1;keyIndex=0;status=''}else status='Workflow complete.';render()}
function back(){if(keyIndex>0){keyIndex-=1}else if(stepIndex>0){stepIndex-=1;keyIndex=currentStep().keys.length?Math.max(0,currentStep().keys.length-1):0}status='';render()}
function reset(){stepIndex=0;keyIndex=0;status='';render()}
function setLaunchers(opened){$$('.l412-ti-route,.l412-ti-header').forEach(b=>{b.classList.toggle('is-active',opened);b.setAttribute('aria-pressed',String(opened))})}
function open(workflow){build();if(workflows[workflow]){active=workflow;stepIndex=0;keyIndex=0;status=''}previousFocus=document.activeElement;dock.classList.add('open');dock.setAttribute('aria-hidden','false');document.body.classList.add('l412-ti-open');document.body.style.setProperty('--l412-dock-width',`${dock.getBoundingClientRect().width}px`);setLaunchers(true);render();dock.querySelector('.l412-ti-close')?.focus()}
function close(){if(!dock)return;dock.classList.remove('open');dock.setAttribute('aria-hidden','true');document.body.classList.remove('l412-ti-open');document.body.style.removeProperty('--l412-dock-width');setLaunchers(false);previousFocus?.focus?.()}
function toggle(){dock?.classList.contains('open')?close():open(active)}
function installLaunchers(){const route=$('.routebar');if(route&&!$('.l412-ti-route',route)){const b=document.createElement('button');b.type='button';b.className='route-btn l412-ti-route';b.setAttribute('aria-controls','l412-ti-dock');b.setAttribute('aria-pressed','false');b.innerHTML='<span>84</span><b>TI‑84 Simulator</b>';b.addEventListener('click',toggle);route.append(b)}const actions=$('.header-actions');if(actions&&!$('.l412-ti-header',actions)){const b=document.createElement('button');b.type='button';b.className='icon-btn l412-ti-header';b.setAttribute('aria-controls','l412-ti-dock');b.setAttribute('aria-pressed','false');b.setAttribute('aria-label','Open TI-84 statistics simulator');b.title='TI-84 Statistics Simulator';b.innerHTML='<span>84</span>';b.addEventListener('click',toggle);actions.prepend(b)}}
function bindDirect(){$$('[data-l412-ti-open]').forEach(b=>{if(b.dataset.tiBound)return;b.dataset.tiBound='1';b.addEventListener('click',()=>open(b.dataset.l412TiOpen||'t-test'))})}
function init(){build();installLaunchers();bindDirect();const app=$('#app');if(app)new MutationObserver(()=>{installLaunchers();bindDirect()}).observe(app,{childList:true,subtree:true});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&dock?.classList.contains('open'))close()});document.addEventListener('click',e=>{const route=e.target.closest?.('[data-route]');if(route&&route.dataset.route!=='learn'&&dock?.classList.contains('open'))close()});window.addEventListener('resize',()=>{if(dock?.classList.contains('open'))document.body.style.setProperty('--l412-dock-width',`${dock.getBoundingClientRect().width}px`)});data.ti84Simulator={release:'2.0.0',model:'TI-84 Plus CE',provider:'ECHS local static workflow simulator',externalDependency:false,sideBySide:true,workflows:Object.keys(workflows)};window.ECHS_L412_TI84={open,close,workflows,reset}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
