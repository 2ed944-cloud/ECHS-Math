-- Repair the one-time institutional bootstrap transaction.
-- The original function used an unqualified `role` reference inside a
-- RETURNS TABLE function where `role` is also an output variable. PostgreSQL
-- can treat that reference as ambiguous (SQLSTATE 42702). This replacement
-- fully qualifies every table column and serialises concurrent attempts.

create or replace function public.api_bootstrap_admin(
  p_organization_name text,
  p_organization_slug text,
  p_username text,
  p_display_name text,
  p_email text,
  p_password text
)
returns table(account_id uuid, organization_id uuid, username text, display_name text, role text)
language plpgsql
security definer
set search_path = public, private, extensions
as $$
declare
  v_org_id uuid;
  v_account_id uuid;
  v_username text;
  v_email text;
begin
  -- Transaction-scoped lock prevents two simultaneous first-admin requests.
  perform pg_advisory_xact_lock(hashtext('echs-institution-bootstrap-v1'));

  if exists (
    select 1
    from public.accounts as existing_account
    where existing_account.role = 'admin'
  ) then
    raise exception using
      errcode = 'P0001',
      message = 'Bootstrap is already complete';
  end if;

  if not private.password_is_strong(p_password) then
    raise exception using
      errcode = '22023',
      message = 'Password does not meet the minimum policy';
  end if;

  v_username := private.normalise_username(p_username);
  if v_username !~ '^[a-z0-9._-]{3,40}$' then
    raise exception using
      errcode = '22023',
      message = 'Invalid username';
  end if;

  if length(trim(p_organization_name)) < 2 then
    raise exception using errcode = '22023', message = 'Invalid institution name';
  end if;

  if lower(trim(p_organization_slug)) !~ '^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$' then
    raise exception using errcode = '22023', message = 'Invalid institution slug';
  end if;

  v_email := nullif(trim(coalesce(p_email, '')), '');

  insert into public.organizations(name, slug)
  values (trim(p_organization_name), lower(trim(p_organization_slug)))
  returning public.organizations.id into v_org_id;

  insert into public.accounts(
    organization_id,
    username,
    display_name,
    email,
    role,
    can_manage_accounts
  ) values (
    v_org_id,
    v_username,
    trim(p_display_name),
    v_email,
    'admin',
    true
  )
  returning public.accounts.id into v_account_id;

  insert into private.account_credentials(account_id, password_hash)
  values (
    v_account_id,
    crypt(p_password, gen_salt('bf', 12))
  );

  insert into public.account_audit_log(
    organization_id,
    actor_id,
    target_account_id,
    action,
    details
  ) values (
    v_org_id,
    v_account_id,
    v_account_id,
    'bootstrap_admin',
    jsonb_build_object('source', 'one_time_setup')
  );

  return query
    select
      created_account.id,
      created_account.organization_id,
      created_account.username,
      created_account.display_name,
      created_account.role
    from public.accounts as created_account
    where created_account.id = v_account_id;
end;
$$;

revoke all on function public.api_bootstrap_admin(text, text, text, text, text, text)
  from public, anon, authenticated;
grant execute on function public.api_bootstrap_admin(text, text, text, text, text, text)
  to service_role;

comment on function public.api_bootstrap_admin(text, text, text, text, text, text)
  is 'Atomically creates the first institution administrator; permanently refuses subsequent bootstrap attempts.';
