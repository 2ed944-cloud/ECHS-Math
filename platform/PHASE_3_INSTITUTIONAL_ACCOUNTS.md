# Phase 3 — Institutional Accounts and Premium Role Portals

## Purpose

Phase 3 adds a real school-managed account layer to ECHS Mathematics.

There is no Google sign-in and no public self-registration. An administrator creates
teachers, students and parents directly or imports them from CSV.

## Security model

- Username/password authentication is handled by Supabase Edge Functions.
- Passwords are hashed in PostgreSQL with bcrypt (`pgcrypto`); plaintext passwords
  are never stored.
- Initial passwords are returned once at account creation or import.
- Existing passwords cannot be viewed later. Administrators and authorised teachers
  reset a password and receive the replacement once.
- Students have no password-change or password-recovery endpoint.
- Five failed attempts lock an account for ten minutes.
- Session tokens are random; only SHA-256 token hashes are stored.
- Suspending an account revokes active sessions.
- Sensitive tables are protected from `anon` and `authenticated`; only server-side
  service-role functions access them.
- Administrative actions are written to an audit log.

## Roles

### Administrator

- Creates and imports all account roles.
- Views the complete account directory.
- Resets passwords, suspends and reactivates accounts.
- Creates classes and controls teacher permissions.
- Can access student, teacher and family views.

### Teacher

- Views the school account directory when enabled by organisation settings.
- Manages rosters for assigned classes.
- Creates adaptive practice, review, test and lesson assignments.
- Views class mastery, accuracy, engagement and support priorities.
- Resets student passwords when permitted.
- May import student/parent accounts when `can_manage_accounts` is enabled.

### Student

- Signs in with the username and password supplied by school.
- Cannot self-register or change/recover the password.
- Receives ALEKS-style progress meters for mastery, topics, daily goal and weekly time.
- Sees assignments, adaptive recommendations, strengths, priorities and recent sessions.
- Local Phase 2 learning data syncs to the cloud account.

### Parent / Guardian

- Sees only linked students.
- Views mastery, accuracy, engagement, assignments, strengths and priorities.
- Receives a seven-day family support plan.
- Cannot view private responses or other students.

## CSV import

The template is `templates/echs-account-import-template.csv`.

Supported columns:

- `display_name` or `full_name` — required
- `email`
- `username` — generated when omitted
- `password` — strong random password generated when omitted
- `role` — defaults to `student`
- `grade`
- `external_id`
- `class_name`
- `student_username` — optional parent link target

The import result provides a downloadable credential file once.

## Backend deployment

1. Create a Supabase project.
2. Add GitHub repository secrets:
   - `SUPABASE_ACCESS_TOKEN`
   - `SUPABASE_PROJECT_REF`
   - `SUPABASE_DB_PASSWORD`
   - `ECHS_BOOTSTRAP_SECRET`
3. Run the **Deploy Institutional Backend** workflow.
4. Run:

   ```bash
   python tools/bootstrap_institution.py \
     --project-ref YOUR_PROJECT_REF \
     --repo .
   ```

5. Commit only `config/institution.json`. Never commit service-role keys,
   database passwords or bootstrap secrets.

## Current publication state

Until `config/institution.json` is enabled with a deployed API URL, the public lesson
portal and Phase 2 local-first tools continue to work. The login page displays a
configuration notice rather than pretending that cloud accounts are active.
