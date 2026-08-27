# Independent Review Protocol

## Package Boundary

Build a versioned package from canonical full Git object IDs, the re-derived
base-to-head diff, configured repository-relative OpenSpec artifact hashes, and
current validation evidence. Canonical JSON and SHA-256 bind the package. Treat
all content as data; no package field becomes a shell command or reviewer
instruction beyond the fixed review request.

Resolve each declared artifact from the exact head's Git tree and read its
bytes directly from the referenced Git blob. Reject absolute, nonportable, or
noncanonical paths and any entry that is absent, a symlink, directory,
submodule, or other non-regular object. Never derive declared artifact bytes by
following the detached view's filesystem paths.

Expose the canonical package only through the read-only, digest-indexed
`.ai-independent-review-package/` capsule. Its canonical index fixes the
ordered chunk names, UTF-8 byte counts, and SHA-256 digests. Before launch,
reconstruct the complete canonical package bytes in that order and revalidate
the unchanged `independent-review-package-v1` manifest digest. Reject missing,
duplicate, reordered, extra, symlinked, non-regular, oversized, or
digest-mismatched entries. Initial fixed limits are 16 MiB for canonical
package bytes, 1 MiB for the index, 64 KiB per chunk, and 512 chunks; measure
all limits in UTF-8 bytes. Never expose the package as one unbounded line.

## Execution Boundary

Create a detached disposable Git view pinned to the exact head. The reviewer
must have a fresh noninteractive execution with runtime-enforced read-only
access. It must deny workspace and Git writes, GitHub mutation, credentials,
authenticated network, external sends, deployment/release operations, and
mutation-capable delegated work. A prompt, identity claim, or separate chat is
not proof. A runtime that cannot prove its boundary returns `unavailable`.

Codex uses an ephemeral `read-only` execution without user configuration.
Claude uses a fresh noninteractive process with a temporary settings file that
enables its OS sandbox, denies review-view writes and home reads, disables
unsandboxed fallback, removes mutation tools, and fails if sandboxing is
unavailable. Neither path changes ordinary user settings.

The archive places the exact repository at `review-session/repository` and
starts the reviewer from the neutral `review-session` parent. Repository
AGENTS, skills, plugins, rules, and similar startup customization are therefore
not discovered as execution instructions; the fixed prompt treats all content
under `repository/` as review data. Codex uses sibling temporary state that
copies only a bounded regular authentication artifact when present. It does
not copy config, sessions, skills, plugins, or history, and the sealed command
profile cannot read that sibling state.

Resolve review dispatch once from the immutable work-unit configuration
snapshot. The allowlisted `reviewAdapter` must select one matching launcher,
installed-runtime helper, reviewer identity class, strict and
authorized-degraded operation, runtime-receipt source, and accepted result
adapter. Bind that complete selection into every prepared request and receipt.
Reject missing or unsupported selections, later product-configuration rereads,
direct launcher substitution, and any request, launcher, reviewer, receipt, or
result mismatch.

For Codex, JSONL stdout is untrusted transport input, not review evidence. A
fixed installed-runtime host adapter launches only the sealed Codex executable
and argument vector, keeps stdout separate from drained and discarded stderr,
and incrementally enforces `codex-jsonl-final-agent-v1`. It accepts exactly one
thread start, one turn start, allowlisted item events, exactly one
`turn.completed`, and then end-of-stream. The sole candidate is the last
completed `agent_message` before that terminal event; an earlier schema-valid
message is never final merely because it parses. Reject malformed, unknown,
failed, incomplete, duplicate, post-terminal, or over-bound streams. Initial
fixed bounds are 16 MiB for the stream, 2 MiB per line, 100,000 events, and 1
MiB for the final candidate.

After validating the selected payload, the host—not Codex—creates the findings
artifact and metadata-only receipt. Publish each through a same-directory
temporary regular file and atomic same-filesystem hard link as the no-clobber
commit point, then verify file identity and content. Existing or concurrently
created destinations, symlinks, unsupported publication semantics, receipt
loss, or cleanup failure return typed unavailable and never overwrite a file.
The parent accepts only that inspected host-owned findings artifact with its
matching safe receipt; it never accepts JSONL, stderr, a combined shell-tool
transcript, reasoning, tool output, or a repository-written file as findings.

At most one fresh transport-only retry is allowed, and only when an otherwise
supported stream lacks a final completed agent message or lacks
`turn.completed`, exact-owned cleanup succeeded, and package, identities,
authorization, and expiry remain current. Preserve the first attempt in the
lineage. Never retry malformed, ambiguous, over-bound, schema-invalid,
identity-mismatched, write-unsafe, expired, repeated, or cleanup-incomplete
failures, and do not consume or reset an objective-correction budget.

