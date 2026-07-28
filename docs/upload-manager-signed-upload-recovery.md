# Upload Manager signed-upload recovery

Large private-bank ZIP files are uploaded to Supabase Storage through a signed upload URL.

The browser must send the file in the same multipart form used by `uploadToSignedUrl`:

- HTTP method: `PUT`
- body: `FormData`
- field `cacheControl=3600`
- file field with an empty name
- header `x-upsert: true`

A request left in `created` state is retryable. The API issues a fresh signed upload URL instead of treating it as an already active import.
