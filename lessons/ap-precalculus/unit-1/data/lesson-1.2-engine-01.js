
(() => {
  'use strict';
  const D = window.ECHS_L12_DATA;
  if (!D) throw new Error('Lesson 1.2 data failed to load.');

  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => [...r.querySelectorAll(s)];
  const viewport = $('#slideViewport');
  const stageLabel = $('#currentStage');
  const counter = $('#slideCounter');
  const progressFill = $('#progressFill');
  const prevBtn = $('#prevBtn');
  const nextBtn = $('#nextBtn');
  const map = $('#slideMap');
  const notebook = $('#notebookDrawer');
  const backdrop = $('#drawerBackdrop');
  const toast = $('#toast');
  const STORAGE = 'echs-ap-precalculus-1.2';
  let current = 0;
  let quizTimer = null;

  const safe = value => String(value ?? '');
  const toastMessage = message => {
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove('show'), 1800);
  };

  function slideMarkup(s, i) {
    const titleClass = s.id === 'launch' ? ' title-slide' : '';
    return `<section class="slide${titleClass}" data-id="${s.id}" data-stage="${safe(s.stage)}" data-tier="${safe(s.tier)}" aria-hidden="true">
      <div class="slide-inner">
        ${s.id === 'launch' ? '' : `<header class="slide-head">
          <div><p class="slide-eyebrow">Day ${s.day} · ${safe(s.stage)}</p><h2 class="slide-title">${safe(s.title)}</h2>${s.subtitle ? `<p class="slide-subtitle">${safe(s.subtitle)}</p>` : ''}</div>
          <div class="slide-meta"><span class="tier-badge tier-${safe(s.tier).toLowerCase().replace(/[^a-z]+/g,'-')}">${safe(s.tier)}</span><span class="slide-number-big">${i+1}</span></div>
        </header>`}
        <div class="slide-body">${s.body}</div>
      </div>
    </section>`;
  }

  viewport.innerHTML = D.slides.map(slideMarkup).join('');
  const slideEls = $$('.slide', viewport);

  function indexFromHash() {
    const id = location.hash.replace(/^#/, '');
    const found = D.slides.findIndex(s => s.id === id);
    return found >= 0 ? found : null;
  }

  function showSlide(index, pushHash=true) {
    current = Math.max(0, Math.min(index, slideEls.length - 1));
    slideEls.forEach((el, i) => {
      const active = i === current;
      el.classList.toggle('active', active);
      el.setAttribute('aria-hidden', active ? 'false' : 'true');
    });
    const s = D.slides[current];
    stageLabel.textContent = `Day ${s.day} · ${s.stage} · ${s.tier}`;
    counter.textContent = `${current + 1} / ${slideEls.length}`;
    progressFill.style.width = `${((current + 1) / slideEls.length) * 100}%`;
    prevBtn.disabled = current === 0;
    nextBtn.disabled = current === slideEls.length - 1;
    nextBtn.querySelector('.nav-label').textContent = current === slideEls.length - 1 ? 'Complete' : 'Next';
    localStorage.setItem(`${STORAGE}:slide`, String(current));
    if (pushHash) history.replaceState(null, '', `#${s.id}`);
    viewport.scrollTop = 0;
    updateMap();
  }

  function goToId(id) {
    const i = D.slides.findIndex(s => s.id === id);
    if (i >= 0) showSlide(i);
  }

  prevBtn.addEventListener('click', () => showSlide(current - 1));
  nextBtn.addEventListener('click', () => {
    if (current < slideEls.length - 1) showSlide(current + 1);
    else toastMessage('Lesson route complete.');
  });
  $$('.route-pill').forEach(btn => btn.addEventListener('click', () => goToId(btn.dataset.go)));

  function bindReveals(root=document) {
    $$('.reveal-btn', root).forEach(btn => {
      if (btn.dataset.bound) return;
      btn.dataset.bound = '1';
      btn.dataset.originalLabel = btn.dataset.label || btn.textContent;
      btn.addEventListener('click', () => {
        const panel = btn.nextElementSibling;
        const open = panel.hidden;
        panel.hidden = !open;
        btn.setAttribute('aria-expanded', String(open));
        btn.textContent = open ? 'Hide reasoning' : btn.dataset.originalLabel;
      });
    });
  }

  function bindChoices(root=document) {
    $$('.inline-mcq', root).forEach(box => {
      if (box.dataset.bound) return;
      box.dataset.bound = '1';
      const feedback = $('.choice-feedback', box);
      $$('.choice-btn', box).forEach(btn => btn.addEventListener('click', () => {
        $$('.choice-btn', box).forEach(b => b.classList.remove('selected','correct','incorrect'));
        btn.classList.add('selected');
        const correct = btn.dataset.correct === 'true';
        btn.classList.add(correct ? 'correct' : 'incorrect');
        feedback.textContent = correct ? 'Correct. Explain why the other choices fail.' : 'Not yet. Recheck the quantities, order, and units.';
      }));
    });
  }

  function bindWorkspaces(root=document) {
    $$('textarea[data-save-key]', root).forEach(area => {
      if (area.dataset.bound) return;
      area.dataset.bound = '1';
      const key = `${STORAGE}:work:${area.dataset.saveKey}`;
      area.value = localStorage.getItem(key) || '';
      area.addEventListener('input', () => localStorage.setItem(key, area.value));
    });
  }

  function renderPractice() {
    const host = $('#practiceStudio');
    const levels = ['All','Foundation','Core','AP','Stretch','HOT'];
    const focuses = ['All', ...new Set(D.practice.map(q => q.focus))].sort();
    host.innerHTML = `<div class="studio-toolbar">
      <input id="practiceSearch" type="search" placeholder="Search all 80 questions" aria-label="Search practice questions">
      <select id="practiceFocus" aria-label="Filter by focus">${focuses.map(f=>`<option>${f}</option>`).join('')}</select>
      <div id="practiceLevels" class="level-filters">${levels.map((l,i)=>`<button type="button" class="${i===0?'active':''}" data-level="${l}">${l}</button>`).join('')}</div>
      <span id="practiceCount" class="studio-count"></span>
    </div><div id="practiceList" class="question-list"></div>`;
    let activeLevel = 'All';
    const search = $('#practiceSearch', host);
    const focus = $('#practiceFocus', host);
    const list = $('#practiceList', host);
    const count = $('#practiceCount', host);

    function draw() {
      const term = search.value.trim().toLowerCase();
      const filtered = D.practice.filter(q =>
        (activeLevel === 'All' || q.level === activeLevel) &&
        (focus.value === 'All' || q.focus === focus.value) &&
        (!term || `${q.prompt} ${q.focus} ${q.answer}`.toLowerCase().includes(term))
      );
      count.textContent = `${filtered.length} shown`;
      list.innerHTML = filtered.map(q => `<article class="question-card">
        <header><span class="q-number">${q.id}</span><div><strong>${q.focus}</strong><small>${q.level} · ${q.calc}</small></div></header>
        <p>${q.prompt}</p>
        <button class="reveal-btn" type="button" data-label="Reveal answer">Reveal answer</button>
        <div class="reveal-panel" hidden><p>${q.answer}</p></div>
      </article>`).join('');
      bindReveals(list);
    }
    $$('#practiceLevels button', host).forEach(btn => btn.addEventListener('click', () => {
      activeLevel = btn.dataset.level;
      $$('#practiceLevels button', host).forEach(b=>b.classList.toggle('active', b===btn));
      draw();
    }));
    search.addEventListener('input', draw);
    focus.addEventListener('change', draw);
    draw();
  }

  function renderApRoom() {
    const host = $('#apRoom');
    host.innerHTML = `<div class="assessment-tabs" role="tablist">
      <button class="assessment-tab active" data-panel="mcq" type="button">10 MCQ</button>
      <button class="assessment-tab" data-panel="frq" type="button">2 FRQ</button>
    </div><div id="apMcqPanel" class="assessment-panel active"></div><div id="apFrqPanel" class="assessment-panel"></div>`;
    const mcqPanel = $('#apMcqPanel', host);
    const frqPanel = $('#apFrqPanel', host);
    mcqPanel.innerHTML = D.apMcq.map(q => `<article class="ap-item">
      <header><strong>MCQ ${q.id}</strong><span>${q.calc}</span></header>
      <p>${q.prompt}</p>
      <div class="ap-choices">${q.choices.map((c,i)=>`<button type="button" data-correct="${i===q.correct}">${String.fromCharCode(65+i)}. ${c}</button>`).join('')}</div>
      <div class="choice-feedback" aria-live="polite"></div>
      <button class="reveal-btn" type="button" data-label="Show explanation">Show explanation</button>
      <div class="reveal-panel" hidden><p>${q.explanation}</p></div>
    </article>`).join('');
    $$('.ap-item', mcqPanel).forEach(item => {
      const feedback = $('.choice-feedback', item);
      $$('.ap-choices button', item).forEach(btn => btn.addEventListener('click', () => {
        $$('.ap-choices button', item).forEach(b=>b.classList.remove('correct','incorrect'));
        const ok = btn.dataset.correct === 'true';
        btn.classList.add(ok ? 'correct':'incorrect');
        feedback.textContent = ok ? 'Correct.' : 'Try again before revealing.';
      }));
    });
    frqPanel.innerHTML = D.frqs.map(f => `<article class="frq-card">
      <header><div><strong>${f.title}</strong><span>${f.calc}</span></div></header>
      <p>${f.prompt}</p>
      ${f.table ? `<div class="table-wrap"><table class="data-table"><thead><tr>${f.table.headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${f.table.rows.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`:''}
      <ol class="frq-parts">${f.parts.map(p=>`<li>${p}</li>`).join('')}</ol>
      <label class="workspace"><span>FRQ workspace</span><textarea rows="8" data-save-key="frq-${f.id}" placeholder="Show calculations, units, interpretation, and justification…"></textarea></label>
      <button class="reveal-btn" type="button" data-label="Reveal scoring notes">Reveal scoring notes</button>
      <div class="reveal-panel" hidden><h4>Scoring notes</h4><ul>${f.scoring.map(s=>`<li>${s}</li>`).join('')}</ul><h4>Benchmark solution</h4><p>${f.solution}</p></div>
    </article>`).join('');
    $$('.assessment-tab', host).forEach(btn => btn.addEventListener('click', () => {
      $$('.assessment-tab', host).forEach(b=>b.classList.toggle('active', b===btn));
      mcqPanel.classList.toggle('active', btn.dataset.panel==='mcq');
      frqPanel.classList.toggle('active', btn.dataset.panel==='frq');
    }));
    bindReveals(host);
    bindWorkspaces(host);
  }

  function renderQuiz() {
    const host = $('#timedQuiz');
    host.innerHTML = `<div id="quizIntro" class="quiz-intro">
      <label>Time limit <select id="quizMinutes"><option value="8">8 minutes</option><option value="12" selected>12 minutes</option><option value="15">15 minutes</option></select></label>
      <button id="startQuiz" class="route-button" type="button">Start quiz</button>
    </div><div id="quizRunning" hidden>
      <div class="quiz-status"><strong id="quizTimer">12:00</strong><span id="quizAnswered">0 / ${D.quiz.length} answered</span><button id="submitQuiz" type="button">Submit</button><button id="resetQuiz" type="button">Reset</button></div>
      <div id="quizList"></div><div id="quizResult" class="quiz-result" hidden></div>
    </div>`;
    const intro = $('#quizIntro', host);
    const running = $('#quizRunning', host);
    const list = $('#quizList', host);
    const timerEl = $('#quizTimer', host);
    const answeredEl = $('#quizAnswered', host);
    const result = $('#quizResult', host);
    let remaining = 0;
    let submitted = false;

    function drawQuestions() {
      list.innerHTML = D.quiz.map(q => `<article class="quiz-item" data-id="${q.id}">
        <header><strong>${q.id}</strong><span>${q.calc}</span></header><p>${q.prompt}</p>
        <div class="quiz-options">${q.choices.map((c,i)=>`<label><input type="radio" name="quiz-${q.id}" value="${i}"><span>${String.fromCharCode(65+i)}. ${c}</span></label>`).join('')}</div>
        <p class="quiz-explanation" hidden>${q.explanation}</p>
      </article>`).join('');
      $$('input[type=radio]', list).forEach(input => input.addEventListener('change', () => {
        const answered = D.quiz.filter(q => $(`input[name="quiz-${q.id}"]:checked`, list)).length;
        answeredEl.textContent = `${answered} / ${D.quiz.length} answered`;
      }));
    }
    function formatTime(s){ return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`; }
    function submitQuiz(auto=false) {
      if (submitted) return;
      submitted = true;
      clearInterval(quizTimer);
      let score = 0;
      D.quiz.forEach(q => {
        const chosen = $(`input[name="quiz-${q.id}"]:checked`, list);
        const item = $(`.quiz-item[data-id="${q.id}"]`, list);
        const labels = $$('.quiz-options label', item);
        labels[q.correct].classList.add('correct');
        if (chosen && Number(chosen.value) === q.correct) score++;
        else if (chosen) chosen.closest('label').classList.add('incorrect');
        $('.quiz-explanation', item).hidden = false;
        $$('input', item).forEach(i=>i.disabled=true);
      });
      result.hidden = false;
      result.innerHTML = `<strong>${score} / ${D.quiz.length}</strong><p>${score>=8?'Core mastery demonstrated. Move to AP reasoning or Stretch.':score>=6?'Developing. Review missed focus areas in Practice Studio.':'Return to the Supported Core route and rebuild the foundation.'}</p>${auto?'<p>Time expired; the quiz was submitted automatically.</p>':''}`;
    }
    function reset() {
      clearInterval(quizTimer);
      submitted=false;
      result.hidden=true;
      intro.hidden=false;
      running.hidden=true;
      drawQuestions();
    }
    $('#startQuiz', host).addEventListener('click', () => {
      const mins = Number($('#quizMinutes', host).value);
      remaining = mins*60;
      timerEl.textContent = formatTime(remaining);
      intro.hidden=true; running.hidden=false; submitted=false; result.hidden=true;
      quizTimer=setInterval(()=>{remaining--; timerEl.textContent=formatTime(Math.max(0,remaining)); if(remaining<=0)submitQuiz(true);},1000);
    });
    $('#submitQuiz', host).addEventListener('click', ()=>submitQuiz(false));
    $('#resetQuiz', host).addEventListener('click', reset);
    drawQuestions();
  }

  function buildMap() {
    const list = $('#mapList');
    list.innerHTML = D.slides.map((s,i)=>`<button type="button" data-index="${i}"><span>${i+1}</span><div><strong>${s.title}</strong><small>Day ${s.day} · ${s.stage} · ${s.tier}</small></div></button>`).join('');
    $$('button', list).forEach(btn => btn.addEventListener('click', () => {showSlide(Number(btn.dataset.index)); closeDrawers();}));
  }
  function updateMap() {
    $$('#mapList button').forEach((b,i)=>b.classList.toggle('active',i===current));
  }
  function openDrawer(which) {
    closeDrawers();
    which.classList.add('open');
    which.setAttribute('aria-hidden','false');
    backdrop.classList.add('show');
  }
  function closeDrawers() {
    [map,notebook].forEach(d=>{d.classList.remove('open');d.setAttribute('aria-hidden','true');});
    backdrop.classList.remove('show');
  }
  $('#mapBtn').addEventListener('click',()=>openDrawer(map));
  $('#notesBtn').addEventListener('click',()=>openDrawer(notebook));
  $('#closeMap').addEventListener('click',closeDrawers);
  $('#closeNotebook').addEventListener('click',closeDrawers);
  backdrop.addEventListener('click',closeDrawers);

  const globalNotes = $('#globalNotebook');
  globalNotes.value = localStorage.getItem(`${STORAGE}:notes`) || '';
  globalNotes.addEventListener('input',()=>localStorage.setItem(`${STORAGE}:notes`,globalNotes.value));
  $('#exportWork').addEventListener('click',()=>{
    const lines = [`ECHS AP Precalculus 1.2 — exported work`,`Global notes:`,globalNotes.value,''];
    $$('textarea[data-save-key]').forEach(a=>{if(a.value.trim())lines.push(`${a.dataset.saveKey}:`,a.value,'');});
    const blob = new Blob([lines.join('\n')],{type:'text/plain'});
    const link = document.createElement('a'); link.href=URL.createObjectURL(blob); link.download='ECHS_AP_Precalculus_1.2_Work.txt'; link.click(); URL.revokeObjectURL(link.href);
  });

  $('#revealCurrent').addEventListener('click',()=>{
    $$('.reveal-panel', slideEls[current]).forEach(p=>p.hidden=false);
    $$('.reveal-btn', slideEls[current]).forEach(b=>b.setAttribute('aria-expanded','true'));
    toastMessage('Current-slide reasoning revealed.');
  });
  $('#fullscreenBtn').addEventListener('click',()=>{
    if(!document.fullscreenElement) document.documentElement.requestFullscreen?.();
    else document.exitFullscreen?.();
  });

  document.addEventListener('keydown',e=>{
    if (/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
    if(e.key==='ArrowRight'||e.key==='PageDown') showSlide(current+1);
    if(e.key==='ArrowLeft'||e.key==='PageUp') showSlide(current-1);
    if(e.key.toLowerCase()==='m') openDrawer(map);
    if(e.key.toLowerCase()==='n') openDrawer(notebook);
    if(e.key==='Escape') closeDrawers();
  });
  window.addEventListener('hashchange',()=>{const i=indexFromHash();if(i!==null)showSlide(i,false);});

  renderPractice();
  renderApRoom();
  renderQuiz();
  bindReveals();
  bindChoices();
  bindWorkspaces();
  buildMap();

  const initialHash=indexFromHash();
  const saved=Number(localStorage.getItem(`${STORAGE}:slide`));
  showSlide(initialHash ?? (Number.isFinite(saved)?saved:0), initialHash===null);
  document.body.classList.add('ready');
})();
