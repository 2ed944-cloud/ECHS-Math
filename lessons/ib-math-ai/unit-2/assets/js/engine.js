(function(){

// The lesson restores its own slide index. Restoring the previous document's
// scroll offset after that render can hide the new slide's heading on mobile.
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
window.addEventListener('pageshow', () => {
  if (!location.hash || location.hash === '#learn') {
    window.scrollTo({top: 0, behavior: 'instant'});
  }
});

const katex = window.katex;
if (!katex) {
  document.body.innerHTML = '<main style="padding:40px;font-family:system-ui"><h1>Math renderer could not be loaded.</h1><p>Extract the complete ZIP folder before opening the lesson.</p></main>';
  throw new Error('KaTeX global is missing');
}

const data = window.LESSON_DATA;
if (!data) {
  document.body.innerHTML = '<main style="padding:40px;font-family:system-ui"><h1>Lesson data could not be loaded.</h1><p>Open this file from the complete extracted unit folder.</p></main>';
  throw new Error('LESSON_DATA is missing');
}

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const app = $('#app');
const footer = $('#lesson-footer');
const prevButton = $('#prev-slide');
const nextButton = $('#next-slide');
const mapButton = $('#open-map');
const drawer = $('#slide-drawer');
const drawerList = $('#drawer-list');
const backdrop = $('#drawer-backdrop');
const closeDrawerButton = $('#close-map');
const progressFill = $('#progress-fill');
const progressLabel = $('#progress-label');
const routeButtons = $$('.route-btn');
const titleNode = $('#header-lesson-title');
const subtitleNode = $('#header-unit-title');

const prefix = `echs:ib-ai:u2:${data.lesson.number}:`;
const memoryStorage = new Map();
const storage = {
  getItem(key) {
    try { return window.localStorage.getItem(key); }
    catch { return memoryStorage.has(key) ? memoryStorage.get(key) : null; }
  },
  setItem(key, value) {
    try { window.localStorage.setItem(key, String(value)); }
    catch { memoryStorage.set(key, String(value)); }
  },
  removeItem(key) {
    try { window.localStorage.removeItem(key); }
    catch { memoryStorage.delete(key); }
  },
  keys() {
    try { return Object.keys(window.localStorage); }
    catch { return [...memoryStorage.keys()]; }
  }
};
const levels = ['All', 'Foundation', 'Application', 'Reasoning', 'Challenge'];
let activeRoute = 'learn';
let learnIndex = Number(storage.getItem(prefix + 'learn-index') || 0);
let practiceFilter = storage.getItem(prefix + 'practice-filter') || 'All';
let practiceIndex = Number(storage.getItem(prefix + 'practice-index') || 0);
let quizIndex = Number(storage.getItem(prefix + 'quiz-index') || 0);
let quizTimer = null;

function getJSON(key, fallback) {
  try { return JSON.parse(storage.getItem(prefix + key)) ?? fallback; }
  catch { return fallback; }
}
function setJSON(key, value) { storage.setItem(prefix + key, JSON.stringify(value)); }
function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
}
function normalizeText(value) {
  return String(value ?? '').toLowerCase().replace(/[−–—]/g, '-').replace(/×/g, 'x').replace(/[,\s]+/g, ' ').trim();
}
function compactText(value) { return normalizeText(value).replace(/\s+/g, ''); }
function numberFrom(value) {
  const cleaned = String(value ?? '').replace(/,/g, '').replace(/[−–—]/g, '-').trim();
  const scientific = cleaned.match(/([-+]?\d*\.?\d+)\s*(?:×|x|\*)\s*10\s*\^?\s*\{?\s*([-+]?\d+)\s*\}?/i);
  if (scientific) return Number(scientific[1]) * 10 ** Number(scientific[2]);
  const match = cleaned.match(/[-+]?\d*\.?\d+(?:e[-+]?\d+)?/i);
  return match ? Number(match[0]) : NaN;
}
function formatNumber(value, digits = 6) {
  if (!Number.isFinite(value)) return 'undefined';
  if (value === 0) return '0';
  if (Math.abs(value) >= 1e7 || Math.abs(value) < 1e-4) return value.toExponential(5).replace(/\.0+(?=e)/, '');
  return Number(value.toFixed(digits)).toLocaleString('en-US', {maximumFractionDigits: digits});
}

function renderMath(root = document) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent || parent.closest('script,style,textarea,input,.katex')) return NodeFilter.FILTER_REJECT;
      return /\\\[|\\\(/.test(node.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    }
  });
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  const pattern = /\\\[([\s\S]+?)\\\]|\\\(([\s\S]+?)\\\)/g;
  for (const node of nodes) {
    const text = node.nodeValue;
    let match, last = 0;
    const fragment = document.createDocumentFragment();
    while ((match = pattern.exec(text)) !== null) {
      if (match.index > last) fragment.append(document.createTextNode(text.slice(last, match.index)));
      const displayMode = match[1] !== undefined;
      const expression = displayMode ? match[1] : match[2];
      const holder = document.createElement(displayMode ? 'div' : 'span');
      holder.className = displayMode ? 'math-display' : 'math-inline';
      try {
        holder.innerHTML = katex.renderToString(expression, {displayMode, throwOnError: false, strict: 'ignore', trust: false});
      } catch (error) {
        holder.textContent = expression;
        holder.dataset.mathError = 'true';
        console.warn('Math rendering fallback:', expression, error);
      }
      fragment.append(holder);
      last = pattern.lastIndex;
    }
    if (last < text.length) fragment.append(document.createTextNode(text.slice(last)));
    node.replaceWith(fragment);
  }
}

