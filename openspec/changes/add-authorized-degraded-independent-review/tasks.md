## 1. Authorization and result contracts

- [x] 1.1 Add a deterministic, disabled-by-default degraded-review authorization validator that binds selected entry, transition, expiration, risk reason, fallback boundary, base/head/manifest, and bounded correction envelope; add synthetic valid and rejection fixtures.
  - Depends on: planning review.
  - Evidence: focused Node tests for absent, broad, expired, wrong-transition, stale-head/manifest, and exhausted-envelope cases.
- [x] 1.2 Extend the sealed review result/schema validation with `strict-isolated` and `authorized-degraded` assurance, capability ledger, strict unavailable precursor, and authorization/risk bindings while retaining strict v1 compatibility.
  - Depends on: 1.1.
  - Evidence: schema and contract tests for valid strict/degraded and malformed/mislabelled results.

## 2. Strict-first execution and durable evidence

- [x] 2.1 Update canonical independent-review orchestration to attempt strict isolation first, preserve stable unavailable evidence, and invoke a fresh separate degraded reviewer only after the validator authorizes it.
  - Depends on: 1.1, 1.2.
  - Evidence: deterministic adapter/orchestration tests proving ordering and no fallback without strict unavailability.
- [ ] 2.2 Add the degraded adapter boundary with a detached committed view, sealed-package-only input, fixed allowlisted inspection path, environment/tool scrubbing, and truthful enforced/unavailable/instruction-constrained capability ledger.
  - Depends on: 2.1.
  - Evidence: synthetic adapter tests reject same-session, mutable, credential, GitHub, deployment, release, external-send, and delegated-mutation paths.
- [ ] 2.3 Extend checkpoint and delivery-gate validation to retain and re-derive assurance, strict precursor, authorization, findings, dispositions, and derived-head envelope evidence.
  - Depends on: 1.1, 1.2.
  - Evidence: checkpoint/operation-authorization tests cover current exact-head success and every required pause condition.

## 3. Canonical documentation and portability

- [x] 3.1 Update the canonical independent-review skill, protocol/result references, autonomous-runner policy, and lifecycle guidance to explain strict default, explicit degraded risk acceptance, current-head rereview, pause/recovery, and the queue-1 bootstrap boundary.
  - Depends on: 2.1, 2.3.
  - Evidence: documentation/link and canonical thin-adapter drift checks.
- [x] 3.2 Add synthetic evaluation scenarios and a second-workspace fixture for strict/degraded distinction, untrusted content, secret exclusion, safe paths, expiration, recovery, and portability without product constants.
  - Depends on: 2.2, 2.3.
  - Evidence: deterministic eval suite.

## 4. Verification and delivery evidence

- [ ] 4.1 Run focused contract, adapter, checkpoint, authorization, eval, schema, secret, attribution, portability, and adapter-drift checks; record current Apply evidence and map each requirement/scenario to evidence.
  - Depends on: 3.1, 3.2.
  - Evidence: current command output and requirements mapping under the change evidence directory.
- [ ] 4.2 Obtain current-head independent review using strict first and the one-time queue-1 bootstrap only if strict isolation is unavailable; preserve the sealed package, strict unavailable record, exact authorization, degraded result/ledger, findings, dispositions, transition, and expiration.
  - Depends on: 4.1.
  - Evidence: unique durable exact-head review record and validated dispositions.
- [ ] 4.3 Run formal OpenSpec Verify and `openspec validate --all --strict`; correct only evidence-backed behavior-preserving objective findings and repeat affected checks and review for a new head.
  - Depends on: 4.2.
  - Evidence: Verify report, strict validation output, and transition-gate record.
