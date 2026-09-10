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
    if(b.type==='worked')return `<section class="classroom-worked card"><h3>Worked example</h3><p>${textMath(b.prompt)}</p><button class="btn secondary" type="button" data-reveal="worked-${id}" aria-controls="worked-${id}" aria-expanded="true">Hide / show worked steps</button><div class="worked-steps" id="worked-${id}"><ol>${b.steps.map(p=>'<li>'+textMath(p)+'</li>').join('')}</ol></div></section>`;
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
  // Consolidate the lesson while preserving question IDs, drafts and old links.
  const contentNodes=el=>[...el.querySelector('.slide-inner').children].filter(n=>!n.matches('.eyebrow,.objective,h1,h2'));
  const redirects=Object.fromEntries(P.merges.map(m=>[m.from,m.to]));
  for(const move of P.moveQuestions){const to=map.get(move.to).querySelector('.slide-inner');map.get(move.from).querySelectorAll('[data-question]').forEach(q=>to.append(q));}
  const review=contentNodes(map.get('finish'));
  for(const m of P.merges){
    const from=map.get(m.from),to=map.get(m.to).querySelector('.slide-inner');
    if(m.mode==='notes'){
      const teach=document.createElement('div');teach.className='classroom-teach';contentNodes(from).forEach(n=>teach.append(n));to.insertBefore(teach,to.querySelector('.objective').nextSibling);
    }else if(m.mode==='activity')contentNodes(from).forEach(n=>to.append(n));
    else if(m.mode==='checkpoint'){
      const details=document.createElement('details');details.className='classroom-extra-check';details.innerHTML='<summary>Optional written checkpoint</summary>';details.append(from.querySelector('.card'));to.append(details);
    }
    from.remove();map.delete(m.from);
  }
  for(const [id,blocks] of Object.entries(P.teachingNotes)){
    const inner=map.get(id).querySelector('.slide-inner'),teach=document.createElement('div');teach.className='classroom-teach';teach.innerHTML=blocks.map((b,i)=>block(b,id+'-teach-'+i)).join('');inner.insertBefore(teach,inner.querySelector('.objective').nextSibling);
  }
  // Each merged activity has a readable explanation followed by its exploration.
  for(const id of P.stagedActivities){
    const inner=map.get(id).querySelector('.slide-inner');let teach=inner.querySelector('.classroom-teach');
    if(!teach){teach=document.createElement('div');teach.className='classroom-teach';const nodes=contentNodes(map.get(id)).filter(n=>!n.matches('.investigation,.classroom-mission,.classroom-reflection'));nodes.forEach(n=>teach.append(n));inner.insertBefore(teach,inner.querySelector('.objective').nextSibling);}
    const explore=document.createElement('div');explore.className='classroom-explore';contentNodes(map.get(id)).filter(n=>n!==teach).forEach(n=>explore.append(n));inner.append(explore);
    const tabs=document.createElement('div');tabs.className='classroom-steps';tabs.setAttribute('role','group');tabs.setAttribute('aria-label','Activity steps');
    [teach,explore].forEach((panel,i)=>{panel.id='step-'+id+'-'+i;panel.dataset.activityPanel=String(i);panel.hidden=i!==0;const button=document.createElement('button');button.type='button';button.className='btn secondary';button.dataset.activityStep=String(i);button.setAttribute('aria-controls',panel.id);button.setAttribute('aria-pressed',String(i===0));button.textContent=i?'2. Explore and explain':'1. Explanation and key notes';tabs.append(button);});inner.insertBefore(tabs,teach);
  }
  const ordered=P.order.map(id=>{if(!map.has(id))throw Error('Unknown sequence slide');return map.get(id);});
  const used=new Set(P.order);for(const el of map.values())if(!used.has(el.id))ordered.push(el);
  ordered.forEach((el,i)=>{el.hidden=i!==0;el.dataset.path=used.has(el.id)?'classroom':'practice';if(!el.dataset.phase)el.dataset.phase=el.querySelector('[data-question],[data-frq]')?'More practice':'Reference';stage.append(el);});
  if(ordered.length!==P.presentation.totalSlides||P.order.length!==P.presentation.classroomSlides)throw Error('Classroom slide count mismatch');
  window.RatesSlideRedirects=redirects;
  document.documentElement.dataset.classroomRevision=P.revision;
  const nav=document.createElement('nav');nav.className='classroom-nav';nav.setAttribute('aria-label','Lesson sections');
  nav.innerHTML=P.navigation.map(([id,label])=>`<button class="classroom-nav-button" type="button" data-go="${esc(id)}">${esc(label)}</button>`).join('');document.querySelector('.topbar').append(nav);
  const road=map.get('roadmap').querySelector('.slide-inner');
  road.innerHTML='<p class="eyebrow">Review and practice · Topic 1.2</p><h2 tabindex="-1">Review your work and choose more practice</h2><p class="objective">The 30-slide classroom route is complete. Choose a follow-up task using the evidence in your work.</p><div class="classroom-menu">'+[
    ['practice-guide','AP-style practice','24 original multiple-choice questions, displayed one at a time.'],
    ['frq02','Written-response practice','Graph, local-rate and calculator tasks with classroom scoring guidelines.'],
    ['key-notes-checklist','Key notes to revisit','Choose the right comparison: value, change, average rate or nearby rate.'],
    ['unequal-lab','Extra investigations','Compare unequal intervals, shared endpoints and rounded displays.'],
    ['corner-lab','Optional extensions','Inspect a centered estimate, then try the challenge bank.'],
    ['alignment','Curriculum and resources','Topic 1.2 objectives, scope and companion resources.']
  ].map(([id,label,desc])=>`<button class="classroom-menu-item" type="button" data-go="${id}"><strong>${label}</strong><span>${desc}</span></button>`).join('')+'</div>';
  review.forEach(n=>road.append(n));
  const warm=map.get('warm-up').querySelector('.slide-inner');const byline=document.createElement('p');byline.className='classroom-byline';byline.textContent='AP Precalculus 1.2 · '+P.teacher+' · ECHS';warm.prepend(byline);
  const practiceButton=document.createElement('button');practiceButton.type='button';practiceButton.className='btn secondary classroom-return';practiceButton.dataset.go='roadmap';practiceButton.textContent='Return to classroom review';
  for(const el of ordered.filter(el=>el.dataset.path==='practice'))el.querySelector('.slide-inner').prepend(practiceButton.cloneNode(true));
  // Keep any old inline navigation targets useful after consolidation.
  document.querySelectorAll('[data-go]').forEach(b=>{if(redirects[b.dataset.go])b.dataset.go=redirects[b.dataset.go];});
  document.addEventListener('click',event=>{
    const b=event.target.closest('[data-activity-step]');if(!b)return;const inner=b.closest('.slide-inner');
    inner.querySelectorAll('[data-activity-panel]').forEach(p=>p.hidden=p.dataset.activityPanel!==b.dataset.activityStep);
    inner.querySelectorAll('[data-activity-step]').forEach(t=>t.setAttribute('aria-pressed',String(t===b)));
  });
  function prepareQuestions(){
    for(const el of ordered){
      const questions=[...el.querySelectorAll('[data-question]')];if(!questions.length)continue;
      const inner=el.querySelector('.slide-inner'),anchor=[...inner.children].find(n=>n===questions[0]||n.contains(questions[0]));
      const deck=document.createElement('div');deck.className='classroom-questions';inner.insertBefore(deck,anchor.nextSibling);
      const controls=document.createElement('div');controls.className='question-pages';controls.setAttribute('role','group');controls.setAttribute('aria-label','Questions on this slide');
      const panels=[];
      questions.forEach((q,i)=>{
        const id=q.dataset.question,items=P.questionNotes[id];if(!items?.length)throw Error('Missing pre-question notes: '+id);
        const panel=document.createElement('div');panel.className='classroom-question-page';panel.id='question-page-'+id;panel.hidden=i!==0;
        panel.innerHTML='<aside class="classroom-key-notes before-question"><h3>Before you answer</h3><ul>'+items.map(t=>'<li>'+textMath(t)+'</li>').join('')+'</ul></aside>';panel.append(q);panels.push(panel);
        const button=document.createElement('button');button.type='button';button.className='btn secondary';button.textContent='Question '+(i+1)+' of '+questions.length;button.setAttribute('aria-controls',panel.id);button.setAttribute('aria-pressed',String(i===0));
        button.addEventListener('click',()=>{panels.forEach((p,j)=>p.hidden=j!==i);[...controls.children].forEach((b,j)=>b.setAttribute('aria-pressed',String(i===j)));});controls.append(button);
      });
      if(questions.length>1)deck.append(controls);panels.forEach(p=>deck.append(p));
      inner.querySelectorAll('.grid').forEach(g=>{if(!g.children.length)g.remove();});
    }
    document.querySelectorAll('[data-frq]').forEach(el=>{const aside=document.createElement('aside');aside.className='classroom-key-notes before-written';aside.innerHTML='<h3>Plan your response</h3><ul>'+P.writtenNotes.map(t=>'<li>'+textMath(t)+'</li>').join('')+'</ul>';el.before(aside);});
  }
  window.RatesClassroom={ready(){
    prepareQuestions();
    window.RatesIdeas?.init();
    document.querySelectorAll('[data-classroom-plot="segments"]').forEach(el=>el.innerHTML=window.RatesGraphs.plot({title:'Straight segments joining (2,14), (5,−1), and (8,2)',bounds:[0,9,-4,16],stepX:1,stepY:4,curves:[{points:[[2,14],[5,-1],[8,2]]}],points:[[2,14],[5,-1],[8,2]].map(([x,y])=>({x,y,label:`(${x}, ${y})`}))}));
  },update(slide){
    let active=P.navigation.find(([id])=>id===slide.id)?.[0];
    if(!active){const i=P.order.indexOf(slide.id);active=i<0?'roadmap':P.navigation.filter(([id])=>P.order.indexOf(id)<=i).at(-1)?.[0]||'warm-up';}
    nav.querySelectorAll('button').forEach(b=>{if(b.dataset.go===active)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current');});
  }};
})();