function setRoute(route, pushHash = true) {
  const allowed = ['learn', 'practice', 'exam', 'quiz', 'review'];
  activeRoute = allowed.includes(route) ? route : 'learn';
  routeButtons.forEach(button => button.classList.toggle('active', button.dataset.route === activeRoute));
  if (pushHash && location.hash !== `#${activeRoute}`) history.replaceState(null, '', `#${activeRoute}`);
  closeDrawer();
  renderRoute();
}

function renderRoute() {
  clearInterval(quizTimer);
  quizTimer = null;
  if (activeRoute === 'learn') renderLearn();
  if (activeRoute === 'practice') renderPractice();
  if (activeRoute === 'exam') renderExam();
  if (activeRoute === 'quiz') renderQuiz();
  if (activeRoute === 'review') renderReview();
  titleNode.textContent = `${data.lesson.number} · ${data.lesson.title}`;
  subtitleNode.textContent = `${data.course} · ${data.unit.title}`;
  document.body.dataset.rendered = '1';
}

function showFooter(show) {
  footer.style.display = show ? 'grid' : 'none';
  app.style.paddingBottom = show ? '' : '40px';
}

function renderLearn() {
  showFooter(true);
  learnIndex = clamp(learnIndex, 0, data.slides.length - 1);
  storage.setItem(prefix + 'learn-index', String(learnIndex));
  const visited = getJSON('visited-slides', []);
  if (!visited.includes(learnIndex)) { visited.push(learnIndex); setJSON('visited-slides', visited); }
  const slide = data.slides[learnIndex];
  const slideHeading = slide.kind === 'cover'
    ? (slide.eyebrow ? `<div class="slide-eyebrow">${escapeHtml(slide.eyebrow)}</div>` : '')
    : `<div class="slide-section">${escapeHtml(slide.section)}</div>${slide.eyebrow ? `<div class="slide-eyebrow">${escapeHtml(slide.eyebrow)}</div>` : ''}<h1 class="slide-title">${escapeHtml(slide.title)}</h1>`;
  app.innerHTML = `<section class="stage" aria-live="polite"><div class="stage-inner">
    ${slideHeading}
    <div class="slide-body slide-${escapeHtml(slide.kind || 'content')}">${slide.html}</div>
  </div></section>`;
  prevButton.disabled = learnIndex === 0;
  nextButton.disabled = learnIndex === data.slides.length - 1;
  const percent = ((learnIndex + 1) / data.slides.length) * 100;
  progressFill.style.width = `${percent}%`;
  progressLabel.textContent = `${learnIndex + 1} / ${data.slides.length}`;
  buildDrawer();
  restoreSlideInputs();
  renderMath(app);
  initializeLab();
  $$('.route-jump', app).forEach(button => button.addEventListener('click', () => setRoute(button.dataset.go)));
  window.scrollTo({top: 0, behavior: 'instant'});
}

function restoreSlideInputs() {
  $$('.student-note', app).forEach((node, order) => {
    const key = `note:${learnIndex}:${node.dataset.note || order}`;
    node.value = storage.getItem(prefix + key) || '';
    node.addEventListener('input', () => storage.setItem(prefix + key, node.value));
  });
  $$('[data-reflect]', app).forEach(node => {
    const key = `reflect:${node.dataset.reflect}`;
    node.checked = storage.getItem(prefix + key) === '1';
    node.addEventListener('change', () => storage.setItem(prefix + key, node.checked ? '1' : '0'));
  });
}

function goSlide(delta) {
  const target = clamp(learnIndex + delta, 0, data.slides.length - 1);
  if (target !== learnIndex) { learnIndex = target; renderLearn(); }
}
function buildDrawer() {
  drawerList.innerHTML = data.slides.map((slide, index) => `<button class="drawer-item ${index === learnIndex ? 'active' : ''}" data-slide-index="${index}"><b>${index + 1}. ${escapeHtml(slide.title)}</b><small>${escapeHtml(slide.section)}</small></button>`).join('');
  $$('[data-slide-index]', drawerList).forEach(button => button.addEventListener('click', () => {
    learnIndex = Number(button.dataset.slideIndex); closeDrawer(); renderLearn();
  }));
}
function openDrawer() { drawer.classList.add('open'); backdrop.classList.add('show'); drawer.setAttribute('aria-hidden', 'false'); }
function closeDrawer() { drawer.classList.remove('open'); backdrop.classList.remove('show'); drawer.setAttribute('aria-hidden', 'true'); }

