# ECHS Mathematics — Phase 2 Learning System

## Release objective

Phase 2 turns the Phase 1 platform foundation into a local-first learning system. It does not replace the canonical question bank or the separately gated Official AP archive.

## Student system

- Personal profile and daily question goal.
- Today plan based on due review, weak topics, interrupted sessions and daily goal.
- Mastery by course, unit and topic.
- Mastery levels: Starting, Developing, Proficient and Mastered.
- Automatic Mistake Bank for incorrect auto-gradable questions.
- Spaced-review schedule with increasing intervals after successful recovery.
- Adaptive question selection using mastery, due status, unresolved mistakes, difficulty and recent performance.
- Continue Learning for lessons, Practice Studio and timed tests.
- Streaks and twelve initial achievements.
- Exportable student learning report.
- Legacy migration from the Phase 1 Practice Studio attempt store.

## Practice and assessment

Practice Studio supports:

1. Manual random practice.
2. Adaptive practice.
3. Due spaced review.
4. Mistake recovery.

Timed tests now:

- persist an interrupted test locally;
- update mastery and review data after submission;
- add incorrect responses to the Mistake Bank;
- attach assignment IDs when opened from a teacher link;
- support learning-report export after submission.

## Teacher workspace

The local-first Teacher Dashboard provides:

- multiple classes;
- editable student rosters;
- adaptive-practice, review and timed-test assignment links;
- assignment due dates and difficulty settings;
- import of student learning-report JSON files;
- class summary metrics;
- common support priorities;
- full workspace export and restore.

This release does not claim live multi-device classroom synchronization. The sync adapter contract is present so Firebase, Supabase or another approved backend can be added without replacing the learning engine.

## Parent report

- Reads the current device or an exported ECHS learning report.
- Shows attempts, accuracy, mastery, unresolved mistakes and review workload.
- Identifies strengths and priority topics.
- Generates a practical seven-day support plan.
- Provides a print-ready family report.

## Privacy and source boundaries

- Student learning data remains in local browser storage.
- Export and import are explicit user actions.
- Teacher and parent pages are excluded from search indexing.
- Practice Studio remains separate from Official AP.
- No Official AP canonical content, IDs, audit status, provenance or publication gates are modified.

## PWA behaviour

The service-worker shell now caches the Student Dashboard, Mistake Bank, Teacher Dashboard, Parent Report and learning-system scripts. Question payloads still use network-first behaviour and become available offline only after they have previously been requested and cached.

## Data stores

Phase 2 uses versioned local-storage keys:

- `echs_learning_profile_v2`
- `echs_learning_events_v2`
- `echs_learning_mastery_v2`
- `echs_learning_reviews_v2`
- `echs_learning_sessions_v2`
- `echs_learning_continue_v2`
- `echs_learning_achievements_v2`
- `echs_learning_streak_v2`
- `echs_learning_classes_v2`
- `echs_learning_assignments_v2`
- `echs_learning_submissions_v2`
- `echs_learning_settings_v2`

## Merge gates

- Phase 1 bank-inventory validation passes.
- Phase 2 learning-system validator passes.
- Learning-engine smoke test passes.
- JavaScript syntax checks pass.
- Desktop and mobile visual QA passes for all Phase 2 pages.
- No canonical Official AP data is changed.
- Pull request remains unmerged until explicit user approval.