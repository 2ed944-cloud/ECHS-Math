# ECHS Portal integration note

The current public `js/portal.js` renders only the first two resources on each lesson card:

```js
const resources = (lesson.resources || []).slice(0,2).map(resourceHtml).join("");
```

Replace it with the following so the video, notes, worksheet, and homework can all appear:

```js
const resources = (lesson.resources || []).map(resourceHtml).join("");
```

The current `resourceHtml` function makes a resource clickable only when the resource string includes a full `http://` or `https://` URL. Use the complete GitHub Pages URLs in `COURSES_JS_WORKSHEET_RESOURCE_LINES.txt`.

Example:

```js
resources: [
  "Video: https://...",
  "Notes: https://...",
  "Worksheet 1.1: https://2ed944-cloud.github.io/ECHS-Math/worksheets/ap-calculus/unit-1/worksheet-1-1-introducing-calculus-can-change-occur-at-an-instant.pdf",
  "Homework: https://..."
]
```
