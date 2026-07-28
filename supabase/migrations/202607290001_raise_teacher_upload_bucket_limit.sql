-- Align the production Storage bucket with the Upload Manager's 150 MB contract.
-- Some environments retained Supabase's lower historical bucket limit, which caused
-- valid ZIP packages such as the 52.6 MB AP Calculus bank to fail after signing.

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values (
  'teacher-upload-staging',
  'teacher-upload-staging',
  false,
  157286400,
  array['application/zip','application/octet-stream']
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
