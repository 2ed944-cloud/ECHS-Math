// Pure explicit lookup. No catalogue, routing, clock, network, or cohort side effects.
const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
const fail = label => { throw new TypeError(`Invalid curriculum registry: ${label}`); };
const text = (value, label) => { if (typeof value !== 'string' || !value.trim()) fail(label); };
const object = (value, label) => { if (!value || typeof value !== 'object' || Array.isArray(value)) fail(label); };
const array = (value, label) => { if (!Array.isArray(value) || !value.length) fail(label); };

function copy(value, ancestors = new Set()) {
  if (value === null || ['string', 'boolean'].includes(typeof value)) return value;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (!value || typeof value !== 'object' || ancestors.has(value)) fail('JSON value or cycle');
  if (!Array.isArray(value) && ![Object.prototype, null].includes(Object.getPrototypeOf(value))) fail('plain JSON object required');
  for (const descriptor of Object.values(Object.getOwnPropertyDescriptors(value))) if (descriptor.get || descriptor.set) fail('accessor properties');
  ancestors.add(value);
  const result = Array.isArray(value) ? value.map(entry => copy(entry, ancestors)) : Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, copy(entry, ancestors)]));
  ancestors.delete(value);
  return result;
}

function date(value, label, {nullable = false, month = false} = {}) {
  if (nullable && value === null) return;
  text(value, label);
  const match = /^(\d{4})-(\d{2})(?:-(\d{2}))?$/.exec(value);
  if (!match || (!month && !match[3])) fail(label);
  const year = +match[1], m = +match[2], day = +(match[3] || 1);
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const max = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1];
  if (year < 1 || !max || day < 1 || day > max) fail(label);
}

function index(rows, label) {
  array(rows, label);
  const result = new Map();
  for (const row of rows) {
    object(row, label);
    for (const field of ['id', 'key']) {
      text(row[field], `${label}.${field}`);
      if (row[field] !== row[field].trim() || result.has(row[field])) fail(`${label} duplicate or ambiguous identity`);
      result.set(row[field], row);
    }
    if (!['active', 'future', 'retired'].includes(row.status)) fail(`${label}.status`);
  }
  return result;
}

function references(row, sources) {
  array(row.source_references, 'source_references');
  if (new Set(row.source_references).size !== row.source_references.length) fail('duplicate source reference');
  for (const ref of row.source_references) {
    text(ref, 'source reference');
    if (!sources.has(ref)) fail('unresolved source reference');
  }
  date(row.verified_at, 'verified_at');
}

function assessment(profile) {
  object(profile, 'assessment_profile');
  date(profile.effective_exam_period, 'effective_exam_period', {month: true});
  if (profile.delivery !== null) text(profile.delivery, 'delivery');
  if (profile.response_modes !== null) { array(profile.response_modes, 'response_modes'); profile.response_modes.forEach(mode => text(mode, 'response mode')); }
  const parts = rows => {
    array(rows, 'assessment sections/parts');
    const ids = new Set();
    for (const row of rows) {
      object(row, 'assessment section/part'); text(row.id, 'assessment id');
      if (ids.has(row.id)) fail('duplicate assessment id'); ids.add(row.id);
      for (const key of ['question_count', 'duration_minutes', 'weight_percent', ...(own(row, 'marks') ? ['marks'] : [])]) {
        const value = row[key];
        if (value !== null && (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || (['question_count', 'marks'].includes(key) && !Number.isInteger(value)) || (key === 'weight_percent' && value > 100))) fail(`assessment.${key}`);
      }
      for (const key of ['calculator_policy', 'response_format']) if (own(row, key) && row[key] !== null) text(row[key], key);
      if (own(row, 'parts')) {
        parts(row.parts);
        for (const key of ['question_count', 'duration_minutes', 'weight_percent']) if (row[key] !== null && row.parts.every(part => part[key] !== null) && Math.abs(row.parts.reduce((sum, part) => sum + part[key], 0) - row[key]) > 1e-8) fail(`inconsistent assessment ${key}`);
      }
    }
  };
  parts(profile.sections);
  if (profile.sections.every(section => section.weight_percent !== null) && Math.abs(profile.sections.reduce((sum, section) => sum + section.weight_percent, 0) - 100) > 1e-8) fail('assessment weights must total 100');
}

