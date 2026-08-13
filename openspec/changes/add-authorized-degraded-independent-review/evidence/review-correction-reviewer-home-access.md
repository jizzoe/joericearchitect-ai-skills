# Reviewer Home Access Correction Evidence

## Finding and authorization

- Failure signature:
  `independent-review/high/degraded-reviewer-home-credential-access/merge-pr`
- Reviewer finding ID: `IR-001` (the reviewer reused this identifier; this
  finding is distinct from the accepted degraded-evidence risk and the earlier
  package-rederivation finding).
- Severity: `high`
- Review record:
  `degraded-5e30a0b1-1c44-4930-b650-1cc034c252ed`
- Reviewed head: `df15a5b37557fc88ed4902f7642bb06d1e399cf0`
- Reviewed manifest:
  `d335b7a0581a035cbf7f0533fb2699fe9c1e3e70ca401f4496fa5daee865ddd6`
- Authorized at: `2026-08-13T19:25:14Z`
- Authorization: the owner authorized a behavior-preserving correction for
  degraded reviewer home credential access and correction-budget enforcement
  matching the original three-corrections-per-failure-signature profile. The
  owner also extended the unchanged delivery authorization to
  `2026-08-14T00:00:00Z`.

## Evidence-backed disposition

Disposition: `objective-fix`.

The shared environment allowlist removed provider tokens and arbitrary ambient
variables but retained user home/profile paths. A Codex command running under
the older broad-read `read-only` sandbox could therefore inspect files outside
the detached review view.

The correction uses Codex's strict-config OS permission profile instead of the
older broad-read sandbox mode. The parent Codex CLI retains only the platform
home/profile paths required to load its own cached authentication, while every
model-generated command receives no inherited parent environment, has read
access only to minimal runtime paths and the detached workspace, has no write
access, and has tool network disabled. No credential file is copied or seeded.
Claude receives an empty launcher-owned home with isolated config, cache, data,
and temp paths; if it cannot authenticate within that boundary, it fails closed.

The correction also aligns deterministic enforcement with the already
specified production-rapid policy: `correctionAttempts` remains the total
ordered chain length, but exhaustion is counted independently for each
immutable `failureSignature`. A fourth globally ordered correction for a new
signature is accepted; a fourth correction for one signature is rejected.

## Correction budget and exact-head rule

- Overall ordered correction chain: attempt 4.
- Attempts for this failure signature: 1 of 3.
- Behavior-preserving: yes.
- Current: yes, once included in the corrected commit.
- Ancestry: the corrected commit is a descendant of the reviewed head above.
- Fresh review: required for the corrected commit and newly sealed manifest;
  the prior review cannot authorize a transition.

## Verification

- `node --test` — 203 passed.
- Focused launcher, request, adapter, and lifecycle suite — 53 passed.
- Focused authorization, execution, and recovery suite — 15 passed.
- Codex `exec --strict-config` accepted the fixed inline permission profile
  keys for minimal runtime reads, detached workspace reads, disabled tool
  network, and no shell-environment inheritance.
- An isolated-home Codex authentication probe returned `Not logged in`, proving
  that the implementation must not silently substitute an empty home without a
  protected authentication channel; the selected permission-profile boundary
  avoids copying credential material.
- `node scripts/sdd/check-adapter-drift.mjs` — passed.
- `node scripts/validation/validate-skill-metadata.mjs` — passed.
- `node scripts/validation/validate-shared-guardrails.mjs` — passed.
- `node scripts/validation/validate-openspec-artifacts.mjs
  openspec/changes/add-authorized-degraded-independent-review` — passed.
- `openspec validate add-authorized-degraded-independent-review --strict` —
  passed.
- `openspec validate --all --strict` — 22 passed, 0 failed.
- `git diff --check` — passed.

The previously accepted degraded-review risks remain accepted-risk
dispositions. This correction does not claim that degraded review itself is
strict or security-verified.
