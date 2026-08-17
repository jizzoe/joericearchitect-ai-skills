# Owner-approved external-review deferral

Date: 2026-08-16

## Authorization

The repository owner explicitly authorized this one change to proceed after the
required reviewer artifact transport failed in both strict and fresh degraded
Codex sessions. The owner will obtain an independent review in a different LLM
and session after the code is written.

## Exact scope

This deferral applies only to OpenSpec change
`allow-artifact-missing-degraded-review-recovery` and its delivery head. It
does not alter `strict-only`, does not make either unavailable Codex result a
passing review, does not authorize a transcript as evidence, and does not
extend to any other change, branch, Sync, Archive, or future delivery.

## Evidence retained

- Strict result: `review-launcher-codex-result-artifact-missing`.
- Fresh authorized-degraded result:
  `review-launcher-codex-result-artifact-missing`.
- Both parent consumers removed their owned views and rejected transcript
  output. The unavailability is recorded in the local delivery controller.

## Delivery representation

Any delivery record and pull request MUST state that independent review is
owner-deferred and external, not passed, waived globally, strict-isolated, or
authorized-degraded. This exception is a narrow owner decision for delivery
continuation; it does not change the reusable review policy.
