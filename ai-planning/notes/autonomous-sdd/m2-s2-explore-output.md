# M2-S2 Explore Output — Local Durable Execution Backend

Date: 2026-08-24
Change: `add-autonomous-sdd-local-execution-backend`
Workflow action: OpenSpec Explore (planning-only; no OpenSpec artifacts created).

## Selected design

Build the smallest local, single-writer durable execution backend, scoped by the
M2-S1 vertical slice's transition set and record shapes, and by the backend
foundations already proven in M1 plus the bootstrap/cutover recovery. The
backend is a swappable durability layer over Node's built-in `fs` with advisory
file locking — no external dependency. It stays contract-only/audit and never
activates real lifecycle ownership. Delivery runs in the pre-v2/interactive
lane (runtime N-1 delivers N), never by the controller this slice builds.

## Scope

- Local storage (single host, local filesystem, state home outside worktrees).
- Authoritative history (append-only, immutable records).
- Projection (rebuildable index/status derived from history).
- Ownership (owner identity plus a generation fence).
- One coarse claim (repository-wide single-writer lock).
- Takeover (operator-directed, conclusive stale-owner proof).
- Discovery (by canonical repository identity, never the current directory).
- Legacy inventory (recognize; leave ambiguous state untouched).

Non-goals: daemons, queues, distributed workers, generalized timers, arbitrary
workflows, Temporal, and real lifecycle adapters.

## Dependencies

- Delivered M1 slices (run/work-unit/operation contracts, config provenance).
- Accepted bootstrap/cutover stabilization (Archived).
- M2-S1 vertical slice (transition set and record shapes; delivered 2026-08-24).

## Open question resolutions

### Q1 — Smallest storage and locking substrate (Node 20.19)

Node built-in `node:fs`, `node:path`, `node:os`, and `node:crypto`, with advisory
file locking. POSIX uses advisory locks, Windows uses `LockFileEx`; no npm
dependency, so Node 20.19 compatibility is met directly. The provider-capability
validator (`validateProviderCapabilities` in `autonomous-sdd-local-store.mjs`)
already requires `platforms.posix === "advisory-lock"`,
`platforms.windows === "LockFileEx"`, plus `generationFence`,
`explicitTakeover`, `durableWrite`, and `directoryMetadataDurability`; weaker
fallbacks are rejected.

### Q2 — Same-host liveness, stale-owner proof, and explicit takeover

Liveness is same-host only: one host and one canonical repository claim cover the
v1 threat model. Stale-owner proof is the ownership generation fence — every
write verifies the current generation and a stale generation fails closed
(`assertOwnershipGeneration` returns `ownership-generation-stale`). Takeover is
operator-directed and conclusive: `takeOverRepositoryClaim` requires
`{ operatorDirected: true, ownerAbsent: true, observedAt }` with no unreconciled
`in-doubt` attempts; otherwise it returns `takeover-proof-inconclusive` or
`takeover-attempt-reconciliation-required`.

### Q3 — Filesystem classes supported or rejected at admission

Admission supports a local filesystem under the configured state home
(`XDG_STATE_HOME` or `~/.local/state/ai-skills/autonomous-sdd`). It rejects
symbolic-link escapes and paths outside repository/archive containment (the
`realpathSync` canonicalization plus `contained()` checks already guard archive
traversal and the initializer's own-checkpoint exclusion). Non-local filesystems
(network mounts, virtual/overlay filesystems without advisory-lock or
directory-metadata durability) are rejected by the provider-capability gate
rather than silently accepted.

### Q4 — Recognize a `cancellation-receipt` as terminal

Extend terminal v2-controller compatibility in
`autonomous-sdd-admission.mjs` (`validTerminalV2Controller`) to accept a
cancelled terminal bundle — `cancellation-receipt` plus `claim-release`
(released disposition with a cancellation-receipt digest reference) plus
`projection` — as terminal alongside the existing terminalization-receipt
bundle. This retires the 2026-08-23 bootstrap recovery's `controller-cf2ecbc…`
schema-5 checkpoint (left at `propose`) so it no longer pauses future v2
admission, without hand-editing the checkpoint.

## Risks

- Rebuilding Temporal or high-availability features (guarded by the ~1,000–1,200
  line complexity tripwire; crossing it returns to owner build-vs-adopt review).
- Activating real ownership before M4-S4 (guarded: contract-only/audit).

## Authorization

The owner authorized this slice in the current session (2026-08-24) and
requested delivery in autonomous prototype mode via `ship-sdd
add-autonomous-sdd-local-execution-backend prototype`. The slice remains
contract-only/audit and is delivered by the pre-v2/interactive lane.
