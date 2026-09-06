/* Checkpoint runner. Stable question IDs keep saved work intact when more questions are appended. */
(function(){
  'use strict';
  const Q=window.ECHSMidunitQuestions,G=window.ECHSMidunitGraphs;
  if(!Q||!G)return;
  const $=id=>document.getElementById(id),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const math=s=>String(s).replace(/\\\((.*?)\\\)/gs,(_,tex)=>`<span class="math" data-tex="${esc(tex)}">${esc(tex)}</span>`);
  function renderMath(){document.querySelectorAll('.math').forEach(n=>{try{window.katex.render(n.dataset.tex,n,{throwOnError:true,strict:'ignore',output:'htmlAndMathml'});}catch(e){n.classList.add('math-fallback');console.error('Checkpoint math:',n.dataset.tex,e.message);}});}
  const questionById=new Map(Q.questions.map(q=>[q.id,q]));
  const initial=()=>({version:1,answers:{},flags:{},slide:'start'});
  let state=initial(),storageKey=null,current=0;
  const accountKey=()=>{try{const id=window.ECHSInstitution?.account?.()?.id;return id?`echs:ap-calculus:1.M:${Q.revision}:${id}`:null;}catch{return null;}};
  function note(text){document.querySelectorAll('.checkpoint-save-note').forEach(n=>n.textContent=text);}
  function load(){const key=accountKey();if(key===storageKey)return false;storageKey=key;state=initial();if(key)try{const saved=JSON.parse(localStorage.getItem(key)||'null');if(saved?.version===1){for(const q of Q.questions){const a=saved.answers?.[q.id];if(a&&Number.isInteger(a.value)&&a.value>=0&&a.value<q.choices.length)state.answers[q.id]={value:a.value,checked:Boolean(a.checked),correct:Boolean(a.checked)&&a.value===q.answer,reviewed:Boolean(a.reviewed),firstCorrect:a.firstCorrect===true,attempted:Boolean(a.attempted||a.checked)};if(saved.flags?.[q.id]===true)state.flags[q.id]=true;}if(typeof saved.slide==='string')state.slide=saved.slide;}}catch{}return true;}
  function save(){if(!storageKey){note('Responses stay in this open lesson. Sign in through the pathway to save work for your account.');return;}try{localStorage.setItem(storageKey,JSON.stringify(state));note('Your responses and review flags are saved on this device for your account.');}catch{note('Device storage is unavailable. Keep this lesson open to retain your work.');}}
  const table=t=>`<div class="table-wrap checkpoint-table" tabindex="0" role="region" aria-label="${esc(t.caption)}"><table><caption>${esc(t.caption)}</caption><thead><tr>${t.headers.map(h=>`<th scope="col">${esc(h)}</th>`).join('')}</tr></thead><tbody>${t.rows.map(row=>`<tr>${row.map((v,i)=>i?`<td>${esc(v)}</td>`:`<th scope="row">${esc(v)}</th>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  function question(q,i){
    const section=document.createElement('section');section.className='slide';section.id='question-'+q.id;section.hidden=true;section.dataset.title=`${i+1}. ${q.title}`;section.dataset.question=q.id;
    const prompt=`<div id="prompt-${q.id}" class="question-prompt">${math(q.prompt)}</div>${q.table?table(q.table):''}`;
    const paired=q.graphs?`<div class="paired-question-graphs">${q.graphs.map(g=>`<figure class="checkpoint-figure">${G.svg(g)}<figcaption>Graph of ${esc(g.yLabel.replace('(x)',''))}</figcaption></figure>`).join('')}</div>`:'';
    const visual=q.graph?`<figure class="checkpoint-figure">${G.svg(q.graph)}<figcaption>Open circles exclude a point; filled circles give a function value.</figcaption></figure>`:'';
    const choices=`<fieldset aria-labelledby="prompt-${q.id}"><legend class="sr-only">Choose one answer</legend><div class="choices ${q.choiceGraphs?'graph-choices':''}">${q.choices.map((c,j)=>`<label class="choice ${q.choiceGraphs?'graph-choice':''}"><input type="radio" name="${q.id}" value="${j}" aria-describedby="feedback-${q.id}"><span class="graph-choice-content"><span class="letter">${String.fromCharCode(65+j)}.</span> ${math(c)}${q.choiceGraphs?G.svg(q.choiceGraphs[j]):''}</span></label>`).join('')}</div></fieldset>`;
    section.innerHTML=`<div class="slide-inner"><p class="eyebrow">AP Calculus · Middle Unit Checkpoint · Question ${i+1} of ${Q.questions.length}</p><h2 tabindex="-1">${esc(q.title)}</h2><article class="card checkpoint-question question"><div class="question-head"><span class="tag">${q.calculator?'Graphing calculator permitted':'No calculator needed'}</span>${q.topic?`<span class="tag">Topic ${esc(q.topic)}</span>`:''}<span id="status-${q.id}" class="score-chip">Not attempted</span><button type="button" class="btn secondary small flag-button" data-flag="${q.id}" aria-pressed="false">Mark for review</button></div>${q.graph?`<div class="question-layout"><div>${prompt}${choices}</div>${visual}</div>`:paired+prompt+choices}<div class="actions"><button type="button" class="btn" data-check="${q.id}">Check answer</button><button type="button" class="btn secondary" data-hint="${q.id}" aria-expanded="false" aria-controls="hint-${q.id}">Hint</button><button type="button" class="btn outline" data-solution="${q.id}" aria-expanded="false" aria-controls="solution-${q.id}">Worked solution</button></div><p class="feedback" id="feedback-${q.id}" role="status" aria-live="polite"></p><div id="hint-${q.id}" class="hint" hidden>${math(q.hint)}</div><div id="solution-${q.id}" class="solution" hidden>${math(q.solution)}</div></article></div>`;
    if(q.graph?.marks.length===0)section.querySelector('figcaption').textContent='Position is on the vertical axis; time is on the horizontal axis.';
    $('lessonStage').insertBefore(section,$('review'));
  }
  Q.questions.forEach(question);
  $('questionCount').textContent=String(Q.questions.length);
  $('familyCount').textContent=String(new Set(Q.questions.map(q=>q.family)).size);
  const slides=[...document.querySelectorAll('.slide')];
  for(const [i,s] of slides.entries()){const o=document.createElement('option');o.value=i;o.textContent=`${i+1}. ${s.dataset.title}`;$('slideSelect').append(o);}
  function status(a){return !a?'Not attempted':a.checked?(a.correct?(a.reviewed?(a.firstCorrect?'Correct · solution reviewed':'Correct after review'):'Correct'):'Try again'):a.attempted?'Answer changed · check again':'Answer selected · check to score';}
  function summary(){
    const rows=Q.questions.map(q=>state.answers[q.id]);
    $('attemptedCount').textContent=`${rows.filter(a=>a?.attempted).length} / ${Q.questions.length}`;
    $('correctCount').textContent=String(rows.filter(a=>a?.checked&&a.correct).length);
    $('firstCount').textContent=String(rows.filter(a=>a?.firstCorrect).length);
    $('flaggedCount').textContent=String(Q.questions.filter(q=>state.flags[q.id]).length);
    $('reviewList').innerHTML=Q.questions.map((q,i)=>`<button type="button" class="btn secondary review-item" data-go="question-${q.id}"><div>${i+1}. ${esc(q.title)}<span>${status(state.answers[q.id])}${state.flags[q.id]?' · Marked for review':''}</span></div><span aria-hidden="true">→</span></button>`).join('');
  }
  function hydrate(){for(const q of Q.questions){const a=state.answers[q.id],s=$('question-'+q.id);for(const r of s.querySelectorAll('input[type=radio]'))r.checked=Boolean(a&&Number(r.value)===a.value);$('status-'+q.id).textContent=status(a);const b=s.querySelector('[data-flag]');b.setAttribute('aria-pressed',String(Boolean(state.flags[q.id])));b.textContent=state.flags[q.id]?'Marked for review':'Mark for review';}summary();}
  function hideFeedback(){document.querySelectorAll('.hint,.solution').forEach(n=>n.hidden=true);document.querySelectorAll('[aria-expanded]').forEach(n=>n.setAttribute('aria-expanded','false'));document.querySelectorAll('.feedback').forEach(n=>{n.textContent='';n.className='feedback';});$('resetConfirmation').hidden=true;}
  function feedback(id,text,kind=''){const n=$('feedback-'+id);n.textContent=text;n.className='feedback'+(kind?' '+kind:'');}
  function go(index,focus=true){current=Math.max(0,Math.min(slides.length-1,Number(index)||0));for(const [i,s] of slides.entries()){s.hidden=i!==current;s.classList.toggle('active',i===current);}const s=slides[current];state.slide=s.id;$('slideSelect').value=String(current);$('topCounter').textContent=`${current+1} of ${slides.length}`;$('slideCounter').textContent=`${current+1} / ${slides.length}`;$('progressBar').style.width=`${(current+1)/slides.length*100}%`;$('previousSlide').disabled=current===0;$('nextSlide').disabled=current===slides.length-1;s.scrollTop=0;try{history.replaceState(null,'',location.pathname+location.search+'#'+(s.dataset.question?'question='+s.dataset.question:'slide='+String(current+1)));}catch{}if(focus)s.querySelector('h1,h2')?.focus({preventScroll:true});$('slideAnnouncement').textContent=`${current+1} of ${slides.length}: ${s.dataset.title}`;save();}
  const goId=id=>go(slides.findIndex(s=>s.id===id));
  function hashIndex(){const q=location.hash.match(/^#question=([\w-]+)$/);if(q)return slides.findIndex(s=>s.dataset.question===q[1]);const n=location.hash.match(/^#slide=(\d+)$/);return n?Number(n[1])-1:slides.findIndex(s=>s.id===state.slide);}
  document.addEventListener('click',e=>{
    const b=e.target.closest('button');if(!b)return;
    if(b.dataset.go)goId(b.dataset.go);
    if(b.dataset.check){const id=b.dataset.check,q=questionById.get(id),selected=$('question-'+id).querySelector('input:checked');if(!selected){feedback(id,'Select an answer before checking.','error');return;}const value=Number(selected.value),old=state.answers[id]||{},correct=value===q.answer;state.answers[id]={value,checked:true,attempted:true,correct,reviewed:Boolean(old.reviewed),firstCorrect:old.attempted?Boolean(old.firstCorrect):correct&&!old.reviewed};feedback(id,correct?(old.reviewed?'Correct after review. Explain why the other choices fail.':'Correct. Compare your reasoning with the worked solution.'):'Not yet. Use the hint or worked solution, then revise your answer.',correct?'good':'error');hydrate();save();}
    if(b.dataset.hint){const id=b.dataset.hint,n=$('hint-'+id);n.hidden=!n.hidden;b.setAttribute('aria-expanded',String(!n.hidden));}
    if(b.dataset.solution){const id=b.dataset.solution,a=state.answers[id];if(!a?.attempted){feedback(id,'Try an answer first. You can open the hint before answering.');return;}const n=$('solution-'+id);n.hidden=!n.hidden;b.setAttribute('aria-expanded',String(!n.hidden));if(!n.hidden){a.reviewed=true;hydrate();save();}}
    if(b.dataset.flag){const id=b.dataset.flag;state.flags[id]=!state.flags[id];hydrate();save();}
  });
  document.addEventListener('change',e=>{const r=e.target,s=r.closest('[data-question]');if(!s||r.type!=='radio')return;const id=s.dataset.question,old=state.answers[id]||{};state.answers[id]={...old,value:Number(r.value),checked:false,correct:false};feedback(id,'');$('solution-'+id).hidden=true;s.querySelector('[data-solution]').setAttribute('aria-expanded','false');hydrate();save();});
  $('previousSlide').addEventListener('click',()=>go(current-1));$('nextSlide').addEventListener('click',()=>go(current+1));$('slideSelect').addEventListener('change',e=>go(e.target.value));
  document.addEventListener('keydown',e=>{if(e.altKey||e.ctrlKey||e.metaKey||e.shiftKey||e.target.closest?.('input,select,textarea,button,a,[contenteditable=true]')||!['ArrowLeft','ArrowRight','PageUp','PageDown','Home','End'].includes(e.key))return;e.preventDefault();go(e.key==='Home'?0:e.key==='End'?slides.length-1:current+(['ArrowRight','PageDown'].includes(e.key)?1:-1));});
  $('resetWork').addEventListener('click',()=>$('resetConfirmation').hidden=false);$('cancelReset').addEventListener('click',()=>$('resetConfirmation').hidden=true);$('confirmReset').addEventListener('click',()=>{const slide=state.slide;state=initial();state.slide=slide;hydrate();hideFeedback();save();});
  $('finishCheckpoint').addEventListener('click',()=>{const finish=document.querySelector('[data-finish-lesson]');if(finish)finish.click();else location.href='../../../index.html?course=ap-calculus-ab#courses';});
  $('printLesson').addEventListener('click',()=>window.print());
  $('focusLesson').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else if(document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen();else $('slideAnnouncement').textContent='Full-screen mode is unavailable in this browser.';}catch{$('slideAnnouncement').textContent='Full-screen mode could not be opened.';}});
  document.addEventListener('fullscreenchange',()=>$('focusLesson').textContent=document.fullscreenElement?'Exit focus':'Focus');
  function refresh(){if(load()){hideFeedback();hydrate();go(slides.findIndex(s=>s.id===state.slide),false);}}
  load();hydrate();renderMath();go(hashIndex(),false);
  window.addEventListener('hashchange',()=>go(hashIndex()));window.addEventListener('focus',refresh);window.addEventListener('pagehide',save);window.addEventListener('storage',e=>{if(e.key==='echs_institution_account_v1'||e.key===null)refresh();});
  if(window.ECHSPortalAccess?.ready)window.ECHSPortalAccess.ready.then(refresh).catch(()=>{});
  document.documentElement.dataset.checkpointReady='true';
})();
