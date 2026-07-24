const T = {
  search: document.getElementById('reviewSearch'),
  only: document.getElementById('reviewOnly'),
  course: document.getElementById('reviewCourse'),
  year: document.getElementById('reviewYear'),
  count: document.getElementById('reviewCount'),
  table: document.getElementById('reviewTable'),
  stats: document.getElementById('teacherStats'),
  inspector: document.getElementById('inspector'),
  title: document.getElementById('inspectTitle'),
  question: document.getElementById('inspectQuestion'),
  topic: document.getElementById('patchTopic'),
  unit: document.getElementById('patchUnit'),
  disposition: document.getElementById('patchDisposition'),
  note: document.getElementById('patchNote')
};

let rows = [];
let filtered = [];
let current = null;
let patches = [];

function options(values) {
  return values.map(value => `<option value="${ECHSOfficial.esc(value)}">${ECHSOfficial.esc(value)}</option>`).join('');
}

function apply() {
  const query = T.search.value.toLowerCase();
  const only = T.only.value;
  const course = T.course.value;
  const year = T.year.value;

  filtered = rows.filter(row =>
    (!query || row.search.includes(query)) &&
    (only === 'all' || String(row.needsReview) === (only === 'yes' ? 'true' : 'false')) &&
    (course === 'all' || row.course === course) &&
    (year === 'all' || String(row.year) === year)
  );

  T.count.textContent = `${filtered.length.toLocaleString()} records`;
  T.table.innerHTML = filtered.slice(0, 500).map(row => `
    <tr>
      <td>${ECHSOfficial.esc(row.id)}</td>
      <td>${ECHSOfficial.esc(row.course)}${row.year ? ` · ${row.year}` : ''}</td>
      <td>${ECHSOfficial.esc(row.topic || row.topicCode || 'Unmapped')}</td>
      <td>${ECHSOfficial.esc(row.readiness || '')}</td>
      <td>${row.needsReview ? 'Review required' : '—'}</td>
      <td><button class="button ghost" data-inspect="${ECHSOfficial.esc(row.id)}">Inspect</button></td>
    </tr>
  `).join('') || '<tr><td colspan="6">No matching records.</td></tr>';

  document.querySelectorAll('[data-inspect]').forEach(button => {
    button.onclick = () => inspect(button.dataset.inspect);
  });
}

function renderAudit(question) {
  const audit = question.audit || {};
  const quality = question.quality || {};
  const fields = [
    ['Source page', audit.sourcePage || question.source?.page || 'Not recorded'],
    ['Verification', question.verificationStatus || audit.overallStatus || 'Not recorded'],
    ['Transcription', audit.transcriptionStatus || (quality.transcriptionVerified ? 'verified' : 'not verified')],
    ['Mathematics', audit.mathStatus || (quality.mathematicalVerificationPassed ? 'verified' : 'not verified')],
    ['Answer', audit.answerStatus || (quality.answerVerified ? 'verified' : 'not verified')],
    ['KaTeX', audit.katexStatus || (quality.katexVerified ? 'verified' : 'not verified')],
    ['Media', audit.mediaStatus || (quality.mediaVerified ? 'verified' : 'not verified')],
    ['Mapping', audit.lessonMappingStatus || (quality.mappingVerified ? 'verified' : 'not verified')],
    ['Corrections', audit.correctionsMade ?? 0]
  ];

  return `
    <section class="panel" style="margin-top:1rem">
      <h3>Independent audit</h3>
      <div class="pillRow">
        ${fields.map(([label, value]) => `<span class="pill"><strong>${ECHSOfficial.esc(label)}:</strong>&nbsp;${ECHSOfficial.esc(value)}</span>`).join('')}
      </div>
      ${audit.reviewerNotes ? `<div class="notice" style="margin-top:.75rem"><strong>Audit note:</strong> ${ECHSOfficial.fmt(audit.reviewerNotes)}</div>` : ''}
    </section>
  `;
}

function renderChoices(question) {
  if (!Array.isArray(question.choices) || !question.choices.length) return '';
  const keyed = String(question.answer || '').toUpperCase();
  return `
    <section class="panel" style="margin-top:1rem">
      <h3>Verified choices</h3>
      <div class="choices teacherChoices">
        ${question.choices.map(choice => `
          <div class="choice ${String(choice.label).toUpperCase() === keyed ? 'selected' : ''}">
            <span class="choiceLabel">${ECHSOfficial.esc(choice.label)}</span>
            <span>${ECHSOfficial.fmt(choice.text)}</span>
          </div>
        `).join('')}
      </div>
      <div class="notice"><strong>Verified answer:</strong> ${ECHSOfficial.esc(question.answer || 'Not recorded')}</div>
    </section>
  `;
}

