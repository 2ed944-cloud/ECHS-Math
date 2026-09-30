# PUE forum lesson readiness — 30 September 2026

The forum deck uses prediction, linked models, explanations and independent transfer. This release adds that routine to the existing AP Precalculus 1.1 and AP Calculus platform lessons 8.5, 8.6 and 8.7. It retains the existing lesson identities, geometry engines, questions, practice integration and access guard.

## Rehearsal route

Open AP Precalculus 1.1 with `?forum=1#toy-car-lab`. The **Workshop route** menu links to nine guided investigations: toy car, vase, square/semicircular cross sections, disks, y-axis washers, shifted axes, the idealized pearl, hypothetical water storage, and optional ball flight. The approved title and three learning outcomes are available in that menu. Core investigations match the latest forum presentation. The stated minutes apply to these activities, not the entire 60-minute session.

Ordinary lessons offer **Start guided investigation**; full lesson content remains accessible through **Full lesson**. Forum links start in the prediction phase. A participant writes a prediction or explicitly acknowledges oral discussion before showing the model. After exploration, a written or oral explanation precedes the transfer task. The model is hidden for transfer, and worked reasoning requires a written or oral attempt. Revising a transfer draft hides the comparison again.

Written drafts are in-memory reflections in the current tab. They are not assessments, evidence uploads, completion signals, mastery awards or claims of learning impact. Oral acknowledgements support paired workshop use and do not verify correctness. **Teaching prompts and next evidence** supplies misconception, support and challenge prompts. It makes no live AI request and does not alter tutor policy.

## Changes and mathematics

The toy-car controls now include radius 6 m and lap time 20 s, allowing the exact doubling experiments in the deck. Automatic play is disabled under reduced motion; the time slider and quarter-lap steps remain available. Existing geometric and height models are retained. Transfer responses use original numbers and contexts and are checked independently with quadrature, geometric distances and arithmetic in `tools/test_forum_investigations.mjs`.

Official mapping remains separate from platform numbering: platform 8.5 → College Board 8.7/8.8; 8.6 → 8.9/8.11; 8.7 → 8.10/8.12. Shells remain optional enrichment. The source documents are the College Board AP Calculus AB/BC CED and the AP Precalculus CED effective Fall 2026, linked in `investigations.mjs` and in the existing lessons. The new layer supplements the existing curriculum; it does not redefine objectives.

Pearl scaling is an idealized sphere calculation. Garden storage is a hypothetical geometry design with stated units and assumptions, rather than empirical water-use data.

## Acceptance and validation

- All nine entries resolve to real lesson stages and original formative prompts.
- Transfer volumes, rates, units, parameter changes and percentage changes have independent checks.
- Prediction and transfer conceal the model; original explanatory copy is concealed while the guided volume routine is active.
- Normal lesson content can be restored without changing native navigation or model configuration.
- Drafts survive native stage navigation in the same tab; revisions conceal the worked comparison.
- Desktop/mobile layout, keyboard access, reduced motion and renderer recovery are covered by browser QA.
- Production authorization remains with the existing build-injected portal and server access checks. A forum parameter grants no access. A signed-in teacher/reviewer must have the appropriate account. Student assignment gates remain authoritative.

The shared adapter, data and styles total approximately 36 KB uncompressed and have a 50 KB budget. They load only on the four lesson pages and introduce no graphing or 3D dependency. In compact volume Slide view, use the Workshop route menu to enter a guided activity; the ordinary reading view also provides Start guided investigation.

Run `node tools/test_forum_investigations.mjs` with `ECHS_TEST_DOM_MODULE` pointing to linkedom when it is not installed locally. Run `node tools/test_forum_browser.mjs` after installing the existing pinned Playwright dependency. The existing volume model, mesh geometry, volume lesson, volume browser, AP Precalculus 1.1 mathematics/context/UI and Pages/access tests remain relevant.

## Rollback and limitations

Revert the forum release commit to remove this optional adapter and restore the original car options/playback. No database migration or data rollback is required. The rendering engine and its exact-volume data are unchanged. Full-screen availability depends on the browser. This release does not verify venue network access, reviewer credentials, real AI responses, or student outcomes; rehearse those separately using the school account before the live session.
