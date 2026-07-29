# Offline opening fix — release 1.0.1

## Symptom

The lesson shell appeared, but the centre remained on **Loading lesson…**.

## Cause

The runtime was loaded as an ES module and imported KaTeX from another local file. Chromium-based browsers can block local module imports under the `file://` protocol.

## Correction

All eight lessons now load three ordered deferred classic scripts: lesson data, an isolated KaTeX browser build, and an isolated lesson engine. The engine also uses safe storage with an in-memory fallback.

## Verification

All eight lessons passed the post-fix interaction suite. See `offline-opening-fix-qa.json`.

## Opening instructions

Extract the ZIP completely, then open `START_HERE.html`. Do not open an HTML lesson while it is still inside the ZIP archive.
