(function(){

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
  const kind = data.lab?.kind || 'line';
  const presets = {
    line:[1.5,2,0], quadratic:[1,-2,-3], function:[1,1,0], inverse:[1.4,2,0], exponential:[1.3,1.25,0], log:[1,2,0], composition:[1.2,2,1], 'inverse-algebra':[1.5,2,0], transform:[1.4,2,-1], rational:[2,1,1], 'log-base':[1,3,0], threshold:[2,1.2,4], regression:[1.3,2,0], polynomial:[.15,-1,2], power:[1.2,2,0], decay:[12,.82,0], sinusoidal:[3,6,2], voronoi:[2,3,4], finance:[1000,.06,6]
  };
  const defaults=presets[kind]||presets.line;
  const labels=kind==='finance'?['Principal','Annual rate','Periods']:kind==='sinusoidal'?['Amplitude','Period','Midline']:kind==='voronoi'?['Site A offset','Site B offset','Site C offset']:['Parameter a','Parameter b','Parameter c'];
  lab.innerHTML=`<div class="lab-grid">${labels.map((label,index)=>`<label>${label}<input type="number" step="any" data-lab-field="p${index}" value="${defaults[index]}"></label>`).join('')}</div><button class="primary-btn" id="run-lab">Update model</button><div class="lab-output" id="lab-output">Change one parameter, predict the effect, then compare.</div><canvas class="topic-canvas" id="lab-canvas" width="760" height="360" aria-label="Interactive ${escapeHtml(data.lesson.title)} graph"></canvas>`;
  const canvas=$('#lab-canvas',lab),ctx=canvas.getContext('2d');
  const evaluate=(x,a,b,c)=>{
    if(kind==='quadratic')return a*(x-b)**2+c;
    if(kind==='polynomial')return a*x**3+b*x+c;
    if(['exponential','threshold'].includes(kind))return a*b**x+c;
    if(kind==='decay')return a*b**x+c;
    if(['log','log-base'].includes(kind))return x>0?a*Math.log(x)/Math.log(Math.max(1.05,Math.abs(b)))+c:NaN;
    if(kind==='rational')return Math.abs(x-b)<.03?NaN:a/(x-b)+c;
    if(kind==='power')return x>=0?a*x**b+c:NaN;
    if(kind==='sinusoidal')return a*Math.cos(2*Math.PI*x/Math.max(.2,Math.abs(b)))+c;
    if(kind==='inverse'||kind==='inverse-algebra')return (x-c)/a-b;
    if(kind==='composition')return a*(x+b)+c;
    if(kind==='transform')return a*Math.abs(x-b)+c;
    return a*x+b+c;
  };
  const run=()=>{
    const [a,b,c]=[0,1,2].map(i=>Number($(`[data-lab-field="p${i}"]`,lab).value));
    ctx.clearRect(0,0,canvas.width,canvas.height);ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.strokeStyle='#ded8cf';ctx.lineWidth=1;for(let x=40;x<canvas.width;x+=40){ctx.beginPath();ctx.moveTo(x,20);ctx.lineTo(x,335);ctx.stroke()}for(let y=20;y<canvas.height;y+=30){ctx.beginPath();ctx.moveTo(25,y);ctx.lineTo(740,y);ctx.stroke()}
    ctx.strokeStyle='#17324d';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(25,180);ctx.lineTo(740,180);ctx.moveTo(380,15);ctx.lineTo(380,345);ctx.stroke();
    if(kind==='voronoi'){
      const sites=[[170+a*8,95+b*5],[500-b*7,90+c*5],[350+c*8,265-a*5]];ctx.fillStyle='#7a1733';for(const [x,y] of sites){ctx.beginPath();ctx.arc(x,y,8,0,2*Math.PI);ctx.fill()}ctx.strokeStyle='#177e89';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(335,20);ctx.lineTo(340,170);ctx.lineTo(95,335);ctx.moveTo(340,170);ctx.lineTo(670,335);ctx.stroke();
    }else if(kind==='finance'){
      const rate=b,periods=Math.max(1,Math.min(10,Math.round(c)));for(let i=0;i<=periods;i++){const value=a*(1+rate)**i,height=Math.min(285,value/Math.max(1,a)*110);ctx.fillStyle=`rgba(122,23,51,${.35+.55*i/periods})`;ctx.fillRect(70+i*620/(periods+1),320-height,Math.max(24,500/(periods+1)),height)}
    }else{
      ctx.strokeStyle='#7a1733';ctx.lineWidth=5;ctx.beginPath();let active=false;for(let px=25;px<=740;px+=2){const x=(px-380)/45,y=evaluate(x,a,b,c),py=180-y*24;if(!Number.isFinite(y)||py<-800||py>1000){active=false;continue}if(!active){ctx.moveTo(px,py);active=true}else ctx.lineTo(px,py)}ctx.stroke();
      if(kind==='inverse'||kind==='inverse-algebra'){ctx.strokeStyle='#d4a72c';ctx.lineWidth=2;ctx.setLineDash([8,7]);ctx.beginPath();ctx.moveTo(60,320);ctx.lineTo(700,40);ctx.stroke();ctx.setLineDash([])}
    }
    $('#lab-output',lab).textContent=`${data.lesson.title}: a=${formatNumber(a)}, b=${formatNumber(b)}, c=${formatNumber(c)}. Explain the parameter effect, domain and one invariant feature before accepting the display.`;
  };
  $('#run-lab',lab).addEventListener('click',run);$$('[data-lab-field]',lab).forEach(input=>input.addEventListener('input',run));run();
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
