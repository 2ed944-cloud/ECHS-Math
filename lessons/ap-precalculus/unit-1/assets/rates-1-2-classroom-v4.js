/* Compatibility layer for the existing, protected ECHS lesson deck. */
(function(){
  'use strict';
  const P=window.RatesClassroomPlan,Q=window.RatesQuestions,stage=document.getElementById('lessonStage');
  if(!P||P.version!=='echs.rates-classroom.v1'||!Q||!stage)return;
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const textMath=s=>esc(s).replace(/\\\((.*?)\\\)/gs,(_,tex)=>`<span class="math" data-tex="${tex}">${tex}</span>`);
  const existing=[...stage.querySelectorAll('.slide')];
  window.RatesLegacyOrder=existing.map(s=>s.id);
  const questionIds=new Set(Q.questions.map(q=>q.id));
  for(const q of P.questions){if(questionIds.has(q.id))throw Error('Duplicate classroom question');questionIds.add(q.id);Q.questions.push(q);}
  const reflection=(id,prompt)=>`<div class="classroom-reflection"><label for="draft-${id}">${esc(prompt)}</label><textarea id="draft-${id}" data-draft="${id}" maxlength="10000" placeholder="Write your reasoning, then discuss it with a partner."></textarea><p class="save-note">Responses stay in this open lesson. Discussion responses are not automatically graded.</p></div>`;
  function block(b,id){
    if(b.type==='questions')return `<div class="grid ${b.ids.length===1?'classroom-single':''}">${b.ids.map(q=>{if(!questionIds.has(q))throw Error('Unknown question');return `<article class="card question" data-question="${esc(q)}"></article>`;}).join('')}</div>`;
    if(b.type==='explanation')return '<div class="classroom-explanation">'+b.paragraphs.map(p=>'<p>'+textMath(p)+'</p>').join('')+'</div>';
    if(b.type==='key-notes')return '<aside class="classroom-key-notes"><h3>Key notes</h3><ul>'+b.items.map(p=>'<li>'+textMath(p)+'</li>').join('')+'</ul></aside>';
    if(b.type==='worked')return `<section class="classroom-worked card"><h3>Worked example</h3><p>${textMath(b.prompt)}</p><button class="btn secondary" type="button" data-reveal="worked-${id}" aria-controls="worked-${id}" aria-expanded="false">Show the explanation</button><div class="solution" id="worked-${id}" hidden><ol>${b.steps.map(p=>'<li>'+textMath(p)+'</li>').join('')}</ol></div></section>`;
    if(b.type==='table')return '<div class="table-wrap"><table class="rate-table"><caption>'+esc(b.caption)+'</caption><thead><tr>'+b.headers.map(h=>'<th scope="col">'+esc(h)+'</th>').join('')+'</tr></thead><tbody>'+b.rows.map(row=>'<tr>'+row.map(v=>'<td>'+textMath(v)+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>';
    if(b.type==='graph')return '<div data-idea-plot="'+esc(b.key)+'"></div>';
    if(b.type==='idea-lab')return '<div class="card investigation" data-idea-lab="'+esc(b.key)+'"></div>';
    if(b.type==='reflection')return reflection(id,b.prompt);
    throw Error('Unsupported classroom block');
  }
  const map=new Map(existing.map(s=>[s.id,s]));
  for(const s of P.slides){
    if(map.has(s.id))throw Error('Duplicate classroom slide');
    const el=document.createElement('section');el.className='slide';el.id=s.id;el.hidden=true;el.dataset.title=s.title;el.dataset.phase=s.phase;
    el.innerHTML=`<div class="slide-inner"><p class="eyebrow">${esc(s.phase)} · ${s.minutes} min · Topic 1.2</p><h2 tabindex="-1">${esc(s.title)}</h2><p class="objective">${esc(s.objective)}</p>${s.blocks.map((b,i)=>block(b,s.id+'-'+i)).join('')}</div>`;
    map.set(s.id,el);
  }
  for(const [id,u] of Object.entries(P.updates)){
    const el=map.get(id);if(!el)throw Error('Unknown activity slide');
    const inner=el.querySelector('.slide-inner');el.dataset.phase=u.phase;
    if(u.title){el.dataset.title=u.title;el.querySelector('h1,h2').textContent=u.title;}
    el.querySelector('.eyebrow').textContent=u.phase+(u.minutes?' · '+u.minutes+' min':'')+' · Topic 1.2';
    if(u.mission){const box=document.createElement('div');box.className='classroom-mission';box.innerHTML='<h3>Predict · Explore · Explain</h3><ol>'+u.mission.map(t=>'<li>'+esc(t)+'</li>').join('')+'</ol>';inner.insertBefore(box,inner.querySelector('.investigation'));}
    if(u.reflection){const box=document.createElement('div');box.innerHTML=reflection('reflect-'+id,u.reflection);inner.append(box);}
  }
  const ordered=P.order.map(id=>{if(!map.has(id))throw Error('Unknown sequence slide');return map.get(id);});
  const used=new Set(P.order);for(const el of map.values())if(!used.has(el.id))ordered.push(el);
  ordered.forEach((el,i)=>{el.hidden=i!==0;el.dataset.path=used.has(el.id)?'classroom':'practice';if(!el.dataset.phase)el.dataset.phase=el.querySelector('[data-question],[data-frq]')?'More practice':'Reference';stage.append(el);});
  document.documentElement.dataset.classroomRevision=P.revision;
  const nav=document.createElement('nav');nav.className='classroom-nav';nav.setAttribute('aria-label','Lesson sections');
  nav.innerHTML=P.navigation.map(([id,label])=>`<button class="classroom-nav-button" type="button" data-go="${esc(id)}">${esc(label)}</button>`).join('');document.querySelector('.topbar').append(nav);
  const road=map.get('roadmap').querySelector('.slide-inner');
  road.innerHTML='<p class="eyebrow">Choose the next step · Topic 1.2</p><h2 tabindex="-1">Practice and reference notes</h2><p class="objective">The main classroom sequence is complete. Choose a task based on the evidence in your work.</p><div class="classroom-menu">'+[
    ['practice-guide','AP-style practice','24 original multiple-choice questions with hints and worked solutions.'],
    ['frq02','Written-response practice','Graph, local-rate and calculator tasks with classroom scoring guidelines.'],
    ['prerequisites','Reference notes','Review quantities, notation, subtraction order and contextual interpretation.'],
    ['precision-lab','Precision investigation','Explore what rounded displays can conceal.'],
    ['corner-lab','Optional extensions','Investigate the limits of a centered estimate, then try the challenge bank.'],
    ['alignment','Curriculum and resources','Topic 1.2 scope, lesson objectives and source.']
  ].map(([id,label,desc])=>`<button class="classroom-menu-item" type="button" data-go="${id}"><strong>${label}</strong><span>${desc}</span></button>`).join('')+'</div><p class="mode-note">Core flow: warm-up → Activities 1 and 2 → your turn → further investigations and practice → student workshop → exit ticket. The full sequence includes all ten supplied ideas. Pace the chapters across several teaching sessions; pause and revisit as needed.</p>';
  // Keep the original start/reference and all original assessment IDs available.
  const start=map.get('start');start.dataset.title='Lesson overview and learning objectives';start.querySelector('h1').textContent='Rates of change · Lesson overview';
  const warm=map.get('warm-up').querySelector('.slide-inner');const byline=document.createElement('p');byline.className='classroom-byline';byline.textContent='AP Precalculus 1.2 · '+P.teacher+' · ECHS';warm.prepend(byline);
  const formula=map.get('quotient').querySelector('.formula');if(formula)formula.classList.add('classroom-key-equation');
  window.RatesClassroom={ready(){
    window.RatesIdeas?.init();
    document.querySelectorAll('[data-classroom-plot="segments"]').forEach(el=>el.innerHTML=window.RatesGraphs.plot({title:'Straight segments joining (2,14), (5,−1), and (8,2)',bounds:[0,9,-4,16],stepX:1,stepY:4,curves:[{points:[[2,14],[5,-1],[8,2]]}],points:[[2,14],[5,-1],[8,2]].map(([x,y])=>({x,y,label:`(${x}, ${y})`}))}));
  },update(slide){
    let active=P.navigation.find(([id])=>id===slide.id)?.[0];
    if(!active){const i=P.order.indexOf(slide.id);active=i<0?'roadmap':P.navigation.filter(([id])=>P.order.indexOf(id)<=i).at(-1)?.[0]||'warm-up';}
    nav.querySelectorAll('button').forEach(b=>{if(b.dataset.go===active)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current');});
  }};
})();
