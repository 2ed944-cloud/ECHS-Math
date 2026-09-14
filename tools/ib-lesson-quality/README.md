These checks cover the IB1.5 scope/quiz changes, IB1.6 line clipping and the shared GDC math bridge. They do not certify production authentication, synchronization or mastery authority.

The component test reads current sources from `--repo` and exact original files from `--baseline-root`. `baseline-pins.json` lists five paths and byte/SHA-256 pins at commit `dcc65f84dafd2dc5cb4518ea03d18b4087ddf4ff`. CI should fetch that revision and write those five `git show` blobs into an owned temporary directory, preserving bytes. Original source trees are not bundled here.

```sh
node tools/ib-lesson-quality/test-ib-quality.mjs --repo . --baseline-root "$RUNNER_TEMP/ib-baseline" --report "$RUNNER_TEMP/ib-components.json"
node tools/ib-lesson-quality/test-native.mjs --repo . --report-dir "$RUNNER_TEMP/ib-native"
```

The component command resolves `linkedom`, or accepts `ECHS_TEST_DOM_MODULE` pointing to an installed module. The native command resolves `playwright`, or accepts `ECHS_PLAYWRIGHT_MODULE`; `ECHS_CHROMIUM_PATH` optionally selects a browser executable. Use the repository's locked Playwright dependency and install its Chromium browser in CI. The report directory must be fresh; the harness creates it.

For isolated local review only, the native command also accepts `--overlay-root` containing the five candidate source paths and `--source-manifest` containing their exact `source_files` byte/hash rows. All remaining assets, including the two canonical HTML documents, are served unchanged from `--repo`. Every served byte is checked again after execution. The server binds loopback; off-origin browser requests are blocked. No synthetic account is installed: this is the existing legacy lesson UI, with synthetic local responses only and no Pages authentication/backend claim.

Native checks cover both scopes, score isolation, original question IDs/workspaces, reload, scope-only restart, actual GDC formulas and labels, no score writes on reveal, mobile width390, and the steep line m=4,b=5. Context/browser/server cleanup is independently attempted and reported. Screenshots and reports are test evidence; no learner answers or credentials are used.
