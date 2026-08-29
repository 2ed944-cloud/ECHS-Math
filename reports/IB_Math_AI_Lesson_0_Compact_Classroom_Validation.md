# IB Math AI Lesson 0 — Compact Classroom Redesign Validation

Date: 2026-08-29  
Scope: `lessons/ib-math-ai/course-launch/`

## Student-facing result

The 56-screen Lesson 0 route has been rebuilt as a 25-screen classroom presentation. The first diagnostic-question screen is now screen 11.

### New pre-diagnostic sequence

1. Welcome and teacher introduction
2. Interactive IB Math AI opening data decision
3. Math AI Passport, SL/HL selection, and representation preference
4. Clear 3×3 Connection Quest
5. Five course topics with SL/HL teaching-hour guidance
6. SL/HL assessment structure and mark distribution
7. What IB Math AI rewards: modelling, technology, validation, interpretation, and exploration
8. How to study and follow each lesson
9. Eight classroom agreements
10. Diagnostic purpose, strands, and instructions
11. Diagnostic Strand A begins

## Presentation requirements completed

- Light, high-contrast classroom design aligned with the AP Calculus and AP Precalculus Lesson 0 presentation style.
- Single ECHS/Qatar Academy school-network logo with PNG fallback only after a genuine image-load failure.
- `Mohammad Abu Ghuwaleh — Math Teacher` shown in the persistent header and welcome slide.
- Full-screen button, `F` keyboard shortcut, `Esc` exit, WebKit support, and presentation-mode fallback.
- Internal scrollbar retained while the header and footer remain visible.
- Duplicate `Learning pathway / Finish lesson / Dashboard` access banner suppressed and removed.
- No development, release, cinematic-edition, or long/short-route wording appears to students.

## Course information retained and consolidated

- Five official course topics.
- SL teaching-hour guidance: 16, 31, 18, 36, and 19 hours, plus approximately 30 exploration hours.
- HL teaching-hour guidance: 29, 42, 46, 52, and 41 hours, plus approximately 30 exploration hours.
- SL assessment: Paper 1 40%, Paper 2 40%, Exploration 20%.
- HL assessment: Paper 1 30%, Paper 2 30%, Paper 3 20%, Exploration 20%.
- Technology, modelling, interpretation, validation, communication, and academic-integrity expectations.

## Diagnostic protection

No diagnostic source file, question, choice, answer key, explanation, scoring rule, result calculation, SL/HL extension rule, export function, or completion function was modified. The original engine is unchanged.

The full diagnostic and results route remains:

- Diagnostic Strands A–F
- Optional HL Strand G
- Submission
- Overall readiness
- Strand profile
- HL profile
- Repair priorities
- Missed-item review
- Confidence and first-week plan
- Completion/export

## Validation completed

- `lesson-0-compact-route.js` passes `node --check`.
- `lesson-0-student-controls.js` passes `node --check`.
- CSS opening and closing brace counts match.
- HTML parses with one `html`, one `head`, and one `body` element.
- HTML IDs are unique.
- Data loading order is preserved: course data → diagnostic → opening question → compact route → original engine → student controls.
- Mock runtime confirms 25 slides in the intended order.
- Mock runtime confirms `diagnostic-A` is slide 11.
- Required engine-facing IDs remain present: `identityTrack`, `trackCurrent`, diagnostic hosts, result hosts, submission controls, and completion controls.
