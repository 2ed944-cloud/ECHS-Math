# Phase 4 — ECHS Premium Learning Experience

## Purpose

Phase 4 turns the institutional account foundation into a coherent premium learning product. It does not rebuild lessons, question banks or the Phase 2 learning engine. It presents those systems through an original, student-centred experience that is clear, motivating and operationally useful.

## Experience principles

1. **Learning before administration.** The first screen for a student is a meaningful next step, not a report table.
2. **Evidence becomes action.** Teacher and family pages translate data into a small number of useful decisions.
3. **Visible progress.** Daily missions, mastery maps, weekly rhythms, review queues and achievements make growth tangible.
4. **One connected platform.** Lessons, adaptive practice, tests, review, assignments and accounts remain parts of one journey.
5. **Calm premium design.** Strong hierarchy, generous spacing, restrained motion and original ECHS visual language replace generic dashboard styling.
6. **Honest activation.** Before Supabase is activated, the role portals show clearly labelled illustrative preview data rather than pretending live accounts exist.

## Student — My Learning Journey

- Time-aware welcome and today’s mission.
- Animated mission completion ring.
- Mastery, daily-question, streak and review counters.
- Quick launch to adaptive practice, review, tests and lessons.
- Evidence-based next-skill recommendation.
- Seven-day learning rhythm.
- Assignment priority cards.
- Unit-level knowledge map.
- Strengths, priorities, achievements and recent sessions.
- Existing Phase 2 learning data continues to synchronize through the institutional adapter.

## Teacher — Teaching Command Center

- Live class readiness ring.
- Student, activity, mastery and support counters.
- Today’s highest-value intervention list.
- Seven-day class engagement pulse.
- Student roster with mastery bars and activity indicators.
- Whole-class support priorities.
- Mastery distribution and skill heatmap.
- Assignment builder, roster management, CSV import and authorised password reset.
- School Accounts remains available according to institutional permissions.

## Family — Family Progress Center

- Family-readable progress narrative.
- Mastery, accuracy, consistency and review indicators.
- Weekly engagement rhythm.
- Strength and priority cards.
- Assignment status without unrelated private responses.
- Seven-day support plan with short, realistic family actions.
- Linked-student boundary remains enforced by the backend.

## Administrator — School Control Center

- School account health ring.
- Account, active-user, student and teacher counters.
- Role distribution and recent account activity.
- Institutional security posture checklist.
- Searchable account directory.
- One-time initial credential workflow.
- Password reset, session revocation, suspension and audit rules remain server-side.
- Teachers receive a restricted School Accounts view; elevated roles and status changes remain administrator-only.

## Preview mode

When `config/institution.json` remains disabled:

- Sign-in is disabled.
- Each role portal displays a visible Premium Experience Preview banner.
- Illustrative data demonstrates the complete interface.
- Network writes, password reset, account creation, CSV import, roster editing and assignment publishing remain disabled.
- No preview data is claimed to be real school data.

## Safety boundaries

- No Official AP canonical records are modified.
- No existing question IDs are regenerated.
- No provenance, rights, source, lesson, topic or unit metadata is changed.
- Supabase secrets remain outside the repository.
- Institutional APIs remain excluded from offline caching.
- Public self-registration and Google sign-in remain disabled.
- Existing passwords are never displayed.

## Activation sequence

1. Complete review of PR #13.
2. Deploy the institutional backend through the protected manual workflow.
3. Bootstrap the first administrator.
4. Enable `config/institution.json` in a separate reviewed commit.
5. Perform live account, permission, CSV, sync and cross-device acceptance testing.
6. Merge only after explicit approval.
