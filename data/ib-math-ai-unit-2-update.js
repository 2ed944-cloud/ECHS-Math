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
    description: "Six definitive interactive IB Mathematics: Applications and Interpretation SL lessons with technology laboratories, modelling cycles, original four-level practice, extended tasks and timed quizzes.",
    portalSummary: "6 interactive lessons · 415 Learn screens · 400 original Practice questions · 76 Quiz questions · 20 extended tasks",
    essential_questions: [
      "How do representations reveal the structure and restrictions of a function?",
      "How can technology support, rather than replace, mathematical reasoning?",
      "How do residuals, assumptions and context determine whether a model is defensible?"
    ],
    architectureNotes: [
      "Lesson 2.1 is rebuilt as a five-block function-language pathway with a focused recommended route.",
      "Lesson 2.2 is rebuilt as a five-block linear and quadratic modelling pathway with brief verified TI-84 Plus CE training where graphing technology adds mathematical value.",
      "Optional enrichment remains available without replacing the required learning sequence.",
      "The remaining Unit 2 lesson sequence is unchanged."
    ],
    lessons: [
      lesson(
        "2.1", "functions_domain_range_representations", "Functions, Domain, Range, and Representations",
        "Build function language through mappings, notation, mathematical and contextual domains, ranges, graph features, inverse reflection, transparent technology and model evaluation.",
        [
          "Decide whether a relation defines a function and justify the decision from a mapping, table, equation, graph or context.",
          "Evaluate function values, identify images and determine all relevant preimages.",
          "Determine mathematical and contextual domains and ranges using correct set or interval notation.",
          "Read and interpret intercepts, extrema, sign, direction of change, endpoints and discontinuities.",
          "Use graph, table, trace and intersection technology transparently and reject outputs outside the model.",
          "Connect inverse relations to reflection in y=x and explain when an inverse relation is also a function."
        ],
        "IBAI.U2.CONCEPT", "u2-concept"
      ),
      lesson(
        "2.2", "linear_quadratic_models", "Linear and Quadratic Models",
        "Build, solve and evaluate straight-line and parabolic models through manual mathematics, concise TI-84 evidence, validation and contextual judgment.",
        [
          "Construct and interpret linear models from rates, points, tables and contexts.",
          "Use parallel, perpendicular and intersection reasoning with contextual restrictions.",
          "Connect standard, factored and vertex forms to roots, intercepts, symmetry and extrema.",
          "Use TI-84 Zero, Maximum, Intersect and TABLE transparently and verify each output independently.",
          "Choose linear or quadratic models using differences, graph shape, residual evidence and parameter meaning.",
          "Evaluate domains, assumptions, limitations, interpolation and extrapolation."
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
    release: "ECHS Unit 2 v3.1.0"
  };

  const lesson21 = unit.lessons.find(value => value.number === "2.1");
  if (lesson21) {
    Object.assign(lesson21, {
      release: "3.0.0", organization_release: "3.0.0",
      organization: "five classroom teaching blocks with a default IB SL core route",
      defaultScope: "IB SL Core", allContentAvailable: true,
      scopeCounts: { learn: { core: 67, all: 79 }, practice: { core: 72, all: 80 }, quiz: { core: 12, all: 14 }, tasks: { core: 3, all: 4 } },
      officialCoreSections: [
        { code: "SL 2.2", title: "Functions, notation, domain, range and inverse as reflection" },
        { code: "SL 2.3", title: "Graph of a function" },
        { code: "SL 2.4", title: "Key features of graphs and intersections using technology" }
      ],
      teachingBlocks: [
        { code: "2.1A", title: "Relations and the Function Rule", estimatedClassroomTime: "60–75 minutes" },
        { code: "2.1B", title: "Function Notation, Images and Preimages", estimatedClassroomTime: "60–75 minutes" },
        { code: "2.1C", title: "Domain and Range", estimatedClassroomTime: "60–75 minutes" },
        { code: "2.1D", title: "Reading Features of Graphs", estimatedClassroomTime: "60–75 minutes" },
        { code: "2.1E", title: "Technology, Inverse Reflection and Modelling", estimatedClassroomTime: "60–75 minutes" }
      ]
    });
    lesson21.resources = [
      { label: "Complete interactive lesson · IB SL Core", url: lesson21.url, type: "resource" },
      { label: "Practice Studio · 72 core / 80 all", url: `${lesson21.url}#practice`, type: "practice" },
      { label: "IB-style assessment tasks · 3 core / 4 all", url: `${lesson21.url}#exam`, type: "assessment" }
    ];
  }

  const lesson22 = unit.lessons.find(value => value.number === "2.2");
  if (lesson22) {
    Object.assign(lesson22, {
      release: "3.1.0", organization_release: "3.1.0",
      organization: "five classroom teaching blocks with a focused recommended route and lesson-specific TI-84 training",
      defaultScope: "Recommended lesson path", allContentAvailable: true,
      scopeCounts: { learn: { core: 72, all: 80 }, practice: { core: 72, all: 80 }, quiz: { core: 12, all: 14 }, tasks: { core: 3, all: 4 } },
      officialCoreSections: [
        { code: "SL 2.1", title: "Equations of straight lines, gradients, intercepts, parallel and perpendicular lines" },
        { code: "SL 2.4", title: "Key graph features and intersections using technology" },
        { code: "SL 2.5", title: "Linear and quadratic models, axis, vertex, zeros and intercepts" },
        { code: "SL 2.6", title: "Create, fit, use and evaluate models with a reasonable domain" }
      ],
      teachingBlocks: [
        { code: "2.2A", title: "Linear Models: Rate, Intercept and Equation", estimatedClassroomTime: "60–75 minutes" },
        { code: "2.2B", title: "Line Relationships, Intersections and Constraints", estimatedClassroomTime: "60–75 minutes" },
        { code: "2.2C", title: "Quadratic Structure and Features", estimatedClassroomTime: "60–75 minutes" },
        { code: "2.2D", title: "Solving, Intersections and TI-84 Evidence", estimatedClassroomTime: "60–75 minutes" },
        { code: "2.2E", title: "Model Choice, Validation and IB Synthesis", estimatedClassroomTime: "60–75 minutes" }
      ],
      ti84: {
        required: true,
        reason: "Zeros, extrema, intersections, graph-window decisions and whole-number table thresholds are part of the lesson evidence.",
        workflows: ["Zero", "Maximum", "Intersect", "TABLE"]
      }
    });
    lesson22.resources = [
      { label: "Complete interactive lesson · recommended path", url: lesson22.url, type: "resource" },
      { label: "Practice Studio · 72 required / 80 all", url: `${lesson22.url}#practice`, type: "practice" },
      { label: "IB-style assessment tasks · 3 required / 4 all", url: `${lesson22.url}#exam`, type: "assessment" }
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
  course.updatedUnits = "Units 1–2 · Lessons 2.1 and 2.2 definitive recommended-path releases · six complete Unit 2 lessons";
  window.dispatchEvent(new CustomEvent("echs:ib-ai-unit-ready", { detail: { courseId: course.id, unit: 2, lessons: unit.lessons.length, release: unit.release } }));
})();
