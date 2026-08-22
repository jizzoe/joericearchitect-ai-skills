# Objective correction: tracking path completeness

Recorded: 2026-08-22

- Failure signature: `tracking-path-scope-incomplete`
- Attempt: 1 of 3
- Source: verification review of normalized `tracking.yaml` output against the
  current changed-path set
- Finding: the tracking record omitted
  `scripts/sdd/autonomous-sdd-admission.mjs` and
  `scripts/sdd/autonomous-sdd-controller.mjs`.
- Correction: added only those two implementation paths and sorted the nearby
  runtime test entry.
- Behavior impact: none; this corrects lifecycle linkage metadata only.
- Required rerun: tracking validation, diff scope review, and strict OpenSpec
  validation.
