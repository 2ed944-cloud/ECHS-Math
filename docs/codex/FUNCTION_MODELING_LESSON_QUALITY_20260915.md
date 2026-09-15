# Function transformations, selection and construction

AP Precalculus 1.12–1.14 gain three optional investigations with twelve original activities. Each topic follows a warmup, linked exploration, notes and error analysis, and transfer task. The complete investigation suite has fifteen lesson routes and 69 activities. All twelve earlier routes and 57 activities remain available, and every original lesson HTML file remains byte-for-byte unchanged by this release.

## Curriculum and teaching

The activities use `ap-precalculus-2026-27`. References are the [College Board AP Precalculus Course and Exam Description](https://apcentral.collegeboard.org/media/pdf/ap-precalculus-course-and-exam-description.pdf), printed pages 45–48, and [clarifications effective Fall 2026](https://apcentral.collegeboard.org/media/pdf/ap-precalculus-ced-clarification-and-guidance-effective-fall-2026.pdf), rechecked 15 September 2026. The transformation activity uses preimage/image terminology and distinguishes invertible dilation from a zero-output collapse. These are original public teaching examples; they contain no AP Classroom item or scoring-key export.

| Topic | New activity | Evidence students can use |
| --- | --- | --- |
| 1.12 | Transform a restricted function | Parent and image graphs, selected points, a paired table, and algebraically determined domain/range intervals, with decimal endpoints rounded where needed. |
| 1.13 | Compare two declared candidate models | Observations, predicted values, signed residuals, a residual graph around zero, and error statistics. |
| 1.14 | Construct a model from geometry | A cut-sheet net, an isometric box diagram, dimensions and units, a volume graph, and a table of physically valid cuts. |

The transformation family is `f(u)=u²+u` on `[-2,3]`, with `g(x)=a f(b(x-h))+k`. The input map is `x=h+u/b`; negative `b` reverses the endpoint order. A positive magnitude and a separate reversal control keep `b` nonzero. The output scale can be zero, in which case the graph is constant on the mapped domain and the range is the singleton `{k}`. This case is identified as a collapse, not an invertible dilation. Domain and range follow the algebra; sampled graph points do not establish them.

The selection task uses five explicitly synthetic readings and the fixed candidates `L(x)=4x−1` and `Q(x)=x²+1`. Changing one observation updates the residual displays and comparisons. The candidate functions are never refitted, so this activity is not described as a regression engine. Residuals are observed minus predicted; SSE and RMSE describe these observations only. A smaller error statistic does not prove a global generating rule. The notes include a distinct polynomial agreeing at all five original inputs to illustrate this limit of finite data.

The construction task starts with an idealized 18 cm by 10 cm sheet and derives `V(t)=t(18−2t)(10−2t)`. A usable box requires `0<t<5`; the cubic expression itself has a larger algebraic domain. The control and table use 19 quarter-centimetre cuts from 0.25 to 4.75. Any reported maximum is explicitly the largest displayed sample, not a proven global optimum. The zero-volume boundary points represent limits and are drawn hollow. The net and isometric view connect the same length, width and height to volume. This release adds a dimension diagram, not an interactive 3D engine.

Transfer tasks ask students to justify transformed sets, modeling assumptions and restrictions, and an idealized inverse-variation application. Synthetic contexts are not presented as measurements of ECHS, Qatar or a real device. The existing lesson coverage of regression, piecewise rules and other construction families remains in the original decks. These three investigations do not claim to replace every objective or assessment question.

## Runtime and retained behavior

Small pure models supply bounded finite inputs and immutable results to declarative content and DOM/SVG views. Existing graph/table helpers and styles are reused unchanged. The established workspace dispatches the new views; the host manifest and Pages injector add exactly three allowed routes after the existing access guard.

The source-size budget for the nine new runtime modules is less than 64 KiB of uncompressed UTF-8; the reviewed files total 52,877 bytes. They add no external runtime library. Each model's sampled curve has at most 101 points: selection uses two curves of 81 points and five observations, while construction keeps its two excluded boundary points separate from 99 interior samples. The shared plot helper rejects inputs above 1,000 points. These are source-size and computation bounds, not measurements of page-load latency.

The source-preservation roster includes fifteen canonical lesson files and the same 69 protected AP Calculus Unit 2–5 files. Earlier AP graph repairs and IB lesson changes are retained at their accepted source hashes. The original question payloads, assessment IDs, save keys and URL paths are untouched.

Controls have labels, keyboard operation, reset and table alternatives. Graphs preserve a readable internal scale on narrow screens and remain keyboard scrollable. Static scenes dispose the previous model before rendering. The activities do not write learner progress, send assessment responses, or grant mastery from viewing or worked comparisons. Original lesson focus and slide position return when the dialog closes.

## Validation and release boundaries

Pure-model and content tests independently check mapped points and sets, residual signs and ranking, box dimensions and volumes, average changes, units, invalid inputs and zero-output cases. View tests check the actual scene controls, SVG features, tables, formatting and disposal. Native tests cover browser drawing, keyboard interaction and narrow-screen layout. The complete route harness stages the canonical inputs with the real guard and investigation injectors, then supplies explicitly synthetic authority for repeatable testing. Real authenticated production checks are recorded separately in the release acceptance report.

Baseline comparisons use exact source files from pinned Git commits in separate temporary directories. Different historical versions of the same path stay separate. Original baseline files are excluded from uploaded test artifacts. Existing validation commands, question gates and native suites remain in the workflow alongside the new tests.

The acceptance report records final hashes, test results, reviewed commit, GitHub CI, and public asset verification. Preparing this document or passing a local fixture does not itself establish deployment success.

## Security, migrations and rollback

There are no database migrations, backend deployments, credential changes, publication-gate changes or new mastery writes. GitHub Pages contains original public teaching material and code; it gains no private deck extracts, AP Classroom prompts, teacher answer banks, learner data or secrets. Authentication and owner-revocation contracts remain unchanged.

Rollback is a revert of this release and a deployment through the existing Pages workflow. This restores the prior twelve-route integration and cache version without changing lesson URLs or requiring a database rollback. The three original lesson files need no content rollback because this release does not edit them.

## Remaining work

The AP Classroom resource and progress-check inventory remains partial and requires an active signed-in session. These additions do not certify every AP/IB lesson, every source question, or backend production health. Further course-wide improvements and additional 3D interactions require their own curriculum, mathematical and browser acceptance evidence.
