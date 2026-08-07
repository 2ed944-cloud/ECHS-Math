(function(){
  'use strict';
  const R=String.raw;
  const slides=[];
  const mathSafe=value=>String(value).replace(/\\\(([\s\S]*?)\\\)|\\\[([\s\S]*?)\\\]/g,match=>match.replace(/</g,'\\lt ').replace(/>/g,'\\gt '));
  const S=(section,title,kind,eyebrow,html)=>slides.push({section,title,kind,eyebrow,html:mathSafe(html)});
  const V=(id,label='')=>`<div class="lq5-visual" data-lq5-visual="${id}"${label?` aria-label="${label}"`:''}></div>`;
  const cards=items=>`<div class="lq5-card-grid">${items.map(item=>`<article class="${item.className||''}">${item.label?`<span>${item.label}</span>`:''}${item.title?`<h2>${item.title}</h2>`:''}${item.math?`<div class="lq5-math">${item.math}</div>`:''}${item.text?`<p>${item.text}</p>`:''}${item.list?`<ul>${item.list.map(value=>`<li>${value}</li>`).join('')}</ul>`:''}</article>`).join('')}</div>`;
  const concept=(section,title,eyebrow,lead,items,visual='',note='')=>S(section,title,'content',eyebrow,`<div class="lq5-concept ${visual?'with-visual':''}"><div>${lead?`<p class="lq5-lead">${lead}</p>`:''}${cards(items)}${note?`<div class="lq5-note">${note}</div>`:''}</div>${visual?V(visual,title):''}</div>`);
  const W=(section,title,prompt,steps,result,interpretation='',visual='')=>S(section,title,'worked','Worked example',`<div class="lq5-worked"><section class="lq5-question"><span>QUESTION</span><h2>${prompt}</h2>${visual?V(visual,title):''}</section><section class="lq5-method"><span>METHOD</span><ol>${steps.map(step=>`<li>${step}</li>`).join('')}</ol><div class="lq5-result">${result}</div>${interpretation?`<p class="lq5-interpret">${interpretation}</p>`:''}</section></div>`);
  const T=(section,title,prompt,parts,note,answer,visual='')=>S(section,title,'student','Your turn',`<div class="lq5-student"><header><span>TRY IT</span><h2>${prompt}</h2></header>${visual?V(visual,title):''}<ol>${parts.map(part=>`<li>${part}</li>`).join('')}</ol><textarea class="student-note tall" data-note="${note}" placeholder="Show a clear method, verification and interpretation."></textarea><details><summary>Check your response</summary><div class="solution-panel">${answer}</div></details></div>`);
  const Q=(title,items,note,answer)=>S('Checkpoint',title,'student','Check your understanding',`<div class="lq5-checkpoint"><ol>${items.map(item=>`<li>${item}</li>`).join('')}</ol><textarea class="student-note" data-note="${note}" placeholder="Answer each item precisely."></textarea><details><summary>Answers</summary><div class="solution-panel">${answer}</div></details></div>`);
  const Section=(section,title,lead,visual)=>S(section,title,'section','',`<div class="lq5-section-open"><div><span>${section.toUpperCase()}</span><h2>${title}</h2><p>${lead}</p></div>${V(visual,title)}</div>`);
  const TI=(title,workflow,lead)=>S('TI-84 Plus CE',title,'content','Calculator training',`<div class="lq5-ti-card"><div><span>${workflow.toUpperCase()}</span><h2>${title}</h2><p>${lead}</p></div><button type="button" data-lq5-ti-workflow="${workflow}">Open guided TI-84 practice</button></div>`);
  window.__ECHS_LQ5_BUILD={R,slides,S,V,cards,concept,W,T,Q,Section,TI};
})();
