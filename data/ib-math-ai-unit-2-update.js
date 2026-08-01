(function () {
  "use strict";

  const base = "lessons/ib-math-ai/unit-2/lessons/";
  const lesson = (number, slug, title, summary, outcomes, skillKey, lessonKey) => {
    const url = `${base}IB_AI_SL_${number}_${slug}_ECHS.html`;
    return {
      number,
      title,
      summary,
      outcomes,
      url,
      status: "ready",
      new: true,
      kind: "lesson",
      skill_keys: [skillKey],
      lesson_key: lessonKey,
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
    portalSummary: "6 interactive lessons · 384 learn slides · 360 original practice questions · 72 quiz questions · 18 extended tasks",
    essential_questions: [
      "How do representations reveal the structure and restrictions of a function?",
      "How can technology support, rather than replace, mathematical reasoning?",
      "How do residuals, assumptions and context determine whether a model is defensible?"
    ],
    lessons: [
      lesson(
        "2.1",
        "functions_domain_range_representations",
        "Functions, Domain, Range, and Representations",
        "Connect mappings, tables, formulas, graphs and contexts while controlling valid inputs and meaningful outputs.",
        [
          "Decide whether a relation defines a function and justify the decision.",
          "Evaluate functions and find inputs that produce specified outputs.",
          "Determine domain and range from formulas, graphs, tables and contexts.",
          "Move fluently among representations and interpret each feature in context."
        ],
        "IBAI.U2.CONCEPT",
        "u2-concept"
      ),
      lesson(
        "2.2",
        "linear_quadratic_models",
        "Linear and Quadratic Models",
        "Use rates of change and curvature to build, compare, solve and evaluate straight-line and parabolic models.",
        [
          "Construct and interpret linear models from points, rates and contexts.",
          "Use parallel, perpendicular and simultaneous-line reasoning accurately.",
          "Read and calculate roots, axis of symmetry, vertex and intercepts of quadratics.",
          "Choose between linear and quadratic models and evaluate contextual validity."
        ],
        "IBAI.U2.LINEAR_QUADRATIC",
        "u2-linear-quadratic"
      ),
      lesson(
        "2.3",
        "polynomial_rational_models",
        "Polynomial and Rational Models",
        "Use zeros, end behaviour, asymptotes and variation structure to interpret non-linear models and their limitations.",
        [
          "Interpret polynomial degree, zeros and end behaviour from equations and graphs.",
          "Use factors and multiplicity to connect algebraic structure with graph behaviour.",
          "Determine domains and asymptotes of rational models and interpret them contextually.",
          "Recognize direct, inverse and power variation and use technology to estimate parameters."
        ],
        "IBAI.U2.POLY_RATIONAL",
        "u2-poly-rational"
      ),
      lesson(
        "2.4",
        "exponential_logarithmic_models",
        "Exponential and Logarithmic Models",
        "Interpret repeated percentage change, solve threshold problems and connect logarithmic scales to inverse exponential reasoning.",
        [
          "Interpret parameters in exponential growth and decay models.",
          "Solve exponential equations graphically and with logarithms where appropriate.",
          "Use doubling time, half-life and asymptotic behaviour in context.",
          "Interpret logarithmic scales and compare additive with multiplicative change."
        ],
        "IBAI.U2.EXP_LOG",
        "u2-exp-log"
      ),
      lesson(
        "2.5",
        "transformations_composition_inverses",
        "Transformations, Composition, and Inverses",
        "Track how parameters move, stretch and reflect graphs, then connect reversible processes through inverse functions.",
        [
          "Describe and construct translations, reflections and stretches of familiar graphs.",
          "Apply more than one transformation in the correct order.",
          "Find and interpret inverse functions and domain restrictions.",
          "Use composition to represent multi-stage processes and verify inverse relationships."
        ],
        "IBAI.U2.TRANSFORM",
        "u2-transform"
      ),
      lesson(
        "2.6",
        "regression_technology_validation",
        "Regression, Technology, and Model Validation",
        "Use data, residuals, parameter meaning and contextual judgment to select and defend a model rather than merely fit a curve.",
        [
          "Calculate and interpret linear regression parameters and predictions.",
          "Use residuals and residual plots to assess systematic model error.",
          "Compare model families using fit, simplicity, parameter meaning and context.",
          "Distinguish interpolation from extrapolation and communicate limitations responsibly."
        ],
        "IBAI.U2.REGRESSION",
        "u2-regression"
      )
    ],
    refreshed: true,
    release: "ECHS Unit 2 v2.0.0"
  };

  window.ECHS_IB_MATH_AI_UNIT_2 = unit;
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

  const unitIndex = course.units.findIndex(value => /^unit\s*2(?:\s*:|\b)/i.test(String(value && value.title || "")));
  if (unitIndex >= 0) {
    course.units[unitIndex] = unit;
  } else {
    const unitOneIndex = course.units.findIndex(value => /^unit\s*1(?:\s*:|\b)/i.test(String(value && value.title || "")));
    course.units.splice(unitOneIndex >= 0 ? unitOneIndex + 1 : Math.min(1, course.units.length), 0, unit);
  }

  course.unitCount = course.units.length;
  course.lessonCount = course.units.reduce((total, value) => total + (Array.isArray(value && value.lessons) ? value.lessons.length : 0), 0);
  course.status = "Started";
  course.updatedUnits = `Units 1–2 · ${unit.lessons.length} complete Unit 2 interactive lessons`;
  window.dispatchEvent(new CustomEvent("echs:ib-ai-unit-ready", {
    detail: { courseId: course.id, unit: 2, lessons: unit.lessons.length }
  }));
})();
