(function(){
'use strict';

const data=window.LESSON_DATA;
if(!data||String(data.lesson?.number)!=='1.6')return;

const SIMULATOR_URL='https://ti84calc.com/ti84calc';
const STORAGE_KEY='echs:ib-ai:u1:1.6:ti84-classroom';
const $=(selector,root=document)=>root.querySelector(selector);
const $$=(selector,root=document)=>[...root.querySelectorAll(selector)];
const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const tex=value=>`<span class="ti84-inline-math" data-ti84-tex="${esc(value)}"></span>`;
const display=value=>`<div class="ti84-display-math" data-ti84-tex="${esc(value)}" data-ti84-display="1"></div>`;

const workflows={
  'system-2x2':{
    code:'A1',group:'Systems',title:'2×2 system · elimination and TI‑84 RREF',
    prompt:'Solve 2x + y = 11 and x − y = 1.',
    math:'\\begin{cases}2x+y=11\\\\x-y=1\\end{cases}',
    manualSteps:[
      'Write the equations in the same variable order: x, y.',
      'Add the equations: (2x+y)+(x−y)=11+1, so 3x=12.',
      'Therefore x=4. Substitute into x−y=1 to obtain y=3.',
      'State the ordered pair and verify it in both original equations.'
    ],
    tiSteps:[
      {keys:['2nd','x⁻¹'],label:'Open MATRIX',detail:'Use the MATRIX menu, then move to EDIT.'},
      {keys:['→','→','1'],label:'Edit matrix [A]',detail:'Choose [A] and set its dimensions to 2 rows by 3 columns.'},
      {keys:['2','ENTER','3','ENTER'],label:'Set 2×3 dimensions',detail:'The final column is the constants column.'},
      {keys:['2','1','11','1','−1','1'],label:'Enter the augmented matrix',detail:'Enter rows [2, 1 | 11] and [1, −1 | 1].'},
      {keys:['2nd','MODE'],label:'Return to the home screen',detail:'QUIT keeps matrix [A] stored.'},
      {keys:['2nd','x⁻¹','MATH','rref(','2nd','x⁻¹','[A]',')','ENTER'],label:'Calculate rref([A])',detail:'Read the last column of the reduced matrix.'}
    ],
    entry:'[A]=\\begin{bmatrix}2&1&11\\\\1&-1&1\\end{bmatrix}',
    output:'\\operatorname{rref}([A])=\\begin{bmatrix}1&0&4\\\\0&1&3\\end{bmatrix}',
    verification:'2(4)+3=11 and 4−3=1, so both residuals are zero.',
    ibStatement:'Using rref on the augmented matrix in the order x, y gives x=4 and y=3. Substitution satisfies both original equations, so (4,3) is the unique solution.',
    handheldAlternative:'Fast handheld route: APPS → PlySmlt2 → Simultaneous Eqn Solver → 2 equations → 2 unknowns → enter the same coefficient rows → SOLVE.'
  },
  'system-3x3':{
    code:'B1',group:'Systems',title:'3×3 contextual system · manual reduction and TI‑84',
    prompt:'An event sells 300 adult, student and child tickets. Adult tickets cost QAR 40, student tickets QAR 25 and child tickets QAR 15. Revenue is QAR 8700 and s=2c. Find a, s and c.',
    math:'\\begin{cases}a+s+c=300\\\\40a+25s+15c=8700\\\\s=2c\\end{cases}',
    manualSteps:[
      'Use s=2c in a+s+c=300 to obtain a+3c=300, hence a=300−3c.',
      'Substitute a=300−3c and s=2c into the revenue equation.',
      '40(300−3c)+25(2c)+15c=8700, so 12000−55c=8700.',
      'Thus c=60, s=120 and a=120. Check the total and revenue.'
    ],
    tiSteps:[
      {keys:['APPS'],label:'Open the applications list',detail:'On the handheld, choose PlySmlt2 if installed.'},
      {keys:['PlySmlt2'],label:'Choose Simultaneous Eqn Solver',detail:'Select 3 equations and 3 unknowns.'},
      {keys:['NEXT'],label:'Open the coefficient editor',detail:'Keep the variable order a, s, c in every row.'},
      {keys:['1','1','1','300'],label:'Enter row 1',detail:'a+s+c=300.'},
      {keys:['40','25','15','8700'],label:'Enter row 2',detail:'40a+25s+15c=8700.'},
      {keys:['0','1','−2','0'],label:'Enter row 3',detail:'s=2c becomes 0a+s−2c=0.'},
      {keys:['SOLVE'],label:'Solve and read a, s, c',detail:'The order shown matches the chosen variable order.'}
    ],
    entry:'\\begin{bmatrix}1&1&1&300\\\\40&25&15&8700\\\\0&1&-2&0\\end{bmatrix}',
    output:'a=120,\\qquad s=120,\\qquad c=60',
    verification:'120+120+60=300, 40(120)+25(120)+15(60)=8700 and 120=2(60).',
    ibStatement:'Solving the three-variable system in the order a, s, c gives (120,120,60). The values satisfy all three conditions, so the event sold 120 adult, 120 student and 60 child tickets.',
    handheldAlternative:'If PlySmlt2 is unavailable in the web simulator, enter the 3×4 augmented matrix and use rref([A]); students can still use PlySmlt2 on their physical TI‑84 Plus CE.'
  },
  'cubic-roots':{
    code:'C1',group:'Polynomials',title:'Cubic roots · factor manually and locate zeros on TI‑84',
    prompt:'Solve x³ − 4x² − x + 4 = 0.',
    math:'x^3-4x^2-x+4=0',
    manualSteps:[
      'Group the terms: x²(x−4)−1(x−4).',
      'Factor the common binomial: (x²−1)(x−4).',
      'Use the difference of squares: (x−1)(x+1)(x−4)=0.',
      'Therefore x=−1, 1 or 4. Substitute or expand to verify completeness.'
    ],
    tiSteps:[
      {keys:['Y='],label:'Open the function editor',detail:'Clear old functions first.'},
      {keys:['X³','−','4X²','−','X','+','4'],label:'Enter Y₁=x³−4x²−x+4',detail:'Use the X,T,θ,n key for x.'},
      {keys:['ZOOM','6'],label:'Use ZStandard',detail:'Check that all three intercepts are visible; widen the window if necessary.'},
      {keys:['2nd','TRACE','2:zero'],label:'Select zero',detail:'Choose a left bound, right bound and guess around the first intercept.'},
      {keys:['ENTER','ENTER','ENTER'],label:'Record the first zero',detail:'Repeat the zero command near each remaining intercept.'},
      {keys:['repeat'],label:'Audit the complete root list',detail:'A cubic must account for three roots counted with multiplicity.'}
    ],
    entry:'Y_1=x^3-4x^2-x+4',
    output:'x=-1,\\qquad x=1,\\qquad x=4',
    verification:'(x−4)(x−1)(x+1) expands to x³−4x²−x+4, and each reported value makes the polynomial zero.',
    ibStatement:'The TI‑84 zero command gives x=−1, 1 and 4. Factorization as (x−4)(x−1)(x+1) verifies all three roots and confirms the list is complete.',
    handheldAlternative:'Fast handheld route: APPS → PlySmlt2 → Polynomial Root Finder → ORDER 3 → enter coefficients 1, −4, −1, 4 → SOLVE.'
  },
  'exact-intersections':{
    code:'C2',group:'Graphs',title:'Two intersections · exact algebra and TI‑84 intersect',
    prompt:'Find the intersections of y=2x+1 and y=x²−3.',
    math:'2x+1=x^2-3',
    manualSteps:[
      'Set the functions equal: x²−3=2x+1.',
      'Rearrange to x²−2x−4=0.',
      'Use the quadratic formula: x=1±√5.',
      'Substitute into y=2x+1 to obtain the two exact intersection points.'
    ],
    tiSteps:[
      {keys:['Y='],label:'Enter both functions',detail:'Set Y₁=2x+1 and Y₂=x²−3.'},
      {keys:['ZOOM','6'],label:'Graph in a standard window',detail:'Confirm that both crossings are visible.'},
      {keys:['2nd','TRACE','5:intersect'],label:'Open Intersect',detail:'Select the first curve, the second curve and a guess near the left crossing.'},
      {keys:['ENTER','ENTER','ENTER'],label:'Record the left intersection',detail:'The calculator reports both x and y.'},
      {keys:['2nd','TRACE','5:intersect'],label:'Repeat near the right crossing',detail:'Move the guess near the second point before pressing ENTER.'}
    ],
    entry:'Y_1=2x+1,\\qquad Y_2=x^2-3',
    output:'(-1.236068,-1.472136)\\quad\\text{and}\\quad(3.236068,7.472136)',
    verification:'The x-values equal 1±√5 approximately, and each reported point satisfies both equations.',
    ibStatement:'Graphing Y₁=2x+1 and Y₂=x²−3 and applying Intersect near each crossing gives approximately (−1.236,−1.472) and (3.236,7.472). Algebra gives the exact x-values 1±√5.',
    handheldAlternative:'The graph method is the same on the physical TI‑84 Plus CE and the embedded simulator: Y= → ZOOM 6 → 2nd TRACE → Intersect.'
  },
  'numerical-intersection':{
    code:'C3',group:'Graphs',title:'Numerical model · graph, bracket and verify',
    prompt:'Solve 5x+12=80(0.9)^x for x≥0.',
    math:'5x+12=80(0.9)^x,\\qquad x\\ge0',
    manualSteps:[
      'Define h(x)=5x+12−80(0.9)^x and state the domain x≥0.',
      'Use a table or trial values to bracket a sign change between nearby x-values.',
      'A closed-form elementary solution is not expected; use technology to refine the root.',
      'Substitute the reported x-value into both sides and compare them.'
    ],
    tiSteps:[
      {keys:['Y='],label:'Enter the two model functions',detail:'Set Y₁=5x+12 and Y₂=80(0.9)^x.'},
      {keys:['WINDOW'],label:'Choose a contextual window',detail:'For example, use x from 0 to 15 and a y-range that contains both models.'},
      {keys:['GRAPH'],label:'Inspect the number of relevant crossings',detail:'Widen the window once to check that no other x≥0 intersection is hidden.'},
      {keys:['2nd','TRACE','5:intersect'],label:'Apply Intersect',detail:'Choose both curves and guess near the visible crossing.'},
      {keys:['ENTER','ENTER','ENTER'],label:'Record x and y with guard digits',detail:'Keep more digits than the final answer requires.'}
    ],
    entry:'Y_1=5x+12,\\qquad Y_2=80(0.9)^x,\\qquad 0\\le x\\le15',
    output:'x\\approx6.05443,\\qquad y\\approx42.2722',
    verification:'5(6.05443)+12≈42.2722 and 80(0.9)^6.05443≈42.2722, so the residual is close to zero.',
    ibStatement:'Using a graph window 0≤x≤15, the TI‑84 Intersect command gives x≈6.05443. Substitution makes both sides approximately 42.2722, so the non-negative solution is valid.',
    handheldAlternative:'The window and domain are part of the method. A screenshot without the entered functions and window does not communicate a reproducible solution.'
  },
  'rounded-rref':{
    code:'D1',group:'Verification',title:'Rounded solver output · exact elimination, RREF and residuals',
    prompt:'Solve 5x−2y=4 and 3x+y=13, then judge a six-decimal output.',
    math:'\\begin{cases}5x-2y=4\\\\3x+y=13\\end{cases}',
    manualSteps:[
      'From 3x+y=13, write y=13−3x.',
      'Substitute: 5x−2(13−3x)=4, so 11x=30 and x=30/11.',
      'Then y=13−90/11=53/11.',
      'Convert only at the end: x≈2.727273 and y≈4.818182.'
    ],
    tiSteps:[
      {keys:['2nd','x⁻¹','EDIT','[A]'],label:'Enter a 2×3 augmented matrix',detail:'Rows are [5, −2 | 4] and [3, 1 | 13].'},
      {keys:['2nd','MODE'],label:'Quit the editor',detail:'The matrix remains stored as [A].'},
      {keys:['2nd','x⁻¹','MATH','rref(','[A]',')'],label:'Calculate rref([A])',detail:'Read the exact or decimal values from the last column.'},
      {keys:['ENTER'],label:'Record guard digits',detail:'Do not round inside a later substitution.'},
      {keys:['HOME'],label:'Calculate both residuals',detail:'Evaluate 5x−2y−4 and 3x+y−13 using the stored values.'}
    ],
    entry:'[A]=\\begin{bmatrix}5&-2&4\\\\3&1&13\\end{bmatrix}',
    output:'x=\\frac{30}{11}\\approx2.727273,\\qquad y=\\frac{53}{11}\\approx4.818182',
    verification:'Using the six-decimal values, both residuals have magnitude below 5×10⁻⁷; the exact fractions satisfy both equations exactly.',
    ibStatement:'RREF gives x=30/11 and y=53/11, or approximately 2.727273 and 4.818182. Both residuals are negligible at six-decimal precision, confirming the rounded pair.',
    handheldAlternative:'Use exact fractions when the calculator displays them; retain guard digits when the question requires a decimal answer.'
  }
};

const slideWorkflow={
  'Opening problem · can every calculator answer be trusted?':'system-3x3',
  'Worked example · solve and verify a 2×2 system':'system-2x2',
  'Coefficient order is part of the mathematics':'system-3x3',
  'Worked example · all real roots of a cubic':'cubic-roots',
  'Worked example · exact intersections':'exact-intersections',
  'Student turn · numerical intersection and graph window':'numerical-intersection',
  'Worked example · verify a rounded system solution':'rounded-rref'
};

window.ECHS_TI84_CLASSROOM_WORKFLOWS=workflows;

let host=null;
let frame=null;
let previousFocus=null;
let activeId='system-2x2';
let mode='teacher';
let manualIndex=0;
let tiIndex=0;
let revealAnswer=false;
let frameLoaded=false;

function renderCoachMath(root){
  if(!window.katex)return;
  $$('[data-ti84-tex]',root).forEach(node=>{
    try{node.innerHTML=window.katex.renderToString(node.dataset.ti84Tex,{displayMode:node.dataset.ti84Display==='1',throwOnError:false,strict:'ignore'});}catch(_){node.textContent=node.dataset.ti84Tex;}
  });
}

function panel(){
  const element=document.createElement('section');
  element.id='ti84-classroom-coach';
  element.className='ti84-classroom-coach';
  element.setAttribute('aria-hidden','true');
  element.innerHTML=`<div class="ti84-coach-backdrop" data-ti84-close></div>
  <div class="ti84-coach-dialog" role="dialog" aria-modal="true" aria-labelledby="ti84-coach-title">
    <header class="ti84-coach-head">
      <div><span>ECHS · EXAM CALCULATOR TRAINING</span><h2 id="ti84-coach-title">TI‑84 Classroom Practice</h2><p>Manual mathematics first, then the exact calculator workflow, verification and IB communication.</p></div>
      <button type="button" data-ti84-close aria-label="Close TI-84 classroom practice">×</button>
    </header>
    <div class="ti84-coach-toolbar">
      <label><span>Paired example</span><select id="ti84-workflow-select"></select></label>
      <div class="ti84-mode-switch" role="group" aria-label="TI-84 classroom mode">
        <button type="button" class="active" data-ti84-mode="teacher">Teacher demo</button>
        <button type="button" data-ti84-mode="follow">Students follow</button>
        <button type="button" data-ti84-mode="drill">Exam drill</button>
      </div>
      <button type="button" class="ti84-reset" id="ti84-reset">Reset example</button>
    </div>
    <div class="ti84-coach-grid">
      <section class="ti84-method-panel" aria-label="Manual method">
        <div class="ti84-panel-label"><span>1</span><b>Manual mathematics</b></div>
        <div id="ti84-manual-content"></div>
      </section>
      <section class="ti84-procedure-panel" aria-label="TI-84 procedure">
        <div class="ti84-panel-label"><span>2</span><b>TI‑84 key sequence</b></div>
        <div id="ti84-procedure-content"></div>
      </section>
      <section class="ti84-simulator-panel" aria-label="TI-84 online simulator">
        <div class="ti84-panel-label"><span>3</span><b>Practise on the simulator</b></div>
        <div class="ti84-simulator-toolbar"><button type="button" id="ti84-load-simulator">Load simulator</button><a href="${SIMULATOR_URL}" target="_blank" rel="noopener noreferrer">Open in new tab ↗</a></div>
        <div class="ti84-simulator-stage" id="ti84-simulator-stage"><div class="ti84-simulator-placeholder"><b>TI‑84 Online Practice</b><span>Load the simulator, then mirror every projected step on the physical calculator in your hand.</span><small>Third-party tool hosted by ti84calc.com. Do not enter personal information.</small></div><iframe title="TI-84 online practice simulator used for classroom demonstration" src="about:blank" data-src="${SIMULATOR_URL}" loading="lazy" sandbox="allow-scripts allow-same-origin allow-forms allow-pointer-lock allow-popups allow-modals allow-downloads" allow="fullscreen; clipboard-read; clipboard-write" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></div>
      </section>
      <section class="ti84-evidence-panel" id="ti84-evidence-content" aria-label="Verification and IB conclusion"></section>
    </div>
  </div>`;
  return element;
}

function build(){
  if(host)return;
  host=panel();document.body.append(host);frame=$('iframe',host);
  const select=$('#ti84-workflow-select',host);
  Object.entries(workflows).forEach(([id,item])=>{
    const option=document.createElement('option');option.value=id;option.textContent=`${item.code} · ${item.title}`;select.append(option);
  });
  select.value=activeId;
  select.addEventListener('change',()=>setWorkflow(select.value));
  $$('[data-ti84-mode]',host).forEach(button=>button.addEventListener('click',()=>setMode(button.dataset.ti84Mode)));
  $$('[data-ti84-close]',host).forEach(node=>node.addEventListener('click',close));
  $('#ti84-reset',host).addEventListener('click',reset);
  $('#ti84-load-simulator',host).addEventListener('click',loadSimulator);
  frame.addEventListener('load',()=>{if(frameLoaded)$('#ti84-simulator-stage',host)?.classList.add('loaded');});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&host.classList.contains('open')){event.preventDefault();close();}});
  attachLaunchers();scanSlide();upgradeExistingResources();render();
}

