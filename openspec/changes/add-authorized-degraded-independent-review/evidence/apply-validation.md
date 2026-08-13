# Apply Validation Evidence

The exact Apply head is resolved from the enclosing Git commit at the review
gate and recorded with the sealed package; this file does not use a stale
self-referential commit literal.

Passed current evidence:

- `node --test` — 203 passing tests covering authorization, strict-first execution, durable resume, Codex/Claude external-host launcher recovery, current-clock expiration, restricted reviewer home/credential access, per-signature correction enforcement, host package rederivation, corrected-head delivery, concise-request resolution, checkpoint/delivery bindings, findings, detached view, portability, secrets, and adapter boundaries.
- `node --test scripts/sdd/test/review-launcher-recovery.test.mjs scripts/sdd/test/platform-review-adapters.test.mjs scripts/sdd/test/resolve-sdd-delivery-request.test.mjs evals/skills/autonomous-goal-runner/run-fixtures.test.mjs evals/workflows/autonomous-sdd-lifecycle/run-fixtures.test.mjs` — 53 focused launcher, request, adapter, and lifecycle tests pass.
- `node --test scripts/sdd/test/execute-independent-review.test.mjs scripts/sdd/test/degraded-independent-review-authorization.test.mjs scripts/sdd/test/review-launcher-recovery.test.mjs` — 15 focused authorization/execution tests pass, including rejection when authorization expires while the degraded reviewer is running and per-signature correction budget enforcement.
- `node scripts/sdd/check-adapter-drift.mjs` — canonical wrappers have no policy drift.
- `node scripts/validation/validate-skill-metadata.mjs` — canonical skill metadata passes.
- `node scripts/validation/validate-shared-guardrails.mjs` — canonical guardrail linkage passes.
- `node scripts/validation/validate-openspec-artifacts.mjs openspec/changes/add-authorized-degraded-independent-review` — planning artifact quality passes.
- `openspec validate add-authorized-degraded-independent-review --strict` — change artifacts pass.
- `openspec validate --all --strict` — 22 items pass.
- `git diff --check` — no whitespace errors.
- Secret-pattern review over all affected canonical, schema, script, eval, and
  OpenSpec paths reports no token, private-key, or bearer-secret matches.

Requirements mapping: authorization rejection and correction envelope (1.1);
assurance/ledger/strict precursor (1.2); strict-first separate fallback (2.1,
2.2); durable delivery bindings (2.3); permission-gated launcher and inner
restricted review (2.4); Codex/Claude degraded parity and the durable accepted-
risk record for non-verifiable launch/executable identity (2.6); concise request expansion, missing-input prompt,
quality and authorization presets (2.5, 3.3); portability, secret handling, and
untrusted package boundaries (3.1, 3.2). No third-party code, dependency, or
license attribution was introduced. Recovery remains idempotent: the resolver
is pure, each launcher accepts no arbitrary shell command, creates only an owned
detached exact-head view, and cleans it through the ownership guard. `IR-001`
and `IR-002` remain explicitly accepted risks rather than resolved controls;
this evidence does not claim cryptographic attestation or host-pinned reviewer
identity. The separately authorized `degraded-review-expiry-toctou` correction
rechecks the exact authorization with a fresh runtime clock after review and is
recorded in `evidence/review-correction-degraded-expiry.md`; its corrected head
requires fresh strict-first review.
The separately authorized `strict-review-inherits-credentials` correction
replaces ambient environment inheritance with a closed operational allowlist
for every strict/degraded Codex/Claude probe and reviewer subprocess. Its
regression and correction-chain evidence is recorded in
`evidence/review-correction-reviewer-environment.md`; its corrected head also
requires fresh strict-first review.
The separately authorized `degraded-host-package-not-rederived` correction
reconstructs and canonically compares the complete review package from the
external host's detached committed view before either Codex or Claude can run.
It is recorded in
`evidence/review-correction-host-package-rederivation.md`; its corrected head
requires fresh strict-first review and was the third globally ordered
correction.
The separately authorized `degraded-reviewer-home-credential-access`
correction gives Codex model-generated commands an OS-enforced restricted-read
profile while retaining parent-only CLI authentication and gives Claude an
empty isolated home. It also aligns the durable chain validator, operation
checker, and finding policy with the original three-corrections-per-failure-
signature budget. It is recorded in
`evidence/review-correction-reviewer-home-access.md`; its corrected head
requires fresh strict-first review and is the fourth globally ordered
correction but only the first for this signature.
