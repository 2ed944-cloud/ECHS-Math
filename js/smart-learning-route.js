/* ECHS Smart Learning Route — deterministic, evidence-led routing with no external AI. */
(() => {
  "use strict";
  const scriptURL = document.currentScript?.src || location.href;
  const ROOT = new URL("../", scriptURL);
  const esc = (value) =>
    String(value ?? "").replace(
      /[&<>"']/g,
      (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char],
    );
  const safeNumber = (value, fallback = 0) => {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  };
  const clamp = (value) => Math.max(0, Math.min(100, Math.round(safeNumber(value))));
  const absolute = (path) => new URL(path, ROOT).href;
  const page = document.body?.dataset?.platformPage === "home"
    ? "lessons"
    : document.body?.dataset?.premiumPage || "";
  if (!["lessons", "teacher", "admin"].includes(page)) return;

  let renderToken = 0;
  document.body.classList.add("smartRouteEnhanced");

  function addNavigationLink() {
    if (page === "lessons") return;
    const nav = document.querySelector(".institutionNav");
    if (!nav || nav.querySelector("[data-smart-route-nav]")) return;
    const link = document.createElement("a");
    link.href = `#smartRoute-${page}`;
    link.dataset.smartRouteNav = "true";
    link.innerHTML = '<span class="institutionNavIcon">◇</span>Smart Routes';
    const firstSection = nav.querySelector(".institutionNavSection");
    firstSection?.insertAdjacentElement("afterend", link);
  }

  function ensureStyles() {
    if (document.querySelector('link[data-smart-learning-route]')) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = absolute("css/smart-learning-route.css?v=20260802-route-design1");
    link.dataset.smartLearningRoute = "true";
    document.head.append(link);
  }

  function shell() {
    let node = document.getElementById(`smartRoute-${page}`);
    if (node) return node;
    node = document.createElement("section");
    node.id = `smartRoute-${page}`;
    node.className = `slrShell slr${page[0].toUpperCase()}${page.slice(1)}`;
    node.setAttribute("aria-label", page === "lessons" ? "Smart learning route" : "Smart route intelligence");
    node.setAttribute("aria-live", "polite");
    if (page === "lessons") node.setAttribute("data-auth-content", "");
    const anchor = page === "lessons"
      ? document.querySelector(".premiumLandingHero")
      : document.querySelector(".experienceHero");
    anchor?.insertAdjacentElement("afterend", node);
    node.innerHTML = '<div class="slrSkeleton"><div><span></span>Building the evidence-led route…</div></div>';
    return node;
  }

  function header(eyebrow, title, copy, trust = "Rule-based · private · no chatbot") {
    return `<header class="slrHeader"><div><span class="slrEyebrow">${esc(eyebrow)}</span><h2>${esc(title)}</h2><p>${esc(copy)}</p></div><span class="slrTrust"><i></i>${esc(trust)}</span></header>`;
  }

  function routeBadge(route) {
    const meta = {
      support: ["↻", "Support route"],
      core: ["→", "Core route"],
      challenge: ["★", "Challenge route"],
    }[route] || ["→", "Core route"];
    return `<span class="slrPathBadge ${esc(route)}"><i>${meta[0]}</i>${meta[1]}</span>`;
  }

  function timeLabel(value) {
    if (!value) return "";
    const [hour = "0", minute = "00"] = String(value).split(":");
    return new Date(2000, 0, 1, Number(hour), Number(minute)).toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function objectValue(value) {
    return Array.isArray(value) ? value[0] || {} : value || {};
  }

  function scheduleSignal(entries = []) {
    const now = new Date();
    const day = now.getDay() + 1;
    const time = now.toTimeString().slice(0, 5);
    const today = entries
      .filter((row) => Number(row.day_of_week) === day)
      .sort((a, b) => String(a.start_time).localeCompare(String(b.start_time)));
    const current = today.find(
      (row) => String(row.start_time).slice(0, 5) <= time && String(row.end_time).slice(0, 5) > time,
    );
    const next = current || today.find((row) => String(row.start_time).slice(0, 5) > time) || null;
    const classRow = objectValue(next?.class);
    if (current)
      return {
        entry: current,
        text: `In class now · ${current.label || classRow.name || "Mathematics"}`,
        detail: `Until ${timeLabel(current.end_time)}${current.room ? ` · Room ${current.room}` : ""}`,
      };
    if (next)
      return {
        entry: next,
        text: `Next class · ${next.label || classRow.name || "Mathematics"}`,
        detail: `${timeLabel(next.start_time)}${next.room ? ` · Room ${next.room}` : ""}`,
      };
    return {
      entry: null,
      text: entries.length ? "Today’s mathematics classes are complete" : "No timetable signal yet",
      detail: entries.length ? "Continue the highest-priority learning action." : "The route can still use assignments and mastery evidence.",
    };
  }

  function assignmentHref(row) {
    if (!row) return "";
    const config = row.configuration || {};
    const route = Array.isArray(config.routes) ? config.routes[0] : null;
    const params = new URLSearchParams({ assignment: row.id || "" });
    if (row.title) params.set("title", row.title);
    if (config.course) params.set("course", config.course);
    if (config.banks?.[0] || config.bank) params.set("bank", config.banks?.[0] || config.bank);
    if (config.scope) params.set("scope", config.scope);
    if (route?.unit || config.unit) params.set("unit", route?.unit || config.unit);
    if (route?.topic || config.topic) params.set("topic", route?.topic || config.topic);
    if (config.count) params.set("count", config.count);
    if (row.activity_type === "exam")
      return absolute(`question-bank/exam.html?${params}&minutes=${encodeURIComponent(config.minutes || 20)}`);
    if (row.activity_type === "lesson") return config.url ? absolute(config.url) : absolute("index.html#courses");
    params.set("mode", row.activity_type === "review" ? "review" : row.activity_type === "adaptive" ? "adaptive" : "manual");
    return absolute(`question-bank/practice.html?${params}`);
  }

  function addRouteParams(url, route, count) {
    const target = new URL(url || absolute("question-bank/practice.html"), location.href);
    target.searchParams.set("mode", route === "support" ? "review" : "adaptive");
    target.searchParams.set("count", String(count));
    target.searchParams.set("route", route);
    if (route === "support") target.searchParams.set("difficulty", "easy");
    if (route === "challenge") target.searchParams.set("difficulty", "hard");
    target.searchParams.set("autostart", "1");
    return target.href;
  }

  function lessonMatch(lessons, assignment) {
    const config = assignment?.configuration || {};
    const route = Array.isArray(config.routes) ? config.routes[0] || {} : {};
    const topic = String(route.topic || config.topic || "").trim().toLowerCase();
    const unit = String(route.unit || config.unit || "").trim();
    const course = String(config.course || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    if (!topic && !unit) return null;
    return lessons.find((row) => {
      const rowCourse = String(row.courseKey || row.courseId || "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      if (course && rowCourse !== course) return false;
      const number = String(row.number || "").trim().toLowerCase();
      const title = String(row.title || "").trim().toLowerCase();
      const sameTopic = topic && (number === topic || title.includes(topic) || topic.includes(number));
      const sameUnit = unit && String(Number(row.unitIndex) + 1) === String(unit);
      return sameTopic || (!topic && sameUnit);
    }) || null;
  }

  async function timetable() {
    try {
      const payload = await window.ECHSInstitution?.api?.("institution-api", "/timetable");
      return payload?.entries || [];
    } catch {
      return [];
    }
  }

  function localEvidence() {
    const summary = window.ECHSLearning?.summary?.() || {};
    return {
      accuracy: safeNumber(summary.accuracy),
      review_due: safeNumber(summary.reviewDue || summary.due),
      open_mistakes: safeNumber(summary.mistakes || summary.openMistakes),
      mastery: window.ECHSLearning?.masteryRows?.() || [],
    };
  }

  async function renderLessons(context) {
    const token = ++renderToken;
    const node = shell();
    if (!context?.access?.authenticated || context.access.role !== "student") {
      node.hidden = true;
      return;
    }
    node.hidden = false;
    const dashboard = context.access.dashboard || {};
    const counters = { ...localEvidence(), ...(dashboard.counters || {}) };
    const lessons = context.lessons || [];
    const openAssignments = (dashboard.assignments || [])
      .filter((row) => (row.result?.status || "not_started") !== "submitted")
      .sort((a, b) => new Date(a.due_at || "2999-12-31") - new Date(b.due_at || "2999-12-31"));
    const assignment = openAssignments[0] || null;
    const assignedLesson = lessonMatch(lessons, assignment);
    const target = assignedLesson || lessons.find((row) => !row.completed && row.url) || lessons.find((row) => row.url) || null;
    const courseLessons = target
      ? lessons.filter((row) => row.courseId === target.courseId)
      : lessons;
    const targetIndex = Math.max(0, courseLessons.indexOf(target));
    const prerequisite = targetIndex > 0 ? courseLessons[targetIndex - 1] : null;
    const prerequisiteScore = prerequisite ? clamp(prerequisite.masteryScore) : 100;
    const targetScore = clamp(target?.masteryScore);
    const accuracy = clamp(counters.accuracy);
    const reviews = safeNumber(counters.review_due);
    const mistakes = safeNumber(counters.open_mistakes);
    const entries = await timetable();
    if (token !== renderToken) return;
    const schedule = scheduleSignal(entries);
    let route = "core";
    if (reviews >= 3 || mistakes >= 5 || (prerequisite && prerequisiteScore < 55) || (accuracy > 0 && accuracy < 60)) route = "support";
    else if (targetScore >= 85 && accuracy >= 75 && reviews === 0 && mistakes <= 1) route = "challenge";
    const routeMeta = {
      support: {
        title: `Strengthen the foundation for ${target?.number ? `${target.number} · ` : ""}${target?.title || "the next lesson"}`,
        copy: "The route begins with recovery and a short scaffolded set before new difficulty is added.",
        count: 6,
        action: "Start 6-question support route",
      },
      core: {
        title: `Continue ${target?.number ? `${target.number} · ` : ""}${target?.title || "your assigned learning"}`,
        copy: "The evidence is stable enough for the intended lesson sequence and a focused core practice set.",
        count: 8,
        action: "Start 8-question core route",
      },
      challenge: {
        title: `Extend mastery in ${target?.number ? `${target.number} · ` : ""}${target?.title || "this skill"}`,
        copy: "Strong recent evidence unlocks a compact challenge set without bypassing spaced review or trusted mastery rules.",
        count: 10,
        action: "Start 10-question challenge",
      },
    }[route];
    const reasons = [
      schedule.text,
      assignment ? `Teacher priority · ${assignment.title}` : "Next incomplete lesson selected",
      prerequisite ? `Prerequisite evidence · ${prerequisiteScore}%` : "No prerequisite gap detected",
      reviews ? `${reviews} spaced review${reviews === 1 ? "" : "s"} due` : "Spaced review is clear",
    ];
    const basePractice = assignment && assignment.activity_type !== "lesson"
      ? assignmentHref(assignment)
      : target?.practiceHref || absolute("question-bank/practice.html?mode=adaptive");
    const practice = addRouteParams(basePractice, route, routeMeta.count);
    const lesson = target?.lessonHref || absolute("index.html#courses");
    node.innerHTML = `${header(
      "ECHS Smart Learning Route",
      "One clear next step, chosen from real learning evidence.",
      "The route combines today’s timetable, teacher assignments, prerequisite readiness, practice evidence and spaced review. Mastery remains controlled by the verified evidence engine.",
    )}<div class="slrBody"><article class="slrDecision"><div class="slrDecisionTop">${routeBadge(route)}<span class="slrFreshness">${esc(schedule.detail)}</span></div><span class="slrDecisionLabel">Recommended now</span><h3>${esc(routeMeta.title)}</h3><p class="slrDecisionCopy">${esc(routeMeta.copy)}</p><div class="slrReasonList">${reasons.map((reason) => `<span>${esc(reason)}</span>`).join("")}</div><div class="slrActions"><a class="slrAction primary" href="${esc(practice)}">${esc(routeMeta.action)} <b>→</b></a><a class="slrAction" href="${esc(lesson)}">Open the lesson</a>${reviews ? `<a class="slrAction" href="${absolute("question-bank/mistakes.html")}">Clear spaced review</a>` : ""}</div></article><aside class="slrEvidence"><div class="slrEvidenceHead"><span>Evidence used in this decision</span><b>Updated now</b></div><div class="slrEvidenceGrid"><div class="slrMetric"><span>Prerequisite</span><strong>${prerequisite ? `${prerequisiteScore}%` : "Ready"}</strong><small>${prerequisite ? esc(prerequisite.title) : "First available target"}</small></div><div class="slrMetric"><span>Recent accuracy</span><strong>${accuracy ? `${accuracy}%` : "New"}</strong><small>${accuracy ? "Synchronized attempts" : "Route starts conservatively"}</small></div><div class="slrMetric"><span>Reviews due</span><strong>${reviews}</strong><small>${mistakes} open mistake${mistakes === 1 ? "" : "s"}</small></div><div class="slrMetric"><span>Target mastery</span><strong>${targetScore}%</strong><small>Verified evidence only</small></div></div><div class="slrRuleRail"><div class="slrRule"><i>1</i><span><strong>Schedule signal</strong><small>${esc(schedule.text)}</small></span><em>${schedule.entry ? "LIVE" : "CLEAR"}</em></div><div class="slrRule"><i>2</i><span><strong>Teacher priority</strong><small>${esc(assignment?.title || "No urgent assignment")}</small></span><em>${assignment ? "SET" : "OPEN"}</em></div><div class="slrRule"><i>3</i><span><strong>Trusted mastery gate</strong><small>Multiple suitable attempts and recovery remain required.</small></span><em>LOCKED</em></div></div></aside></div>`;
  }

  function renderTeacher(context) {
    const node = shell();
    const data = context?.classData || {};
    const students = data.students || [];
    const support = students.filter((row) => safeNumber(row.mastery) < 50 || safeNumber(row.accuracy) < 60 || safeNumber(row.open_mistakes) >= 3);
    const challenge = students.filter((row) => safeNumber(row.mastery) >= 80 && safeNumber(row.accuracy) >= 75 && safeNumber(row.open_mistakes) <= 1);
    const edge = new Set([...support, ...challenge].map((row) => row.id));
    const core = students.filter((row) => !edge.has(row.id));
    const className = data.class?.name || context?.selectedClass?.name || "Selected class";
    node.innerHTML = `${header(
      "Smart route intelligence",
      `${className}: three paths, one shared destination.`,
      "The class is organised from current mastery, accuracy, mistakes and activity. Use the groups to assign support, core or challenge work without exposing students publicly.",
      "Teacher-controlled · evidence-led",
    )}<div class="slrLanes">${[
      ["support", "↻", support.length, "Support", "Recover prerequisites", "Short scaffolded practice and spaced review for learners with fragile evidence."],
      ["core", "→", core.length, "Core", "Continue the planned lesson", "The intended lesson and balanced practice for learners whose evidence is developing normally."],
      ["challenge", "★", challenge.length, "Challenge", "Extend secure mastery", "Higher-demand reasoning for learners with strong accuracy and limited unresolved mistakes."],
    ].map(([route, icon, count, label, title, copy]) => `<article class="slrLane ${route}"><div class="slrLaneTop"><span class="slrLaneIcon">${icon}</span><strong class="slrLaneCount">${count}</strong></div><small>${label} route</small><h3>${title}</h3><p>${copy}</p><button type="button" data-slr-assignment="${route}">Build ${label.toLowerCase()} assignment →</button></article>`).join("")}</div>`;
    node.querySelectorAll("[data-slr-assignment]").forEach((button) => {
      button.addEventListener("click", () => {
        const route = button.dataset.slrAssignment;
        document.getElementById("newAssignment")?.click();
        const prepare = () => {
          const title = document.getElementById("assignmentTitle");
          const difficulty = document.getElementById("assignmentDifficulty");
          const activity = document.getElementById("activityType");
          const count = document.getElementById("assignmentCountInput");
          const pool = document.querySelector('[name="assignmentSelectionMode"][value="pool"]');
          if (title) title.value = `${className} · ${route[0].toUpperCase()}${route.slice(1)} route`;
          if (difficulty) difficulty.value = route === "support" ? "1" : route === "challenge" ? "3" : "2";
          if (activity) activity.value = route === "support" ? "review" : "adaptive";
          if (count) {
            count.value = route === "support" ? "6" : route === "challenge" ? "10" : "8";
            count.dispatchEvent(new Event("input", { bubbles: true }));
          }
          if (pool) {
            pool.checked = true;
            pool.dispatchEvent(new Event("change", { bubbles: true }));
          }
        };
        prepare();
        setTimeout(prepare, 80);
      });
    });
  }

  async function renderAdmin(context) {
    const token = ++renderToken;
    const node = shell();
    const accounts = context?.accounts || [];
    let classes = [], entries = [], assignments = [];
    if (!context?.preview) {
      try {
        const results = await Promise.all([
          window.ECHSInstitution.api("institution-api", "/classes"),
          window.ECHSInstitution.api("institution-api", "/timetable"),
          window.ECHSInstitution.api("institution-api", "/assignments"),
        ]);
        classes = results[0]?.classes || [];
        entries = results[1]?.entries || [];
        assignments = results[2]?.assignments || [];
      } catch {
        // The account dashboard remains usable if academic operations are temporarily unavailable.
      }
    } else {
      classes = [{ id: "c1" }, { id: "c2" }, { id: "c3" }];
      entries = [{ teacher_id: "t1" }, { teacher_id: "t1" }, { teacher_id: "t2" }, { teacher_id: "t2" }, { teacher_id: "t3" }];
      assignments = [{ id: "a1" }, { id: "a2" }, { id: "a3" }, { id: "a4" }];
    }
    if (token !== renderToken) return;
    const students = accounts.filter((row) => row.role === "student" && row.status === "active").length;
    const teachers = accounts.filter((row) => row.role === "teacher" && row.status === "active").length;
    const scheduledTeachers = new Set(entries.map((row) => row.teacher_id).filter(Boolean)).size;
    const scheduleCoverage = teachers ? Math.round((scheduledTeachers / teachers) * 100) : entries.length ? 100 : 0;
    node.innerHTML = `${header(
      "Academic route operations",
      "A school-wide view of how learning moves from timetable to mastery.",
      "Administration controls the operational signals—accounts, classes and published timetables—while teachers control the learning decisions and students receive only their own route.",
      "Private by role · administrator governed",
    )}<div class="slrOpsGrid"><div class="slrOpsMap"><article class="slrOpsStage"><span>01 · Operate</span><strong>Timetable and class structure</strong><p>The school publishes the teacher, class, room and period that start every route.</p><b>${entries.length}</b></article><article class="slrOpsStage"><span>02 · Guide</span><strong>Teacher assignment decisions</strong><p>Teachers select exact banks, lessons and questions for support, core or challenge.</p><b>${assignments.length}</b></article><article class="slrOpsStage"><span>03 · Verify</span><strong>Evidence-based mastery</strong><p>Attempts, recovery and suitable difficulty—not page completion alone—control mastery.</p><b>✓</b></article></div><aside class="slrOpsHealth"><div class="slrMetric"><span>Active students</span><strong>${students}</strong><small>Private individual routes</small></div><div class="slrMetric"><span>Active teachers</span><strong>${teachers}</strong><small>${scheduledTeachers} with published periods</small></div><div class="slrMetric"><span>Active classes</span><strong>${classes.length}</strong><small>Course-linked learning groups</small></div><div class="slrMetric"><span>Schedule coverage</span><strong>${scheduleCoverage}%</strong><small>${entries.length} published mathematics periods</small></div></aside></div>`;
  }

  function render(context) {
    if (page === "lessons") return renderLessons(context);
    if (page === "teacher") return renderTeacher(context);
    return renderAdmin(context);
  }

  function initialContext() {
    if (page === "lessons") return window.ECHSPortalRouteContext;
    if (page === "teacher") return window.ECHSTeacherRouteContext;
    return window.ECHSAdminRouteContext;
  }

  ensureStyles();
  shell();
  addNavigationLink();
  document.addEventListener("echs:smart-route-context", (event) => {
    Promise.resolve(render(event.detail)).catch(console.error);
  });
  const context = initialContext();
  if (context) Promise.resolve(render(context)).catch(console.error);
})();