function questionResult(question, response) {
  if (Array.isArray(question.choices)) {
    const selected = Number(response);
    if (!Number.isInteger(selected)) return {valid:false, correct:false, message:'Select one answer before checking.'};
    return {valid:true, correct:selected === question.correct, message:selected === question.correct ? 'Correct.' : 'Not yet. Review the structure and try again.'};
  }
  if (question.check?.mode === 'number') {
    const value = numberFrom(response);
    if (!Number.isFinite(value)) return {valid:false, correct:false, message:'Enter a numerical response first.'};
    const target = Number(question.check.value);
    const tolerance = Number(question.check.tolerance ?? 1e-6);
    const correct = Math.abs(value - target) <= tolerance;
    return {valid:true, correct, message:correct ? 'Correct within the accepted tolerance.' : 'Not yet. Check units, signs, indexing and rounding.'};
  }
  if (question.check?.mode === 'text') {
    const value = normalizeText(response);
    if (!value) return {valid:false, correct:false, message:'Enter a response first.'};
    const accepted = (question.check.accepted || []).map(normalizeText);
    const compactValue = compactText(response);
    const correct = accepted.some(answer => value === answer || value.includes(answer) || compactValue === compactText(answer));
    return {valid:true, correct, message:correct ? 'Accepted.' : 'Compare your wording with the model answer.'};
  }
  const hasResponse = normalizeText(response).length > 0;
  return {valid:hasResponse, correct:null, message:hasResponse ? 'Open the worked solution and self-assess your reasoning.' : 'Write a response before self-assessing.'};
}

function responseControl(question, saved, namespace) {
  if (Array.isArray(question.choices)) {
    return `<div class="answer-grid">${question.choices.map((choice, index) => `<label class="choice"><input type="radio" name="${namespace}-choice" value="${index}" ${String(saved) === String(index) ? 'checked' : ''}><span><b>${String.fromCharCode(65 + index)}.</b> ${choice}</span></label>`).join('')}</div>`;
  }
  return `<label class="screen-reader-only" for="${namespace}-response">Your response</label><input id="${namespace}-response" class="response-input" type="text" autocomplete="off" value="${escapeHtml(saved || '')}" placeholder="Enter your response">`;
}
function getCurrentResponse(question, namespace) {
  if (Array.isArray(question.choices)) return $(`input[name="${namespace}-choice"]:checked`, app)?.value ?? '';
  return $(`#${namespace}-response`, app)?.value ?? '';
}

function filteredPractice() {
  return practiceFilter === 'All' ? data.practice : data.practice.filter(question => question.level === practiceFilter);
}
function renderPractice() {
  showFooter(false);
  const questions = filteredPractice();
  practiceIndex = clamp(practiceIndex, 0, Math.max(0, questions.length - 1));
  const question = questions[practiceIndex];
  const answers = getJSON('practice-answers', {});
  const results = getJSON('practice-results', {});
  app.innerHTML = `<section class="route-page">
    <header class="route-header"><span class="slide-section">Practice Studio</span><h1>Build fluency, modelling and reasoning</h1><p>${data.practice.length} original questions are balanced across four levels. Work is saved locally on this device.</p></header>
    <div class="studio-toolbar">${levels.map(level => `<button class="filter-btn ${level === practiceFilter ? 'active' : ''}" data-filter="${level}">${level}${level === 'All' ? ` · ${data.practice.length}` : ` · ${data.practice.filter(q=>q.level===level).length}`}</button>`).join('')}</div>
    ${question ? questionCard(question, practiceIndex, questions.length, answers[question.id], results[question.id], 'practice') : '<div class="empty-state">No questions in this filter.</div>'}
    <div class="studio-index">${questions.map((item,index) => `<button class="dot-btn ${index === practiceIndex ? 'current' : ''} ${results[item.id]?.attempted ? 'done' : ''}" data-practice-index="${index}" aria-label="Question ${index + 1}">${index + 1}</button>`).join('')}</div>
  </section>`;
  $$('[data-filter]', app).forEach(button => button.addEventListener('click', () => { practiceFilter = button.dataset.filter; practiceIndex = 0; storage.setItem(prefix + 'practice-filter', practiceFilter); renderPractice(); }));
  $$('[data-practice-index]', app).forEach(button => button.addEventListener('click', () => { practiceIndex = Number(button.dataset.practiceIndex); storage.setItem(prefix + 'practice-index', String(practiceIndex)); renderPractice(); }));
  bindQuestionCard(question, questions, 'practice');
  renderMath(app);
  window.scrollTo({top: 0, behavior:'instant'});
}

