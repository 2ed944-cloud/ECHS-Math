# ECHS Mathematics Lesson Portal

Teacher: **Mohammad Abu Ghuwaleh**

Static GitHub Pages lesson portal for ECHS mathematics courses.

## Courses included

- G12 AP Calculus AB
- G10–G11 AP Precalculus
- G11 IB Mathematics: Applications and Interpretation
- G9 Pre-Precalculus

## Current files

- `index.html` with course tabs, search, lesson-flow cards, bookmarks, completion marking, print support, and responsive layout.
- AP Calculus AB lesson flow from the attached Year-at-a-Glance.
- AP Calculus HTML lessons 1.1–1.4 in `lessons/ap-calculus/`.
- AP Precalculus lesson flow from the attached Year-at-a-Glance.
- AP Precalculus HTML lessons 1.1–1.2 in `lessons/ap-precalculus/`.
- Course flow maps for G11 IB AI and G9 Pre-Precalculus.
- PWA files: `manifest.json`, `sw.js`, and icons.

## File structure

```text
echs-math-lessons/
├── index.html
├── manifest.json
├── sw.js
├── assets/
│   ├── echs_logo.png
│   ├── icon-192.png
│   └── icon-512.png
├── data/
│   └── courses.js
├── js/
│   └── portal.js
└── lessons/
    ├── ap-calculus/
    │   ├── 1-1-introducing-calculus.html
    │   ├── 1-2-understanding-limits-graphically.html
    │   ├── 1-3-properties-of-limits.html
    │   └── 1-4-limits-of-composite-functions.html
    └── ap-precalculus/
        ├── 1-1-change-in-tandem.html
        └── 1-2-rates-of-change.html
```

## Deploy to GitHub Pages

1. Create or open your GitHub repository.
2. Upload all files and folders from this package to the repository root.
3. Go to **Settings → Pages**.
4. Set Source to **Deploy from a branch**.
5. Choose branch **main** and folder **/root**.
6. Save.

## Editing lesson flow

Open `data/courses.js`. Each course contains units and lessons. To connect a flow-map lesson to an HTML deck, add a URL like:

```js
"url": "lessons/ap-precalculus/1-3-rates-linear-quadratic.html"
```

Bookmarks and completion checks are stored in the user's browser through `localStorage`.
