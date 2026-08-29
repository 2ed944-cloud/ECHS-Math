# AP Lesson 0 Student Presentation v4 — Validation

Date: 2026-08-29

Scope:
- AP Precalculus Lesson 0
- AP Calculus AB/BC Lesson 0

## Student-facing changes

- The supplied ECHS/Qatar Academy school-network logo remains in the persistent header and now has explicit visibility sizing plus an ECHS-logo fallback.
- A real Full screen control is available in the header. The `F` key toggles full screen and `Esc` exits. Browsers without the native Fullscreen API receive a presentation-mode fallback.
- Visible release/design terms such as `Cinematic Edition`, `Premiere`, `Scene 01`, `Freeze Frame`, and `First frame` are removed or replaced with classroom language.
- The AP Precalculus teacher-facing short/long pacing slide is replaced with one student-facing first-class journey.
- The AP Calculus `Two pacing options` notice is replaced with the same clear student-facing journey.
- Browser titles and descriptions no longer use the words `cinematic edition` or `light cinematic`.
- The duplicate platform access banner remains suppressed.

## Preserved content

No diagnostic data, answer key, result calculation, course map, AP Exam fact, completion logic, or original lesson engine is changed.

## Validation performed

- New shared JavaScript passes `node --check`.
- Runtime mutation tests pass for both AP Precalculus and AP Calculus mock lesson data.
- The mock tests confirm that pacing-choice text and production labels do not remain in rendered lesson data.
- Both lesson HTML loaders preserve the order: data → diagnostic → visual layer → student presentation cleanup → original engine → post processing.
- Logo paths include an `onerror` fallback.
- Fullscreen controls have accessible labels, pressed state, keyboard support, native Fullscreen API support, WebKit support, and a CSS fallback.
- The branch is scoped to two shared presentation files, two Lesson 0 HTML loaders, and this validation record.
