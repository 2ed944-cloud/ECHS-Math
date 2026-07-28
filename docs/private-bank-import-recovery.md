# Private-bank import recovery

The Teacher Upload Manager uses an idempotent streaming importer for large publisher-key banks.

- Question and media metadata upserts use `return=minimal`.
- Question batches default to 250 records.
- Progress is streamed to GitHub Actions and written to `teacher_upload_requests`.
- Requests interrupted in `processing` are recoverable without uploading the ZIP again.
- The workflow timeout is 120 minutes.
- Existing question IDs are preserved and retries use conflict-safe upserts.

After deployment, run **Process Teacher Uploads** with a blank `request_id` to resume the oldest queued or interrupted request.
