import assert from "node:assert/strict";
import { computeAllPathways, computePathwayReadiness, DEFAULT_MODEL, validationSummary, validateModelConfiguration } from "./readiness-engine.js";
import { gradeDiagnostic, publicDiagnostic, questionCount } from "./diagnostic-bank.js";

const map = {
  overall_rit: 255,
  percentile: 88,
  growth_percentile: 72,
  grade: "10",
  season: "spring",
  domains: { number: 252, algebra: 260, functions: 258, geometry: 248, data: 250 },
};
const myp = { criterion_a: 7, criterion_b: 6, criterion_c: 6, criterion_d: 7 };
const diagnostic = { skill_scores: { number: 83, algebra: 90, functions: 87, geometry: 80, trigonometry: 82, statistics: 78, probability: 76, modelling: 75, reasoning: 84, communication: 80 } };

const all = computeAllPathways({ map, myp, diagnostic });
assert.deepEqual(Object.keys(all).sort(), ["AA_HL","AA_SL","AI_HL","AI_SL"].sort());
for (const result of Object.values(all)) {
  assert.ok(result.score >= 0 && result.score <= 100);
  assert.equal(result.confidence, "High");
  assert.equal(result.evidence_status, "full_profile");
}

const screening = computePathwayReadiness({ pathway: "AA_HL", map });
assert.equal(screening.confidence, "Screening only");
assert.equal(screening.evidence_status, "screening_only");
assert.equal(Math.round(screening.score), 88, "Without approved local RIT anchors, MAP screening uses the supplied achievement percentile rather than invented RIT cut scores.");

const locallyAnchored = computePathwayReadiness({ pathway: "AA_HL", map: { overall_rit: 250, grade: "10", season: "spring", domains: { algebra: 260 } }, model: { rit_anchors: { "10": { spring: [200, 280] } } } });
assert.ok(locallyAnchored.score !== null, "A locally configured RIT anchor may be used after governance/validation approval.");

const noEvidence = computePathwayReadiness({ pathway: "AI_SL" });
assert.equal(noEvidence.score, null);
assert.equal(noEvidence.band, "Insufficient evidence");

const modelCheck = validateModelConfiguration(DEFAULT_MODEL);
assert.equal(modelCheck.ok, true);
const invalid = validateModelConfiguration({ thresholds: { strong: 60, on_track: 70, developing: 55 } });
assert.equal(invalid.ok, false);

const publicQuestions = publicDiagnostic();
assert.equal(publicQuestions.length, questionCount());
assert.ok(publicQuestions.every((q) => !("answer" in q)));
const blankGrade = gradeDiagnostic({});
assert.equal(blankGrade.answered, 0);
assert.equal(blankGrade.total, questionCount());

const validation = validationSummary([
  { readiness_score: 85, final_grade: 7 },
  { readiness_score: 80, final_grade: 6 },
  { readiness_score: 73, final_grade: 5 },
  { readiness_score: 62, final_grade: 4 },
  { readiness_score: 48, final_grade: 3 },
]);
assert.equal(validation.n, 5);
assert.ok(validation.correlation_readiness_to_grade > 0.9);
assert.equal(validation.validation_status, "insufficient_sample");

console.log("readiness-engine tests: PASS");
