/* AP Calculus AB Units 1–5 refresh — generated for ECHS Mathematics. */
(() => {
  const courses = Array.isArray(window.ECHS_COURSES) ? window.ECHS_COURSES : [];
  const course = courses.find(c => c && (c.id === "ap-calculus-ab" || c.course === "G12 AP Calculus AB"));
  if (!course || !Array.isArray(course.units) || course.units.length < 5) {
    console.warn("ECHS AP Calculus refresh: the AP Calculus course or its first five units were not found.");
    return;
  }

  const updates = [
  {
    "portalSummary": "Limits from multiple representations, continuity, asymptotic behavior, and the Intermediate Value Theorem.",
    "lessons": [
      {
        "number": "1.1",
        "title": "Can Change Occur at an Instant?",
        "summary": "Average rate, instantaneous rate, secant slopes, tangent slopes, and the limit idea.",
        "outcomes": [
          "Interpret an instantaneous rate of change as the limit of average rates over shrinking intervals.",
          "Connect secant-line slopes with the slope of a tangent line.",
          "Explain why change at a single instant is defined through a limiting process."
        ],
        "videos": [
          {
            "type": "video",
            "label": "Video · Rates of change",
            "url": "https://www.youtube.com/watch?v=WBHRFnoeesg"
          }
        ],
        "notes": [
          {
            "type": "notes",
            "label": "Notes 1.1 · Rates of Change — add PDF later",
            "url": ""
          }
        ],
        "resources": [
          {
            "type": "practice",
            "label": "Practice 1.1 · Rates of Change — add PDF later",
            "url": ""
          }
        ],
        "url": "lessons/ap-calculus/unit-1/1-1-can-change-occur-at-an-instant.html",
        "status": "ready",
        "kind": "lesson",
        "new": true,
        "keywords": [
          "average",
          "change",
          "connect",
          "defined",
          "explain",
          "idea",
          "instant",
          "instantaneous",
          "interpret",
          "intervals",
          "limit",
          "limiting",
          "line",
          "occur",
          "over",
          "process",
          "rate",
          "rates",
          "secant",
          "secant-line",
          "shrinking",
          "single",
          "slope",
          "slopes",
          "tangent",
          "through",
          "with"
        ]
      },
      {
        "number": "1.2",
        "title": "Defining Limits and Using Limit Notation",
        "summary": "Read every symbol in a limit statement and separate “near” from “at.”",
        "outcomes": [
          "Interpret two-sided and one-sided limit notation in words.",
          "Distinguish nearby function behavior from the value of the function at the target input.",
          "Write precise analytic limit statements from verbal information."
        ],
        "videos": [],
        "notes": [
          {
            "type": "notes",
            "label": "Notes 1.2 · Limit Notation — add PDF later",
            "url": ""
          }
        ],
        "resources": [
          {
            "type": "practice",
            "label": "Practice 1.2 · Limit Notation — add PDF later",
            "url": ""
          }
        ],
        "url": "lessons/ap-calculus/unit-1/1-2-defining-limits-and-using-limit-notation.html",
        "status": "ready",
        "kind": "lesson",
        "new": true,
        "keywords": [
          "analytic",
          "behavior",
          "defining",
          "distinguish",
          "every",
          "from",
          "function",
          "information",
          "input",
          "interpret",
          "limit",
          "limits",
          "near",
          "nearby",
          "notation",
          "one-sided",
          "precise",
          "read",
          "separate",
          "statement",
          "statements",
          "symbol",
          "target",
          "two-sided",
          "using",
          "value",
          "verbal",
          "words",
          "write"
        ]
      },
      {
        "number": "1.3",
        "title": "Estimating Limit Values from Graphs",
        "summary": "Estimate limits visually while keeping the point value separate from the limit.",
        "outcomes": [
          "Estimate one-sided and two-sided limits from a graph.",
          "Use open and closed points correctly when interpreting nearby behavior.",
          "Identify graph evidence for a limit that does not exist."
        ],
        "videos": [
          {
            "type": "video",
            "label": "Video · Limits from graphs",
            "url": "https://www.youtube.com/watch?v=7gtt9PH_nJQ"
          }
        ],
        "notes": [
          {
            "type": "notes",
            "label": "Notes 1.3 · Limits from Graphs — add PDF later",
            "url": ""
          }
        ],
        "resources": [
          {
            "type": "practice",
            "label": "Practice 1.3 · Limits from Graphs — add PDF later",
            "url": ""
          }
        ],
        "url": "lessons/ap-calculus/unit-1/1-3-estimating-limit-values-from-graphs.html",
        "status": "ready",
        "kind": "lesson",
        "new": true,
        "keywords": [
          "behavior",
          "closed",
          "correctly",
          "does",
          "estimate",
          "estimating",
          "evidence",
          "exist",
          "from",
          "graph",
          "graphs",
          "identify",
          "interpreting",
          "keeping",
          "limit",
          "limits",
          "nearby",
          "one-sided",
          "open",
          "point",
          "points",
          "separate",
          "that",
          "two-sided",
          "value",
          "values",
          "visually",
          "when",
          "while"
        ]
      },
      {
        "number": "1.4",
        "title": "Estimating Limit Values from Tables",
        "summary": "Design and read numerical evidence approaching a target from the left and right.",
        "outcomes": [
          "Choose input values that approach a target from both sides.",
          "Estimate one-sided and two-sided limits from numerical trends.",
          "State only the precision supported by the table."
        ],
        "videos": [
          {
            "type": "video",
            "label": "Video · Understanding limits",
            "url": "https://www.youtube.com/watch?v=7gtt9PH_nJQ"
          }
        ],
        "notes": [
          {
            "type": "notes",
            "label": "Notes 1.4 · Limits from Tables — add PDF later",
            "url": ""
          }
        ],
        "resources": [
          {
            "type": "practice",
            "label": "Practice 1.4 · Limits from Tables — add PDF later",
            "url": ""
          }
        ],
        "url": "lessons/ap-calculus/unit-1/1-4-estimating-limit-values-from-tables.html",
        "status": "ready",
        "kind": "lesson",
        "new": true,
        "keywords": [
          "approach",
          "approaching",
          "both",
          "choose",
          "design",
          "estimate",
          "estimating",
          "evidence",
          "from",
          "input",
          "left",
          "limit",
          "limits",
          "numerical",
          "one-sided",
          "only",
          "precision",
          "read",
          "right",
          "sides",
          "state",
          "supported",
          "table",
          "tables",
          "target",
          "that",
          "trends",
          "two-sided",
          "values"
        ]
      },
      {
        "number": "1.5",
        "title": "Determining Limits Using Algebraic Properties of Limits",
        "summary": "Evaluate limits efficiently using the algebra of limits.",
        "outcomes": [
          "Apply sum, difference, constant multiple, product, quotient, and power limit laws.",
          "Determine when direct substitution is justified.",
          "Use limit properties to justify each step of an evaluation."
        ],
        "videos": [
          {
            "type": "video",
            "label": "Video · Properties of limits",
            "url": "https://www.youtube.com/watch?v=R2QQTBQtjpw"
          }
        ],
        "notes": [
          {
            "type": "notes",
            "label": "Notes 1.5 · Algebraic Properties — add PDF later",
            "url": ""
          }
        ],
        "resources": [
          {
            "type": "practice",
            "label": "Practice 1.5 · Algebraic Properties — add PDF later",
            "url": ""
          }
        ],
        "url": "lessons/ap-calculus/unit-1/1-5-algebraic-properties-of-limits.html",
        "status": "ready",
        "kind": "lesson",
        "new": true,
        "keywords": [
          "algebra",
          "algebraic",
          "apply",
          "constant",
          "determine",
          "determining",
          "difference",
          "direct",
          "each",
          "efficiently",
          "evaluate",
          "evaluation",
          "justified",
          "justify",
          "laws",
          "limit",
          "limits",
          "multiple",
          "power",
          "product",
          "properties",
          "quotient",
          "step",
          "substitution",
          "using",
          "when"
        ]
      },
      {
        "number": "1.6",
        "title": "Determining Limits Using Algebraic Manipulation",
        "summary": "Factor, rationalize, and simplify without changing nearby behavior.",
        "outcomes": [
          "Rewrite indeterminate expressions into equivalent forms before evaluating a limit.",
          "Use factoring, rationalizing, and common denominators to remove removable barriers.",
          "State domain restrictions while using an equivalent nearby expression."
        ],
        "videos": [
          {
            "type": "video",
            "label": "Video · Finding limits analytically",
            "url": "https://www.youtube.com/watch?v=US_AM8i7Zzo"
          }
        ],
        "notes": [
          {
            "type": "notes",
            "label": "Notes 1.6 · Algebraic Manipulation — add PDF later",
            "url": ""
          }
        ],
        "resources": [
          {
            "type": "practice",
            "label": "Practice 1.6 · Algebraic Manipulation — add PDF later",
            "url": ""
          }
        ],
        "url": "lessons/ap-calculus/unit-1/1-6-algebraic-manipulation.html",
        "status": "ready",
        "kind": "lesson",
        "new": true,
        "keywords": [
          "algebraic",
          "barriers",
          "before",
          "behavior",
          "changing",
          "common",
          "denominators",
          "determining",
          "domain",
          "equivalent",
          "evaluating",
          "expression",
          "expressions",
          "factor",
          "factoring",
          "forms",
          "indeterminate",
          "into",
          "limit",
          "limits",
          "manipulation",
          "nearby",
          "rationalize",
          "rationalizing",
          "removable",
          "remove",
          "restrictions",
          "rewrite",
          "simplify",
          "state",
          "using",
          "while",
          "without"
        ]
      },
      {
        "number": "1.7",
        "title": "Selecting Procedures for Determining Limits",
        "summary": "Choose the method from the mathematical structure rather than from habit.",
        "outcomes": [
          "Classify a limit problem before choosing a procedure.",
          "Select direct substitution, algebraic manipulation, a graph, a table, or another theorem appropriately.",
          "Explain why the selected procedure is valid."
        ],
        "videos": [
          {
            "type": "video",
            "label": "Video · Analytic limit procedures",
            "url": "https://www.youtube.com/watch?v=US_AM8i7Zzo"
          }
        ],
        "notes": [
          {
            "type": "notes",
            "label": "Notes 1.7 · Selecting Procedures — add PDF later",
            "url": ""
          }
        ],
        "resources": [
          {
            "type": "practice",
            "label": "Practice 1.7 · Selecting Procedures — add PDF later",
            "url": ""
          }
        ],
        "url": "lessons/ap-calculus/unit-1/1-7-selecting-limit-procedures.html",
        "status": "ready",
        "kind": "lesson",
        "new": true,
        "keywords": [
          "algebraic",
          "another",
          "appropriately",
          "before",
          "choose",
          "choosing",
          "classify",
          "determining",
          "direct",
          "explain",
          "from",
          "graph",
          "habit",
          "limit",
          "limits",
          "manipulation",
          "mathematical",
          "method",
          "problem",
          "procedure",
          "procedures",
          "rather",
          "select",
          "selected",
          "selecting",
          "structure",
          "substitution",
          "table",
          "than",
          "theorem",
          "valid"
        ]
      },
      {
        "number": "1.8",
        "title": "Determining Limits Using the Squeeze Theorem",
        "summary": "Trap a difficult function between two simpler functions that share a limit.",
        "outcomes": [
          "Recognize when a function is trapped between two functions with the same limit.",
          "Apply the Squeeze Theorem with correct inequalities and notation.",
          "Use the theorem for oscillatory and trigonometric limit behavior."
        ],
        "videos": [
          {
            "type": "video",
            "label": "Video · Transcendental limits and squeeze",
            "url": "https://www.youtube.com/watch?v=_wHQyVjKnHs"
          }
        ],
        "notes": [
          {
            "type": "notes",
            "label": "Notes 1.8 · Squeeze Theorem — add PDF later",
            "url": ""
          }
        ],
        "resources": [
          {
            "type": "practice",
            "label": "Practice 1.8 · Squeeze Theorem — add PDF later",
            "url": ""
          }
        ],
        "url": "lessons/ap-calculus/unit-1/1-8-squeeze-theorem.html",
        "status": "ready",
        "kind": "lesson",
        "new": true,
        "keywords": [
          "apply",
          "behavior",
          "between",
          "correct",
          "determining",
          "difficult",
          "function",
          "functions",
          "inequalities",
          "limit",
          "limits",
          "notation",
          "oscillatory",
          "recognize",
          "same",
          "share",
          "simpler",
          "squeeze",
          "that",
          "theorem",
          "trap",
          "trapped",
          "trigonometric",
          "using",
          "when",
          "with"
        ]
      },
      {
        "number": "1.9",
        "title": "Connecting Multiple Representations of Limits",
        "summary": "Move fluently among graphical, numerical, symbolic, and verbal evidence.",
        "outcomes": [
          "Translate limit information among graphs, tables, formulas, and verbal descriptions.",
          "Check whether different representations provide consistent one-sided evidence.",
          "Construct one representation from limit conditions stated in another."
        ],
        "videos": [
          {
            "type": "video",
            "label": "Video · Limits of composite functions",
            "url": "https://www.youtube.com/watch?v=SBC4l9WMyD0"
          }
        ],
        "notes": [
          {
            "type": "notes",
            "label": "Notes 1.9 · Multiple Representations — add PDF later",
            "url": ""
          }
        ],
        "resources": [
          {
            "type": "practice",
            "label": "Practice 1.9 · Multiple Representations — add PDF later",
            "url": ""
          }
        ],
        "url": "lessons/ap-calculus/unit-1/1-9-multiple-representations-of-limits.html",
        "status": "ready",
        "kind": "lesson",
        "new": true,
        "keywords": [
          "among",
          "another",
          "check",
          "conditions",
          "connecting",
          "consistent",
          "construct",
          "descriptions",
          "different",
          "evidence",
          "fluently",
          "formulas",
          "from",
          "graphical",
          "graphs",
          "information",
          "limit",
          "limits",
          "move",
          "multiple",
          "numerical",
          "one-sided",
          "provide",
          "representation",
          "representations",
          "stated",
          "symbolic",
          "tables",
          "translate",
          "verbal",
          "whether"
        ]
      },
      {
        "number": "1.10",
        "title": "Exploring Types of Discontinuities",
        "summary": "Classify a break only after checking its left-hand and right-hand behavior.",
        "outcomes": [
          "Classify removable, jump, and infinite discontinuities.",
          "Use one-sided limit notation as evidence for a classification.",
          "Distinguish named discontinuities from other failures of a limit."
        ],
        "videos": [
          {
            "type": "video",
            "label": "Video · Limits and continuity",
            "url": "https://www.youtube.com/watch?v=OaVvLnD3cLU"
          }
        ],
        "notes": [
          {
            "type": "notes",
            "label": "Notes 1.10 · Types of Discontinuities — add PDF later",
            "url": ""
          }
        ],
        "resources": [
          {
            "type": "practice",
            "label": "Practice 1.10 · Discontinuities — add PDF later",
            "url": ""
          }
        ],
        "url": "lessons/ap-calculus/unit-1/1-10-types-of-discontinuities.html",
        "status": "ready",
        "kind": "lesson",
        "new": true,
        "keywords": [
          "after",
          "behavior",
          "break",
          "checking",
          "classification",
          "classify",
          "discontinuities",
          "distinguish",
          "evidence",
          "exploring",
          "failures",
          "from",
          "infinite",
          "jump",
          "left-hand",
          "limit",
          "named",
          "notation",
          "one-sided",
          "only",
          "other",
          "removable",
          "right-hand",
          "types"
        ]
      },
      {
        "number": "1.11",
        "title": "Defining Continuity at a Point",
        "summary": "Treat continuity as a definition to verify, not merely a visual impression.",
        "outcomes": [
          "State and apply the three conditions for continuity at a point.",
          "Identify the first continuity condition that fails.",
          "Verify continuity from graphical, numerical, and analytic evidence."
        ],
        "videos": [
          {
            "type": "video",
            "label": "Video · Limits and continuity",
            "url": "https://www.youtube.com/watch?v=OaVvLnD3cLU"
          }
        ],
        "notes": [
          {
            "type": "notes",
            "label": "Notes 1.11 · Continuity at a Point — add PDF later",
            "url": ""
          }
        ],
        "resources": [
          {
            "type": "practice",
            "label": "Practice 1.11 · Continuity at a Point — add PDF later",
            "url": ""
          }
        ],
        "url": "lessons/ap-calculus/unit-1/1-11-continuity-at-a-point.html",
        "status": "ready",
        "kind": "lesson",
        "new": true,
        "keywords": [
          "analytic",
          "apply",
          "condition",
          "conditions",
          "continuity",
          "defining",
          "definition",
          "evidence",
          "fails",
          "first",
          "from",
          "graphical",
          "identify",
          "impression",
          "merely",
          "numerical",
          "point",
          "state",
          "that",
          "three",
          "treat",
          "verify",
          "visual"
        ]
      },
      {
        "number": "1.12",
        "title": "Confirming Continuity over an Interval",
        "summary": "Justify continuity on an entire interval, including its endpoints.",
        "outcomes": [
          "Determine intervals on which a function is continuous.",
          "Use one-sided continuity conditions at endpoints.",
          "Combine domain restrictions with continuity theorems to justify an interval."
        ],
        "videos": [
          {
            "type": "video",
            "label": "Video · Continuity on intervals",
            "url": "https://www.youtube.com/watch?v=OaVvLnD3cLU"
          }
        ],
        "notes": [
          {
            "type": "notes",
            "label": "Notes 1.12 · Continuity over an Interval — add PDF later",
            "url": ""
          }
        ],
        "resources": [
          {
            "type": "practice",
            "label": "Practice 1.12 · Continuity over an Interval — add PDF later",
            "url": ""
          }
        ],
        "url": "lessons/ap-calculus/unit-1/1-12-continuity-over-an-interval.html",
        "status": "ready",
        "kind": "lesson",
        "new": true,
        "keywords": [
          "combine",
          "conditions",
          "confirming",
          "continuity",
          "continuous",
          "determine",
          "domain",
          "endpoints",
          "entire",
          "function",
          "including",
          "interval",
          "intervals",
          "justify",
          "one-sided",
          "over",
          "restrictions",
          "theorems",
          "which",
          "with"
        ]
      },
      {
        "number": "1.13",
        "title": "Removing Discontinuities",
        "summary": "Match the function value to the limiting behavior when a repair is possible.",
        "outcomes": [
          "Decide whether a discontinuity is removable.",
          "Find the unique point value or parameter that repairs a removable discontinuity.",
          "Explain why jump or infinite discontinuities cannot be repaired by changing one point value."
        ],
        "videos": [
          {
            "type": "video",
            "label": "Video · Continuity and parameters",
            "url": "https://www.youtube.com/watch?v=OaVvLnD3cLU"
          }
        ],
        "notes": [
          {
            "type": "notes",
            "label": "Notes 1.13 · Removing Discontinuities — add PDF later",
            "url": ""
          }
        ],
        "resources": [
          {
            "type": "practice",
            "label": "Practice 1.13 · Removing Discontinuities — add PDF later",
            "url": ""
          }
        ],
        "url": "lessons/ap-calculus/unit-1/1-13-removing-discontinuities.html",
        "status": "ready",
        "kind": "lesson",
        "new": true,
        "keywords": [
          "behavior",
          "cannot",
          "changing",
          "decide",
          "discontinuities",
          "discontinuity",
          "explain",
          "find",
          "function",
          "infinite",
          "jump",
          "limiting",
          "match",
          "parameter",
          "point",
          "possible",
          "removable",
          "removing",
          "repair",
          "repaired",
          "repairs",
          "that",
          "unique",
          "value",
          "when",
          "whether"
        ]
      },
      {
        "number": "1.14",
        "title": "Connecting Infinite Limits and Vertical Asymptotes",
        "summary": "Translate local sign behavior into one-sided infinite-limit notation.",
        "outcomes": [
          "Interpret one-sided infinite limits with correct sign and direction.",
          "Use local factor signs to determine vertical-asymptote behavior.",
          "Distinguish a vertical asymptote from a removable hole."
        ],
        "videos": [
          {
            "type": "video",
            "label": "Video · Infinite limits",
            "url": "https://www.youtube.com/watch?v=6EW1AfIG0QY&ab_channel=JeanAdams"
          }
        ],
        "notes": [
          {
            "type": "notes",
            "label": "Notes 1.14 · Infinite Limits — add PDF later",
            "url": ""
          }
        ],
        "resources": [
          {
            "type": "practice",
            "label": "Practice 1.14 · Vertical Asymptotes — add PDF later",
            "url": ""
          }
        ],
        "url": "lessons/ap-calculus/unit-1/1-14-infinite-limits-and-vertical-asymptotes.html",
        "status": "ready",
        "kind": "lesson",
        "new": true,
        "keywords": [
          "asymptote",
          "asymptotes",
          "behavior",
          "connecting",
          "correct",
          "determine",
          "direction",
          "distinguish",
          "factor",
          "from",
          "hole",
          "infinite",
          "infinite-limit",
          "interpret",
          "into",
          "limits",
          "local",
          "notation",
          "one-sided",
          "removable",
          "sign",
          "signs",
          "translate",
          "vertical",
          "vertical-asymptote",
          "with"
        ]
      },
      {
        "number": "1.15",
        "title": "Connecting Limits at Infinity and Horizontal Asymptotes",
        "summary": "Describe left-end and right-end behavior with precise limit notation.",
        "outcomes": [
          "Evaluate limits as x approaches positive or negative infinity.",
          "Determine horizontal asymptotes from end behavior.",
          "Analyze the two ends separately and use dominant terms appropriately."
        ],
        "videos": [
          {
            "type": "video",
            "label": "Video · Limits at infinity",
            "url": "https://www.youtube.com/watch?v=6EW1AfIG0QY&ab_channel=JeanAdams"
          }
        ],
        "notes": [
          {
            "type": "notes",
            "label": "Notes 1.15 · Limits at Infinity — add PDF later",
            "url": ""
          }
        ],
        "resources": [
          {
            "type": "practice",
            "label": "Practice 1.15 · Horizontal Asymptotes — add PDF later",
            "url": ""
          }
        ],
        "url": "lessons/ap-calculus/unit-1/1-15-limits-at-infinity-and-horizontal-asymptotes.html",
        "status": "ready",
        "kind": "lesson",
        "new": true,
        "keywords": [
          "analyze",
          "approaches",
          "appropriately",
          "asymptotes",
          "behavior",
          "connecting",
          "describe",
          "determine",
          "dominant",
          "ends",
          "evaluate",
          "from",
          "horizontal",
          "infinity",
          "left-end",
          "limit",
          "limits",
          "negative",
          "notation",
          "positive",
          "precise",
          "right-end",
          "separately",
          "terms",
          "with"
        ]
      },
      {
        "number": "1.16",
        "title": "Working with the Intermediate Value Theorem",
        "summary": "Use continuity to prove that a function attains an intermediate value.",
        "outcomes": [
          "Verify the hypotheses of the Intermediate Value Theorem on a closed interval.",
          "Use the theorem to guarantee the existence of an input with a specified output value.",
          "State clearly what the theorem guarantees and what it does not locate."
        ],
        "videos": [
          {
            "type": "video",
            "label": "Video · Intermediate Value Theorem",
            "url": "https://www.youtube.com/watch?v=YYs4conCPV0&ab_channel=JeanAdams"
          }
        ],
        "notes": [
          {
            "type": "notes",
            "label": "Notes 1.16 · Intermediate Value Theorem — add PDF later",
            "url": ""
          }
        ],
        "resources": [
          {
            "type": "practice",
            "label": "Practice 1.16 · Intermediate Value Theorem — add PDF later",
            "url": ""
          }
        ],
        "url": "lessons/ap-calculus/unit-1/1-16-intermediate-value-theorem.html",
        "status": "ready",
        "kind": "lesson",
        "new": true,
        "keywords": [
          "attains",
          "clearly",
          "closed",
          "continuity",
          "does",
          "existence",
          "function",
          "guarantee",
          "guarantees",
          "hypotheses",
          "input",
          "intermediate",
          "interval",
          "locate",
          "output",
          "prove",
          "specified",
          "state",
          "that",
          "theorem",
          "value",
          "verify",
          "what",
          "with",
          "working"
        ]
      },
      {
        "number": "1.R",
        "title": "Unit 1 Review",
        "summary": "Consolidated review of limits and continuity.",
        "outcomes": [],
        "videos": [],
        "notes": [],
        "resources": [
          {
            "type": "document",
            "label": "Unit 1 Test Review.docx — add file later",
            "url": ""
          },
          {
            "type": "document",
            "label": "AP-Style Unit 1 Test Review.docx — add file later",
            "url": ""
          }
        ],
        "url": "",
        "status": "flow",
        "kind": "review",
        "new": false,
        "keywords": [
          "consolidated",
          "continuity",
          "limits",
          "review",
          "unit"
        ]
      },
      {
        "number": "1.A",
        "title": "Unit 1 Assessment: Limits and Continuity",
        "summary": "Interactive assessment for the complete limits and continuity unit.",
        "outcomes": [],
        "videos": [],
        "notes": [],
        "resources": [],
        "url": "lessons/ap-calculus/unit-1/unit-1-assessment.html",
        "status": "ready",
        "kind": "assessment",
        "new": true,
        "openLabel": "Open Assessment",
        "keywords": [
          "assessment",
          "complete",
          "continuity",
          "interactive",
          "limits",
          "unit"
        ]
      }
    ]
  },
  {
    "title": "Unit 2: Differentiation—Definition and Fundamental Properties",
    "portalSummary": "The derivative as a limit, tangent lines, differentiability, and foundational derivative rules.",
    "lessons": [
      {
        "number": "2.1",
        "title": "Rates of Change and Tangent Lines",
        "summary": "Average rates, secant lines, tangent lines, and the move toward an instant.",
        "outcomes": [
          "Determine average rates of change using difference quotients.",
          "Interpret secant-line slope in graphical and contextual settings.",
          "Connect shrinking intervals with an instantaneous rate of change."
        ],
        "videos": [
          {
            "type": "video",
            "label": "Video · Rates of change",
            "url": "https://youtu.be/Gzl7Yvj9ukQ"
          }
        ],
        "notes": [
          {
            "type": "notes",
            "label": "Notes 2.1 · Rates of Change — add PDF later",
            "url": ""
          }
        ],
        "resources": [
          {
            "type": "practice",
            "label": "Practice 2.1 · Rates of Change — add PDF later",
            "url": ""
          }
        ],
        "url": "lessons/ap-calculus/unit-2/2-1-rates-of-change-and-tangent-lines.html",
        "status": "ready",
        "kind": "lesson",
        "new": true,
        "keywords": [
          "average",
          "change",
          "connect",
          "contextual",
          "determine",
          "difference",
          "graphical",
          "instant",
          "instantaneous",
          "interpret",
          "intervals",
          "lines",
          "move",
          "quotients",
          "rate",
          "rates",
          "secant",
          "secant-line",
          "settings",
          "shrinking",
          "slope",
          "tangent",
          "toward",
          "using",
          "with"
        ]
      },
      {
        "number": "2.2",
        "title": "Tangent Lines and the Derivative",
        "summary": "Build the derivative from secant slopes and use it to write tangent equations.",
        "outcomes": [
          "Represent the derivative as a limit of a difference quotient.",
          "Interpret the derivative as tangent-line slope and instantaneous rate of change.",
          "Write the equation of a tangent line at a specified point."
        ],
        "videos": [
          {
            "type": "video",
            "label": "Video · Tangent lines and derivatives",
            "url": "https://youtu.be/TeGtoWO7dHU"
          }
        ],
        "notes": [
          {
            "type": "notes",
            "label": "Notes 2.2 · Tangent Lines and Derivatives — add PDF later",
            "url": ""
          }
        ],
        "resources": [
          {
            "type": "practice",
            "label": "Practice 2.2 · Tangent Lines and Derivatives — add PDF later",
            "url": ""
          }
        ],
        "url": "lessons/ap-calculus/unit-2/2-2-tangent-lines-and-the-derivative.html",
        "status": "ready",
        "kind": "lesson",
        "new": true,
        "keywords": [
          "build",
          "change",
          "derivative",
          "difference",
          "equation",
          "equations",
          "from",
          "instantaneous",
          "interpret",
          "limit",
          "line",
          "lines",
          "point",
          "quotient",
          "rate",
          "represent",
          "secant",
          "slope",
          "slopes",
          "specified",
          "tangent",
          "tangent-line",
          "write"
        ]
      },
      {
        "number": "2.3",
        "title": "The Derivative: Graphs, Differentiability, and Continuity",
        "summary": "Read derivatives graphically and diagnose where a derivative exists.",
        "outcomes": [
          "Estimate derivative values from graphs and tables.",
          "Recognize corners, cusps, vertical tangents, and discontinuities where differentiability may fail.",
          "Explain why differentiability implies continuity and why the converse is not always true.",
          "Connect the graph of a function with the behavior of its derivative."
        ],
        "videos": [
          {
            "type": "video",
            "label": "Video · Understanding the derivative",
            "url": "https://youtu.be/asjswjmE6Qw"
          },
          {
            "type": "video",
            "label": "Video · Differentiability and continuity",
            "url": "https://youtu.be/RvSx7rR0W1k"
          }
        ],
        "notes": [
          {
            "type": "notes",
            "label": "Notes 2.3 · Derivative Graphs — add PDF later",
            "url": ""
          },
          {
            "type": "notes",
            "label": "Notes 2.3 · Differentiability and Continuity — add PDF later",
            "url": ""
          }
        ],
        "resources": [
          {
            "type": "practice",
            "label": "Practice 2.3 · Derivatives and Continuity — add PDF later",
            "url": ""
          }
        ],
        "url": "lessons/ap-calculus/unit-2/2-3-derivative-graphs-differentiability-continuity.html",
        "status": "ready",
        "kind": "lesson",
        "new": true,
        "keywords": [
          "always",
          "behavior",
          "connect",
          "continuity",
          "converse",
          "corners",
          "cusps",
          "derivative",
          "derivatives",
          "diagnose",
          "differentiability",
          "discontinuities",
          "estimate",
          "exists",
          "explain",
          "fail",
          "from",
          "function",
          "graph",
          "graphically",
          "graphs",
          "implies",
          "read",
          "recognize",
          "tables",
          "tangents",
          "true",
          "values",
          "vertical",
          "where",
          "with"
        ]
      },
      {
        "number": "2.4",
        "title": "Basic Derivative Rules",
        "summary": "Develop fluency with the foundational rules of differentiation.",
        "outcomes": [
          "Differentiate constants, powers, sums, differences, and constant multiples.",
          "Calculate derivatives of familiar algebraic, exponential, logarithmic, and trigonometric functions.",
          "Select and apply rules in the correct order."
        ],
        "videos": [
          {
            "type": "video",
            "label": "Video · Basic derivative rules",
            "url": "https://youtu.be/trax2z3k9Ko"
          }
        ],
        "notes": [
          {
            "type": "notes",
            "label": "Notes 2.4 · Basic Differentiation Rules — add PDF later",
            "url": ""
          }
        ],
        "resources": [
          {
            "type": "practice",
            "label": "Practice 2.4 · Basic Differentiation Rules — add PDF later",
            "url": ""
          }
        ],
        "url": "lessons/ap-calculus/unit-2/2-4-basic-derivative-rules.html",
        "status": "ready",
        "kind": "lesson",
        "new": true,
        "keywords": [
          "algebraic",
          "apply",
          "basic",
          "calculate",
          "constant",
          "constants",
          "correct",
          "derivative",
          "derivatives",
          "develop",
          "differences",
          "differentiate",
          "differentiation",
          "exponential",
          "familiar",
          "fluency",
          "foundational",
          "functions",
          "logarithmic",
          "multiples",
          "order",
          "powers",
          "rules",
          "select",
          "sums",
          "trigonometric",
          "with"
        ]
      },
      {
        "number": "2.5",
        "title": "Product and Quotient Rules",
        "summary": "Differentiate combinations of functions without expanding unnecessarily.",
        "outcomes": [
          "Differentiate products of differentiable functions.",
          "Differentiate quotients while tracking order and signs accurately.",
          "Use product and quotient rules with tables, graphs, and composite expressions."
        ],
        "videos": [
          {
            "type": "video",
            "label": "Video · Product and quotient rules",
            "url": "https://youtu.be/3ij3oGnJ5yc"
          }
        ],
        "notes": [
          {
            "type": "notes",
            "label": "Notes 2.5 · Product and Quotient Rules — add PDF later",
            "url": ""
          }
        ],
        "resources": [
          {
            "type": "practice",
            "label": "Practice 2.5 · Product and Quotient Rules — add PDF later",
            "url": ""
          }
        ],
        "url": "lessons/ap-calculus/unit-2/2-5-product-and-quotient-rules.html",
        "status": "ready",
        "kind": "lesson",
        "new": true,
        "keywords": [
          "accurately",
          "combinations",
          "composite",
          "differentiable",
          "differentiate",
          "expanding",
          "expressions",
          "functions",
          "graphs",
          "order",
          "product",
          "products",
          "quotient",
          "quotients",
          "rules",
          "signs",
          "tables",
          "tracking",
          "unnecessarily",
          "while",
          "with",
          "without"
        ]
      },
      {
        "number": "2.R",
        "title": "Unit 2 Review",
        "summary": "Review the derivative definition and fundamental derivative rules.",
        "outcomes": [],
        "videos": [],
        "notes": [],
        "resources": [
          {
            "type": "document",
            "label": "Unit 2 End Unit Test Review.docx — add file later",
            "url": ""
          },
          {
            "type": "document",
            "label": "AP-Style Unit 2 Test Review.docx — add file later",
            "url": ""
          }
        ],
        "url": "",
        "status": "flow",
        "kind": "review",
        "new": false,
        "keywords": [
          "definition",
          "derivative",
          "fundamental",
          "review",
          "rules",
          "unit"
        ]
      },
      {
        "number": "2.A",
        "title": "Unit 2 Assessment",
        "summary": "Assessment placeholder; add the assessment file when ready.",
        "outcomes": [],
        "videos": [],
        "notes": [],
        "resources": [],
        "url": "",
        "status": "flow",
        "kind": "assessment",
        "new": false,
        "keywords": [
          "assessment",
          "file",
          "placeholder",
          "ready",
          "unit",
          "when"
        ]
      }
    ]
  },
  {
    "portalSummary": "Chain rule, implicit differentiation, and derivatives of inverse and inverse trigonometric functions.",
    "lessons": [
      {
        "number": "3.1",
        "title": "The Chain Rule",
        "summary": "Differentiate layers of composition while preserving the structure of the function.",
        "outcomes": [
          "Recognize composite functions and identify their inner and outer functions.",
          "Differentiate composite functions using the chain rule in multiple notations.",
          "Select and combine derivative rules in symbolic, tabular, graphical, and AP-style settings."
        ],
        "videos": [
          {
            "type": "video",
            "label": "Video · Chain Rule",
            "url": "https://youtu.be/Fo4ejuviOL8"
          },
          {
            "type": "video",
            "label": "Video · Selecting differentiation procedures",
            "url": "https://youtu.be/UsBi6jG9nsc"
          }
        ],
        "notes": [
          {
            "type": "notes",
            "label": "Notes 3.1 · Chain Rule — add PDF later",
            "url": ""
          }
        ],
        "resources": [
          {
            "type": "practice",
            "label": "Practice 3.1 · Chain Rule — add PDF later",
            "url": ""
          }
        ],
        "url": "lessons/ap-calculus/unit-3/3-1-chain-rule.html",
        "status": "ready",
        "kind": "lesson",
        "new": true,
        "keywords": [
          "ap-style",
          "chain",
          "combine",
          "composite",
          "composition",
          "derivative",
          "differentiate",
          "function",
          "functions",
          "graphical",
          "identify",
          "inner",
          "layers",
          "multiple",
          "notations",
          "outer",
          "preserving",
          "recognize",
          "rule",
          "rules",
          "select",
          "settings",
          "structure",
          "symbolic",
          "tabular",
          "their",
          "using",
          "while"
        ]
      },
      {
        "number": "3.2",
        "title": "Implicit Differentiation",
        "summary": "Differentiate both variables with respect to the same independent variable.",
        "outcomes": [
          "Differentiate equations in which y is defined implicitly as a function of x.",
          "Apply the chain rule to terms containing y and solve algebraically for dy/dx.",
          "Find tangent slopes and higher derivatives on implicit curves."
        ],
        "videos": [
          {
            "type": "video",
            "label": "Video · Implicit differentiation",
            "url": "https://youtu.be/t7rsNlPedho"
          }
        ],
        "notes": [
          {
            "type": "notes",
            "label": "Notes 3.2 · Implicit Differentiation — add PDF later",
            "url": ""
          }
        ],
        "resources": [
          {
            "type": "practice",
            "label": "Practice 3.2 · Implicit Differentiation — add PDF later",
            "url": ""
          }
        ],
        "url": "lessons/ap-calculus/unit-3/3-2-implicit-differentiation.html",
        "status": "ready",
        "kind": "lesson",
        "new": true,
        "keywords": [
          "algebraically",
          "apply",
          "both",
          "chain",
          "containing",
          "curves",
          "defined",
          "derivatives",
          "differentiate",
          "differentiation",
          "equations",
          "find",
          "function",
          "higher",
          "implicit",
          "implicitly",
          "independent",
          "respect",
          "rule",
          "same",
          "slopes",
          "solve",
          "tangent",
          "terms",
          "variable",
          "variables",
          "which",
          "with"
        ]
      },
      {
        "number": "3.3",
        "title": "Inverse Function and Inverse Trigonometric Derivatives",
        "summary": "Use reciprocal slope relationships to differentiate inverses.",
        "outcomes": [
          "Use the derivative-of-an-inverse formula from values, tables, graphs, and formulas.",
          "Differentiate inverse trigonometric functions.",
          "Combine inverse-function derivatives with the chain, product, and quotient rules."
        ],
        "videos": [
          {
            "type": "video",
            "label": "Video · Derivatives of inverse functions",
            "url": "https://youtu.be/tmng5k5xOWs"
          },
          {
            "type": "video",
            "label": "Video · Inverse trigonometric derivatives",
            "url": "https://youtu.be/SgVhqnxqFzw"
          }
        ],
        "notes": [
          {
            "type": "notes",
            "label": "Notes 3.3 · Inverse Functions — add PDF later",
            "url": ""
          },
          {
            "type": "notes",
            "label": "Notes 3.3 · Inverse Trigonometric Functions — add PDF later",
            "url": ""
          }
        ],
        "resources": [
          {
            "type": "practice",
            "label": "Practice 3.3 · Inverse and Inverse Trig Derivatives — add PDF later",
            "url": ""
          }
        ],
        "url": "lessons/ap-calculus/unit-3/3-3-inverse-function-and-inverse-trig-derivatives.html",
        "status": "ready",
        "kind": "lesson",
        "new": true,
        "keywords": [
          "chain",
          "combine",
          "derivative-of-an-inverse",
          "derivatives",
          "differentiate",
          "formula",
          "formulas",
          "from",
          "function",
          "functions",
          "graphs",
          "inverse",
          "inverse-function",
          "inverses",
          "product",
          "quotient",
          "reciprocal",
          "relationships",
          "rules",
          "slope",
          "tables",
          "trigonometric",
          "values",
          "with"
        ]
      },
      {
        "number": "3.R",
        "title": "Unit 3 Review",
        "summary": "Review composite, implicit, and inverse differentiation.",
        "outcomes": [],
        "videos": [],
        "notes": [],
        "resources": [
          {
            "type": "document",
            "label": "Unit 3 Test Review.docx — add file later",
            "url": ""
          },
          {
            "type": "document",
            "label": "AP-Style Unit 3 End Unit Review.docx — add file later",
            "url": ""
          }
        ],
        "url": "",
        "status": "flow",
        "kind": "review",
        "new": false,
        "keywords": [
          "composite",
          "differentiation",
          "implicit",
          "inverse",
          "review",
          "unit"
        ]
      },
      {
        "number": "3.A",
        "title": "Unit 3 Assessment",
        "summary": "Assessment placeholder; add the assessment file when ready.",
        "outcomes": [],
        "videos": [],
        "notes": [],
        "resources": [],
        "url": "",
        "status": "flow",
        "kind": "assessment",
        "new": false,
        "keywords": [
          "assessment",
          "file",
          "placeholder",
          "ready",
          "unit",
          "when"
        ]
      }
    ]
  },
  {
    "portalSummary": "Interpret derivatives in context through motion, related rates, linearization, and L’Hôpital’s Rule.",
    "lessons": [
      {
        "number": "4.1",
        "title": "Interpretations of the Derivative",
        "summary": "Translate derivative notation into contextual meaning and units.",
        "outcomes": [
          "Interpret the derivative as an instantaneous rate of change in context.",
          "State and use correct derivative units.",
          "Explain derivative values verbally, numerically, graphically, and symbolically."
        ],
        "videos": [
          {
            "type": "video",
            "label": "Video · Interpretations of the derivative",
            "url": "https://youtu.be/sdcFbspSTes"
          }
        ],
        "notes": [
          {
            "type": "notes",
            "label": "Notes 4.1 · Interpretation of Derivative — add PDF later",
            "url": ""
          }
        ],
        "resources": [
          {
            "type": "practice",
            "label": "Practice 4.1 · Interpretation of Derivative — add PDF later",
            "url": ""
          }
        ],
        "url": "lessons/ap-calculus/unit-4/4-1-interpretations-of-the-derivative.html",
        "status": "ready",
        "kind": "lesson",
        "new": true,
        "keywords": [
          "change",
          "context",
          "contextual",
          "correct",
          "derivative",
          "explain",
          "graphically",
          "instantaneous",
          "interpret",
          "interpretations",
          "into",
          "meaning",
          "notation",
          "numerically",
          "rate",
          "state",
          "symbolically",
          "translate",
          "units",
          "values",
          "verbally"
        ]
      },
      {
        "number": "4.2",
        "title": "Straight Line Motion",
        "summary": "Use derivatives to describe one-dimensional motion precisely.",
        "outcomes": [
          "Relate position, velocity, speed, and acceleration through derivatives.",
          "Determine direction of motion and changes in speed.",
          "Interpret motion information from formulas, graphs, and tables."
        ],
        "videos": [
          {
            "type": "video",
            "label": "Video · Straight line motion",
            "url": "https://youtu.be/RQW0GXzDJlM"
          }
        ],
        "notes": [
          {
            "type": "notes",
            "label": "Notes 4.2 · Straight Line Motion — add PDF later",
            "url": ""
          }
        ],
        "resources": [
          {
            "type": "practice",
            "label": "Practice 4.2 · Straight Line Motion — add PDF later",
            "url": ""
          }
        ],
        "url": "lessons/ap-calculus/unit-4/4-2-straight-line-motion.html",
        "status": "ready",
        "kind": "lesson",
        "new": true,
        "keywords": [
          "acceleration",
          "changes",
          "derivatives",
          "describe",
          "determine",
          "direction",
          "formulas",
          "from",
          "graphs",
          "information",
          "interpret",
          "line",
          "motion",
          "one-dimensional",
          "position",
          "precisely",
          "relate",
          "speed",
          "straight",
          "tables",
          "through",
          "velocity"
        ]
      },
      {
        "number": "4.3",
        "title": "Other Rates of Change",
        "summary": "Apply derivative meaning in scientific, economic, and geometric contexts.",
        "outcomes": [
          "Calculate rates of change in non-motion contexts.",
          "Interpret derivative signs, magnitudes, and units in applied settings.",
          "Distinguish a quantity from its rate of change."
        ],
        "videos": [
          {
            "type": "video",
            "label": "Video · Other rates of change",
            "url": "https://youtu.be/S_jV126OTMU"
          }
        ],
        "notes": [
          {
            "type": "notes",
            "label": "Notes 4.3 · Other Rates of Change — add PDF later",
            "url": ""
          }
        ],
        "resources": [
          {
            "type": "practice",
            "label": "Practice 4.3 · Other Rates of Change — add PDF later",
            "url": ""
          }
        ],
        "url": "lessons/ap-calculus/unit-4/4-3-other-rates-of-change.html",
        "status": "ready",
        "kind": "lesson",
        "new": true,
        "keywords": [
          "applied",
          "apply",
          "calculate",
          "change",
          "contexts",
          "derivative",
          "distinguish",
          "economic",
          "from",
          "geometric",
          "interpret",
          "magnitudes",
          "meaning",
          "non-motion",
          "other",
          "quantity",
          "rate",
          "rates",
          "scientific",
          "settings",
          "signs",
          "units"
        ]
      },
      {
        "number": "4.4",
        "title": "Related Rates",
        "summary": "Model simultaneous change and differentiate every changing quantity with respect to time.",
        "outcomes": [
          "Identify quantities linked by a geometric or physical constraint.",
          "Differentiate the relationship with respect to a common independent variable.",
          "Solve for and interpret an unknown rate with correct units.",
          "Use the chain, product, or quotient rule when the model requires it."
        ],
        "videos": [
          {
            "type": "video",
            "label": "Video · Related rates A",
            "url": "https://www.youtube.com/watch?v=iZAI-9GWLO0&ab_channel=JeanAdams"
          },
          {
            "type": "video",
            "label": "Video · Related rates B",
            "url": "https://youtu.be/-ivYpZUK-TQ"
          }
        ],
        "notes": [
          {
            "type": "notes",
            "label": "Notes 4.4A · Related Rates — add PDF later",
            "url": ""
          },
          {
            "type": "notes",
            "label": "Notes 4.4B · Related Rates — add PDF later",
            "url": ""
          }
        ],
        "resources": [
          {
            "type": "practice",
            "label": "Practice 4.4 · Related Rates — add PDF later",
            "url": ""
          }
        ],
        "url": "lessons/ap-calculus/unit-4/4-4-related-rates.html",
        "status": "ready",
        "kind": "lesson",
        "new": true,
        "keywords": [
          "chain",
          "change",
          "changing",
          "common",
          "constraint",
          "correct",
          "differentiate",
          "every",
          "geometric",
          "identify",
          "independent",
          "interpret",
          "linked",
          "model",
          "physical",
          "product",
          "quantities",
          "quantity",
          "quotient",
          "rate",
          "rates",
          "related",
          "relationship",
          "requires",
          "respect",
          "rule",
          "simultaneous",
          "solve",
          "time",
          "units",
          "unknown",
          "variable",
          "when",
          "with"
        ]
      },
      {
        "number": "4.5",
        "title": "Linear Approximation",
        "summary": "Replace a smooth curve locally with its tangent line.",
        "outcomes": [
          "Use a tangent line to approximate nearby function values.",
          "Write and apply the local linearization formula.",
          "Use concavity to decide whether an approximation is an overestimate or underestimate."
        ],
        "videos": [
          {
            "type": "video",
            "label": "Video · Linear approximation",
            "url": "https://youtu.be/mb3hPMn0Pqs"
          }
        ],
        "notes": [
          {
            "type": "notes",
            "label": "Notes 4.5 · Linear Approximations — add PDF later",
            "url": ""
          }
        ],
        "resources": [
          {
            "type": "practice",
            "label": "Practice 4.5 · Linear Approximations — add PDF later",
            "url": ""
          }
        ],
        "url": "lessons/ap-calculus/unit-4/4-5-linear-approximation.html",
        "status": "ready",
        "kind": "lesson",
        "new": true,
        "keywords": [
          "apply",
          "approximate",
          "approximation",
          "concavity",
          "curve",
          "decide",
          "formula",
          "function",
          "line",
          "linear",
          "linearization",
          "local",
          "locally",
          "nearby",
          "overestimate",
          "replace",
          "smooth",
          "tangent",
          "underestimate",
          "values",
          "whether",
          "with",
          "write"
        ]
      },
      {
        "number": "4.6",
        "title": "L’Hôpital’s Rule",
        "summary": "Compare numerator and denominator rates only after confirming an allowed indeterminate form.",
        "outcomes": [
          "Identify the indeterminate quotient forms 0/0 and ∞/∞.",
          "Verify that L’Hôpital’s Rule applies before differentiating numerator and denominator.",
          "Evaluate selected indeterminate limits, including repeated applications when justified."
        ],
        "videos": [
          {
            "type": "video",
            "label": "Video · L’Hôpital’s Rule",
            "url": "https://youtu.be/BhkylSgdY5k"
          }
        ],
        "notes": [
          {
            "type": "notes",
            "label": "Notes 4.6 · L’Hôpital’s Rule — add PDF later",
            "url": ""
          }
        ],
        "resources": [
          {
            "type": "practice",
            "label": "Practice 4.6 · L’Hôpital’s Rule — add PDF later",
            "url": ""
          }
        ],
        "url": "lessons/ap-calculus/unit-4/4-6-lhopitals-rule.html",
        "status": "ready",
        "kind": "lesson",
        "new": true,
        "keywords": [
          "after",
          "allowed",
          "applications",
          "applies",
          "before",
          "compare",
          "confirming",
          "denominator",
          "differentiating",
          "evaluate",
          "form",
          "forms",
          "identify",
          "including",
          "indeterminate",
          "justified",
          "limits",
          "l’hôpital’s",
          "numerator",
          "only",
          "quotient",
          "rates",
          "repeated",
          "rule",
          "selected",
          "that",
          "verify",
          "when"
        ]
      },
      {
        "number": "4.R",
        "title": "Unit 4 Review",
        "summary": "Review contextual applications of differentiation.",
        "outcomes": [],
        "videos": [],
        "notes": [],
        "resources": [
          {
            "type": "document",
            "label": "Unit 4 Test Review.pdf — add file later",
            "url": ""
          },
          {
            "type": "document",
            "label": "AP-Style Unit 4 End Unit Review.pdf — add file later",
            "url": ""
          }
        ],
        "url": "",
        "status": "flow",
        "kind": "review",
        "new": false,
        "keywords": [
          "applications",
          "contextual",
          "differentiation",
          "review",
          "unit"
        ]
      },
      {
        "number": "4.A",
        "title": "Unit 4 Assessment",
        "summary": "Assessment placeholder; add the assessment file when ready.",
        "outcomes": [],
        "videos": [],
        "notes": [],
        "resources": [],
        "url": "",
        "status": "flow",
        "kind": "assessment",
        "new": false,
        "keywords": [
          "assessment",
          "file",
          "placeholder",
          "ready",
          "unit",
          "when"
        ]
      }
    ]
  },
  {
    "portalSummary": "Use derivative theorems and sign analysis to justify extrema, graph behavior, and optimization.",
    "lessons": [
      {
        "number": "5.1",
        "title": "Mean Value Theorem",
        "summary": "Use theorem hypotheses to guarantee a tangent parallel to a secant.",
        "outcomes": [
          "Verify continuity on a closed interval and differentiability on its interior.",
          "Apply the Mean Value Theorem to equate average and instantaneous rates of change.",
          "Distinguish the Mean Value Theorem, Rolle’s Theorem, and the Intermediate Value Theorem."
        ],
        "videos": [
          {
            "type": "video",
            "label": "Video · Mean Value Theorem",
            "url": "https://youtu.be/v9S4E2W9s2c"
          }
        ],
        "notes": [
          {
            "type": "notes",
            "label": "Notes 5.1 · Mean Value Theorem — add PDF later",
            "url": ""
          }
        ],
        "resources": [
          {
            "type": "practice",
            "label": "Practice 5.1 · Mean Value Theorem — add PDF later",
            "url": ""
          }
        ],
        "url": "lessons/ap-calculus/unit-5/5-1-mean-value-theorem.html",
        "status": "ready",
        "kind": "lesson",
        "new": true,
        "keywords": [
          "apply",
          "average",
          "change",
          "closed",
          "continuity",
          "differentiability",
          "distinguish",
          "equate",
          "guarantee",
          "hypotheses",
          "instantaneous",
          "interior",
          "intermediate",
          "interval",
          "mean",
          "parallel",
          "rates",
          "rolle’s",
          "secant",
          "tangent",
          "theorem",
          "value",
          "verify"
        ]
      },
      {
        "number": "5.2–5.5 · I",
        "title": "Derivative Graph Analysis — Part 1",
        "summary": "From critical numbers to monotonicity and local/absolute extrema.",
        "outcomes": [
          "Apply the Extreme Value Theorem and the closed-interval method.",
          "Find critical numbers and determine intervals of increase and decrease.",
          "Use the First Derivative Test to classify local extrema.",
          "Connect derivative sign changes with the shape of the original function."
        ],
        "videos": [
          {
            "type": "video",
            "label": "Video · Extrema on an interval",
            "url": "https://youtu.be/iyVw_YdKzgM"
          },
          {
            "type": "video",
            "label": "Video · First Derivative Test",
            "url": "https://youtu.be/z8R-pKaUdxI"
          }
        ],
        "notes": [
          {
            "type": "notes",
            "label": "Extrema & Curve Sketching — complete notes",
            "url": "notes/ap-calculus/unit-5/extrema-curve-sketching-complete.pdf"
          },
          {
            "type": "notes",
            "label": "Extreme Values & Concavity — notes",
            "url": "notes/ap-calculus/unit-5/extreme-values-and-concavity-english.pdf"
          }
        ],
        "resources": [
          {
            "type": "practice",
            "label": "Practice 5.2–5.3 · Extrema and First Derivative Test — add PDF later",
            "url": ""
          }
        ],
        "url": "lessons/ap-calculus/unit-5/5-2-to-5-5-derivative-graph-analysis-part-1.html",
        "status": "ready",
        "kind": "lesson",
        "new": true,
        "keywords": [
          "absolute",
          "analysis",
          "apply",
          "changes",
          "classify",
          "closed-interval",
          "connect",
          "critical",
          "decrease",
          "derivative",
          "determine",
          "extrema",
          "extreme",
          "find",
          "first",
          "from",
          "function",
          "graph",
          "increase",
          "intervals",
          "local",
          "method",
          "monotonicity",
          "numbers",
          "original",
          "part",
          "shape",
          "sign",
          "test",
          "theorem",
          "value",
          "with"
        ]
      },
      {
        "number": "5.2–5.5 · II",
        "title": "Derivative Graph Analysis — Part 2: Challenge Questions",
        "summary": "Hard, tricky, and AP-style analysis using first and second derivatives.",
        "outcomes": [
          "Determine intervals of concavity and locate points of inflection.",
          "Use the Second Derivative Test to classify eligible critical points.",
          "Relate the graphs of f, f′, and f″.",
          "Synthesize first- and second-derivative evidence in complete curve analysis."
        ],
        "videos": [
          {
            "type": "video",
            "label": "Video · Second Derivative Test A",
            "url": "https://youtu.be/ZJiCqt0rCb8"
          },
          {
            "type": "video",
            "label": "Video · Second Derivative Test B",
            "url": "https://youtu.be/Yk16DBsgv5s"
          },
          {
            "type": "video",
            "label": "Video · Curve sketching A",
            "url": "https://youtu.be/w0FP7ponqh8"
          },
          {
            "type": "video",
            "label": "Video · Curve sketching B",
            "url": "https://youtu.be/6Eq8yKpRm70"
          }
        ],
        "notes": [
          {
            "type": "notes",
            "label": "Derivative Applications — complete notes",
            "url": "notes/ap-calculus/unit-5/derivative-applications-complete-english.pdf"
          }
        ],
        "resources": [
          {
            "type": "practice",
            "label": "Practice 5.4–5.5 · Concavity and Curve Sketching — add PDF later",
            "url": ""
          }
        ],
        "url": "lessons/ap-calculus/unit-5/5-2-to-5-5-derivative-graph-analysis-part-2.html",
        "status": "ready",
        "kind": "lesson",
        "new": true,
        "keywords": [
          "analysis",
          "ap-style",
          "challenge",
          "classify",
          "complete",
          "concavity",
          "critical",
          "curve",
          "derivative",
          "derivatives",
          "determine",
          "eligible",
          "evidence",
          "first",
          "graph",
          "graphs",
          "hard",
          "inflection",
          "intervals",
          "locate",
          "part",
          "points",
          "questions",
          "relate",
          "second",
          "second-derivative",
          "synthesize",
          "test",
          "tricky",
          "using"
        ]
      },
      {
        "number": "5.10",
        "title": "Optimization Problems",
        "summary": "Model, restrict, differentiate, verify, and interpret optimization problems.",
        "outcomes": [
          "Identify an objective quantity and the constraint linking the variables.",
          "Rewrite the objective as a one-variable function on a physically meaningful domain.",
          "Find and justify an absolute maximum or minimum using derivatives and endpoints.",
          "Interpret the optimized value in context with units and appropriate rounding."
        ],
        "videos": [
          {
            "type": "video",
            "label": "Video · Optimization A",
            "url": "https://youtu.be/3ApUjH9LmSA"
          },
          {
            "type": "video",
            "label": "Video · Optimization B",
            "url": "https://youtu.be/f9S7qWva2b0"
          }
        ],
        "notes": [
          {
            "type": "notes",
            "label": "Maximum & Minimum Applications — notes",
            "url": "notes/ap-calculus/unit-5/maximum-minimum-applications-english.pdf"
          },
          {
            "type": "notes",
            "label": "Notes 5.10 · Optimization — add PDF later",
            "url": ""
          }
        ],
        "resources": [
          {
            "type": "practice",
            "label": "Practice 5.10 · Optimization — add PDF later",
            "url": ""
          }
        ],
        "url": "lessons/ap-calculus/unit-5/5-10-optimization-problems.html",
        "status": "ready",
        "kind": "lesson",
        "new": true,
        "keywords": [
          "absolute",
          "appropriate",
          "constraint",
          "context",
          "derivatives",
          "differentiate",
          "domain",
          "endpoints",
          "find",
          "function",
          "identify",
          "interpret",
          "justify",
          "linking",
          "maximum",
          "meaningful",
          "minimum",
          "model",
          "objective",
          "one-variable",
          "optimization",
          "optimized",
          "physically",
          "problems",
          "quantity",
          "restrict",
          "rewrite",
          "rounding",
          "units",
          "using",
          "value",
          "variables",
          "verify",
          "with"
        ]
      },
      {
        "number": "5.R",
        "title": "Unit 5 Review",
        "summary": "Review analytical applications of differentiation.",
        "outcomes": [],
        "videos": [],
        "notes": [],
        "resources": [
          {
            "type": "document",
            "label": "Unit 5 Test Review.docx — add file later",
            "url": ""
          },
          {
            "type": "document",
            "label": "AP-Style Unit 5 Test Review.docx — add file later",
            "url": ""
          }
        ],
        "url": "",
        "status": "flow",
        "kind": "review",
        "new": false,
        "keywords": [
          "analytical",
          "applications",
          "differentiation",
          "review",
          "unit"
        ]
      },
      {
        "number": "5.A",
        "title": "Unit 5 Assessment",
        "summary": "Assessment placeholder; add the assessment file when ready.",
        "outcomes": [],
        "videos": [],
        "notes": [],
        "resources": [],
        "url": "",
        "status": "flow",
        "kind": "assessment",
        "new": false,
        "keywords": [
          "assessment",
          "file",
          "placeholder",
          "ready",
          "unit",
          "when"
        ]
      }
    ]
  }
];
  updates.forEach((update, index) => {
    const unit = course.units[index];
    if (update.title) unit.title = update.title;
    unit.portalSummary = update.portalSummary;
    unit.lessons = update.lessons;
    unit.refreshed = true;
  });

  course.unitCount = course.units.length;
  course.lessonCount = course.units.reduce((total, unit) => total + (Array.isArray(unit.lessons) ? unit.lessons.length : 0), 0);
  course.updatedUnits = "Units 1–5 refreshed · July 2026";
  course.sourceNote = "AP Calculus AB Units 1–5 use the uploaded ECHS interactive lessons; Units 6–8 and all other courses remain unchanged.";
})();