function questionCard(question, index, total, savedAnswer, result, namespace) {
  return `<article class="question-shell">
    <div class="question-head"><div><b>${escapeHtml(question.command || 'Solve')} · Question ${index + 1} of ${total}</b></div><div class="question-tags"><span>${escapeHtml(question.level)}</span><span>${question.marks} marks</span><span>${escapeHtml(question.calculator)}</span></div></div>
    <div class="question-body"><div class="question-prompt">${question.prompt}</div>
      ${responseControl(question, savedAnswer, namespace)}
      <div class="question-actions"><button class="primary-btn" id="${namespace}-check">Check response</button><button class="secondary-btn" id="${namespace}-hint">Hint</button><button class="secondary-btn" id="${namespace}-solution">Worked solution</button></div>
      <div class="feedback ${result?.attempted ? 'show ' + (result.correct === true ? 'correct' : result.correct === false ? 'incorrect' : '') : ''}" id="${namespace}-feedback">${result?.message || ''}</div>
      <div class="solution-box" id="${namespace}-solution-box"><b>Answer:</b> ${question.answer}<p>${question.solution}</p></div>
      <div class="workspace"><label><b>Student workspace</b><textarea id="${namespace}-workspace" placeholder="Show substitutions, technology output, units, interpretation and evaluation."></textarea></label></div>
      <div class="question-nav"><button class="secondary-btn" id="${namespace}-previous" ${index === 0 ? 'disabled' : ''}>Previous</button><button class="primary-btn" id="${namespace}-next" ${index === total - 1 ? 'disabled' : ''}>Next</button></div>
    </div>
  </article>`;
}

function bindQuestionCard(question, questions, namespace) {
  if (!question) return;
  const answersKey = namespace === 'quiz' ? 'quiz-answers' : 'practice-answers';
  const resultsKey = namespace === 'quiz' ? 'quiz-results' : 'practice-results';
  const indexVariable = namespace === 'quiz' ? () => quizIndex : () => practiceIndex;
  const rerender = namespace === 'quiz' ? renderQuiz : renderPractice;
  const answers = getJSON(answersKey, {});
  const results = getJSON(resultsKey, {});
  const workspace = $(`#${namespace}-workspace`, app);
  const workspaceKey = `${namespace}-workspace:${question.id}`;
  workspace.value = storage.getItem(prefix + workspaceKey) || '';
  workspace.addEventListener('input', () => storage.setItem(prefix + workspaceKey, workspace.value));
  const saveResponse = () => { answers[question.id] = getCurrentResponse(question, namespace); setJSON(answersKey, answers); };
  $$(`input[name="${namespace}-choice"]`, app).forEach(input => input.addEventListener('change', saveResponse));
  $(`#${namespace}-response`, app)?.addEventListener('input', saveResponse);
  $(`#${namespace}-check`, app).addEventListener('click', () => {
    saveResponse();
    const outcome = questionResult(question, answers[question.id]);
    const feedback = $(`#${namespace}-feedback`, app);
    feedback.className = 'feedback show ' + (outcome.correct === true ? 'correct' : outcome.correct === false ? 'incorrect' : '');
    feedback.textContent = outcome.message;
    if (outcome.valid) {
      results[question.id] = {attempted:true, correct:outcome.correct, message:outcome.message, checkedAt:new Date().toISOString()};
      setJSON(resultsKey, results);
      if (namespace === 'practice') {
        const overall = getJSON('practice-results', {});
        setJSON('practice-results', overall);
      }
    }
  });
  $(`#${namespace}-hint`, app).addEventListener('click', event => {
    const feedback = $(`#${namespace}-feedback`, app);
    feedback.className = 'feedback show';
    feedback.textContent = question.hint || 'Identify the representation, write the governing equation, then check units and constraints.';
    event.currentTarget.textContent = 'Hint shown';
  });
  $(`#${namespace}-solution`, app).addEventListener('click', () => {
    const box = $(`#${namespace}-solution-box`, app);
    box.classList.toggle('show');
    renderMath(box);
  });
  $(`#${namespace}-previous`, app).addEventListener('click', () => {
    if (namespace === 'quiz') quizIndex = clamp(indexVariable() - 1, 0, questions.length - 1);
    else practiceIndex = clamp(indexVariable() - 1, 0, questions.length - 1);
    storage.setItem(prefix + `${namespace}-index`, String(namespace === 'quiz' ? quizIndex : practiceIndex)); rerender();
  });
  $(`#${namespace}-next`, app).addEventListener('click', () => {
    if (namespace === 'quiz') quizIndex = clamp(indexVariable() + 1, 0, questions.length - 1);
    else practiceIndex = clamp(indexVariable() + 1, 0, questions.length - 1);
    storage.setItem(prefix + `${namespace}-index`, String(namespace === 'quiz' ? quizIndex : practiceIndex)); rerender();
  });
}