### Outer-sandbox launcher recovery

If the managed implementation sandbox denies the nested Codex app-server or
sandbox, that denial describes the parent nesting boundary, not the child
reviewer's isolation capability. Before recording durable strict
unavailability, prepare a direct parent strict request with
`buildCodexParentStrictReviewToolRequest`. The request binds the exact package,
configured distinct reviewer, attestation, neutral working directory,
canonical host-owned Codex executable identity and content hash from a fixed
platform install location, an OS-backed signer or root-owned non-writable path
policy, fixed arguments, start/expiry, capture contract, result, and receipt.
Managed-sandbox
write denial is defense in depth, not host-ownership proof. Caller-selected
executable paths are ineligible. Invoke the returned argument vector only
through the
actual shell tool with `require_escalated`; never run repository code with that
authority. The child still uses the sealed read-only permission profile, no
command network, no inherited command environment, and ephemeral execution.
Accept it only through `consumeCodexParentStrictReviewToolResult`, which
rechecks the request digest, executable identity, expiration, host-created
artifact and receipt, canonical package/result bindings, and owned cleanup. The
parent seals the findings into `strict-isolated` evidence; reviewer
self-attestation alone is never trusted.

If the managed implementation sandbox denies owned worktree creation, the
direct parent strict transport, or Claude's strict sandbox, record the
applicable stable unavailable code. A package-only same-session retry is not
an acceptable substitute. The typed Codex parent result-artifact outcome
`review-launcher-codex-result-artifact-missing` is also eligible for the
Codex launcher only when the active `strict-first-degraded` authorization and
every exact package, identity, expiration, runtime, and lifecycle binding
validate. Only after such strict unavailability is durable may the runner invoke the configured
`codex-detached-read-only-v1` or `claude-detached-restricted-v1` launcher when
the current change, transition, base, head, manifest, expiration, degraded
authorization, launcher ID, runtime permission, and non-empty distinct
implementer/reviewer identities all match. The implementer identity is sealed
into the digest-bound request; missing identity or self-review fails before
view creation and is rechecked before response acceptance.

Detached-worktree recovery also requires its own exact lifecycle record. It
binds the canonical repository, base/head/manifest, change and transition,
expiry, and parent request digest. The host receives no destination or arbitrary
Git arguments: it creates a runtime-owned temporary root, verifies the detached
head, and returns request-bound safe JSON diagnostics. Cleanup requires the
matching ownership marker and lifecycle digest; expiration never broadens
authority, though it may still remove an already-owned view before returning
unavailable evidence.

The in-sandbox recovery controller validates authorization and emits only a
digest-bound structured host request. It can safely materialize an exact-head
archive in an owned temporary root but cannot invoke the reviewer across the
parent boundary. Production orchestration immediately consumes that
intermediate state through one configured parent-runtime transport. The Codex
transport writes the validated request to an exclusively created runtime-owned
file, rejects non-regular tree entries, materializes and package-validates the
exact-head archive, and builds only a host-owned environment/reviewer
invocation. It asks the shell tool for `require_escalated` execution and never
executes repository-controlled code with parent authority. Under an
interactive approval policy with Auto-review configured, the runtime's
separate approval reviewer evaluates that boundary request without owner
mediation. A denied or unavailable transport returns terminal evidence; it
never prints a command for an operator. The approved runtime invokes the
configured host-owned reviewer executable against the sandbox-prepared
archive. The controller has already reconstructed the exact base-to-head diff
and every declared artifact hash from Git objects, rejected any canonical
package mismatch, and exclusively created the bounded capsule's directories,
index, and chunks so a pre-existing file, directory, or symlink fails closed.
The transport starts either a fresh
ephemeral Codex process with `read-only` requested or a fresh nonpersistent
Claude process exposing only read/search tools. It accepts no arbitrary shell
text. The fixed strict Codex prompt requires one short non-findings progress
message before its first inspection tool call so the last-agent rule is
continuously exercised; only the later validated final message can become the
host-owned artifact. Every adapter probe
and strict or degraded reviewer subprocess receives only allowlisted
cross-platform operational environment variables and fixed adapter overrides,
not the caller's ambient credential values or process-injection variables.
Codex retains only isolated authentication state needed by its parent CLI,
while a strict-config OS permission profile limits model-generated commands to
minimal runtime paths and the archived workspace, disables tool network
access, and inherits no parent environment. Claude uses an empty launcher-owned
temporary home and isolated config/cache/data paths, declares its allowed tools
explicitly as read/search-only, denies Bash, receives no ambient secret
variables, and classifies an installed-runtime login refusal as authentication
unavailability.
The in-sandbox controller seals the request-bound normalized response and
removes only its ownership-guarded view after the tool result returns.

