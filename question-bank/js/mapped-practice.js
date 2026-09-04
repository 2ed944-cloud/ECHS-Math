const UI = {
  mode: document.getElementById("mode"),
  course: document.getElementById("course"),
  scope: document.getElementById("scope"),
  group: document.getElementById("group"),
  bundle: document.getElementById("bundle"),
  visibility: document.getElementById("visibility"),
  bank: document.getElementById("bank"),
  type: document.getElementById("type"),
  difficulty: document.getElementById("difficulty"),
  section: document.getElementById("section"),
  count: document.getElementById("count"),
  start: document.getElementById("start"),
  status: document.getElementById("status"),
  shell: document.getElementById("shell"),
  heroLoaded: document.getElementById("heroLoaded"),
  heroBanks: document.getElementById("heroBanks"),
  heroDue: document.getElementById("heroDue"),
  heroMastery: document.getElementById("heroMastery"),
  scopeDescription: document.getElementById("scopeDescription"),
  roleBadge: document.getElementById("practiceRoleBadge"),
};
let catalog,
  access = null,
  assignmentConfig = null,
  privateInventory = [],
  loaded = [],
  set = [],
  targets = [],
  loading = false,
  session = null,
  targetCount = 10,
  lastResult = null,
  questionStartedAt = Date.now(),
  currentSourceKey = "";
let state = {
  index: 0,
  response: null,
  checked: false,
  correct: 0,
  graded: 0,
  answered: new Set(),
};
const params = ECHSBank.params(),
  assignmentId = params.get("assignment"),
  assignmentTitle = params.get("title"),
  fromLesson = params.get("from"),
  requestedAccessKey = params.get("accessKey"),
  requestedTopic = params.get("topic"),
  requestedUnit = params.get("unit");
const modeCopy = {
  manual: [
    "Focused practice",
    "Build a set from the exact course, lesson or unit selected below.",
  ],
  adaptive: [
    "Adaptive practice",
    "The next question responds to mastery evidence while remaining inside the selected scope.",
  ],
  review: [
    "Spaced review",
    "Only due review questions inside the selected course and scope are included.",
  ],
  mistakes: [
    "Mistake recovery",
    "Only unresolved questions inside the selected course and scope return.",
  ],
};
const scopeCopy = {
  course: [
    "Full course",
    "Browse every mapped question in the selected course. Available to teachers and administrators.",
  ],
  unit: [
    "Completed unit",
    "Practise all mapped questions from one unit. Students unlock it after completing every available lesson in that unit.",
  ],
  lesson: [
    "Completed lesson",
    "Practise only questions mapped to one completed lesson.",
  ],
};
const student = () => access?.role === "student";
const staff = () => ["teacher", "admin"].includes(access?.role || "");
const normaliseCourse = (value) =>
  ECHSPortalAccess.normaliseCourseKey(value || "");
const courseDefinitions = () =>
  Array.isArray(window.ECHS_COURSES) ? window.ECHS_COURSES : [];
