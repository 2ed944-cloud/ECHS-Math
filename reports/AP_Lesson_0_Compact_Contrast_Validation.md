# AP Lesson 0 Compact Route and Contrast Validation

Date: 2026-08-29  
Courses: AP Precalculus and AP Calculus AB/BC

## Requested corrections

- Corrected light-theme text and line colours that inherited white text from the former dark design.
- Added explicit high-contrast styling for skill-weight labels and bars, calculator/technology checklist lines, form labels, unit rows, diagnostic choices, progress bars, and results.
- Removed the CSS background copy of the school logo so exactly one logo is visible.
- Restored the repaired `assets/echs-school-network-lockup.webp` as the primary image, with `assets/echs_logo.png` used only if the primary image fails.
- Shortened the content before the diagnostic while retaining the teacher introduction, interactive student activity, units, assessment distribution, study method, classroom rules, and diagnostic instructions.

## New AP Precalculus order

1. Welcome and teacher introduction
2. Student Math Passport
3. Choose Your Lens interaction
4. Connection Quest
5. Four-unit course map and unit weightings
6. AP Exam structure and score contribution
7. Skills rewarded by the exam
8. How to study and follow each lesson
9. Eight classroom agreements
10. Diagnostic introduction and six-strand map
11. Diagnostic questions begin

Total rendered slides: **34**, reduced from 56.  
The first diagnostic-question screen now appears at slide **11**.

## New AP Calculus order

1. Welcome and teacher introduction
2. AB/BC track choice
3. Instantaneous-change opening question
4. Student Calculus Passport
5. Connection Quest
6. AB/BC units and unit weightings
7. AP Exam structure and score contribution
8. Mathematical practices rewarded by the exam
9. How to study and follow each lesson
10. Eight classroom agreements
11. Diagnostic introduction and six-strand map
12. Diagnostic Strand A begins

Total rendered slides: **28**, reduced from 56.  
The first diagnostic strand now appears at slide **12**.

## Contrast audit coverage

The final override explicitly styles:

- `.skill-bars span`, `.skill-bars b`, and `.skill-bars i`
- `.tech-check label` and checkbox text
- form, identity, confidence, workspace, and exit labels
- unit rows and weight bars
- diagnostic prompts, choices, and result bars
- MathJax/KaTeX inherited text through the existing light-theme layer

The skill bars use a stronger maroon → slate → teal gradient, and all labels use dark blue or ECHS maroon on white.

## Logo validation

Both lesson pages contain one `<img class="school-network-logo">` using:

`../../../assets/echs-school-network-lockup.webp?v=20260829-logo6`

The final CSS sets `background-image:none` on `.school-network-lockup`, preventing the overlapping second image. The image falls back to `echs_logo.png` only after a real load failure.

## Scope protection

No diagnostic-question file, answer key, result calculation, AP fact, completion engine, or course catalog file is changed. The branch changes only:

- one shared contrast/compact-layout stylesheet;
- two shared compact-route scripts;
- the two Lesson 0 HTML loaders;
- this validation record.
