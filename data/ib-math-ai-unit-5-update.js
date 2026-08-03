(function () {
  "use strict";

  const base = "lessons/ib-math-ai/unit-5/lessons/";
  const records = [{"number":"5.1","slug":"limits_rates_change","title":"Limits and Rates of Change","summary":"How can approaching behaviour turn average change into an instantaneous rate?","outcomes":["Interpret average and instantaneous rates with units.","Evaluate one-sided and two-sided limits from tables, graphs and formulas.","Distinguish a function value from its limit and test continuity.","Use limits to describe asymptotes and tangent gradients."],"skill_keys":["IBAI.U5.CHANGE"],"lesson_key":"u5-limits-change","practice_lesson_keys":["u5-change"],"learning_cards":48,"practice_questions":48,"extended_tasks":3,"quiz_questions":12},{"number":"5.2","slug":"derivatives_rules_functions","title":"Differentiation Rules and Derivative Functions","summary":"How does a derivative function encode the local behaviour of a model?","outcomes":["Interpret derivative notation and units.","Differentiate polynomial power functions, including negative and fractional powers after rewriting.","Use sums, differences and constant multiples correctly.","Obtain derivative evidence symbolically, graphically, numerically and from tables."],"skill_keys":["IBAI.U5.DERIVATIVE"],"lesson_key":"u5-derivative-rules","practice_lesson_keys":["u5-derivative"],"learning_cards":56,"practice_questions":52,"extended_tasks":3,"quiz_questions":12},{"number":"5.3","slug":"tangents_normals","title":"Tangents and Normals","summary":"How do derivative values determine the geometry of tangent and normal lines?","outcomes":["Find tangent and normal gradients and equations.","Use parallel and perpendicular conditions to locate contact points.","Recover unknown parameters from a given tangent.","Solve for further intersections of a curve with its tangent or normal."],"skill_keys":["IBAI.U5.DERIVATIVE"],"lesson_key":"u5-tangents-normals","practice_lesson_keys":["u5-derivative"],"learning_cards":48,"practice_questions":48,"extended_tasks":3,"quiz_questions":12},{"number":"5.4","slug":"curve_behaviour_stationary_points","title":"Curve Behaviour and Stationary Points","summary":"How does the sign of a derivative explain the shape and extrema of a curve?","outcomes":["Use derivative signs to identify increasing and decreasing intervals.","Find and classify stationary points.","Compare stationary and endpoint values for global extrema.","Sketch and interpret a function from derivative information."],"skill_keys":["IBAI.U5.DERIVATIVE"],"lesson_key":"u5-curve-behaviour","practice_lesson_keys":["u5-derivative"],"learning_cards":48,"practice_questions":48,"extended_tasks":3,"quiz_questions":12},{"number":"5.5","slug":"optimisation_modelling","title":"Optimisation and Modelling","summary":"How can constraints and derivatives support defensible real-world decisions?","outcomes":["Build one-variable objective functions from constraints.","State and use physically meaningful domains.","Solve and validate maximum/minimum problems in geometry, finance and distance.","Communicate optimal decisions with dimensions, units and model limitations."],"skill_keys":["IBAI.U5.OPTIMIZATION"],"lesson_key":"u5-optimisation-modelling","practice_lesson_keys":["u5-optimization"],"learning_cards":52,"practice_questions":48,"extended_tasks":3,"quiz_questions":12},{"number":"5.6","slug":"antidifferentiation_accumulation","title":"Antidifferentiation and Accumulation","summary":"How can integration recover quantities and measure net accumulation?","outcomes":["Find indefinite integrals using the reverse power rule and linearity.","Use initial conditions to recover a specific function.","Evaluate definite integrals using the Fundamental Theorem of Calculus.","Interpret integrals of rates as net accumulated change with units."],"skill_keys":["IBAI.U5.INTEGRAL"],"lesson_key":"u5-antidifferentiation","practice_lesson_keys":["u5-integral"],"learning_cards":48,"practice_questions":48,"extended_tasks":3,"quiz_questions":12},{"number":"5.7","slug":"area_trapezoidal_rule","title":"Area and the Trapezoidal Rule","summary":"How can exact and numerical integration measure regions without confusing signed accumulation and total area?","outcomes":["Distinguish signed integrals from geometric area.","Find area with the x-axis and between curves, splitting when required.","Apply the trapezoidal rule from tables and functions.","Evaluate numerical error and communicate assumptions and units."],"skill_keys":["IBAI.U5.INTEGRAL"],"lesson_key":"u5-area-trapezoidal","practice_lesson_keys":["u5-integral"],"learning_cards":60,"practice_questions":48,"extended_tasks":3,"quiz_questions":12}];
  const lessons = records.map(record => {
    const url = `${base}IB_AI_SL_${record.number}_${record.slug}_ECHS.html`;
    return {
      number: record.number,
      title: record.title,
      summary: record.summary,
      outcomes: record.outcomes,
      url,
      status: "ready",
      new: true,
      kind: "lesson",
      lesson_key: record.lesson_key,
      practice_lesson_keys: record.practice_lesson_keys,
      skill_keys: record.skill_keys,
      learning_cards: record.learning_cards,
      practice_questions: record.practice_questions,
      extended_tasks: record.extended_tasks,
      quiz_questions: record.quiz_questions,
      resources: [
        { label: "Complete interactive lesson", url, type: "resource" },
        { label: "Practice Lab", url: `${url}#practice`, type: "practice" },
        { label: "IB-style assessment tasks", url: `${url}#exam`, type: "assessment" }
      ],
      keywords: ["ib", "mathematics", "applications", "interpretation", "calculus", record.number, record.slug]
    };
  });

  const unit = {
    title: "Unit 5: Calculus",
    description: "Seven complete interactive IB Mathematics: Applications and Interpretation SL lessons connecting limits, derivatives, tangent and normal geometry, curve behaviour, optimisation, integration, Riemann sums, area and numerical approximation.",
    portalSummary: "7 interactive lessons · 360 learning cards · 340 practice questions · 84 timed questions · 21 extended tasks",
    essential_questions: [
      "How can approaching behaviour turn average change into an instantaneous rate?",
      "How does the derivative connect a model, its graph and its real-world rate of change?",
      "How can optimisation and integration support defensible decisions in context?",
      "How do signed accumulation, total area and numerical approximation differ?"
    ],
    unit_home: "lessons/ib-math-ai/unit-5/START_HERE.html",
    lessons,
    refreshed: true,
    release: "ECHS Unit 5 v2.0.0"
  };

  window.ECHS_IB_MATH_AI_UNIT_5 = unit;
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

  const unitIndex = course.units.findIndex(value => /^unit\s*5(?:\s*:|\b)/i.test(String(value && value.title || "")));
  if (unitIndex >= 0) {
    course.units[unitIndex] = unit;
  } else {
    let insertAt = course.units.length;
    for (let i = 0; i < course.units.length; i += 1) {
      const match = String(course.units[i] && course.units[i].title || "").match(/^unit\s*(\d+)/i);
      if (match && Number(match[1]) > 5) { insertAt = i; break; }
    }
    course.units.splice(insertAt, 0, unit);
  }

  course.unitCount = course.units.length;
  course.lessonCount = course.units.reduce((total, value) => total + (Array.isArray(value && value.lessons) ? value.lessons.length : 0), 0);
  course.status = "Started";
  course.updatedUnits = `Unit 5 · ${unit.lessons.length} complete calculus lessons`;
  window.dispatchEvent(new CustomEvent("echs:ib-ai-unit-ready", {
    detail: { courseId: course.id, unit: 5, lessons: unit.lessons.length }
  }));
})();
