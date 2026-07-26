# Phase 5 — One-Time Institutional Setup

## Purpose

The Supabase database and Edge Functions are deployed, but public school sign-in
remains disabled until the first administrator has been created and a separate
reviewed activation change is approved.

The one-time setup wizard is available at:

```text
https://2ed944-cloud.github.io/ECHS-Math/setup.html
```

## What the wizard creates

The wizard calls the dedicated `setup-api` Edge Function and creates:

1. The school organisation.
2. The first administrator account.
3. The administrator's bcrypt password hash.
4. The first account-audit record.

The database function `api_bootstrap_admin` refuses the operation once any
administrator already exists. The setup secret therefore cannot be reused to
create a second bootstrap administrator.

## Required value

The administrator enters the exact value stored as:

```text
ECHS_BOOTSTRAP_SECRET
```

The value is transmitted in the `x-bootstrap-secret` HTTPS request header. The
page does not write the secret or administrator password to local storage,
session storage, cookies, URLs, logs or analytics.

GitHub cannot reveal an existing secret value. If the value was not retained,
replace `ECHS_BOOTSTRAP_SECRET` in GitHub Actions and run **Deploy Institutional
Backend** again before opening the wizard.

## Security boundaries

- Public self-registration remains disabled.
- Google, Microsoft and social sign-in remain disabled.
- Setup requests are accepted only from approved origins or server-side clients.
- The setup page has a restrictive Content Security Policy.
- `setup.html` and `setup-api` bypass the service-worker caches.
- The setup page is excluded from search indexing.
- The setup endpoint returns no administrator password.
- The password is visible only because the administrator entered or generated it
  in the current browser memory.
- The credential download is optional and should be moved to an approved password
  manager, then deleted.
- The setup page automatically clears sensitive in-memory values when leaving.

## Why live sign-in remains disabled during setup

`config/institution.json` intentionally keeps:

```json
"enabled": false
```

and keeps the public `api_base` placeholder. Only `setup_api_base` points to the
deployed project. This prevents partially activated student, teacher, family and
administrator portals from appearing live before the first administrator exists.

After the wizard succeeds, a separate reviewed activation pull request will:

1. Set `api_base` to the deployed Supabase Functions URL.
2. Set `enabled` to `true`.
3. Set `setup_enabled` to `false`.
4. Confirm the setup endpoint reports `complete: true`.
5. Re-run all institutional, learning, security and visual QA gates.
6. Redeploy GitHub Pages.

## Validation

The release is checked by:

```bash
python tools/validate_initial_setup.py
python tools/validate_institution_platform.py
deno check supabase/functions/setup-api/index.ts
node --check js/institution-setup.js
```

The visual QA suite also captures the wizard on desktop and mobile using the
non-destructive `?preview=1` mode.
