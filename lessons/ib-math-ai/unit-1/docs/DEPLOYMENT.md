# ECHS platform deployment

1. Copy this complete folder to `lessons/ib-math-ai/unit-1/` in the repository.
2. Keep the internal `assets`, `data`, `lessons`, `portal`, `docs`, `reports` and `tools` folders together.
3. Load `lessons/ib-math-ai/unit-1/portal/ib-math-ai-unit-1.js` after `data/courses.js` in the platform entry page. The patch searches for the IB Applications and Interpretation course and replaces only Unit 1.
4. Do not replace the private-bank registry or regenerate any bank IDs. The lesson patch uses existing skill keys.
5. Open `lessons/ib-math-ai/unit-1/START_HERE.html`, all eight lesson links, and the Practice/IB Tasks/Quiz routes after deployment.
6. Run `python tools/validate_package.py` from the package root.

The package is intentionally self-contained and contains no font files. KaTeX JavaScript is local; its CSS uses system math-font fallbacks.