function renderParts(question) {
  if (!Array.isArray(question.parts) || !question.parts.length) return '';
  return `
    <section class="panel" style="margin-top:1rem">
      <h3>Verified FRQ parts and answers</h3>
      ${question.parts.map(part => `
        <article class="part" style="margin-top:.8rem">
          <div class="partLabel">${ECHSOfficial.esc(part.label || '')}${part.maxPoints ? ` · ${part.maxPoints} points` : ''}</div>
          <div class="partPrompt">${ECHSOfficial.fmt(part.prompt || '')}</div>
          <div class="notice" style="margin-top:.65rem">
            <strong>Verified answer / solution</strong>
            <div style="margin-top:.45rem">${ECHSOfficial.fmt(part.answer || part.solution || 'No verified answer recorded.')}</div>
          </div>
          ${Array.isArray(part.rubric) && part.rubric.length ? `
            <details style="margin-top:.55rem">
              <summary>Instructional rubric</summary>
              <ul>${part.rubric.map(item => `<li>${ECHSOfficial.fmt(item.description || item.evidenceRequired || '')}</li>`).join('')}</ul>
            </details>
          ` : ''}
        </article>
      `).join('')}
    </section>
  `;
}

function renderAdditionalSolution(question) {
  const solution = question.workedSolution || question.studentExplanation || question.explanation;
  if (!solution) return '';
  const value = typeof solution === 'string' ? solution : JSON.stringify(solution, null, 2);
  return `
    <section class="panel" style="margin-top:1rem">
      <h3>Additional verified solution</h3>
      <div>${ECHSOfficial.fmt(value)}</div>
    </section>
  `;
}

async function inspect(id) {
  current = await ECHSOfficial.question(id);
  if (!current) return;

  const classification = current.classification || {};
  const reasons = current.quality?.reviewReasons || [];
  T.title.textContent = id;
  T.question.innerHTML = `
    ${ECHSOfficial.metaPills(current)}
    <h3>${ECHSOfficial.esc(classification.primaryTopic || 'Unmapped topic')}</h3>
    ${ECHSOfficial.renderPrompt(current)}
    ${renderChoices(current)}
    ${renderParts(current)}
    ${renderAdditionalSolution(current)}
    ${renderAudit(current)}
    <div class="notice" style="margin-top:1rem">
      <strong>Current review reasons:</strong>
      <ul>${reasons.map(reason => `<li>${ECHSOfficial.esc(reason)}</li>`).join('') || '<li>None</li>'}</ul>
    </div>
  `;

  T.topic.value = '';
  T.unit.value = classification.primaryUnit || '';
  T.disposition.value = '';
  T.note.value = '';
  T.inspector.classList.remove('hidden');
  T.inspector.scrollIntoView({ behavior: 'smooth' });
  ECHSOfficial.renderMath(T.question);
}

async function init() {
  await ECHSOfficial.init();
  rows = ECHSOfficial.index;
  const catalog = ECHSOfficial.catalog;
  const overrideCount = window.ECHS_AUDIT_OVERRIDE_STATE?.count || 0;

  T.stats.innerHTML = `
    <div class="stat"><b>${catalog.stats.questions}</b><span>Canonical web records</span></div>
    <div class="stat"><b>${catalog.stats.needsReview}</b><span>Review flagged</span></div>
    <div class="stat"><b>${catalog.stats.answerVerified}</b><span>Answer verified</span></div>
    <div class="stat"><b>${catalog.stats.withMedia}</b><span>With source media</span></div>
    <div class="stat"><b>${overrideCount}</b><span>Independent audit overlays</span></div>
  `;

  T.course.innerHTML = '<option value="all">All</option>' + options(Object.keys(catalog.courses));
  T.year.innerHTML = '<option value="all">All</option>' + options(Object.keys(catalog.years));
  [T.search, T.only, T.course, T.year].forEach(control => {
    control.addEventListener(control.tagName === 'INPUT' ? 'input' : 'change', apply);
  });

  document.getElementById('exportQueue').onclick = () => ECHSOfficial.exportCSV(
    'echs-teacher-review-queue.csv',
    filtered.map(row => ({
      id: row.id,
      course: row.course,
      year: row.year,
      topic: row.topic,
      status: row.readiness,
      needsReview: row.needsReview
    }))
  );

  document.getElementById('exportPatches').onclick = () => ECHSOfficial.exportJSON(
    'echs-question-patches.json',
    { schemaVersion: '1.0', createdAt: new Date().toISOString(), patches }
  );

  document.getElementById('closeInspector').onclick = () => T.inspector.classList.add('hidden');
  document.getElementById('savePatch').onclick = () => {
    if (!current) return;
    patches = patches.filter(row => row.questionId !== current.id);
    patches.push({
      questionId: current.id,
      classification: {
        primaryTopic: T.topic.value || undefined,
        primaryUnit: T.unit.value ? Number(T.unit.value) : undefined
      },
      review: {
        disposition: T.disposition.value || undefined,
        note: T.note.value || undefined
      },
      createdAt: new Date().toISOString()
    });
    alert('Patch saved locally. Use Export patch JSON when ready.');
  };

  apply();
}

document.addEventListener('DOMContentLoaded', init);
