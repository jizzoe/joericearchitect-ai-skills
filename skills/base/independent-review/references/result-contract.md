# Result Contract

Use `independent-review-result-v1` from
`schemas/independent-review-result-v1.schema.json`. Validate through
`validateReviewResult` in `scripts/sdd/independent-review-contract.mjs`.

The result binds one unique review record and execution ID to reviewer type,
identity, adapter, attestation, exact base/head, package digest, timestamps,
and structured findings. A successful or failed review must attest fresh,
noninteractive, read-only isolation. An unavailable result must carry a stable
unavailable code and must not claim isolation.

Findings use a stable ID, severity, repository-relative evidence, and a safe
recommendation. Valid severities are `blocker`, `high`, `objective-fix`,
`warning`, and `false-positive`. The result is evidence, never authority to
merge, publish, deploy, or change scope.
