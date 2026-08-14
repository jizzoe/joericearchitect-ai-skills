# Reviewer Environment Correction Evidence

## Finding and authorization

- Failure signature:
  `independent-review/high/strict-review-inherits-credentials/merge-pr`
- Finding ID: `strict-review-inherits-credentials`
- Severity: `high`
- Review record:
  `degraded-aff3c901-b84c-48fd-9cf4-4c33372fe662`
- Reviewed head: `517852fa79ac692f88f3f36c6feb1c121d3465a2`
- Reviewed manifest:
  `1e2cf9d1b8b92dcbe51d7400adab3334ae276a9adfb2ee981b821908c5189374`
- Authorized at: `2026-08-13T17:53:22Z`
- Authorization: the owner authorized a behavior-preserving correction,
  affected checks, a commit, and a fresh exact-head strict-first review while
  retaining the existing scope, accepted risks, expiration, correction limits,
  and safety controls.

## Evidence-backed disposition

Disposition: `objective-fix`.

The shared reviewer launcher previously merged the entire implementer process
environment into every strict and degraded Codex or Claude reviewer. Emptying a
short list of known credential names did not prevent an unlisted credential or
process-injection option from crossing the reviewer boundary.

The correction constructs each probe and reviewer environment from a closed,
cross-platform allowlist of operational variables plus fixed adapter-owned
overrides. Ambient OpenAI, Anthropic, synthetic credential, and `NODE_OPTIONS`
values are absent. The same shared launcher applies this behavior to strict and
degraded Codex and Claude transports, and the canonical protocol documents the
boundary. No authorization, assurance, finding, transition, or delivery
behavior changed.

## Correction budget and exact-head rule

- Overall correction chain: attempt 2 of the authorized maximum 3.
- Attempts for this failure signature: 1 of 3.
- Behavior-preserving: yes.
- Current: yes, once included in the corrected commit.
- Ancestry: the corrected commit is a descendant of the reviewed head above.
- Fresh review: required for the corrected commit and its newly sealed
  manifest; the prior review cannot authorize a transition.

## Verification

- `node --test scripts/sdd/test/platform-review-adapters.test.mjs` — 14 passed,
  including all four strict/degraded Codex/Claude transports with an unlisted
  synthetic credential and provider credential variables.
- `node --test` — 200 passed.
- `node scripts/sdd/check-adapter-drift.mjs` — passed.
- `node scripts/validation/validate-skill-metadata.mjs` — passed.
- `node scripts/validation/validate-shared-guardrails.mjs` — passed.
- `node scripts/validation/validate-openspec-artifacts.mjs
  openspec/changes/add-authorized-degraded-independent-review` — passed.
- `openspec validate add-authorized-degraded-independent-review --strict` —
  passed.
- `openspec validate --all --strict` — 22 passed, 0 failed.
- `git diff --check` — passed.

The accepted degraded-review risks `IR-001` and `IR-002` remain accepted-risk
dispositions and are neither affected nor described as resolved by this
correction.
