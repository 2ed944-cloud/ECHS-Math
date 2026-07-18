/* ECHS Mathematics Portal */
const COURSES = window.ECHS_COURSES || [];
const $ = sel => document.querySelector(sel);
const $$ = sel => [...document.querySelectorAll(sel)];

const STORE = {
  course: "echs_math_selected_course",
  bookmarks: "echs_math_bookmarks",
  complete: "echs_math_complete"
};

const savedCourse = localStorage.getItem(STORE.course);
const initialCourse = savedCourse === "ap-precalculus" ? "ap-precalculus-g10-g11" : savedCourse;

let state = {
  courseId: initialCourse || (COURSES[0] && COURSES[0].id),
  filter: "all",
  search: "",
  bookmarks: JSON.parse(localStorage.getItem(STORE.bookmarks) || "[]"),
  complete: JSON.parse(localStorage.getItem(STORE.complete) || "[]")
};

function save(key, value){ localStorage.setItem(key, JSON.stringify(value)); }
function lessonKey(course, unitIndex, lesson){ return `${course.id}::${unitIndex}::${lesson.number}::${lesson.title}`; }
function getCourse(){ return COURSES.find(c => c.id === state.courseId) || COURSES[0]; }
function esc(s){ return String(s ?? "").replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m])); }
function lessonsOf(c){ return c.units.flatMap(u => u.lessons); }
function allLessons(){ return COURSES.flatMap(c => c.units.flatMap((u,ui) => u.lessons.map(l => ({course:c, unit:u, unitIndex:ui, lesson:l})))); }

function updateStats(){
  const totalLessons = allLessons().length;
  const ready = allLessons().filter(x => x.lesson.url).length;
  $("#statCourses").textContent = COURSES.length;
  $("#statLessons").textContent = totalLessons;
  $("#statReady").textContent = ready;
  $("#readyBar").style.width = totalLessons ? `${Math.round(ready/totalLessons*100)}%` : "0%";
}

function renderTabs(){
  const tabs = $("#tabs");
  tabs.innerHTML = COURSES.map(c => `<button class="tab ${c.id===state.courseId?'active':''}" data-course="${esc(c.id)}">${esc(c.grade)} • ${esc(c.shortTitle)}</button>`).join("");
  tabs.querySelectorAll(".tab").forEach(btn => btn.addEventListener("click", () => selectCourse(btn.dataset.course)));
}

function renderCourseList(){
  const list = $("#courseList");
  list.innerHTML = COURSES.map(c => {
    const ready = lessonsOf(c).filter(l => l.url).length;
    return `
    <div class="miniCourse ${c.id===state.courseId?'active':''}" data-course="${esc(c.id)}" tabindex="0" role="button">
      <strong>${esc(c.title)}</strong>
      <span>${c.unitCount} units • ${c.lessonCount} lessons • ${ready} open</span>
    </div>`;
  }).join("");
  list.querySelectorAll(".miniCourse").forEach(el => {
    el.addEventListener("click", () => selectCourse(el.dataset.course));
    el.addEventListener("keydown", e => { if(e.key==="Enter" || e.key===" ") selectCourse(el.dataset.course); });
  });
}

function renderHero(){
  const c = getCourse();
  if(!c) return;
  const ready = lessonsOf(c).filter(l=>l.url).length;
  const total = c.lessonCount || lessonsOf(c).length;
  const completed = c.units.flatMap((u,ui)=>u.lessons.map(l=>lessonKey(c,ui,l))).filter(k=>state.complete.includes(k)).length;
  $("#courseHero").innerHTML = `
    <div class="kicker">${esc(c.grade)}</div>
    <h2>${esc(c.title)}</h2>
    <div class="courseMeta">
      <span class="meta">${c.unitCount} units</span>
      <span class="meta">${total} lessons</span>
      <span class="meta">${ready} open HTML lessons</span>
      <span class="meta">${completed} complete</span>
      <span class="meta">${esc(c.status)}</span>
    </div>
  `;
}

function resourceHtml(resource){
  const text = String(resource || "");
  const urlMatch = text.match(/https?:\/\/\S+/);
  if(urlMatch){
    const url = urlMatch[0].replace(/[),.]+$/,"");
    const label = esc(text.replace(url,"").trim() || "Resource");
    return `<div class="resource">${label} <a href="${esc(url)}" target="_blank" rel="noopener">Open</a></div>`;
  }
  return `<div class="resource">${esc(text)}</div>`;
}

