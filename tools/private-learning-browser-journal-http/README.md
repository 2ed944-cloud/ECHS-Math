# Isolated browser journal HTTPS acceptance

This tooling proves the next transport boundary for the accepted T3 IndexedDB
store. It does not install a browser journal, deploy an Edge Function, adopt a
production account, or change a lesson, answer, mastery rule, curriculum record,
URL, publication gate or Pages configuration. Implementation and offline checks
alone do not establish actual browser or SQL acceptance.

## Source and prerequisite closure

`source-manifest.json` lists 100 exact source files with byte counts, SHA256 and
Git blob hashes. Its own bytes are bound separately by the publication and
execution receipts. The 101 new repository paths comprise this namespace and
one workflow. `input-pins.json` binds 98 existing repository files; none is
modified here.

The 69-file `retained/` layout preserves the accepted T3 source manifest,
17 sources, 49 inputs and two native browser reports byte for byte. Its original
verifier checks only that original closure. The T3 manifest is
`62ceef6e1a69bc8462aaa80ff56800e27452ee5a028b527b3fc88a6a853222ce`.
Its 84 main and 14 supplemental native groups are historical prerequisites.
They are not rerun or added to this gate's fresh integration count.

Eight server files are exact copies from accepted owner-fence retry tooling:
the four J049 modules, `bridge.mjs`, `controls.py`, `test_http.mjs` and
`test_bridge.mjs`. All original twenty HTTP case bodies remain unchanged.
`control-client.mjs` exports the exact original private control function.
`fixture.py` retains the bootstrap and SQL ordering while removing the previous
retry-counter probe; its installer verifies the actual connected PostgreSQL
major and an independently established owned database marker before changes.

Installation order is the exact 27 pinned migrations, the accepted repaired
owner-fence SQL, then the accepted journal SQL. There is no new migration.
The accepted server prerequisite is main
`2c1a0ec618d7a4231195876ff6cbdfb53ad4c819`, tree
`a4a4ca451e98afff6908339edc87ea42f9e0e184`, actual run `34676455969`.
Its 479 assertions per major remain historical evidence; this workflow does not
claim to rerun those 479 assertions.

## Actual execution boundary

The new workflow has exactly two disposable jobs, PostgreSQL 15 and 17. Each
installs the unchanged schema into its own initially empty database, executes
the original twenty Node HTTP cases, then twelve native Chromium cases through:

`native IndexedDB → browser fetch → HTTPS 127.0.0.1 → unchanged J049 → private PostgREST → owned PostgreSQL`

The integration total is **32 fresh groups per major**, comprising twenty HTTP
groups and twelve browser groups. B05 contains two required fault subcases.
Local fixture suites are reported separately: 20 contract groups, 14 certificate
groups, 17 process supervisor groups, 20 descendant registry groups, 10 HTTPS
adapter groups and the nine retained loopback adapter groups. Strict Linux CI
requires zero skipped certificate/process/descendant groups.

| Browser group | Required actual observation |
| --- | --- |
| B01 | Native durable intent reaches SQL; raw request hash and committed receipt agree; ACK clears three matching rows without changing learning effects. |
| B02 | SQL commits before a held reply; a newer native edit survives the old ACK and is sent with the correct predecessor revisions. |
| B03 | Two pages sharing one context/database deliver the same UUID; SQL retains one operation and native storage records one first ACK and one duplicate. |
| B04 | A committed reply is dropped; lookup remains informational; reopening the page/store within the same browser context preserves the UUID and exact raw replay. |
| B05 | A real 207 response and a flushed HTTP200 truncated response each retain the pending intent until exact replay. |
| B06 | SQL session revocation produces native401; a fresh synthetic session for the same owner can retry the unchanged intent. |
| B07 | Revocation commits during an observed database lock wait; no journal commit or local ACK follows. |
| B08 | Reset advances the server generation after a dropped old receipt; replay retains the historical receipt, blocks old-context materialization and preserves newer pending work. |
| B09 | A competing mutable revision produces409 and rolls back the entire compound request, retaining the native attempt and pending state. |
| B10 | A held response is already committed when disposal aborts browser fetch; a request/socket-close event is observed before release, the late ACK is refused, and exact retry recovers. |
| B11 | An actual IndexedDB request-success callback invokes transaction.abort; the native abort event occurs, all eleven stores stay unchanged, and exact retry recovers the committed SQL receipt. |
| B12 | A duplicate receipt cannot rewrite the first raw reply or immutable receipt after generation change; new materialization remains blocked. |

