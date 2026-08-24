## Context

The durable backend primitives already exist (M1 plus bootstrap recovery):
`autonomous-sdd-local-store.mjs` (immutable publication, claim, takeover,
archive, projection/index, provider capability), `autonomous-sdd-run-contract.mjs`
(record schemas including `cancellation-receipt`), `autonomous-sdd-admission.mjs`
(admission plus terminal compatibility), `autonomous-sdd-controller.mjs` (v2
controller), and `autonomous-sdd-legacy.mjs` (inventory). This slice does not
rebuild those; it completes the one missing behavior (cancellation-as-terminal)
and formalizes the backend as one capability with fail-closed acceptance
evidence. Delivery is the pre-v2/interactive lane; the v2 controller is not
activated.

## Goals / Non-Goals

**Goals:**

- Recognize a cancelled controller (cancellation-receipt bundle) as terminal
  during initialization.
- Formalize the backend's storage, history, projection, ownership, claim,
  takeover, discovery, and legacy-inventory invariants.
- Prove the acceptance evidence with focused tests.

**Non-Goals:**

- Daemons, queues, distributed workers, generalized timers, arbitrary workflows,
  Temporal, real lifecycle adapters, or real ownership activation.

## Decisions

### D1 — Storage and locking substrate (Node 20.19)

Node built-in `node:fs`/`node:path`/`node:os`/`node:crypto` with advisory file
locking (POSIX advisory lock, Windows `LockFileEx`). No npm dependency, so Node
20.19 compatibility is met directly. The provider-capability validator rejects
weaker lock fallbacks.

Alternative: a database or an external durable engine was rejected — out of scope
and gated behind the complexity tripwire.

### D2 — Same-host liveness, stale-owner proof, and takeover

One host and one canonical repository claim cover the v1 threat model.
Stale-owner proof is the ownership generation fence (`assertOwnershipGeneration`).
Takeover is operator-directed and conclusive (`takeOverRepositoryClaim` requires
`operatorDirected`, `ownerAbsent`, `observedAt`, and no unreconciled `in-doubt`
attempts).

Alternative: a distributed lease/CAS protocol was rejected (no distributed
multi-writer need).

### D3 — Filesystem classes at admission

Local filesystem under the configured state home. Symbolic-link escapes and
paths outside archive/repository containment are rejected via `realpathSync`
canonicalization and containment checks. Non-local filesystems are rejected by
the provider-capability gate.

Alternative: accepting arbitrary paths was rejected (unsafe).

### D4 — Cancellation-receipt is terminal

Generalize `validTerminalV2Controller` to accept exactly one of a
`terminalization-receipt` or a `cancellation-receipt` bundle. A terminalization
bundle still requires the terminal-looking checkpoint (`currentPhase` null, all
steps complete); a cancellation bundle instead requires the receipt's
`controllerRunId` and `expiresAt` to match the controller, with the checkpoint
left at its cancelled phase (never hand-edited).

Alternative: hand-editing the checkpoint or a bespoke retirement record was
rejected (guardrails forbid hand-editing; recognition is cleaner and read-only).

### D5 — Delivery lane and complexity tripwire

Delivered by the pre-v2/interactive lifecycle (runtime N-1 delivers N). The
change is small and additive; the ~1,000–1,200 line complexity tripwire is a
tripwire only, not a test target.

## Risks / Trade-offs

- [Accidentally recognizing an active controller as terminal] → the cancellation
  branch requires the cancellation-receipt's exact `controllerRunId`/`expiresAt`
  binding plus the full mutual-identity/digest checks; a foreign or mismatched
  archive remains ambiguous.
- [Rebuilding Temporal or high-availability features] → out of scope; guarded by
  the tripwire.
- [Activating real ownership] → the result stays contract-only/audit.

## Migration Plan

No migration. The stranded `controller-cf2ecbc…` checkpoint is retired by
recognition on the next admission, never by hand-editing. Rollback removes the
compatibility branch and the new tests without touching existing records.

## Open Questions

None. The four brief open questions are resolved: Q1 substrate = D1, Q2
liveness/takeover = D2, Q3 filesystem classes = D3, Q4 cancellation-as-terminal
= D4.
