/* ECHS Mathematics Open — account-free course catalogue and local progress */
(() => {
  "use strict";

  const COURSES = Array.isArray(window.ECHS_COURSES) ? window.ECHS_COURSES : [];
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const STORE = {
    course: "echs_open_selected_course",
    bookmarks: "echs_open_bookmarks",
    complete: "echs_open_complete"
  };

  function readArray(key){
    try{
      const value = JSON.parse(localStorage.getItem(key) || "[]");
      return Array.isArray(value) ? value : [];
    }catch(_error){
      return [];
    }
  }

  function esc(value){
    return String(value ?? "").replace(/[&<>"']/g, char => ({
      "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;"
    })[char]);
  }

  function courseKey(course){
    const token = String(course?.id || course?.title || "").toLowerCase();
    if(token.includes("precalculus")) return "ap-precalculus";
    if(token.includes("ap-calculus") || token === "calculus") return "ap-calculus";
    if(token.includes("algebra")) return "algebra-2";
    if(token.includes("ib")) return "ib-math-ai";
    if(token.includes("grade-9") || token.includes("pre-precalculus")) return "grade-9";
    return token.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "mathematics";
  }

  const savedCourse = localStorage.getItem(STORE.course);
  const state = {
    courseId: savedCourse || (COURSES[0]?.id ?? ""),
    filter: "all",
    search: "",
    bookmarks: readArray(STORE.bookmarks),
    complete: readArray(STORE.complete),
    openUnits: new Set([0])
  };

  const unitsOf = course => Array.isArray(course?.units) ? course.units : [];
  const lessonsOf = course => unitsOf(course).flatMap(unit => Array.isArray(unit.lessons) ? unit.lessons : []);
  const getCourse = () => COURSES.find(course => course.id === state.courseId) || COURSES[0] || null;
  const save = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  const lessonKey = (course, unitIndex, lesson) => `${course.id}::${unitIndex}::${lesson.number}::${lesson.title}`;
  const allLessons = () => COURSES.flatMap(course => unitsOf(course).flatMap((unit, unitIndex) =>
    (unit.lessons || []).map(lesson => ({course, unit, unitIndex, lesson}))
  ));

  function unitAccent(index){
    return ["#7b1e46", "#1f5d87", "#0b7663", "#875f15", "#5b4a9b", "#9a4a2d", "#316356", "#465b7a"][index % 8];
  }

  function resourceType(label){
    const text = String(label || "").toLowerCase();
    if(text.includes("video")) return "video";
    if(text.includes("note") || text.includes("classwork") || text.includes("guided")) return "notes";
    if(text.includes("practice") || text.includes("homework") || text.includes("worksheet")) return "practice";
    if(text.includes("review") || text.includes("assessment") || text.includes("pdf") || text.includes("doc")) return "document";
    return "resource";
  }

  function normaliseResource(item, forcedType){
    if(item == null) return null;
    if(typeof item === "object"){
      const label = String(item.label || item.title || item.name || "Resource");
      return {label, url:String(item.url || item.href || ""), type:item.type || forcedType || resourceType(label)};
    }
    const text = String(item);
    const urlMatch = text.match(/https?:\/\/\S+/);
    const url = urlMatch ? urlMatch[0].replace(/[),.]+$/, "") : "";
    const label = (url ? text.replace(url, "") : text).trim() || "Resource";
    return {label, url, type:forcedType || resourceType(label)};
  }

  function resourcesOf(lesson){
    const entries = [];
    (lesson.videos || []).forEach(item => entries.push(normaliseResource(item, "video")));
    (lesson.notes || []).forEach(item => entries.push(normaliseResource(item, "notes")));
    (lesson.resources || []).forEach(item => entries.push(normaliseResource(item)));
    const seen = new Set();
    return entries.filter(Boolean).filter(item => {
      const key = `${item.type}|${item.label}|${item.url}`.toLowerCase();
      if(seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function practiceURL(course, unitIndex, lesson, key){
    const query = new URLSearchParams({
      course:courseKey(course),
      unit:String(unitIndex + 1),
      topic:String(lesson.number || ""),
      from:key,
      title:`${lesson.number} · ${lesson.title}`,
      mode:"manual"
    });
    return `question-bank/practice.html?${query}`;
  }

  function lessonURL(course, unitIndex, lesson, key){
    if(!lesson.url) return "";
    const url = new URL(lesson.url, location.href);
    url.searchParams.set("course", courseKey(course));
    url.searchParams.set("unit", String(unitIndex + 1));
    url.searchParams.set("topic", String(lesson.number || ""));
    url.searchParams.set("lessonKey", key);
    url.searchParams.set("title", `${lesson.number} · ${lesson.title}`);
    return url.href;
  }

  function updateStats(){
    const lessons = allLessons();
    const ready = lessons.filter(item => Boolean(item.lesson.url)).length;
    if($("#statCourses")) $("#statCourses").textContent = COURSES.length;
    if($("#statLessons")) $("#statLessons").textContent = lessons.length;
    if($("#statReady")) $("#statReady").textContent = ready;
    if($("#readyBar")) $("#readyBar").style.width = lessons.length ? `${Math.round(ready / lessons.length * 100)}%` : "0%";
  }

  function renderTabs(){
    const node = $("#tabs");
    if(!node) return;
    node.innerHTML = COURSES.map(course => `<button class="tab ${course.id === state.courseId ? "active" : ""}" data-course="${esc(course.id)}"><span>${esc(course.grade || "Course")}</span>${esc(course.shortTitle || course.title)}</button>`).join("");
    node.querySelectorAll(".tab").forEach(button => button.addEventListener("click", () => selectCourse(button.dataset.course)));
  }

  function renderCourseList(){
    const list = $("#courseList");
    if(!list) return;
    list.innerHTML = COURSES.map(course => {
      const lessons = lessonsOf(course);
      const ready = lessons.filter(lesson => lesson.url).length;
      return `<div class="miniCourse ${course.id === state.courseId ? "active" : ""}" data-course="${esc(course.id)}" tabindex="0" role="button"><span class="miniCourseDot" aria-hidden="true"></span><div><strong>${esc(course.title)}</strong><span>${unitsOf(course).length} units · ${lessons.length} lessons · ${ready} interactive</span></div></div>`;
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
    const node = $("#courseHero");
    if(!course || !node) return;
    const lessons = lessonsOf(course);
    const completed = unitsOf(course).flatMap((unit, unitIndex) => (unit.lessons || []).map(lesson => lessonKey(course, unitIndex, lesson))).filter(key => state.complete.includes(key)).length;
    const percentage = lessons.length ? Math.round(completed / lessons.length * 100) : 0;
    node.innerHTML = `<div class="courseHeroMain"><div class="kicker">${esc(course.grade || "Course")}</div><h2>${esc(course.title)}</h2>${course.subtitle ? `<p class="courseSubtitle">${esc(course.subtitle)}</p>` : ""}<div class="courseMeta"><span class="meta">${unitsOf(course).length} units</span><span class="meta">${lessons.length} lessons</span><span class="meta">${completed} completed</span><span class="meta">${Math.max(0, lessons.length - completed)} remaining</span></div><div class="openAccessNote">Open edition: every available lesson and practice topic can be opened directly.</div></div><div class="courseProgress" aria-label="Course completion"><div><span>Local course progress</span><strong>${percentage}%</strong></div><div class="courseProgressTrack"><i style="width:${percentage}%"></i></div><small>Progress is stored only in this browser.</small></div>`;
  }

  function resourceChip(resource){
    const icons = {video:"▶", notes:"▤", practice:"✎", document:"↗", resource:"↗"};
    const type = resource.type || "resource";
    if(resource.url) return `<a class="resourceChip ${esc(type)}" href="${esc(resource.url)}" target="_blank" rel="noopener"><span>${icons[type] || icons.resource}</span>${esc(resource.label)}</a>`;
    return `<span class="resourceChip ${esc(type)} pending"><span>${icons[type] || icons.resource}</span>${esc(resource.label)}<em>soon</em></span>`;
  }

  function lessonCard(course, unit, unitIndex, lesson, lessonIndex){
    const key = lessonKey(course, unitIndex, lesson);
    const bookmarked = state.bookmarks.includes(key);
    const completed = state.complete.includes(key);
    const outcomes = Array.isArray(lesson.outcomes) ? lesson.outcomes : [];
    const resources = resourcesOf(lesson);
    const canOpen = Boolean(lesson.url);
    const kind = lesson.kind || "lesson";
    const openLabel = lesson.openLabel || (kind === "assessment" ? "Open assessment" : "Open lesson");
    const searchText = [course.title, unit.title, lesson.number, lesson.title, lesson.summary, ...outcomes, ...resources.map(resource => resource.label)].join(" ").toLowerCase();
    return `<article class="lesson ${esc(kind)} ${completed ? "isComplete" : ""}" style="--lesson-order:${lessonIndex}" data-ready="${canOpen}" data-bookmarked="${bookmarked}" data-completed="${completed}" data-text="${esc(searchText)}"><div class="lessonTop"><div class="lessonIdentity"><div class="lessonBadgeRow"><span class="lessonNo">${esc(lesson.number)}</span><span class="openStatusBadge">Open</span>${lesson.new ? '<span class="newBadge">New lesson</span>' : ""}${completed ? '<span class="completeBadge">Completed</span>' : ""}</div><h4>${esc(lesson.title)}</h4></div><button class="star ${bookmarked ? "on" : ""}" data-action="bookmark" data-key="${esc(key)}" aria-label="${bookmarked ? "Remove bookmark" : "Bookmark lesson"}">${bookmarked ? "★" : "☆"}</button></div>${lesson.summary ? `<p class="lessonSummary">${esc(lesson.summary)}</p>` : ""}<div class="objectiveBlock"><div class="cardSectionLabel"><span>Learning objectives</span><b>${outcomes.length || "—"}</b></div>${outcomes.length ? `<ul>${outcomes.slice(0, 4).map(outcome => `<li>${esc(outcome)}</li>`).join("")}</ul>` : '<p class="emptyNote">Objectives will appear when this lesson is ready.</p>'}</div>${resources.length ? `<div class="resourceBlock"><div class="cardSectionLabel"><span>Lesson resources</span><b>${resources.length}</b></div><div class="resourceChips">${resources.slice(0, 6).map(resourceChip).join("")}</div></div>` : ""}<div class="lessonActions">${canOpen ? `<a class="linkBtn" href="${esc(lessonURL(course, unitIndex, lesson, key))}">${esc(openLabel)} <span>→</span></a>` : '<span class="linkBtn flow">Lesson coming soon</span>'}<a class="lessonPracticeOpen" href="${esc(practiceURL(course, unitIndex, lesson, key))}">Practice this topic</a><button class="completeBtn ${completed ? "done" : ""}" data-action="complete" data-key="${esc(key)}"><span>${completed ? "✓" : "○"}</span>${completed ? "Completed" : "Mark complete"}</button></div></article>`;
  }

  function lessonMatches(course, unit, unitIndex, lesson){
    const key = lessonKey(course, unitIndex, lesson);
    const haystack = [course.title, unit.title, lesson.number, lesson.title, lesson.summary, ...(lesson.outcomes || []), ...resourcesOf(lesson).map(resource => resource.label)].join(" ").toLowerCase();
    if(state.search && !haystack.includes(state.search.toLowerCase())) return false;
    if(state.filter === "ready" && !lesson.url) return false;
    if(state.filter === "bookmarked" && !state.bookmarks.includes(key)) return false;
    if(state.filter === "completed" && !state.complete.includes(key)) return false;
    return true;
  }

  function renderUnits(){
    const course = getCourse();
    const container = $("#units");
    if(!course || !container) return;
    const filtering = Boolean(state.search || state.filter !== "all");
    container.innerHTML = unitsOf(course).map((unit, unitIndex) => {
      const lessons = (unit.lessons || []).filter(lesson => lessonMatches(course, unit, unitIndex, lesson));
      if(!lessons.length) return "";
      const isOpen = filtering || state.openUnits.has(unitIndex);
      const ready = lessons.filter(lesson => lesson.url).length;
      return `<section class="unit ${isOpen ? "open" : ""}" style="--unit-accent:${unitAccent(unitIndex)}" data-unit-index="${unitIndex}"><button class="unitHeader" aria-expanded="${isOpen}"><span class="unitOrdinal">${String(unitIndex + 1).padStart(2, "0")}</span><span class="unitHeading"><span class="unitEyebrow">Unit ${unitIndex + 1}</span><strong>${esc(String(unit.title || "").replace(/^Unit\s+\d+\s*:\s*/i, ""))}</strong>${unit.portalSummary ? `<small>${esc(unit.portalSummary)}</small>` : ""}</span><span class="unitMetrics"><b>${lessons.length}</b><small>${ready} interactive</small></span><span class="unitChevron">⌄</span></button><div class="unitBody"><div class="lessons">${lessons.map((lesson, index) => lessonCard(course, unit, unitIndex, lesson, index)).join("")}</div></div></section>`;
    }).join("") || '<div class="empty"><strong>No matching lessons</strong><span>Try another search term or filter.</span></div>';

    container.querySelectorAll(".unitHeader").forEach(button => button.addEventListener("click", () => {
      const unit = button.closest(".unit");
      const index = Number(unit.dataset.unitIndex);
      unit.classList.toggle("open");
      if(unit.classList.contains("open")) state.openUnits.add(index); else state.openUnits.delete(index);
      button.setAttribute("aria-expanded", String(unit.classList.contains("open")));
    }));

    container.querySelectorAll("[data-action=bookmark]").forEach(button => button.addEventListener("click", () => {
      const key = button.dataset.key;
      state.bookmarks = state.bookmarks.includes(key) ? state.bookmarks.filter(item => item !== key) : [...state.bookmarks, key];
      save(STORE.bookmarks, state.bookmarks);
      renderAll();
    }));

    container.querySelectorAll("[data-action=complete]").forEach(button => button.addEventListener("click", () => {
      const key = button.dataset.key;
      state.complete = state.complete.includes(key) ? state.complete.filter(item => item !== key) : [...state.complete, key];
      save(STORE.complete, state.complete);
      renderAll();
    }));
  }

  function selectCourse(id){
    state.courseId = id;
    state.openUnits = new Set([0]);
    localStorage.setItem(STORE.course, id);
    renderAll(true);
  }

  function renderAll(scroll = false){
    renderTabs();
    renderCourseList();
    renderHero();
    renderUnits();
    updateStats();
    $$('.chip[data-filter]').forEach(chip => chip.classList.toggle("active", chip.dataset.filter === state.filter));
    if($("#currentYear")) $("#currentYear").textContent = new Date().getFullYear();
    if(scroll) $("#courses")?.scrollIntoView({behavior:"smooth", block:"start"});
  }

  $("#search")?.addEventListener("input", event => {
    state.search = event.target.value.trim();
    renderUnits();
  });
  document.addEventListener("keydown", event => {
    if(event.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName || "")){
      event.preventDefault();
      $("#search")?.focus();
    }
    if(event.key === "Escape" && $("#search")){
      $("#search").value = "";
      state.search = "";
      renderUnits();
    }
  });
  $$('.chip[data-filter]').forEach(chip => chip.addEventListener("click", () => {
    state.filter = chip.dataset.filter;
    renderAll();
  }));
  $("#expandAll")?.addEventListener("click", () => {
    state.openUnits = new Set(unitsOf(getCourse()).map((_unit, index) => index));
    renderUnits();
  });
  $("#collapseAll")?.addEventListener("click", () => {
    state.openUnits.clear();
    renderUnits();
  });
  $("#printBtn")?.addEventListener("click", () => window.print());
  $("#resetBtn")?.addEventListener("click", () => {
    if(!confirm("Reset bookmarks and completed lessons stored in this browser?")) return;
    Object.values(STORE).forEach(key => localStorage.removeItem(key));
    state.bookmarks = [];
    state.complete = [];
    state.courseId = COURSES[0]?.id || "";
    state.openUnits = new Set([0]);
    renderAll();
  });

  if(!COURSES.length){
    if($("#units")) $("#units").innerHTML = '<div class="empty"><strong>Course data is unavailable</strong><span>Refresh the page or check the course data files.</span></div>';
    if($("#currentYear")) $("#currentYear").textContent = new Date().getFullYear();
    return;
  }
  if(!COURSES.some(course => course.id === state.courseId)) state.courseId = COURSES[0].id;
  renderAll();
})();
