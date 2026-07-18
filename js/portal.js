/* ECHS Mathematics Portal — refreshed interface */
const COURSES = Array.isArray(window.ECHS_COURSES) ? window.ECHS_COURSES : [];
const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];

const STORE = {
  course: "echs_math_selected_course",
  bookmarks: "echs_math_bookmarks",
  complete: "echs_math_complete"
};

function readArray(key){
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value : [];
  } catch (_error) {
    return [];
  }
}

const savedCourse = localStorage.getItem(STORE.course);
const initialCourse = savedCourse === "ap-precalculus" ? "ap-precalculus-g10-g11" : savedCourse;

let state = {
  courseId: initialCourse || (COURSES[0] && COURSES[0].id),
  filter: "all",
  search: "",
  bookmarks: readArray(STORE.bookmarks),
  complete: readArray(STORE.complete),
  openUnits: new Set([0])
};

function save(key, value){ localStorage.setItem(key, JSON.stringify(value)); }
function esc(value){
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;"
  }[char]));
}
function getCourse(){ return COURSES.find(course => course.id === state.courseId) || COURSES[0]; }
function unitsOf(course){ return Array.isArray(course?.units) ? course.units : []; }
function lessonsOf(course){ return unitsOf(course).flatMap(unit => Array.isArray(unit.lessons) ? unit.lessons : []); }
function courseLessonCount(course){ return lessonsOf(course).length; }
function lessonKey(course, unitIndex, lesson){
  return `${course.id}::${unitIndex}::${lesson.number}::${lesson.title}`;
}
function allLessons(){
  return COURSES.flatMap(course => unitsOf(course).flatMap((unit, unitIndex) =>
    (Array.isArray(unit.lessons) ? unit.lessons : []).map(lesson => ({course, unit, unitIndex, lesson}))
  ));
}
function unitAccent(index){
  return ["#7b1e46", "#1f5d87", "#0b7663", "#875f15", "#5b4a9b", "#9a4a2d", "#316356", "#465b7a"][index % 8];
}

function resourceType(label){
  const text = String(label || "").toLowerCase();
  if(text.includes("video")) return "video";
  if(text.includes("note") || text.includes("classwork") || text.includes("guided")) return "notes";
  if(text.includes("practice") || text.includes("homework")) return "practice";
  if(text.includes("review") || text.includes("assessment") || text.includes("pdf") || text.includes("doc")) return "document";
  return "resource";
}

function normalizeResource(item, forcedType){
  if(item == null) return null;
  if(typeof item === "object"){
    const label = String(item.label || item.title || item.name || "Resource");
    return {
      label,
      url: String(item.url || item.href || ""),
      type: item.type || forcedType || resourceType(label)
    };
  }
  const text = String(item);
  const urlMatch = text.match(/https?:\/\/\S+/);
  const url = urlMatch ? urlMatch[0].replace(/[),.]+$/, "") : "";
  const label = (url ? text.replace(url, "") : text).trim() || "Resource";
  return {label, url, type: forcedType || resourceType(label)};
}

