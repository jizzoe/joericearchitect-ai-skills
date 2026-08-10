## Context

The SDD foundation now includes intake, quality rules, tracking, GitHub/OpenSpec
lifecycle sync, PR linkage, Project status audit, and dependency-aware work
selection. M7-C1 verifies the combined behavior and records remaining
limitations.

## Goals / Non-Goals

Goals:

- Demonstrate living specs exist for all delivered foundation capabilities.
- Verify workflow permissions and PR trust boundaries.
- Verify canonical Claude/Codex skill exposure.
- Verify dependency-aware selection remains covered.
- Document operation, recovery, token rotation, and OpenSpec maintenance.
- Verify reusable assets do not contain bookkeeping fixture constants.

Non-goals:

- No required-check promotion without explicit approval.
- No secret rotation.
- No live destructive cleanup.
- No unrelated repository mutation.

## Decisions

### DEC-001: Use non-mutating baseline verification

M7-C1 adds local evals and documentation rather than live mutation tests.

Rationale: prior milestones already used verified PR delivery. Final hardening
should avoid extra live disposable records unless a specific gap requires them.

### DEC-002: Keep product fixture isolated

The bookkeeping fixture lives under `evals/fixtures/products/` and tests ensure
global reusable assets do not reference it.

Rationale: portability depends on keeping product-specific constants out of
global skills, scripts, specs, and docs.

### DEC-003: Required checks remain advisory

M7-C1 documents the branch-protection promotion as requiring separate user
approval.

Rationale: changing required repository checks is a governance decision.

## Affected Files and Interfaces

- `AGENTS.md`
- `THIRD_PARTY_NOTICES.md`
- `docs/sdd-foundation-operations.md`
- `evals/workflows/sdd-foundation/foundation-baseline.test.mjs`
- `evals/fixtures/products/mobile-bookkeeping-multi-repo/product.json`
- `openspec/changes/verify-sdd-foundation/tracking.yaml`

## Verification Strategy

- Run OpenSpec strict validation.
- Run artifact-quality and tracking validation for this change.
- Run foundation baseline tests.
- Run the full focused repository suite.
- Review workflow permissions, security posture, and canonical skill exposure.
- Verify active change list is empty after archive.

## Attribution and Licensing

M7-C1 adds repository-authored Markdown, JSON, and dependency-free Node.js test
code. Referenced GitHub Actions are listed in `THIRD_PARTY_NOTICES.md`; no
third-party source is vendored.

## Recovery

- Re-run baseline tests after documentation or fixture updates.
- If OpenSpec or tracking validation fails, repair the active change before
  delivery.
- If a workflow trust-boundary regression appears, block delivery until the
  workflow avoids secrets and write permissions.
- If required-check promotion is desired, create a separate approved change.

## Reuse Plan

- Canonical verification: evals and docs.
- Product fixture: isolated under `evals/fixtures/products/`.
- Agent guidance: `AGENTS.md` points agents to canonical SDD docs and checks.
- Portability: tests scan global reusable assets for fixture constants.
