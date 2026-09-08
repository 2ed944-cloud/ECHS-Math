import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createCurriculumRegistry} from '../js/curriculum-versions.mjs';

const base = new URL('../', import.meta.url);
const data = JSON.parse(fs.readFileSync(new URL('curriculum/registry/course-versions.v1.json', base), 'utf8'));
const clone = value => JSON.parse(JSON.stringify(value));
const input = clone(data), registry = createCurriculumRegistry(input);
const active = data.course_versions.find(course => course.key === 'ib-ai-sl-first-assessment-2021');
const future = data.course_versions.find(course => course.key === 'ib-ai-sl-first-assessment-2029');
assert.ok(active && future);
assert.equal(registry.listCourseVersions().length, 4);
assert.equal(registry.listCourseVersions({includeFuture: true}).length, 5);
assert.equal(registry.getCourseVersion(active.id).key, active.key);
assert.equal(registry.getCourseVersion(active.key).id, active.id);
assert.equal(registry.getCourseVersion('ib-math-ai'), null, 'Legacy aliases never choose a version');
assert.equal(registry.getCourseVersion('unknown-version'), null);
assert.equal(registry.resolveClassVersion(null), null);
assert.equal(registry.resolveClassVersion({course: 'ib-math-ai', school_year: '2026-27'}), null);
assert.equal(registry.resolveClassVersion({state: 'active', course: 'ib-math-ai'}), null);
assert.equal(registry.resolveClassVersion({state: 'planned', course_version_id: future.id}), null);
assert.equal(registry.resolveClassVersion({state: 'superseded', course_version_id: active.id}), null);
assert.equal(registry.resolveClassVersion({state: 'active', course_version_id: active.id}).id, active.id);
for (const value of [future.id, active.key, 'ib-math-ai', 'unknown-version', '', false]) {
  assert.throws(() => registry.resolveClassVersion({state: 'active', course_version_id: value}), TypeError);
}
for (const options of [null, false, {includeFuture: 'false'}, {year: 2029}]) assert.throws(() => registry.listCourseVersions(options), TypeError);
assert.throws(() => registry.getCourseVersion(2029), TypeError);
assert.throws(() => registry.resolveClassVersion({state: 'activate'}), TypeError);

input.course_versions[0].title = 'Changed by caller';
input.curriculum_versions[0].status = 'retired';
const returned = registry.getCourseVersion(data.course_versions[0].id);
returned.title = 'Changed returned record';
returned.assessment_profile.sections[0].question_count = -1;
const listed = registry.listCourseVersions({includeFuture: true});
listed.find(course => course.id === future.id).scope.current_cohort_use = true;
assert.equal(registry.getCourseVersion(data.course_versions[0].id).title, data.course_versions[0].title);
assert.equal(registry.getCourseVersion(data.course_versions[0].id).assessment_profile.sections[0].question_count, 42);
assert.equal(registry.getCourseVersion(future.id).scope.current_cohort_use, false);
assert.ok(Object.isFrozen(registry));

