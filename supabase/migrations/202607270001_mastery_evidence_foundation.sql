-- ECHS Mathematics: Question Trust, Knowledge Graph and Mastery 2.0 foundation
-- Adds server-authoritative evidence fields without deleting or regenerating existing learning records.

create table if not exists public.skill_definitions (
  skill_key text primary key,
  course text not null,
  unit text not null,
  topic text,
  title text not null,
  description text not null,
  ap_topics text[] not null default '{}',
  lesson_ids text[] not null default '{}',
  prerequisites text[] not null default '{}',
  representations text[] not null default '{}',
  misconceptions text[] not null default '{}',
  evidence_rules jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists skill_definitions_scope_idx
  on public.skill_definitions(course, unit, active);

create table if not exists public.question_trust_records (
  question_id text primary key,
  trust_tier text not null check (trust_tier in (
    'student_ready_verified',
    'teacher_review_required',
    'indexed_only',
    'rights_restricted'
  )),
  student_visible boolean not null default false,
  source_verified boolean not null default false,
  mathematical_verified boolean not null default false,
  media_verified boolean not null default false,
  mapping_verified boolean not null default false,
  rights_status text not null default 'unresolved',
  skill_keys text[] not null default '{}',
  blockers jsonb not null default '[]'::jsonb,
  evidence jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists question_trust_tier_idx
  on public.question_trust_records(trust_tier, student_visible);

alter table public.learning_attempts
  add column if not exists skill_key text,
  add column if not exists difficulty numeric,
  add column if not exists representation text,
  add column if not exists assistance_level text,
  add column if not exists trust_tier text;

create index if not exists learning_attempts_skill_time_idx
  on public.learning_attempts(account_id, skill_key, occurred_at desc);

alter table public.mastery_records
  add column if not exists confidence numeric not null default 0,
  add column if not exists independent_evidence integer not null default 0,
  add column if not exists transfer_evidence integer not null default 0,
  add column if not exists retention_evidence integer not null default 0,
  add column if not exists representation_count integer not null default 0,
  add column if not exists active_days integer not null default 0,
  add column if not exists last_attempt_at timestamptz,
  add column if not exists last_verified_at timestamptz,
  add column if not exists source text not null default 'server',
  add column if not exists payload jsonb not null default '{}'::jsonb;

create index if not exists mastery_confidence_idx
  on public.mastery_records(organization_id, course, unit, confidence, score);

alter table public.skill_definitions enable row level security;
alter table public.question_trust_records enable row level security;
revoke all on public.skill_definitions from anon, authenticated;
revoke all on public.question_trust_records from anon, authenticated;
grant all on public.skill_definitions to service_role;
grant all on public.question_trust_records to service_role;

insert into public.skill_definitions (
  skill_key, course, unit, topic, title, description, ap_topics, lesson_ids,
  prerequisites, representations, misconceptions, evidence_rules
) values
(
  'APCALC.U1.RATE.INSTANTANEOUS','ap-calculus','1','1.1',
  'Interpret instantaneous rate through limiting average rates',
  'Connect shrinking-interval average rates and secant slopes to an instantaneous rate and tangent slope.',
  array['1.1'],array['1.1'],array[]::text[],array['symbolic','graphical','numerical','contextual'],
  array['instantaneous-rate-is-direct-substitution','secant-and-tangent-slopes-are-identical'],
  '{"minimum_independent":4,"minimum_days":2,"requires_transfer":true,"requires_retention":true,"minimum_confidence":0.72}'::jsonb
),
(
  'APCALC.U1.LIMIT.NOTATION','ap-calculus','1','1.2',
  'Interpret and write limit notation',
  'Distinguish the value of a function at an input from the value approached near that input.',
  array['1.2'],array['1.2'],array['APCALC.U1.RATE.INSTANTANEOUS'],array['symbolic','verbal'],
  array['limit-equals-function-value','direction-symbol-ignored'],
  '{"minimum_independent":4,"minimum_days":2,"requires_transfer":false,"requires_retention":true,"minimum_confidence":0.70}'::jsonb
),
(
  'APCALC.U1.LIMIT.GRAPH','ap-calculus','1','1.3',
  'Estimate limits from graphs',
  'Read left-hand, right-hand and two-sided limits from graphical behaviour.',
  array['1.3'],array['1.3'],array['APCALC.U1.LIMIT.NOTATION'],array['graphical','verbal','symbolic'],
  array['closed-dot-controls-limit','left-and-right-disagreement-overlooked'],
  '{"minimum_independent":5,"minimum_days":2,"requires_transfer":true,"requires_retention":true,"minimum_confidence":0.74}'::jsonb
),
(
  'APCALC.U1.LIMIT.TABLE','ap-calculus','1','1.4',
  'Estimate limits from numerical tables',
  'Select inputs approaching a target from both sides and infer a supported limit.',
  array['1.4'],array['1.4'],array['APCALC.U1.LIMIT.NOTATION'],array['tabular','numerical','symbolic'],
  array['uses-target-input-in-table','claims-unsupported-precision'],
  '{"minimum_independent":4,"minimum_days":2,"requires_transfer":true,"requires_retention":true,"minimum_confidence":0.72}'::jsonb
),
(
  'APCALC.U1.LIMIT.LAWS','ap-calculus','1','1.5',
  'Apply algebraic properties of limits',
  'Use algebraic limit properties only when their conditions are satisfied.',
  array['1.5'],array['1.5'],array['APCALC.U1.LIMIT.NOTATION'],array['symbolic','verbal'],
  array['quotient-law-used-with-zero-denominator-limit','composition-law-used-without-continuity-condition'],
  '{"minimum_independent":5,"minimum_days":2,"requires_transfer":true,"requires_retention":true,"minimum_confidence":0.74}'::jsonb
),
(
  'APCALC.U1.LIMIT.FACTOR','ap-calculus','1','1.6',
  'Resolve indeterminate forms by factoring',
  'Rewrite an equivalent expression by factoring and removing a common factor.',
  array['1.6'],array['1.6'],array['APCALC.U1.LIMIT.LAWS'],array['symbolic','graphical'],
  array['zero-over-zero-is-zero','cancels-terms-instead-of-factors'],
  '{"minimum_independent":5,"minimum_days":2,"requires_transfer":true,"requires_retention":true,"minimum_confidence":0.75}'::jsonb
),
(
  'APCALC.U1.LIMIT.RATIONALISE','ap-calculus','1','1.6',
  'Resolve indeterminate forms by rationalising',
  'Use a conjugate to rewrite radical expressions before evaluating a limit.',
  array['1.6'],array['1.6'],array['APCALC.U1.LIMIT.LAWS'],array['symbolic'],
  array['conjugate-applied-to-one-factor-only','radical-distribution-error'],
  '{"minimum_independent":4,"minimum_days":2,"requires_transfer":true,"requires_retention":true,"minimum_confidence":0.73}'::jsonb
),
(
  'APCALC.U1.LIMIT.PROCEDURE','ap-calculus','1','1.7',
  'Select an efficient limit procedure',
  'Classify a limit expression and select an appropriate procedure.',
  array['1.7'],array['1.7'],array['APCALC.U1.LIMIT.LAWS','APCALC.U1.LIMIT.FACTOR','APCALC.U1.LIMIT.RATIONALISE'],array['symbolic','verbal'],
  array['uses-one-procedure-for-every-limit','fails-to-check-indeterminate-form'],
  '{"minimum_independent":6,"minimum_days":3,"requires_transfer":true,"requires_retention":true,"minimum_confidence":0.78}'::jsonb
),
(
  'APCALC.U1.LIMIT.SQUEEZE','ap-calculus','1','1.8',
  'Use the Squeeze Theorem',
  'Justify a limit using bounding functions with a common limiting value.',
  array['1.8'],array['1.8'],array['APCALC.U1.LIMIT.LAWS'],array['symbolic','graphical','verbal'],
  array['bounds-do-not-share-limit','inequality-direction-not-preserved'],
  '{"minimum_independent":4,"minimum_days":2,"requires_transfer":true,"requires_retention":true,"minimum_confidence":0.75}'::jsonb
),
(
  'APCALC.U1.LIMIT.MULTIREP','ap-calculus','1','1.9',
  'Connect multiple representations of limits',
  'Reconcile graphical, numerical, analytical and verbal evidence about limiting behaviour.',
  array['1.9'],array['1.9'],array['APCALC.U1.LIMIT.GRAPH','APCALC.U1.LIMIT.TABLE','APCALC.U1.LIMIT.PROCEDURE'],array['symbolic','graphical','tabular','verbal','contextual'],
  array['treats-representations-as-unrelated','chooses-point-value-over-nearby-behaviour'],
  '{"minimum_independent":6,"minimum_days":3,"requires_transfer":true,"requires_retention":true,"minimum_confidence":0.80}'::jsonb
),
(
  'APCALC.U1.DISCONTINUITY.CLASSIFY','ap-calculus','1','1.10',
  'Classify discontinuities',
  'Distinguish removable, jump and infinite discontinuities.',
  array['1.10'],array['1.10'],array['APCALC.U1.LIMIT.GRAPH','APCALC.U1.LIMIT.NOTATION'],array['graphical','symbolic','verbal'],
  array['all-discontinuities-are-holes','vertical-asymptote-called-jump'],
  '{"minimum_independent":5,"minimum_days":2,"requires_transfer":true,"requires_retention":true,"minimum_confidence":0.75}'::jsonb
),
(
  'APCALC.U1.CONTINUITY.POINT','ap-calculus','1','1.11',
  'Justify continuity at a point',
  'Verify the three conditions required for continuity at a point.',
  array['1.11'],array['1.11'],array['APCALC.U1.LIMIT.NOTATION','APCALC.U1.DISCONTINUITY.CLASSIFY'],array['symbolic','graphical','verbal'],
  array['checks-only-function-defined','checks-only-limit-exists'],
  '{"minimum_independent":5,"minimum_days":2,"requires_transfer":true,"requires_retention":true,"minimum_confidence":0.77}'::jsonb
),
(
  'APCALC.U1.CONTINUITY.INTERVAL','ap-calculus','1','1.12',
  'Determine intervals of continuity',
  'Identify intervals where a function is continuous using correct interval notation.',
  array['1.12'],array['1.12'],array['APCALC.U1.CONTINUITY.POINT'],array['symbolic','graphical'],
  array['includes-discontinuity-endpoint','ignores-domain-restrictions'],
  '{"minimum_independent":4,"minimum_days":2,"requires_transfer":true,"requires_retention":true,"minimum_confidence":0.74}'::jsonb
),
(
  'APCALC.U1.CONTINUITY.PARAMETER','ap-calculus','1','1.13',
  'Choose parameters that create continuity',
  'Use a limit condition to solve for a parameter that joins pieces continuously.',
  array['1.13'],array['1.13'],array['APCALC.U1.CONTINUITY.POINT','APCALC.U1.LIMIT.PROCEDURE'],array['symbolic','graphical'],
  array['sets-piece-formulas-equal-without-evaluating-limit','uses-wrong-one-sided-piece'],
  '{"minimum_independent":5,"minimum_days":2,"requires_transfer":true,"requires_retention":true,"minimum_confidence":0.77}'::jsonb
),
(
  'APCALC.U1.INFINITE.LIMITS','ap-calculus','1','1.14',
  'Interpret infinite limits and vertical asymptotes',
  'Determine one-sided infinite behaviour and connect it to vertical asymptotes.',
  array['1.14','1.15'],array['1.14','1.15'],array['APCALC.U1.LIMIT.GRAPH','APCALC.U1.LIMIT.PROCEDURE'],array['symbolic','graphical','tabular'],
  array['infinity-treated-as-number','two-sided-infinite-limit-claimed-when-signs-differ'],
  '{"minimum_independent":5,"minimum_days":2,"requires_transfer":true,"requires_retention":true,"minimum_confidence":0.76}'::jsonb
),
(
  'APCALC.U1.IVT','ap-calculus','1','1.16',
  'Apply the Intermediate Value Theorem',
  'Verify continuity and endpoint conditions to justify the existence of a target output.',
  array['1.16'],array['1.16'],array['APCALC.U1.CONTINUITY.INTERVAL'],array['symbolic','graphical','verbal','contextual'],
  array['ivt-proves-unique-solution','continuity-condition-omitted','target-not-between-endpoint-values'],
  '{"minimum_independent":5,"minimum_days":3,"requires_transfer":true,"requires_retention":true,"minimum_confidence":0.80}'::jsonb
)
on conflict (skill_key) do update set
  course = excluded.course,
  unit = excluded.unit,
  topic = excluded.topic,
  title = excluded.title,
  description = excluded.description,
  ap_topics = excluded.ap_topics,
  lesson_ids = excluded.lesson_ids,
  prerequisites = excluded.prerequisites,
  representations = excluded.representations,
  misconceptions = excluded.misconceptions,
  evidence_rules = excluded.evidence_rules,
  active = true,
  updated_at = now();
