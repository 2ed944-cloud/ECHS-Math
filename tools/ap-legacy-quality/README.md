# AP lesson figure regression checks

The AP 1.7 repair binds two existing figures to their stated rational functions. The comparison tests verify the exact original and candidate hashes, reconstruct every original byte outside the two bindings and two added methods, and exercise both formulas across 10,005 sampled values. Original lesson files are extracted from the pinned commit into temporary test storage; they are not duplicated in this tools directory or uploaded as evidence.

```sh
node tools/ap-legacy-quality/test-ap17-figures.mjs --repo . --baseline-root /path/to/pinned-originals
ECHS_PLAYWRIGHT_MODULE=/path/to/playwright node tools/ap-legacy-quality/test-ap17-native.mjs --repo . --report-dir /fresh/report-directory
```

The native test uses the exact pinned document bytes as a browser route fixture. It verifies real canvas output, branch splitting, negative horizontal asymptotes, desktop/mobile layout and reveal controls. Canvas observation forwards calls to the actual native drawing methods. The fixture establishes no authentication, publication, mastery or browser HTTP transport claim. Set `ECHS_CHROMIUM_PATH` only when a local installed browser is required. Reports contain synthetic visual evidence and source hashes; no account data or answer-bank export is collected.
