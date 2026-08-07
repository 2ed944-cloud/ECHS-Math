(function(){
'use strict';

const data=window.LESSON_DATA;
const lesson=String(data&&data.lesson&&data.lesson.number||'');
if(!/^1\.[2-6]$/.test(lesson)||typeof document==='undefined')return;

const builtins={
'1.2':[
{
code:'A1',group:'Sequence tables',title:'Arithmetic sequence table on TI‑84',
prompt:'Generate the terms of u_n=7+4(n-1), then verify u_4.',
math:'u_n=7+4(n-1)',
manualSteps:[
'Identify the independent variable as the integer term number n.',
'Use the explicit rule u_n=7+4(n-1).',
'Predict that every table row should increase by 4 before opening the calculator.'
],
tiSteps:[
{keys:['Y='],label:'Open the function editor',detail:'Clear an old Y₁ entry if one is active.'},
{keys:['7','+','4','(','X','−','1',')'],label:'Enter Y₁=7+4(X−1)',detail:'Use X in place of the term number n.'},
{keys:['2nd','WINDOW (TBLSET)'],label:'Open table settings',detail:'Set TblStart=1 and ΔTbl=1 so the table matches n=1,2,3,….'},
{keys:['2nd','GRAPH (TABLE)'],label:'Read the sequence table',detail:'Read Y₁ values only at integer X-values.'},
{keys:['↓ to X=4'],label:'Verify the requested term',detail:'The row X=4 should show Y₁=19.'}
],
entry:'Y_1=7+4(X-1),\\quad TblStart=1,\\ \\Delta Tbl=1',
output:'7,\\ 11,\\ 15,\\ 19,\\ldots',
verification:'u_4=7+4(3)=19, matching the table.',
ibStatement:'The TI‑84 table confirms the generated terms, while the explicit formula establishes the arithmetic model.'
},
{
code:'A2',group:'Sequence tables',title:'Locate a term and audit integer indexing',
prompt:'For u_n=5+3(n-1), use TABLE to find u_12 and decide whether 37 is a term.',
math:'u_n=5+3(n-1)',
manualSteps:[
'Term numbers are discrete integers beginning at n=1.',
'Compute u_12 directly as a check.',
'For membership, solve 5+3(n-1)=37 and inspect whether n is an integer.'
],
tiSteps:[
{keys:['Y='],label:'Enter the rule',detail:'Set Y₁=5+3(X−1).'},
{keys:['2nd','WINDOW (TBLSET)'],label:'Use an integer table',detail:'Set TblStart=1 and ΔTbl=1.'},
{keys:['2nd','GRAPH (TABLE)'],label:'Inspect the rows',detail:'Move to X=12 to read u₁₂.'},
{keys:['scan for 37'],label:'Test membership',detail:'If no integer row produces 37, it is not a term of the sequence.'}
],
entry:'Y_1=5+3(X-1)',
output:'u_{12}=38;\\quad 37\\text{ does not occur at an integer term number}',
verification:'5+3(11)=38, and 5+3(n-1)=37 gives n=35/3, not an integer.',
ibStatement:'A calculator table is useful for inspection, but membership still depends on an integer term number.'
},
{
code:'A3',group:'Finite sums',title:'Finite arithmetic sum with seq( and sum(',
prompt:'Evaluate Σ from k=1 to 40 of 5+3(k-1) and avoid the indexing trap.',
math:'\\sum_{k=1}^{40}(5+3(k-1))',
manualSteps:[
'There are exactly 40 terms because the index runs from 1 through 40.',
'The first term is 5 and the common difference is 3.',
'Predict a total near 2500 before evaluating.'
],
tiSteps:[
{keys:['2nd','STAT (LIST)','OPS','seq('],label:'Build the list of terms',detail:'Use seq(5+3(X−1),X,1,40).'},
{keys:['2nd','STAT (LIST)','MATH','sum('],label:'Sum the generated list',detail:'Evaluate sum(seq(5+3(X−1),X,1,40)).'},
{keys:['ENTER'],label:'Read the total',detail:'The calculator should return 2540.'},
{keys:['change lower bound to 0'],label:'Demonstrate the trap',detail:'Starting at 0 creates an unintended extra term and changes the total.'}
],
entry:'sum(seq(5+3(X-1),X,1,40))',
output:'2540',
verification:'S_{40}=\\frac{40}{2}[2(5)+39(3)]=2540.',
ibStatement:'The calculator sum is accepted only after the index bounds and the independent arithmetic-series formula agree.'
},
{
code:'A4',group:'Thresholds',title:'First integer stage above a threshold',
prompt:'A theatre has 18 seats in row 1 and 3 more seats in each new row. Find the first row with more than 70 seats.',
math:'u_n=18+3(n-1)>70',
manualSteps:[
'Solve the inequality approximately to locate the boundary.',
'Because n is a row number, the final answer must be an integer.',
'Verify the two adjacent rows around the boundary.'
],
tiSteps:[
{keys:['Y='],label:'Enter the row model',detail:'Set Y₁=18+3(X−1).'},
{keys:['2nd','WINDOW (TBLSET)'],label:'Set integer rows',detail:'Use TblStart near 16 and ΔTbl=1, or start at 1.'},
{keys:['2nd','GRAPH (TABLE)'],label:'Locate the first value above 70',detail:'Compare the rows around the threshold.'},
{keys:['X=18','X=19'],label:'Audit adjacent rows',detail:'Read 69 at row 18 and 72 at row 19.'}
],
entry:'Y_1=18+3(X-1)',
output:'u_{18}=69,\\quad u_{19}=72',
verification:'69\\le70<72, so row 19 is the first qualifying row.',
ibStatement:'The first row with more than 70 seats is row 19; a decimal crossing would not be a valid row number.'
}
],
'1.3':[
{
code:'B1',group:'Geometric tables',title:'Discrete geometric sequence table',
prompt:'Generate u_n=120(0.86)^(n-1) and inspect the first five stages.',
math:'u_n=120(0.86)^{n-1}',
manualSteps:[
'Interpret 0.86 as retaining 86%, or a 14% decrease per stage.',
'The first recorded stage is n=1, so the exponent is n−1.',
'Expect every successive value to be 0.86 times the previous value.'
],
tiSteps:[
{keys:['Y='],label:'Enter the model',detail:'Set Y₁=120(0.86)^(X−1).'},
{keys:['2nd','WINDOW (TBLSET)'],label:'Set TblStart=1 and ΔTbl=1',detail:'This preserves the discrete stage numbering.'},
{keys:['2nd','GRAPH (TABLE)'],label:'Read the first five rows',detail:'Use only integer X values as sequence stages.'}
],
entry:'Y_1=120(0.86)^{X-1}',
output:'120,\\ 103.2,\\ 88.752,\\ 76.32672,\\ 65.6409792',
verification:'103.2/120=0.86 and 88.752/103.2=0.86.',
ibStatement:'The table shows a constant ratio of 0.86 between recorded stages, consistent with the geometric model.'
},
{
code:'B2',group:'Powers',title:'Large powers and guard digits',
prompt:'Calculate 8500(1.037)^18 and report an appropriate rounded value.',
math:'8500(1.037)^{18}',
manualSteps:[
'The factor 1.037 represents repeated 3.7% growth.',
'Estimate that the final value must exceed 8500.',
'Keep full calculator precision until the final rounding step.'
],
tiSteps:[
{keys:['8500','×','(','1.037',')','^','18'],label:'Enter the model in one line',detail:'Keep the growth factor in parentheses.'},
{keys:['ENTER'],label:'Evaluate',detail:'Retain the full display for later calculations.'}
],
entry:'8500(1.037)^{18}',
output:'16346.9427149\\ldots',
verification:'The value is larger than 8500 and agrees with repeated multiplication by 1.037.',
ibStatement:'The model gives approximately 16,346.94; intermediate rounding was avoided.'
},
{
code:'B3',group:'Finite sums',title:'Geometric sigma sum with correct bounds',
prompt:'Evaluate Σ from k=0 to 24 of 600(1.025)^k.',
math:'\\sum_{k=0}^{24}600(1.025)^k',
manualSteps:[
'The bounds 0 through 24 contain 25 terms.',
'The k=0 term is 600 and must not be omitted.',
'Use the geometric-series formula as an independent check.'
],
tiSteps:[
{keys:['2nd','STAT (LIST)','OPS','seq('],label:'Generate the terms',detail:'Use seq(600(1.025)^X,X,0,24).'},
{keys:['2nd','STAT (LIST)','MATH','sum('],label:'Sum the list',detail:'Evaluate sum(seq(600(1.025)^X,X,0,24)).'},
{keys:['ENTER'],label:'Record guard digits',detail:'The result is approximately 20494.65836.'}
],
entry:'sum(seq(600(1.025)^X,X,0,24))',
output:'20494.6583597\\ldots',
verification:'600\\frac{1-1.025^{25}}{1-1.025}=20494.6583597\\ldots',
ibStatement:'The sum is approximately 20,494.66, and the bounds correctly include the initial 600.'
},
{
code:'B4',group:'Thresholds',title:'Logarithmic threshold then integer verification',
prompt:'For P_n=15000(0.82)^n, find the first integer n for which P_n<1000.',
math:'15000(0.82)^n<1000',
manualSteps:[
'First locate the continuous crossing with logarithms.',
'Because 0.82<1, the model decreases as n increases.',
'Then test the adjacent integer stages.'
],
tiSteps:[
{keys:['LOG','(','1000','÷','15000',')','÷','LOG','(','0.82',')'],label:'Estimate the crossing',detail:'The calculator gives n≈13.6459.'},
{keys:['Y='],label:'Enter Y₁=15000(0.82)^X',detail:'Use the table to inspect the nearby integer stages.'},
{keys:['2nd','GRAPH (TABLE)'],label:'Check n=13 and n=14',detail:'Read both values before deciding.'}
],
entry:'LOG(1000/15000)/LOG(0.82)',
output:'n\\approx13.64594;\\quad P_{13}\\approx1136.77,\\ P_{14}\\approx932.15',
verification:'P_{13}\\ge1000 and P_{14}<1000.',
ibStatement:'The continuous crossing is between 13 and 14, so the first discrete stage below 1000 is n=14.'
},
{
code:'B5',group:'Decision making',title:'A decimal calculator answer is not always the contextual answer',
prompt:'A solver returns n=13.42 in a discrete decay problem. Decide what to report.',
math:'n\\text{ counts completed stages}',
manualSteps:[
'Identify whether the variable is continuous time or a discrete stage number.',
'Use the decimal only to locate the neighboring integers.',
'Check both adjacent stages and state the first one satisfying the condition.'
],
tiSteps:[
{keys:['TABLE'],label:'Inspect neighboring integer stages',detail:'Use n=13 and n=14 rather than rounding blindly.'},
{keys:['compare condition'],label:'Apply the original inequality',detail:'The first stage satisfying the condition is the contextual answer.'}
],
entry:'n\\approx13.42\\quad\\Rightarrow\\quad test\\ n=13,14',
output:'Report the first valid integer stage, not 13.42 stages.',
verification:'Minimality is established only by checking the adjacent integer values.',
ibStatement:'Technology locates the crossing; mathematical interpretation determines the discrete answer.'
}
],
'1.5':[
{
code:'C1',group:'Logarithms',title:'LOG, LN and change of base',
prompt:'Evaluate log_2(19) and explain why LOG and LN both work.',
math:'\\log_2(19)=\\frac{\\log(19)}{\\log(2)}=\\frac{\\ln(19)}{\\ln(2)}',
manualSteps:[
'LOG means base 10 and LN means base e on the TI‑84.',
'For another base, use the change-of-base identity.',
'Use the same base in numerator and denominator.'
],
tiSteps:[
{keys:['LOG','19',')','÷','LOG','2',')'],label:'Use common logarithms',detail:'Evaluate LOG(19)/LOG(2).'},
{keys:['LN','19',')','÷','LN','2',')'],label:'Cross-check with natural logs',detail:'The result should be identical to calculator precision.'}
],
entry:'LOG(19)/LOG(2)',
output:'4.247927513\\ldots',
verification:'2^{4.247927513}\\approx19.',
ibStatement:'Using change of base gives log₂(19)≈4.24793; LOG and LN agree because the same base is used in the ratio.'
},
{
code:'C2',group:'Exponential equations',title:'Solve an exponential equation with logarithms',
prompt:'Solve 3^x=17.',
math:'x=\\frac{\\ln17}{\\ln3}',
manualSteps:[
'Take logarithms of both sides.',
'Use the power rule to bring x in front of the logarithm.',
'Divide by ln 3 and retain guard digits.'
],
tiSteps:[
{keys:['LN','17',')','÷','LN','3',')'],label:'Enter the exact logarithmic expression',detail:'Do not round ln17 or ln3 separately.'},
{keys:['ENTER'],label:'Read x',detail:'The calculator gives x≈2.578901923.'}
],
entry:'LN(17)/LN(3)',
output:'x\\approx2.578901923',
verification:'3^{2.578901923}\\approx17.',
ibStatement:'The solution is x≈2.579, verified by substitution into the original exponential equation.'
},
{
code:'C3',group:'Graph intersections',title:'Find both solutions of 2^x=5x',
prompt:'Solve 2^x=5x and make sure the graph window does not hide a solution.',
math:'2^x=5x',
manualSteps:[
'Recognize that this equation may have more than one real solution.',
'Graph both sides and inspect the number of crossings before using Intersect.',
'Use a window wide enough to show both positive crossings.'
],
tiSteps:[
{keys:['Y='],label:'Enter both sides',detail:'Set Y₁=2^X and Y₂=5X.'},
{keys:['WINDOW'],label:'Choose a useful window',detail:'For example Xmin=0, Xmax=6; choose a Y-range that contains both curves.'},
{keys:['GRAPH'],label:'Count visible intersections',detail:'Confirm two crossings are visible.'},
{keys:['2nd','TRACE','5:intersect'],label:'Find the first intersection',detail:'Select both curves and guess near the left crossing.'},
{keys:['2nd','TRACE','5:intersect'],label:'Repeat for the second intersection',detail:'Move the guess near the right crossing.'}
],
entry:'Y_1=2^X,\\qquad Y_2=5X',
output:'x\\approx0.2354557101\\quad\\text{and}\\quad x\\approx4.488001136',
verification:'Substitution makes 2^x and 5x agree at both reported values.',
ibStatement:'The graph has two real intersections, so the solutions are x≈0.23546 and x≈4.48800.'
},
{
code:'C4',group:'Log domain',title:'Reject an algebraic candidate outside a logarithm domain',
prompt:'Solve log(x−1)+log(x−3)=1 and check the domain.',
math:'\\log(x-1)+\\log(x-3)=1',
manualSteps:[
'The original logarithms require x>3.',
'Combine the logarithms: log((x−1)(x−3))=1.',
'Solve (x−1)(x−3)=10, then reject any candidate outside x>3.'
],
tiSteps:[
{keys:['Y='],label:'Graph the logarithmic side and y=1',detail:'Set Y₁=LOG(X−1)+LOG(X−3), Y₂=1.'},
{keys:['WINDOW'],label:'Use a window with X>3 visible',detail:'The graph itself is undefined where the logarithm arguments are non-positive.'},
{keys:['2nd','TRACE','5:intersect'],label:'Locate the valid crossing',detail:'Record the intersection with guard digits.'}
],
entry:'Y_1=LOG(X-1)+LOG(X-3),\\qquad Y_2=1',
output:'x=2+\\sqrt{11}\\approx5.31662479',
verification:'x=2−√11 is invalid because x<3; the valid candidate makes both logarithm arguments positive.',
ibStatement:'Only x≈5.31662 is valid because the second algebraic candidate lies outside the logarithm domain.'
},
{
code:'C5',group:'Thresholds',title:'Exponential decay threshold with integer-stage check',
prompt:'Find the first integer n for which 84(0.78)^n<15.',
math:'84(0.78)^n<15',
manualSteps:[
'Use logarithms to locate the continuous threshold.',
'Because n counts completed stages, do not report the decimal crossing.',
'Check the adjacent integer stages.'
],
tiSteps:[
{keys:['LOG','(','15','÷','84',')','÷','LOG','(','0.78',')'],label:'Find the continuous crossing',detail:'The calculator gives n≈6.93374.'},
{keys:['Y='],label:'Enter Y₁=84(0.78)^X',detail:'Use TABLE to inspect n=6 and n=7.'},
{keys:['2nd','GRAPH (TABLE)'],label:'Verify the first integer stage',detail:'Read approximately 18.9168 at n=6 and 14.7551 at n=7.'}
],
entry:'LOG(15/84)/LOG(0.78)',
output:'n\\approx6.93374;\\quad P_6\\approx18.9168,\\ P_7\\approx14.7551',
verification:'P_6\\ge15 and P_7<15.',
ibStatement:'The first integer stage below 15 is n=7.'
}
]
};

const legacyMap=()=>{
  if(lesson==='1.4'&&window.ECHS_TI84_FINANCE_WORKFLOWS)return Object.values(window.ECHS_TI84_FINANCE_WORKFLOWS);
  if(lesson==='1.6'&&window.ECHS_TI84_CLASSROOM_WORKFLOWS)return Object.values(window.ECHS_TI84_CLASSROOM_WORKFLOWS);
  return null;
};
const flows=legacyMap()||builtins[lesson]||[];

const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const keysMarkup=keys=>(keys||[]).map(k=>`<kbd>${esc(k)}</kbd>`).join('<i aria-hidden="true">→</i>');

function renderMath(root){
  try{
    if(window.renderMathInElement){
      window.renderMathInElement(root,{delimiters:[
        {left:'$$',right:'$$',display:true},{left:'\\[',right:'\\]',display:true},
        {left:'\\(',right:'\\)',display:false},{left:'$',right:'$',display:false}
      ],throwOnError:false});
    }
  }catch(_){}
}

function normalized(flow,index){
  return {
    code:flow.code||`T${index+1}`,
    group:flow.group||'Calculator training',
    title:flow.title||`Training ${index+1}`,
    prompt:flow.prompt||flow.problem||'',
    math:flow.math||'',
    manualSteps:flow.manualSteps||[],
    tiSteps:flow.tiSteps||[],
    entry:flow.entry||'',
    output:flow.output||'',
    verification:flow.verification||flow.verify||'',
    ibStatement:flow.ibStatement||flow.interpret||'',
    handheldAlternative:flow.handheldAlternative||''
  };
}

function sectionMarkup(){
  const section=document.createElement('section');
  section.className='gdc8-classroom';
  section.innerHTML=`
    <header class="gdc8-head">
      <div>
        <span>GDC CLASSROOM TRAINING · LESSON ${esc(lesson)}</span>
        <h3>Physical TI‑84 steps for several classroom problems</h3>
        <p>Choose a problem, model it manually, follow the calculator keys, read the output, then verify and write an IB conclusion.</p>
      </div>
      <div class="gdc8-head-actions">
        <button type="button" class="gdc8-prev" aria-label="Previous calculator training">←</button>
        <button type="button" class="gdc8-next" aria-label="Next calculator training">→</button>
      </div>
    </header>
    <div class="gdc8-picker">
      <label>Calculator training problem
        <select class="gdc8-select">${flows.map((f,i)=>`<option value="${i}">${esc((f.code||`T${i+1}`)+' · '+f.title)}</option>`).join('')}</select>
      </label>
      <button type="button" class="gdc-v7-simulator gdc8-open-sim">Open TI‑84 Simulator beside slide</button>
    </div>
    <div class="gdc8-body"></div>`;
  return section;
}

function render(section,index){
  if(!flows.length)return;
  const select=section.querySelector('.gdc8-select');
  const i=Math.max(0,Math.min(flows.length-1,Number(index??select.value??0)));
  select.value=String(i);
  const f=normalized(flows[i],i);
  const body=section.querySelector('.gdc8-body');
  body.innerHTML=`
    <div class="gdc8-problem">
      <div class="gdc8-tags"><span>${esc(f.code)}</span><span>${esc(f.group)}</span><span>${i+1} / ${flows.length}</span></div>
      <h4>${esc(f.title)}</h4>
      <p>${esc(f.prompt)}</p>
      ${f.math?`<div class="gdc8-math">\\(${f.math}\\)</div>`:''}
    </div>
    <div class="gdc8-columns">
      <section class="gdc8-manual">
        <h5>1 · MODEL / MANUAL PLAN</h5>
        <ol>${f.manualSteps.map(s=>`<li>${esc(s)}</li>`).join('')}</ol>
      </section>
      <section class="gdc8-ti">
        <h5>2 · TI‑84 KEY ROUTE</h5>
        <div class="gdc8-ti-steps">${f.tiSteps.map((s,j)=>`
          <article>
            <b>${j+1}</b>
            <div>
              <h6>${esc(s.label||'Calculator step')}</h6>
              <div class="gdc8-keys">${keysMarkup(s.keys)}</div>
              <p>${esc(s.detail||'')}</p>
            </div>
          </article>`).join('')}</div>
      </section>
    </div>
    <div class="gdc8-evidence">
      ${f.entry?`<article><span>ENTER</span><div>\\(${f.entry}\\)</div></article>`:''}
      ${f.output?`<article class="gdc8-output"><span>READ</span><div class="gdc8-output-value" hidden>\\(${f.output}\\)</div><button type="button" class="gdc8-reveal-output">Reveal calculator output</button></article>`:''}
      ${f.verification?`<article><span>VERIFY</span><p>${esc(f.verification)}</p></article>`:''}
      ${f.ibStatement?`<article class="gdc8-ib"><span>IB CONCLUSION</span><p>${esc(f.ibStatement)}</p></article>`:''}
    </div>
    ${f.handheldAlternative?`<aside class="gdc8-alt"><b>Physical calculator note</b><p>${esc(f.handheldAlternative)}</p></aside>`:''}`;
  body.querySelector('.gdc8-reveal-output')?.addEventListener('click',e=>{
    const value=body.querySelector('.gdc8-output-value');
    const hidden=value.hidden;
    value.hidden=!hidden;
    e.currentTarget.textContent=hidden?'Hide calculator output':'Reveal calculator output';
    if(hidden)renderMath(value);
  });
  renderMath(body);
}

function mount(){
  const shell=document.querySelector('.gdc-v7-shell');
  if(!shell||shell.querySelector('.gdc8-classroom')||!flows.length)return;
  const section=sectionMarkup();
  const workspace=shell.querySelector('.gdc-v7-workspace');
  (workspace||shell.querySelector('footer'))?.insertAdjacentElement(workspace?'afterend':'beforebegin',section);
  const select=section.querySelector('.gdc8-select');
  select.addEventListener('change',()=>render(section,select.value));
  section.querySelector('.gdc8-prev').addEventListener('click',()=>render(section,(Number(select.value)-1+flows.length)%flows.length));
  section.querySelector('.gdc8-next').addEventListener('click',()=>render(section,(Number(select.value)+1)%flows.length));
  render(section,0);
}

const observer=new MutationObserver(()=>mount());
if(document.body)observer.observe(document.body,{childList:true,subtree:true});
document.addEventListener('click',e=>{
  if(e.target.closest?.('.gdc-v7-open,.gdc-v7-launch'))setTimeout(mount,0);
});
data.gdcClassroomTrainingV8={
  release:'8.0.0',
  lesson,
  workflowCount:flows.length,
  restoredLegacyTraining:['1.4','1.6'].includes(lesson),
  classroomPattern:'model → physical TI-84 keys → read → verify → IB conclusion',
  simulatorBesideSlide:true
};
})();