# Host Package Rederivation Correction Evidence

## Finding and authorization

- Failure signature:
  `independent-review/high/degraded-host-package-not-rederived/merge-pr`
- Reviewer finding ID: `IR-001` (the reviewer reused this identifier; this
  finding is distinct from the previously accepted degraded-evidence risk).
- Severity: `high`
- Review record:
  `degraded-a6f19790-208e-42ba-8655-b04366c197cf`
- Reviewed head: `37af92279ee5e05a0da6e36223da702e50487ee4`
- Reviewed manifest:
  `c57f1b69d5cb83e6faf15115a60417492eda2cb872696cdcaec3909f56bccb5e`
- Authorized at: `2026-08-13T18:58:07Z`
- Authorization: the owner authorized a behavior-preserving correction,
  affected checks, a commit, and a fresh exact-head strict-first review while
  retaining the existing scope, accepted risks, expiration, correction limits,
  and safety controls.

## Evidence-backed disposition

Disposition: `objective-fix`.

The external review host previously validated the caller-supplied package's
internal digest and created a detached view at the requested head, but it did
not independently reconstruct the package from that view. A fabricated yet
self-consistent package could therefore omit committed diff content before the
reviewer received it.

The correction makes the host independently resolve the exact base and head,
rederive the binary-safe base-to-head Git diff, and recompute every declared
artifact hash and size from the detached committed view. It compares the
complete canonical reconstructed package with the submitted package and fails
closed before reviewer invocation on any rederivation failure or mismatch.
Only the reconstructed package is written for the reviewer. The shared host
path protects both Codex and Claude without adding machine configuration.

## Correction budget and exact-head rule

- Overall correction chain: attempt 3 of the authorized maximum 3.
- Attempts for this failure signature: 1 of 3.
- Behavior-preserving: yes.
- Current: yes, once included in the corrected commit.
- Ancestry: the corrected commit is a descendant of the reviewed head above.
- Fresh review: required for the corrected commit and newly sealed manifest;
  the prior review cannot authorize a transition.

## Verification

- `node --test scripts/sdd/test/review-launcher-recovery.test.mjs
  scripts/sdd/test/independent-review-contract.test.mjs` — 13 passed,
  including fail-closed mismatch behavior before reviewer invocation.
- `node --test` — 201 passed.
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
dispositions. This correction resolves only the package-rederivation finding
and does not claim that degraded review is strict or security-verified.
