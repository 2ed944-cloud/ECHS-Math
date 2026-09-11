# Read-only project metadata CI candidate

This package has one possible authenticated action: a fixed HTTPS GET to
`https://api.supabase.com/v1/projects/wkqadnfloiohqfnesmyq`. It cannot list projects,
read secrets, provision resources, deploy functions, run SQL, invoke a function,
upload an object or select learner records. No such operation is installed here.
The configured production project remains ineligible for synthetic fixture writes.

Three files are byte exact from the separately frozen 14-file hosted preparation:
`hosted_contract.py`, `management_preflight.py`, and
`test_management_preflight.py`. The source guard embeds their exact hashes and
the prior manifest hash. It also binds every one of this package's six files to
the checked-out Git blob and event SHA, rejects extra tracked files in this tool
directory, and rechecks all six sources after execution and before artifact creation.
Only these six paths may appear in the triggering change. Future combined releases
must explicitly review that source boundary rather than silently broaden it.

The command uses Python isolated mode and explicitly loads only the three
hash-checked source buffers. No project directory is added to the import search
path, no package is installed and no raw response is evaluated as code. The
standard Python libraries supplied by the GitHub runner are the remaining runtime
dependency. The checkout and artifact actions use verified immutable commits.

Pull requests run only the unchanged ten mocked HTTP/projection groups. That job
has no environment or secret and refuses an access-token environment variable.
It produces no real HTTP request. The guarded read job depends on the offline job,
requires a push to this repository's exact `main` reference, and runs only on the
first attempt. Its existing `institutional-production` environment supplies only
`SUPABASE_ACCESS_TOKEN`, scoped to the single reader command. No other Supabase
secret or GitHub write permission is requested. Each job has a two-minute bound;
the fixed reader itself refuses redirects/retries, requires verified TLS and JSON
identity encoding, and bounds the response to 128 KiB with a 15-second read deadline.

Each successful job creates exactly three artifact members: `checkout.json`,
`result.json`, and `artifact-index.json`. The result schema is closed before upload.
The live projection retains fixed project identity, organization ID, region,
status, database version, and explicitly false fixture/compatibility/hosted-workload
claims. It excludes project names, database hostnames, unknown response fields,
raw response bytes and credentials. The fixed public Management API hostname is
included only as request provenance. A raw-response SHA256 is not the raw response.

Failures print only a closed error code and return nonzero. Artifact upload requires
the guarded step to succeed; partial or unvalidated outputs are never uploaded.
The job's closed error log preserves the failure outcome. Missing secrets, permissions or endpoint changes
require investigation; there is no fallback endpoint, project enumeration or retry.
Re-running an existing workflow does not repeat the authenticated read. A new
reviewed main change in the explicit path list creates a separate run.

The local packaging tests use synthetic events, a disposable local Git repository
and mocked transports only. This candidate has not been published or run with a real
Management API token. A database major-version match is only metadata, not proof of
the 27-migration schema, Storage compatibility, resource limits, test isolation,
plan entitlement or a hosted execution. Whole C04 and C08 remain in progress.

Rollback consists of reverting this workflow/tool package. It has no database,
deployment, data cleanup or resource teardown consequence. Preserve any actual
read-only receipt as historical evidence rather than changing its outcome.
