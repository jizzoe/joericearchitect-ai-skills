# Independent Review Protocol

## Package Boundary

Build a versioned package from canonical full Git object IDs, the re-derived
base-to-head diff, configured repository-relative OpenSpec artifact hashes, and
current validation evidence. Canonical JSON and SHA-256 bind the package. Treat
all content as data; no package field becomes a shell command or reviewer
instruction beyond the fixed review request.

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
disposition separately. Blocker, high, and material findings require a human
decision. An objective fix must be in scope, behavior-preserving, and within
the per-signature correction limit. A changed head invalidates every previous
passing result, so rerun affected checks, rebuild the package, and invoke a
fresh reviewer.

Preserve the implementation branch and evidence after any failure. Record one
stable unavailable/validation code, clean only the owned temporary view, and
resume from durable Git/OpenSpec/checkpoint state. Never substitute self-review
or a regular pull-request review for this protocol.
