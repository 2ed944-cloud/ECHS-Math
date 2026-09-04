export const PATHWAYS = Object.freeze({
  AA_HL: { label: "Mathematics: Analysis and Approaches HL", short: "AA HL" },
  AA_SL: { label: "Mathematics: Analysis and Approaches SL", short: "AA SL" },
  AI_HL: { label: "Mathematics: Applications and Interpretation HL", short: "AI HL" },
  AI_SL: { label: "Mathematics: Applications and Interpretation SL", short: "AI SL" },
});

export const SKILLS = Object.freeze({
  number: "Number & quantitative fluency",
  algebra: "Algebraic & symbolic fluency",
  functions: "Functions & representation",
  geometry: "Geometry & coordinate reasoning",
  trigonometry: "Trigonometric fluency",
  statistics: "Statistics & data analysis",
  probability: "Probability reasoning",
  modelling: "Mathematical modelling",
  reasoning: "Reasoning & justification",
  communication: "Mathematical communication",
});

const DEFAULT_RIT_ANCHORS = {};


export const DEFAULT_MODEL = Object.freeze({
  schema_version: 1,
  name: "IB Mathematics readiness baseline",
  purpose: "Local decision-support index. It is not an official IB or NWEA predictor and must be locally validated before predictive claims are made.",
  layer_weights: { map: 0.4, myp: 0.3, diagnostic: 0.3 },
  thresholds: { strong: 80, on_track: 70, developing: 55 },
  success_grade_for_validation: 5,
  rit_anchors: DEFAULT_RIT_ANCHORS,
  pathways: {
    AA_HL: {
      map: { overall: 0.18, number: 0.10, algebra: 0.28, functions: 0.24, geometry: 0.14, data: 0.06 },
      myp: { A: 0.43, B: 0.24, C: 0.13, D: 0.20 },
      diagnostic: { number: 0.08, algebra: 0.24, functions: 0.19, geometry: 0.07, trigonometry: 0.15, statistics: 0.04, probability: 0.03, modelling: 0.05, reasoning: 0.10, communication: 0.05 },
    },
    AA_SL: {
      map: { overall: 0.22, number: 0.12, algebra: 0.24, functions: 0.20, geometry: 0.13, data: 0.09 },
      myp: { A: 0.40, B: 0.23, C: 0.15, D: 0.22 },
      diagnostic: { number: 0.10, algebra: 0.20, functions: 0.17, geometry: 0.08, trigonometry: 0.12, statistics: 0.07, probability: 0.05, modelling: 0.07, reasoning: 0.08, communication: 0.06 },
    },
    AI_HL: {
      map: { overall: 0.19, number: 0.10, algebra: 0.15, functions: 0.17, geometry: 0.10, data: 0.29 },
      myp: { A: 0.31, B: 0.27, C: 0.17, D: 0.25 },
      diagnostic: { number: 0.08, algebra: 0.11, functions: 0.14, geometry: 0.05, trigonometry: 0.07, statistics: 0.20, probability: 0.14, modelling: 0.12, reasoning: 0.05, communication: 0.04 },
    },
    AI_SL: {
      map: { overall: 0.24, number: 0.13, algebra: 0.12, functions: 0.13, geometry: 0.10, data: 0.28 },
      myp: { A: 0.28, B: 0.27, C: 0.19, D: 0.26 },
      diagnostic: { number: 0.10, algebra: 0.10, functions: 0.12, geometry: 0.06, trigonometry: 0.05, statistics: 0.21, probability: 0.15, modelling: 0.12, reasoning: 0.04, communication: 0.05 },
    },
  },
});

