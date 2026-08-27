## Context

See [proposal.md](proposal.md). The canonical controller can derive an updated
record with phase evidence, but its installed entrypoint cannot persist that
update. Existing cancellation deliberately accepts only expired runs, leaving a
newly admitted but structurally blocked claim held until deadline.

## Goals / Non-Goals

**Goals:**

- Add a single durable phase-evidence transition to the installed controller.
- Permit narrowly bound early retirement only for an admitted blocked run.
- Preserve immutable history, exact identity checks, and normal expiry-based
  cancellation behavior.

**Non-Goals:**

- Add a generic checkpoint writer, arbitrary phase setter, or standing owner
  authority.
- Treat retirement as implementation delivery or repair unrelated stale runs.

## Decisions

### Phase evidence is controller-owned and first-incomplete only

Add a canonical transition that accepts the full durable record, the resolved
authorization/repository context, an exact named phase, and an exact evidence
object (`current`, matching `phase`, a non-secret `reference`, and one or more
relative artifact paths with SHA-256 digests). It validates every artifact as a
regular, non-symlinked, non-\`.git\` file beneath the target repository before it
derives and persists the update. Repeated identical evidence is idempotent; different
evidence for a completed phase is a conflict.

This is selected over exposing a generic record writer because every phase
advance must retain existing order, expiry, and context checks.

### Early retirement is a separate exact authorization

Add a second transition rather than weakening expired cancellation. Its input
contains a signed owner-approved, time-bounded binding for the exact controller,
admission identities, repository, selected change, and fixed blocked reason.
The transition verifies that no lifecycle delivery exists and that the named
installed transition is unavailable, then publishes cancellation/claim-release
history through the existing archival backend. The current controller is
updated or represented consistently enough that later legacy inventory cannot
mistake the archived cancelled run for active authority.

This is selected over waiting for expiry because the held claim itself prevents
the repair/retry path; it is selected over direct checkpoint editing because
that bypasses immutable identity and recovery evidence.

### Restore the intended product review adapter after the predecessor repair

The immediately preceding `repair-strict-review-terminal-event-capture` change
temporarily selected `claude-detached-restricted-v1` so that repair would not
certify its changed Codex capture transport with itself. That repair is now
merged, archived, and installed. This branch therefore intentionally restores
the product configuration to `codex-detached-read-only-v1`; the configuration
diff is a planned sequencing dependency, not an incidental controller change.
The controller implementation remains adapter-neutral, and the one-time N-1
Claude bootstrap used to review this repair does not become product
configuration or standing fallback authority.

### Test and exposure strategy

Update canonical controller tests and add installed-runtime tests exercising
real Git-common checkpoints and state-home records. Cover success, retry,
out-of-order phase, stale evidence, identity conflict, expired context,
missing/mismatched early authority, delivery-present rejection, and exact
claim release. Keep Claude/Codex wrappers thin; no credentials, repository
constants, or external mutation is embedded in reusable code.

## Risks / Trade-offs

- **Early retirement could release an active run incorrectly** → require an
  exact separate signed owner binding, verified with dispatcher-owned trust
  material, an active directory containing only exact admission records, and
  an unavailable transition check.
- **Evidence references could be forged** → require exact evidence shape and
  verify each phase-bound artifact's path and SHA-256 digest beneath the target
  repository.
- **Archive/controller disagreement could recur** → add regression coverage
  proving subsequent inventory classifies the retired controller as terminal.

## Migration Plan

1. Deliver this repair through a separately authorized bootstrap flow, not a
   second autonomous controller claim: the blocked run already holds the
   repository claim and a second admission must continue to fail closed.
2. Implement canonical transitions and installed entrypoint exposure with
   focused tests, then build and install the repaired runtime.
3. Resume the existing exact run. Its proposal phase advances through the new
   transition; it is not early-retired merely because the old runtime lacked
   that transition.
4. Use early retirement only for a future exact blocked run whose separately
   named required transition remains unavailable under its current installed
   runtime; do not use it to retire a run that can resume through this repair.
5. Run runtime build, strict validation, local review, and independent review
   before delivery. Rollback reverts the recovery change; no direct checkpoint
   edits are required or permitted.

## Reuse Plan

The transitions belong in assistant-neutral controller code and reuse existing
record persistence, cancellation, archival, and runtime-dispatch boundaries.
Products supply only exact authorization and repository identity as inputs. A
second synthetic repository will prove the behavior is portable; no external
code or attribution is introduced.
