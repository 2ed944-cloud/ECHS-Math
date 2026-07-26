# Phase 4 — Complete Premium Experience

This completion layer turns the four institutional role portals into a unified product experience rather than a collection of dashboards.

## Scope

The layer is intentionally frontend-only and provider-neutral. It works with the existing secure Supabase account architecture and also works in the honest unconfigured preview mode. It does not activate the backend, alter account permissions, expose passwords or bypass server-side role checks.

## Shared experience layer

Every premium role portal now receives:

- a keyboard-accessible command palette (`Ctrl/Cmd + K`)
- role-aware quick actions and navigation
- a live notification centre derived from current dashboard evidence
- a role-specific onboarding and operating checklist
- persistent light/dark appearance
- offline status feedback
- accessible focus states and a skip link
- a responsive mobile action dock
- clean print layouts
- CSV export for visible teacher/admin tables without password fields

## Student Learning Journey

The student experience includes:

- today’s mission and daily-goal progress
- adaptive practice, review, test and lesson launch points
- mastery, streak, review and question counters
- knowledge map and evidence meters
- teacher assignments and recent learning sessions
- strengths, priorities and achievements
- editable daily-question and weekly-minute goals
- student-specific notifications and onboarding guidance

Goal values remain local learner preferences. They do not change school account credentials or institutional permissions.

## Teaching Command Center

The teacher experience includes:

- class readiness and engagement pulse
- intervention and extension alerts
- searchable student roster
- mastery, accuracy, attempts, mistakes and activity evidence
- support priorities, distribution and skill heatmap
- targeted assignment creation
- authorised student password reset
- restricted School Accounts entry
- class-table CSV export and print summary
- teacher-specific notifications and setup checklist

The completion layer never expands the teacher’s backend permissions. Server-side role checks remain authoritative.

## Family Progress Center

The family experience includes:

- linked-student selection
- family-friendly progress narrative
- mastery, accuracy, engagement and review indicators
- strengths and priority areas
- current assignments
- practical seven-day support plan
- printable report
- family-specific notifications and support checklist

No unrelated students or private response content are exposed.

## School Control Center

The administrator experience includes:

- school account health and role distribution
- recent account activity and security posture
- account creation and CSV import
- one-time initial credential output
- account search, role and status filtering
- password reset and session revocation
- account suspension/reactivation
- safe visible-directory CSV export
- administrator notifications and activation checklist

Existing passwords are never displayed or exported.

## Preview safety

When `config/institution.json` remains disabled:

- premium role pages render representative preview data
- all destructive or credential-changing actions remain disabled or unavailable
- the preview banner clearly states that institutional accounts are not active
- no fake login success is presented

## Release gates

The premium validator checks:

- required role pages and markers
- Content Security Policy presence
- preview-mode safety
- server permission markers
- JavaScript syntax
- command palette, notifications, onboarding, goals and mobile dock
- offline-cache inclusion
- cache bypass for private APIs
- disabled frontend configuration until approved activation

The normal Phase 1, Phase 2, institutional, question-bank and visual QA workflows continue to apply.
