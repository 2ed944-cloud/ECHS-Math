const AUI = {
  course: document.getElementById("archiveCourse"),
  year: document.getElementById("archiveYear"),
  status: document.getElementById("archiveStatus"),
  search: document.getElementById("archiveSearch"),
  list: document.getElementById("archiveRecords"),
  summary: document.getElementById("archiveRecordSummary"),
  detail: document.getElementById("archiveDetail"),
};

let archiveRows = [];

function archiveOption(value, label) {
  return `<option value="${ECHSOfficial.esc(value)}">${ECHSOfficial.esc(label)}</option>`;
}

function populateArchiveFilters() {
  const courses = ECHSOfficial.uniq(
    archiveRows.map((row) => row.course),
  ).sort();
  const years = ECHSOfficial.uniq(archiveRows.map((row) => row.year)).sort(
    (a, b) => Number(a) - Number(b),
  );
  const statuses = ECHSOfficial.uniq(
    archiveRows.map((row) => row.archiveStatus),
  ).sort();
  AUI.course.innerHTML =
    archiveOption("all", "All courses") +
    courses.map((course) => archiveOption(course, course)).join("");
  AUI.year.innerHTML =
    archiveOption("all", "All years") +
    years.map((year) => archiveOption(year, String(year))).join("");
  AUI.status.innerHTML =
    archiveOption("all", "All audit statuses") +
    statuses.map((status) => archiveOption(status, status)).join("");
  const params = ECHSOfficial.params();
  if (params.get("course")) AUI.course.value = params.get("course");
  if (params.get("year")) AUI.year.value = params.get("year");
  if (params.get("status")) AUI.status.value = params.get("status");
  if (params.get("q")) AUI.search.value = params.get("q");
}

function archiveMatches() {
  const query = String(AUI.search.value || "")
    .trim()
    .toLowerCase();
  return archiveRows.filter((row) => {
    if (
      AUI.course.value !== "all" &&
      row.course !== AUI.course.value &&
      row.courseId !== AUI.course.value
    )
      return false;
    if (AUI.year.value !== "all" && String(row.year) !== AUI.year.value)
      return false;
    if (AUI.status.value !== "all" && row.archiveStatus !== AUI.status.value)
      return false;
    if (query && !row.search.includes(query)) return false;
    return true;
  });
}

function renderArchiveList() {
  const matched = archiveMatches();
  AUI.summary.innerHTML = `<span class="pill wine">${matched.length.toLocaleString()} complete questions</span><span class="pill teal">${matched.filter((row) => row.studentReady).length.toLocaleString()} auto-graded</span><span class="pill">${matched.filter((row) => !row.studentReady).length.toLocaleString()} response-only</span>`;
  const visible = matched.slice(0, 150);
  AUI.list.innerHTML =
    visible
      .map(
        (row) => `<article class="card archiveRecordCard">
          <div class="topicNo">${ECHSOfficial.esc(row.archiveStatus)}</div>
          <h3>${ECHSOfficial.esc(ECHSOfficial.rowLabel(row) || row.id)}</h3>
          <p>${ECHSOfficial.esc(row.topic || "Unmapped topic")}</p>
          <div class="pillRow">
            <span class="pill wine">${ECHSOfficial.esc(row.course)}</span>
            ${row.unit ? `<span class="pill">Unit ${ECHSOfficial.esc(row.unit)}</span>` : ""}
            ${row.topicCode ? `<span class="pill">${ECHSOfficial.esc(row.topicCode)}</span>` : ""}
          </div>
          <p><button class="button ghost" data-open-record="${ECHSOfficial.esc(row.id)}">Open record</button></p>
        </article>`,
      )
      .join("") ||
    '<div class="empty">No archive records match these filters.</div>';
  document.querySelectorAll("[data-open-record]").forEach((button) => {
    button.onclick = () => openArchiveRecord(button.dataset.openRecord);
  });
}