B04 proves same-context page/store reopening. It does not claim a full browser,
profile or operating-system restart. Fault controls and SQL credentials remain
in private supervisor/Node processes. The browser receives only synthetic owner
data and a short-lived synthetic session token. No privileged control endpoint
is served to the browser.

## Browser, HTTPS and process ownership

The existing package and lock files pin Playwright/core 1.61.1. The installed
`browsers.json` must match the exact descriptor in `browser-dependency.json`:
full Chromium revision 1228, version 149.0.7827.55. The runner records the actual
version and executable SHA256 before execution, then verifies that the executable
SHA256 remains unchanged after execution. The accepted native
T3 Chrome153 evidence is a separate browser build.

Python directly launches Chromium and the two Node test children in separate
owned process groups. Playwright connects over the private ephemeral CDP
endpoint after Python verifies its loopback address, socket inode and owned
browser process identity. Each browser case uses a fresh incognito context;
only the cases explicitly requiring two pages or reopening share a context.
The explicit fresh profile, CDP file and endpoint stay outside served routes
and uploaded artifacts.

Each run generates two unrelated EC P-256 self-signed leaves with SAN127.0.0.1,
CAfalse, serverAuth and a 24-hour validity period. Private material resides in an
owned0700 directory with0600 files and is removed during independently attempted
cleanup. Chromium receives only the positive leaf SPKI exception and an explicit
fresh user-data-dir. That flag is a narrowly scoped certificate-error exception,
not exclusive certificate pinning: Chromium can match a presented-chain SPKI.
No broad ignore-certificate-errors, ignoreHTTPSErrors or CDP certificate bypass
is used. The real browser must return the generated leaf's exact DER and SPKI
through `Network.getCertificate`; the unrelated same-SAN listener must fail
with zero application HTTP requests and no fixture sentinel.

This per-run loopback TLS exercise is not hosted TLS or hosted Edge acceptance.

