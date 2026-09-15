These portable checks cover the isolated polynomial-plot and residual-input repairs in IB school lesson1.6. They preserve all bytes outside the two lab functions and do not change lesson data, question IDs, routes, assessment state or authorization.

```sh
node tools/ib-technology-quality/test-technology.mjs --repo . --baseline-root "$RUNNER_TEMP/ib-technology-baseline" --report "$RUNNER_TEMP/ib-technology-components.json"
node tools/ib-technology-quality/test-native.mjs --repo . --report-dir "$RUNNER_TEMP/ib-technology-native"
```

`baseline-pins.json.files` has one original source, identified by byte count and SHA256. CI extracts that exact file from merged baseline commit `77fe3c6ac85c6796415237ced26731ab3e307195` into an owned directory. Its Git blob is `0da73e785b0230998535e22d86ed2fd938ad3151`; an authenticated read at that commit matched the retained original and current source bytes. No original source tree is bundled for publication. The native-context rows are existing entry/scoped engine/GDC pins, not additional original-file extraction requirements.

`ECHS_TEST_DOM_MODULE` optionally locates LinkeDOM. `ECHS_PLAYWRIGHT_MODULE` and `ECHS_CHROMIUM_PATH` optionally select installed native-test dependencies. Local isolated review can add `--overlay-root <candidate/source>` to the native command; other assets and canonical HTML come from `--repo`. Native serves only loopback lesson assets, blocks off-origin requests, and uses original legacy UI with no authentication/backend. It records all served byte hashes and verifies them after execution; its active context is the versioned1.5/1.6 release.

The component test executes the actual module with DOM/observer/frame seams; native tests verify true range/number behavior, graph agreement, mobile390, navigation/remount and original assessment state. Neither test promotes a reveal or interaction to mastery. Context/browser/server cleanup is independent and bounded.
