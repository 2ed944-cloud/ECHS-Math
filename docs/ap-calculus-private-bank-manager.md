# AP Calculus private-bank import through Upload Manager

The Teacher Upload Manager accepts validated private-bank ZIP packages whose manifest declares:

```json
{
  "target_courses": ["ap-calculus"]
}
```

## Teacher workflow

1. Sign in as a teacher or administrator.
2. Open **Upload Banks & Units → Private Bank Manager**.
3. Leave **Target course** on **Auto-detect from package manifest**, or select **AP Calculus**.
4. Upload the validated ZIP package.
5. The protected processor verifies the ZIP, SHA-256, trust and rights contract, course targets, per-question mappings, IDs, media references, and question count.
6. Questions and media are imported to private Supabase storage and become available only through authenticated practice.

The selected course is passed to the importer as an expected target. A mismatch between the manager selection, `target_courses`, and question-level `course_mappings` fails the request instead of silently routing questions to another course.

## Supported private-bank targets

- `ap-calculus`
- `ap-precalculus`
- `ib-math-ai`
- `algebra-2`
- `grade-9`

Legacy multi-course packages remain supported when **Auto-detect** is selected.
