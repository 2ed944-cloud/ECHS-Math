-- ECHS Mathematics · IB bank visibility diagnostic (READ-ONLY)
-- Run in the Supabase SQL editor. Explains why uploaded IB banks appear/disappear in Practice.
-- Practice reads /student-questions, which ONLY returns rows where:
--   student_visible = true AND mapping_verified = true
--   AND trust_tier IN ('publisher_key_direct','student_ready_verified')
--   AND course_keys @> ARRAY['ib-math-ai']
-- If they "appeared then disappeared", the most common cause is a COURSE PURGE job
-- (it strips 'ib-math-ai' from course_keys/course_mappings in resumable batches),
-- or a re-import that reset the release flags. Queries 0a/0b check exactly that.

-- 0a) COURSE PURGE JOBS for IB  ── the #1 cause of "appeared then disappeared"
--     A completed/running purge here means the IB mappings were stripped → vanished.
select id, status, phase, created_at, started_at, completed_at, updated_at,
       progress, totals, last_error
from public.private_bank_course_purge_jobs
where course_key = 'ib-math-ai'
order by updated_at desc
limit 10;

-- 0b) RECENT IMPORT RUNS for IB banks (did a re-import fail or leave flags unset?)
select id, bank_code, status, question_count, media_count,
       started_at, completed_at, error_message
from public.private_bank_import_runs
where bank_code ILIKE 'IBAI%' OR bank_code ILIKE '%IB%'
order by started_at desc
limit 15;

-- 1) CURRENT uploaded vs actually released to students (snapshot right now)
select
  count(*)                                                          as ib_uploaded,
  count(*) filter (where student_visible)                           as student_visible_true,
  count(*) filter (where mapping_verified)                          as mapping_verified_true,
  count(*) filter (where trust_tier in ('publisher_key_direct','student_ready_verified')) as trust_tier_ok,
  count(*) filter (
    where student_visible and mapping_verified
      and trust_tier in ('publisher_key_direct','student_ready_verified')
  )                                                                 as fully_released
from public.private_bank_questions
where course_keys @> array['ib-math-ai'];

-- 1b) Are the IB mappings still present at all? (purge removes them from course_keys)
--     If this is 0 while /packages still counts IB questions, a purge stripped the mappings.
select
  count(*) as rows_still_tagged_ib,
  count(*) filter (where course_mappings::text ILIKE '%ib-math-ai%') as rows_with_ib_mapping
from public.private_bank_questions
where course_keys @> array['ib-math-ai'];

-- 2) For NOT-yet-released IB rows, which contract fields are blocking release
select
  count(*)                                                                            as not_released,
  count(*) filter (where not mapping_verified)                                        as missing_mapping_verified,
  count(*) filter (where trust_tier not in ('publisher_key_direct','student_ready_verified')) as bad_trust_tier,
  count(*) filter (where coalesce((payload #>> '{trust,source_verified}')::boolean,false) is not true)  as missing_source_verified,
  count(*) filter (where coalesce((payload #>> '{trust,media_verified}')::boolean,false) is not true)    as missing_media_verified,
  count(*) filter (where coalesce((payload #>> '{trust,mapping_verified}')::boolean,false) is not true)  as missing_payload_mapping_verified,
  count(*) filter (where coalesce((payload #>> '{rights,student_publication_allowed}')::boolean,false) is not true) as missing_publication_right,
  count(*) filter (where coalesce((payload #>> '{metadata,student_ready}')::boolean,false) is not true)  as missing_student_ready
from public.private_bank_questions
where course_keys @> array['ib-math-ai']
  and not (student_visible and mapping_verified
           and trust_tier in ('publisher_key_direct','student_ready_verified'));

-- 3) Released IB questions per unit (what a teacher full-course browse would return)
select cm->>'unit' as ib_unit, count(*) as released_questions
from public.private_bank_questions q
     cross join lateral jsonb_array_elements(coalesce(q.payload->'course_mappings','[]'::jsonb)) cm
where q.course_keys @> array['ib-math-ai']
  and q.student_visible and q.mapping_verified
  and q.trust_tier in ('publisher_key_direct','student_ready_verified')
  and cm->>'course' = 'ib-math-ai'
group by 1 order by 1;

-- ── HOW TO READ THIS ─────────────────────────────────────────────
-- • Query 0a shows a purge job (status completed/running) → that DELETED the IB mappings.
--     Fix: re-run the secure IB import (Teacher Upload Manager) to re-add mappings +
--     student_visible=true. Do NOT start another purge.
-- • Query 1 fully_released = 0 but ib_uploaded > 0 → uploaded but not released.
--     Fix: re-import with the student-ready contract (the import tool sets all flags).
-- • Query 1b rows_still_tagged_ib = 0 → mappings were stripped (purge). Re-import.
-- • Query 2 shows which specific payload fields are missing on blocked rows.
-- • Note: full-course IB browsing is teacher/admin only; students enter from a lesson.