function renderExam() {
  showFooter(false);
  app.innerHTML = `<section class="route-page"><header class="route-header"><span class="slide-section">IB-style assessment</span><h1>Extended-response practice</h1><p>${data.exam.length} original tasks per lesson. Use command terms, show technology transparently and interpret every contextual result.</p></header>
    ${data.exam.map(task => `<article class="exam-task"><div class="task-meta"><span>${escapeHtml(task.style)}</span><span>${task.total_marks} marks</span><span>${escapeHtml(task.calculator)}</span></div><h2>${escapeHtml(task.title)}</h2><p>${task.context}</p>${task.parts.map(part => `<section class="exam-part"><p><b>(${part.label})</b> ${part.prompt} <span class="marks">[${part.marks}]</span></p><textarea data-exam-note="${task.id}:${part.label}" placeholder="Write a complete response"></textarea><button class="secondary-btn reveal-markscheme" data-target="${task.id}-${part.label}">Reveal markscheme</button><div class="markscheme" id="${task.id}-${part.label}"><b>Model answer:</b> ${part.answer || 'See the method marks.'}<p>${part.markscheme}</p></div></section>`).join('')}</article>`).join('')}
  </section>`;
  $$('[data-exam-note]', app).forEach(node => {
    const key = `exam:${node.dataset.examNote}`;
    node.value = storage.getItem(prefix + key) || '';
    node.addEventListener('input', () => storage.setItem(prefix + key, node.value));
  });
  $$('.reveal-markscheme', app).forEach(button => button.addEventListener('click', () => {
    const target = document.getElementById(button.dataset.target); target.classList.toggle('show'); renderMath(target);
    button.textContent = target.classList.contains('show') ? 'Hide markscheme' : 'Reveal markscheme';
  }));
  renderMath(app);
  window.scrollTo({top: 0, behavior:'instant'});
}

function quizClock() {
  const start = Number(storage.getItem(prefix + 'quiz-start') || Date.now());
  if (!storage.getItem(prefix + 'quiz-start')) storage.setItem(prefix + 'quiz-start', String(start));
  const total = 30 * 60;
  const elapsed = Math.floor((Date.now() - start) / 1000);
  const remaining = Math.max(0, total - elapsed);
  return {remaining, text:`${String(Math.floor(remaining / 60)).padStart(2,'0')}:${String(remaining % 60).padStart(2,'0')}`};
}
function renderQuiz() {
  showFooter(false);
  quizIndex = clamp(quizIndex, 0, data.quiz.length - 1);
  const results = getJSON('quiz-results', {});
  const answers = getJSON('quiz-answers', {});
  const clock = quizClock();
  const correct = Object.values(results).filter(result => result.correct === true).length;
  const attempted = Object.values(results).filter(result => result.attempted).length;
  const question = data.quiz[quizIndex];
  app.innerHTML = `<section class="route-page"><header class="route-header"><div style="display:flex;justify-content:space-between;gap:14px;align-items:center;flex-wrap:wrap"><div><span class="slide-section">Independent quiz</span><h1>${data.quiz.length}-question checkpoint</h1><p>Suggested time: 30 minutes. Questions are distinct from Practice Studio.</p></div><div class="timer" id="quiz-timer">${clock.text}</div></div><p><b>Current score:</b> ${correct} correct · ${attempted} attempted</p></header>
    ${questionCard(question, quizIndex, data.quiz.length, answers[question.id], results[question.id], 'quiz')}
    <div class="studio-index">${data.quiz.map((item,index) => `<button class="dot-btn ${index === quizIndex ? 'current' : ''} ${results[item.id]?.attempted ? 'done' : ''}" data-quiz-index="${index}">${index + 1}</button>`).join('')}</div>
    <button class="secondary-btn" id="restart-quiz">Restart timer and responses</button>
  </section>`;
  $$('[data-quiz-index]', app).forEach(button => button.addEventListener('click', () => { quizIndex = Number(button.dataset.quizIndex); storage.setItem(prefix + 'quiz-index', String(quizIndex)); renderQuiz(); }));
  $('#restart-quiz', app).addEventListener('click', () => {
    if (confirm('Clear this quiz attempt and restart the 30-minute timer?')) {
      ['quiz-start','quiz-results','quiz-answers','quiz-index'].forEach(key => storage.removeItem(prefix + key));
      quizIndex = 0; renderQuiz();
    }
  });
  bindQuestionCard(question, data.quiz, 'quiz');
  renderMath(app);
  quizTimer = setInterval(() => {
    const node = $('#quiz-timer'); if (!node) return;
    const next = quizClock(); node.textContent = next.text;
    if (next.remaining === 0) { node.textContent = 'Time'; clearInterval(quizTimer); }
  }, 1000);
  window.scrollTo({top: 0, behavior:'instant'});
}

