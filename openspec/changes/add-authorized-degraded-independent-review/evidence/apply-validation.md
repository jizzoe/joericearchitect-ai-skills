# Apply Validation Evidence

The exact Apply head is resolved from the enclosing Git commit at the review
gate and recorded with the sealed package; this file does not use a stale
self-referential commit literal.

Passed current evidence:

- `node --test $(rg --files | rg '\.test\.mjs$')` — 199 passing tests covering authorization, strict-first execution, durable resume, Codex/Claude external-host launcher recovery, current-clock expiration, corrected-head delivery, concise-request resolution, checkpoint/delivery bindings, findings, detached view, portability, secrets, and adapter boundaries.
- `node --test scripts/sdd/test/review-launcher-recovery.test.mjs scripts/sdd/test/platform-review-adapters.test.mjs scripts/sdd/test/resolve-sdd-delivery-request.test.mjs evals/skills/autonomous-goal-runner/run-fixtures.test.mjs evals/workflows/autonomous-sdd-lifecycle/run-fixtures.test.mjs` — 51 focused launcher, request, adapter, and lifecycle tests pass.
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
identity.