function resourcesOf(lesson){
  const entries = [];
  (lesson.videos || []).forEach(item => entries.push(normalizeResource(item, "video")));
  (lesson.notes || []).forEach(item => entries.push(normalizeResource(item, "notes")));
  (lesson.resources || []).forEach(item => entries.push(normalizeResource(item)));
  const seen = new Set();
  return entries.filter(Boolean).filter(item => {
    const key = `${item.type}|${item.label}|${item.url}`.toLowerCase();
    if(seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function updateStats(){
  const lessons = allLessons();
  const ready = lessons.filter(item => Boolean(item.lesson.url)).length;
  $("#statCourses").textContent = COURSES.length;
  $("#statLessons").textContent = lessons.length;
  $("#statReady").textContent = ready;
  $("#readyBar").style.width = lessons.length ? `${Math.round(ready / lessons.length * 100)}%` : "0%";
}

function renderTabs(){
  const tabs = $("#tabs");
  tabs.innerHTML = COURSES.map(course => `
    <button class="tab ${course.id === state.courseId ? "active" : ""}" data-course="${esc(course.id)}">
      <span>${esc(course.grade)}</span>${esc(course.shortTitle || course.title)}
    </button>`).join("");
  tabs.querySelectorAll(".tab").forEach(button => button.addEventListener("click", () => selectCourse(button.dataset.course)));
}

function renderCourseList(){
  const list = $("#courseList");
  list.innerHTML = COURSES.map(course => {
    const lessons = lessonsOf(course);
    const ready = lessons.filter(lesson => lesson.url).length;
    return `
      <div class="miniCourse ${course.id === state.courseId ? "active" : ""}" data-course="${esc(course.id)}" tabindex="0" role="button">
        <span class="miniCourseDot" aria-hidden="true"></span>
        <div><strong>${esc(course.title)}</strong><span>${unitsOf(course).length} units · ${lessons.length} lessons · ${ready} open</span></div>
      </div>`;
  }).join("");
  list.querySelectorAll(".miniCourse").forEach(element => {
    element.addEventListener("click", () => selectCourse(element.dataset.course));
    element.addEventListener("keydown", event => {
      if(event.key === "Enter" || event.key === " "){
        event.preventDefault();
        selectCourse(element.dataset.course);
      }
    });
  });
}

function renderHero(){
  const course = getCourse();
  if(!course) return;
  const lessons = lessonsOf(course);
  const ready = lessons.filter(lesson => lesson.url).length;
  const completed = unitsOf(course).flatMap((unit, unitIndex) =>
    (unit.lessons || []).map(lesson => lessonKey(course, unitIndex, lesson))
  ).filter(key => state.complete.includes(key)).length;
  const percentage = lessons.length ? Math.round(completed / lessons.length * 100) : 0;

  $("#courseHero").innerHTML = `
    <div class="courseHeroMain">
      <div class="kicker">${esc(course.grade || "Course")}</div>
      <h2>${esc(course.title)}</h2>
      ${course.subtitle ? `<p class="courseSubtitle">${esc(course.subtitle)}</p>` : ""}
      <div class="courseMeta">
        <span class="meta">${unitsOf(course).length} units</span>
        <span class="meta">${lessons.length} lessons</span>
        <span class="meta">${ready} open lessons</span>
        <span class="meta">${completed} completed</span>
        ${course.updatedUnits ? `<span class="meta updateMeta">${esc(course.updatedUnits)}</span>` : ""}
      </div>
    </div>
    <div class="courseProgress" aria-label="Course completion">
      <div><span>Course progress</span><strong>${percentage}%</strong></div>
      <div class="courseProgressTrack"><i style="width:${percentage}%"></i></div>
      <small>Progress is saved in this browser.</small>
    </div>`;
}

function resourceChip(resource){
  const icons = {video:"▶", notes:"▤", practice:"✎", document:"↗", resource:"↗"};
  const type = resource.type || "resource";
  const icon = icons[type] || icons.resource;
  if(resource.url){
    return `<a class="resourceChip ${esc(type)}" href="${esc(resource.url)}" target="_blank" rel="noopener"><span>${icon}</span>${esc(resource.label)}</a>`;
  }
  return `<span class="resourceChip ${esc(type)} pending" title="Add this file when it is ready"><span>${icon}</span>${esc(resource.label)}<em>soon</em></span>`;
}

function lessonCard(course, unit, unitIndex, lesson, lessonIndex){
  const key = lessonKey(course, unitIndex, lesson);
  const bookmarked = state.bookmarks.includes(key);
  const completed = state.complete.includes(key);
  const outcomes = Array.isArray(lesson.outcomes) ? lesson.outcomes : [];
  const visibleOutcomes = outcomes.slice(0, 3);
  const extraOutcomes = outcomes.slice(3);
  const resources = resourcesOf(lesson);
  const visibleResources = resources.slice(0, 5);
  const extraResources = resources.slice(5);
  const canOpen = Boolean(lesson.url);
  const kind = lesson.kind || "lesson";
  const openLabel = lesson.openLabel || (kind === "assessment" ? "Open Assessment" : "Open Lesson");
  const searchText = [course.title, unit.title, lesson.number, lesson.title, lesson.summary, ...outcomes, ...resources.map(r => r.label)].join(" ").toLowerCase();

  return `
    <article class="lesson ${esc(kind)} ${completed ? "isComplete" : ""}" style="--lesson-order:${lessonIndex}" data-ready="${canOpen}" data-bookmarked="${bookmarked}" data-completed="${completed}" data-text="${esc(searchText)}">
      <div class="lessonTop">
        <div class="lessonIdentity">
          <div class="lessonBadgeRow">
            <span class="lessonNo">${esc(lesson.number)}</span>
            ${lesson.new ? `<span class="newBadge">New lesson</span>` : ""}
            ${completed ? `<span class="completeBadge">Completed</span>` : ""}
          </div>
          <h4>${esc(lesson.title)}</h4>
        </div>
        <button class="star ${bookmarked ? "on" : ""}" title="${bookmarked ? "Remove bookmark" : "Bookmark lesson"}" data-action="bookmark" data-key="${esc(key)}" aria-label="${bookmarked ? "Remove bookmark" : "Bookmark lesson"}">${bookmarked ? "★" : "☆"}</button>
      </div>
      ${lesson.summary ? `<p class="lessonSummary">${esc(lesson.summary)}</p>` : ""}
      <div class="objectiveBlock">
        <div class="cardSectionLabel"><span>Learning objectives</span><b>${outcomes.length || "—"}</b></div>
        ${visibleOutcomes.length ? `<ul>${visibleOutcomes.map(outcome => `<li>${esc(outcome)}</li>`).join("")}</ul>` : `<p class="emptyNote">Learning objectives can be added when this item is ready.</p>`}
        ${extraOutcomes.length ? `<details class="moreDetails"><summary>Show ${extraOutcomes.length} more objective${extraOutcomes.length === 1 ? "" : "s"}</summary><ul>${extraOutcomes.map(outcome => `<li>${esc(outcome)}</li>`).join("")}</ul></details>` : ""}
      </div>
      ${resources.length ? `
        <div class="resourceBlock">
          <div class="cardSectionLabel"><span>Lesson resources</span><b>${resources.length}</b></div>
          <div class="resourceChips">${visibleResources.map(resourceChip).join("")}</div>
          ${extraResources.length ? `<details class="moreDetails resourceMore"><summary>Show ${extraResources.length} more resource${extraResources.length === 1 ? "" : "s"}</summary><div class="resourceChips">${extraResources.map(resourceChip).join("")}</div></details>` : ""}
        </div>` : ""}
      <div class="lessonActions">
        ${canOpen ? `<a class="linkBtn" href="${esc(lesson.url)}" target="_blank" rel="noopener">${esc(openLabel)} <span>↗</span></a>` : `<span class="linkBtn flow">File coming soon</span>`}
        <button class="completeBtn ${completed ? "done" : ""}" data-action="complete" data-key="${esc(key)}"><span>${completed ? "✓" : "○"}</span>${completed ? "Completed" : "Mark complete"}</button>
      </div>
    </article>`;
}

function lessonMatches(course, unit, unitIndex, lesson){
  const key = lessonKey(course, unitIndex, lesson);
  const resources = resourcesOf(lesson);
  const haystack = [course.title, unit.title, lesson.number, lesson.title, lesson.summary, ...(lesson.outcomes || []), ...resources.map(r => r.label)].join(" ").toLowerCase();
  if(state.search && !haystack.includes(state.search.toLowerCase())) return false;
  if(state.filter === "ready" && !lesson.url) return false;
  if(state.filter === "bookmarked" && !state.bookmarks.includes(key)) return false;
  if(state.filter === "completed" && !state.complete.includes(key)) return false;
  return true;
}

function renderUnits(){
  const course = getCourse();
  if(!course) return;
  const unitsContainer = $("#units");
  const filtering = Boolean(state.search || state.filter !== "all");
  const html = unitsOf(course).map((unit, unitIndex) => {
    const lessons = Array.isArray(unit.lessons) ? unit.lessons : [];
    const visibleLessons = lessons.filter(lesson => lessonMatches(course, unit, unitIndex, lesson));
    if(!visibleLessons.length) return "";
    const openCount = visibleLessons.filter(lesson => lesson.url).length;
    const isOpen = filtering || state.openUnits.has(unitIndex);
    const summary = unit.portalSummary || "";
    return `
      <section class="unit ${isOpen ? "open" : ""} ${unit.refreshed ? "refreshed" : ""}" style="--unit-accent:${unitAccent(unitIndex)}" data-unit-index="${unitIndex}">
        <button class="unitHeader" aria-expanded="${isOpen}">
          <span class="unitOrdinal">${String(unitIndex + 1).padStart(2, "0")}</span>
          <span class="unitHeading"><span class="unitEyebrow">Unit ${unitIndex + 1}${unit.refreshed ? " · refreshed" : ""}</span><strong>${esc(unit.title.replace(/^Unit\s+\d+\s*:\s*/i, ""))}</strong>${summary ? `<small>${esc(summary)}</small>` : ""}</span>
          <span class="unitMetrics"><b>${visibleLessons.length}</b><small>${openCount} open</small></span>
          <span class="unitChevron" aria-hidden="true">⌄</span>
        </button>
        <div class="unitBody">
          <div class="lessons">${visibleLessons.map((lesson, lessonIndex) => lessonCard(course, unit, unitIndex, lesson, lessonIndex)).join("")}</div>
        </div>
      </section>`;
  }).join("");

  unitsContainer.innerHTML = html || `<div class="empty"><strong>No matching lessons</strong><span>Try another search term or reset the filter.</span></div>`;

  unitsContainer.querySelectorAll(".unitHeader").forEach(button => button.addEventListener("click", () => {
    const unit = button.closest(".unit");
    const index = Number(unit.dataset.unitIndex);
    if(unit.classList.toggle("open")) state.openUnits.add(index); else state.openUnits.delete(index);
    button.setAttribute("aria-expanded", unit.classList.contains("open"));
  }));

  unitsContainer.querySelectorAll("[data-action='bookmark']").forEach(button => button.addEventListener("click", () => {
    const key = button.dataset.key;
    state.bookmarks = state.bookmarks.includes(key) ? state.bookmarks.filter(item => item !== key) : [...state.bookmarks, key];
    save(STORE.bookmarks, state.bookmarks);
    renderAll(false);
  }));

  unitsContainer.querySelectorAll("[data-action='complete']").forEach(button => button.addEventListener("click", () => {
    const key = button.dataset.key;
    state.complete = state.complete.includes(key) ? state.complete.filter(item => item !== key) : [...state.complete, key];
    save(STORE.complete, state.complete);
    renderAll(false);
  }));
}

function selectCourse(id){
  state.courseId = id;
  state.openUnits = new Set([0]);
  localStorage.setItem(STORE.course, id);
  renderAll(true);
}

function renderAll(scrollToCourses = false){
  renderTabs();
  renderCourseList();
  renderHero();
  renderUnits();
  updateStats();
  $$(".chip[data-filter]").forEach(chip => chip.classList.toggle("active", chip.dataset.filter === state.filter));
  const year = $("#currentYear");
  if(year) year.textContent = new Date().getFullYear();
  if(scrollToCourses) $("#courses").scrollIntoView({behavior:"smooth", block:"start"});
}

$("#search").addEventListener("input", event => {
  state.search = event.target.value.trim();
  renderUnits();
});

document.addEventListener("keydown", event => {
  const activeTag = document.activeElement?.tagName;
  if(event.key === "/" && activeTag !== "INPUT" && activeTag !== "TEXTAREA"){
    event.preventDefault();
    $("#search").focus();
  }
  if(event.key === "Escape"){
    $("#search").value = "";
    state.search = "";
    renderUnits();
  }
});

$$(".chip[data-filter]").forEach(chip => chip.addEventListener("click", () => {
  state.filter = chip.dataset.filter;
  renderAll(false);
}));

$("#expandAll").addEventListener("click", () => {
  const course = getCourse();
  state.openUnits = new Set(unitsOf(course).map((_unit, index) => index));
  renderUnits();
});

$("#collapseAll").addEventListener("click", () => {
  state.openUnits = new Set();
  renderUnits();
});

$("#printBtn").addEventListener("click", () => window.print());
$("#resetBtn").addEventListener("click", () => {
  if(confirm("Reset bookmarks and completion marks stored in this browser?")){
    state.bookmarks = [];
    state.complete = [];
    save(STORE.bookmarks, []);
    save(STORE.complete, []);
    renderAll(false);
  }
});

if("serviceWorker" in navigator){
  window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
}

renderAll(false);
