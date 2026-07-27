-- Preserve the direct publisher-key evidence tier when private-bank attempts sync.
-- Independently verified questions still take precedence through question_trust_records.

create or replace function private.apply_question_trust_to_attempt()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_tier text;
begin
  select trust.trust_tier into v_tier
  from public.question_trust_records trust
  where trust.question_id = new.question_id;

  if v_tier is null then
    select question.trust_tier into v_tier
    from public.private_bank_questions question
    where question.organization_id = new.organization_id
      and question.question_id = new.question_id
      and question.student_visible is true
      and question.mapping_verified is true
      and question.trust_tier = 'publisher_key_direct';
  end if;

  new.trust_tier := coalesce(v_tier, 'legacy_verified_boundary');
  return new;
end;
$$;

revoke all on function private.apply_question_trust_to_attempt() from public, anon, authenticated;
grant execute on function private.apply_question_trust_to_attempt() to service_role;

comment on function private.apply_question_trust_to_attempt() is
  'Derives attempt trust from independently verified records first, then authenticated publisher-key direct private banks.';
