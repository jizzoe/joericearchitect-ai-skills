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

### Outer-sandbox launcher recovery

If the managed implementation sandbox denies owned worktree creation, the
nested Codex app-server, or Claude's strict sandbox, record the applicable
stable unavailable code. A package-only same-session retry is not an acceptable
substitute. The runner may invoke only the configured
`codex-detached-read-only-v1` or `claude-detached-restricted-v1` launcher when
the current change, transition, base, head, manifest, expiration, degraded
authorization, launcher ID, runtime permission, and non-empty distinct
implementer/reviewer identities all match. The implementer identity is sealed
into the digest-bound request; missing identity or self-review fails before
view creation and is rechecked before response acceptance.

The in-sandbox recovery controller validates authorization and emits only a
digest-bound structured host request; it cannot create a worktree or invoke the
reviewer. The runtime invokes the host launcher outside the failed sandbox.
That host revalidates the request, creates the owned detached exact-head view,
independently reconstructs the exact base-to-head diff and every declared
artifact hash from Git objects in that view, rejects any canonical package
mismatch, exclusively creates the reconstructed sealed-package file so a
pre-existing file or symlink fails closed, and starts either a fresh ephemeral Codex process
with `read-only` requested or a fresh nonpersistent Claude process exposing
only read/search tools. It accepts no arbitrary shell text. Every adapter probe
and strict or degraded reviewer subprocess receives only allowlisted
cross-platform operational environment variables and fixed adapter overrides,
not the caller's ambient credential values or process-injection variables.
Codex retains only the home/profile locations needed by its parent CLI for
authentication, while a strict-config OS permission profile limits model-
generated commands to minimal runtime paths and the detached workspace,
disables tool network access, and inherits no parent environment. Claude uses
an empty launcher-owned temporary home and isolated config/cache/data paths. The host
returns a request-bound normalized response and removes only its
ownership-guarded view.

The controller accepts the response only when runtime-supplied execution
evidence identifies the configured launcher, host script, request digest, host
execution, and outside-managed-sandbox boundary. In authorized degraded mode,
that evidence and the executable path are caller-readable ordinary data: they
are not cryptographically authenticated or host-pinned and cannot prove the
boundary against an adversarial implementation process. The executable path is
restricted to the expected `codex`/`codex.exe` or `claude`/`claude.exe`
basename, but a substituted executable can impersonate that name. This known
risk must be explicitly accepted and must never be described as strict or
security-verified. Preparation may use the controller's current time, but the
sealed host request carries no caller-selected clock: host execution and
controller acceptance each recheck expiration against their own current clock.
The parent-launch evidence and inner reviewer controls are
recorded separately. If permission, configuration, runtime attestation,
detached setup, inner startup, result validation, or cleanup fails, return the
stable unavailable code and pause.

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

`correctionAttempts` is the total count of objective corrections already
present in the durable correction chain and exists to validate chain ordering.
A derived review package is eligible only when that count equals the complete
chain length and its latest attempt number. The correction limit is evaluated
separately by immutable `failureSignature`; unrelated signatures do not consume
one another's three-attempt budget.