function updateModeCopy() {
  const [title, description] = modeCopy[UI.mode.value] || modeCopy.manual;
  document.getElementById("modeTitle").textContent = title;
  document.getElementById("modeDescription").textContent = description;
  UI.difficulty.disabled = UI.mode.value === "adaptive";
}
function completionRows() {
  try {
    const value = JSON.parse(
      localStorage.getItem("echs_math_complete") || "[]",
    );
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}
function completionParts(value) {
  const parts = String(value || "").split("::");
  if (parts.length < 4) return null;
  return {
    raw: String(value),
    course: normaliseCourse(parts[0]),
    unit: Number(parts[1]) + 1,
    topic: String(parts[2]),
    title: parts.slice(3).join("::"),
  };
}
function courseDefinition(courseKey) {
  return (
    courseDefinitions().find(
      (course) =>
        normaliseCourse(course?.id || course?.course || course?.title) ===
        normaliseCourse(courseKey),
    ) || null
  );
}
function unitDefinition(courseKey, unitNumber) {
  return courseDefinition(courseKey)?.units?.[Number(unitNumber) - 1] || null;
}
function readyLessons(courseKey, unitNumber) {
  const lessons = unitDefinition(courseKey, unitNumber)?.lessons || [];
  return lessons.filter(
    (lesson) =>
      Boolean(lesson?.url) &&
      lesson?.kind !== "assessment" &&
      !/assessment|review/i.test(String(lesson?.kind || "")),
  );
}
function lessonCompleted(courseKey, unitNumber, topic) {
  const normal = normaliseCourse(courseKey);
  return completionRows()
    .map(completionParts)
    .filter(Boolean)
    .some(
      (row) =>
        row.course === normal &&
        String(row.unit) === String(unitNumber) &&
        String(row.topic) === String(topic),
    );
}
function unitCompleted(courseKey, unitNumber) {
  const lessons = readyLessons(courseKey, unitNumber);
  return (
    lessons.length > 0 &&
    lessons.every((lesson) =>
      lessonCompleted(courseKey, unitNumber, lesson.number),
    )
  );
}
function completedUnits(courseKey) {
  const count = courseDefinition(courseKey)?.units?.length || 0;
  return Array.from({ length: count }, (_, index) => index + 1).filter((unit) =>
    unitCompleted(courseKey, unit),
  );
}
function completedLessons(courseKey) {
  const course = courseDefinition(courseKey);
  if (!course) return [];
  return (course.units || []).flatMap((unit, unitIndex) =>
    (unit.lessons || [])
      .filter((lesson) => lesson?.url)
      .map((lesson) => ({
        unit: unitIndex + 1,
        topic: String(lesson.number),
        title: String(lesson.title || `Lesson ${lesson.number}`),
        completed: lessonCompleted(courseKey, unitIndex + 1, lesson.number),
      })),
  );
}
function catalogRows(group, courseKey) {
  const normal = normaliseCourse(courseKey);
  return (catalog?.bundles?.[group] || []).filter((row) => {
    const rowCourse = normaliseCourse(row.course_key || "");
    if (rowCourse) return rowCourse === normal;
    if (group === "topics") return normal === "ap-calculus";
    if (group === "precalc_topics") return normal === "ap-precalculus";
    if (group === "ib_topics") return normal === "ib-math-ai";
    return false;
  });
}
function courseAllRow(courseKey) {
  return catalogRows("course_all", courseKey)[0] || null;
}
function courseUnitRow(courseKey, unit) {
  return (
    catalogRows("course_units", courseKey).find(
      (row) => String(row.unit) === String(unit),
    ) || null
  );
}
function topicRow(courseKey, topic) {
  const course = normaliseCourse(courseKey);
  const groups =
    course === "ap-calculus"
      ? ["topics"]
      : course === "ap-precalculus"
        ? ["precalc_topics"]
        : course === "ib-math-ai"
          ? ["ib_topics"]
          : [];
  for (const group of groups) {
    const row = catalogRows(group, courseKey).find((item) =>
      [item.topic, item.lesson_key, item.id].some(
        (value) => String(value ?? "") === String(topic),
      ),
    );
    if (row) return row;
  }
  return null;
}
function inventoryRows(courseKey = UI.course.value, bankCode = UI.bank.value) {
  return privateInventory.filter(
    (row) =>
      normaliseCourse(row.course_key) === normaliseCourse(courseKey) &&
      (!bankCode ||
        bankCode === "all" ||
        String(row.bank_code) === String(bankCode)),
  );
}
function bankCodesForCourse(courseKey) {
  const codes = new Set(
    inventoryRows(courseKey, "all")
      .map((row) => String(row.bank_code || ""))
      .filter(Boolean),
  );
  [
    "course_all",
    "course_units",
    "topics",
    "precalc_topics",
    "ib_topics",
  ].forEach((group) =>
    catalogRows(group, courseKey).forEach((row) =>
      Object.keys(row.bank_counts || {}).forEach((code) => codes.add(code)),
    ),
  );
  return [...codes].sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true }),
  );
}
function bankCourse(bankCode) {
  const privateRow = privateInventory.find(
    (row) => String(row.bank_code) === String(bankCode),
  );
  if (privateRow) return normaliseCourse(privateRow.course_key);
  for (const courseKey of courseKeys()) {
    if (bankCodesForCourse(courseKey).includes(bankCode)) return courseKey;
  }
  return "";
}
function privateSource(
  courseKey,
  bankCode,
  { unit = "", lesson = "", title = "" } = {},
) {
  const rows = inventoryRows(courseKey, bankCode).filter(
    (row) =>
      (unit === "" || String(row.unit_number) === String(unit)) &&
      (!lesson || String(row.lesson_key) === String(lesson)),
  );
  if (!rows.length) return null;
  return {
    id: `private:${courseKey}:${bankCode}:${unit || "all"}:${lesson || "all"}`,
    label: title || bankOptionLabel(courseKey, bankCode),
    course_key: courseKey,
    bank_code: bankCode,
    unit,
    topic: lesson,
    lesson_key: lesson,
    lesson_title: title,
    private_bank_only: true,
    count: rows.reduce((sum, row) => sum + Number(row.question_count || 0), 0),
    bank_counts: {
      [bankCode]: rows.reduce(
        (sum, row) => sum + Number(row.question_count || 0),
        0,
      ),
    },
  };
}
function sourceHasBank(source, bankCode) {
  return Boolean(
    source && bankCode && Number(source.bank_counts?.[bankCode] || 0) > 0,
  );
}
function courseKeys() {
  const keys = new Set(
    privateInventory.map((row) => normaliseCourse(row.course_key)),
  );
  ["course_all", "course_units"].forEach((group) =>
    (catalog?.bundles?.[group] || []).forEach((row) => {
      if (row.course_key) keys.add(normaliseCourse(row.course_key));
    }),
  );
  const allowed = new Set(
    Array.from(access?.courseKeys || []).map(normaliseCourse),
  );
  return [...keys].filter((key) => key && (!student() || allowed.has(key)));
}
function courseLabel(key) {
  return ECHSBank.cleanStudentLabel(
    ECHSBank.courseLabel(catalog, key) ||
      ECHSLearning.COURSE_LABELS?.[key] ||
      key,
  );
}
function bankOptionLabel(courseKey, bankCode) {
  const row = inventoryRows(courseKey, bankCode)[0] || {};
  const name = ECHSBank.cleanStudentLabel(
    String(row.bank_display_name || "").trim(),
  );
  return name && name !== bankCode
    ? `${name} · ${bankCode}`
    : `${courseLabel(courseKey)} · ${bankCode}`;
}
function populateCourses() {
  const keys = courseKeys(),
    requested = normaliseCourse(
      params.get("course") || bankCourse(params.get("bank") || "") || "",
    ),
    chosen = keys.includes(requested) ? requested : keys[0] || "";
  UI.course.innerHTML = keys
    .map(
      (key) =>
        `<option value="${ECHSBank.escape(key)}">${ECHSBank.escape(courseLabel(key))}</option>`,
    )
    .join("");
  if (chosen) UI.course.value = chosen;
}
function populateBanks(preferred = "") {
  const codes = bankCodesForCourse(UI.course.value),
    wanted = preferred || params.get("bank") || UI.bank.value;
  UI.bank.innerHTML = codes.length
    ? codes
        .map(
          (code) =>
            `<option value="${ECHSBank.escape(code)}" data-private-bank="${inventoryRows(UI.course.value, code).length ? "true" : "false"}">${ECHSBank.escape(bankOptionLabel(UI.course.value, code))}</option>`,
        )
        .join("")
    : '<option value="">No verified bank uploaded for this course</option>';
  UI.bank.value = codes.includes(wanted) ? wanted : codes[0] || "";
  UI.bank.disabled = !codes.length;
}
async function loadPrivateInventory() {
  try {
    const result = await ECHSInstitution.api("practice-bank-api", "/inventory");
    privateInventory = Array.isArray(result?.rows)
      ? result.rows.filter((row) => row?.course_key && row?.bank_code)
      : [];
  } catch (error) {
    privateInventory = [];
    console.warn(
      "Private practice inventory is unavailable; using the calculus catalog only.",
      error,
    );
  }
}
function scopeOptions(courseKey) {
  const options = [];
  if (staff()) options.push({ value: "course", label: "Full course" });
  options.push({ value: "lesson", label: "Specific lesson" });
  if (
    staff() ||
    inventoryRows(courseKey, "all").length ||
    completedUnits(courseKey).length
  )
    options.push({ value: "unit", label: "Specific unit" });
  return options;
}
function populateScopes(preferred) {
  const options = scopeOptions(UI.course.value);
  let chosen =
    preferred ||
    params.get("scope") ||
    (requestedTopic
      ? "lesson"
      : requestedUnit
        ? "unit"
        : staff()
          ? "course"
          : "lesson");
  if (!options.some((option) => option.value === chosen))
    chosen = options[0]?.value || "lesson";
  UI.scope.innerHTML = options
    .map(
      (option) =>
        `<option value="${option.value}">${ECHSBank.escape(option.label)}</option>`,
    )
    .join("");
  UI.scope.value = chosen;
  updateScopeDescription();
}
function updateScopeDescription() {
  const [title, text] = scopeCopy[UI.scope.value] || scopeCopy.lesson;
  if (UI.scopeDescription)
    UI.scopeDescription.innerHTML = `<strong>${ECHSBank.escape(title)}</strong><span>${ECHSBank.escape(text)}</span>`;
}
function sourceForLesson(courseKey, unit, topic) {
  const bankCode = UI.bank.value,
    privateExact = privateSource(courseKey, bankCode, { unit, lesson: topic });
  if (privateExact) return privateExact;
  const source = topicRow(courseKey, topic);
  return sourceHasBank(source, bankCode)
    ? { ...source, course_key: courseKey, unit, topic }
    : null;
}
function buildTargets() {
  const courseKey = UI.course.value,
    bankCode = UI.bank.value,
    scope = UI.scope.value,
    out = [],
    privateRows = inventoryRows(courseKey, bankCode);
  if (scope === "course" && staff()) {
    const privateCourse = privateSource(courseKey, bankCode),
      staticCourse = courseAllRow(courseKey);
    const source =
      privateCourse ||
      (sourceHasBank(staticCourse, bankCode) ? staticCourse : null);
    if (source)
      out.push({
        id: `course:${courseKey}`,
        label: `${courseLabel(courseKey)} · Full course`,
        course: courseKey,
        scope: "course",
        unit: "",
        topic: "",
        source,
        locked: false,
      });
  }
  // Strict practice contract marker: scope==="unit"
  if (scope === "unit") {
    const units = privateRows.length
      ? [
          ...new Set(
            privateRows
              .map((row) => Number(row.unit_number))
              .filter((unit) => unit > 0),
          ),
        ].sort((a, b) => a - b)
      : catalogRows("course_units", courseKey)
          .filter((row) => sourceHasBank(row, bankCode))
          .map((row) => Number(row.unit))
          .filter((unit) => unit > 0)
          .sort((a, b) => a - b);
    for (const unit of units) {
      const privateUnit = privateSource(courseKey, bankCode, { unit }),
        staticUnit = courseUnitRow(courseKey, unit);
      const source =
        privateUnit ||
        (sourceHasBank(staticUnit, bankCode) ? staticUnit : null);
      if (!source) continue;
      const complete = unitCompleted(courseKey, unit),
        direct = String(requestedUnit || "") === String(unit);
      const mappedDirectly = privateRows.some(
        (row) => String(row.unit_number) === String(unit),
      );
      if (student() && !complete && !direct && !mappedDirectly) continue;
      const title =
        unitDefinition(courseKey, unit)?.title?.replace(
          /^Unit\s+\d+\s*:\s*/i,
          "",
        ) || `Unit ${unit}`;
      out.push({
        id: `unit:${courseKey}:${unit}`,
        label: `Unit ${unit} · ${title}`,
        course: courseKey,
        scope: "unit",
        unit,
        topic: "",
        source: { ...source, course_key: courseKey, unit },
        locked: student() && !complete && !mappedDirectly,
      });
    }
  }
  if (scope === "lesson") {
    const lessons = privateRows.length
      ? [
          ...new Map(
            privateRows
              .filter((row) => row.lesson_key)
              .map((row) => [
                `${row.unit_number}:${row.lesson_key}`,
                {
                  unit: Number(row.unit_number),
                  topic: String(row.lesson_key),
                  title: String(row.lesson_title || row.lesson_key),
                  completed: lessonCompleted(
                    courseKey,
                    Number(row.unit_number),
                    String(row.lesson_key),
                  ),
                  mappedDirectly: true,
                },
              ]),
          ).values(),
        ]
      : completedLessons(courseKey);
    for (const lesson of lessons) {
      const direct =
        String(requestedTopic || "") === String(lesson.topic) &&
        String(requestedUnit || lesson.unit) === String(lesson.unit);
      if (student() && !lesson.completed && !direct && !lesson.mappedDirectly)
        continue;
      const source = sourceForLesson(courseKey, lesson.unit, lesson.topic);
      if (!source) continue;
      out.push({
        id: `lesson:${courseKey}:${lesson.unit}:${lesson.topic}`,
        label: `${lesson.topic} · ${lesson.title}`,
        course: courseKey,
        scope: "lesson",
        unit: lesson.unit,
        topic: lesson.topic,
        source,
        locked: student() && !lesson.completed && !lesson.mappedDirectly,
      });
    }
    if (
      requestedTopic &&
      !out.some((target) => String(target.topic) === String(requestedTopic))
    ) {
      const unit = Number(requestedUnit || 1),
        selected = ECHSBank.selectedBundleFromParams(catalog)?.row;
      const source =
        sourceForLesson(courseKey, unit, requestedTopic) ||
        (selected &&
        normaliseCourse(selected.course_key || courseKey) ===
          normaliseCourse(courseKey)
          ? { ...selected, course_key: courseKey, unit, topic: requestedTopic }
          : null);
      if (source)
        out.unshift({
          id: `lesson:${courseKey}:${unit}:${requestedTopic}`,
          label: params.get("title") || `Lesson ${requestedTopic}`,
          course: courseKey,
          scope: "lesson",
          unit,
          topic: String(requestedTopic),
          source,
          locked:
            student() &&
            !(fromLesson
              ? ECHSPortalAccess.lessonCompleted(fromLesson)
              : lessonCompleted(courseKey, unit, requestedTopic)),
        });
    }
  }
  targets = out;
  return out;
}
function populateTargets(preferredId) {
  const rows = buildTargets();
  let chosen =
    preferredId || params.get("target") || params.get("bundle") || "";
  if (requestedTopic) {
    const direct = rows.find(
      (row) =>
        String(row.topic) === String(requestedTopic) &&
        String(row.unit) === String(requestedUnit || row.unit),
    );
    if (direct) chosen = direct.id;
  } else if (requestedUnit && UI.scope.value === "unit") {
    const direct = rows.find(
      (row) => String(row.unit) === String(requestedUnit),
    );
    if (direct) chosen = direct.id;
  }
  if (!rows.some((row) => row.id === chosen)) chosen = rows[0]?.id || "";
  UI.bundle.innerHTML = rows.length
    ? rows
        .map(
          (row) =>
            `<option value="${ECHSBank.escape(row.id)}">${ECHSBank.escape(row.label)}${row.locked ? " · Locked" : ""}</option>`,
        )
        .join("")
    : '<option value="">No unlocked targets yet</option>';
  UI.bundle.value = chosen;
  updateBuilderContext();
}
function currentTarget() {
  return targets.find((target) => target.id === UI.bundle.value) || null;
}
function currentCourse() {
  return UI.course.value || currentTarget()?.course || "";
}
function selectedBankLabel() {
  if (student() && isMultiRouteAssignment()) return "Teacher-selected banks";
  return (
    UI.bank.selectedOptions?.[0]?.textContent?.trim() || "No bank selected"
  );
}
function questionBankLabel(question) {
  if (!isMultiRouteAssignment()) return selectedBankLabel();
  const banks = [...new Set(assignmentRoutes().map((route) => route.bank))],
    index = Math.max(0, banks.indexOf(String(question?.bank_code || "")));
  return student()
    ? `Assigned bank ${index + 1}`
    : bankOptionLabel(currentCourse(), banks[index] || question?.bank_code || "");
}
function currentScopeLabel() {
  if (isMultiRouteAssignment()) {
    const routes = assignmentRoutes();
    return `${new Set(routes.map((route) => `${route.unit}::${route.topic}`)).size} selected lessons`;
  }
  const target = currentTarget();
  return target?.scope === "course"
    ? "Full course"
    : target?.scope === "unit"
      ? `Unit ${target.unit}`
      : target?.topic
        ? `Lesson ${target.topic}`
        : "Practice";
}
function updateBuilderContext() {
  const el = document.getElementById("builderCourseTag"),
    route = document.getElementById("practiceRouteSummary"),
    target = currentTarget();
  if (!el) return;
  const role = student() ? "Student pathway" : "Staff course access";
  el.textContent = target
    ? `${courseLabel(target.course)} · ${currentScopeLabel()} · ${role}`
    : `${courseLabel(currentCourse())} · No unlocked target`;
  if (route)
    route.innerHTML = `<span>${ECHSBank.escape(courseLabel(currentCourse()))}</span><b>→</b><span>${ECHSBank.escape(selectedBankLabel())}</span><b>→</b><span>${ECHSBank.escape(target?.label || "Choose a unit or lesson")}</span>`;
}
function prepareSource(target) {
  if (!target) return null;
  const source = {
    ...target.source,
    id: target.id,
    course_key: target.course,
    // Strict single-bank contract marker: bank_code:UI.bank.value
    bank_code: UI.bank.value,
    questionFilter: {
      ...(target.source?.questionFilter || {}),
      bank_code: UI.bank.value,
    },
  };
  if (target.unit !== "") source.unit = target.unit;
  if (target.topic) source.topic = target.topic;
  if (staff() && UI.visibility?.value === "all") source.staff_view_all = true;
  return source;
}
function targetLocked() {
  return Boolean(student() && !assignmentId && currentTarget()?.locked);
}
function setBusy(value) {
  loading = value;
  const assignmentLocked = Boolean(assignmentId && assignmentConfig);
  UI.start.disabled = value || targetLocked() || !currentTarget();
  UI.course.disabled = value || assignmentLocked;
  UI.bank.disabled =
    value || assignmentLocked || !bankCodesForCourse(UI.course.value).length;
  UI.scope.disabled = value || assignmentLocked;
  UI.bundle.disabled = value || assignmentLocked;
  if (UI.visibility) UI.visibility.disabled = value;
  UI.start.textContent = value
    ? "Loading exact route…"
    : "Start focused session";
}
window.addEventListener("echs:bundle-progress", (event) => {
  if (!loading) return;
  const { completed, total } = event.detail || {};
  if (total > 1)
    UI.status.innerHTML = `<span class="pill">Loading mapped practice ${completed} of ${total}…</span>`;
});
function strictScopeInPlace(rows, target = currentTarget()) {
  if (!Array.isArray(rows) || !target) return rows;
  const seen = new Set(),
    accepted = [];
  for (const question of rows) {
    if (!question?.id) continue;
    if (
      !ECHSBank.mappingCompatible(question, {
        course: target.course,
        unit: target.scope === "course" ? "" : target.unit,
        topic: target.scope === "lesson" ? target.topic : "",
      })
    )
      continue;
    if (student() && question._staff_only) continue;
    if (UI.bank.value && String(question.bank_code) !== String(UI.bank.value))
      continue;
    const fingerprint =
      question.source?.source_content_fingerprint ||
      question.metadata?.source_content_fingerprint ||
      question.id;
    const key = `${target.course}|${fingerprint}`;
    if (seen.has(key)) continue;
    seen.add(key);
    accepted.push(question);
  }
  rows.splice(0, rows.length, ...accepted);
  return rows;
}
function updateInventory({ statusText = "" } = {}) {
  UI.heroLoaded.textContent = loaded.length.toLocaleString();
  const banks = [
    ...new Set(loaded.map((question) => question.bank_code).filter(Boolean)),
  ].sort();
  UI.heroBanks.textContent = (
    UI.bank.value ? Math.max(1, banks.length) : 0
  ).toLocaleString();
  const sections = new Map();
  loaded.forEach((question) => {
    const value = String(question.source?.section || "unmapped"),
      title =
        question.source?.section_title || question.source?.skill_title || "";
    sections.set(
      value,
      value === "unmapped"
        ? "General practice"
        : `${value}${title ? ` · ${title}` : ""}`,
    );
  });
  UI.section.innerHTML =
    '<option value="all">All sections</option>' +
    [...sections]
      .sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true }))
      .map(
        ([value, label]) =>
          `<option value="${ECHSBank.escape(value)}">${ECHSBank.escape(ECHSBank.cleanStudentLabel(label))}</option>`,
      )
      .join("");
  if (statusText) UI.status.innerHTML = statusText;
  else
    UI.status.innerHTML = `<span class="pill teal">${loaded.length.toLocaleString()} questions available</span><span class="pill wine">${ECHSBank.escape(currentTarget()?.label || courseLabel(currentCourse()))}</span>${staff() && UI.visibility?.value === "all" ? '<span class="pill gold">Staff view · includes withheld rows</span>' : ""}`;
}
function renderScopeReadyState() {
  const target = currentTarget(),
    count = loaded.length;
  if (!target) return;
  UI.shell.innerHTML = count
    ? `<div class="scopeReady"><div class="scopeReadyIcon">✓</div><div><span>Exact route ready</span><h2>${ECHSBank.escape(target.label)}</h2><p><strong>${count.toLocaleString()}</strong> mapped questions are available from ${ECHSBank.escape(selectedBankLabel())}.</p></div><button class="button wine" type="button" data-start-scope>Start practice</button></div>`
    : `<div class="scopeReady scopeEmpty"><div class="scopeReadyIcon">0</div><div><span>Mapping check required</span><h2>No questions in this exact lesson</h2><p>The selected bank has no rows indexed to ${ECHSBank.escape(target.label)}. Choose another bank or repair this bank's lesson index.</p></div></div>`;
  UI.shell
    .querySelector("[data-start-scope]")
    ?.addEventListener("click", () =>
      start().catch(
        (error) =>
          (UI.shell.innerHTML = `<div class="notice">${ECHSBank.escape(error.message)}</div>`),
      ),
    );
}
async function loadCurrent() {
  const target = currentTarget();
  if (!target) {
    loaded = [];
    updateInventory({
      statusText:
        '<span class="pill gold">Complete a lesson to unlock practice</span>',
    });
    pathwayBanner();
    return;
  }
  setBusy(true);
  UI.status.innerHTML =
    '<span class="pill">Loading exact mapped practice…</span>';
  document.documentElement.dataset.practiceCourse = target.course;
  document.documentElement.dataset.practiceScope = target.scope;
  const source = prepareSource(target);
  currentSourceKey = String(source.id);
  try {
    loaded = await ECHSBank.loadBundle(source);
    strictScopeInPlace(loaded, target);
    updateInventory();
    renderScopeReadyState();
  } catch (error) {
    UI.status.innerHTML = '<span class="pill red">Practice unavailable</span>';
    UI.shell.innerHTML = `<div class="notice"><strong>Could not load this mapped practice set.</strong><br>${ECHSBank.escape(error.message)}</div>`;
    throw error;
  } finally {
    setBusy(false);
    pathwayBanner();
  }
}
function sourceForAssignmentRoute(route, index) {
  const courseKey = normaliseCourse(assignmentConfig?.course || currentCourse()),
    privateExact = privateSource(courseKey, route.bank, {
      unit: route.scope === "course" ? "" : route.unit,
      lesson: route.scope === "lesson" ? route.topic : "",
      title: route.label,
    });
  let source = privateExact;
  if (!source && route.scope === "lesson") {
    const row = topicRow(courseKey, route.topic);
    if (sourceHasBank(row, route.bank)) source = row;
  }
  if (!source && route.scope === "unit") {
    const row = courseUnitRow(courseKey, route.unit);
    if (sourceHasBank(row, route.bank)) source = row;
  }
  if (!source && route.scope === "course") {
    const row = courseAllRow(courseKey);
    if (sourceHasBank(row, route.bank)) source = row;
  }
  if (!source) return null;
  return {
    ...source,
    id: `assignment:${assignmentId}:${index}:${route.bank}:${route.unit || "all"}:${route.topic || "all"}`,
    course_key: courseKey,
    bank_code: route.bank,
    unit: route.scope === "course" ? "" : route.unit,
    topic: route.scope === "lesson" ? route.topic : "",
    questionFilter: {
      ...(source.questionFilter || {}),
      bank_code: route.bank,
    },
    ...(staff() && UI.visibility?.value === "all" ? { staff_view_all: true } : {}),
  };
}
function questionMatchesAssignmentRoutes(question, routes) {
  return routes.some(
    (route) =>
      String(question.bank_code || "") === String(route.bank) &&
      ECHSBank.mappingCompatible(question, {
        course: normaliseCourse(assignmentConfig?.course || currentCourse()),
        unit: route.scope === "course" ? "" : route.unit,
        topic: route.scope === "lesson" ? route.topic : "",
      }),
  );
}
function renderAssignmentReadyState() {
  const routes = assignmentRoutes(),
    bankCount = new Set(routes.map((route) => route.bank)).size,
    targetCount = new Set(routes.map((route) => `${route.unit}::${route.topic}`)).size;
  UI.shell.innerHTML = loaded.length
    ? `<div class="scopeReady"><div class="scopeReadyIcon">✓</div><div><span>Assignment route ready</span><h2>${ECHSBank.escape(assignmentTitle || "Targeted practice")}</h2><p><strong>${loaded.length.toLocaleString()}</strong> mapped questions are ready across ${bankCount} bank${bankCount === 1 ? "" : "s"} and ${targetCount} lesson${targetCount === 1 ? "" : "s"}.</p></div><button class="button wine" type="button" data-start-scope>Start assignment</button></div>`
    : '<div class="scopeReady scopeEmpty"><div class="scopeReadyIcon">0</div><div><span>Assignment mapping check required</span><h2>No questions are available</h2><p>Ask your teacher or administrator to review the selected bank and lesson mappings.</p></div></div>';
  UI.shell
    .querySelector("[data-start-scope]")
    ?.addEventListener("click", () =>
      start().catch(
        (error) =>
          (UI.shell.innerHTML = `<div class="notice">${ECHSBank.escape(error.message)}</div>`),
      ),
    );
}
async function loadAssignmentRouteSet() {
  const routes = assignmentRoutes(),
    sources = routes
      .map((route, index) => sourceForAssignmentRoute(route, index))
      .filter(Boolean);
  if (!sources.length) return loadCurrent();
  setBusy(true);
  document.documentElement.dataset.assignmentMultiBank =
    new Set(routes.map((route) => route.bank)).size > 1 ? "true" : "false";
  UI.status.innerHTML =
    '<span class="pill">Loading the complete assignment route…</span>';
  try {
    const rows = (await Promise.all(sources.map((source) => ECHSBank.loadBundle(source)))).flat(),
      unique = new Map();
    rows
      .filter((question) => questionMatchesAssignmentRoutes(question, routes))
      .filter((question) => !student() || !question._staff_only)
      .forEach((question) => {
        const key = `${question.bank_code || ""}::${question.id || ""}`;
        if (question.id && !unique.has(key)) unique.set(key, question);
      });
    loaded = [...unique.values()];
    updateInventory({
      statusText: `<span class="pill teal">${loaded.length.toLocaleString()} assignment questions</span><span class="pill wine">${routes.length} mapped routes</span>`,
    });
    renderAssignmentReadyState();
  } finally {
    setBusy(false);
    pathwayBanner();
  }
}
window.addEventListener("echs:private-bank-summary", (event) => {
  const detail = event.detail || {};
  if (
    detail.requestKey &&
    String(detail.requestKey) !== String(currentSourceKey)
  )
    return;
  if (normaliseCourse(detail.course || "") !== normaliseCourse(currentCourse()))
    return;
  if (!Array.isArray(detail.questions)) return;
  loaded = detail.questions;
  strictScopeInPlace(loaded, currentTarget());
  updateInventory({
    statusText: detail.complete
      ? `<span class="pill teal">${loaded.length.toLocaleString()} mapped questions available</span><span class="pill wine">${ECHSBank.escape(currentTarget()?.label || "Practice")}</span>`
      : `<span class="pill teal">${loaded.length.toLocaleString()} questions ready</span><span class="pill">Loading remaining mapped questions…</span>`,
  });
});
function assignmentRoutes() {
  if (!assignmentConfig) return [];
  if (Array.isArray(assignmentConfig.routes) && assignmentConfig.routes.length)
    return assignmentConfig.routes
      .map((route) => ({
        bank: String(route?.bank || ""),
        scope: String(route?.scope || assignmentConfig.scope || "lesson"),
        unit: String(route?.unit || ""),
        topic: String(route?.topic || ""),
        label: String(route?.label || route?.topic || route?.unit || "Assigned route"),
      }))
      .filter((route) => route.bank);
  const banks = Array.isArray(assignmentConfig.banks)
      ? assignmentConfig.banks.map(String).filter(Boolean)
      : [assignmentConfig.bank].map(String).filter(Boolean),
    targets = Array.isArray(assignmentConfig.targets) && assignmentConfig.targets.length
      ? assignmentConfig.targets
      : [{ unit: assignmentConfig.unit || "", topic: assignmentConfig.topic || "" }];
  return banks.flatMap((bank) =>
    targets.map((target) => ({
      bank,
      scope: String(assignmentConfig.scope || (target.topic ? "lesson" : target.unit ? "unit" : "course")),
      unit: String(target.unit || ""),
      topic: String(target.topic || ""),
      label: String(target.label || target.topic || target.unit || "Assigned route"),
    })),
  );
}
function isMultiRouteAssignment() {
  const routes = assignmentRoutes();
  return Boolean(
    assignmentId &&
      (new Set(routes.map((route) => route.bank)).size > 1 ||
        new Set(routes.map((route) => `${route.unit}::${route.topic}`)).size > 1),
  );
}
function filters() {
  const target = currentTarget();
  const multiRoute = isMultiRouteAssignment();
  return {
    course: target?.course || currentCourse(),
    unit: multiRoute || target?.scope === "course" ? "" : (target?.unit ?? ""),
    topic: multiRoute ? null : target?.scope === "lesson" ? target?.topic || "" : null,
    bank: multiRoute ? "all" : UI.bank.value,
    type: UI.type.value,
    difficulty: UI.mode.value === "adaptive" ? "all" : UI.difficulty.value,
    section: student() ? "all" : UI.section.value,
  };
}
function eligibleRows() {
  if (targetLocked()) return [];
  let rows = ECHSBank.filterQuestions(loaded, filters()),
    mode = UI.mode.value;
  if (mode === "review") {
    const ids = new Set(
      ECHSLearning.dueReviews({
        course: currentCourse(),
        unit:
          currentTarget()?.scope === "course" ? null : currentTarget()?.unit,
      }).map((row) => String(row.questionId)),
    );
    rows = rows.filter((question) => ids.has(String(question.id)));
  }
  if (mode === "mistakes") {
    const ids = new Set(
      ECHSLearning.mistakes({
        course: currentCourse(),
        unit:
          currentTarget()?.scope === "course" ? null : currentTarget()?.unit,
      }).map((row) => String(row.questionId)),
    );
    rows = rows.filter((question) => ids.has(String(question.id)));
  }
  const assignedIds = new Set(
    Array.isArray(assignmentConfig?.question_ids)
      ? assignmentConfig.question_ids.map(String)
      : [],
  );
  if (assignedIds.size)
    rows = rows.filter((question) => assignedIds.has(String(question.id)));
  return rows;
}
function pathwayBanner() {
  const target = document.getElementById("pathwayBanner"),
    selected = currentTarget();
  if (!selected) {
    target.innerHTML =
      '<div class="lockedPractice"><h2>No practice is unlocked yet</h2><p>Complete a lesson, then return here to practise its mapped questions.</p><a class="button wine" href="../index.html#courses">Return to learning path</a></div>';
    return;
  }
  if (targetLocked()) {
    const message =
      selected.scope === "unit"
        ? "Complete every available lesson in this unit to unlock full-unit practice."
        : "Complete this lesson before opening its practice.";
    target.innerHTML = `<div class="lockedPractice"><h2>${selected.scope === "unit" ? "Unit practice is still locked" : "Lesson practice is still locked"}</h2><p>${message}</p><a class="button wine" href="../index.html#courses">Return to learning path</a></div>`;
    UI.start.disabled = true;
    return;
  }
  const roleText = student()
    ? "Unlocked from your completed learning pathway"
    : "Full staff visibility across mapped course content";
  target.innerHTML = `<div class="pathwayBanner"><strong>${ECHSBank.escape(selected.label)}</strong><br>${ECHSBank.escape(roleText)}</div>`;
}
function assignmentBanner() {
  const target = document.getElementById("assignmentBanner");
  const exactCount = assignmentConfig?.question_ids?.length || 0,
    routes = assignmentRoutes(),
    banks = new Set(routes.map((route) => route.bank)).size,
    lessons = new Set(routes.map((route) => `${route.unit}::${route.topic}`)).size,
    routeText = routes.length
      ? ` · ${banks} assigned bank${banks === 1 ? "" : "s"} · ${lessons} lesson${lessons === 1 ? "" : "s"}`
      : "";
  target.innerHTML = assignmentId
    ? `<div class="notice assignmentPracticeBanner"><strong>Teacher assignment:</strong> ${ECHSBank.escape(assignmentTitle || assignmentId)}${routeText}${exactCount ? ` · ${exactCount} teacher-selected questions` : ""}. Results will synchronise with your learning record.</div>`
    : "";
}
function resumeBanner() {
  const target = document.getElementById("resumeBanner"),
    saved = ECHSLearning.getContinue();
  if (!saved || saved.type !== "practice") {
    target.innerHTML = "";
    return;
  }
  target.innerHTML = `<div class="resumeBanner"><div><strong>${ECHSBank.escape(saved.label || "Incomplete practice session")}</strong><p>Question ${(saved.index || 0) + 1} of ${saved.targetCount || saved.questionIds?.length || "—"} · updated ${new Date(saved.updatedAt).toLocaleString()}</p></div><div><a class="button wine" href="${ECHSBank.escape(saved.url || "practice.html?resume=1")}">Resume</a> <button class="button ghost" id="discardResume">Discard</button></div></div>`;
  document.getElementById("discardResume").onclick = () => {
    ECHSLearning.clearContinue();
    target.innerHTML = "";
  };
}
function hydrateAssets(root) {
  if (window.ECHSBlackboardAssets)
    ECHSBlackboardAssets.hydrate(root).catch((error) => console.warn(error));
}
function scrollQuestionIntoView() {
  UI.shell.scrollIntoView({
    behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "auto"
      : "smooth",
    block: "start",
  });
}
function sessionURL() {
  const target = currentTarget(),
    query = new URLSearchParams({
      resume: "1",
      course: currentCourse(),
      scope: target?.scope || "lesson",
      target: target?.id || "",
      mode: UI.mode.value,
    });
  if (UI.bank.value) query.set("bank", UI.bank.value);
  if (target?.unit !== "") query.set("unit", String(target.unit));
  if (target?.topic) query.set("topic", String(target.topic));
  if (staff() && UI.visibility?.value === "all") query.set("visibility", "all");
  if (assignmentId) query.set("assignment", assignmentId);
  return new URL(`practice.html?${query}`, location.href).href;
}
function persistContinue() {
  if (!session) return;
  const target = currentTarget();
  ECHSLearning.patchSession(session.id, {
    questionIds: set.map((question) => question.id),
    answered: state.graded,
    correct: state.correct,
    index: state.index,
  });
  ECHSLearning.setContinue({
    type: "practice",
    label: `${modeCopy[UI.mode.value]?.[0] || "Practice"} · ${target?.label || courseLabel(currentCourse())}`,
    url: sessionURL(),
    targetId: target?.id,
    course: currentCourse(),
    scope: target?.scope,
    mode: UI.mode.value,
    questionIds: set.map((question) => question.id),
    index: state.index,
    targetCount,
    correct: state.correct,
    graded: state.graded,
    answeredIds: [...state.answered],
    sessionId: session.id,
    assignmentId,
  });
}
function render() {
  const question = set[state.index];
  if (!question) {
    UI.shell.innerHTML =
      '<div class="empty"><div class="emptyState"><div class="emptyStateIcon">!</div><h2>No matching questions</h2><p>Change the question type or ask your teacher to review the lesson mapping.</p></div></div>';
    return;
  }
  state.response = null;
  state.checked = false;
  questionStartedAt = Date.now();
  const choices = ECHSBank.choiceOrder(question),
    classification = question.classification || {},
    source = question.source || {},
    auto = ECHSBank.isAutoGradable(question);
  const responseHTML = ["mcq", "true_false"].includes(question.type)
    ? `<div class="choices" role="group" aria-label="Answer choices">${choices.map((choice, index) => `<button class="choice" type="button" aria-pressed="false" data-id="${ECHSBank.escape(choice.id)}"><span class="choiceLabel">${String.fromCharCode(65 + index)}</span><span>${choice.html}</span></button>`).join("")}</div>`
    : question.type === "fill_blank"
      ? '<div class="control answerControl"><label for="answerInput">Your answer</label><input id="answerInput" autocomplete="off"></div>'
      : '<div class="control answerControl"><label for="answerInput">Your response</label><textarea id="answerInput" rows="7"></textarea></div>';
  const topic = ECHSBank.questionTopic(question),
    topicTitle =
      classification.primary_topic_title ||
      classification.topic_title ||
      classification.ib_lesson_title ||
      classification.ap_topic_title ||
      source.skill_title ||
      source.section_title ||
      question.pool_title ||
      "Practice question";
  const bankPill = `<span class="pill teal">${ECHSBank.escape(questionBankLabel(question))}</span>`;
  UI.shell.innerHTML = `<article class="questionCard ${question._staff_only ? "staffReviewQuestion" : ""}">
<header class="questionHeader"><div><span class="questionEyebrow">${ECHSBank.escape(courseLabel(currentCourse()))} · ${ECHSBank.escape(currentScopeLabel())}</span><h2>${ECHSBank.escape(ECHSBank.cleanStudentLabel(topicTitle))}</h2></div><div class="questionCounter"><b>${state.index + 1}</b><span>of ${targetCount}</span></div></header>
<div class="progressTrack" aria-label="Session progress"><i style="width:${((state.index + 1) / Math.max(1, targetCount)) * 100}%"></i></div>
<div class="pillRow questionMeta">${bankPill}<span class="pill gold">${ECHSBank.escape(modeCopy[UI.mode.value]?.[0] || "Practice")}</span>${topic ? `<span class="pill">Skill ${ECHSBank.escape(topic)}</span>` : ""}<span class="pill">${ECHSBank.escape(ECHSBank.labelType(question.type))}</span>${question._staff_only ? '<span class="pill red">Staff QA only</span>' : ""}</div>
<div class="questionBody"><div class="prompt">${question.prompt_html}</div>${responseHTML}</div>
<div id="feedback" class="feedback" aria-live="polite"></div>
<div class="keyboardHint" aria-hidden="true"><span><kbd>A–D</kbd> choose</span><span><kbd>Enter</kbd> check / continue</span><span><kbd>←</kbd><kbd>→</kbd> navigate</span></div>
<div class="questionFooter"><button class="button primary" id="check">${auto ? "Check answer" : "Reveal feedback"}</button><div><button class="button ghost" id="prev" ${state.index === 0 ? "disabled" : ""}>Back</button> <button class="button wine" id="next">${state.index === targetCount - 1 ? "Finish" : "Next"}</button></div></div>
</article>`;
  hydrateAssets(UI.shell);
  if (["mcq", "true_false"].includes(question.type))
    document.querySelectorAll(".choice").forEach(
      (button) =>
        (button.onclick = () => {
          if (state.checked) return;
          document
            .querySelectorAll(".choice")
            .forEach((item) => {item.classList.remove("selected");item.setAttribute("aria-pressed","false")});
          button.classList.add("selected");
          button.setAttribute("aria-pressed","true");
          state.response = button.dataset.id;
        }),
    );
  document.getElementById("check").onclick = () => check(question);
  document.getElementById("prev").onclick = () => {
    if (state.index > 0) {
      state.index--;
      render();
      scrollQuestionIntoView();
      persistContinue();
    }
  };
  document.getElementById("next").onclick = nextQuestion;
  persistContinue();
}
function check(question) {
  if (state.checked) return;
  if (!["mcq", "true_false"].includes(question.type))
    state.response = document.getElementById("answerInput")?.value || "";
  if (!String(state.response ?? "").trim()) {
    const feedback = document.getElementById("feedback");
    feedback.className = "feedback show";
    feedback.textContent = ["mcq", "true_false"].includes(question.type)
      ? "Choose an answer before checking."
      : "Write your response before checking.";
    (document.getElementById("answerInput") || document.querySelector(".choice"))?.focus();
    return;
  }
  const auto = ECHSBank.isAutoGradable(question),
    correct = auto ? ECHSBank.answerIsCorrect(question, state.response) : null;
  state.checked = true;
  lastResult = correct;
  if (auto && !state.answered.has(question.id)) {
    state.graded++;
    if (correct) state.correct++;
    state.answered.add(question.id);
    const target = currentTarget();
    ECHSBank.saveAttempt(question, correct, state.response, {
      mode: UI.mode.value,
      sessionId: session?.id,
      assignmentId,
      durationMs: Date.now() - questionStartedAt,
      course: currentCourse(),
      unit: isMultiRouteAssignment()
        ? ECHSBank.questionUnit(question)
        : target?.unit,
      topic: isMultiRouteAssignment()
        ? ECHSBank.questionTopic(question)
        : target?.topic,
    });
  }
  if (["mcq", "true_false"].includes(question.type))
    document.querySelectorAll(".choice").forEach((button) => {
      if ((question.correct_choice_ids || []).includes(button.dataset.id))
        button.classList.add("correct");
      else if (button.dataset.id === state.response)
        button.classList.add("incorrect");
      button.disabled = true;
    });
  const feedback = document.getElementById("feedback");
  feedback.className = `feedback show ${correct === false ? "incorrect" : "correct"}`;
  const accepted = (question.accepted_answers || []).join(" / "),
    adaptiveNote =
      UI.mode.value === "adaptive" && auto
        ? `<p><b>Next step:</b> ${correct ? "difficulty may increase while staying in this scope" : "the next question will reinforce this exact lesson or unit"}.</p>`
        : "";
  feedback.innerHTML = `<strong>${auto ? (correct ? "Correct." : "Not correct. This question was added to your review queue.") : "Compare your response with the available feedback."}</strong>${adaptiveNote}${accepted ? `<p><b>Accepted answer:</b> ${ECHSBank.escape(accepted)}</p>` : ""}${question.solution_html ? `<div class="solution">${question.solution_html}</div>` : '<div class="solution">A detailed worked solution is not yet available for this item.</div>'}`;
  hydrateAssets(feedback);
  persistContinue();
}
function nextQuestion() {
  if (state.index < set.length - 1) {
    state.index++;
    render();
    scrollQuestionIntoView();
    return;
  }
  if (UI.mode.value === "adaptive" && set.length < targetCount) {
    const candidates = ECHSLearning.selectAdaptive(eligibleRows(), 1, {
      excludedIds: set.map((question) => question.id),
      lastCorrect: lastResult,
    });
    if (candidates.length) {
      set.push(candidates[0]);
      state.index++;
      render();
      scrollQuestionIntoView();
      return;
    }
  }
  finish();
}
function finish() {
  const percentage = state.graded
      ? Math.round((state.correct / state.graded) * 100)
      : null,
    target = currentTarget();
  if (session)
    ECHSLearning.endSession(session.id, {
      questionIds: set.map((question) => question.id),
      answered: state.graded,
      correct: state.correct,
      score: percentage,
      assignmentId,
      course: currentCourse(),
      unit: target?.unit,
      topic: target?.topic,
    });
  ECHSLearning.clearContinue();
  UI.shell.innerHTML = `<div class="result"><div class="resultScore">${percentage == null ? "Practice complete" : `${state.correct} / ${state.graded} (${percentage}%)`}</div><p>Mastery evidence and review timing were updated for ${ECHSBank.escape(target?.label || courseLabel(currentCourse()))}.</p><div class="heroActions"><a class="button wine" href="../index.html#courses">Return to learning path</a><a class="button ghost" data-role-home href="student.html">Open dashboard</a><a class="button ghost" href="mistakes.html">Review mistakes</a></div></div>`;
  resumeBanner();
}
function balancedAssignmentSample(rows, count) {
  const routes = assignmentRoutes(),
    groups = routes
      .map((route) => ({
        route,
        rows: ECHSBank.shuffle(
          rows.filter((question) =>
            questionMatchesAssignmentRoutes(question, [route]),
          ),
        ),
      }))
      .filter((group) => group.rows.length),
    selected = [],
    used = new Set();
  while (selected.length < count && groups.some((group) => group.rows.length)) {
    for (const group of groups) {
      while (group.rows.length) {
        const question = group.rows.shift(),
          key = `${question.bank_code || ""}::${question.id}`;
        if (used.has(key)) continue;
        used.add(key);
        selected.push(question);
        break;
      }
      if (selected.length >= count) break;
    }
  }
  return selected;
}
async function start() {
  if (targetLocked()) return;
  const rows = eligibleRows();
  if (!rows.length) {
    UI.shell.innerHTML =
      '<div class="empty"><div class="emptyState"><div class="emptyStateIcon">0</div><h2>No questions match these choices</h2><p>Try all question types, all difficulties, or ask an administrator to check the lesson mapping.</p></div></div>';
    return;
  }
  const exactAssignmentCount = Array.isArray(assignmentConfig?.question_ids)
    ? assignmentConfig.question_ids.length
    : 0;
  targetCount = Math.min(
    rows.length,
    exactAssignmentCount || Number(UI.count.value) || 10,
  );
  lastResult = null;
  set =
    UI.mode.value === "adaptive"
      ? ECHSLearning.selectAdaptive(rows, Math.min(1, targetCount))
      : assignmentConfig?.distribution === "balanced" && assignmentRoutes().length > 1
        ? balancedAssignmentSample(rows, targetCount)
        : ECHSBank.shuffle(rows).slice(0, targetCount);
  state = {
    index: 0,
    response: null,
    checked: false,
    correct: 0,
    graded: 0,
    answered: new Set(),
  };
  const target = currentTarget();
  session = ECHSLearning.startSession({
    type: "practice",
    mode: UI.mode.value,
    course: currentCourse(),
    unit: target?.unit,
    topic: target?.topic,
    scope: target?.scope,
    targetId: target?.id,
    bundleLabel: target?.label,
    questionIds: set.map((question) => question.id),
    targetCount,
    assignmentId,
    title: assignmentTitle,
  });
  UI.status.innerHTML = `<span class="pill teal">${rows.length.toLocaleString()} eligible questions</span><span class="pill wine">${targetCount.toLocaleString()} planned</span><span class="pill gold">${ECHSBank.escape(modeCopy[UI.mode.value]?.[0])}</span>`;
  render();
  scrollQuestionIntoView();
  resumeBanner();
}
function restore() {
  const saved = ECHSLearning.getContinue();
  if (
    !saved ||
    saved.type !== "practice" ||
    saved.targetId !== currentTarget()?.id
  )
    return false;
  UI.mode.value = saved.mode || "manual";
  updateModeCopy();
  targetCount = Number(saved.targetCount) || saved.questionIds?.length || 10;
  const map = new Map(
    loaded.map((question) => [String(question.id), question]),
  );
  set = (saved.questionIds || [])
    .map((id) => map.get(String(id)))
    .filter(Boolean);
  if (!set.length) return false;
  state = {
    index: Math.min(Number(saved.index) || 0, set.length - 1),
    response: null,
    checked: false,
    correct: Number(saved.correct) || 0,
    graded: Number(saved.graded) || 0,
    answered: new Set(saved.answeredIds || []),
  };
  session =
    ECHSLearning.activeSession(saved.sessionId) ||
    ECHSLearning.startSession({
      type: "practice",
      mode: UI.mode.value,
      targetId: saved.targetId,
      questionIds: set.map((question) => question.id),
      targetCount,
      assignmentId: saved.assignmentId,
    });
  render();
  scrollQuestionIntoView();
  return true;
}
function practiceKeyboard(event) {
  if (
    event.defaultPrevented ||
    document.body.classList.contains("practiceFiltersOpen") ||
    document.querySelector('dialog[open], [role="dialog"][aria-modal="true"]') ||
    !document.querySelector("#shell .questionCard") ||
    event.metaKey ||
    event.ctrlKey ||
    event.altKey
  )
    return;
  if (
    event.target?.closest?.("input, textarea, select, button, a, [contenteditable='true']")
  )
    return;
  const key = event.key.toLowerCase(),
    choices = [...document.querySelectorAll(".choice")];
  const index = "abcd".indexOf(key);
  if (index >= 0 && choices[index]) {
    event.preventDefault();
    choices[index].click();
    return;
  }
  if (event.key === "Enter") {
    event.preventDefault();
    (state.checked
      ? document.getElementById("next")
      : document.getElementById("check")
    )?.click();
    return;
  }
  if (event.key === "ArrowLeft") {
    event.preventDefault();
    document.getElementById("prev")?.click();
  }
  if (event.key === "ArrowRight") {
    event.preventDefault();
    document.getElementById("next")?.click();
  }
}
document.addEventListener("keydown", practiceKeyboard);
(async () => {
  try {
    access = await ECHSPortalAccess.ready;
    if (!access?.authenticated) return;
    if (assignmentId) {
      try {
        const result = await ECHSInstitution.api(
          "institution-api",
          "/assignments",
        );
        assignmentConfig =
          (result.assignments || []).find(
            (row) => String(row.id) === String(assignmentId),
          )?.configuration || null;
        if (assignmentConfig)
          document.documentElement.dataset.assignmentMultiBank =
            new Set(assignmentRoutes().map((route) => route.bank)).size > 1
              ? "true"
              : "false";
      } catch (error) {
        console.warn("Assignment configuration could not be loaded", error);
      }
    }
    document.body.classList.add(student() ? "roleStudent" : "roleStaff");
    if (UI.roleBadge)
      UI.roleBadge.textContent = student()
        ? "Student · completed pathway only"
        : access.role === "admin"
          ? "Administrator · all courses"
          : "Teacher · all courses";
    document.getElementById("practiceHeroText").textContent = student()
      ? "Choose an assigned lesson or mapped unit. Questions remain isolated to your assigned course and bank."
      : "Browse every course, unit, lesson and bank. Staff QA view can include withheld questions without releasing them to students.";
    catalog = await ECHSBank.loadCatalog();
    await loadPrivateInventory();
    populateCourses();
    const requested = normaliseCourse(
      assignmentConfig?.course || params.get("course") || "",
    );
    if (
      student() &&
      requested &&
      !ECHSPortalAccess.courseAllowed(requested, access)
    ) {
      UI.shell.innerHTML =
        '<div class="lockedPractice"><h2>This course is not assigned to your account</h2><p>Return to your dashboard or ask your teacher to update the class roster.</p></div>';
      return;
    }
    if (student() && fromLesson && !assignmentId) {
      const routeKey = requestedAccessKey || (
        requested && requestedUnit && requestedTopic
          ? `${requested}::${Math.max(0, Number(requestedUnit) - 1)}::${requestedTopic}`
          : ""
      );
      const decision = await ECHSInstitution.api(
        "institution-api",
        "/lesson-access/check",
        { method: "POST", body: { course_key: requested, access_key: routeKey } },
      );
      if (!decision.allowed) {
        UI.shell.innerHTML =
          '<div class="lockedPractice"><h2>This lesson is not available yet</h2><p>Complete the previous lesson and its practice, or ask your teacher to show this lesson.</p><a class="button wine" href="../index.html#courses">Return to learning path</a></div>';
        return;
      }
    }
    if (requested && courseKeys().includes(requested))
      UI.course.value = requested;
    if (UI.visibility) {
      UI.visibility.value =
        staff() && params.get("visibility") !== "ready" ? "all" : "ready";
      UI.visibility.closest(".staffOnly")?.toggleAttribute("hidden", !staff());
    }
    UI.mode.value = params.get("mode") || (student() ? "adaptive" : "manual");
    if (assignmentConfig?.count) UI.count.value = assignmentConfig.count;
    else if (params.get("count")) UI.count.value = params.get("count");
    updateModeCopy();
    populateBanks();
    if (
      (assignmentConfig?.banks?.[0] || assignmentConfig?.bank) &&
      [...UI.bank.options].some(
        (option) =>
          option.value ===
          String(assignmentConfig?.banks?.[0] || assignmentConfig?.bank),
      )
    )
      UI.bank.value = String(
        assignmentConfig?.banks?.[0] || assignmentConfig?.bank,
      );
    populateScopes();
    if (
      assignmentConfig?.scope &&
      [...UI.scope.options].some(
        (option) => option.value === assignmentConfig.scope,
      )
    )
      UI.scope.value = assignmentConfig.scope;
    populateTargets();
    const firstAssignmentRoute = assignmentRoutes()[0];
    if (firstAssignmentRoute) {
      const firstTarget = targets.find(
        (target) =>
          target.scope === firstAssignmentRoute.scope &&
          String(target.unit || "") === String(firstAssignmentRoute.unit || "") &&
          String(target.topic || "") === String(firstAssignmentRoute.topic || ""),
      );
      if (firstTarget) UI.bundle.value = firstTarget.id;
    }
    if (assignmentRoutes().length > 1) await loadAssignmentRouteSet();
    else await loadCurrent();
    assignmentBanner();
    resumeBanner();
    const learning = ECHSLearning.summary();
    UI.heroDue.textContent = learning.due.toLocaleString();
    UI.heroMastery.textContent = learning.mastered.toLocaleString();
    UI.course.onchange = async () => {
      populateBanks();
      populateScopes(staff() ? "course" : "lesson");
      populateTargets();
      await loadCurrent();
    };
    UI.bank.onchange = async () => {
      populateScopes(UI.scope.value);
      populateTargets();
      await loadCurrent();
    };
    UI.scope.onchange = async () => {
      updateScopeDescription();
      populateTargets();
      await loadCurrent();
    };
    UI.bundle.onchange = async () => {
      updateBuilderContext();
      await loadCurrent();
    };
    if (UI.visibility) UI.visibility.onchange = loadCurrent;
    UI.mode.onchange = updateModeCopy;
    UI.start.onclick = () =>
      start().catch(
        (error) =>
          (UI.shell.innerHTML = `<div class="notice">${ECHSBank.escape(error.message)}</div>`),
      );
    if (params.get("resume") === "1") {
      if (!restore()) resumeBanner();
    } else if (params.get("autostart") === "1" && !targetLocked()) start();
  } catch (error) {
    console.error(error);
    UI.shell.innerHTML = `<div class="notice"><strong>Practice could not initialise.</strong><br>${ECHSBank.escape(error.message)}</div>`;
  }
})();