function lessonCard(course, unit, ui, lesson){
  const key = lessonKey(course, ui, lesson);
  const bookmarked = state.bookmarks.includes(key);
  const done = state.complete.includes(key);
  const outcomes = (lesson.outcomes || []).slice(0,3).map(o=>`<li>${esc(o)}</li>`).join("");
  const resources = (lesson.resources || []).slice(0,2).map(resourceHtml).join("");
  const canOpen = Boolean(lesson.url);
  return `
    <article class="lesson" data-ready="${canOpen}" data-bookmarked="${bookmarked}" data-completed="${done}" data-text="${esc((course.title+" "+unit.title+" "+lesson.title+" "+(lesson.outcomes||[]).join(" ")).toLowerCase())}">
      <div class="lessonTop">
        <div><span class="lessonNo">${esc(lesson.number)}</span><h4>${esc(lesson.title)}</h4></div>
        <button class="star ${bookmarked?'on':''}" title="Bookmark" data-action="bookmark" data-key="${esc(key)}" aria-label="Bookmark lesson">${bookmarked?'★':'☆'}</button>
      </div>
      ${outcomes ? `<ul>${outcomes}</ul>` : `<p class="resource">Add the lesson deck when ready.</p>`}
      ${resources ? `<div>${resources}</div>` : ""}
      <div class="lessonActions">
        ${canOpen ? `<a class="linkBtn" href="${esc(lesson.url)}">Open Lesson</a>` : `<span class="linkBtn flow">Flow Map</span>`}
        <button class="btn secondary small" data-action="complete" data-key="${esc(key)}">${done?'Complete':'Mark Complete'}</button>
      </div>
    </article>
  `;
}

function lessonMatches(course, unit, ui, lesson){
  const key = lessonKey(course, ui, lesson);
  const hay = `${course.title} ${unit.title} ${lesson.title} ${(lesson.outcomes||[]).join(" ")} ${(lesson.resources||[]).join(" ")}`.toLowerCase();
  if(state.search && !hay.includes(state.search.toLowerCase())) return false;
  if(state.filter === "ready" && !lesson.url) return false;
  if(state.filter === "bookmarked" && !state.bookmarks.includes(key)) return false;
  if(state.filter === "completed" && !state.complete.includes(key)) return false;
  return true;
}

function renderUnits(){
  const c = getCourse();
  if(!c) return;
  const units = $("#units");
  const html = c.units.map((u,ui) => {
    const visibleLessons = u.lessons.filter(l => lessonMatches(c,u,ui,l));
    if(visibleLessons.length === 0) return "";
    return `
      <section class="unit ${ui===0?'open':''}">
        <button class="unitHeader" aria-expanded="${ui===0?'true':'false'}">
          <div><h3>${esc(u.title)}</h3></div>
          <span class="unitCount">${visibleLessons.length} shown</span>
        </button>
        <div class="lessons">${visibleLessons.map(l => lessonCard(c,u,ui,l)).join("")}</div>
      </section>
    `;
  }).join("");
  units.innerHTML = html || `<div class="empty">No lessons match the current search or filter.</div>`;
  units.querySelectorAll(".unitHeader").forEach(btn => btn.addEventListener("click", () => {
    const unit = btn.closest(".unit");
    unit.classList.toggle("open");
    btn.setAttribute("aria-expanded", unit.classList.contains("open"));
  }));
  units.querySelectorAll("[data-action='bookmark']").forEach(btn => btn.addEventListener("click", () => {
    const key = btn.dataset.key;
    state.bookmarks = state.bookmarks.includes(key) ? state.bookmarks.filter(k=>k!==key) : [...state.bookmarks, key];
    save(STORE.bookmarks, state.bookmarks);
    renderAll(false);
  }));
  units.querySelectorAll("[data-action='complete']").forEach(btn => btn.addEventListener("click", () => {
    const key = btn.dataset.key;
    state.complete = state.complete.includes(key) ? state.complete.filter(k=>k!==key) : [...state.complete, key];
    save(STORE.complete, state.complete);
    renderAll(false);
  }));
}

function selectCourse(id){
  state.courseId = id;
  localStorage.setItem(STORE.course, id);
  renderAll(true);
}

function renderAll(scrollTop=false){
  renderTabs(); renderCourseList(); renderHero(); renderUnits(); updateStats();
  $$(".chip[data-filter]").forEach(ch => ch.classList.toggle("active", ch.dataset.filter === state.filter));
  if(scrollTop) document.getElementById("courses").scrollIntoView({behavior:"smooth", block:"start"});
}

$("#search").addEventListener("input", e => { state.search = e.target.value.trim(); renderUnits(); });
document.addEventListener("keydown", e => {
  if(e.key === "/" && document.activeElement.tagName !== "INPUT"){ e.preventDefault(); $("#search").focus(); }
  if(e.key === "Escape"){ $("#search").value=""; state.search=""; renderUnits(); }
});
$$(".chip[data-filter]").forEach(ch => ch.addEventListener("click", () => { state.filter = ch.dataset.filter; renderAll(false); }));
$("#expandAll").addEventListener("click", () => $$(".unit").forEach(u => { u.classList.add("open"); u.querySelector(".unitHeader")?.setAttribute("aria-expanded","true"); }));
$("#collapseAll").addEventListener("click", () => $$(".unit").forEach(u => { u.classList.remove("open"); u.querySelector(".unitHeader")?.setAttribute("aria-expanded","false"); }));
$("#printBtn").addEventListener("click", () => window.print());
$("#resetBtn").addEventListener("click", () => {
  if(confirm("Reset bookmarks and completion marks stored in this browser?")){
    state.bookmarks=[]; state.complete=[]; save(STORE.bookmarks,[]); save(STORE.complete,[]); renderAll(false);
  }
});

if("serviceWorker" in navigator){ window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(()=>{})); }
renderAll(false);
