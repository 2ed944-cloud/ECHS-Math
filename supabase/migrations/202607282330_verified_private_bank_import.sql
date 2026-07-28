-- Allow independently audited private question banks to be uploaded by the Teacher Upload Manager.
-- Keeps publisher-key packages supported while adding the student_ready_verified contract.

DO $$
DECLARE
  constraint_name text;
BEGIN
  SELECT conname
    INTO constraint_name
  FROM pg_constraint
  WHERE conrelid = 'public.private_bank_packages'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) ILIKE '%trust_default%'
  LIMIT 1;

  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.private_bank_packages DROP CONSTRAINT %I', constraint_name);
  END IF;
END
$$;

ALTER TABLE public.private_bank_packages
  ADD CONSTRAINT private_bank_packages_trust_default_check
  CHECK (trust_default IN (
    'publisher_key_direct',
    'student_ready_verified',
    'teacher_review_required'
  ));

CREATE OR REPLACE FUNCTION private.enforce_private_bank_question_release()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private
AS $$
BEGIN
  IF new.student_visible THEN
    IF new.mapping_verified IS NOT TRUE
      OR coalesce(array_length(new.lesson_keys, 1), 0) < 1
      OR coalesce(array_length(new.skill_candidates, 1), 0) < 1
      OR new.trust_tier NOT IN ('publisher_key_direct', 'student_ready_verified')
    THEN
      RAISE EXCEPTION 'Private bank question % is missing direct course, lesson, or skill mapping', new.question_id;
    END IF;

    IF new.trust_tier = 'publisher_key_direct' AND (
      coalesce((new.payload #>> '{trust,source_verified}')::boolean, false) IS NOT TRUE
      OR coalesce((new.payload #>> '{trust,media_verified}')::boolean, false) IS NOT TRUE
      OR coalesce((new.payload #>> '{trust,mapping_verified}')::boolean, false) IS NOT TRUE
      OR coalesce(new.payload #>> '{trust,verification_basis}', '') <> 'publisher-answer-key'
      OR coalesce((new.payload #>> '{trust,manual_question_trust_required}')::boolean, true) IS NOT FALSE
      OR coalesce((new.payload #>> '{rights,student_publication_allowed}')::boolean, false) IS NOT TRUE
      OR coalesce((new.payload #>> '{metadata,student_ready}')::boolean, false) IS NOT TRUE
    ) THEN
      RAISE EXCEPTION 'Private bank question % is missing the publisher-key direct-use contract', new.question_id;
    END IF;

    IF new.trust_tier = 'student_ready_verified' THEN
      IF coalesce((new.payload #>> '{trust,source_verified}')::boolean, false) IS NOT TRUE
        OR coalesce((new.payload #>> '{trust,mathematical_verified}')::boolean, false) IS NOT TRUE
        OR coalesce((new.payload #>> '{trust,independent_math_verified}')::boolean, false) IS NOT TRUE
        OR coalesce((new.payload #>> '{trust,media_verified}')::boolean, false) IS NOT TRUE
        OR coalesce((new.payload #>> '{trust,mapping_verified}')::boolean, false) IS NOT TRUE
        OR coalesce(new.payload #>> '{trust,verification_basis}', '') <> 'independent-solution-audit'
        OR coalesce((new.payload #>> '{trust,manual_question_trust_required}')::boolean, true) IS NOT FALSE
        OR coalesce((new.payload #>> '{rights,student_publication_allowed}')::boolean, false) IS NOT TRUE
        OR coalesce((new.payload #>> '{metadata,student_ready}')::boolean, false) IS NOT TRUE
      THEN
        RAISE EXCEPTION 'Verified private bank question % is missing independent package evidence', new.question_id;
      END IF;

      IF NOT EXISTS (
        SELECT 1
        FROM public.question_trust_records trust
        WHERE trust.question_id = new.question_id
          AND trust.trust_tier = 'student_ready_verified'
          AND trust.student_visible IS TRUE
          AND trust.source_verified IS TRUE
          AND trust.mathematical_verified IS TRUE
          AND trust.media_verified IS TRUE
          AND trust.mapping_verified IS TRUE
      ) THEN
        RAISE EXCEPTION 'Verified private bank question % does not have complete Question Trust evidence', new.question_id;
      END IF;
    END IF;
  END IF;
  RETURN new;
END;
$$;

COMMENT ON FUNCTION private.enforce_private_bank_question_release() IS
  'Allows one or more verified lesson/skill mappings and enforces either publisher-key or independent-solution trust evidence before student release.';
