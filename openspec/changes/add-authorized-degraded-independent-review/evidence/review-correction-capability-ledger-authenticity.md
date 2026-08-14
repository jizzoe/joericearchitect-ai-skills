# Capability Ledger Authenticity Correction Evidence

## Failure and disposition

- Review record: `degraded-394b49db-f495-4d8a-9a33-d5ca6b089000`.
- Reviewed head: `cb2a3111a74f8c8083a1410f065b6e88f48fb77b`.
- Reviewed manifest:
  `8f1254fcba26334c1c6c20c98f9c2d2acbc6dfc967fdb0039e7dc4bc81028352`.
- Failure signature:
  `independent-review/capability-ledger-omits-accepted-authenticity-limitations/scripts/sdd/platform-review-adapters.mjs/merge-pr`.
- Severity: `objective-fix`.
- Disposition: `objective-fix`; this makes existing accepted-risk disclosure
  machine-verifiable without changing the degraded-review assurance boundary.

## Correction

Both Codex and Claude degraded adapters now place
`authenticatedParentLaunchEvidence` and
`hostPinnedReviewerExecutableIdentity` in the ledger's `unavailable` class.
The canonical result validator requires both entries there, so a result cannot
omit, relabel, or imply enforcement of either accepted limitation.

## Correction budget and verification

- Overall ordered correction chain: attempt 15.
- Attempts for this failure signature: 1 of 3.
- Adapter tests verify both generated ledgers disclose both limitations.
- Result-gate tests reject a degraded result that omits either required
  authenticity limitation.
- Behavior-preserving: yes; the result remains `authorized-degraded` and is
  never described as strict or security-verified.
- A new exact head requires fresh strict-first review.
