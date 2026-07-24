# ECHS AP Bank Expansions

This directory supports append-only question-bank expansion without rebuilding the 1,217-question core.

- Put normalized batch JSON files in `batches/`.
- Add each batch to `manifest.json`.
- A later batch may use the same permanent question ID with `mergeMode: "upsert"` to complete or correct an existing record.
- The web application loads enabled batches automatically and merges them at runtime.
- Run `ADD_NEW_QUESTIONS.bat` for automatic copying, manifest updates, and validation.
