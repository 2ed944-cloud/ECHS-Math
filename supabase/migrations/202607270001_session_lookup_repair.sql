-- Repair post-login session lookup and expand the production auth self-test.
--
-- The original api_session_lookup() is a RETURNS TABLE function exposing an
-- output variable named expires_at while also using an unqualified
-- `expires_at > now()` predicate in an UPDATE on private.sessions. PostgreSQL
-- can raise SQLSTATE 42702, causing /me to fail immediately after a successful
-- login. This migration fully qualifies all session columns and upgrades the
-- deployment self-test to cover login -> session creation -> session lookup ->
-- revocation.

create or replace function public.api_session_lookup(p_token_hash text)
returns table(
  session_id uuid,
  account_id uuid,
  organization_id uuid,
  username text,
  display_name text,
  email text,
  role text,
  status text,
  grade text,
  can_manage_accounts boolean,
  organization_name text,
  organization_settings jsonb,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path = public, private
as $$
begin
  update private.sessions as session_row
  set last_seen_at = now()
  where session_row.token_hash = p_token_hash
    and session_row.revoked_at is null
    and session_row.expires_at > now();

  return query
  select
    session_row.id,
    account_row.id,
    account_row.organization_id,
    account_row.username,
    account_row.display_name,
    account_row.email,
    account_row.role,
    account_row.status,
    account_row.grade,
    account_row.can_manage_accounts,
    organization_row.name,
    organization_row.settings,
    session_row.expires_at
  from private.sessions as session_row
  join public.accounts as account_row
    on account_row.id = session_row.account_id
  join public.organizations as organization_row
    on organization_row.id = account_row.organization_id
  where session_row.token_hash = p_token_hash
    and session_row.revoked_at is null
    and session_row.expires_at > now()
    and account_row.status = 'active';
end;
$$;

revoke all on function public.api_session_lookup(text)
  from public, anon, authenticated;
grant execute on function public.api_session_lookup(text)
  to service_role;

comment on function public.api_session_lookup(text)
  is 'Returns the active school account for a hashed session token and updates last-seen time.';

create or replace function public.api_login_self_test()
returns boolean
language plpgsql
security definer
set search_path = public, private, extensions
as $$
declare
  v_suffix text := substr(replace(gen_random_uuid()::text, '-', ''), 1, 20);
  v_slug text := 'login-test-' || v_suffix;
  v_username text := 'login.test.' || v_suffix;
  v_password text := 'SelfTest-9!Secure';
  v_token_hash text := encode(digest('session-self-test-' || v_suffix, 'sha256'), 'hex');
  v_org_id uuid;
  v_account_id uuid;
  v_verified_id uuid;
  v_session_id uuid;
  v_lookup_account_id uuid;
  v_wrong_count integer;
  v_failed_attempts integer;
  v_locked_until timestamptz;
begin
  insert into public.organizations(name, slug)
  values ('ECHS Login Contract Self-Test', v_slug)
  returning organizations.id into v_org_id;

  insert into public.accounts(
    organization_id,
    username,
    display_name,
    role,
    status,
    can_manage_accounts
  ) values (
    v_org_id,
    v_username,
    'Temporary Login Self-Test',
    'student',
    'active',
    false
  )
  returning accounts.id into v_account_id;

  insert into private.account_credentials(account_id, password_hash)
  values (v_account_id, crypt(v_password, gen_salt('bf', 4)));

  select count(*)
  into v_wrong_count
  from public.api_verify_login(v_username, 'Incorrect-9!Password') as rejected_login;

  if v_wrong_count <> 0 then
    raise exception using errcode = 'P0001', message = 'Login self-test accepted an invalid password';
  end if;

  select verified_login.account_id
  into v_verified_id
  from public.api_verify_login(v_username, v_password) as verified_login;

  if v_verified_id is distinct from v_account_id then
    raise exception using errcode = 'P0001', message = 'Login self-test did not return the expected account';
  end if;

  select credential_row.failed_attempts, credential_row.locked_until
  into v_failed_attempts, v_locked_until
  from private.account_credentials as credential_row
  where credential_row.account_id = v_account_id;

  if v_failed_attempts <> 0 or v_locked_until is not null then
    raise exception using errcode = 'P0001', message = 'Login self-test did not reset credential lockout state';
  end if;

  select public.api_create_session(
    v_account_id,
    v_token_hash,
    now() + interval '5 minutes',
    'self-test-user-agent',
    'self-test-ip'
  ) into v_session_id;

  if v_session_id is null then
    raise exception using errcode = 'P0001', message = 'Session self-test did not create a session';
  end if;

  select lookup_row.account_id
  into v_lookup_account_id
  from public.api_session_lookup(v_token_hash) as lookup_row;

  if v_lookup_account_id is distinct from v_account_id then
    raise exception using errcode = 'P0001', message = 'Session self-test did not resolve the expected account';
  end if;

  perform public.api_revoke_session(v_token_hash);

  if exists (select 1 from public.api_session_lookup(v_token_hash) as revoked_lookup) then
    raise exception using errcode = 'P0001', message = 'Session self-test resolved a revoked session';
  end if;

  delete from public.organizations as organization_row
  where organization_row.id = v_org_id;

  return true;
end;
$$;

revoke all on function public.api_login_self_test()
  from public, anon, authenticated;
grant execute on function public.api_login_self_test()
  to service_role;

comment on function public.api_login_self_test()
  is 'Verifies invalid and valid passwords plus session creation, lookup and revocation using temporary data.';