function setWorkflow(id){
  if(!workflows[id])return;activeId=id;manualIndex=0;tiIndex=0;revealAnswer=false;
  const select=$('#ti84-workflow-select',host);if(select)select.value=id;
  save();render();
}
function setMode(value){
  mode=['teacher','follow','drill'].includes(value)?value:'teacher';manualIndex=0;tiIndex=0;revealAnswer=false;
  $$('[data-ti84-mode]',host).forEach(button=>button.classList.toggle('active',button.dataset.ti84Mode===mode));
  save();render();
}
function reset(){manualIndex=0;tiIndex=0;revealAnswer=false;save();render();}
function save(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify({activeId,mode,manualIndex,tiIndex}));}catch(_){}}
function restore(){try{const saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}');if(workflows[saved.activeId])activeId=saved.activeId;if(['teacher','follow','drill'].includes(saved.mode))mode=saved.mode;}catch(_){}}

function manualHTML(item){
  const visible=mode==='follow'?item.manualSteps.length:mode==='teacher'?manualIndex+1:revealAnswer?item.manualSteps.length:0;
  return `<div class="ti84-problem"><span>${esc(item.group)} · ${item.code}</span><h3>${esc(item.prompt)}</h3>${display(item.math)}</div>
  <div class="ti84-manual-steps">${item.manualSteps.map((step,index)=>`<article class="${index<visible?'revealed':'locked'}"><b>${index+1}</b><p>${index<visible?esc(step):'Complete this step on paper before revealing it.'}</p></article>`).join('')}</div>
  <div class="ti84-step-controls"><button type="button" id="ti84-manual-prev" ${manualIndex===0?'disabled':''}>Previous</button><button type="button" id="ti84-manual-next" ${manualIndex>=item.manualSteps.length-1?'disabled':''}>Reveal next manual step</button></div>`;
}

function procedureHTML(item){
  const visible=mode==='drill'&&!revealAnswer?0:tiIndex+1;
  const current=item.tiSteps[Math.min(tiIndex,item.tiSteps.length-1)];
  return `<div class="ti84-current-instruction"><span>STEP ${tiIndex+1} OF ${item.tiSteps.length}</span><h3>${esc(current.label)}</h3><p>${mode==='drill'&&!revealAnswer?'Choose the required keys on your physical calculator before revealing the route.':esc(current.detail)}</p></div>
  <div class="ti84-key-sequence">${item.tiSteps.map((step,index)=>`<article class="${index===tiIndex?'current':''} ${index<visible?'revealed':'locked'}"><div class="ti84-key-row">${index<visible?step.keys.map(key=>`<kbd>${esc(key)}</kbd>`).join('<i>→</i>'):'<span class="ti84-hidden-route">key route hidden</span>'}</div><b>${index<visible?esc(step.label):`Step ${index+1}`}</b></article>`).join('')}</div>
  <div class="ti84-entry-card"><span>Calculator entry</span>${mode==='drill'&&!revealAnswer?'<b>Hidden during exam drill</b>':display(item.entry)}</div>
  <div class="ti84-step-controls"><button type="button" id="ti84-ti-prev" ${tiIndex===0?'disabled':''}>Previous key step</button><button type="button" id="ti84-ti-next" ${tiIndex>=item.tiSteps.length-1?'disabled':''}>Next key step</button></div>
  <div class="ti84-alt-route"><b>Handheld shortcut or note</b><p>${esc(item.handheldAlternative)}</p></div>`;
}

function evidenceHTML(item){
  const show=mode!=='drill'||revealAnswer;
  return `<div class="ti84-evidence-flow"><article><span>Expected output</span>${show?display(item.output):'<b>Hidden until the drill is complete</b>'}</article><article><span>Independent verification</span><p>${show?esc(item.verification):'Verify with substitution, exact algebra or residuals before revealing.'}</p></article><article class="ib"><span>IB exam communication</span><p>${show?esc(item.ibStatement):'Write a complete calculator-supported conclusion in your own words.'}</p></article></div><div class="ti84-evidence-actions">${mode==='drill'?'<button type="button" id="ti84-reveal-answer">Reveal output and model statement</button>':''}<button type="button" id="ti84-copy-statement" ${show?'':'disabled'}>Copy model statement</button></div>`;
}

function bindRendered(item){
  $('#ti84-manual-content',host).innerHTML=manualHTML(item);
  $('#ti84-procedure-content',host).innerHTML=procedureHTML(item);
  $('#ti84-evidence-content',host).innerHTML=evidenceHTML(item);
  $('#ti84-manual-prev',host)?.addEventListener('click',()=>{manualIndex=Math.max(0,manualIndex-1);save();render();});
  $('#ti84-manual-next',host)?.addEventListener('click',()=>{manualIndex=Math.min(item.manualSteps.length-1,manualIndex+1);save();render();});
  $('#ti84-ti-prev',host)?.addEventListener('click',()=>{tiIndex=Math.max(0,tiIndex-1);save();render();});
  $('#ti84-ti-next',host)?.addEventListener('click',()=>{tiIndex=Math.min(item.tiSteps.length-1,tiIndex+1);save();render();});
  $('#ti84-reveal-answer',host)?.addEventListener('click',()=>{revealAnswer=true;render();});
  $('#ti84-copy-statement',host)?.addEventListener('click',async event=>{try{await navigator.clipboard.writeText(item.ibStatement);event.currentTarget.textContent='Copied';}catch(_){event.currentTarget.textContent='Copy unavailable';}});
  renderCoachMath(host);
}
function render(){if(!host)return;bindRendered(workflows[activeId]);}

function loadSimulator(){
  if(!frame)return;frameLoaded=true;$('#ti84-simulator-stage',host)?.classList.add('loading');frame.src=frame.dataset.src;
  const button=$('#ti84-load-simulator',host);if(button)button.textContent='Reload simulator';
  setTimeout(()=>$('#ti84-simulator-stage',host)?.classList.remove('loading'),9000);
}

function open(id=activeId){
  build();if(workflows[id])setWorkflow(id);previousFocus=document.activeElement;host.classList.add('open');host.setAttribute('aria-hidden','false');document.body.classList.add('ti84-coach-open');$('[data-ti84-close]',host)?.focus();
}
function close(){if(!host)return;host.classList.remove('open');host.setAttribute('aria-hidden','true');document.body.classList.remove('ti84-coach-open');previousFocus?.focus?.();}

function attachLaunchers(){
  const routebar=$('.routebar');
  if(routebar&&!$('.ti84-classroom-launch',routebar)){
    const button=document.createElement('button');button.type='button';button.className='ti84-classroom-launch';button.innerHTML='<span>84</span><b>TI‑84 Classroom</b>';button.addEventListener('click',()=>open());routebar.append(button);
  }
}

function scanSlide(){
  const app=$('#app');if(!app)return;
  const title=$('.slide-title',app)?.textContent?.trim();const workflowId=slideWorkflow[title];
  const body=$('.slide-body',app);if(!workflowId||!body||$('.ti84-paired-strip',body))return;
  const item=workflows[workflowId];const strip=document.createElement('aside');strip.className='ti84-paired-strip';strip.innerHTML=`<div><span>PAIRED EXAM PRACTICE</span><b>Manual method + physical TI‑84 workflow</b><small>Project the steps, then students mirror them on the calculator in their hands.</small></div><button type="button"><i>84</i> Open ${esc(item.code)} classroom demo</button>`;
  strip.querySelector('button').addEventListener('click',()=>open(workflowId));body.append(strip);
}

function upgradeExistingResources(){
  const route=$('.gdc-route-resource');if(route){route.innerHTML='<span>▣</span> TI‑84 Simulator';route.setAttribute('title','Open the embedded TI-84 simulator and official resources');}
  const heading=$('.gdc-external-head h2');if(heading)heading.textContent='TI‑84 Simulator & Official TI Tools';
  const guidance=$('.gdc-guidance-grid');if(guidance){guidance.innerHTML=`<article><span>1</span><div><b>Solve manually first</b><p>Students write the algebraic structure before touching the calculator.</p></div></article><article><span>2</span><div><b>Mirror the projected TI‑84 route</b><p>The teacher advances one key step while students reproduce it on their physical calculators.</p></div></article><article><span>3</span><div><b>Verify independently</b><p>Substitute, factor, compare both sides or calculate residuals.</p></div></article><article><span>4</span><div><b>Write the IB conclusion</b><p>Record the entered objects, settings, complete output, verification and contextual meaning.</p></div></article>`;}
  const guidanceButton=$('#gdc-guidance-return');if(guidanceButton){guidanceButton.textContent='Open TI‑84 Classroom Practice';guidanceButton.onclick=()=>{document.querySelector('[data-external-close]')?.click();open();};}
}

function init(){
  restore();build();
  new MutationObserver(()=>{attachLaunchers();scanSlide();upgradeExistingResources();}).observe(document.body,{childList:true,subtree:true});
  document.addEventListener('echs:ti84:open',event=>open(event.detail?.workflow));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();

data.ti84Classroom={
  release:'6.2.0',simulator:SIMULATOR_URL,workflowCount:Object.keys(workflows).length,
  modes:['teacher','follow','drill'],pairedMethod:'manual → TI-84 → verify → IB conclusion',
  mappedSlides:Object.keys(slideWorkflow),thirdPartySimulator:true,physicalCalculatorPractice:true,
  officialBasis:['TI-84 Plus CE eGuide','PlySmlt2 example activities','TI-84 graph and matrix workflows']
};
})();