const GAP_RECOMMENDATIONS = Object.freeze({
  number: {
    title: "Strengthen number and quantitative fluency",
    recommendation: "Target exact/approximate values, percentage and ratio reasoning, standard form, bounds, and efficient numerical estimation.",
  },
  algebra: {
    title: "Strengthen algebraic and symbolic fluency",
    recommendation: "Target manipulation, factorisation, equations and inequalities, indices, logarithms, and multi-step symbolic reasoning before increasing pathway difficulty.",
  },
  functions: {
    title: "Strengthen functions and representation",
    recommendation: "Target function notation, transformations, composition, inverse functions, domain/range and movement between graphical, numerical and algebraic representations.",
  },
  geometry: {
    title: "Strengthen geometry and coordinate reasoning",
    recommendation: "Target distance, gradient, lines, circles, geometric relationships and coordinate reasoning with clear diagrams and justification.",
  },
  trigonometry: {
    title: "Strengthen trigonometric fluency",
    recommendation: "Target radians, exact values, equations, identities and links between unit-circle, graphical and algebraic representations.",
  },
  statistics: {
    title: "Strengthen statistics and data interpretation",
    recommendation: "Target summary statistics, spread, correlation, regression, distributional reasoning and interpretation in context.",
  },
  probability: {
    title: "Strengthen probability reasoning",
    recommendation: "Target conditional probability, independence, tree/table representations, expected value and clear interpretation of probabilistic statements.",
  },
  modelling: {
    title: "Strengthen mathematical modelling",
    recommendation: "Target assumptions, parameter interpretation, model selection, checking reasonableness and communicating limitations in context.",
  },
  reasoning: {
    title: "Strengthen mathematical reasoning and justification",
    recommendation: "Target counterexamples, structured arguments, pattern generalisation, justification of methods and evaluation of claims.",
  },
  communication: {
    title: "Strengthen mathematical communication",
    recommendation: "Target notation, labelled representations, complete reasoning and concise interpretation of results in mathematical and real-world contexts.",
  },
});

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function mergeModel(base = DEFAULT_MODEL, override = {}) {
  const result = clone(base);
  const walk = (target, source) => {
    if (!isObject(source)) return target;
    for (const [key, value] of Object.entries(source)) {
      if (isObject(value) && isObject(target[key])) walk(target[key], value);
      else target[key] = clone(value);
    }
    return target;
  };
  return walk(result, override || {});
}

export function clamp(value, min = 0, max = 100) {
  if (value === null || value === undefined || value === "") return null;
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return null;
  return Math.min(max, Math.max(min, numeric));
}

function seasonKey(value) {
  const key = String(value || "").trim().toLowerCase();
  if (["fall", "autumn", "beginning", "beginning-of-year", "boy"].includes(key)) return "fall";
  if (["winter", "middle", "middle-of-year", "moy"].includes(key)) return "winter";
  if (["spring", "end", "end-of-year", "eoy"].includes(key)) return "spring";
  return "default";
}

function gradeKey(value) {
  const match = String(value ?? "").match(/\d{1,2}/);
  return match ? String(Number(match[0])) : "default";
}

export function normaliseRit(rit, grade, season, model = DEFAULT_MODEL) {
  const numeric = Number(rit);
  if (!Number.isFinite(numeric)) return null;
  const anchors = model.rit_anchors;
  if (!anchors || typeof anchors !== "object") return null;
  const byGrade = anchors[gradeKey(grade)] || anchors.default;
  if (!byGrade || typeof byGrade !== "object") return null;
  const range = byGrade[seasonKey(season)] || byGrade.default;
  if (!Array.isArray(range) || range.length < 2) return null;
  const [low, high] = range.map(Number);
  if (!(Number.isFinite(low) && Number.isFinite(high) && high > low)) return null;
  return clamp(((numeric - low) / (high - low)) * 100);
}

function weightedAverage(values, weights) {
  let weighted = 0;
  let weightTotal = 0;
  const used = {};
  for (const [key, weightValue] of Object.entries(weights || {})) {
    const value = clamp(values?.[key]);
    const weight = Number(weightValue);
    if (value === null || !Number.isFinite(weight) || weight <= 0) continue;
    weighted += value * weight;
    weightTotal += weight;
    used[key] = { value, weight };
  }
  return weightTotal > 0 ? { score: weighted / weightTotal, weight_total: weightTotal, used } : null;
}

export function mapVector(map, model = DEFAULT_MODEL) {
  if (!map) return null;
  const overall = clamp(map.percentile) ?? normaliseRit(map.overall_rit, map.grade, map.season, model);
  const domains = map.domains || {};
  const vector = {
    overall,
    number: normaliseRit(domains.number, map.grade, map.season, model),
    algebra: normaliseRit(domains.algebra, map.grade, map.season, model),
    functions: normaliseRit(domains.functions, map.grade, map.season, model),
    geometry: normaliseRit(domains.geometry, map.grade, map.season, model),
    data: normaliseRit(domains.data ?? domains.statistics, map.grade, map.season, model),
  };
  if (Object.values(vector).every((value) => value === null)) return null;
  return vector;
}