function renderReview() {
  showFooter(false);
  const visited = new Set(getJSON('visited-slides', []));
  const practiceResults = getJSON('practice-results', {});
  const quizResults = getJSON('quiz-results', {});
  const practiceAttempted = Object.values(practiceResults).filter(x => x.attempted).length;
  const practiceCorrect = Object.values(practiceResults).filter(x => x.correct === true).length;
  const quizAttempted = Object.values(quizResults).filter(x => x.attempted).length;
  const quizCorrect = Object.values(quizResults).filter(x => x.correct === true).length;
  const learningPercent = Math.round(100 * visited.size / data.slides.length);
  const practicePercent = practiceAttempted ? Math.round(100 * practiceCorrect / practiceAttempted) : 0;
  const quizPercent = quizAttempted ? Math.round(100 * quizCorrect / data.quiz.length) : 0;
  const mastery = Math.round(0.25 * learningPercent + 0.45 * practicePercent + 0.30 * quizPercent);
  const levelRows = ['Foundation','Application','Reasoning','Challenge'].map(level => {
    const ids = data.practice.filter(q => q.level === level).map(q => q.id);
    const attempted = ids.filter(id => practiceResults[id]?.attempted).length;
    const correct = ids.filter(id => practiceResults[id]?.correct === true).length;
    const percent = attempted ? Math.round(100 * correct / attempted) : 0;
    return `<div class="stat-card"><span>${level}</span><b>${correct}/${attempted}</b><small>correct / attempted</small><div class="mastery-bar"><span style="width:${percent}%"></span></div></div>`;
  }).join('');
  app.innerHTML = `<section class="route-page"><header class="route-header"><span class="slide-section">Mastery review</span><h1>Evidence of progress</h1><p>This dashboard uses only local browser data. It does not transmit student work.</p></header>
    <div class="review-grid"><div class="stat-card"><span>Learn route</span><b>${visited.size}/${data.slides.length}</b><small>${learningPercent}% viewed</small></div><div class="stat-card"><span>Practice</span><b>${practiceCorrect}/${practiceAttempted}</b><small>${practicePercent}% of attempted correct</small></div><div class="stat-card"><span>Quiz</span><b>${quizCorrect}/${data.quiz.length}</b><small>${quizPercent}% of full quiz</small></div><div class="stat-card"><span>Readiness indicator</span><b>${mastery}%</b><small>weighted learning evidence</small></div></div>
    <h2>Practice level evidence</h2><div class="review-grid">${levelRows}</div>
    <div class="unit-docs"><h2>Next best action</h2><p>${mastery >= 80 ? 'Attempt the two extended-response tasks without support, then explain one modelling limitation.' : mastery >= 55 ? 'Return to Reasoning and Challenge questions, then complete the timed quiz.' : 'Revisit the concept cycles and complete Foundation and Application practice before timing yourself.'}</p><button class="primary-btn" data-review-go="${mastery >= 80 ? 'exam' : mastery >= 55 ? 'quiz' : 'learn'}">Open recommended route</button> <button class="primary-btn" id="mark-lesson-complete">Mark lesson complete</button> <button class="secondary-btn" id="reset-progress">Reset lesson progress</button><div class="completion-feedback" id="completion-feedback"></div></div>
  </section>`;
  $('[data-review-go]', app).addEventListener('click', event => setRoute(event.currentTarget.dataset.reviewGo));
  $('#mark-lesson-complete', app)?.addEventListener('click', () => {
    const params=new URLSearchParams(location.search);
    const key=params.get('lessonKey')||`ib-math-ai::1::${data.lesson.number}::${data.lesson.title}`;
    let rows=[]; try{rows=JSON.parse(localStorage.getItem('echs_math_complete')||'[]');if(!Array.isArray(rows))rows=[];}catch{rows=[];}
    if(!rows.includes(key))rows.push(key);
    try{localStorage.setItem('echs_math_complete',JSON.stringify(rows));}catch{}
    const detail={course:'ib-math-ai',unit:2,topic:data.lesson.number,lessonKey:key,title:data.lesson.title,completed:true,at:new Date().toISOString()};
    document.dispatchEvent(new CustomEvent('echs:lesson-complete',{detail}));
    try{window.parent?.postMessage({type:'echs:lesson-complete',detail},'*');}catch{}
    const node=$('#completion-feedback',app);if(node){node.textContent='Lesson completion saved on this device and shared with the platform bridge.';node.classList.add('show');}
  });
  $('#reset-progress', app).addEventListener('click', () => {
    if (confirm('Delete all locally saved progress for this lesson?')) {
      storage.keys().filter(key => key.startsWith(prefix)).forEach(key => storage.removeItem(key));
      learnIndex = 0; practiceIndex = 0; quizIndex = 0; renderReview();
    }
  });
  window.scrollTo({top: 0, behavior:'instant'});
}