let rejected = 0;
function reject(label, mutate) {
  const malformed = clone(data);
  mutate(malformed);
  assert.throws(() => createCurriculumRegistry(malformed), TypeError, label);
  rejected++;
}
for (const field of ['course_versions', 'curriculum_versions', 'sources']) {
  reject(`${field} missing`, value => { delete value[field]; });
  reject(`${field} empty`, value => { value[field] = []; });
  reject(`${field} wrong type`, value => { value[field] = {}; });
}
reject('implicit assignment', value => { value.automatic_cohort_assignment = true; });
reject('assignment policy', value => { value.assignment_policy = 'by-year'; });
reject('bad revision', value => { value.revision = '1'; });
reject('invalid real date', value => { value.verified_at = '2026-02-30'; });
reject('source id missing', value => { delete value.sources[0].id; });
reject('duplicate source', value => { value.sources.push(clone(value.sources[0])); });
reject('insecure source URL', value => { value.sources[0].url = 'javascript:alert(1)'; });
reject('source retrieval date missing', value => { delete value.sources[0].retrieved_at; });
reject('course id missing', value => { delete value.course_versions[0].id; });
reject('duplicate course ID', value => { value.course_versions[1].id = value.course_versions[0].id; });
reject('duplicate course key', value => { value.course_versions[1].key = value.course_versions[0].key; });
reject('course id/key collision', value => { value.course_versions[1].key = value.course_versions[0].id; });
reject('duplicate parent ID', value => { value.curriculum_versions[1].id = value.curriculum_versions[0].id; });
reject('duplicate parent key', value => { value.curriculum_versions[1].key = value.curriculum_versions[0].key; });
reject('unresolved parent', value => { value.course_versions[0].curriculum_version_id = 'absent'; });
reject('parent key is not parent ID', value => { value.course_versions[0].curriculum_version_id = value.curriculum_versions[0].key; });
reject('course source missing', value => { value.course_versions[0].source_references = []; });
reject('unresolved course source', value => { value.course_versions[0].source_references = ['absent']; });
reject('unresolved parent source', value => { value.curriculum_versions[0].source_references = ['absent']; });
reject('duplicate source reference', value => { value.course_versions[0].source_references.push(value.course_versions[0].source_references[0]); });
reject('empty course metadata', value => { value.course_versions[0].title = '  '; });
reject('empty edition', value => { value.curriculum_versions[0].edition = ''; });
reject('missing verifier', value => { delete value.curriculum_versions[0].verified_by; });
reject('boolean placeholder required', value => { value.course_versions[0].is_placeholder = 'false'; });
reject('reviewed school year required', value => { value.course_versions[0].school_year = null; });
reject('placeholder cannot claim a school year', value => { value.course_versions.find(course => course.id === future.id).school_year = '2028-29'; });
reject('placeholder profile must remain unimported', value => { value.course_versions.find(course => course.id === future.id).assessment_profile = clone(active.assessment_profile); });
reject('placeholder cannot enable cohort use', value => { value.course_versions.find(course => course.id === future.id).scope.current_cohort_use = true; });
reject('empty scope', value => { value.course_versions[0].scope = {}; });
reject('active profile required', value => { value.course_versions[0].assessment_profile = null; });
reject('assessment type', value => { value.course_versions[0].assessment_profile.sections[0].question_count = '42'; });
reject('inconsistent partition', value => { value.course_versions[0].assessment_profile.sections[0].parts[0].duration_minutes = 61; });
reject('duplicate section id', value => { value.course_versions[0].assessment_profile.sections[1].id = 'mcq'; });
reject('invalid status', value => { value.course_versions[0].status = 'approved'; });
for (const status of ['future', 'retired']) reject(`active course/${status} parent`, value => { value.curriculum_versions[0].status = status; });
reject('future placeholder cannot be active', value => { value.course_versions.find(course => course.id === future.id).status = 'active'; });
reject('unimported future scope cannot become active by changing flags', value => {
  const course = value.course_versions.find(row => row.id === future.id);
  course.status = 'active'; course.is_placeholder = false; course.assessment_profile = clone(active.assessment_profile);
  value.curriculum_versions.find(row => row.id === course.curriculum_version_id).status = 'active';
});
reject('nonfinite JSON metadata', value => { value.extra = NaN; });
const cyclic = clone(data); cyclic.extra = cyclic;
assert.throws(() => createCurriculumRegistry(cyclic), TypeError);
const accessor = clone(data); Object.defineProperty(accessor, 'extra', {enumerable: true, get() { return 'unstable'; }});
assert.throws(() => createCurriculumRegistry(accessor), TypeError);

const retiredInput = clone(data); retiredInput.course_versions[0].status = 'retired';
const retiredRegistry = createCurriculumRegistry(retiredInput);
assert.ok(!retiredRegistry.listCourseVersions({includeFuture: true}).some(course => course.id === retiredInput.course_versions[0].id));
assert.throws(() => retiredRegistry.resolveClassVersion({state: 'active', course_version_id: retiredInput.course_versions[0].id}), TypeError);

// Advancing the system clock must never switch cohorts or activate the 2029 placeholder.
const OriginalDate = globalThis.Date;
try {
  globalThis.Date = class { constructor() { throw Error('Registry must not read the clock'); } static now() { return 2100000000000; } };
  const later = createCurriculumRegistry(data);
  assert.equal(later.resolveClassVersion({state: 'active', course_version_id: active.id}).id, active.id);
  assert.throws(() => later.resolveClassVersion({state: 'active', course_version_id: future.id}), TypeError);
} finally { globalThis.Date = OriginalDate; }
const moduleSource = fs.readFileSync(new URL('js/curriculum-versions.mjs', base), 'utf8');
assert.doesNotMatch(moduleSource, /\b(?:fetch|localStorage|document|window)\b|\bimport\s/);
for (const path of ['index.html', 'data/courses.js', 'js/portal.js', 'js/institution-client.js']) {
  const url = new URL(path, base);
  if (fs.existsSync(url)) assert.doesNotMatch(fs.readFileSync(url, 'utf8'), /curriculum-versions\.mjs/, `Existing runtime must not import registry automatically: ${path}`);
}
console.log(`Curriculum registry: PASS (${rejected} malformed-registry cases; explicit ID pins, source/parent integrity, assessment types/partitions, immutable copies, no clock adoption or runtime activation).`);
