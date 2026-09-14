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
node tools/lesson-investigations/test-browser.mjs
```

For the existing complete regression group:

```text
python tools/validate_baseline.py --json-report .baseline-results/baseline.json
```

The browser test uses actual canonical HTML and both production build transforms in an owned temporary directory. It provides synthetic portal/owner authority and blocks external requests. It neither authenticates a production account nor uses a production database. Its JSON report and screenshots are evidence artifacts, not public lesson assets. The temporary staged HTML is removed after the browser run.

`source-preservation.json` pins four lesson inputs and the existing 69-file AP Calculus Units 2–5 protection roster to the reviewed production baseline. The injector validates all inputs before changing only the four staged HTML files; it does not rewrite source lessons. Changes to these pins require a corresponding source review.
