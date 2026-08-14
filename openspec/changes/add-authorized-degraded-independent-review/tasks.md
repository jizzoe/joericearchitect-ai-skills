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
- [x] 2.2 Add the degraded adapter boundary with a detached committed view, sealed-package-only input, fixed allowlisted inspection path, environment/tool scrubbing, and truthful enforced/unavailable/instruction-constrained capability ledger.
  - Depends on: 2.1.
  - Evidence: synthetic adapter tests reject same-session, mutable, credential, GitHub, deployment, release, external-send, and delegated-mutation paths.
- [x] 2.3 Extend checkpoint and delivery-gate validation to retain and re-derive assurance, strict precursor, authorization, findings, dispositions, and derived-head envelope evidence.
  - Depends on: 1.1, 1.2.
  - Evidence: checkpoint/operation-authorization tests cover current exact-head success and every required pause condition.
- [x] 2.4 Add a deterministic, permission-gated review-launcher recovery that detects outer-sandbox review-view or nested-app-server denial, creates the owned detached exact-head view only through the configured launcher, and preserves the inner ephemeral read-only reviewer boundary.
  - Depends on: 2.1, 2.2, 2.3.
  - Evidence: synthetic launcher-denied and launcher-permitted tests prove controller/host separation, recorded runtime outside-sandbox evidence, no self-escalation, no package-only substitute, sealed input, detached view, guarded cleanup, stable recovery codes, and inner reviewer mutation restrictions; accepted-risk evidence records that the runtime record is not cryptographic attestation.
- [x] 2.5 Add a pure concise SDD-delivery request resolver that requires target, mode, quality profile, authorization profile, independent-review policy, and expiration; expand recognized presets into complete effective authorization and return one structured clarification for all missing or invalid inputs.
  - Depends on: 1.1, 2.4.
  - Evidence: focused tests cover complete production-rapid expansion, three-correction default, strict-only and strict-first-degraded behavior, duration normalization, missing fields, invalid values, conflicting inputs, and no pre-resolution mutation.
- [x] 2.6 Add Claude degraded-review parity through the external-host recovery boundary and record the explicitly accepted non-security-verifiable evidence and executable-identity limitations for both launchers.
  - Depends on: 2.4, owner accepted-risk decision.
  - Evidence: deterministic Codex/Claude adapter and launcher tests, canonical documentation, and durable accepted-risk evidence prove strict behavior is unchanged and both degraded transports remain distinctly labelled.

## 3. Canonical documentation and portability

- [x] 3.1 Update the canonical independent-review skill, protocol/result references, autonomous-runner policy, and lifecycle guidance to explain strict default, explicit degraded risk acceptance, current-head rereview, pause/recovery, and the queue-1 bootstrap boundary.
  - Depends on: 2.1, 2.3.
  - Evidence: documentation/link and canonical thin-adapter drift checks.
- [x] 3.2 Add synthetic evaluation scenarios and a second-workspace fixture for strict/degraded distinction, untrusted content, secret exclusion, safe paths, expiration, recovery, and portability without product constants.
  - Depends on: 2.2, 2.3.
  - Evidence: deterministic eval suite.
- [x] 3.3 Document the concise request vocabulary and require the runner to ask once for every missing field with a short meaning and supported values before work selection or mutation.
  - Depends on: 2.5.
  - Evidence: canonical skill/reference and lifecycle evals prove the missing-input message, effective-authorization report, and runtime-permission boundary.

## 4. Verification and delivery evidence

- [x] 4.1 Run focused contract, adapter, launcher-recovery, request-resolution, checkpoint, authorization, eval, schema, secret, attribution, portability, and adapter-drift checks; record current Apply evidence and map each requirement/scenario to evidence.
  - Depends on: 3.1, 3.2.
  - Evidence: current command output and requirements mapping under the change evidence directory.
- [x] 4.2 Obtain current-head independent review using strict first and the one-time queue-1 bootstrap only if strict isolation is unavailable; preserve the sealed package, strict unavailable record, exact authorization, degraded result/ledger, findings, dispositions, transition, and expiration.
  - Depends on: 4.1.
  - Evidence: unique durable exact-head review record and validated dispositions.
- [x] 4.3 Run formal OpenSpec Verify and `openspec validate --all --strict`; correct only evidence-backed behavior-preserving objective findings and repeat affected checks and review for a new head.
  - Depends on: 4.2.
  - Evidence: Verify report, strict validation output, and transition-gate record.

## 5. Zero-touch parent-runtime redesign

- [x] 5.1 Reopen and review the proposal, delta specs, design, and task plan so
  zero operator mediation, reduced-assurance labeling, parent/inner boundary
  separation, terminal denial behavior, and exact-head automatic rereview are
  explicit acceptance criteria.
  - Depends on: owner redesign authorization and the prior 4.3 evidence.
  - Evidence: strict OpenSpec validation and updated planning-review mapping.
- [x] 5.2 Integrate one assistant-neutral parent-runtime transport operation
  into production independent-review orchestration. It must consume prepared
  requests internally, accept host responses directly, and convert missing,
  denied, timed-out, malformed, or rejected transports into stable terminal
  unavailable results without exposing a manual host action.
  - Depends on: 5.1.
  - Evidence: focused orchestration tests, including a regression that no
    production path returns `review-launcher-external-host-required`.
- [x] 5.3 Add the thin Codex-facing transport adapter that builds only the
  fixed validated host-owned reviewer invocation, requests the actual
  escalated shell-tool boundary eligible for Auto-review, captures runtime
  result evidence, leaves the inner reviewer at authorized-degraded assurance,
  and never executes repository-controlled code with parent authority.
  Document the equivalent contract for other trusted runtimes without
  duplicating policy.
  - Depends on: 5.2.
  - Evidence: adapter contract, archive/symlink and command-injection/path
    tests, canonical/thin drift checks, and an actual Auto-reviewed launch
    receipt.
- [x] 5.4 Extend the bounded runner and lifecycle evaluation path so an
  objective finding, correction, validation, package rebuild, strict retry,
  authorized recovery, disposition, and new-head rereview proceed without an
  operator retrigger and remain capped per failure signature.
  - Depends on: 5.2, 5.3.
  - Evidence: deterministic end-to-end fixture with one objective correction
    and fresh review, plus denial/unavailable no-manual-fallback fixtures.
- [ ] 5.5 Exercise the real strict-failure to parent launch to restricted inner
  review path in this runtime, including owned detached-view cleanup and direct
  response acceptance. Record only runtime-produced, request-bound evidence
  and retain the two explicit non-security-verifiable limitations.
  - Depends on: 5.3, current exact-head Apply evidence.
  - Evidence: unique runtime rehearsal record proving zero owner actions.
- [ ] 5.6 Run focused and full tests, security/secret, portability,
  attribution, requirements, recovery, formal Verify, current-head independent
  review, and `openspec validate --all --strict`; repeat after every objective
  correction or head change.
  - Depends on: 5.4, 5.5.
  - Evidence: refreshed Apply, runtime review, and verification reports bound
  to the delivery head.
