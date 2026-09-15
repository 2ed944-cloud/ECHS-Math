# Rational investigations and graph accuracy

This change adds original teaching activities to AP Precalculus 1.7–1.11 and repairs specific existing AP and IB graphs. The five new workspaces contain 21 activities: four for each of 1.7–1.10 and five for 1.11. Together with the existing seven workspaces, the platform has twelve optional investigations and 57 activities. The original lesson remains at its existing URL and slide position when an investigation closes.

## Teaching and curriculum

The activities use the active `ap-precalculus-2026-27` records. Their references are the [AP Precalculus Course and Exam Description](https://apcentral.collegeboard.org/media/pdf/ap-precalculus-course-and-exam-description.pdf) and [clarifications effective Fall 2026](https://apcentral.collegeboard.org/media/pdf/ap-precalculus-ced-clarification-and-guidance-effective-fall-2026.pdf), checked 14 September 2026. Each new topic includes a warmup, linked exploration, notes and error analysis, and a transfer problem. Topic 1.11 includes separate division and binomial explorations. Examples and worked comparisons are original teaching material; this release contains no AP Classroom question or scoring-key export.

| Topic | Main reasoning in the new activities |
| --- | --- |
| 1.7 | Compare numerator and denominator degrees, leading coefficients and both tails; distinguish horizontal and slant behavior; state a contextual domain. |
| 1.8 | Find valid zeros using factors and original exclusions; compare multiplicities and signs; solve a rational inequality. |
| 1.9 | Interpret one-sided unbounded behavior using remaining denominator multiplicity; distinguish a pole from a removable exclusion. |
| 1.10 | Calculate the finite height of a hole from the reduced rule; retain the original domain; examine an exact collision with another denominator zero. |
| 1.11 | Connect expanded and factored forms, quotient and remainder, asymptotic differences, and binomial coefficients without losing domain restrictions. |

The rational exploration has a declared factor family, rather than an arbitrary expression evaluator. A shared factor does not automatically produce a hole: an uncancelled denominator factor can still produce a pole. Zero scale produces zero at allowed inputs and preserves all original exclusions. A zero polynomial has no degree. Graph segments are separated at every excluded input, including exclusions that fall between sampled points. Hole coordinates are included in graph bounds and tables remain available alongside the visual. Small nonzero values are displayed without rounding them to an exact zero.

The division family is `P(x)=(ax+b)(x-c)+r`, with the original quotient domain `x!=c`. A zero remainder makes a hole, rather than restoring the missing input. The binomial view shows the full coefficient row and all terms, including zero terms, and uses the actual resulting degree. Polynomial and binomial coefficients preserve the exact quarter-grid values and their finite expansions. Rational table outputs are numerical evaluations and can approximate nonterminating values. Formal end behavior is derived algebraically, not inferred from a finite graph window.

## Existing lesson repairs

Six AP HTML files receive narrow corrections. AP 1.7 binds two existing rational-function figures to their stated formulas and the horizontal asymptote `y=-2`. AP 1.10 includes the actual finite hole height in its plotting range. AP 1.11 draws an open hole when the division remainder is zero. AP 1.12 describes zero multipliers as constant collapses and keeps the mapped point inside the graph; its short graph titles fit mobile displays. AP 1.13 correctly labels the existing saturation model. AP 1.14 identifies a zero quadratic scale and shows the excluded point of a zero-scale rational model without a false vertical asymptote.

Inverse comparisons reconstruct every original byte outside the declared methods, two figure bindings and one option label. Original prose, question payloads, assessment IDs and other lesson scripts remain intact. AP 1.8 and 1.9 HTML source files are unchanged. The build adds their optional launcher only to staged Pages output.

IB AI SL 1.6 receives two interaction corrections. A blank residual input is invalid instead of being interpreted as numeric zero. The cubic exploration plots its actual values with suitable bounds rather than clamping them into a false curve. Its existing lesson and assessment composition, scoped engine and first-assessment-2021 curriculum remain unchanged. No future first-assessment-2029 content is activated.

## Runtime and access

Six new modules provide two bounded pure models, two original content sets and two DOM/SVG views under `lessons/shared/investigations/`. The existing workspace mounts and disposes the views. The host manifest and Pages injector add exactly five allowed routes after the unchanged canonical access guard. The preservation roster contains twelve lesson inputs plus the same 69 protected AP Calculus Unit 2–5 files. The original seven lesson pins and 36 activities are unchanged.

The activities provide teaching interactions, predictions and worked comparisons. They do not submit official assessment responses or award mastery. The host retains the existing authentication, publication, owner-revocation, focus, Escape, return-link and disposal contracts. The service-worker release version refreshes the changed public lesson assets through the existing deployment.

## Validation boundaries

Model and content tests check independent arithmetic, factor exclusions, signs, limits, finite differences and division identities, including degenerate inputs. View tests exercise actual declared scenes, control ticks, tables, invalid-input rejection and disposal. The complete browser suite stages all twelve canonical routes with the real access and investigation injectors and an explicitly synthetic authority fixture. It verifies all 57 activities, desktop/mobile control behavior, preserved source hashes, deep links, return focus and absence of learner writes.

Separate native tests exercise the corrected legacy figures and IB controls with actual browser drawing. The AP 1.7 test delivers exact document bytes through a route fixture and forwards canvas observations to the native drawing methods; it does not claim browser HTTP transport or authentication. Original baseline lesson files are extracted from pinned Git commits into temporary comparison storage. Test artifact uploads contain synthetic reports and images, not copies of those original baseline files or private deck extracts.

The release acceptance report records the exact tested source hashes, command results, CI revision and live asset checks. A local fixture pass alone is not evidence of a successful production deployment.

## Security, migrations and rollback

There are no database migrations, backend deployments, account changes, question-publication changes or new mastery writes. No AP Calculus Unit 2–5 file is changed. The original IB 1.3 import closure stays untouched. No secrets, teacher answer banks, private decks or AP Classroom item contents enter the publication manifest.

Rollback is a revert of the release commit and deployment through the existing GitHub Pages workflow. This restores the prior route list, modules, source pins and cache version. Existing lesson URLs and response IDs remain compatible; no database rollback is required.

## Remaining work

This release does not certify every AP Classroom question or every AP/IB course lesson. The authenticated AP Classroom review confirmed Unit 1 topic categories and began progress-check review; access later encountered a browser DNS error, so the full progress/resource inventory remains incomplete. The new lessons are original activities aligned to the cited curriculum. Further course-wide improvements and any additional 3D models require their own mathematical purpose and acceptance evidence.
