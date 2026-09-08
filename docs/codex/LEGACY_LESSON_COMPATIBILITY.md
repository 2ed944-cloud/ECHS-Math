# ECHS006 — legacy lesson compatibility

This slice adds read-only adapters for the exact reviewed handcrafted AP Calculus 1.1 lesson and final composed IB AI SL 1.3 lesson metadata. Existing lessons, interactive questions, labs, answer-release behavior and finish/practice engines remain intact. No question or interactive activity is converted into a new engine by this slice.

## Contract and preservation

`js/lesson-runtime/legacy-compatibility.mjs` exports the AP descriptor adapter, inert IB snapshot adapter, route-preservation helper and conservative text converter. It reuses ECHS004 validation. The caller must supply UUID lesson/course-version identities and explicit curriculum metadata; adapters do not infer persistent identities or curriculum objectives from titles.

The feature flag is disabled by default, with only boolean `true` opting into a preview decision. The exact original URL is always retained as the rollback destination, including query order, repeated parameters, encoding and fragment. AP's historical alias, 33 stable slide IDs, source anchors and layout identities are retained. Unknown/out-of-range fragments stay opaque and use the original route. IB's learning, practice, exam, quiz and review route identities remain intact; assessment/review routes always stay in legacy mode.

The generic IB engine has no stable per-slide URL. Its legacy blocks link to `#learn` and preserve the original source index separately rather than inventing a deep link. Initial IB IDs include the immutable source version and index. Once assigned, those IDs must be retained through any later editing/reordering.

Finish behavior is declarative: AP's existing `#continuePractice` delegates to `[data-finish-lesson]` through the current guard. The adapter does not click, navigate, emit completion events, record attempts or write mastery. Legacy views, reveals, self-scoring and readiness are not imported as institutional mastery evidence.

## Content and security boundary

Production adapters consume bounded inert metadata JSON and verify it against an immutable reviewed source contract. They never evaluate lesson scripts or accept a complete question-bearing LESSON_DATA object. Returned documents begin as `draft`/`institutional`, revision 1. They are not approved public renderer inputs; publication/authoring belongs to a future authorized workflow. Renderer integration must retain explicit route/document/course binding and the existing access decision.

Unsupported content remains a `legacy-embedded` reference containing only `{source, anchor, sha256, summary}`. Original slide HTML, assessment prompts, answers and rubric objects remain in their current source engine. The adapter exports only source metadata, slide identities and numeric assessment counts. A reference does not authorize a destination or replace its guard; the renderer must restrict references to its currently authorized lesson route.

The optional supported-text converter uses an injected trusted inert parse5-compatible parser. It recognizes plain paragraphs, basic strong/emphasis, explicitly labeled math and simple callouts. Math requires a trusted local KaTeX engine and spoken text. Scripts, SVG/MathML, forms, controls, event attributes, arbitrary links, complex layouts, unknown attributes, ambiguous content or malformed math preserve the entire affected section as one source reference. No partial stripping, guessed math descriptions, hidden-answer extraction or publication-rights inference occurs. Only reviewed non-assessment explanation fragments are candidates for conversion.

## Verified acceptance

The fixture builder checks every pinned source hash before any development-only composition. Its fixed seven IB layers must occur in the original HTML-declared order. This VM usage is limited to exact reviewed repository bytes and is not a sandbox for untrusted code. The production adapter contains no script execution path. Tools and fixture builders remain excluded from Pages.

The pinned source is production commit `fda45056e7b11e3f1d45bf96f7c8c36246d69e8d`. Verified metadata counts are AP 33 slides / 20 questions / 3 FRQs and IB slides/practice/exam/quiz progression 49/40/2/10 → 36/52/3/14 → 73/96/5/14. Metadata fixtures contain no question, answer or rubric payloads.

Fifteen local suites passed, covering canonical schema output, caller identity, draft status, precise URL rollback, aliases/fragments, preserved layouts/finish references, final IB composition/pacing, changed-source rejection, supported text, unsupported preservation, privacy and mutation-free behavior. Exact generated metadata/runtime contract output also passed. `lesson-compatibility.yml` installs pinned dependencies, checks schema generation, verifies source composition/output and runs the adapters. Integrated branch CI still must pass before release.

Detailed APIs and test commands are in `tools/lesson-compatibility/README.md`. The schema tools package supplies the pinned local math-test engine. No runtime parser or heavy math library is loaded globally by the adapter.

## Rollback and remaining work

There is no production URL cutover, mass import, authoring/persistence or question repository in this slice. Keep the disabled feature flag and the exact original URL to roll back; no publication, database, saved progress or mastery state has been migrated. Any later public preview requires explicit reviewed publication and renderer access binding. Compatibility metadata preservation does not by itself certify the original runtime's security or grant new publication rights.
