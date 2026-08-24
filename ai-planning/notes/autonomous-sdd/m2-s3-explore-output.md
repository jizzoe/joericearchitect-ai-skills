# M2-S3 Explore Output — Run Status and Recovery

Date: 2026-08-24
Change: `add-autonomous-sdd-run-status-and-recovery`
Workflow action: OpenSpec Explore (planning-only; no OpenSpec artifacts created).

## Selected design

A read-only, repository-wide status projection over the M2-S2 durable backend.
Discovery is by canonical repository identity plus the selected backend, never
the caller's current directory. Status is a versioned projection (`run-status`,
schemaVersion 1) reporting run/work-unit identity, classification, typed stop
reason, claim/owner, deadline, and linked (never inlined) evidence. Resume
returns exactly one of safe-resume, no-op, or typed pause. Projection rebuild is
read-only with respect to authoritative history.

## Scope

- Discovery (active plus archived runs by canonical identity).
- Versioned status projection (no secrets).
- Typed classifications: running, complete, expired, waiting-human,
  retryable-infrastructure, quality-blocked, configuration-discovery-gap,
  ambiguous-legacy-state.
- Safe resume / no-op / typed pause.
- Projection rebuild (read-only with respect to history).

Non-goals: mutation, cleanup, claim takeover without permission, or lifecycle
policy changes.

## Dependencies

- M2-S1 (transitions/attempt state) — delivered.
- M2-S2 (durable history/backend) — delivered 2026-08-24.

## Open question resolutions

### Q1 — Stable CLI/API status shape and compatibility versioning policy

Status is a versioned machine-readable record with `kind: "run-status"` and
`schemaVersion: 1`. The version is the compatibility contract: a reader that does
not recognize the version treats the status as ambiguous and fails closed rather
than guessing. The human-readable view is derived from the same machine record,
never a separate source.

### Q2 — Evidence detail summarized versus linked by reference

Status summarizes only classification, identity, revision, and stop reason; it
never inlines evidence or secrets. Evidence is linked by digest plus
repository-relative reference and resolved only by the reader on demand.

## Authorization

The owner authorized this slice in the current session (2026-08-24) and
requested delivery in autonomous prototype mode.
