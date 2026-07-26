-- Repair production username/password authentication.
--
-- The original api_verify_login function used unqualified `account_id`
-- references inside a RETURNS TABLE function that also exposes an output
-- variable named account_id. PostgreSQL can raise SQLSTATE 42702 instead of
-- completing either the failed-password or successful-password update.
-- This forward-only migration fully qualifies all mutable columns and adds a
-- service-role-only transaction self-test used by the deployment gate.

create or replace function public.api_verify_login(
  p_username text,
  p_password text
)
returns table(
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
  organization_settings jsonb
)
language plpgsql
security definer
set search_path = public, private, extensions
as $$
declare
  v_account public.accounts;
  v_credential private.account_credentials;
begin
  select account_row.*
  into v_account
  from public.accounts as account_row
  where account_row.username = private.normalise_username(p_username)
  order by account_row.created_at asc
  limit 1;

  if not found then
    perform pg_sleep(0.15);
    return;
  end if;

  select credential_row.*
  into v_credential
  from private.account_credentials as credential_row
  where credential_row.account_id = v_account.id
  for update;

  if not found then
    perform pg_sleep(0.15);
    return;
  end if;

  if v_account.status <> 'active'
     or (v_credential.locked_until is not null and v_credential.locked_until > now()) then
    perform pg_sleep(0.15);
    return;
  end if;

  if v_credential.password_hash <> crypt(p_password, v_credential.password_hash) then
    update private.account_credentials as credential_row
    set failed_attempts = credential_row.failed_attempts + 1,
        locked_until = case
          when credential_row.failed_attempts + 1 >= 5
            then now() + interval '10 minutes'
          else credential_row.locked_until
        end,
        updated_at = now()
    where credential_row.account_id = v_account.id;

    perform pg_sleep(0.15);
    return;
  end if;

  update private.account_credentials as credential_row
  set failed_attempts = 0,
      locked_until = null,
      updated_at = now()
  where credential_row.account_id = v_account.id;

  update public.accounts as account_row
  set last_login_at = now(),
      updated_at = now()
  where account_row.id = v_account.id;

  return query
  select
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
    organization_row.settings
  from public.accounts as account_row
  join public.organizations as organization_row
    on organization_row.id = account_row.organization_id
  where account_row.id = v_account.id;
end;
$$;

revoke all on function public.api_verify_login(text, text)
  from public, anon, authenticated;
grant execute on function public.api_verify_login(text, text)
  to service_role;

comment on function public.api_verify_login(text, text)
  is 'Verifies a school-managed password, applies lockout policy and returns the active account contract.';

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
  v_org_id uuid;
  v_account_id uuid;
  v_verified_id uuid;
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
    raise exception using
      errcode = 'P0001',
      message = 'Login self-test accepted an invalid password';
  end if;

  select verified_login.account_id
  into v_verified_id
  from public.api_verify_login(v_username, v_password) as verified_login;

  if v_verified_id is distinct from v_account_id then
    raise exception using
      errcode = 'P0001',
      message = 'Login self-test did not return the expected account';
  end if;

  select credential_row.failed_attempts, credential_row.locked_until
  into v_failed_attempts, v_locked_until
  from private.account_credentials as credential_row
  where credential_row.account_id = v_account_id;

  if v_failed_attempts <> 0 or v_locked_until is not null then
    raise exception using
      errcode = 'P0001',
      message = 'Login self-test did not reset credential lockout state';
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
  is 'Creates and removes a temporary account to verify failed and successful login transaction paths during deployment.';
