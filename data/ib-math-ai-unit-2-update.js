(function () {
  "use strict";

  const base = "lessons/ib-math-ai/unit-2/lessons/";
  const lesson = (number, slug, title, summary, outcomes, skillKey, lessonKey) => {
    const url = `${base}IB_AI_SL_${number}_${slug}_ECHS.html`;
    return {
      number, title, summary, outcomes, url,
      status: "ready", new: true, kind: "lesson",
      skill_keys: [skillKey], lesson_key: lessonKey,
      resources: [
        { label: "Complete interactive lesson", url, type: "resource" },
        { label: "Practice Studio", url: `${url}#practice`, type: "practice" },
        { label: "IB-style assessment tasks", url: `${url}#exam`, type: "assessment" }
      ],
      keywords: ["ib", "mathematics", "applications", "interpretation", "functions", number, slug]
    };
  };

  const unit = {
    title: "Unit 2: Functions",
    description: "Six complete interactive IB Mathematics: Applications and Interpretation SL lessons with precise mathematical graphics, technology laboratories, modelling cycles, four-level practice, extended tasks and timed quizzes.",
    portalSummary: "6 interactive lessons · 408 Learn screens · 400 Practice questions · 80 Quiz questions · 24 extended tasks",
    essential_questions: [
      "How do representations reveal the structure and restrictions of a function?",
      "When is a constant-rate line sufficient and when does curvature require a quadratic model?",
      "How can technology support, rather than replace, mathematical reasoning?",
      "How do residuals, assumptions, domains and context determine whether a model is defensible?"
    ],
    architectureNotes: [
      "Lesson 2.1 develops relations, notation, domains, ranges, graph features, graphing technology and inverse reflection in one coherent six-part pathway.",
      "Lesson 2.2 is rebuilt as a six-part linear and quadratic modelling pathway with exact purpose-built graphics and TI-84 Plus CE training connected directly to worked examples.",
      "The remaining Unit 2 lesson sequence is unchanged."
    ],
    lessons: [
      lesson(
        "2.1", "functions_domain_range_representations", "Functions, Domain, Range, and Representations",
        "Build function language through precise mappings, notation, mathematical and contextual domains, ranges, graph features, inverse reflection, graphing technology and contextual interpretation.",
        [
          "Decide whether a relation defines a function and justify the decision from a mapping, table, equation, graph or context.",
          "Evaluate function values, identify images and determine all relevant preimages.",
          "Determine mathematical and contextual domains and ranges using correct set or interval notation.",
          "Read and interpret intercepts, extrema, sign, direction of change, endpoints, holes, jumps and asymptotes.",
          "Use graph, table, Zero, Minimum, Maximum and Intersect technology transparently.",
          "Connect inverse relations to reflection in y=x and explain one-to-one behaviour."
        ],
        "IBAI.U2.CONCEPT", "u2-concept"
      ),
      lesson(
        "2.2", "linear_quadratic_models", "Linear and Quadratic Models",
        "Build, solve and evaluate straight-line and parabolic models through exact mathematics, precise diagrams, transparent TI-84 evidence and contextual judgment.",
        [
          "Construct and interpret linear models from rates, points, tables and contexts.",
          "Use parallel, perpendicular and intersection reasoning with contextual restrictions.",
          "Connect standard, factored and vertex forms to roots, intercepts, symmetry and extrema.",
          "Construct quadratic models from roots, a vertex, points and applied contexts.",
          "Use TI-84 Zero, Minimum, Maximum, Intersect and TABLE transparently and verify each output independently.",
          "Choose and evaluate a model using differences, residuals, assumptions, domain and extrapolation risk."
        ],
        "IBAI.U2.LINEAR_QUADRATIC", "u2-linear-quadratic"
      ),
      lesson(
        "2.3", "polynomial_rational_models", "Polynomial and Rational Models",
        "Use zeros, end behaviour, asymptotes and variation structure to interpret non-linear models and their limitations.",
        [
          "Interpret polynomial degree, zeros and end behaviour from equations and graphs.",
          "Use factors and multiplicity to connect algebraic structure with graph behaviour.",
          "Determine domains and asymptotes of rational models and interpret them contextually.",
          "Recognize direct, inverse and power variation and use technology to estimate parameters."
        ],
        "IBAI.U2.POLY_RATIONAL", "u2-poly-rational"
      ),
      lesson(
        "2.4", "exponential_logarithmic_models", "Exponential and Logarithmic Models",
        "Interpret repeated percentage change, solve threshold problems and connect logarithmic scales to inverse exponential reasoning.",
        [
          "Interpret parameters in exponential growth and decay models.",
          "Solve exponential equations graphically and with logarithms where appropriate.",
          "Use doubling time, half-life and asymptotic behaviour in context.",
          "Interpret logarithmic scales and compare additive with multiplicative change."
        ],
        "IBAI.U2.EXP_LOG", "u2-exp-log"
      ),
      lesson(
        "2.5", "transformations_composition_inverses", "Transformations, Composition, and Inverses",
        "Track how parameters move, stretch and reflect graphs, then connect reversible processes through inverse functions.",
        [
          "Describe and construct translations, reflections and stretches of familiar graphs.",
          "Apply more than one transformation in the correct order.",
          "Find and interpret inverse functions and domain restrictions.",
          "Use composition to represent multi-stage processes and verify inverse relationships."
        ],
        "IBAI.U2.TRANSFORM", "u2-transform"
      ),
      lesson(
        "2.6", "regression_technology_validation", "Regression, Technology, and Model Validation",
        "Use data, residuals, parameter meaning and contextual judgment to select and defend a model rather than merely fit a curve.",
        [
          "Calculate and interpret linear regression parameters and predictions.",
          "Use residuals and residual plots to assess systematic model error.",
          "Compare model families using fit, simplicity, parameter meaning and context.",
          "Distinguish interpolation from extrapolation and communicate limitations responsibly."
        ],
        "IBAI.U2.REGRESSION", "u2-regression"
      )
    ],
    refreshed: true,
    release: "ECHS Unit 2 v5.0.0"
  };

  const lesson21 = unit.lessons.find(value => value.number === "2.1");
  if (lesson21) {
    Object.assign(lesson21, {
      release: "4.0.0",
      organization_release: "4.0.0",
      organization: "six classroom teaching blocks",
      scopeCounts: { learn: 72, practice: 80, quiz: 16, tasks: 6 },
      officialCoreSections: [
        { code: "SL 2.2", title: "Functions, notation, domain, range and inverse as reflection" },
        { code: "SL 2.3", title: "Graph of a function" },
        { code: "SL 2.4", title: "Key graph features and intersections using technology" }
      ],
      teachingBlocks: [
        { code: "2.1A", title: "Relations and Functions", estimatedClassroomTime: "60–75 minutes" },
        { code: "2.1B", title: "Function Notation", estimatedClassroomTime: "60–75 minutes" },
        { code: "2.1C", title: "Domain and Range", estimatedClassroomTime: "75–90 minutes" },
        { code: "2.1D", title: "Graph Features", estimatedClassroomTime: "60–75 minutes" },
        { code: "2.1E", title: "Graphing Technology", estimatedClassroomTime: "60–75 minutes" },
        { code: "2.1F", title: "Inverse Relations and Synthesis", estimatedClassroomTime: "60–75 minutes" }
      ],
      ti84: {
        required: true,
        reason: "Zeros, extrema and intersections are part of the lesson evidence.",
        workflows: ["Zero", "Minimum", "Maximum", "Intersect"]
      }
    });
    lesson21.resources = [
      { label: "Complete interactive lesson", url: lesson21.url, type: "resource" },
      { label: "Practice Studio · 80 questions", url: `${lesson21.url}#practice`, type: "practice" },
      { label: "IB-style assessment tasks · 6", url: `${lesson21.url}#exam`, type: "assessment" }
    ];
  }

  const lesson22 = unit.lessons.find(value => value.number === "2.2");
  if (lesson22) {
    Object.assign(lesson22, {
      release: "5.0.0",
      organization_release: "5.0.0",
      organization: "six classroom teaching blocks with exact purpose-built graphics and lesson-specific TI-84 training",
      scopeCounts: { learn: 80, practice: 80, quiz: 16, tasks: 6 },
      officialCoreSections: [
        { code: "SL 2.1", title: "Equations of straight lines, gradients, intercepts, parallel and perpendicular lines" },
        { code: "SL 2.4", title: "Key graph features and intersections using technology" },
        { code: "SL 2.5", title: "Linear and quadratic models, axis, vertex, zeros and intercepts" },
        { code: "SL 2.6", title: "Create, fit, use and evaluate models with a reasonable domain" }
      ],
      teachingBlocks: [
        { code: "2.2A", title: "Linear Models and Constant Rate", estimatedClassroomTime: "75–90 minutes" },
        { code: "2.2B", title: "Line Relationships and Decisions", estimatedClassroomTime: "60–75 minutes" },
        { code: "2.2C", title: "Quadratic Structure and Exact Features", estimatedClassroomTime: "75–90 minutes" },
        { code: "2.2D", title: "Constructing Quadratic Models", estimatedClassroomTime: "75–90 minutes" },
        { code: "2.2E", title: "Solving and TI-84 Evidence", estimatedClassroomTime: "75–90 minutes" },
        { code: "2.2F", title: "Model Choice, Validation and IB Synthesis", estimatedClassroomTime: "75–90 minutes" }
      ],
      ti84: {
        required: true,
        reason: "Zeros, extrema, intersections, graph-window decisions and whole-number table thresholds require calculator fluency in this modelling lesson.",
        workflows: ["Zero", "Minimum", "Maximum", "Intersect", "TABLE"],
        classroomModes: ["Teacher Demo", "Students Follow", "Exam Drill"],
        simulator: "TI-84 Plus CE practice beside the active slide"
      }
    });
    lesson22.resources = [
      { label: "Complete interactive lesson", url: lesson22.url, type: "resource" },
      { label: "Practice Studio · 80 questions", url: `${lesson22.url}#practice`, type: "practice" },
      { label: "IB-style assessment tasks · 6", url: `${lesson22.url}#exam`, type: "assessment" }
    ];
  }

  window.ECHS_IB_MATH_AI_UNIT_2 = unit;
  if (!Array.isArray(window.ECHS_COURSES)) return;

  function normalise(value) {
    return String(value || "").toLowerCase().replace(/[–—−]/g, "-").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }
  function isIBCourse(course) {
    if (!course) return false;
    const labels = [course.id, course.course, course.title, course.shortTitle].map(normalise);
    return labels.includes("g11-ib-ai") || labels.includes("ib-math-ai") || labels.some(value => value.includes("ib-mathematics-applications-and-interpretation") || value.includes("ib-math-ai"));
  }

  let courseIndex = window.ECHS_COURSES.findIndex(course => normalise(course && course.id) === "g11-ib-ai");
  if (courseIndex < 0) courseIndex = window.ECHS_COURSES.findIndex(isIBCourse);
  if (courseIndex < 0) { console.error("Canonical G11 IB Mathematics AI course was not found"); return; }

  const course = window.ECHS_COURSES[courseIndex];
  window.ECHS_COURSES = window.ECHS_COURSES.filter((candidate, index) => index === courseIndex || !isIBCourse(candidate));
  course.id = "g11-ib-ai";
  course.grade = "G11";
  course.title = "G11 IB Mathematics: Applications and Interpretation";
  course.shortTitle = "IB Math AI";
  course.course = course.title;
  if (!Array.isArray(course.units)) course.units = [];

  const unitIndex = course.units.findIndex(value => /^unit\s*2(?:\s*:|\b)/i.test(String(value && value.title || "")));
  if (unitIndex >= 0) course.units[unitIndex] = unit;
  else {
    const unitOneIndex = course.units.findIndex(value => /^unit\s*1(?:\s*:|\b)/i.test(String(value && value.title || "")));
    course.units.splice(unitOneIndex >= 0 ? unitOneIndex + 1 : Math.min(1, course.units.length), 0, unit);
  }

  course.unitCount = course.units.length;
  course.lessonCount = course.units.reduce((total, value) => total + (Array.isArray(value && value.lessons) ? value.lessons.length : 0), 0);
  course.status = "Started";
  course.updatedUnits = "Units 1–2 · Lessons 2.1 and 2.2 complete definitive pathways · six complete Unit 2 lessons";
  window.dispatchEvent(new CustomEvent("echs:ib-ai-unit-ready", { detail: { courseId: course.id, unit: 2, lessons: unit.lessons.length, release: unit.release } }));
})();