export function mypVector(myp) {
  if (!myp) return null;
  const vector = {};
  for (const key of ["A", "B", "C", "D"]) {
    const raw = Number(myp[`criterion_${key.toLowerCase()}`] ?? myp[key]);
    vector[key] = Number.isFinite(raw) ? clamp((raw / 8) * 100) : null;
  }
  return Object.values(vector).some((value) => value !== null) ? vector : null;
}

export function diagnosticVector(diagnostic) {
  if (!diagnostic?.skill_scores) return null;
  const vector = {};
  for (const key of Object.keys(SKILLS)) {
    const value = clamp(diagnostic.skill_scores[key]);
    if (value !== null) vector[key] = value;
  }
  return Object.keys(vector).length ? vector : null;
}

function bandFor(score, thresholds) {
  if (score >= Number(thresholds.strong)) return "Strong";
  if (score >= Number(thresholds.on_track)) return "On track";
  if (score >= Number(thresholds.developing)) return "Developing";
  return "Needs foundation";
}

function confidenceFor(completeness, availableLayerCount) {
  if (completeness >= 0.95 && availableLayerCount === 3) return "High";
  if (completeness >= 0.65 && availableLayerCount >= 2) return "Moderate";
  return "Screening only";
}

function evidenceStatus(completeness, availableLayerCount) {
  if (completeness >= 0.95 && availableLayerCount === 3) return "full_profile";
  if (availableLayerCount >= 2) return "partial_profile";
  return "screening_only";
}

function commonSkillProfile(mapValues, diagnosticValues, mypValues) {
  const candidates = {};
  const add = (skill, value, weight, source) => {
    const numeric = clamp(value);
    if (numeric === null) return;
    if (!candidates[skill]) candidates[skill] = [];
    candidates[skill].push({ value: numeric, weight, source });
  };
  if (mapValues) {
    add("number", mapValues.number ?? mapValues.overall, 0.9, "MAP");
    add("algebra", mapValues.algebra ?? mapValues.overall, 1.0, "MAP");
    add("functions", mapValues.functions ?? mapValues.algebra ?? mapValues.overall, 0.9, "MAP");
    add("geometry", mapValues.geometry ?? mapValues.overall, 0.9, "MAP");
    add("statistics", mapValues.data ?? mapValues.overall, 0.9, "MAP");
    add("probability", mapValues.data ?? mapValues.overall, 0.7, "MAP");
  }
  if (diagnosticValues) {
    for (const [skill, value] of Object.entries(diagnosticValues)) add(skill, value, 1.2, "Diagnostic");
  }
  if (mypValues) {
    add("reasoning", mypValues.A, 0.65, "MYP Criterion A");
    add("modelling", mypValues.B, 0.65, "MYP Criterion B");
    add("communication", mypValues.C, 0.75, "MYP Criterion C");
    add("modelling", mypValues.D, 0.55, "MYP Criterion D");
    add("reasoning", mypValues.D, 0.35, "MYP Criterion D");
  }
  const profile = {};
  for (const [skill, rows] of Object.entries(candidates)) {
    const totalWeight = rows.reduce((sum, row) => sum + row.weight, 0);
    profile[skill] = {
      score: rows.reduce((sum, row) => sum + row.value * row.weight, 0) / totalWeight,
      sources: rows.map((row) => row.source),
    };
  }
  return profile;
}

function gapsFor(pathway, profile, pathConfig, thresholds) {
  const weights = pathConfig?.diagnostic || {};
  const gaps = [];
  for (const [skill, weight] of Object.entries(weights)) {
    const current = profile?.[skill]?.score;
    if (!Number.isFinite(current)) continue;
    const target = pathway === "AA_HL" || pathway === "AI_HL" ? Math.max(72, Number(thresholds.on_track)) : Math.max(66, Number(thresholds.developing));
    const deficit = Math.max(0, target - current);
    if (deficit < 4) continue;
    const impact = deficit * Number(weight || 0);
    const copy = GAP_RECOMMENDATIONS[skill] || { title: `Strengthen ${skill}`, recommendation: `Target ${skill} before increasing pathway difficulty.` };
    gaps.push({
      skill_key: skill,
      title: copy.title,
      current_score: Math.round(current),
      target_score: target,
      deficit: Math.round(deficit),
      pathway_weight: Number(weight || 0),
      impact,
      recommendation: copy.recommendation,
      evidence_sources: profile?.[skill]?.sources || [],
    });
  }
  return gaps.sort((a, b) => b.impact - a.impact).slice(0, 6).map((gap, index) => ({
    ...gap,
    priority: index < 2 ? "high" : index < 4 ? "medium" : "supporting",
  }));
}

