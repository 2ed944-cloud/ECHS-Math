(() => {
  "use strict";
  let current = null,
    classes = [],
    selectedClass = null,
    classData = null,
    accounts = [],
    csvRows = [],
    preview = false,
    assignmentInventory = [],
    assignmentQuestions = [],
    selectedQuestionIds = new Set(),
    selectedAssignmentBanks = new Set(),
    selectedAssignmentTargets = new Set(),
    assignmentLoadToken = 0;
  const $ = (id) => document.getElementById(id),
    X = window.ECHSExperience,
    esc = X.escapeHTML;
  const date = (value) =>
    value
      ? new Date(value).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "Never";
  const close = () =>
    document
      .querySelectorAll("dialog[open]")
      .forEach((dialog) => dialog.close());
  document
    .querySelectorAll("[data-close-dialog]")
    .forEach((button) => (button.onclick = close));
  function download(name, text) {
    const url = URL.createObjectURL(new Blob([text], { type: "text/csv" })),
      link = document.createElement("a");
    link.href = url;
    link.download = name;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 500);
  }
  function csvEscape(value) {
    return `"${String(value ?? "").replace(/"/g, '""')}"`;
  }
  function parseCSV(text) {
    const rows = [];
    let row = [],
      field = "",
      quoted = false;
    for (let i = 0; i < text.length; i++) {
      const char = text[i],
        next = text[i + 1];
      if (quoted) {
        if (char === '"' && next === '"') {
          field += '"';
          i++;
        } else if (char === '"') quoted = false;
        else field += char;
      } else if (char === '"') quoted = true;
      else if (char === ",") {
        row.push(field);
        field = "";
      } else if (char === "\n") {
        row.push(field);
        rows.push(row);
        row = [];
        field = "";
      } else if (char !== "\r") field += char;
    }
    row.push(field);
    if (row.some((value) => value.trim())) rows.push(row);
    const headers = (rows.shift() || []).map((value) =>
      value.trim().toLowerCase().replace(/\s+/g, "_"),
    );
    return rows
      .filter((values) => values.some((value) => value.trim()))
      .map((values) =>
        Object.fromEntries(
          headers.map((key, index) => [key, values[index]?.trim() || ""]),
        ),
      );
  }
  const daysAgo = (days) =>
    new Date(Date.now() - days * 86400000).toISOString();
  const previewAccounts = [
    {
      id: "s1",
      display_name: "Amina Hassan",
      username: "amina.hassan",
      role: "student",
      grade: "11",
      external_id: "S001",
      last_login_at: daysAgo(0),
    },
    {
      id: "s2",
      display_name: "Yousef Ali",
      username: "yousef.ali",
      role: "student",
      grade: "11",
      external_id: "S002",
      last_login_at: daysAgo(1),
    },
    {
      id: "s3",
      display_name: "Sara Omar",
      username: "sara.omar",
      role: "student",
      grade: "11",
      external_id: "S003",
      last_login_at: daysAgo(5),
    },
    {
      id: "s4",
      display_name: "Khalid Noor",
      username: "khalid.noor",
      role: "student",
      grade: "11",
      external_id: "S004",
      last_login_at: daysAgo(9),
    },
    {
      id: "t1",
      display_name: "Mohammad Abu Ghuwaleh",
      username: "m.abughuwaleh",
      role: "teacher",
      last_login_at: daysAgo(0),
    },
  ];
  const previewClasses = [
    {
      id: "c1",
      name: "AP Precalculus · Period 2",
      course_key: "AP Precalculus",
      academic_year: "2026–2027",
      section: "2",
      counts: { students: 4 },
    },
  ];
  const previewClassData = {
    class: previewClasses[0],
    summary: {
      students: 4,
      active_this_week: 3,
      average_mastery: 68,
      need_support: 2,
      average_accuracy: 79,
    },
    students: [
      {
        id: "s1",
        display_name: "Amina Hassan",
        username: "amina.hassan",
        grade: "11",
        external_id: "S001",
        mastery: 84,
        accuracy: 91,
        attempts: 216,
        open_mistakes: 3,
        last_login_at: daysAgo(0),
      },
      {
        id: "s2",
        display_name: "Yousef Ali",
        username: "yousef.ali",
        grade: "11",
        external_id: "S002",
        mastery: 72,
        accuracy: 82,
        attempts: 174,
        open_mistakes: 5,
        last_login_at: daysAgo(1),
      },
      {
        id: "s3",
        display_name: "Sara Omar",
        username: "sara.omar",
        grade: "11",
        external_id: "S003",
        mastery: 61,
        accuracy: 74,
        attempts: 122,
        open_mistakes: 9,
        last_login_at: daysAgo(5),
      },
      {
        id: "s4",
        display_name: "Khalid Noor",
        username: "khalid.noor",
        grade: "11",
        external_id: "S004",
        mastery: 43,
        accuracy: 63,
        attempts: 68,
        open_mistakes: 14,
        last_login_at: daysAgo(9),
      },
    ],
    support_priorities: [
      { title: "Trigonometric equations", students: 3, mastery: 47 },
      { title: "Sinusoidal modelling", students: 2, mastery: 56 },
      { title: "Logarithmic equations", students: 2, mastery: 62 },
    ],
    assignments: [
      {
        id: "a1",
        title: "Unit 3 Targeted Review",
        activity_type: "adaptive",
        due_at: new Date(Date.now() + 86400000).toISOString(),
        status: "published",
      },
      {
        id: "a2",
        title: "Trigonometry Mastery Check",
        activity_type: "exam",
        due_at: new Date(Date.now() + 3 * 86400000).toISOString(),
        status: "published",
      },
    ],
  };
  async function loadAccounts() {
    if (preview) {
      accounts = previewAccounts;
      return;
    }
    const payload = await ECHSInstitution.api("account-api", "/accounts");
    accounts = payload.accounts || [];
  }
  async function loadClasses() {
    if (preview) {
      classes = previewClasses;
    } else {
      const payload = await ECHSInstitution.api("institution-api", "/classes");
      classes = payload.classes || [];
    }
    $("classSelector").innerHTML = classes.length
      ? classes
          .map(
            (row) =>
              `<option value="${row.id}">${esc(row.name)} · ${row.counts?.students || 0} students</option>`,
          )
          .join("")
      : `<option value="">No classes yet</option>`;
    selectedClass =
      classes.find((row) => row.id === $("classSelector").value) ||
      classes[0] ||
      null;
    if (selectedClass) $("classSelector").value = selectedClass.id;
  }
  async function loadClass() {
    if (!selectedClass) {
      renderEmpty();
      return;
    }
    classData = preview
      ? previewClassData
      : await ECHSInstitution.api(
          "institution-api",
          `/classes/${selectedClass.id}/dashboard`,
        );
    renderClass();
  }
  function renderEmpty() {
    $("studentRows").innerHTML =
      '<tr><td colspan="8"><div class="emptyInstitution"><h3>Create your first class</h3><p>Use Manage class to add a course and roster.</p></div></td></tr>';
    [
      "heroStudents",
      "heroActive",
      "heroSupport",
      "assignmentCount",
      "rosterCount",
    ].forEach((id) => ($(id).textContent = "0"));
    ["heroMastery", "classAccuracy", "coverageMetric"].forEach(
      (id) => ($(id).textContent = "0%"),
    );
  }
  function activityClass(value) {
    if (!value) return "inactive";
    const days = (Date.now() - new Date(value)) / 86400000;
    return days > 7 ? "inactive" : days > 3 ? "stale" : "";
  }
  function renderAttention(students) {
    const alerts = [];
    students.forEach((row) => {
      const inactive = activityClass(row.last_login_at);
      if (row.mastery < 50)
        alerts.push({
          color: "var(--px-danger)",
          name: row.display_name,
          title: "Mastery support needed",
          detail: `${row.mastery}% mastery · ${row.open_mistakes} open mistakes`,
          action: "Open report",
          id: row.id,
        });
      else if (inactive)
        alerts.push({
          color: "var(--px-warning)",
          name: row.display_name,
          title: "Learning activity has slowed",
          detail: `Last active ${date(row.last_login_at)}`,
          action: "Check in",
          id: row.id,
        });
      else if (row.mastery >= 80)
        alerts.push({
          color: "var(--px-success)",
          name: row.display_name,
          title: "Ready for extension",
          detail: `${row.mastery}% mastery · ${row.accuracy}% accuracy`,
          action: "Challenge",
          id: row.id,
        });
    });
    const rows = alerts.slice(0, 5);
    $("attentionBadge").textContent =
      `${alerts.length} alert${alerts.length === 1 ? "" : "s"}`;
    $("attentionList").innerHTML = rows.length
      ? rows
          .map(
            (row) =>
              `<div class="attentionRow" style="--attention:${row.color}"><span class="attentionMark"></span><div><strong>${esc(row.name)} · ${esc(row.title)}</strong><small>${esc(row.detail)}</small></div><a class="attentionAction" href="student.html?student_id=${encodeURIComponent(row.id)}">${esc(row.action)} →</a></div>`,
          )
          .join("")
      : '<div class="emptyInstitution"><h3>No urgent alerts</h3><p>The class is currently on track.</p></div>';
  }
  function renderPulse(students) {
    const days = [...Array(7)].map((_, index) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - index));
      return {
        date: d.toISOString().slice(0, 10),
        short: d.toLocaleDateString(undefined, { weekday: "narrow" }),
        label: d.toLocaleDateString(undefined, { weekday: "short" }),
        value: 0,
        today: index === 6,
      };
    });
    students.forEach((row) => {
      if (!row.last_login_at) return;
      const found = days.find(
        (day) =>
          day.date === new Date(row.last_login_at).toISOString().slice(0, 10),
      );
      if (found) found.value++;
    });
    X.renderWeekBars("classPulseBars", days);
    $("engagementBadge").textContent =
      `${students.filter((row) => activityClass(row.last_login_at) !== "inactive").length} active`;
  }
  function renderHeatmap(students) {
    const skills = (classData.support_priorities || []).slice(0, 8);
    let html =
      '<span class="heatmapHead">Learner</span>' +
      skills
        .map((_, index) => `<span class="heatmapHead">S${index + 1}</span>`)
        .join("");
    students.slice(0, 5).forEach((student, rowIndex) => {
      html += `<span class="heatmapName">${esc(student.display_name.split(/\s+/)[0])}</span>`;
      skills.forEach((skill, index) => {
        const value = Math.max(
          18,
          Math.min(
            96,
            Math.round((student.mastery || 0) + (index - rowIndex) * 5 - 9),
          ),
        );
        html += `<span class="heatmapCell" style="--level:${value}%" title="${esc(skill.title)} · ${value}%">${value}</span>`;
      });
    });
    $("classHeatmap").innerHTML = skills.length
      ? html
      : '<div class="emptyInstitution" style="grid-column:1/-1">Heatmap appears after topic evidence is available.</div>';
  }
  function renderClass() {
    const summary = classData.summary || {},
      students = classData.students || [],
      readiness = students.length
        ? Math.round(
            (students.filter(
              (row) =>
                row.mastery >= 65 &&
                activityClass(row.last_login_at) !== "inactive",
            ).length /
              students.length) *
              100,
          )
        : 0;
    $("classHeroTitle").innerHTML =
      `${esc(classData.class.name)}.<span>Clear evidence for every learner.</span>`;
    $("classHeroText").textContent =
      `${classData.class.course_key} · ${classData.class.academic_year || "Current year"} · ${students.length} students`;
    $("heroStudents").textContent = summary.students || students.length;
    $("heroActive").textContent = summary.active_this_week || 0;
    $("heroMastery").textContent = `${summary.average_mastery || 0}%`;
    $("heroSupport").textContent = summary.need_support || 0;
    $("classAccuracy").textContent = `${summary.average_accuracy || 0}%`;
    $("assignmentCount").textContent = (classData.assignments || []).length;
    $("rosterCount").textContent = students.length;
    $("coverageMetric").textContent =
      `${students.length ? Math.round((students.filter((row) => row.mastery > 0).length / students.length) * 100) : 0}%`;
    $("rosterTrend").textContent = `${students.length} enrolled`;
    $("activeTrend").textContent =
      `${students.length ? Math.round(((summary.active_this_week || 0) / students.length) * 100) : 0}% engagement`;
    $("masteryTrend").textContent =
      (summary.average_mastery || 0) >= 80 ? "Mastery level" : "Developing";
    $("supportTrend").textContent =
      summary.need_support || 0 ? "Intervention ready" : "On track";
    X.setRing("classReadinessRing", readiness);
    $("classReadinessValue").textContent = `${readiness}%`;
    $("classReadinessLabel").textContent = `${readiness}% on track`;
    $("classReadinessTitle").textContent =
      readiness >= 75
        ? "Strong class momentum"
        : readiness >= 50
          ? "Momentum is building"
          : "Targeted support will help";
    $("classReadinessText").textContent =
      `${summary.active_this_week || 0} active this week · ${summary.need_support || 0} learners need support.`;
    $("classReadinessSteps").innerHTML = [
      {
        i: "✓",
        t: `${students.filter((row) => row.mastery >= 65).length} proficient or mastered`,
      },
      { i: "↗", t: `${summary.active_this_week || 0} active this week` },
      { i: "!", t: `${summary.need_support || 0} intervention priorities` },
    ]
      .map(
        (row) =>
          `<div class="missionStep"><i>${row.i}</i><span>${row.t}</span></div>`,
      )
      .join("");
    renderStudents();
    renderAttention(students);
    renderPulse(students);
    renderHeatmap(students);
    $("supportList").innerHTML = (classData.support_priorities || []).length
      ? classData.support_priorities
          .map(
            (row) =>
              `<div class="premiumListRow" style="--row-color:var(--px-maroon)"><span class="rowIcon">!</span><div><strong>${esc(row.title)}</strong><small>${row.students} learners represented</small><div class="progressMini"><i style="width:${X.safePercent(row.mastery)}%"></i></div></div><span class="rowValue">${Math.round(row.mastery)}%</span></div>`,
          )
          .join("")
      : '<div class="emptyInstitution">Mastery priorities appear after students practise.</div>';
    const bins = [
        { label: "Starting", min: 0, max: 34, color: "#b42343" },
        { label: "Developing", min: 35, max: 64, color: "#d09a35" },
        { label: "Proficient", min: 65, max: 84, color: "#2b779d" },
        { label: "Mastered", min: 85, max: 100, color: "#087d72" },
      ],
      rows = bins.map((bin) => {
        const count = students.filter(
          (row) => row.mastery >= bin.min && row.mastery <= bin.max,
        ).length;
        return {
          label: bin.label,
          count,
          value: students.length ? (count / students.length) * 100 : 0,
          color: bin.color,
        };
      });
    X.renderDistribution("distributionChart", rows);
    $("assignmentList").innerHTML = (classData.assignments || []).length
      ? classData.assignments
          .map(
            (row) =>
              `<div class="premiumListRow assignmentPremium"><span class="rowIcon">${X.icon(row.activity_type === "exam" ? "test" : "assignment")}</span><div><strong>${esc(row.title)}</strong><small>${esc((row.activity_type || "practice").toUpperCase())}${row.due_at ? ` · Due ${date(row.due_at)}` : ""}</small><div class="progressMini"><i style="width:${row.status === "completed" ? 100 : 48}%"></i></div></div><span class="cardBadge">${esc(row.status || "published")}</span></div>`,
          )
          .join("")
      : '<div class="emptyInstitution">No assignments yet.</div>';
  }
  function renderStudents() {
    const query = $("studentSearch").value.trim().toLowerCase(),
      students = (classData?.students || []).filter(
        (row) =>
          !query ||
          [row.display_name, row.username, row.grade, row.external_id].some(
            (value) =>
              String(value ?? "")
                .toLowerCase()
                .includes(query),
          ),
      );
    $("studentRows").innerHTML = students.length
      ? students
          .map(
            (row) =>
              `<tr><td><div class="accountIdentity"><span class="avatarInitial">${ECHSInstitution.initials(row.display_name)}</span><div><strong>${esc(row.display_name)}</strong><br><small><i class="activityDot ${activityClass(row.last_login_at)}"></i>${esc(row.grade ? `Grade ${row.grade}` : "Student")}</small></div></div></td><td><strong>${esc(row.username)}</strong></td><td><div class="masteryCell"><strong><span>${row.mastery >= 85 ? "Mastered" : row.mastery >= 65 ? "Proficient" : row.mastery >= 35 ? "Developing" : "Starting"}</span><span>${row.mastery}%</span></strong><div class="progressMini" style="--row-color:${row.mastery >= 65 ? "var(--px-teal)" : row.mastery >= 35 ? "var(--px-gold)" : "var(--px-maroon)"}"><i style="width:${row.mastery}%"></i></div></div></td><td>${row.accuracy}%</td><td>${row.attempts}</td><td>${row.open_mistakes}</td><td>${date(row.last_login_at)}</td><td><div class="tableActions"><a class="iButton secondary small" href="student.html?student_id=${row.id}">Report</a><button class="iButton small" data-reset="${row.id}" ${preview ? "disabled" : ""}>Reset</button></div></td></tr>`,
          )
          .join("")
      : '<tr><td colspan="8"><div class="emptyInstitution">No matching students.</div></td></tr>';
    document.querySelectorAll("[data-reset]").forEach(
      (button) =>
        (button.onclick = () => {
          const row = students.find((item) => item.id === button.dataset.reset);
          $("resetStudentId").value = row.id;
          $("resetStudentLabel").textContent =
            `Reset the school-managed password for ${row.display_name} (@${row.username}).`;
          $("teacherCredential").classList.add("hidden");
          $("teacherNewPassword").value = "";
          $("resetDialog").showModal();
        }),
    );
  }
  function memberList(query = "") {
    const selected = new Set((classData?.students || []).map((row) => row.id)),
      rows = accounts.filter(
        (row) =>
          ["student", "teacher"].includes(row.role) &&
          (!query ||
            [row.display_name, row.username].some((value) =>
              String(value).toLowerCase().includes(query.toLowerCase()),
            )),
      );
    $("memberList").innerHTML = rows
      .map(
        (row) =>
          `<label class="premiumListRow"><span class="rowIcon">${row.role === "teacher" ? "▦" : "◉"}</span><span><strong>${esc(row.display_name)}</strong><small>@${esc(row.username)} · ${esc(row.role)}</small></span><input type="checkbox" data-member="${row.id}" data-role="${row.role}" ${selected.has(row.id) || row.id === current.id ? "checked" : ""}></label>`,
      )
      .join("");
  }
  async function createClass(event) {
    event.preventDefault();
    if (preview)
      return X.toast(
        "Class creation becomes active after deployment.",
        "warning",
      );
    await ECHSInstitution.api("institution-api", "/classes", {
      method: "POST",
      body: JSON.stringify({
        name: $("className").value,
        course_key: $("classCourse").value,
        academic_year: $("academicYear").value,
        section: $("classSection").value,
      }),
    });
    close();
    await refresh();
    X.toast("Class saved.");
  }
  async function saveMembers(event) {
    event.preventDefault();
    if (preview)
      return X.toast(
        "Roster editing becomes active after deployment.",
        "warning",
      );
    const checked = [...document.querySelectorAll("[data-member]:checked")],
      student_ids = checked
        .filter((node) => node.dataset.role === "student")
        .map((node) => node.dataset.member),
      teacher_ids = checked
        .filter((node) => node.dataset.role === "teacher")
        .map((node) => node.dataset.member);
    await ECHSInstitution.api(
      "institution-api",
      `/classes/${selectedClass.id}/members`,
      { method: "POST", body: JSON.stringify({ student_ids, teacher_ids }) },
    );
    close();
    await refresh();
    X.toast("Roster updated.");
  }
  const selectionMode = () =>
    document.querySelector('[name="assignmentSelectionMode"]:checked')?.value ||
    "curated";
  function canonicalCourse(value) {
    const key = String(value || "")
      .trim()
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    if (/^ap-calculus(?:-(?:ab|bc|ab-bc|bc-ab|ab-and-bc|bc-and-ab))?$/.test(key))
      return "ap-calculus";
    if (key.includes("precalculus")) return "ap-precalculus";
    if (key.includes("ib") && key.includes("math")) return "ib-math-ai";
    if (key.includes("algebra-2") || key.includes("algebra2"))
      return "algebra-2";
    if (key.includes("grade-9")) return "grade-9";
    return key;
  }
  const assignmentCourse = () => canonicalCourse(selectedClass?.course_key);
  const CALCULUS_ASSIGNMENT_BANKS = ["ADAMS10", "CALCT3BC"];
  const calculusBankLabel = (code) => `AP Calculus AB / BC · ${code}`;
  async function staticCalculusInventory() {
    if (!window.ECHSBank) throw new Error("The bundled AP Calculus catalogue is unavailable.");
    const catalog = await ECHSBank.loadCatalog(),
      topics = (catalog.bundles?.topics || []).filter(
        (row) => Number(row.unit) > 0 && row.topic && row.file,
      ),
      rows = [];
    for (const code of CALCULUS_ASSIGNMENT_BANKS) {
      rows.push({
        bank_code: code,
        bank_display_name: calculusBankLabel(code),
        course_key: "ap-calculus",
        unit_number: "",
        lesson_key: "",
        static_catalogue: true,
      });
      const units = [...new Set(topics.filter((row) => Number(row.bank_counts?.[code] || 0) > 0).map((row) => String(row.unit)))];
      units.forEach((unit) =>
        rows.push({
          bank_code: code,
          bank_display_name: calculusBankLabel(code),
          course_key: "ap-calculus",
          unit_number: unit,
          lesson_key: "",
          static_catalogue: true,
        }),
      );
      topics
        .filter((row) => Number(row.bank_counts?.[code] || 0) > 0)
        .forEach((row) =>
          rows.push({
            bank_code: code,
            bank_display_name: calculusBankLabel(code),
            course_key: "ap-calculus",
            unit_number: String(row.unit),
            lesson_key: String(row.topic),
            lesson_title: String(row.label || "").replace(/^\s*\d+(?:\.\d+)?\s*·\s*/, ""),
            static_catalogue: true,
            static_bundle: row,
          }),
        );
    }
    return rows;
  }
  const assignmentTargetKey = (row) =>
    `${row?.unit_number || ""}::${row?.lesson_key || ""}`;
  const selectedBanks = () => [...selectedAssignmentBanks];
  function assignmentBankOptions() {
    return [
      ...new Map(
        assignmentInventory.map((row) => [
          String(row.bank_code || ""),
          row.bank_display_name || row.bank_code,
        ]),
      ),
    ].filter(([code]) => code);
  }
  function displayBankLabel(code) {
    return (
      assignmentBankOptions().find(([value]) => value === code)?.[1] || code
    );
  }
  function assignmentTargetOptions() {
    const scope = $("assignmentScope").value,
      options = new Map();
    if (scope === "course")
      return new Map([["::", { unit_number: "", lesson_key: "", label: "Complete mapped course" }]]);
    assignmentInventory
      .filter((row) => selectedAssignmentBanks.has(String(row.bank_code)))
      .forEach((row) => {
        if (scope === "unit" && row.unit_number)
          options.set(`${row.unit_number}::`, {
            unit_number: String(row.unit_number),
            lesson_key: "",
            label: `Unit ${row.unit_number}`,
          });
        if (scope === "lesson" && row.lesson_key)
          options.set(assignmentTargetKey(row), {
            unit_number: String(row.unit_number || ""),
            lesson_key: String(row.lesson_key),
            lesson_title: row.lesson_title || "Mapped lesson",
            label: `${row.lesson_key} · ${row.lesson_title || "Mapped lesson"}`,
          });
      });
    return options;
  }
  function selectedAssignmentRoutes() {
    const scope = $("assignmentScope").value,
      options = assignmentTargetOptions(),
      targetKeys = scope === "course" ? ["::"] : [...selectedAssignmentTargets],
      routes = [];
    selectedBanks().forEach((bank) => {
      const bankRows = assignmentInventory.filter(
        (row) => String(row.bank_code) === bank,
      );
      targetKeys.forEach((key) => {
        const target = options.get(key);
        if (!target) return;
        const available =
          scope === "course" ||
          bankRows.some((row) =>
            scope === "unit"
              ? String(row.unit_number || "") === String(target.unit_number)
              : String(row.unit_number || "") === String(target.unit_number) &&
                String(row.lesson_key || "") === String(target.lesson_key),
          );
        if (!available) return;
        routes.push({
          bank,
          scope,
          unit: scope === "course" ? "" : target.unit_number || "",
          topic: scope === "lesson" ? target.lesson_key || "" : "",
          label: target.label,
        });
      });
    });
    return routes;
  }
  function renderAssignmentBanks() {
    const banks = assignmentBankOptions();
    selectedAssignmentBanks = new Set(
      [...selectedAssignmentBanks].filter((code) =>
        banks.some(([value]) => value === code),
      ),
    );
    $("assignmentBanks").innerHTML = banks.length
      ? banks
          .map(
            ([code, label]) =>
              `<label class="multiChoice ${selectedAssignmentBanks.has(code) ? "selected" : ""}"><input type="checkbox" data-assignment-bank="${esc(code)}" ${selectedAssignmentBanks.has(code) ? "checked" : ""}><span><strong>${esc(label)}</strong><small>${assignmentInventory.filter((row) => String(row.bank_code) === code && row.lesson_key).length.toLocaleString()} mapped lessons</small></span><i>✓</i></label>`,
          )
          .join("")
      : '<div class="multiPickerEmpty">No verified banks are available for this course.</div>';
    document.querySelectorAll("[data-assignment-bank]").forEach((input) => {
      input.onchange = async () => {
        input.checked
          ? selectedAssignmentBanks.add(input.dataset.assignmentBank)
          : selectedAssignmentBanks.delete(input.dataset.assignmentBank);
        renderAssignmentBanks();
        renderAssignmentTargets();
        await loadAssignmentQuestions();
      };
    });
  }
  function renderAssignmentTargets() {
    const scope = $("assignmentScope").value,
      control = $("assignmentTargetControl"),
      options = assignmentTargetOptions(),
      query = $("assignmentTargetSearch").value.trim().toLowerCase();
    control.hidden = scope === "course";
    if (scope === "course") {
      selectedAssignmentTargets = new Set(["::"]);
      return;
    }
    selectedAssignmentTargets = new Set(
      [...selectedAssignmentTargets].filter((key) => options.has(key)),
    );
    const visible = [...options].filter(([, row]) =>
      !query || `${row.label} ${row.unit_number}`.toLowerCase().includes(query),
    );
    $("assignmentTargets").innerHTML = visible.length
      ? visible
          .map(
            ([key, row]) =>
              `<label class="multiChoice targetChoice ${selectedAssignmentTargets.has(key) ? "selected" : ""}"><input type="checkbox" data-assignment-target="${esc(key)}" ${selectedAssignmentTargets.has(key) ? "checked" : ""}><span><strong>${esc(row.label)}</strong><small>${scope === "lesson" ? `Unit ${esc(row.unit_number || "—")}` : "Complete mapped unit"}</small></span><i>✓</i></label>`,
          )
          .join("")
      : '<div class="multiPickerEmpty">No mapped targets match this selection.</div>';
    document.querySelectorAll("[data-assignment-target]").forEach((input) => {
      input.onchange = async () => {
        input.checked
          ? selectedAssignmentTargets.add(input.dataset.assignmentTarget)
          : selectedAssignmentTargets.delete(input.dataset.assignmentTarget);
        renderAssignmentTargets();
        await loadAssignmentQuestions();
      };
    });
  }
  function syncAssignmentSummary() {
    const curated = selectionMode() === "curated",
      selected = selectedQuestionIds.size,
      planned = Math.max(1, Number($("assignmentCountInput").value) || 10),
      banks = selectedAssignmentBanks.size,
      routes = selectedAssignmentRoutes().length;
    $("assignmentPublishSummary").textContent = curated
      ? `${selected} exact question${selected === 1 ? "" : "s"} selected across ${banks} bank${banks === 1 ? "" : "s"} and ${routes} route${routes === 1 ? "" : "s"}.`
      : `${Math.min(planned, assignmentQuestions.length || planned)} questions will be generated with ${$("assignmentDistribution").selectedOptions[0]?.textContent.toLowerCase() || "the selected distribution"}.`;
    $("assignmentQuestionList").classList.toggle("poolMode", !curated);
  }
  function questionPrompt(row) {
    const payload = row.payload || {};
    return (
      payload.prompt_html ||
      esc(payload.prompt_text || row.question_id || "Question")
    );
  }
  function renderAssignmentQuestions() {
    const list = $("assignmentQuestionList"),
      curated = selectionMode() === "curated";
    $("questionPickerMeta").textContent = assignmentQuestions.length
      ? `${assignmentQuestions.length.toLocaleString()} mapped questions · ${selectedQuestionIds.size} selected · ${selectedAssignmentRoutes().length} routes`
      : "No questions loaded";
    if (!assignmentQuestions.length) {
      list.innerHTML =
        '<div class="assignmentPickerEmpty"><span>∫</span><strong>No mapped questions in this route</strong><p>Choose another bank, unit, or lesson.</p></div>';
      syncAssignmentSummary();
      return;
    }
    list.innerHTML = assignmentQuestions
      .map((row) => {
        const payload = row.payload || {},
          source = payload.source || {},
          checked = selectedQuestionIds.has(String(row.question_id));
        return `<label class="assignmentQuestion ${checked ? "selected" : ""}"><input type="checkbox" data-assignment-question="${esc(row.question_id)}" ${checked ? "checked" : ""} ${curated ? "" : "disabled"}><span><span class="assignmentQuestionTop"><span>${esc(payload.type || row.question_type || "question")}</span><span>${esc(source.section || payload.skill_key || "mapped")}</span><span>${esc(displayBankLabel(String(row.bank_code || "bank")))}</span></span><span class="assignmentQuestionPrompt">${questionPrompt(row)}</span></span></label>`;
      })
      .join("");
    document.querySelectorAll("[data-assignment-question]").forEach((input) => {
      input.onchange = () => {
        input.checked
          ? selectedQuestionIds.add(input.dataset.assignmentQuestion)
          : selectedQuestionIds.delete(input.dataset.assignmentQuestion);
        input
          .closest(".assignmentQuestion")
          .classList.toggle("selected", input.checked);
        renderAssignmentQuestions();
      };
    });
    syncAssignmentSummary();
  }
  async function loadAssignmentInventory() {
    const course = assignmentCourse();
    let dynamicRows = [];
    try {
      let result = await ECHSInstitution.api(
        "practice-bank-api",
        `/inventory?course=${encodeURIComponent(course)}`,
      );
      dynamicRows = result.rows || [];
      // Recover from older deployed inventory functions that only expose the
      // organization-wide inventory, while retaining strict course isolation.
      if (!dynamicRows.length) {
        result = await ECHSInstitution.api("practice-bank-api", "/inventory");
        dynamicRows = (result.rows || []).filter(
          (row) => canonicalCourse(row.course_key) === course,
        );
      }
    } catch (error) {
      if (course !== "ap-calculus") throw error;
      console.warn("Private Calculus inventory is unavailable; using bundled banks.", error);
    }
    const bundledRows =
      course === "ap-calculus" ? await staticCalculusInventory() : [];
    // Database rows win when a newly uploaded package shares a route with a
    // bundled source. Bundled ADAMS10/CALCT3BC remain available as fallback.
    const rowsByRoute = new Map();
    [...bundledRows, ...dynamicRows].forEach((row) => {
      if (canonicalCourse(row.course_key) !== course) return;
      const key = `${row.bank_code || ""}::${row.unit_number || ""}::${row.lesson_key || ""}`;
      rowsByRoute.set(key, row);
    });
    assignmentInventory = [...rowsByRoute.values()];
    const firstBank = assignmentBankOptions()[0]?.[0];
    if (firstBank && !selectedAssignmentBanks.size)
      selectedAssignmentBanks.add(firstBank);
    renderAssignmentBanks();
    const firstTarget = assignmentTargetOptions().keys().next().value;
    if (firstTarget) selectedAssignmentTargets.add(firstTarget);
    renderAssignmentTargets();
    await loadAssignmentQuestions();
  }
  function questionMatchesAssignmentRoute(question, route) {
    if (String(question.bank_code || "") !== String(route.bank)) return false;
    if (window.ECHSBank?.mappingCompatible)
      return ECHSBank.mappingCompatible(question, {
        course: assignmentCourse(),
        unit: route.scope === "course" ? "" : route.unit,
        topic: route.scope === "lesson" ? route.topic : "",
      });
    return true;
  }
  async function loadAssignmentRoute(route) {
    const rows = assignmentInventory.filter(
        (row) => String(row.bank_code) === String(route.bank),
      ),
      staticRows = rows.filter(
        (row) =>
          row.static_bundle &&
          (route.scope === "course" ||
            (route.scope === "unit" &&
              String(row.unit_number || "") === String(route.unit)) ||
            (route.scope === "lesson" &&
              String(row.unit_number || "") === String(route.unit) &&
              String(row.lesson_key || "") === String(route.topic))),
      );
    const output = [];
    if (staticRows.length) {
      const bundles = [
          ...new Map(
            staticRows.map((row) => [row.static_bundle.file, row.static_bundle]),
          ).values(),
        ],
        loaded = (await Promise.all(bundles.map((row) => ECHSBank.loadBundle(row)))).flat();
      output.push(...loaded
        .filter((question) => questionMatchesAssignmentRoute(question, route))
        .map((question) => ({
          question_id: question.id,
          bank_code: question.bank_code,
          question_type: question.type,
          payload: {
            type: question.type,
            prompt_html: question.prompt_html,
            prompt_text: question.prompt_text,
            choices: question.choices,
            source: question.source,
            classification: question.classification,
            metadata: question.metadata,
            skill_key: question.classification?.ap_topic,
          },
        })));
    }
    const hasDynamicRows = rows.some(
      (row) => !row.static_catalogue && !row.package_only,
    );
    if (!hasDynamicRows) return output;
    const query = new URLSearchParams({
      course: assignmentCourse(),
      bank: route.bank,
      limit: "2000",
    });
    if (route.scope === "lesson" && route.topic)
      query.set("lesson", route.topic);
    if (route.scope === "unit" && route.unit) query.set("unit", route.unit);
    const result = await ECHSInstitution.api(
      "practice-bank-api",
      `/questions?${query}`,
    );
    output.push(...(result.questions || []));
    return output;
  }
  async function loadAssignmentQuestions() {
    const loadToken = ++assignmentLoadToken,
      routes = selectedAssignmentRoutes(),
      banks = selectedBanks();
    if (!banks.length || !routes.length) {
      assignmentQuestions = [];
      $("assignmentAvailability").innerHTML =
        '<strong>Choose banks and targets</strong><span>Select at least one mapped route.</span>';
      renderAssignmentQuestions();
      return;
    }
    $("assignmentQuestionList").innerHTML =
      '<div class="assignmentPickerEmpty"><span>···</span><strong>Building the combined question pool</strong><p>Checking every selected bank and lesson.</p></div>';
    const loaded = (await Promise.all(routes.map(loadAssignmentRoute))).flat(),
      unique = new Map();
    if (loadToken !== assignmentLoadToken) return;
    loaded.forEach((row) => {
      const id = String(row.question_id || row.id || ""),
        bank = String(row.bank_code || row.payload?.bank_code || "");
      if (id && !unique.has(`${bank}::${id}`)) unique.set(`${bank}::${id}`, row);
    });
    assignmentQuestions = [...unique.values()];
    selectedQuestionIds = new Set(
      [...selectedQuestionIds].filter((id) =>
        assignmentQuestions.some((row) => String(row.question_id) === id),
      ),
    );
    $("assignmentAvailability").innerHTML =
      `<strong>${assignmentQuestions.length.toLocaleString()} questions available</strong><span>${banks.length} bank${banks.length === 1 ? "" : "s"} · ${routes.length} mapped route${routes.length === 1 ? "" : "s"}</span>`;
    renderAssignmentQuestions();
  }
  async function openAssignmentStudio() {
    $("assignmentForm").reset();
    selectedQuestionIds.clear();
    selectedAssignmentBanks.clear();
    selectedAssignmentTargets.clear();
    assignmentQuestions = [];
    $("assignmentDialog").showModal();
    try {
      await loadAssignmentInventory();
    } catch (error) {
      $("assignmentQuestionList").innerHTML =
        `<div class="assignmentPickerEmpty"><span>!</span><strong>Question banks could not be loaded</strong><p>${esc(error.message)}</p></div>`;
    }
  }
  async function createAssignment(event) {
    event.preventDefault();
    if (preview)
      return X.toast(
        "Assignment publishing becomes active after deployment.",
        "warning",
      );
    const routes = selectedAssignmentRoutes(),
      banks = selectedBanks(),
      targets = [...new Map(routes.map((route) => [
        `${route.unit}::${route.topic}`,
        { unit: route.unit, topic: route.topic, label: route.label },
      ])).values()],
      firstRoute = routes[0],
      payload = {
      class_id: selectedClass.id,
      title: $("assignmentTitle").value,
      description: $("assignmentDescription").value,
      activity_type: $("activityType").value,
      due_at: $("assignmentDue").value
        ? new Date($("assignmentDue").value).toISOString()
        : null,
      configuration: {
        course: selectedClass.course_key,
        bank: banks[0] || "",
        banks,
        scope: $("assignmentScope").value,
        unit: firstRoute?.unit || "",
        topic: firstRoute?.topic || "",
        targets,
        routes,
        question_ids:
          selectionMode() === "curated" ? [...selectedQuestionIds] : [],
        selection_mode: selectionMode(),
        distribution: $("assignmentDistribution").value,
        count: Number($("assignmentCountInput").value),
        minutes: Number($("assignmentMinutes").value),
        difficulty: $("assignmentDifficulty").value,
      },
    };
    if (!banks.length)
      return X.toast("Select at least one verified question bank.", "warning");
    if (!routes.length)
      return X.toast("Select at least one mapped lesson or unit.", "warning");
    if (selectionMode() === "curated" && !selectedQuestionIds.size)
      return X.toast(
        "Select at least one question before publishing.",
        "warning",
      );
    await ECHSInstitution.api("institution-api", "/assignments", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    close();
    await loadClass();
    X.toast("Assignment published.");
  }
  async function refresh() {
    await Promise.all([loadAccounts(), loadClasses()]);
    await loadClass();
  }
  async function init() {
    current = await ECHSInstitution.requireAuth(["teacher", "admin"]);
    if (
      !current &&
      document.documentElement.dataset.institution === "unconfigured"
    ) {
      preview = true;
      current = {
        id: "t1",
        display_name: "Mohammad Abu Ghuwaleh",
        username: "m.abughuwaleh",
        role: "teacher",
        can_manage_accounts: true,
        organization_name: "ECHS Mathematics",
      };
      ECHSInstitution.mountIdentity(current);
      X.setIdentityAvatar(current);
      X.showPreview(
        "Illustrative class data is shown so the complete teacher experience can be reviewed before the institutional backend is activated.",
      );
    } else if (!current) return;
    else {
      ECHSInstitution.mountIdentity(current);
      X.setIdentityAvatar(current);
    }
    $("adminNav").classList.remove("hidden");
    if (current.role === "teacher")
      $("adminNav").innerHTML =
        '<span class="institutionNavIcon">◫</span>School Accounts';
    await refresh();
    $("classSelector").onchange = async () => {
      selectedClass = classes.find(
        (row) => row.id === $("classSelector").value,
      );
      await loadClass();
    };
    $("studentSearch").oninput = renderStudents;
    $("manageClass").onclick = () => {
      if (!selectedClass) {
        $("classForm").reset();
        $("classDialog").showModal();
      } else {
        memberList();
        $("membersDialog").showModal();
      }
    };
    $("newAssignment").onclick =
      $("heroAssignment").onclick =
      $("sectionAssignment").onclick =
        () => {
          if (!selectedClass)
            return X.toast("Create or select a class first.", "warning");
          openAssignmentStudio();
        };
    $("heroImport").onclick = $("importStudents").onclick = () => {
      $("teacherImportForm").reset();
      csvRows = [];
      $("teacherRunImport").disabled = true;
      $("teacherImportResult").innerHTML = "";
      $("importDialog").showModal();
    };
    $("classForm").onsubmit = createClass;
    $("membersForm").onsubmit = saveMembers;
    $("memberSearch").oninput = (event) => memberList(event.target.value);
    $("assignmentForm").onsubmit = createAssignment;
    $("assignmentScope").onchange = async () => {
      selectedAssignmentTargets.clear();
      const firstTarget = assignmentTargetOptions().keys().next().value;
      if (firstTarget) selectedAssignmentTargets.add(firstTarget);
      renderAssignmentTargets();
      await loadAssignmentQuestions();
    };
    $("assignmentTargetSearch").oninput = renderAssignmentTargets;
    $("assignmentCountInput").oninput = syncAssignmentSummary;
    $("assignmentDistribution").onchange = syncAssignmentSummary;
    $("selectAllAssignmentBanks").onclick = async () => {
      selectedAssignmentBanks = new Set(
        assignmentBankOptions().map(([code]) => code),
      );
      renderAssignmentBanks();
      renderAssignmentTargets();
      await loadAssignmentQuestions();
    };
    $("clearAssignmentBanks").onclick = async () => {
      selectedAssignmentBanks.clear();
      selectedAssignmentTargets.clear();
      renderAssignmentBanks();
      renderAssignmentTargets();
      await loadAssignmentQuestions();
    };
    $("selectAllAssignmentTargets").onclick = async () => {
      selectedAssignmentTargets = new Set(assignmentTargetOptions().keys());
      renderAssignmentTargets();
      await loadAssignmentQuestions();
    };
    $("clearAssignmentTargets").onclick = async () => {
      selectedAssignmentTargets.clear();
      renderAssignmentTargets();
      await loadAssignmentQuestions();
    };
    document
      .querySelectorAll('[name="assignmentSelectionMode"]')
      .forEach((input) => (input.onchange = renderAssignmentQuestions));
    $("selectAllQuestions").onclick = () => {
      assignmentQuestions.forEach((row) =>
        selectedQuestionIds.add(String(row.question_id)),
      );
      renderAssignmentQuestions();
    };
    $("clearQuestionSelection").onclick = () => {
      selectedQuestionIds.clear();
      renderAssignmentQuestions();
    };
    $("resetForm").onsubmit = async (event) => {
      event.preventDefault();
      if (preview)
        return X.toast(
          "Password reset becomes active after deployment.",
          "warning",
        );
      const payload = await ECHSInstitution.api(
        "account-api",
        `/accounts/${$("resetStudentId").value}/reset-password`,
        {
          method: "POST",
          body: JSON.stringify({ password: $("teacherNewPassword").value }),
        },
      );
      $("teacherCredential").innerHTML =
        `<strong>New password</strong><p><code>${esc(payload.initial_password)}</code></p><p>Give it securely to the student. It cannot be retrieved later.</p>`;
      $("teacherCredential").classList.remove("hidden");
    };
    $("teacherCsv").onchange = async (event) => {
      if (!event.target.files[0]) return;
      csvRows = parseCSV(await event.target.files[0].text())
        .slice(0, 500)
        .map((row) => ({ ...row, role: "student" }));
      $("teacherImportResult").innerHTML =
        `<div class="iNotice">${csvRows.length} student rows ready.</div>`;
      $("teacherRunImport").disabled = !csvRows.length;
    };
    $("teacherImportForm").onsubmit = async (event) => {
      event.preventDefault();
      if (preview)
        return X.toast(
          "CSV import becomes active after deployment.",
          "warning",
        );
      const payload = await ECHSInstitution.api(
          "account-api",
          "/accounts/import",
          { method: "POST", body: JSON.stringify({ rows: csvRows }) },
        ),
        created = payload.created || [];
      $("teacherImportResult").innerHTML =
        `<div class="iNotice"><strong>${created.length} accounts created.</strong></div><button type="button" class="iButton gold" id="teacherDownloadCreds">Download credentials</button>`;
      $("teacherDownloadCreds").onclick = () =>
        download(
          "student-credentials.csv",
          [
            "display_name,username,initial_password,email,grade",
            ...created.map((row) =>
              [
                row.display_name,
                row.username,
                row.initial_password,
                row.email,
                row.grade,
              ]
                .map(csvEscape)
                .join(","),
            ),
          ].join("\n"),
        );
      await refresh();
    };
  }
  init().catch((error) => {
    console.error(error);
    X.toast(error.message, "danger");
  });
})();
