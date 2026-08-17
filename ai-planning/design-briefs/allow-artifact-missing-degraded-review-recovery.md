# Allow Artifact-Missing Degraded Review Recovery

## 1. Problem and desired outcome

`strict-first-degraded` is an explicit owner-approved reduced-assurance
recovery policy. A strict Codex review can presently complete multi-step
read-only inspection without writing its required owned final-result artifact.
The strict transport correctly returns
`review-launcher-codex-result-artifact-missing`, but the degraded-launcher
allowlist rejects that stable unavailable code before it creates a fresh,
separate reviewer.

The desired outcome is narrow: a current, durable strict artifact-missing
result for the same exact package becomes eligible for the existing
`fresh-separated-reviewer-only` recovery under `strict-first-degraded`. The
strict record remains immutable evidence, and the accepted fallback remains
explicitly `authorized-degraded`, never strict-isolated.

## 2. Evidence and key findings

- Two fresh parent-strict reviews at commit
  `4414a6501d720ecc55bc6fc6de00f0b7f91fb6e9` returned
  `review-launcher-codex-result-artifact-missing` after tool-driven inspection
  and no final artifact.
- `scripts/sdd/review-launcher-recovery.mjs` currently accepts only
  `independent-review-view-create-failed` and
  `independent-reviewer-nested-app-server-denied` for the Codex launcher.
- The recovery preflight therefore returned
  `review-launcher-failure-not-recoverable` before it created a degraded view
  or reviewer.
- The related strict transport diagnosis is retained in
  `strict-review-multistep-artifact-delivery.md`; this change does not claim to
  repair that transport fault.

## 3. Options considered and tradeoffs

- Keep artifact-missing ineligible: preserves the current narrower fallback
  surface but leaves an explicitly authorized degraded policy unable to recover
  from a typed strict transport failure.
- Allow every strict unavailable code: rejected because unsupported or unsafe
  strict failures should remain fail-closed.
- Allow only the stable artifact-missing code after exact-package strict
  unavailability: selected. It preserves a narrow, auditable recovery path and
  all existing authorization, identity, package, expiration, lifecycle, and
  capability checks.

## 4. Decisions, assumptions, and owner

- Owner decision: permit this exact durable missing-artifact strict result to
  trigger the already-authorized degraded reviewer.
- Required label: the accepted result is `authorized-degraded`; it must retain
  the strict unavailable precursor and must never be described as strict.
- Assumption: the current isolated degraded launcher already enforces the
  required separate reviewer, exact detached view, sealed package, and safe
  cleanup boundaries. Implementation must prove this with regression coverage.

## 5. Scope, non-goals, constraints, dependencies, and risks

Scope: extend the Codex degraded-launcher recovery eligibility to
`review-launcher-codex-result-artifact-missing`, update its contract and
deterministic tests, and document the exact assurance boundary.

Non-goals: accepting transcripts/stdout, weakening `strict-only`, accepting a
self-review, broadening recovery to arbitrary unavailable codes, changing
strict artifact delivery, or changing credential, network, GitHub, deployment,
or release authority.

Constraints: the strict precursor, package commits/digest, selected change,
transition, expiration, correction chain, implementer/reviewer identity,
runtime permission, review-worktree lifecycle, and capability ledger remain
validated before launch and acceptance.

Risk: a future broad allowlist could turn malformed strict transport failures
into degraded review. Mitigation: assert the exact code allowlist and test
nearby unrelated codes remain ineligible.

## 6. Open questions and blocking decisions

None. The owner selected the narrow exact-code option. The separate strict
artifact-transport repair remains recommended but is not a dependency of this
authorized recovery change.

## 7. Recommended next step

Create and deliver OpenSpec change
`allow-artifact-missing-degraded-review-recovery` under production-rapid,
strict-first-degraded authorization. Verify a strict artifact-missing precursor
can reach only the existing sealed, separate `authorized-degraded` review path
and that all other strict unavailable codes remain rejected.
