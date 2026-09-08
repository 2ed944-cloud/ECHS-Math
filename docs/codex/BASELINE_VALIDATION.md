# Portable baseline validation

`python tools/validate_baseline.py` runs the existing critical local checks in the `core`, `lessons`, and `bank` suites. It requires no production account, token, database connection, or deployment permission. It is an additional baseline entry point; existing CI gates and tests remain in place.

## Setup

Use Python 3.12 and Node.js 22 or newer. The runner invokes Python children with `sys.executable` and locates `node` on `PATH`. Install the pinned validation dependencies explicitly; the runner never installs packages itself.

```text
npm install --prefix .test-deps --no-save --ignore-scripts --no-audit --no-fund linkedom@0.18.12
npm ci --prefix question-bank/official/tools
npx --prefix question-bank/official/tools playwright install chromium-headless-shell
```

On Linux CI, browser installation may additionally need Playwright's `--with-deps` option. The bank's committed package and lock files pin KaTeX and Playwright. The DOM suite requires exactly LinkeDOM 0.18.12. Set `ECHS_TEST_DOM_MODULE` to its **absolute package directory**, not its parent node_modules directory:

PowerShell:

```powershell
$env:ECHS_TEST_DOM_MODULE = (Resolve-Path .test-deps/node_modules/linkedom).Path
python tools/validate_baseline.py --json-report .baseline-results/baseline.json
```

Bash:

```bash
export ECHS_TEST_DOM_MODULE="$PWD/.test-deps/node_modules/linkedom"
python tools/validate_baseline.py --json-report .baseline-results/baseline.json
```

An existing pinned installation outside the repository may be reused through the same environment variable. Do not commit dependency directories or reports. `ECHS_CHROMIUM_PATH` can select an already installed compatible Chromium executable; see the existing bank browser validator for its other optional environment settings. The runner provides `ECHS_TEST_PYTHON` to that validator, so its local HTTP server uses the same Python interpreter on Windows and Linux.

## Commands and failure behavior

```text
python tools/validate_baseline.py
python tools/validate_baseline.py --suite core
python tools/validate_baseline.py --suite lessons --suite bank
python tools/validate_baseline.py --list
python tools/validate_baseline.py --timeout 180 --json-report .baseline-results/baseline.json
python tools/test_validate_baseline.py
```

Omitting `--suite` runs all three groups. Selecting a group is a partial run, not an all-baseline pass. Unknown groups and invalid options fail with exit 2. Missing tests, missing tools, dependency errors, test failures, and timeouts produce a nonzero result; nothing is silently skipped. Checks continue after a failure to provide a complete diagnostic result. Each check has a 120–300 second limit, shown by `--list`; `--timeout` overrides it. A timeout terminates the test's child process tree. Interruption is not a successful result.

Exit 0 means every selected required check passed. Exit 1 means one or more checks failed. Exit 2 indicates invalid usage or failure to save a requested report. JSON includes selected suites, commands, timeout values, return codes, duration, stdout/stderr, and per-check statuses. A report from a partial run must not be described as a full baseline.

`--root` selects the checkout containing the tests and inputs, with that directory used as the working directory. Keep the draft out of the source checkout until integration is complete. After integration, no root argument is needed when invoking the repository's runner.

## Coverage

| Suite | Existing checks included | Scope |
|---|---|---|
| core | 29 | Runner failure-path tests; dated runtime inventory; migration version uniqueness; setup and institutional authorization contracts; mastery evidence/guards and canonical sync/endpoint regressions; auth/cache; route/readiness behavior; portal/login/practice regressions; lesson access/visibility/progression; course/single-bank isolation; local HTML references |
| lessons | 27 | Every mathematical and DOM test in the current Pages build for AP Calculus, AP Precalculus, and the current IB Unit 1 lesson releases; additional Precalculus contexts and both Calculus midunit batch regressions |
| bank | 12 | Manifest filename case regression; private-bank foundation and import/replacement/snapshot/deletion boundaries; inventory accounting; cumulative audit overlays; canonical KaTeX parsing; browser release smoke checks; existing independently audited release validator |

The explicit manifest is in `tools/validate_baseline.py`. Tests are not discovered by a permissive glob; deleting a required file fails the baseline. Additional historical/course-specific checks remain available in their existing workflows. This baseline does not claim to execute every historical lesson validator in the repository.

`.github/workflows/baseline-validation.yml` runs all 68 checks on pull requests and main pushes, including all 13 runner self-tests through the core suite, with pinned dependency installation and an uploaded JSON report even on failure. Its Linux execution complements local Windows runs; it does not replace any existing deployment workflow.

Bank execution preserves gate logic and question counts. The baseline does **not** run `apply_strict_audit_gate.py`, generate questions, promote items, regenerate student-bank output, or regenerate checksum manifests. Existing bank validators may write their normal diagnostic reports, including the browser, KaTeX, overlay, and release reports. A stale/missing checksum or failed publication check remains a failure to investigate; do not repair it by weakening the gate or enlarging the public pool.

## Institutional configuration isolation

The existing activation validator temporarily changes `config/institution.json` while invoking the pre-activation institution validator. The baseline runs it inside a disposable fixture instead of in the checkout. The fixture contains byte-for-byte copies of both existing validators and their literal file inputs. With an enabled real config it runs the unchanged production-activation validator, preserving all of its enabled-config assertions; otherwise it runs the unchanged institution validator. It does not change the real config mode to obtain a pass.

Only the fixture config can be rewritten. Failure or timeout leaves repository runtime files untouched; abrupt termination can leave a disposable fixture in the system temp directory. New dynamically constructed validator inputs must be added to the fixture-copy mechanism when introduced; an absent input fails validation. The self-tests cover activated-config failure propagation and original-config preservation.

## Windows portability changes

Baseline-listed Node tests now convert file URLs through `fileURLToPath(new URL(...))` before passing paths to CommonJS `require`. `URL.pathname` encodes spaces and can produce `/C:/...` on Windows. Actual browser navigation pathname fields remain unchanged. The bank browser validator accepts `ECHS_TEST_PYTHON` while retaining its prior `python3` fallback for direct existing invocations, and uses an isolated system-temp directory for browser files. The release validator examines actual directory-entry spelling for a forbidden uppercase `MANIFEST.json`, avoiding a false duplicate caused by Windows resolving that path to lowercase `manifest.json`. The uppercase-file prohibition remains tested and enforced. No lesson or product behavior changes are required for these fixes.

## Separate release and live checks

The baseline does not deploy Pages, create an artifact, inject access guards into an artifact, upload a bank, promote content, connect to Supabase, or verify live credentials, RLS against a running database, account workflows, cloud synchronization, or external API health. Its authorization/mastery/sync tests are local source contracts and mocked runtime regressions, not proof of live backend health.

Keep the existing Pages artifact integrity checks, production activation/deployment workflow, Deno Edge Function type checks, authenticated browser QA, live release verification, and protected publication review. Deno checks remain separate because they need their own runtime and external type dependencies. No existing workflow gate has been removed or replaced by this runner.
