## Why

The M2-S1 vertical slice proves its review step with a thin sealed loop backed
by simulated adapters; it never demonstrates that a real multi-step strict
reviewer delivers the required terminal artifact. A genuine multi-step strict
review can finish its read-only inspection and exit `0` without producing the
parent-owned result file, so a consumer cannot distinguish a completed review
from a missing terminal event. Transcripts, stdout, and claimed success are not
reliable acceptance evidence and must never substitute for the artifact.

## What Changes

- Harden the strict review transport so every strict review returns exactly one
  parent-owned schema-valid terminal artifact, or typed unavailable evidence.
- The parent creates a sealed immutable review package and owns the only
  writable terminal-result destination; a fixed host adapter launches a fresh
  read-only reviewer and captures its lifecycle independently of the transcript.
- Terminalize deterministically exactly once across success, failure, timeout,
  and crash; process exit before or after result creation yields one
  deterministic terminal record, never duplicate or conflicting results.
- Accept a result only when it validates schema, package digest, base/head
  commits, assurance, reviewer identity, and terminal status. Reject
  transcript-only and wrong-package results.
- Clean temporary resources exactly, or retain an actionable recovery record.
- Upgrade the vertical slice's thin review loop to route through this strict
  host-captured transport for the production profile, while prototype keeps its
  same-session-local path.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `isolated-independent-review`: Adds deterministic host-captured terminal
  artifact delivery — exactly-once terminalization, the parent-owned schema-valid
  terminal artifact as the only acceptance evidence, transcript and wrong-package
  rejection, and cleanup-or-recovery-record guarantees.
- `autonomous-sdd-vertical-slice`: Upgrades the thin sealed review loop to strict
  host-captured artifact delivery so the production review step requires the
  parent-owned schema-valid terminal artifact.

## Impact

- Affected assets: `scripts/sdd/review-launcher-host.mjs`,
  `scripts/sdd/review-launcher-recovery.mjs`,
  `scripts/sdd/platform-review-adapters.mjs`, the review-step wiring in
  `scripts/sdd/autonomous-sdd-vertical-slice.mjs`, and focused tests plus live
  probes. No controller record, claim, archive, or GitHub mutation path changes.
- Compatibility: composes the M1 operation/run contracts and the M2-S1 vertical
  slice; reuses the existing strict transport primitives without changing their
  sealed read-only boundary.
- Migration: none. The slice is additive and delivered by the pre-v2/interactive
  lifecycle; the v2 controller stays contract-only/audit.
- Reuse plan: product-neutral strict transport stays assistant-neutral under
  `scripts/sdd/`; no product-specific repository or credential values are added.

- Planning boundary: this proposal creates no implementation authority and does
  not activate the v2 controller, real ownership, or production Apply.