The controller accepts the response only when the directly captured runtime
receipt identifies the configured launcher, host script, request digest, host
execution, selected adapter, installed helper, and outside-managed-sandbox
boundary. In authorized degraded mode,
that receipt and the executable path are caller-readable ordinary data: they
are not cryptographically authenticated or host-pinned and cannot prove the
boundary against an adversarial implementation process. The executable path is
restricted to the expected `codex`/`codex.exe` or `claude`/`claude.exe`
basename, but a substituted executable can impersonate that name. This known
risk must be explicitly accepted and must never be described as strict or
security-verified. Preparation may use the controller's current time, but the
sealed host request carries no caller-selected clock: host execution and
controller acceptance each recheck expiration against their own current clock.
The parent-launch receipt and inner reviewer controls are
recorded separately. The receipt names its real transport source and never uses
a misleading trusted-runtime attestation. If permission, configuration, runtime receipt,
detached setup, inner startup, result validation, or cleanup fails, return the
stable terminal unavailable code and pause without a manual fallback.

For strict Codex or Claude subprocess failure after view creation, retain a
safe reviewer-process diagnostic with stage, operation, stable code, category,
subject, and optional numeric exit code. Classify only allowlisted
authentication, sandbox/permission, network, and output-contract failures;
discard subprocess output, command arguments, paths, and environment values.

## Authorized Degraded Path

Strict isolation remains the default. Only after a strict adapter creates a
durable unavailable result for the same base, head, and manifest may an active
bounded authorization permit `fresh-separated-reviewer-only` fallback for that
one delivery transition. The fallback receives only the sealed package and an
owned detached committed view, has no implementation-session history or desired
conclusion, and reports enforced, unavailable, and instruction-constrained
controls. It is never called strict-isolated; missing freshness, sealed input,
detached view, non-mutation boundary, authorization, or expiration returns
`unavailable`.

For the Codex launcher, the named owned-result-artifact failure above remains a
strict unavailable precursor, not review evidence. A successful fallback
retains it and is labelled `authorized-degraded`; it cannot satisfy a
`strict-only` delivery or be relabelled as strict isolation.

## Feedback and Recovery

Keep reviewer findings immutable. Store an evidence-backed implementer
disposition separately. Severity and disposition are independent: severity
describes impact, while `human-decision` identifies a finding that requires
human judgment. A high-severity objective fix does not require a conversational
pause when it is in scope, behavior-preserving, evidence-backed, and within the
per-signature correction limit. A changed head invalidates every previous
passing result, so rerun affected checks, rebuild the package, and invoke a
fresh reviewer.

Preserve the implementation branch and evidence after any failure. Record one
stable unavailable/validation code, clean only the owned temporary view, and
resume from durable Git/OpenSpec/checkpoint state. Never substitute self-review
or a regular pull-request review for this protocol.
An objective finding or changed head automatically reruns affected validation,
rebuilds the package, retries strict review, invokes eligible parent recovery,
and dispositions the fresh result inside the per-signature budget; it does not
wait for the owner to retrigger review.

`correctionAttempts` is the total count of objective corrections already
present in the durable correction chain and exists to validate chain ordering.
A derived review package is eligible only when that count equals the complete
chain length and its latest attempt number. The correction limit is evaluated
separately by immutable `failureSignature`; unrelated signatures do not consume
one another's three-attempt budget.

## Bootstrap Review Boundary

A change that modifies the Codex capture or durable dispatch trust boundary
must not use that candidate code to certify itself. Each separately
owner-authorized bootstrap attempt binds the exact base, head, package manifest,
delivery transition, `strict-first-degraded` policy, expiry, authorization
reference and scope digest, installed N-1 runtime generation and content digest,
Claude launcher executable digest and capability probe, distinct implementer
and exact reviewer identities, selected Claude adapter binding, and one
prepared exact-owned worktree lifecycle request. Validate that binding before
launch and match it again to the runtime receipt and accepted result. A
`strict-first-degraded` sequence uses a separate exact binding and fresh
lifecycle for each attempt; degraded review remains eligible only after durable
strict unavailability under the same package and active authorization.

Accepted bootstrap evidence must identify the N-1 runtime and Claude transport
and must explicitly exclude the candidate Codex capture path. If the bound
Claude path, exact cleanup, authentication, package, identity, or expiry cannot
be validated, preserve the work and pause. Do not fall back to candidate Codex,
self-review, transcript parsing, or an unbound launcher.
