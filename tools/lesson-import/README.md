# IB 1.3 reference import review

This tool builds an inert public teaching reference for the exact original IB AI geometric-sequences lesson. It does not import question banks, revealed answers, rubrics, teacher notes or learner state. It does not grant publication rights or publish a lesson.

## Source and composition

`source-manifest.json` pins the original HTML, all 16 scripts in its declared order and the existing 73-slide ECHS006 metadata file. The builder checks all hashes before opening Chrome. Every browser request is intercepted and served from local repository files at a synthetic HTTPS origin. Script resources outside the exact pinned closure fail. No account or production service is contacted. Original HTML and script bytes are not rewritten.

The builder records script-load stages from the real browser: 49/40/2/10 → 36/52/3/14 → 73/96/5/14 → **78/103/6/14** (slides/practice/exam/quiz). All 16 load events must match. It projects teaching-slide metadata only, checks the first 73 HTML hashes against ECHS006, preserves those 73 IDs and appends IDs ending s074–s078. The full original runtime, including GDC additions, determines the ledger. ECHS006 remains unchanged.

The generated runtime module is a frozen literal, not a runtime source evaluator. Its compact JSON budget is 256 KiB. The lightweight target module contains only exact catalog-binding constants and has no content import. Studio loads the larger data/model only after an explicit authorized review action.

## Native review and exceptions

The 20 reviewed source indexes are **3, 5, 6, 8, 9, 13, 26, 34, 35, 37, 39, 42, 43, 44, 45, 55, 58, 62, 63 and 72**. `native-ib13.mjs` contains fresh ECHS explanations of the mathematical facts, using rich text, accessible mathematical speech and semantic tables. Reading order, mathematical relationships and stated examples are checked. Native presentation is a semantic reflow, not a pixel-identical copy of the original CSS cards and diagrams.

The original source refers to external publishers. Those references do not establish reproduction permission. No protected assessment, hidden answer/reveal or worked-response payload is copied into the new public module. Original wording is not treated as licensed teaching material.

Review corrections are visible in each native ledger entry:

- Slides 9 and 26 state the nonzero/sign and integer-gap assumptions.
- Slides 34–39 state positive-domain, monotonicity and first-stage restrictions; strict threshold inequalities are checked independently.
- Slide 55 distinguishes disjoint-period totals from repeated stock readings; summing medication stock readings is not labeled integrated exposure.
- Slide 62 explicitly labels the data synthetic and states three-decimal rounding.
- Candidate 69 stays a reference: its use of “Evaluate” as a command term is not supported by the current official AI guide glossary. No replacement glossary is silently imported.
- Slide 73 remains an original extension reference. Infinite geometric series is AHL 1.11, not AI SL core.

The guide basis is the [official IB Mathematics: Applications and Interpretation guide, first assessment 2021](https://ibo.org/globalassets/new-structure/university-admission/pdfs/dp-mathematics-applications-and-interpretation-guide-en.pdf), with SL 1.3 geometric sequences/finite sums, SL 1.4 financial applications, SL 1.5 introductory logarithms, and SL 2.5–2.6 exponential models and model interpretation. The local route number 1.3 is not an official objective identifier. Teacher-entered objectives, skill IDs, title, language and accessible summary remain unchanged. No curriculum registry entry is created or changed.

## Draft contract and safety

`createIB13Import({baseDocument, selectedSlideIds, mathEngine})` requires a canonical institutional draft at revision 1 bound to the exact active first-assessment-2021 course version and original unit/topic. The caller verifies the complete catalog route with `isIB13ImportTarget`; the server remains authoritative for membership, class, course pin and route. Missing or mismatched target data returns false.

Omitted selection chooses all 20 native candidates. Explicit selections must contain at least one unique eligible ID. Every result has 78 slots in original order; an unselected candidate becomes a reference, and the returned summary lists selected IDs in source order. Inputs and the frozen reference are never mutated. The model performs strict local KaTeX and canonical validation before returning a draft.

References retain the fixed original path, HTML SHA256, original slide number and stable ID. They contain no original executable HTML or assessment. The original lesson map is needed to select a referenced slide; `#learn` alone does not jump to a source index. GDC workflows, TI-84 simulator, labs, original questions and guard/finish contracts continue at that original route. Unresolved `legacy-embedded` blocks remain ineligible for publication under the existing server gate. Removing or replacing those references requires a later explicit content review, not a flag that labels all 78 slots migrated.

Rollback is to stop using the optional import action and reopen the preserved original route. Existing lessons, question gates, progress, mastery, classroom pins and authorizations are not modified by this tool. An imported institutional draft is ordinary private draft data after the existing API creates it; this tool does not itself perform that write.

## Validation commands

Use the repository's existing pinned dependencies: `parse5` 7.3.0 from `tools/lesson-compatibility`, Playwright 1.61.1 from `question-bank/official/tools`, and checked-in KaTeX 0.16.27. No new package or lockfile is introduced. Configure `ECHS_CHROMIUM_PATH` if using an installed Chrome; otherwise use Playwright's installed Chromium.

```text
node tools/lesson-import/build-ib13-reference.mjs --source-root . --check
node tools/lesson-import/test-ib13-sources.mjs
node tools/lesson-import/test-ib13-import-model.mjs
node tools/lesson-import/test-ib13-mathematics.mjs
```

Omit `--check` only when deliberately regenerating the owned public reference after source and mathematical review. Source pins are not refreshed automatically. The source tests mutate only a disposable fixture copy and prove missing/changed/reordered files fail before browser execution. Model tests cover the complete and partial selection, identity, immutability, private fields, getters/cycles, malformed math and every individual candidate. Mathematical tests independently calculate ratios, sign cases, threshold stages, finite and shifted sums, compounding and rounded model comparisons. Separate UI/parity/real-SQL acceptance tests are owned by the ECHS014 integration workflow; their outcomes must be reported from actual executions.