function buildReasons(pathway, score, band, layers, gaps, confidence) {
  const reasons = [];
  const available = Object.entries(layers).filter(([, layer]) => layer?.available);
  const strongest = [...available].sort((a, b) => b[1].score - a[1].score)[0];
  const weakest = [...available].sort((a, b) => a[1].score - b[1].score)[0];
  if (strongest) reasons.push(`Strongest evidence layer: ${strongest[0].toUpperCase()} (${Math.round(strongest[1].score)}).`);
  if (weakest && weakest?.[0] !== strongest?.[0]) reasons.push(`Current limiting evidence layer: ${weakest[0].toUpperCase()} (${Math.round(weakest[1].score)}).`);
  if (gaps[0]) reasons.push(`Highest-priority skill gap: ${SKILLS[gaps[0].skill_key] || gaps[0].skill_key}.`);
  if (confidence === "Screening only") reasons.push("This is a provisional screening index because only one evidence layer is available.");
  reasons.push(`${PATHWAYS[pathway]?.short || pathway} readiness index: ${Math.round(score)} (${band}).`);
  return reasons;
}

export function computePathwayReadiness({ pathway, map, myp, diagnostic, model: modelOverride = {} }) {
  if (!PATHWAYS[pathway]) throw new Error(`Unknown pathway: ${pathway}`);
  const model = mergeModel(DEFAULT_MODEL, modelOverride);
  const pathConfig = model.pathways[pathway];
  const mapValues = mapVector(map, model);
  const mypValues = mypVector(myp);
  const diagnosticValues = diagnosticVector(diagnostic);

  const mapLayer = mapValues ? weightedAverage(mapValues, pathConfig.map) : null;
  const mypLayer = mypValues ? weightedAverage(mypValues, pathConfig.myp) : null;
  const diagnosticLayer = diagnosticValues ? weightedAverage(diagnosticValues, pathConfig.diagnostic) : null;
  const layerWeights = model.layer_weights || DEFAULT_MODEL.layer_weights;
  const layerEntries = [
    ["map", mapLayer, Number(layerWeights.map)],
    ["myp", mypLayer, Number(layerWeights.myp)],
    ["diagnostic", diagnosticLayer, Number(layerWeights.diagnostic)],
  ];
  let numerator = 0;
  let activeWeight = 0;
  let configuredWeight = 0;
  let availableLayerCount = 0;
  const layers = {};
  for (const [name, layer, configured] of layerEntries) {
    const validConfigured = Number.isFinite(configured) && configured > 0 ? configured : 0;
    configuredWeight += validConfigured;
    if (!layer) {
      layers[name] = { available: false, configured_weight: validConfigured };
      continue;
    }
    numerator += layer.score * validConfigured;
    activeWeight += validConfigured;
    availableLayerCount++;
    layers[name] = {
      available: true,
      score: layer.score,
      configured_weight: validConfigured,
      evidence_weight_used: layer.weight_total,
      details: layer.used,
    };
  }
  if (!availableLayerCount || activeWeight <= 0) {
    return {
      pathway,
      score: null,
      band: "Insufficient evidence",
      confidence: "Insufficient evidence",
      evidence_status: "insufficient",
      evidence_completeness: 0,
      layers,
      skill_profile: {},
      gaps: [],
      reasons: ["No usable MAP, MYP or diagnostic evidence is available yet."],
    };
  }
  const score = clamp(numerator / activeWeight);
  const completeness = configuredWeight > 0 ? activeWeight / configuredWeight : 0;
  const confidence = confidenceFor(completeness, availableLayerCount);
  const status = evidenceStatus(completeness, availableLayerCount);
  const band = bandFor(score, model.thresholds);
  const profile = commonSkillProfile(mapValues, diagnosticValues, mypValues);
  const gaps = gapsFor(pathway, profile, pathConfig, model.thresholds);
  return {
    pathway,
    score,
    band,
    confidence,
    evidence_status: status,
    evidence_completeness: completeness,
    layers,
    skill_profile: profile,
    gaps,
    reasons: buildReasons(pathway, score, band, layers, gaps, confidence),
  };
}

export function computeAllPathways({ map, myp, diagnostic, model = {} }) {
  const results = {};
  for (const pathway of Object.keys(PATHWAYS)) {
    results[pathway] = computePathwayReadiness({ pathway, map, myp, diagnostic, model });
  }
  return results;
}

