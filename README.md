# ECHS AP Practice Center v6.2 Year Access Hotfix

Upload this folder's contents to the root of the `2ed944-cloud/ECHS-Math`
repository, preserving the paths shown in `CHANGED_FILES.txt`.

## What this fixes

- Clicking a year opens every complete question for that year in source order.
- The 104 form/collection records without a source year have their own
  `Other` card, so all 1,217 questions have a direct archive route.
- The practice builder now supports `All matching questions`.
- Year-card links select the year, select all complete content, select all
  matching questions, select source order, and start automatically.
- The archive page contains one question browser instead of seven duplicated
  blocks with repeated HTML IDs.
- Versioned CSS and JavaScript URLs bypass stale service-worker/browser caches.
- The root service-worker cache name is advanced to `echs-math-shell-v6-2`.

## Expected verified counts

- 1,217 complete and student-accessible records.
- 46 represented years.
- 1,113 records assigned to a year.
- 104 form/collection records without a year.
- 760 auto-graded records.
- 457 response-only records.

After GitHub Pages finishes publishing, open:

`https://2ed944-cloud.github.io/ECHS-Math/question-bank/official/archive.html`

Choose any year. The destination URL should include:

`practice.html?year=YEAR&content=all&count=all&sessionMode=ordered&autostart=1`

The `Other` card uses `year=unassigned` and opens all 104 records that do not
carry a source year.
