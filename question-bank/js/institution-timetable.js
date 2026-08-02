(() => {
  "use strict";
  const page = document.body?.dataset?.premiumPage;
  if (!["student", "teacher", "admin"].includes(page)) return;
  const I = window.ECHSInstitution,
    X = window.ECHSExperience,
    esc = X?.escapeHTML || ((value) => String(value ?? "")),
    DAYS = [
      { value: 1, label: "Sunday", short: "Sun" },
      { value: 2, label: "Monday", short: "Mon" },
      { value: 3, label: "Tuesday", short: "Tue" },
      { value: 4, label: "Wednesday", short: "Wed" },
      { value: 5, label: "Thursday", short: "Thu" },
      { value: 6, label: "Friday", short: "Fri" },
      { value: 7, label: "Saturday", short: "Sat" },
    ];
  let current = null,
    preview = false,
    payload = { entries: [], teachers: [], classes: [] },
    editorEntries = [];

  const previewEntries = [
    { id: "p1", teacher_id: "t1", class_id: "c1", day_of_week: 1, period_order: 2, start_time: "08:40", end_time: "09:30", room: "M-204", class: { id: "c1", name: "AP Calculus BC · Period 2", course_key: "ap-calculus" }, teacher: { id: "t1", display_name: "Mohammad Abu Ghuwaleh" } },
    { id: "p2", teacher_id: "t1", class_id: "c2", day_of_week: 1, period_order: 4, start_time: "10:45", end_time: "11:35", room: "M-204", class: { id: "c2", name: "AP Precalculus · Period 4", course_key: "ap-precalculus" }, teacher: { id: "t1", display_name: "Mohammad Abu Ghuwaleh" } },
    { id: "p3", teacher_id: "t1", class_id: "c1", day_of_week: 2, period_order: 2, start_time: "08:40", end_time: "09:30", room: "M-204", class: { id: "c1", name: "AP Calculus BC · Period 2", course_key: "ap-calculus" }, teacher: { id: "t1", display_name: "Mohammad Abu Ghuwaleh" } },
    { id: "p4", teacher_id: "t1", class_id: "c3", day_of_week: 3, period_order: 1, start_time: "07:45", end_time: "08:35", room: "M-204", class: { id: "c3", name: "Algebra 2 Concepts · Period 1", course_key: "algebra-2" }, teacher: { id: "t1", display_name: "Mohammad Abu Ghuwaleh" } },
    { id: "p5", teacher_id: "t1", class_id: "c2", day_of_week: 4, period_order: 4, start_time: "10:45", end_time: "11:35", room: "M-204", class: { id: "c2", name: "AP Precalculus · Period 4", course_key: "ap-precalculus" }, teacher: { id: "t1", display_name: "Mohammad Abu Ghuwaleh" } },
    { id: "p6", teacher_id: "t1", class_id: "c1", day_of_week: 5, period_order: 2, start_time: "08:40", end_time: "09:30", room: "M-204", class: { id: "c1", name: "AP Calculus BC · Period 2", course_key: "ap-calculus" }, teacher: { id: "t1", display_name: "Mohammad Abu Ghuwaleh" } },
  ];
  const previewPayload = {
    entries: previewEntries,
    teachers: [
      { id: "t1", display_name: "Mohammad Abu Ghuwaleh", username: "m.abughuwaleh" },
      { id: "t2", display_name: "Ahmed Elsharnoby", username: "a.elsharnoby" },
    ],
    classes: [
      { id: "c1", name: "AP Calculus BC · Period 2", course_key: "ap-calculus" },
      { id: "c2", name: "AP Precalculus · Period 4", course_key: "ap-precalculus" },
      { id: "c3", name: "Algebra 2 Concepts · Period 1", course_key: "algebra-2" },
    ],
    editable: page === "admin",
  };

  const nav = document.querySelector(".institutionNav");
  function addNavLink(target, label) {
    if (!nav || nav.querySelector(`[href="#${target}"]`)) return;
    const link = document.createElement("a");
    link.href = `#${target}`;
    link.innerHTML = `<span class="institutionNavIcon">◷</span>${label}`;
    nav.append(link);
  }
  function ensureMount() {
    if (page === "teacher") {
      addNavLink("timetableSection", "My Timetable");
      return document.getElementById("teacherTimetable");
    }
    if (page === "student") {
      if (!document.getElementById("studentTimetable")) {
        const anchor = document.getElementById("assignmentSection");
        anchor?.insertAdjacentHTML(
          "beforebegin",
          `<div class="premiumSectionHead" id="timetableSection"><div><small>School day</small><h2>My mathematics timetable</h2><p>See today’s class time, room and teacher alongside your learning journey.</p></div><span class="cardBadge" id="studentTimetableStatus">My classes</span></div><section class="premiumCard span12 timetableCard"><div id="studentTimetable" class="timetableMount" data-timetable-view="student"><div class="emptyInstitution">Loading your timetable…</div></div></section>`,
        );
      }
      addNavLink("timetableSection", "My Timetable");
      return document.getElementById("studentTimetable");
    }
    if (!document.getElementById("adminTimetable")) {
      const anchor = document.getElementById("directorySection");
      anchor?.insertAdjacentHTML(
        "beforebegin",
        `<div class="premiumSectionHead" id="timetableSection"><div><small>Academic operations</small><h2>Teacher mathematics timetables</h2><p>Select a teacher, organise the weekly class schedule and publish it instantly to teacher and student dashboards.</p></div><span class="cardBadge gold">Administrator managed</span></div><section class="premiumCard span12 timetableCard"><div id="adminTimetable" class="timetableMount" data-timetable-view="admin"><div class="emptyInstitution">Loading timetable controls…</div></div></section>`,
      );
    }
    addNavLink("timetableSection", "Timetables");
    return document.getElementById("adminTimetable");
  }

  function objectValue(value) {
    return Array.isArray(value) ? value[0] || {} : value || {};
  }
  function timeLabel(value) {
    const [hour = "0", minute = "00"] = String(value || "").split(":");
    const date = new Date(2000, 0, 1, Number(hour), Number(minute));
    return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  }
  function dayCodeNow() {
    return new Date().getDay() + 1;
  }
  function entryColor(entry) {
    const key = String(objectValue(entry.class).course_key || "");
    if (key.includes("calculus")) return "var(--px-maroon)";
    if (key.includes("ib")) return "var(--px-teal)";
    if (key.includes("algebra")) return "var(--px-gold)";
    return "var(--px-navy-2)";
  }
  function visibleDays(entries) {
    const weekend = entries.some((entry) => Number(entry.day_of_week) > 5);
    return weekend ? DAYS : DAYS.slice(0, 5);
  }
  function timetableHeadline(entries) {
    const now = new Date(), today = dayCodeNow(), time = now.toTimeString().slice(0, 5),
      todayRows = entries
        .filter((entry) => Number(entry.day_of_week) === today)
        .sort((a, b) => String(a.start_time).localeCompare(String(b.start_time))),
      currentEntry = todayRows.find(
        (entry) => String(entry.start_time).slice(0, 5) <= time && String(entry.end_time).slice(0, 5) > time,
      ),
      nextEntry = currentEntry || todayRows.find((entry) => String(entry.start_time).slice(0, 5) > time),
      classRow = objectValue(nextEntry?.class);
    if (currentEntry)
      return `Now · ${currentEntry.label || classRow.name || "Mathematics class"} until ${timeLabel(currentEntry.end_time)}`;
    if (nextEntry)
      return `Next · ${nextEntry.label || classRow.name || "Mathematics class"} at ${timeLabel(nextEntry.start_time)}`;
    return entries.length
      ? `${entries.length} scheduled mathematics periods`
      : "No timetable has been published yet";
  }
  function renderWeek(mount, entries) {
    const now = new Date(), nowTime = now.toTimeString().slice(0, 5), today = dayCodeNow();
    mount.innerHTML = `<div class="timetableToolbar"><div class="timetableToolbarCopy"><strong>${esc(timetableHeadline(entries))}</strong><small>${entries.length ? "Times and rooms are managed centrally by the school administrator." : "The administrator can add the weekly schedule from School Control."}</small></div><span class="cardBadge ${entries.length ? "" : "gold"}">${entries.length ? "Live schedule" : "Awaiting schedule"}</span></div><div class="timetableWeek">${visibleDays(entries)
      .map((day) => {
        const rows = entries
          .filter((entry) => Number(entry.day_of_week) === day.value)
          .sort((a, b) => Number(a.period_order) - Number(b.period_order));
        return `<article class="timetableDay ${today === day.value ? "today" : ""}"><header class="timetableDayHead"><strong>${day.label}</strong><span>${rows.length} class${rows.length === 1 ? "" : "es"}</span></header><div class="timetableEntries">${
          rows.length
            ? rows
                .map((entry) => {
                  const classRow = objectValue(entry.class), teacher = objectValue(entry.teacher), currentClass = today === day.value && String(entry.start_time).slice(0, 5) <= nowTime && String(entry.end_time).slice(0, 5) > nowTime;
                  const course = encodeURIComponent(classRow.course_key || "");
                  return `<div class="timetableEntry ${currentClass ? "current" : ""}" style="--entry-color:${entryColor(entry)}"><div class="timetableEntryTime"><span>Period ${esc(entry.period_order)}</span><span>${esc(timeLabel(entry.start_time))}–${esc(timeLabel(entry.end_time))}</span></div><strong>${esc(entry.label || classRow.name || "Mathematics class")}</strong><small>${esc([entry.room ? `Room ${entry.room}` : "", page === "student" && teacher.display_name ? teacher.display_name : ""].filter(Boolean).join(" · ") || "Room to be confirmed")}</small>${page === "student" ? '<a class="timetableEntryAction" href="../index.html#courses">Open lessons →</a>' : page === "teacher" ? `<a class="timetableEntryAction" href="practice.html?course=${course}">Open course practice →</a>` : ""}</div>`;
                })
                .join("")
            : '<div class="timetableEmptyDay">No mathematics classes</div>'
        }</div></article>`;
      })
      .join("")}</div>`;
  }

  function teacherOptions() {
    return (payload.teachers || [])
      .map((row) => `<option value="${esc(row.id)}">${esc(row.display_name)} · @${esc(row.username || "teacher")}</option>`)
      .join("");
  }
  function classOptions(selected) {
    return (payload.classes || [])
      .map((row) => `<option value="${esc(row.id)}" ${String(row.id) === String(selected) ? "selected" : ""}>${esc(row.name)}</option>`)
      .join("");
  }
  function renderEditorRows() {
    const target = document.getElementById("timetableEditorRows");
    if (!target) return;
    target.innerHTML = editorEntries.length
      ? editorEntries
          .map(
            (entry, index) =>
              `<div class="timetableEditorRow" data-editor-index="${index}"><label>Day<select data-entry-field="day_of_week">${DAYS.map((day) => `<option value="${day.value}" ${Number(entry.day_of_week) === day.value ? "selected" : ""}>${day.label}</option>`).join("")}</select></label><label>Period<input data-entry-field="period_order" type="number" min="1" max="20" value="${esc(entry.period_order || index + 1)}"></label><label>Class<select data-entry-field="class_id">${classOptions(entry.class_id)}</select></label><label>Starts<input data-entry-field="start_time" type="time" value="${esc(String(entry.start_time || "08:00").slice(0, 5))}"></label><label>Ends<input data-entry-field="end_time" type="time" value="${esc(String(entry.end_time || "08:50").slice(0, 5))}"></label><label>Room<input data-entry-field="room" value="${esc(entry.room || "")}" placeholder="M-204"></label><button class="iButton danger small" type="button" data-remove-entry="${index}">Remove</button></div>`,
          )
          .join("")
      : '<div class="emptyInstitution">No periods for this teacher. Add the first mathematics class below.</div>';
    target.querySelectorAll("[data-entry-field]").forEach((input) => {
      input.addEventListener("change", () => {
        const index = Number(input.closest("[data-editor-index]").dataset.editorIndex);
        editorEntries[index][input.dataset.entryField] = input.value;
      });
    });
    target.querySelectorAll("[data-remove-entry]").forEach((button) => {
      button.onclick = () => {
        editorEntries.splice(Number(button.dataset.removeEntry), 1);
        renderEditorRows();
      };
    });
  }
  function selectTeacher(teacherId) {
    editorEntries = (payload.entries || [])
      .filter((entry) => String(entry.teacher_id) === String(teacherId))
      .map((entry) => ({ ...entry }));
    renderEditorRows();
    const previewMount = document.getElementById("adminTimetablePreview");
    if (previewMount) renderWeek(previewMount, editorEntries);
  }
  function renderAdmin(mount, selectedTeacher = "") {
    const firstTeacher = selectedTeacher || payload.teachers?.[0]?.id || "";
    mount.innerHTML = `<div class="timetableToolbar"><div class="timetableAdminControls"><div class="iControl"><label for="timetableTeacher">Teacher</label><select id="timetableTeacher">${teacherOptions()}</select></div><button class="iButton secondary" id="addTimetableEntry" type="button">Add period</button></div><div class="timetableToolbarCopy"><strong>Only administrators can edit</strong><small>Teachers and students receive a read-only live view.</small></div></div><div id="adminTimetablePreview"></div><div class="timetableEditor" id="timetableEditorRows"></div><div class="timetableEditorFooter"><span class="timetableToolbarCopy"><small>Saving replaces this teacher’s published weekly timetable.</small></span><button class="iButton" id="saveTimetable" type="button" ${preview ? "disabled" : ""}>Publish timetable</button></div>`;
    document.getElementById("timetableTeacher").onchange = (event) =>
      selectTeacher(event.target.value);
    document.getElementById("addTimetableEntry").onclick = () => {
      const used = editorEntries.map((row) => Number(row.period_order) || 0),
        next = Math.max(0, ...used) + 1;
      editorEntries.push({
        day_of_week: 1,
        period_order: next,
        class_id: payload.classes?.[0]?.id || "",
        start_time: "08:00",
        end_time: "08:50",
        room: "",
      });
      renderEditorRows();
    };
    document.getElementById("saveTimetable").onclick = async () => {
      if (preview) return X?.toast?.("Timetable publishing becomes active after backend deployment.", "warning");
      const teacherId = document.getElementById("timetableTeacher").value;
      await I.api("institution-api", "/timetable", {
        method: "PUT",
        body: { teacher_id: teacherId, entries: editorEntries },
      });
      X?.toast?.("Teacher timetable published.");
      await load(mount, teacherId);
    };
    selectTeacher(firstTeacher);
  }

  async function load(mount, selectedTeacher = "") {
    try {
      if (preview) payload = previewPayload;
      else
        payload = await I.api(
          "institution-api",
          `/timetable${page === "admin" && selectedTeacher ? `?teacher_id=${encodeURIComponent(selectedTeacher)}` : ""}`,
        );
      if (page === "admin" && (preview || current?.role === "admin"))
        renderAdmin(mount, selectedTeacher);
      else renderWeek(mount, payload.entries || []);
    } catch (error) {
      mount.innerHTML = `<div class="emptyInstitution"><h3>Timetable unavailable</h3><p>${esc(error.message)}</p></div>`;
    }
  }

  async function init() {
    const mount = ensureMount();
    if (!mount) return;
    const config = await I.config();
    preview = !config.enabled;
    current = preview ? null : await I.me().catch(() => null);
    if (!current && !preview) return;
    await load(mount);
  }
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", () => init().catch(console.error), { once: true });
  else init().catch(console.error);
})();