The owned Chromium process also receives exactly one `--no-proxy-server` flag.
The browser's observed command line must contain that flag and no proxy-server,
PAC, auto-detect or bypass override. This keeps the isolated loopback transport
independent of ambient proxy discovery; it does not change system settings,
the route allowlist, fresh contexts or the narrow TLS exception. Chromium
documents this command-line behavior in its
[network settings reference](https://www.chromium.org/developers/design-documents/network-settings/).
Offline guards reject a missing, duplicated, valued or conflicting proxy flag.

Local diagnostic evidence used Playwright1.61.1 and pinned Chromium149.0.7827.55
on Windows with per-run .NET certificates. A private NetLog showed pending PAC
initialization before any loopback TCP connection; its raw trace was deleted.
With the explicit no-proxy flag, fresh-context HTTP/HTTPS controls and a separate
CDP-attached exact-route HTTPS control loaded the fixture, verified the served
leaf DER/SPKI and rejected an unrelated leaf before HTTP. That CDP control had
a managed persistent browser owner plus a second controller. These local
adaptations do not establish the cause of the Linux CI timeout, execute any
PostgREST/SQL browser cases or replace the required PG15/17 matrix acceptance.

The Linux no-proxy run still timed out at initial navigation on both majors.
The diagnostic successor therefore records passive setup counters for browser
requests, route continuation, TCP/TLS connections, parsed HTTP, CDP responses
and document lifecycle events. Existing browser version, argv, profile and TLS
flag checks run before navigation; successful verification is recorded as a
boolean. The navigation deadline and all acceptance cases are unchanged.
Counters saturate at255 with an explicit saturation flag.
Continuation attempts, fulfillment and rejection are counted separately while
returning the original promise; the abort counter records invocation only.
Throwing browser event getters increment an observer-error counter without changing request
flow. No socket data listener, clientError listener or emit override is added.
Only fixed error codes, a numeric document status and closed counters can leave
the private report, and only for a setup failure captured before cleanup.
Malformed observations are omitted entirely; successful artifact shapes and
case counts are unchanged. This diagnostic evidence cannot grant acceptance.
The listener serves exactly ten fixed buffered entries: one HTML page, one
fixture module, a favicon and seven exact T3 modules. The held transport module
is retained but unserved. There is no arbitrary static root or filesystem path
conversion. Four fixed API routes are the only dynamic browser endpoints.

Chromium can create detached helper processes. The supervisor therefore enables
Linux subreaper mode before any child launch, requires an initially empty child
set, and records PPID/UID/start identities plus pidfds. Registered Popen roots
are waited only by their owner; adopted descendants are reaped by the registry.
Every group and registered root is independently cleaned even after an earlier
inventory error. Exact pidfds bound TERM/KILL for detached descendants; final
acceptance requires zero descendants, closed CDP/TLS listeners, removed owned
containers/network and removed private material. The test-only Crashpad disable
flag is defense in depth; actual absence proof is still required. Synchronous
Docker/OpenSSL commands are waited before any registry scan, avoiding competing
wait ownership. No global process-name or broad container deletion is used.

Primary references: [Chromium SPKI verifier](https://chromium.googlesource.com/chromium/src/+/main/services/network/ignore_errors_cert_verifier.cc),
[CDP certificate method](https://chromedevtools.github.io/devtools-protocol/tot/Network/#method-getCertificate),
[Playwright browser installation](https://playwright.dev/docs/browsers),
[Crashpad detached process implementation](https://github.com/chromium/crashpad/blob/main/util/posix/spawn_subprocess.cc).
These explain mechanisms; the locked executable's actual behavior is established
only by the CI controls and cleanup receipts.

## Reproducible isolated gate

From the repository root, a network-free source preflight is:

```sh
python -B tools/private-learning-browser-journal-http/contract.py --repo .
python -B tools/private-learning-browser-journal-http/run.py --repo . --postgres-major 15
python -B tools/private-learning-browser-journal-http/run.py --repo . --postgres-major 17
```

Actual execution is restricted to a dedicated Linux GitHub-hosted job with
Node24, Python3.12, OpenSSL3, Docker and the exact locked dependencies. No
production environment variables, remote Docker context or ambient database
overrides are accepted. The workflow installs full Chromium into a fresh
`RUNNER_TEMP/echs-browser-bin` cache and pins psycopg[binary]3.2.9, pglast7.7 and
PyYAML6.0.2. PostgreSQL and PostgREST image digest plus actual image ID are checked
before launch; their exact references are in `fixture.py` and `run.py`.

```sh
python -B tools/private-learning-browser-journal-http/local_tests.py --repo . --output "$RUNNER_TEMP/browser-journal-local-tests" --execute
python -B tools/private-learning-browser-journal-http/run.py --repo . --postgres-major 15 --execute
python -B tools/private-learning-browser-journal-http/assemble.py --repo . --postgres-major 15 --directory "$RUNNER_TEMP/private-learning-browser-journal-http-15" --tests "$RUNNER_TEMP/browser-journal-local-tests" --output "$RUNNER_TEMP/private-learning-browser-journal-http-evidence-15"
```

Run major17 in its own matrix job with the analogous two major arguments and
artifact directory. Output directories must be fresh. A local Windows run may
execute portable guard tests, but cannot satisfy the required native Linux,
OpenSSL or real browser/SQL gate by skipping tests.

## Evidence, security and rollback

The service runner indexes nine safe reports. It records actual Git HEAD, tree,
parents and event head/base; source hashes before and after; image and database
versions; and each waited child report's exact hash tied to run UUID, major and
source manifest. The local suite wrapper separately records six exact waited
suite outputs and source sweeps. The collector requires their seven-member
closure, strict success shapes, exact labels/counts/source files and native
availability flags. It independently rereads Git event/tree/parents and every
member before writing the final index. A successful service artifact has
19 members: nine service reports, their inner index, seven local members,
acceptance and the final artifact index. Local seven-member evidence is also
retained separately. The workflow uploads only the separate validated evidence
directory. If raw evidence is rejected, the collector emits a fixed failure
projection containing fixed case identifiers, status/count/error and cleanup
fields; rejected raw reports are never copied into the upload directory. Missing,
stale, substituted, partial or cleanup-failed evidence cannot create an accepted
index. A partial safe copy is also unaccepted unless its final index is present.

No token, JWT, password, PEM, private key, browser profile/CDP endpoint, raw RPC
body, screenshot, tracing/HAR data, database content or service log is uploaded.
Synthetic values used in assertions remain in process/private pipes; only
closed status/count/hash metadata is retained. Docker services use an owned
internal network without published ports and volatile PostgreSQL data. Source
drift cannot skip secret cleanup, and one resource failure cannot skip another
owned resource's cleanup attempt.

Rollback is removal/reversion of this new tools namespace and workflow only.
All previous tools, frozen candidates, accepted SQL, runtime modules, current
deployment and cohort behavior remain unchanged. Actual hosted Supabase17.6
compatibility, production authority integration, browser adoption, migration
execution and full C04 completion remain outside this gate. Readiness for the
next integration step requires both real PG15/17 matrix artifacts and independent
source/index/cleanup review; source or local injected checks alone are insufficient.

The setup diagnostic also captures Playwright 1.61.1's private protocol logger in
an exclusive `0600` file under the run's `0700` secrets directory. Only the browser
driver receives `DEBUG=pw:protocol`; the shared logger implementation and format
are pinned by exact coreBundle/utilsBundle hashes. A same-PID exec wrapper sets
`RLIMIT_FSIZE` to at most 2 MiB, retaining a tighter inherited hard limit. The
existing owned process/group registration still governs the exec'd Node driver.
The parent always closes its log handle and only parses a waited driver.

A synchronous run-bound marker disables that logger immediately after the first
HTTPS navigation settles, before fixture evaluation or cleanup. The parser
selects the Playwright session that sent the exact owned-root `Page.navigate`,
binds command acknowledgements to that session, and compares its root Network
request IDs with Fetch pause network IDs. This differs from the separate CDP
observer's event counts. IDs, URLs, parameters and raw log lines remain private.
Only closed capped counts and completeness flags enter a failure projection;
the success artifact shape and all 20 HTTP and 12 browser cases remain unchanged.
Missing/ambiguous markers, malformed or truncated captures and file-cap overflow
produce incomplete diagnostics with no counters and cannot grant acceptance.
The trace is removed through the existing independent guarded secret cleanup.

The local pinned Windows149/.NET smoke verifies actual logger formatting,
first-HTTPS session pairing and marker parsing with a synchronous capped stderr
observer. It does not exercise Linux's file limit or prove the Linux failure's
cause. Required Linux supervisor tests additionally exercise exec identity and
file overflow; real PG15/17 browser jobs remain the acceptance gate. The parser
relies on the source-pinned Playwright private logger, so a dependency upgrade
requires deliberate source review, not a relaxed parser. The file-limit contract
is documented in Python's [resource reference](https://docs.python.org/3.12/library/resource.html#resource.RLIMIT_FSIZE).

Only after an identity-verified initial navigation times out, two diagnostic
contexts may run in the same owned browser. The original failure, passive
snapshot and synchronous private-protocol boundary are retained first, and the
original contexts must close successfully. The first fresh context retains the
original positive route predicate; the second performs no interception. Neither
attaches an extra page CDP session before navigation. Successful loads receive
the same exact leaf DER/SPKI check through a session attached afterward. A fresh
agent has no certificate history, so it enables Network and observes one fixed
static GET of `/` before reading the certificate. This verifies the post-load
static response; it neither warms nor independently identifies the initial
navigation response. The response body is drained privately and only status200
and the exact leaf comparison are used.

These contexts load the pinned static fixture without configuring learning
state or calling a journal API. Closed counts record static requests, unexpected
events, zero-API checks, transport deltas and independent context cleanup. A
navigation snapshot records counts and deltas before the certificate probe;
the row totals cover the whole arm. Fixed probe attempted/completed/status
fields and exactly one extra static request distinguish its contribution. The
original nine-static-request requirement applies to the navigation snapshot. Each
arm has bounded operations. A failed navigation still permits the second arm
when its context closes successfully; incomplete cleanup leaves the second arm
unattempted with unknown deltas, so leftover traffic cannot be attributed to it.
Final owned-resource cleanup always runs. Unknown or saturated counters are explicit.
The controls run after the original timeout, sequentially in the same browser;
startup time or warming can influence their results. V5 already timed out before
any extra page CDP session existed, so extra CDP is not necessary for this failure.
An `OBSERVED` control is a diagnostic observation, not a repair or an acceptance
result. The original run always remains failed, and the 20 HTTP, 12 browser and
90 local test-group totals are unchanged.

Chromium startup stderr is captured privately with the single diagnostic flag
`--enable-logging=stderr`. The parent continuously drains its owned pipe into an
exclusive mode0600 file under the per-run secrets directory. Storage stops at
2MiB while draining continues, so a log flood cannot block the browser on a full
pipe. This does not apply a file-size resource limit to the browser or its profile.
The reader starts after subreaper initialization and has no process or reaping
authority. The parent's writer handle closes immediately after launch.

After the driver wait, a locked, flushed whole-line cutoff records the observed
prefix before Python's owned-process cleanup. It may already include the
driver's context/listener teardown and diagnostic controls, so a recorded error
does not establish that it preceded the failed navigation. This also does not
establish that Chromium or the pipe has delivered all startup bytes. Following
independent root and descendant cleanup,
the reader waits for EOF and joins with a bounded stop fallback. Private-directory
removal requires the reader stopped and all its handles closed. Raw stderr stays
private and is never included in an artifact.
EOF is also required for cleanup acceptance. A daemon-thread fallback only
bounds interpreter exit after failed I/O shutdown; an unjoined or non-EOF reader
fails the run and retains its private directory.

Only failed runs expose fixed severity and source-backed category counters from
that prefix: network-service restarts, shared-memory errors and DBus source lines.
Unknown and malformed lines, saturation, storage caps, partial lines and reader
uncertainty remain explicit. Known positive observations survive unrelated
unknown lines. Counts are lower bounds; zero means none observed in this prefix
and never proves absence throughout startup. Successful report shapes and the
20 HTTP, 12 browser and 90 local group totals remain unchanged.

The diagnostic logging flag and exact log prefix follow Chromium149's
[logging destination implementation](https://github.com/chromium/chromium/blob/149.0.7827.55/chrome/common/logging_chrome.cc)
and [log formatter](https://github.com/chromium/chromium/blob/149.0.7827.55/base/logging.cc).
Fixed categories use its
[network-service restart message](https://github.com/chromium/chromium/blob/149.0.7827.55/content/browser/network_service_instance_impl.cc),
[shared-memory diagnostics](https://github.com/chromium/chromium/blob/149.0.7827.55/base/memory/platform_shared_memory_region_posix.cc)
and [DBus source](https://github.com/chromium/chromium/blob/149.0.7827.55/dbus/bus.cc).

This isolated CI fixture explicitly selects
`--enable-features=NetworkServiceInProcess2`. Chromium149 defaults this feature
off on Linux. The selected path constructs the native `network::NetworkService`
on a browser IO or dedicated thread, using the same service parameters and
client initialization; it does not use the separate mock-network test branch.
Only the network service moves into the already owned browser process. Browser
contexts, renderer processes, native HTTP/TLS, interception and exact certificate
checks remain required. The observed browser arguments must contain precisely
this feature selection, with no conflicting feature or single-process flags.

The prior fixture repeatedly logged network-service replacement while both
routed and unrouted navigation failed before reaching the loopback listener.
Those logs do not distinguish a crash from termination or establish exact causal
timing. This configuration changes service process isolation; it does not repair
or explain that unknown out-of-process failure, prove default Linux Chrome
equivalence, or support a production deployment claim. Acceptance still requires
all32 actual HTTP/browser groups per PostgreSQL major and every existing native
TLS, SQL, source and owned-process cleanup check. Diagnostics remain available.

The exact feature name and Linux default are defined in Chromium149's
[content features](https://github.com/chromium/chromium/blob/149.0.7827.55/content/public/common/content_features.cc).
Its [selection logic](https://github.com/chromium/chromium/blob/149.0.7827.55/content/browser/network/network_service_util_internal.cc)
and [native service construction](https://github.com/chromium/chromium/blob/149.0.7827.55/content/browser/network_service_instance_impl.cc)
define this fixture configuration's scope.

After the unrelated certificate is specifically rejected and its listener has
received zero application HTTP requests, the fixture-absence check uses
Playwright's native `waitForFunction` with a five-second deadline. It must
successfully observe absence, then dispose the returned handle within two
seconds. This allows native execution-context settlement without accepting a
timeout, evaluation error, closed target or disposal failure. The immediate
evaluation failed in the prior Linux run; its generic error does not establish
the exact underlying cause. Pinned Playwright1.61.1's
[frame implementation](https://github.com/microsoft/playwright/blob/v1.61.1/packages/playwright-core/src/server/frames.ts)
reacquires the execution context when retrying recoverable wait failures under
the original deadline. The certificate checks and all HTTP/browser case bodies
remain unchanged.
