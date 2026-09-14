# Lesson investigation checks

Run from the repository root with Python 3.12 and Node 22. The CI workflow `.github/workflows/lesson-investigations.yml` installs `linkedom@0.18.12` and the existing locked Playwright dependency in `question-bank/official/tools`.

Set `ECHS_TEST_DOM_MODULE` to the absolute installed `linkedom` directory. Set `ECHS_PLAYWRIGHT_MODULE` to the absolute installed `playwright` directory. Optionally set `ECHS_CHROMIUM_PATH` to an existing Chrome/Chromium executable; otherwise install Playwright's Chromium headless shell. `ECHS_PYTHON` optionally selects the Python executable. `ECHS_INVESTIGATION_REPORT_DIR` selects the browser evidence directory.

```text
python tools/test_lesson_investigation_injection.py
node tools/lesson-investigations/test-ap-rates-model.mjs
node tools/lesson-investigations/test-ib-models.mjs
node tools/lesson-investigations/test-vase-model.mjs
node tools/lesson-investigations/test-vase-view.mjs
node tools/lesson-investigations/test-car-view.mjs
node tools/lesson-investigations/test-finance-view.mjs
node tools/lesson-investigations/test-host.mjs
node tools/lesson-investigations/test-workspace.mjs
node tools/lesson-investigations/test-legacy-route.mjs
node tools/lesson-investigations/test-ap-polynomial-model.mjs
node tools/lesson-investigations/test-polynomial-view.mjs
node tools/lesson-investigations/test-ap-polynomial-content.mjs --baseline-root <pinned-originals>
node tools/lesson-investigations/test-legacy-polynomial-renderers.mjs --repo . --baseline-root <pinned-originals>
node tools/lesson-investigations/test-browser.mjs
```

For the existing complete regression group:

```text
python tools/validate_baseline.py --json-report .baseline-results/baseline.json
```

The browser test uses actual canonical HTML and both production build transforms in an owned temporary directory. It provides synthetic portal/owner authority and blocks external requests. It neither authenticates a production account nor uses a production database. Its JSON report and screenshots are evidence artifacts, not public lesson assets. The temporary staged HTML is removed after the browser run.

`source-preservation.json` pins seven reviewed lesson inputs and the existing 69-file AP Calculus Units 2–5 protection roster. The injector validates all inputs before changing only the seven staged HTML files; it does not rewrite source lessons. The first four lesson pins and all 69 Calculus pins are unchanged. AP 1.4/1.5 pins include the separately reviewed renderer repairs; AP 1.6 source is retained. Changes to these pins require a corresponding source review.

The polynomial content and legacy renderer checks require exact original AP 1.4/1.5/1.6 HTML at `dcc65f84dafd2dc5cb4518ea03d18b4087ddf4ff`, as listed in `polynomial-baseline-pins.json`. The workflow fetches that revision and materializes only those three files and the five IB comparison files under the runner temporary directory, checking every byte length and SHA-256 before use. Historical lesson content is not bundled inside the test package. `polynomial-source-preservation.json` verifies that reversing the three named renderer changes restores both original HTML files byte for byte.
