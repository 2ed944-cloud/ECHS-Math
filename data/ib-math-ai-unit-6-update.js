(function () {
  "use strict";

  const base = "lessons/ib-math-ai/unit-6/lessons/";
  const readyUrl61 = `${base}IB_AI_SL_6.1_technology_fluency_routines_ECHS.html`;
  const readyUrl62 = `${base}IB_AI_SL_6.2_ia_question_design_ECHS.html`;
  const lessons = [
    {
      number: "6.1",
      title: "Technology Fluency Routines",
      summary: "How can graphing technology become transparent mathematical evidence rather than an unexplained answer?",
      outcomes: [
        "Use graphing, regression, statistics, probability and numerical calculus technology accurately.",
        "Audit calculator settings, preserve precision and choose defensible windows, lists, bounds and parameters.",
        "Verify outputs using a second representation, residual evidence, substitution, estimation or units.",
        "Explain every output using mathematical language, context, units, domain and appropriate rounding."
      ],
      url: readyUrl61,
      status: "ready",
      new: true,
      kind: "lesson",
      lesson_key: "u6-technology-fluency",
      practice_lesson_keys: ["u6-technology"],
      skill_keys: ["IBAI.U4.DATA", "IBAI.U4.CORRELATION", "IBAI.U4.DISTRIBUTIONS", "IBAI.U5.DERIVATIVE", "IBAI.U5.INTEGRAL"],
      learning_cards: 48,
      practice_questions: 48,
      extended_tasks: 3,
      quiz_questions: 12,
      resources: [
        { label: "Complete interactive lesson", url: readyUrl61, type: "resource" },
        { label: "Practice Studio", url: `${readyUrl61}#practice`, type: "practice" },
        { label: "IB-style assessment tasks", url: `${readyUrl61}#exam`, type: "assessment" },
        { label: "TI-84 simulator", url: `${readyUrl61}#learn`, type: "technology" }
      ],
      keywords: ["ib", "mathematics", "applications", "interpretation", "technology", "ti-84", "gdc", "graphing", "regression", "residuals", "statistics", "probability", "numerical calculus", "6.1"]
    },
    {
      number: "6.2",
      title: "IA Question Design",
      summary: "How can a broad interest become a focused, feasible, ethical and mathematically defensible exploration question?",
      outcomes: [
        "Distinguish a topic, research question, mathematical method and conclusion.",
        "Define variables, units, domains, constraints, populations and decision evidence precisely.",
        "Build a connected mathematical architecture with validation, sensitivity and reflection.",
        "Audit data access, sampling, measurement, provenance, ethics and pilot feasibility.",
        "Use TI-84 pilot graphs and regressions only where technology adds genuine design evidence.",
        "Prepare and critique a one-page exploration proposal using the correct assessment-session framework."
      ],
      url: readyUrl62,
      status: "ready",
      new: true,
      kind: "lesson",
      lesson_key: "u6-ia-question-design",
      practice_lesson_keys: ["u6-ia-design"],
      skill_keys: ["IBAI.IA.QUESTION", "IBAI.IA.DATA", "IBAI.IA.MODELLING", "IBAI.IA.REFLECTION", "IBAI.U4.CORRELATION"],
      learning_cards: 57,
      practice_questions: 64,
      extended_tasks: 4,
      quiz_questions: 14,
      resources: [
        { label: "Complete interactive lesson", url: readyUrl62, type: "resource" },
        { label: "Practice Studio", url: `${readyUrl62}#practice`, type: "practice" },
        { label: "IB-style proposal tasks", url: `${readyUrl62}#exam`, type: "assessment" },
        { label: "Timed question-design checkpoint", url: `${readyUrl62}#quiz`, type: "assessment" },
        { label: "TI-84 pilot-model simulator", url: `${readyUrl62}#learn`, type: "technology" }
      ],
      keywords: ["ib", "mathematics", "applications", "interpretation", "ia", "internal assessment", "mathematical exploration", "research question", "variables", "domain", "data ethics", "sampling", "validation", "residuals", "ti-84", "6.2"]
    },
    {
      number: "6.3",
      title: "Modelling Investigation",
      summary: "How can data, assumptions and competing models support a defensible investigation?",
      outcomes: ["Collect or source data responsibly.", "Construct, compare and critique models."],
      url: "",
      status: "flow",
      kind: "lesson",
      resources: [],
      keywords: ["modelling", "investigation", "data"]
    },
    {
      number: "6.4",
      title: "Mixed Exam Practice",
      summary: "How can ideas from across the course be selected and connected in unfamiliar problems?",
      outcomes: ["Solve non-routine problems involving multiple topics.", "Communicate reasoning clearly."],
      url: "",
      status: "flow",
      kind: "lesson",
      resources: [],
      keywords: ["exam", "mixed", "reasoning"]
    },
    {
      number: "6.5",
      title: "Reflection and Error Analysis",
      summary: "How can a precise analysis of errors improve later mathematical decisions and communication?",
      outcomes: ["Analyze mistakes and revise solutions.", "Improve written interpretation."],
      url: "",
      status: "flow",
      kind: "lesson",
      resources: [],
      keywords: ["reflection", "error analysis", "revision"]
    }
  ];

  const unit = {
    title: "Unit 6: Exploration, Technology, and Exam Practice",
    description: "A technology-rich sequence beginning with rigorous TI-84/GDC fluency, then moving into precise exploration design, responsible data work, modelling, mixed examination practice and disciplined reflection.",
    portalSummary: "2 complete interactive lessons · 105 learning screens · 112 practice questions · 26 timed questions · 7 extended tasks · 3 planned lessons",
    essential_questions: [
      "How can technology provide transparent mathematical evidence rather than unexplained answers?",
      "How can a broad interest become a focused, feasible and mathematically defensible exploration question?",
      "How do settings, precision, sampling, domain, residuals, assumptions and ethics affect the validity of a result?",
      "How should calculator output, data provenance, model evidence and reflection be communicated in IB mathematical language?"
    ],
    unit_home: "lessons/ib-math-ai/unit-6/START_HERE.html",
    lessons,
    refreshed: true,
    release: "ECHS Unit 6 · Lessons 6.1–6.2 · v6.2.0"
  };

  window.ECHS_IB_MATH_AI_UNIT_6 = unit;
  if (!Array.isArray(window.ECHS_COURSES)) return;

  function normalise(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/[–—−]/g, "-")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function isIBCourse(course) {
    if (!course) return false;
    const labels = [course.id, course.course, course.title, course.shortTitle].map(normalise);
    return labels.includes("g11-ib-ai") ||
      labels.includes("ib-math-ai") ||
      labels.some(value => value.includes("ib-mathematics-applications-and-interpretation") || value.includes("ib-math-ai"));
  }

  let courseIndex = window.ECHS_COURSES.findIndex(course => normalise(course && course.id) === "g11-ib-ai");
  if (courseIndex < 0) courseIndex = window.ECHS_COURSES.findIndex(isIBCourse);
  if (courseIndex < 0) {
    console.error("Canonical G11 IB Mathematics AI course was not found");
    return;
  }

  const course = window.ECHS_COURSES[courseIndex];
  window.ECHS_COURSES = window.ECHS_COURSES.filter((candidate, index) => index === courseIndex || !isIBCourse(candidate));
  course.id = "g11-ib-ai";
  course.grade = "G11";
  course.title = "G11 IB Mathematics: Applications and Interpretation";
  course.shortTitle = "IB Math AI";
  course.course = course.title;
  if (!Array.isArray(course.units)) course.units = [];

  const unitIndex = course.units.findIndex(value => /^unit\s*6(?:\s*:|\b)/i.test(String(value && value.title || "")));
  if (unitIndex >= 0) {
    course.units[unitIndex] = unit;
  } else {
    let insertAt = course.units.length;
    for (let index = 0; index < course.units.length; index += 1) {
      const match = String(course.units[index] && course.units[index].title || "").match(/^unit\s*(\d+)/i);
      if (match && Number(match[1]) > 6) { insertAt = index; break; }
    }
    course.units.splice(insertAt, 0, unit);
  }

  course.unitCount = course.units.length;
  course.lessonCount = course.units.reduce((total, value) => total + (Array.isArray(value && value.lessons) ? value.lessons.length : 0), 0);
  course.status = "Started";
  course.updatedUnits = "Unit 6 · Technology Fluency and IA Question Design complete";
  window.dispatchEvent(new CustomEvent("echs:ib-ai-unit-ready", {
    detail: { courseId: course.id, unit: 6, lessons: unit.lessons.length, readyLessons: 2 }
  }));
})();