async function openArchiveRecord(id) {
  const question = await ECHSOfficial.question(id);
  if (!question) return;
  const ready = ECHSOfficial.isStudentReady(question);
  AUI.detail.innerHTML = `<article class="questionCard">
    <div class="toolbar">
      ${ECHSOfficial.metaPills(question)}
      <button class="button ghost" id="closeArchiveDetail">Close</button>
    </div>
    <h2>${ECHSOfficial.esc(question.classification?.primaryTopic || question.assessmentFamily || question.id)}</h2>
    ${ECHSOfficial.renderPrompt(question)}
    ${
      ready
        ? `<div class="notice"><strong>Verified-answer practice.</strong> This complete record has a verified answer or scoring solution and supports grading.</div><a class="button primary" href="practice.html?q=${encodeURIComponent(question.id)}&content=ready&autostart=1">Practice this question</a>`
        : `<div class="notice indexedRecord"><strong>Complete response-only practice.</strong> The full question is available. A student may answer it, but grading and solution reveal stay off until the answer or scoring guideline is verified.</div><a class="button primary" href="practice.html?q=${encodeURIComponent(question.id)}&content=all&autostart=1">Practice this complete question</a>`
    }
  </article>`;
  AUI.detail.hidden = false;
  document.getElementById("closeArchiveDetail").onclick = () => {
    AUI.detail.hidden = true;
    AUI.detail.innerHTML = "";
  };
  ECHSOfficial.renderMath(AUI.detail);
  AUI.detail.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function initArchive() {
  await ECHSOfficial.init();
  archiveRows = ECHSOfficial.index;
  const catalog = ECHSOfficial.catalog;
  document.getElementById("archiveStats").innerHTML = `
    <div class="stat"><b>${catalog.stats.questions.toLocaleString()}</b><span>Complete questions</span></div>
    <div class="stat"><b>${catalog.stats.studentReady.toLocaleString()}</b><span>Auto-graded</span></div>
    <div class="stat"><b>${catalog.stats.reviewRequired.toLocaleString()}</b><span>Response-only</span></div>
    <div class="stat"><b>${catalog.stats.fullyDigitized.toLocaleString()}</b><span>Complete sources</span></div>`;
  const assignedToYears = Object.values(catalog.years).reduce(
    (total, value) => total + value.total,
    0,
  );
  const noYearCount = catalog.stats.questions - assignedToYears;
  document.getElementById("years").innerHTML =
    Object.entries(catalog.years)
      .map(
        ([year, value]) =>
          `<a class="yearCard" href="practice.html?year=${encodeURIComponent(year)}&content=all&count=all&sessionMode=ordered&autostart=1"><b>${year}</b><span>Open all ${value.total} questions · ${value.ready || 0} auto-graded</span></a>`,
      )
      .join("") +
    (noYearCount
      ? `<a class="yearCard" href="practice.html?year=unassigned&content=all&count=all&sessionMode=ordered&autostart=1"><b>Other</b><span>Open all ${noYearCount} form/collection questions without a source year</span></a>`
      : "");
  document.getElementById("collections").innerHTML = catalog.collections
    .map(
      (collection) => `<article class="card">
        <div class="topicNo">${ECHSOfficial.esc(collection.officialStatus || "collection")}</div>
        <h3>${ECHSOfficial.esc(collection.label)}</h3>
        <div class="pillRow"><span class="pill wine">${collection.count} records</span><span class="pill teal">${collection.ready || 0} student ready</span></div>
        <p><a class="button ghost" href="archive.html?q=${encodeURIComponent(collection.id)}">Inspect collection</a></p>
      </article>`,
    )
    .join("");
  populateArchiveFilters();
  [AUI.course, AUI.year, AUI.status].forEach((element) =>
    element.addEventListener("change", renderArchiveList),
  );
  AUI.search.addEventListener("input", renderArchiveList);
  renderArchiveList();
}

document.addEventListener("DOMContentLoaded", initArchive);