function initializeLab() {
  const lab = $('#lesson-lab', app);
  if (!lab) return;
  const number = lab.dataset.lab;
  const graph = (points, linePath='', extra='') => `<svg class="lab-graph" viewBox="0 0 560 280" role="img" aria-label="Interactive model graph"><rect width="560" height="280" rx="18" fill="#fff"/><g stroke="#ded8cf" stroke-width="1">${Array.from({length:12},(_,i)=>`<line x1="${40+i*40}" y1="20" x2="${40+i*40}" y2="245"/>`).join('')}${Array.from({length:8},(_,i)=>`<line x1="35" y1="${35+i*28}" x2="530" y2="${35+i*28}"/>`).join('')}</g><line x1="35" y1="235" x2="530" y2="235" stroke="#17324d" stroke-width="2"/><line x1="60" y1="250" x2="60" y2="20" stroke="#17324d" stroke-width="2"/>${linePath?`<path d="${linePath}" fill="none" stroke="#7a1733" stroke-width="4"/>`:''}${points.map(p=>`<circle cx="${p[0]}" cy="${p[1]}" r="5" fill="#177e89"/>`).join('')}${extra}</svg>`;
  const configs = {
    '2.1': {fields:[['a','Lower-domain endpoint',0],['b','Upper-domain endpoint',12],['m','Gradient',2.4],['c','Intercept',5]], calculate(v){const lo=Math.min(v.a,v.b),hi=Math.max(v.a,v.b),y1=v.m*lo+v.c,y2=v.m*hi+v.c;return {text:`Domain [${formatNumber(lo)}, ${formatNumber(hi)}]; endpoint outputs ${formatNumber(y1)} and ${formatNumber(y2)}; range [${formatNumber(Math.min(y1,y2))}, ${formatNumber(Math.max(y1,y2))}] for this linear model.`,graph:graph([],`M60 ${215-(y1*3)} L500 ${215-(y2*3)}`)};}},
    '2.2': {fields:[['m','Line gradient',1.5],['c','Line intercept',3],['a','Quadratic a',-0.35],['h','Quadratic h',6],['k','Quadratic k',14]], calculate(v){const A=v.a,B=-2*v.a*v.h-v.m,C=v.a*v.h*v.h+v.k-v.c,disc=B*B-4*A*C;let roots='No real intersections';if(Math.abs(A)<1e-12){roots='Quadratic coefficient must be non-zero.'}else if(disc>=0){const r1=(-B-Math.sqrt(disc))/(2*A),r2=(-B+Math.sqrt(disc))/(2*A);roots=`Intersections at x≈${formatNumber(r1,3)} and x≈${formatNumber(r2,3)}.`}return {text:`Line y=${formatNumber(v.m)}x+${formatNumber(v.c)}; quadratic y=${formatNumber(v.a)}(x−${formatNumber(v.h)})²+${formatNumber(v.k)}. ${roots}`,graph:graph([],`M60 ${220-v.c*5} L500 ${220-(v.m*14+v.c)*5} M60 210 Q280 ${30-v.k*2} 500 210`)};}},
    '2.3': {fields:[['r1','Polynomial root 1',-2],['r2','Polynomial root 2',3],['r3','Polynomial root 3',7],['asymptote','Rational vertical asymptote',5]], calculate(v){const sum=v.r1+v.r2+v.r3,prod=v.r1*v.r2*v.r3;return {text:`For p(x)=(x−r₁)(x−r₂)(x−r₃), sum of roots=${formatNumber(sum)} and product=${formatNumber(prod)}. A separate rational model with denominator x−${formatNumber(v.asymptote)} excludes x=${formatNumber(v.asymptote)} and has a vertical asymptote unless the factor cancels.`,graph:graph([],`M40 210 C120 30 190 235 270 105 S410 45 520 205`,`<line x1="${60+v.asymptote*35}" y1="20" x2="${60+v.asymptote*35}" y2="245" stroke="#d4a72c" stroke-width="3" stroke-dasharray="8 6"/>`)};}},
    '2.4': {fields:[['initial','Initial value',600],['factor','Growth/decay factor',1.08],['target','Threshold',1000],['shift','Horizontal asymptote',0]], calculate(v){if(v.initial<=0||v.factor<=0||v.factor===1||v.target<=v.shift)return {text:'Use positive values, a factor different from 1, and a target above the asymptote.'};const t=Math.log((v.target-v.shift)/v.initial)/Math.log(v.factor);return {text:`Model A(t)=${formatNumber(v.initial)}(${formatNumber(v.factor)})^t+${formatNumber(v.shift)}. Threshold time t≈${formatNumber(t,4)}. ${t>=0?'Interpret the first whole interval only when the context is discrete.':'The threshold occurred before t=0 for these inputs.'}`,graph:graph([],`M60 220 C180 215 310 170 500 45`,`<line x1="35" y1="${220-v.shift}" x2="530" y2="${220-v.shift}" stroke="#d4a72c" stroke-width="3" stroke-dasharray="8 6"/>`)};}},
    '2.5': {fields:[['x','Original point x',6],['y','Original point y',-2],['b','Inside scale b',2],['h','Horizontal shift h',4],['a','Outside scale a',-3],['k','Vertical shift k',5]], calculate(v){if(v.b===0)return {text:'Inside scale b cannot be zero.'};const nx=v.x/v.b+v.h,ny=v.a*v.y+v.k;return {text:`Under g(x)=a f(b(x−h))+k, (${formatNumber(v.x)},${formatNumber(v.y)}) maps to (${formatNumber(nx)},${formatNumber(ny)}). The inverse-point reflection would instead swap coordinates.`,graph:graph([[60+v.x*28,210-v.y*10],[60+nx*28,210-ny*10]],'',`<line x1="45" y1="235" x2="490" y2="25" stroke="#177e89" stroke-width="2" stroke-dasharray="8 6"/>`)};}},
    '2.6': {fields:[['x1','x₁',1],['y1','y₁',54],['x2','x₂',2],['y2','y₂',59],['x3','x₃',3],['y3','y₃',67],['x4','x₄',4],['y4','y₄',71],['x5','x₅',5],['y5','y₅',78]], calculate(v){const xs=[v.x1,v.x2,v.x3,v.x4,v.x5],ys=[v.y1,v.y2,v.y3,v.y4,v.y5],xm=xs.reduce((a,b)=>a+b,0)/xs.length,ym=ys.reduce((a,b)=>a+b,0)/ys.length,sxx=xs.reduce((s,x)=>s+(x-xm)**2,0),sxy=xs.reduce((s,x,i)=>s+(x-xm)*(ys[i]-ym),0),m=sxy/sxx,a=ym-m*xm,preds=xs.map(x=>a+m*x),sse=ys.reduce((s,y,i)=>s+(y-preds[i])**2,0),sst=ys.reduce((s,y)=>s+(y-ym)**2,0),r2=sst?1-sse/sst:1;const pts=xs.map((x,i)=>[60+(x-Math.min(...xs))*95,220-(ys[i]-Math.min(...ys))*7]);return {text:`Least-squares model ŷ=${formatNumber(a,4)}+${formatNumber(m,4)}x; R²=${formatNumber(r2,5)}. Inspect whether residuals are randomly scattered before accepting a linear model.`,graph:graph(pts,`M60 ${220-(a+m*Math.min(...xs)-Math.min(...ys))*7} L440 ${220-(a+m*Math.max(...xs)-Math.min(...ys))*7}`)};}},
  };
  const config=configs[number]; if(!config)return;
  lab.innerHTML=`<div class="lab-grid">${config.fields.map(([key,label,value])=>`<label>${label}<input type="number" step="any" data-lab-field="${key}" value="${value}"></label>`).join('')}</div><button class="primary-btn" id="run-lab">Calculate, graph and interpret</button><div class="lab-output" id="lab-output">Change inputs, predict, then calculate.</div><div id="lab-graph"></div>`;
  const run=()=>{const values=Object.fromEntries($$('[data-lab-field]',lab).map(input=>[input.dataset.labField,Number(input.value)]));const result=config.calculate(values);$('#lab-output',lab).textContent=result.text||'';$('#lab-graph',lab).innerHTML=result.graph||'';};
  $('#run-lab',lab).addEventListener('click',run);$$('[data-lab-field]',lab).forEach(input=>input.addEventListener('change',run));run();
}

routeButtons.forEach(button => button.addEventListener('click', () => setRoute(button.dataset.route)));
prevButton.addEventListener('click', () => goSlide(-1));
nextButton.addEventListener('click', () => goSlide(1));
mapButton.addEventListener('click', openDrawer);
closeDrawerButton.addEventListener('click', closeDrawer);
backdrop.addEventListener('click', closeDrawer);
$('#lesson-home').addEventListener('click', () => { location.href = '../START_HERE.html'; });
window.addEventListener('keydown', event => {
  if (activeRoute !== 'learn' || /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || '')) return;
  if (event.key === 'ArrowLeft') goSlide(-1);
  if (event.key === 'ArrowRight') goSlide(1);
  if (event.key === 'Escape') closeDrawer();
});
window.addEventListener('hashchange', () => setRoute(location.hash.slice(1) || 'learn', false));
setRoute(location.hash.slice(1) || 'learn', false);

})();
