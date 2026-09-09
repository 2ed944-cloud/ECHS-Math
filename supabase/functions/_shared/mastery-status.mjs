// ECHS-C02: presentation policy, not a grader or a certification authority.
// Current attempt ingestion accepts client-reported answers and assistance/time.
// Recomputing those records on the server does not authenticate their correctness.
export const STATUS_CONTRACT = 'echs.mastery-status.v1';

function field(value, key) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  try {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    return descriptor && Object.hasOwn(descriptor, 'value') ? descriptor.value : undefined;
  } catch { return undefined; }
}
function numeric(value, maximum = Number.MAX_SAFE_INTEGER) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= maximum ? value : null;
}

/** Pure projection of existing evidence. No input, including receipt-like fields,
 * can enable verified mastery until a separate authenticated grading contract exists.
 * Missing-evidence codes describe recorded practice diagnostics, not trusted proofs.
 */
export function projectMasteryStatus(record) {
  const attempts = numeric(field(record, 'attempts'));
  const score = numeric(field(record, 'score'), 100);
  const hasAttempts = attempts !== null && attempts > 0;
  const sufficient = hasAttempts && score !== null;
  const missing = ['grading_provenance_missing'];
  if (!hasAttempts) missing.push('practice_attempts_missing');
  if (score === null) missing.push('practice_score_missing');
  const rules = field(field(record, 'payload'), 'requirements');
  const diagnostic = (key, minimum, name, maximum) => {
    const value = numeric(field(record, key), maximum);
    if (value === null) missing.push(`${name}_unavailable`);
    else if (value < minimum) missing.push(`${name}_insufficient`);
  };
  // These are the existing foundation's defaults; they do not change its score.
  diagnostic('independent_evidence', numeric(field(rules, 'minimumIndependent')) ?? 4, 'independent_evidence');
  diagnostic('active_days', numeric(field(rules, 'minimumDays')) ?? 2, 'active_days');
  diagnostic('confidence', numeric(field(rules, 'minimumConfidence'), 1) ?? .72, 'confidence', 1);
  for (const [key, rule] of [['transfer_evidence', 'requiresTransfer'], ['retention_evidence', 'requiresRetention']]) {
    const value = numeric(field(record, key));
    if (value === null) missing.push(`${key}_unavailable`);
    else if (field(rules, rule) === true && value < 1) missing.push(`${key}_insufficient`);
  }
  const display = !sufficient ? 'Insufficient practice evidence'
    : score >= 85 ? 'Strong practice performance'
    : score >= 65 ? 'Proficient practice performance'
    : score >= 35 ? 'Developing practice performance' : 'Starting practice performance';
  return Object.freeze({
    status_contract: STATUS_CONTRACT,
    evidence_status: sufficient ? 'provisional' : 'insufficient',
    verified_mastery: false,
    display_level: display,
    provenance: hasAttempts ? 'client_reported' : 'unknown',
    missing_evidence: Object.freeze(missing),
  });
}

/** Response-only compatibility projection; the supplied/stored record is untouched.
 * Old algorithm claims remain explicitly diagnostic, never the active label/flag.
 */
export function projectMasteryRecord(record) {
  const status = projectMasteryStatus(record);
  const payload = field(record, 'payload');
  const hasPayload = payload && typeof payload === 'object' && !Array.isArray(payload);
  return {
    ...record,
    ...status,
    level: status.display_level,
    last_verified_at: null,
    ...(hasPayload ? {payload: {...payload, level: status.display_level, verified: false}} : {}),
    legacy_algorithm_diagnostics: {
      interpretation: 'Server recomputation of client-reported practice; not authenticated grading.',
      level: field(payload, 'level') ?? null,
      verified: field(payload, 'verified') ?? null,
      last_verified_at: field(record, 'last_verified_at') ?? null,
    },
  };
}

/** Aggregate certification status only; score/accuracy/routing remain caller-owned. */
export function projectMasterySummary(records) {
  const statuses = Array.isArray(records) ? records.map(projectMasteryStatus) : [];
  const hasPractice = statuses.some(value => value.provenance === 'client_reported');
  const provisional = statuses.some(value => value.evidence_status === 'provisional');
  return {
    status_contract: STATUS_CONTRACT,
    grading_authoritative: false,
    verified_mastery: false,
    evidence_status: provisional ? 'provisional' : 'insufficient',
    provenance: hasPractice ? 'client_reported' : 'unknown',
    missing_evidence: statuses.length ? [...new Set(statuses.flatMap(value => value.missing_evidence))] : [...projectMasteryStatus(null).missing_evidence],
  };
}
