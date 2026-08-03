# IB AI SL 1.1 v5.1.0 — Visual QA and correction record

## Screenshot findings addressed

The supplied platform screenshots exposed four classes of problems:

1. **KaTeX descendants were inheriting component styles.**
   Rules such as `.worked-head span`, `.validation-grid span`, `.unit-grid span` and `.magnitude-lane span` were also styling KaTeX's internal spans. This produced yellow formula fragments, vertically stacked digits, broken exponents and a large navy comparison block.
2. **The authenticated learning-pathway bar overlapped the lesson header.**
   The lesson viewport was positioned from the browser top rather than from the bottom of the injected pathway bar.
3. **Typography was oversized for the actual teaching viewport.**
   Several headings reached 66–94 px while the platform bar, lesson header and footer reduced the available height.
4. **The cover scale mixed unrelated units and contexts.**
   The sequence included a byte scale and an undefined “planetary” label in a graphic that visually implied one common measurement axis.

## Corrections

- Added a final KaTeX isolation layer and reloaded the canonical KaTeX stylesheet after all lesson component styles.
- Reset both `.math-inline` wrappers and KaTeX root/descendant spans inside worked-example headers, task headers, validation cards, unit cards, status rows and comparison graphics.
- Replaced the cover graphic with a dimensionally consistent length scale:
  `10^-9 m`, `10^-6 m`, `10^-3 m`, `10^0 m`, `10^3 m`.
- Replaced the unstable magnitude lane with an ordered comparison ladder.
- Rebuilt the validation routine and dimensional-conversion graphic using dedicated formula containers.
- Made the shell aware of `--echs-access-bar-height` when the authenticated pathway uses its fallback bar.
- Reduced and regularized title, paragraph, equation and card sizes.
- Reduced excessive card height and internal padding while preserving readable classroom projection.
- Moved the AI tutor launcher above the lesson footer so it does not cover `Next` or the progress bar.
- Improved route-page width, assessment spacing and high-zoom behavior.

## Content preserved

- 36 purposeful Learn screens.
- 52 Practice Studio questions.
- 14 Timed Quiz questions.
- 3 extended IB tasks.
- Existing lesson URL, mastery keys and authenticated practice bridge.

## Release metadata

- Lesson release: `5.1.0`
- Content structure unchanged.
- Visual models corrected: cover scale, comparison, validation, dimensional conversion.
