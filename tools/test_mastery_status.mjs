import assert from 'node:assert/strict';
import fs from 'node:fs';
import {STATUS_CONTRACT, projectMasteryStatus, projectMasteryRecord, projectMasterySummary} from '../supabase/functions/_shared/mastery-status.mjs';
import * as publicAPI from '../js/learning-evidence-status.mjs';

const checks = [];
function check(name, run) { run(); checks.push(name); }
const baseline = {
  score: 97, attempts: 24, confidence: .94, independent_evidence: 24,
  active_days: 3, transfer_evidence: 24, retention_evidence: 8,
  representation_count: 4, source: 'server', last_verified_at: '2026-01-03T08:00:00Z',
  payload: {algorithm:'echs-mastery-2.0-foundation', level:'Mastered', verified:true,
    requirements:{minimumIndependent:4, minimumDays:2, minimumConfidence:.72, requiresTransfer:true, requiresRetention:true}},
};
check('No receipt-like or server-source claim can enable certification', () => {
  for (const extra of [{}, {verified_mastery:true}, {evidence_status:'verified', status_contract:STATUS_CONTRACT},
    {source:'server', authenticated:true, grading_receipt:{verified:true}},
    {payload:{verified:true, trust_tier:'student_ready_verified', authenticated_grading:true, receipt_id:'trusted-looking'}}]) {
    const result = projectMasteryStatus({...baseline,...extra});
    assert.equal(result.verified_mastery,false); assert.equal(result.evidence_status,'provisional');
    assert.equal(result.provenance,'client_reported'); assert.notEqual(result.display_level,'Mastered');
    assert.ok(result.missing_evidence.includes('grading_provenance_missing'));
  }
});
check('Null, missing attempts and empty records never imply zero accuracy', () => {
  for (const row of [null, undefined, {}, [], '100', {score:100}, {...baseline,attempts:0}]) {
    const result=projectMasteryStatus(row); assert.equal(result.evidence_status,'insufficient');
    assert.equal(result.provenance,'unknown'); assert.equal(result.display_level,'Insufficient practice evidence');
    assert.ok(result.missing_evidence.includes('practice_attempts_missing'));
  }
});
check('Recorded zero accuracy is provisional practice, not missing evidence', () => {
  const result=projectMasteryStatus({...baseline,score:0});
  assert.equal(result.evidence_status,'provisional'); assert.equal(result.display_level,'Starting practice performance');
  assert.ok(!result.missing_evidence.includes('practice_score_missing'));
});
check('Nonfinite, null, coercible and out-of-range scores fail closed', () => {
  for (const score of [null,undefined,NaN,Infinity,-1,101,'97',true,{},[]]) {
    const result=projectMasteryStatus({...baseline,score});
    assert.equal(result.evidence_status,'insufficient'); assert.ok(result.missing_evidence.includes('practice_score_missing'));
  }
  for (const attempts of [NaN,Infinity,-1,null,'24',true]) assert.equal(projectMasteryStatus({...baseline,attempts}).evidence_status,'insufficient');
});
check('Practice labels retain explicit numeric bands without certifying any score', () => {
  for (let score=0;score<=100;score++) {
    const result=projectMasteryStatus({...baseline,score});
    const prefix=score>=85?'Strong':score>=65?'Proficient':score>=35?'Developing':'Starting';
    assert.equal(result.display_level,`${prefix} practice performance`); assert.equal(result.verified_mastery,false);
  }
});
check('Missing diagnostics differ from actual recorded zero evidence', () => {
  const absent=projectMasteryStatus({score:97,attempts:24});
  for (const key of ['independent_evidence','active_days','confidence','transfer_evidence','retention_evidence']) assert.ok(absent.missing_evidence.includes(`${key}_unavailable`));
  const zero=projectMasteryStatus({...baseline,independent_evidence:0,active_days:0,confidence:0,transfer_evidence:0,retention_evidence:0});
  for (const key of ['independent_evidence','active_days','confidence','transfer_evidence','retention_evidence']) {
    assert.ok(zero.missing_evidence.includes(`${key}_insufficient`)); assert.ok(!zero.missing_evidence.includes(`${key}_unavailable`));
  }
});
check('Recorded skill requirements are diagnostic only, including optional transfer/retention', () => {
  const row={...baseline,independent_evidence:3,active_days:1,confidence:.6,transfer_evidence:0,retention_evidence:0,
    payload:{requirements:{minimumIndependent:3,minimumDays:1,minimumConfidence:.6,requiresTransfer:false,requiresRetention:false}}};
  assert.deepEqual(projectMasteryStatus(row).missing_evidence,['grading_provenance_missing']);
  assert.equal(projectMasteryStatus({...row,payload:{requirements:{minimumIndependent:0,minimumDays:0,minimumConfidence:0}}}).verified_mastery,false);
});
check('Property accessors and inherited values do not execute or authenticate in status projection', () => {
  let called=0;
  const row={get score(){called++;throw new Error('must not execute');},get attempts(){called++;return 24;},get payload(){called++;return baseline.payload;}};
  assert.equal(projectMasteryStatus(row).evidence_status,'insufficient'); assert.equal(called,0);
  assert.equal(projectMasteryStatus(Object.create(baseline)).evidence_status,'insufficient');
  assert.equal(projectMasteryStatus(new Proxy({}, {getOwnPropertyDescriptor(){throw new Error('refused');}})).verified_mastery,false);
});
check('Projection never mutates the input and quarantines historical certification labels', () => {
  const raw=structuredClone(baseline),before=JSON.stringify(raw);
  Object.freeze(raw.payload);Object.freeze(raw);
  const result=projectMasteryRecord(raw);
  assert.equal(JSON.stringify(raw),before); assert.equal(result.level,result.display_level);
  assert.equal(result.payload.verified,false); assert.equal(result.payload.level,result.display_level); assert.equal(result.last_verified_at,null);
  assert.equal(result.legacy_algorithm_diagnostics.verified,true); assert.equal(result.legacy_algorithm_diagnostics.level,'Mastered');
  assert.equal(result.legacy_algorithm_diagnostics.last_verified_at,baseline.last_verified_at);
  for (const key of ['score','attempts','confidence','independent_evidence','active_days','transfer_evidence','retention_evidence','representation_count','source']) assert.equal(result[key],raw[key]);
  assert.deepEqual(result.payload.requirements,raw.payload.requirements);
});
check('Results do not leak mutable policy state between callers', () => {
  const first=projectMasteryStatus(baseline);assert.ok(Object.isFrozen(first));assert.ok(Object.isFrozen(first.missing_evidence));
  assert.throws(()=>first.missing_evidence.push('invented')); assert.throws(()=>first.verified_mastery=true);
  assert.notEqual(first,projectMasteryStatus(baseline));
});
check('Aggregate status does not invent a grading certificate or alter ordering/scores', () => {
  const rows=[{...baseline,score:0},{...baseline,score:100}];const before=JSON.stringify(rows);
  const summary=projectMasterySummary(rows);assert.equal(summary.verified_mastery,false);assert.equal(summary.grading_authoritative,false);assert.equal(summary.evidence_status,'provisional');
  assert.equal(JSON.stringify(rows),before);assert.equal(projectMasterySummary([]).evidence_status,'insufficient');
  assert.equal(projectMasterySummary(null).provenance,'unknown');
});
check('Public and server imports are byte-exact with identical behavior', () => {
  const original=fs.readFileSync(new URL('../supabase/functions/_shared/mastery-status.mjs',import.meta.url));
  assert.ok(original.equals(fs.readFileSync(new URL('../js/learning-evidence-status.mjs',import.meta.url))));
  for(const row of [null,{},baseline,{...baseline,score:0}]) assert.deepEqual(publicAPI.projectMasteryStatus(row),projectMasteryStatus(row));
});
console.log(JSON.stringify({status:'PASS',groups:checks.length,checks},null,2));
