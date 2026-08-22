# Initial bounded local review

Recorded: 2026-08-22

- Assurance: `local-review`
- Execution: same session, read-only, non-independent, cannot mutate or approve
- Reviewed scope: every changed implementation, test, documentation, tracking,
  OpenSpec, and evidence path
- Finding ID: `direct-admission-exclusion-bypass`
- Severity: high
- Disposition: objective-fix
- Subject: `scripts/sdd/autonomous-sdd-admission.mjs`
- Evidence: the accepted direct-caller scenario prohibited caller-nominated
  exclusions, while the exported `admitV2Run` destructured and honored the
  real `legacyInventoryExclusions` field. The runtime wrapper stripped the
  field, but direct module callers could still suppress an active or ambiguous
  candidate.
- Recommendation: keep exported raw admission exclusion-free and route the
  initializer through a separate entrypoint that validates the exact persisted
  schema-5 checkpoint, its derived contained path, authorization digest, and
  parent/work-unit/claim identities before invoking the private inventory
  exclusion.
- Correction budget: attempt 1 of 3 for
  `direct-admission-exclusion-bypass`

No material design decision is needed: the accepted delta and design already
require this boundary. The review conclusion is stale after correction and a
fresh full-scope local review is required.
