(function(){
'use strict';
const R=String.raw;
const slides=[];
const mathSafe=value=>String(value).replace(/\\\(([\s\S]*?)\\\)|\\\[([\s\S]*?)\\\]/g,match=>match.replace(/</g,'\\lt ').replace(/>/g,'\\gt '));
const S=(section,title,kind,eyebrow,html)=>slides.push({section,title,kind,eyebrow,html:mathSafe(html)});
const V=id=>`<div class="fn4-visual" data-fn4-visual="${id}"></div>`;
const cards=items=>`<div class="fn4-card-grid">${items.map((x,i)=>`<article class="${x.className||''}">${x.label?`<span>${x.label}</span>`:''}${x.title?`<h2>${x.title}</h2>`:''}${x.math?`<div class="fn4-math">${x.math}</div>`:''}${x.text?`<p>${x.text}</p>`:''}${x.list?`<ul>${x.list.map(v=>`<li>${v}</li>`).join('')}</ul>`:''}</article>`).join('')}</div>`;
const concept=(section,title,eyebrow,lead,items,visual='',note='')=>S(section,title,'content',eyebrow,R`<div class="fn4-concept ${visual?'with-visual':''}"><div>${lead?`<p class="fn4-lead">${lead}</p>`:''}${cards(items)}${note?`<div class="fn4-note">${note}</div>`:''}</div>${visual?V(visual):''}</div>`);
const W=(section,title,prompt,steps,result,interpretation='',visual='')=>S(section,title,'worked','Worked example',R`<div class="fn4-worked"><section><span>QUESTION</span><h2>${prompt}</h2>${visual?V(visual):''}</section><section><span>METHOD</span><ol>${steps.map(x=>`<li>${x}</li>`).join('')}</ol><div class="fn4-result">${result}</div>${interpretation?`<p class="fn4-interpret">${interpretation}</p>`:''}</section></div>`);
const T=(section,title,prompt,parts,note,answer,visual='')=>S(section,title,'student','Your turn',R`<div class="fn4-student"><header><span>TRY IT</span><h2>${prompt}</h2></header>${visual?V(visual):''}<ol>${parts.map(x=>`<li>${x}</li>`).join('')}</ol><textarea class="student-note tall" data-note="${note}" placeholder="Show a clear method and use correct notation."></textarea><details><summary>Check your response</summary><div class="solution-panel">${answer}</div></details></div>`);
const Q=(title,items,note,answer)=>S('Checkpoint',title,'student','Check your understanding',R`<div class="fn4-checkpoint"><ol>${items.map(x=>`<li>${x}</li>`).join('')}</ol><textarea class="student-note" data-note="${note}" placeholder="Answer each item precisely."></textarea><details><summary>Answers</summary><div class="solution-panel">${answer}</div></details></div>`);
const Section=(section,title,lead,visual)=>S(section,title,'section','',R`<div class="fn4-section-open"><div><span>${section.toUpperCase()}</span><h2>${title}</h2><p>${lead}</p></div>${V(visual)}</div>`);
window.__ECHS_FN4_BUILD={R,slides,mathSafe,S,V,cards,concept,W,T,Q,Section};
})();
