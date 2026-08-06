(function(){
'use strict';
const data=window.LESSON_DATA;
if(!data||String(data.lesson?.number)!=='1.1'||!Array.isArray(data.slides))return;
const RELEASE='6.4.0';
const allMode=new URLSearchParams(location.search||'').get('scope')==='all';
const clone=v=>JSON.parse(JSON.stringify(v));
const text=v=>{try{return JSON.stringify(v).replace(/\\\\/g,'\\');}catch(_){return String(v??'');}};
const originalLesson=clone(data.lesson);

const isComplex=s=>/complex|imaginary|\\mathbb\s*C|ℂ/i.test(`${s.title||''} ${s.html||''}`);
const isNumberSet=s=>String(s.section||'')==='Number sets'||/number[- ]set|smallest[- ]set|classif(?:y|ication)|natural numbers and integers|rational numbers and decimal|irrational and real|complex numbers beyond/i.test(String(s.title||''));
data.slides.forEach((s,i)=>{
  s.canonicalIndex=i;s.originalSection=s.originalSection||s.section||'';s.originalTitle=s.originalTitle||s.title||'';
  s.scope='core';s.classification='Core';s.scopeReason='Current IB AI SL core pathway.';
  if(isNumberSet(s)){
    s.scope='extension';s.classification=isComplex(s)?'Extension':'Prerequisite review';
    s.scopeReason=isComplex(s)?'Complex-number classification is beyond the required AI SL content for this lesson.':'Optional prerequisite revision; excluded from default mastery.';
    s.section=isComplex(s)?'Extension · Beyond AI SL':'Extension · Prerequisite review';
    s.eyebrow=isComplex(s)?'OPTIONAL EXTENSION · NOT REQUIRED FOR AI SL 1.1/1.6':'OPTIONAL REVISION · DOES NOT COUNT TOWARDS CORE MASTERY';
    s.extensionPlacement='prerequisite';
  }
});

const order=data.slides.find(s=>s.title==='Order of magnitude · state the convention');
if(order){
  const ext=clone(order);ext.canonicalIndex=`${order.canonicalIndex}-extension`;ext.originalSection=order.originalSection;ext.originalTitle=order.originalTitle;
  ext.section='Extension · Scale conventions';ext.title='Extension · nearest-power order of magnitude';ext.eyebrow='OPTIONAL EXTENSION · USE ONLY WHEN THE QUESTION DEFINES THIS CONVENTION';
  ext.scope='extension';ext.classification='Extension';ext.scopeReason='The nearest-power convention and its √10 threshold are enrichment, not a prerequisite for the core SL 1.1 calculation pathway.';ext.extensionPlacement='after-scale';
  order.title='Order of magnitude · compare scale without logarithms';order.eyebrow='Core scale reasoning through exponents, estimates and ratios';
  order.html=`<div class="lesson-grid two"><div class="convention-card"><span>POWER-OF-TEN SCALE</span><p>If \\(N=a\\times10^k\\) with \\(1\\le |a|\\lt 10\\), the exponent \\(k\\) identifies the decade containing \\(|N|\\).</p><div class="formula-panel">\\[10^k\\le |N|\\lt 10^{k+1}\\]</div></div><div class="convention-card"><span>REASONABLENESS ROUTINE</span><p>Round the coefficient sensibly, apply the exponent laws, then compare the calculated exponent with the estimate.</p><div class="formula-panel">\\[(6\\times10^7)(3\\times10^5)\\approx2\\times10^{13}\\]</div></div></div><div class="example-strip"><b>Read scale structurally:</b><span>\\(2.8\\times10^7\\) lies in the \\(10^7\\) decade.</span><span>\\(6.4\\times10^{-4}\\) lies in the \\(10^{-4}\\) decade.</span></div><div class="warning-box"><b>Core rule:</b> no logarithm is required. A separate nearest-power convention is available in Extension when a question explicitly asks for it.</div>`;
  data.slides.splice(data.slides.indexOf(order)+1,0,ext);
}

const exit=data.slides.find(s=>s.title==='Exit ticket · prove that the lesson is secure');
if(exit&&!allMode)exit.html=String(exit.html).replace('State both the decade and nearest-power order of magnitude of \\(6.4\\times10^{-4}\\).','State the decade containing \\(6.4\\times10^{-4}\\), then give a one-significant-figure estimate of the quantity.').replace('4. Decade \\(10^{-4}\\); nearest power \\(10^{-3}\\).','4. The quantity lies in the \\(10^{-4}\\) decade and is approximately \\(6\\times10^{-4}\\) to 1 s.f.');

const calc=data.slides.find(s=>s.title==='Calculator notation · read E structurally');
if(calc)calc.html=`<div class="lesson-grid two"><div class="gdc-panel"><div class="gdc-screen">-7.32E-6</div><div class="gdc-translation">\\[-7.32\\mathrm{E}{-6}=-7.32\\times10^{-6}\\]</div><p>The display letter E means “multiply by a power of ten”. It is not a variable and should be rewritten as \\(\\times10^k\\) in the final answer.</p></div><div class="procedure-card"><b>TI‑84 Plus CE route</b><ol><li>Enter the coefficient.</li><li>Press <kbd>2nd</kbd> then <kbd>,</kbd> for <b>EE</b>.</li><li>Use the dedicated <kbd>(−)</kbd> key for a negative exponent.</li><li>Use <b>SCI</b> or <b>NORM</b> only to change the display format.</li><li>Estimate first and retain guard digits until final rounding.</li></ol></div></div><div class="l11-ti84-core-callout"><span>TI‑84 CLASSROOM</span><b>Physical key sequence → independent estimate → written IB notation</b><p>Open the lesson-specific routine to practise EE entry, SCI/NORM display and guard-digit reporting.</p></div>`;

const integrated=data.slides.find(s=>s.title==='Integrated IB-style precision audit');
if(integrated&&!allMode){
  integrated.eyebrow='Core IB-style task · bounds, error and defensible reporting';
  integrated.html=`<div class="nf-ib-task"><div class="nf-ib-head"><span>IB-STYLE INTEGRATED TASK · 10 MARKS</span><b>A circular optical component has measured diameter \\(d=4.20\\) cm to 3 significant figures. A model uses \\(A=\\pi d^2/4\\).</b></div><ol class="nf-ib-parts"><li><b>Write down</b> the lower and upper endpoints for \\(d\\). [2]</li><li><b>Calculate</b> lower and upper endpoints for the area. [3]</li><li>The nominal model gives \\(13.85\\text{ cm}^2\\). <b>Determine</b> a suitable upper bound for the percentage error relative to any true area consistent with the measurement. [3]</li><li><b>Comment</b> on whether reporting the area as \\(13.854423\\text{ cm}^2\\) is appropriate. [2]</li></ol><textarea class="student-note tall" data-note="nf-integrated-ib-task-core" aria-label="Integrated precision audit working"></textarea><details class="solution-reveal"><summary>Markscheme outline</summary><p>(a) \\(4.195\\le d\\lt 4.205\\). (b) \\(13.8214565\\ldots\\le A\\lt 13.8874299\\ldots\\text{ cm}^2\\). (c) The limiting upper-endpoint error is \\(\\frac{|13.85-13.8874299\\ldots|}{13.8874299\\ldots}\\times100\\%\\approx0.269524\\%\\). Since the upper endpoint is excluded, the percentage error is \\(\\lt0.270\\%\\); hence \\(0.270\\%\\) is a suitable upper bound to 3 d.p. (d) Six decimal places are not justified by a 3-s.f. diameter.</p></details></div>`;
}

const extensionIds=new Set(['U1V3-1.1-P01','U1V3-1.1-P09','NFV6-1.1-P01','NFV6-1.1-P02','NFV6-1.1-P03','NFV6-1.1-P12','NFV6-1.1-P23','NFV6-1.1-P24','NFV6-1.1-Q01','NFV6-1.1-Q02']);
const extensionPattern=/(smallest (?:appropriate )?set|number[- ]set|classify .*\\mathbb|belongs to .*\\mathbb|imaginary part|complex but not real|\\mathbb\s*[NZQRC]|ℕ|ℤ|ℚ|ℝ|ℂ)/i;
const classify=item=>{item.scope='core';item.scopeReason='Current SL 1.1/1.6 core assessment.';if(extensionIds.has(item.id)||extensionPattern.test(text(item))){item.scope='extension';item.scopeReason='Optional number-set prerequisite/extension item; excluded from default mastery.';}return item;};
const practice=(data.practice||[]).map(classify),quiz=(data.quiz||[]).map(classify),exam=(data.exam||[]).map(classify),slides=data.slides;
data.scopeCollections={slides,practice,quiz,exam};
if(!allMode){data.practice=practice.filter(x=>x.scope==='core');data.quiz=quiz.filter(x=>x.scope==='core');data.exam=exam.filter(x=>x.scope==='core');}

Object.assign(data,{version:RELEASE,buildDate:'2026-08-06'});
Object.assign(data.lesson,{
  title:'Scientific Notation, Approximation and Error',
  subtitle:'Represent scale, calculate with powers of ten, report precision honestly, construct bounds and quantify error.',
  syllabus_focus:'IB Mathematics: Applications and Interpretation SL — SL 1.1 operations with numbers in the form a × 10^k, consolidated with SL 1.6 approximation, significant figures, bounds and percentage error.',
  objectives:['Convert between ordinary notation and normalized scientific notation and calculate with powers of ten.','Compare scale using exponents, ratios and reasonableness estimates without requiring logarithms.','Round to decimal places and significant figures while retaining guard digits during calculation.','Distinguish exact values, approximations and estimates and report a defensible level of precision.','Construct direct and calculated bounds for positive quantities.','Calculate absolute, relative and percentage error and interpret tolerance in context.','Use the TI‑84 Plus CE transparently: EE entry, SCI/NORM display, verification and mathematical reporting.'],
  vocab:['scientific notation','standard form','coefficient','power of ten','integer exponent','normalized form','decade','scale factor','reasonableness estimate','decimal place','significant figure','guard digit','exact value','approximation','estimate','rounding unit','lower bound','upper-bound endpoint','error interval','absolute error','relative error','percentage error','tolerance'],
  technology:'Use TI‑84 Plus CE EE entry, distinguish negation from subtraction, choose SCI/NORM deliberately, retain stored precision and rewrite E-display output in mathematical notation with justified rounding.',
  scope_modes:{core:{label:'IB SL Core',description:'Required scientific notation, approximation, bounds, error and TI‑84 skills.'},all:{label:'Core + Extension',description:'Adds optional number-set revision and nearest-power order of magnitude.'}},
  default_scope:'core',active_scope:allMode?'all':'core',original_scope_metadata:originalLesson,recommended_sessions:5,
  teaching_blocks:[{code:'1.1A',title:'Scientific notation and scale'},{code:'1.1B',title:'Validation, units and TI‑84'},{code:'1.1C',title:'Precision and rounding'},{code:'1.1D',title:'Bounds and error'},{code:'1.1E',title:'Integrated modelling and assessment'}]
});
const count=(a,s)=>a.filter(x=>x.scope===s).length;
data.scopeCounts={slides:{core:count(slides,'core'),extension:count(slides,'extension'),all:slides.length},practice:{core:count(practice,'core'),extension:count(practice,'extension'),all:practice.length},quiz:{core:count(quiz,'core'),extension:count(quiz,'extension'),all:quiz.length},exam:{core:count(exam,'core'),extension:count(exam,'extension'),all:exam.length}};
data.assessmentDesign=Object.assign({},data.assessmentDesign,{activeScope:allMode?'all':'core',calculatorPolicy:'Mental structure and estimation are paired with lesson-specific TI‑84 EE/SCI/NORM workflows; extension items do not affect default mastery.'});
data.v64Audit={release:RELEASE,defaultCoreScope:true,numberSetsMovedToExtension:true,complexNumbersBeyondAISL:true,logarithmsRemovedFromCoreOrderOfMagnitude:true,nearestPowerConventionPreservedAsExtension:true,scientificNotationBeforeApproximationInRecommendedPath:true,ti84ClassroomRequired:true,ti84SimulatorRequired:true,originalContentRetainedInAllMode:true,counts:data.scopeCounts};
})();
