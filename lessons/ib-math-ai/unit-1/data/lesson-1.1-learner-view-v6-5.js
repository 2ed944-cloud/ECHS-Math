(function(){
'use strict';
const data=window.LESSON_DATA;
if(!data||String(data.lesson?.number)!=='1.1'||!Array.isArray(data.slides))return;
const clean=html=>String(html||'')
  .replace(/<h2>\s*Lesson 1\.1[A-Z]\s*<\/h2>/gi,'')
  .replace(/<h3>\s*Estimated teaching time:[\s\S]*?<\/h3>/gi,'')
  .replace(/<h2>\s*[🟢🔵🟠🟣]\s*(?:Core \(Teach in class\)|Practice|Extension|Revision)\s*<\/h2>/gi,'')
  .replace(/<div class="v3-release-badge">[\s\S]*?<\/div>/gi,'')
  .replace(/<div class="v3-source-basis">[\s\S]*?<\/div>/gi,'')
  .replace(/<div class="transition-note">[\s\S]*?<\/div>/gi,'')
  .replace(/<span>\s*Current syllabus\s*<\/span>/gi,'')
  .replace(/<span>\s*Unified definitive lesson\s*<\/span>/gi,'')
  .replace(/<p>\s*<b>Platform mastery keys:<\/b>[\s\S]*?<\/p>/gi,'')
  .replace(/Current course alignment/gi,'Lesson focus');
const activity=slide=>['student','inquiry','lab','worked','misconception'].includes(String(slide.kind||''))||/(diagnostic|misconception|checkpoint|exit ticket|mastery|synthesis|retrieval|review|student turn|your turn|opening problem|investigat|practice|worked example)/i.test(`${slide.section||''} ${slide.title||''}`);
const marker=slide=>slide.scope==='extension'?'extension':activity(slide)?'practice':'core';

const cover=data.slides.find(slide=>/1\.1 · (?:Number Foundations and Scientific Notation|Scientific Notation and Orders of Magnitude)/.test(slide.title||''));
if(cover){
  cover.title='1.1 · Scientific Notation, Approximation and Error';
  cover.eyebrow='IB Mathematics: Applications and Interpretation SL · Unit 1';
  cover.html=`<div class="ap-cover nf-cover"><div class="ap-cover-copy"><div class="lesson-kicker">SCIENTIFIC NOTATION · SCALE · PRECISION · BOUNDS · ERROR</div><h1><span>1.1</span> Scientific Notation, Approximation and Error</h1><p class="cover-lead">Represent quantities across powers of ten, calculate accurately, report precision honestly and interpret uncertainty.</p><div class="meaning-callout"><b>The central idea</b><span>A calculator result becomes mathematically useful only when its scale, units, precision and uncertainty are communicated clearly.</span></div><button class="cover-start" data-cover-next="1">Begin lesson <span aria-hidden="true">→</span></button></div><div class="cover-visual nf-cover-visual" aria-label="Learning path through scientific notation, precision, bounds and error"><div class="visual-title">ONE COHERENT SCIENTIFIC NOTATION PATH</div><div class="nf-cover-path"><div><b>1</b><span>Scientific notation</span><small>\\(a\\times10^k\\)</small></div><i>→</i><div><b>2</b><span>Operations & scale</span><small>exponents · estimates</small></div><i>→</i><div><b>3</b><span>Precision</span><small>decimal places · significant figures</small></div><i>→</i><div><b>4</b><span>Bounds</span><small>intervals · endpoint choices</small></div><i>→</i><div><b>5</b><span>Error</span><small>absolute · relative · percentage</small></div></div><div class="scale-caption">Represent → calculate → estimate → bound → interpret</div></div></div>`;
}
const opening=data.slides.find(slide=>/Opening problem · (?:three quantities, one decision|five numbers, five decisions)/.test(slide.title||''));
if(opening){
  opening.title='Opening problem · five quantities, five decisions';opening.eyebrow='Represent, calculate, estimate and report before accepting a result';
  opening.html=`<div class="opening-problem"><div class="problem-banner">OPENING PROBLEM</div><p>A science team receives five numerical records. For each, decide what mathematical information must be communicated before the value can be used responsibly.</p><div class="nf-opening-grid"><div><span>A</span><b>\\(72\\,900\\,000\\)</b><small>Which representation exposes scale?</small></div><div><span>B</span><b>\\(\\frac{6.2\\times10^7}{3.1\\times10^3}\\)</b><small>What estimate should precede calculation?</small></div><div><span>C</span><b>\\(0.006953\\)</b><small>How should precision be reported?</small></div><div><span>D</span><b>\\(8.4\\text{ cm}\\)</b><small>What exact values could round here?</small></div><div><span>E</span><b>50 vs 48.6</b><small>How large is the percentage error?</small></div></div><div class="question-band"><b>Question:</b> Why is a bare calculator display not enough evidence for a mathematically responsible conclusion?</div><textarea class="student-note" data-note="opening-problem-v65" aria-label="Opening problem response"></textarea></div>`;
}
const goals=data.slides.find(slide=>slide.title==='Learning goals and evidence of mastery');
if(goals)goals.html=`<div class="goal-grid nf-goal-grid"><div class="goal-card"><b>Represent scale</b><p>Convert between ordinary notation and normalized scientific notation.</p></div><div class="goal-card"><b>Calculate</b><p>Use exponent laws to operate accurately with powers of ten.</p></div><div class="goal-card"><b>Estimate and validate</b><p>Predict the scale of an answer and test calculator output for reasonableness.</p></div><div class="goal-card"><b>Report precision</b><p>Round to decimal places and significant figures while retaining guard digits.</p></div><div class="goal-card"><b>Construct bounds</b><p>Translate rounded measurements into direct and calculated error intervals.</p></div><div class="goal-card"><b>Quantify error</b><p>Calculate absolute, relative and percentage error and judge tolerance.</p></div></div><div class="success-strip"><b>A complete IB response:</b><span>shows the method → preserves units and precision → checks scale or uncertainty → interprets the result.</span></div>`;
const focus=data.slides.find(slide=>slide.title==='Syllabus focus');
if(focus){focus.title='Lesson focus';focus.html=`<div class="goal-grid nf-goal-grid"><div class="goal-card"><b>Scientific notation</b><p>Work with numbers in the form \\(a\\times10^k\\), where \\(1\\le |a|<10\\) and \\(k\\) is an integer.</p></div><div class="goal-card"><b>Approximation and error</b><p>Use decimal places, significant figures, bounds and percentage error appropriately.</p></div><div class="goal-card"><b>Technology and communication</b><p>Use the TI‑84 transparently, retain guard digits and write the final result in clear mathematical notation.</p></div></div>`;}

data.slides.forEach(slide=>{
  if(slide.scope==='extension'){
    slide.section=slide.originalSection||slide.section||'';
    slide.eyebrow=/nearest-power/i.test(slide.title||'')?'Use when the question explicitly defines this convention':'';
    slide.title=String(slide.title||'').replace(/^Extension ·\s*/i,'');
  }
  const colour=marker(slide);
  slide.html=`<span class="ib-slide-color ib-slide-color-${colour}" aria-hidden="true"></span>${clean(slide.html)}`;
});
Object.assign(data.lesson,{title:'Scientific Notation, Approximation and Error',subtitle:'Represent scale, calculate with powers of ten, report precision honestly, construct bounds and quantify error.'});
data.learnerView={release:'6.5.0',colourOnlyMarkers:true,teachingTimesHidden:true,productionLabelsHidden:true};
if(typeof document==='undefined')return;

function tidy(){
  document.querySelectorAll('.l11-scope-banner').forEach(node=>node.remove());
  const summary=document.querySelector('.l11-scope-summary');if(summary)summary.hidden=true;
  const learn=document.querySelector('.route-btn[data-route="learn"]');if(learn&&learn.textContent!=='Learn')learn.textContent='Learn';
  const progress=document.getElementById('progress-label');if(progress){const match=progress.textContent.match(/\d+\s*\/\s*\d+/);if(match&&progress.textContent!==match[0])progress.textContent=match[0];}
  const toggle=document.getElementById('number-scope-toggle');if(toggle){toggle.classList.add('l11-icon-only');toggle.querySelector('.tool-label')?.setAttribute('hidden','');}
  document.querySelectorAll('#drawer-list [data-slide-index].is-extension').forEach(node=>node.removeAttribute('title'));
  document.querySelectorAll('.review-grid .stat-card small').forEach(node=>{node.textContent=node.textContent.replace(/of IB SL core viewed/i,'of lesson viewed').replace(/core-only weighted evidence/i,'weighted learning evidence');});
}
function init(){tidy();const app=document.getElementById('app'),drawer=document.getElementById('drawer-list');if(app)new MutationObserver(tidy).observe(app,{childList:true,subtree:true,characterData:true});if(drawer)new MutationObserver(tidy).observe(drawer,{childList:true,subtree:true});const progress=document.getElementById('progress-label');if(progress)new MutationObserver(tidy).observe(progress,{childList:true,subtree:true,characterData:true});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