export function validateModelConfiguration(override) {
  const model = mergeModel(DEFAULT_MODEL, override || {});
  const errors = [];
  const layerWeights = model.layer_weights || {};
  const layerTotal = ["map", "myp", "diagnostic"].reduce((sum, key) => sum + (Number(layerWeights[key]) || 0), 0);
  if (layerTotal <= 0) errors.push("At least one evidence-layer weight must be greater than zero.");
  const t = model.thresholds || {};
  if (!(Number(t.strong) > Number(t.on_track) && Number(t.on_track) > Number(t.developing) && Number(t.developing) >= 0)) {
    errors.push("Thresholds must satisfy strong > on_track > developing >= 0.");
  }
  for (const pathway of Object.keys(PATHWAYS)) {
    for (const layer of ["map", "myp", "diagnostic"]) {
      const weights = model.pathways?.[pathway]?.[layer];
      if (!weights || !Object.values(weights).some((value) => Number(value) > 0)) {
        errors.push(`${pathway}.${layer} must include at least one positive weight.`);
      }
    }
  }
  return { ok: errors.length === 0, errors, model };
}

export function pearsonCorrelation(pairs) {
  const clean = pairs.filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y));
  const n = clean.length;
  if (n < 2) return null;
  const meanX = clean.reduce((sum, [x]) => sum + x, 0) / n;
  const meanY = clean.reduce((sum, [, y]) => sum + y, 0) / n;
  let covariance = 0;
  let varX = 0;
  let varY = 0;
  for (const [x, y] of clean) {
    const dx = x - meanX;
    const dy = y - meanY;
    covariance += dx * dy;
    varX += dx * dx;
    varY += dy * dy;
  }
  return varX > 0 && varY > 0 ? covariance / Math.sqrt(varX * varY) : null;
}

export function validationSummary(records, modelOverride = {}) {
  const model = mergeModel(DEFAULT_MODEL, modelOverride || {});
  const threshold = Number(model.thresholds.on_track);
  const successGrade = Number(model.success_grade_for_validation || 5);
  const clean = (records || []).filter((row) => Number.isFinite(Number(row.readiness_score)) && Number.isFinite(Number(row.final_grade)));
  const bandMap = new Map();
  let tp = 0, tn = 0, fp = 0, fn = 0;
  for (const row of clean) {
    const score = Number(row.readiness_score);
    const grade = Number(row.final_grade);
    const band = bandFor(score, model.thresholds);
    if (!bandMap.has(band)) bandMap.set(band, { band, n: 0, successes: 0, grade_sum: 0, readiness_sum: 0 });
    const item = bandMap.get(band);
    item.n++;
    item.grade_sum += grade;
    item.readiness_sum += score;
    const success = grade >= successGrade;
    const predicted = score >= threshold;
    if (success && predicted) tp++;
    else if (!success && !predicted) tn++;
    else if (!success && predicted) fp++;
    else fn++;
    if (success) item.successes++;
  }
  const safeDiv = (a, b) => b ? a / b : null;
  const order = ["Strong", "On track", "Developing", "Needs foundation"];
  const bands = order.filter((key) => bandMap.has(key)).map((key) => {
    const item = bandMap.get(key);
    return {
      band: key,
      n: item.n,
      observed_success_rate: safeDiv(item.successes, item.n),
      average_final_grade: safeDiv(item.grade_sum, item.n),
      average_readiness_index: safeDiv(item.readiness_sum, item.n),
    };
  });
  return {
    n: clean.length,
    success_grade: successGrade,
    classification_threshold: threshold,
    correlation_readiness_to_grade: pearsonCorrelation(clean.map((row) => [Number(row.readiness_score), Number(row.final_grade)])),
    accuracy: safeDiv(tp + tn, clean.length),
    sensitivity: safeDiv(tp, tp + fn),
    specificity: safeDiv(tn, tn + fp),
    confusion: { true_positive: tp, true_negative: tn, false_positive: fp, false_negative: fn },
    bands,
    validation_status: clean.length >= 100 ? "substantial_local_sample" : clean.length >= 30 ? "early_local_sample" : "insufficient_sample",
    warning: clean.length >= 30
      ? "These are local validation statistics, not an official IB or NWEA linking study."
      : "Fewer than 30 linked outcomes are available. Do not make predictive claims from this sample.",
  };
}
