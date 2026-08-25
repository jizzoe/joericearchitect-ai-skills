# Verification — GitHub Intake and Implementation Delivery

## Change

`integrate-autonomous-sdd-github-delivery` (M4-S1)

## Implementation

- `scripts/sdd/autonomous-sdd-github-envelope.mjs` — non-secret,
  authorization-bound host-operation envelope, result receipt, and controller
  advance revalidation.
- `scripts/sdd/autonomous-sdd-github-transitions.mjs` — field-level ownership
  scopes, exact idempotent adapter plans, and observe-before-retry
  reconciliation.
- `scripts/sdd/autonomous-sdd-github-merge-policy.mjs` — merge-policy preflight
  and exact-head branch-retention restoration.

## Test results

- Focused suite `scripts/sdd/test/autonomous-sdd-github-delivery.test.mjs`:
  12/12 pass.
- Full `scripts/sdd/test` + `scripts/github/test` suites: 324 pass, 0 fail, 0
  skipped.

## Strict validation

`openspec validate --all --strict`: 44 passed, 0 failed.

## Acceptance evidence mapping

- Non-secret envelope, receipt match/mismatch, advance vs. reconcile vs.
  in-doubt vs. paused: covered by envelope and advance-revalidation tests.
- Exact idempotent adapters, duplicate reuse, wrong-target rejection: covered by
  issue/branch/PR/head/status tests.
- Ownership-scope preservation of human fields: covered by the ownership-scope
  tests.
- Observe-before-retry convergence without a duplicate: covered by the
  reconcile tests.
- Merge preflight, exact-head branch retention without force, retention receipt:
  covered by the merge-policy tests.
- Credential-free history: the envelope and transition digests carry no
  credential field, and tests assert no token/credential keys.

## Fixture strategy

Two-token strategy (fine-grained repo-scoped PAT + classic `project`-only PAT)
and the disposable fixture Project "sdd-fixture" were proven live on 2026-08-24
(403 on `hooks`/`collaborators` against the real repo; 404/no-`repo`-scope on the
classic token). See `ai-planning/notes/autonomous-sdd/m4-s1-explore-output.md`.
