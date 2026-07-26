(function () {
  "use strict";

  if (!Array.isArray(window.ECHS_COURSES)) return;

  var lessons = [
    ["1", "3.1 Periodic Phenomena", "AP_Precalculus_3.1_Periodic_Phenomena_ECHS_Refined.html", ["Interpret periodic behavior from graphs, tables, formulas, and contexts.", "Identify period, amplitude, midline, and extrema.", "Model repeating phenomena and justify parameter choices."]],
    ["2", "3.2 Sine, Cosine, and Tangent", "AP_Precalculus_3.2_Sine_Cosine_and_Tangent_ECHS_Refined.html", ["Connect unit-circle coordinates to sine, cosine, and tangent.", "Evaluate trigonometric functions at key angles.", "Use signs, symmetry, and reference angles accurately."]],
    ["3", "3.3 Sine and Cosine Function Values", "AP_Precalculus_3.3_Sine_and_Cosine_Function_Values_ECHS_Refined.html", ["Determine sine and cosine values from angles and coordinates.", "Use exact values and calculator approximations appropriately.", "Interpret trigonometric values in context."]],
    ["4", "3.4 Sine and Cosine Function Graphs", "AP_Precalculus_3.4_Sine_and_Cosine_Function_Graphs_ECHS_Refined.html", ["Graph sine and cosine functions from defining features.", "Relate unit-circle motion to function graphs.", "Analyze intercepts, extrema, symmetry, and periodicity."]],
    ["5", "3.5 Sinusoidal Functions", "AP_Precalculus_3.5_Sinusoidal_Functions_ECHS_Refined.html", ["Construct sinusoidal functions from graphical or contextual information.", "Interpret amplitude, period, phase, and vertical shift.", "Compare equivalent sine and cosine models."]],
    ["6", "3.6 Sinusoidal Function Transformations", "AP_Precalculus_3.6_Sinusoidal_Function_Transformations_ECHS_Refined.html", ["Analyze transformations of sine and cosine functions.", "Predict graph features from parameters.", "Write equations that match transformed graphs."]],
    ["7", "3.7 Sinusoidal Function Context and Data Modeling", "AP_Precalculus_3.7_Sinusoidal_Function_Context_and_Data_Modeling_ECHS_Refined.html", ["Fit sinusoidal models to contextual data.", "Interpret model parameters with units.", "Evaluate predictions and limitations of periodic models."]],
    ["8", "3.8 The Tangent Function", "AP_Precalculus_3.8_The_Tangent_Function_ECHS_Refined.html", ["Graph and analyze the tangent function.", "Identify period, zeros, asymptotes, and intervals of continuity.", "Model tangent behavior using transformations."]],
    ["9", "3.9 Inverse Trigonometric Functions", "AP_Precalculus_3.9_Inverse_Trigonometric_Functions_ECHS_Refined.html", ["Interpret inverse trigonometric functions with restricted domains.", "Evaluate inverse trigonometric expressions.", "Solve contextual problems involving angles."]],
    ["10", "3.10 Trigonometric Equations and Inequalities", "AP_Precalculus_3.10_Trigonometric_Equations_and_Inequalities_ECHS_Refined.html", ["Solve trigonometric equations on specified intervals.", "Represent complete solution sets using periodicity.", "Solve and interpret trigonometric inequalities."]],
    ["11", "3.11 The Secant, Cosecant, and Cotangent Functions", "AP_Precalculus_3.11_The_Secant_Cosecant_and_Cotangent_Functions_ECHS_Refined.html", ["Analyze reciprocal trigonometric functions.", "Determine domains, ranges, asymptotes, and periods.", "Connect reciprocal-function graphs to sine, cosine, and tangent."]],
    ["12", "3.12 Equivalent Representations of Trigonometric Functions", "AP_Precalculus_3.12_Equivalent_Representations_of_Trigonometric_Functions_ECHS_Refined.html", ["Use identities to rewrite trigonometric expressions.", "Select equivalent forms that reveal useful features.", "Verify equivalence algebraically and graphically."]],
    ["13", "3.13 Trigonometry and Polar Coordinates", "AP_Precalculus_3.13_Trigonometry_and_Polar_Coordinates_ECHS_Refined.html", ["Convert between rectangular and polar coordinates.", "Interpret multiple polar representations of a point.", "Use trigonometry to connect coordinate systems."]],
    ["14", "3.14 Polar Function Graphs", "AP_Precalculus_3.14_Polar_Function_Graphs_ECHS_Refined.html", ["Graph polar functions from equations and tables.", "Analyze symmetry, intercepts, and characteristic shapes.", "Relate polar equations to geometric features."]],
    ["15", "3.15 Rates of Change in Polar Functions", "AP_Precalculus_3.15_Rates_of_Change_in_Polar_Functions_ECHS_Refined.html", ["Interpret average rates of change for polar functions.", "Analyze how radius changes with angle.", "Use tables, graphs, and formulas to justify conclusions."]]
  ].map(function (item) {
    var url = "lessons/ap-precalculus/unit-3/" + item[2];
    return {
      number: item[0],
      title: item[1],
      outcomes: item[3],
      resources: [{ label: "Complete interactive lesson", url: url, type: "resource" }],
      url: url,
      status: "ready",
      new: true,
      keywords: (item[1] + " AP Precalculus trigonometric polar periodic functions").toLowerCase().split(/\s+/)
    };
  });

  var unitThree = {
    title: "Unit 3: Trigonometric and Polar Functions",
    description: "Fifteen complete interactive AP Precalculus lessons covering periodic phenomena, trigonometric functions, sinusoidal modeling, equations and inequalities, inverse and reciprocal functions, polar coordinates, polar graphs, and rates of change.",
    portalSummary: "15 interactive lessons · trigonometric and polar functions · complete ECHS lesson sequence",
    essential_questions: [
      "How do circular motion and periodic behavior create trigonometric functions?",
      "How do parameters control the graphs and models of sinusoidal functions?",
      "How can equivalent representations reveal different trigonometric features?",
      "How do polar coordinates and polar functions describe location and change?"
    ],
    lessons: lessons,
    refreshed: true,
    videoSource: "ECHS interactive AP Precalculus lesson sequence"
  };

  function normalize(value) {
    return String(value || "").toLowerCase().replace(/[–—−]/g, "-").replace(/\s+/g, " ").trim();
  }

  var course = window.ECHS_COURSES.find(function (item) {
    if (!item) return false;
    var id = normalize(item.id);
    var labels = [item.course, item.title, item.shortTitle].map(normalize);
    return id === "ap-precalculus-g10-g11" || id === "ap-precalculus" || labels.some(function (label) { return label.indexOf("ap precalculus") >= 0; });
  });

  if (!course) return;
  if (!Array.isArray(course.units)) course.units = [];

  var index = course.units.findIndex(function (unit) {
    return /^unit\s*3(?:\s*:|\b)/i.test(String(unit && unit.title || "").trim());
  });

  if (index >= 0) course.units[index] = unitThree;
  else course.units.splice(Math.min(2, course.units.length), 0, unitThree);

  course.updatedUnits = "Units 1–3 · 44 interactive lessons · complete polynomial, rational, exponential, logarithmic, trigonometric, and polar sequence";
  course.unitCount = course.units.length;
  course.lessonCount = course.units.reduce(function (total, unit) {
    return total + (Array.isArray(unit && unit.lessons) ? unit.lessons.length : 0);
  }, 0);
})();
