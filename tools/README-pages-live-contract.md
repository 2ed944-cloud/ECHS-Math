# Pages live verification regression

Run from the repository root:

```sh
python tools/test_pages_live_contract.py --repo .
```

The seven offline test groups extract and execute the exact Python verifier in
`.github/workflows/deploy-pages.yml`. Only downloaded file reads and `GITHUB_SHA`
are injected. The tests require all 36 existing conditions, individually falsify
each condition, reject all 12 missing downloads, reject malformed metadata, and
reject stale release identities. The actual IB 1.6 HTML must load the current
scoped GDC integration script. Substituting the retired script must fail. The
workflow runs this suite after Python setup, before existing validations, and
pull requests changing the suite trigger the workflow.

The deployment repair changes the expected integration filename from
`unit-1-gdc-integration-v7.js` to
`unit-1-gdc-integration-lesson-quality-v1.js`. The lesson continues to use
`unit-1-gdc-integration-v7.css`. All authentication, fingerprint, content, retired
asset exclusion and service-worker checks remain intact, as do deployment,
download and retry behavior.

Optional `--report PATH` writes a fresh JSON report. An isolated workflow overlay
can use `--lesson-root PATH` to locate the corresponding full source tree.

For a separately captured public release, `--responses DIRECTORY` reads the 12
saved `echs-*` files used by the live workflow and requires `--expected-sha SHA`.
It performs no network requests. Optional `--original-workflow PATH` additionally
proves that the retained predecessor fails only condition 33 while the corrected
verifier passes. This is a replay of public response bytes, not an authenticated
browser check or a new successful CI deployment.
