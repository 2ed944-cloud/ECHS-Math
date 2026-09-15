# Native AP 1.10–1.14 renderer checks

```sh
ECHS_PLAYWRIGHT_MODULE=/path/to/playwright node tools/ap-legacy-quality/test-ap110-114-native.mjs --repo . --report-dir /fresh/report-directory
```

`--repo` must contain the five current lesson HTML files identified by the adjacent
`ap110-114-native-source-pins.json`. The suite reads no historical original lesson
copies. `--report-dir` must be a new directory. `ECHS_PLAYWRIGHT_MODULE` can name
an installed Playwright package or absolute package directory; it defaults to
`playwright`. Optional `ECHS_CHROMIUM_PATH` selects an installed Chromium browser.
Otherwise Playwright uses its installed browser. CI should pin its dependency
installation separately; the report records the actual package and browser versions.

The suite serves only these exact lesson bytes from an owned loopback HTTP server,
blocks off-origin browser requests and verifies each received document body. It
uses real keyboard controls, reveal/reset behavior and native canvas pixels at
desktop and mobile widths. AP 1.10 checks both off-frame hole heights, −11 and 13,
and collision at c=2. AP 1.11 checks that zero remainder preserves the open point
(2,3) and removes the vertical asymptote. AP 1.12–1.14 retain zero-scale, expanded
point-map viewport, readable mobile title, saturation model and excluded-point
checks. An observer records only target arc and vertical-stroke coordinates and
forwards every call unchanged to the native canvas implementation. Hollow-marker
checks also require the actual white center and burgundy ring pixels. Vertical
asymptotes require the renderer's width-2, `[7,6]` dashed native stroke and a gold
pixel at its first dash midpoint. A deliberately drawn false asymptote must fail
the zero-remainder absence check; the test clears that drawing through the real
controls before taking the final screenshot.

Reports require 59 checks, unchanged source hashes, no page/console errors, and
independent context, browser, listener and socket cleanup. Screenshot files show
the tested viewport and canvas states. This is isolated native lesson rendering,
not authenticated application, backend, mastery or deployment acceptance.

Keep the separate component inverse-preservation checks in CI:

```sh
node tools/lesson-investigations/test-legacy-rational-renderers.mjs --repo . --baseline-root /path/to/pinned-originals
node tools/lesson-investigations/test-legacy-transform-renderers.mjs --repo . --baseline-root /path/to/pinned-originals
```

Those suites require their exact historical baseline files and prove that the
bounded renderer repairs preserve every unrelated original byte. The independent
AP 1.7 native suite remains `tools/ap-legacy-quality/test-ap17-native.mjs`.
