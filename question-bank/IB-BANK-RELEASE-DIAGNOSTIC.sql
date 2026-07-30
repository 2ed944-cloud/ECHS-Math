-- ECHS Mathematics · IB bank visibility diagnostic (READ-ONLY)
-- Run in the Supabase SQL editor. Explains why uploaded IB banks may not appear in Practice.
-- Practice reads /student-questions, which ONLY returns rows where:
--   student_visible = true AND mapping_verified = true
--   AND trust_tier IN ('publisher_key_direct','student_ready_verified')
--   AND course_keys @> ARRAY['ib-math-ai']
-- A DB trigger also blocks student_visible=true unless the payload carries the full
-- trust + rights contract and lesson_keys/skill_candidates are present.

-- 1) How many IB questions are uploaded vs actually released to students
select
  count(*)                                                          as ib_uploaded,
  count(*) filter (where student_visible)                           as student_visible_true,
  count(*) filter (where mapping_verified)                          as mapping_verified_true,
  count(*) filter (where trust_tier in ('publisher_key_direct','student_ready_verified')) as trust_tier_ok,
  count(*) filter (where coalesce(array_length(lesson_keys,1),0) >= 1)     as has_lesson_keys,
  count(*) filter (where coalesce(array_length(skill_candidates,1),0) >= 2) as has_skill_candidates,
  count(*) filter (
    where student_visible and mapping_verified
      and trust_tier in ('publisher_key_direct','student_ready_verified')
  )                                                                 as fully_released
from public.private_bank_questions
where course_keys @> array['ib-math-ai'];

-- 2) Of the NOT-yet-released IB rows, which contract fields are missing (top blockers)
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

-- 3) IB released counts per course-mapped unit (what a teacher browse would return)
select cm->>'unit' as ib_unit, count(*) as released_questions
from public.private_bank_questions q
     cross join lateral jsonb_array_elements(coalesce(q.payload->'course_mappings','[]'::jsonb)) cm
where q.course_keys @> array['ib-math-ai']
  and q.student_visible and q.mapping_verified
  and q.trust_tier in ('publisher_key_direct','student_ready_verified')
  and cm->>'course' = 'ib-math-ai'
group by 1 order by 1;
