# ECHS Mathematics — AP Calculus Units 1–5 Refresh

This is a **drop-in repository update** for `2ed944-cloud/ECHS-Math`.

## What changes

- Replaces the AP Calculus lesson-card sequence in **Units 1–5 only**.
- Adds the uploaded interactive HTML lessons under clean, stable paths.
- Preserves and reorganizes learning objectives, the existing video links, and notes/practice placeholders.
- Keeps AP Calculus Units 6–8 and every other course untouched because `data/courses.js` is not replaced.
- Adds a more polished, responsive portal design.
- Updates the service worker so the new CSS/data are not hidden behind the old cache.

## Install

1. Extract this ZIP.
2. Copy all files and folders into the **root of the ECHS-Math repository**.
3. Allow these existing files to be replaced:
   - `index.html`
   - `js/portal.js`
   - `sw.js`
4. The remaining files are new additions.
5. Commit and push to the `main` branch. GitHub Pages will redeploy automatically.

Do **not** delete the repository's existing `data/courses.js`, lesson folders, assets, or other course files.

## Preview

After copying into the repository, open `preview.html` to see the refreshed interface with representative course data. The deployed `index.html` uses the repository's real `data/courses.js` and then applies only the AP Calculus Units 1–5 override.

## Adding notes later

In `data/ap-calculus-update.js`, each lesson has a `notes` array. Replace a blank URL with the repository path to the uploaded note file, for example:

```js
{"type":"notes","label":"Notes 2.4 · Basic Differentiation Rules","url":"notes/ap-calculus/unit-2/notes-2-4.pdf"}
```

A blank URL displays an attractive **soon** chip rather than a broken link.