export function createCurriculumRegistry(data) {
  const snapshot = copy(data);
  object(snapshot, 'root');
  if (snapshot.schema_version !== 'echs.curriculum-registry.v1' || snapshot.automatic_cohort_assignment !== false || snapshot.assignment_policy !== 'explicit_class_pin_only') fail('schema or assignment policy');
  if (!Number.isSafeInteger(snapshot.revision) || snapshot.revision < 1) fail('revision');
  date(snapshot.verified_at, 'registry verified_at');
  array(snapshot.sources, 'sources');
  const sources = new Set();
  for (const source of snapshot.sources) {
    object(source, 'source'); text(source.id, 'source.id'); text(source.url, 'source.url');
    if (sources.has(source.id) || source.id !== source.id.trim()) fail('duplicate source id'); sources.add(source.id);
    let url; try { url = new URL(source.url); } catch { fail('source.url'); }
    if (url.protocol !== 'https:' || url.username || url.password) fail('source.url');
    date(source.retrieved_at, 'source.retrieved_at');
  }
  const curricula = index(snapshot.curriculum_versions, 'curriculum_versions');
  for (const version of snapshot.curriculum_versions) {
    for (const key of ['family', 'name', 'edition', 'verified_by', 'verification_kind']) text(version[key], `curriculum.${key}`);
    date(version.first_assessment, 'first_assessment', {month: true});
    for (const key of ['last_assessment', 'effective_from', 'effective_to']) date(version[key], key, {nullable: true, month: true});
    if (version.last_assessment && version.last_assessment < version.first_assessment) fail('assessment date order');
    if (version.effective_from && version.effective_to && version.effective_to < version.effective_from) fail('effective date order');
    references(version, sources);
  }
  const records = index(snapshot.course_versions, 'course_versions');
  for (const course of snapshot.course_versions) {
    for (const key of ['curriculum_version_id', 'course_code', 'title']) text(course[key], `course.${key}`);
    if (typeof course.is_placeholder !== 'boolean') fail('course.is_placeholder');
    if (course.school_year !== null && (typeof course.school_year !== 'string' || !/^\d{4}-\d{2}$/.test(course.school_year))) fail('course.school_year');
    object(course.scope, 'course.scope'); if (!Object.keys(course.scope).length) fail('course.scope');
    references(course, sources);
    const parent = curricula.get(course.curriculum_version_id);
    if (!parent || parent.id !== course.curriculum_version_id) fail('unresolved curriculum parent id');
    if (course.status === 'active' && (parent.status !== 'active' || course.is_placeholder || course.scope.current_cohort_use === false || course.scope.objective_mapping_status === 'not_imported')) fail('active course has inactive parent or unreviewed scope');
    if (course.is_placeholder && (course.status !== 'future' || course.school_year !== null || course.assessment_profile !== null || course.scope.objective_mapping_status !== 'not_imported' || course.scope.current_cohort_use !== false)) fail('placeholder must remain future, unassigned, and unimported');
    if (!course.is_placeholder) text(course.school_year, 'reviewed course.school_year');
    if (course.assessment_profile === null) { if (!course.is_placeholder) fail('reviewed course requires assessment metadata'); }
    else assessment(course.assessment_profile);
  }
  return Object.freeze({
    getCourseVersion(idOrKey) {
      text(idOrKey, 'lookup id or key');
      return records.has(idOrKey) ? copy(records.get(idOrKey)) : null;
    },
    listCourseVersions(options = {}) {
      object(options, 'list options');
      if (Object.keys(options).some(key => key !== 'includeFuture') || (own(options, 'includeFuture') && typeof options.includeFuture !== 'boolean')) fail('list options');
      return snapshot.course_versions.filter(course => course.status === 'active' || (options.includeFuture === true && course.status === 'future')).map(course => copy(course));
    },
    resolveClassVersion(assignment) {
      if (assignment === null || assignment === undefined) return null;
      object(assignment, 'class assignment');
      if (!own(assignment, 'state')) return null;
      if (!['planned', 'active', 'superseded'].includes(assignment.state)) fail('class assignment state');
      if (assignment.state !== 'active' || !own(assignment, 'course_version_id')) return null;
      text(assignment.course_version_id, 'class course_version_id');
      const course = records.get(assignment.course_version_id);
      if (!course || course.id !== assignment.course_version_id || course.status !== 'active' || course.is_placeholder) fail('class pin must identify an active reviewed version by id');
      return copy(course);
    }
  });
}
