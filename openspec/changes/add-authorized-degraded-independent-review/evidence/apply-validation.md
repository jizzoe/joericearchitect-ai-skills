# Apply Validation Evidence

The exact Apply head is resolved from the enclosing Git commit at the review
gate and recorded with the sealed package; this file does not use a stale
self-referential commit literal.

Passed current evidence:

- `node --test` in a clean exact-head clone — 211 passing tests covering authorization, strict-first execution, durable resume, Codex/Claude external-host launcher recovery, current-clock and enclosing-goal expiration, required distinct implementer/reviewer identity binding, restricted reviewer home/credential access, machine-required degraded authenticity limitations, durable-source per-signature correction enforcement and complete chain linkage, disposition compatibility and unresolved-objective-fix routing, disposition-driven human pauses, host package rederivation, symlink-safe package injection and Git-object artifact derivation, authorized delivery-profile binding, corrected-head delivery, concise-request resolution, checkpoint/delivery bindings, findings, detached view, portability, secrets, and adapter boundaries.
- `node --test scripts/sdd/test/degraded-independent-review-authorization.test.mjs scripts/sdd/test/review-launcher-recovery.test.mjs scripts/sdd/test/platform-review-adapters.test.mjs scripts/sdd/test/independent-review-v1-gate.test.mjs scripts/sdd/test/execute-independent-review.test.mjs` — 35 focused authorization, launcher, adapter, result-contract, and delivery-gate tests pass after the recorded review corrections.
- `node --test scripts/sdd/test/review-launcher-recovery.test.mjs scripts/sdd/test/platform-review-adapters.test.mjs scripts/sdd/test/resolve-sdd-delivery-request.test.mjs evals/skills/autonomous-goal-runner/run-fixtures.test.mjs evals/workflows/autonomous-sdd-lifecycle/run-fixtures.test.mjs` — 54 focused launcher, request, adapter, and lifecycle tests pass.
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
The first runtime exercise of that profile failed closed before review because
split inline filesystem overrides did not deserialize as Codex's permission
profile type. The behavior-preserving serialization correction preserves the
same boundary as one accepted strict-config TOML inline table and is recorded
in `evidence/review-correction-permission-profile-serialization.md`. Its
corrected head requires fresh strict-first review and is the fifth globally
ordered correction, first for its startup failure signature.
The separately authorized `review-package-write-symlink-escape` correction
exclusively creates the host-injected package path, failing closed on a
committed file or symlink without altering its external target. It is recorded
in `evidence/review-correction-package-write-symlink.md` and is the sixth
globally ordered correction, first for its failure signature.
The separately authorized `review-launcher-missing-implementer-identity`
correction requires and digest-binds a non-empty implementer identity and
rejects equality with the configured reviewer at controller, external-host,
and response-acceptance preflight. It is recorded in
`evidence/review-correction-launcher-implementer-identity.md` and is the ninth
globally ordered correction, first for its failure signature.
The separately authorized `review-artifact-symlink-read-escape` correction
derives declared artifact bytes only from regular Git blobs at the exact head,
rejecting symlinks and other non-regular entries without filesystem-following
reads. It is recorded in `evidence/review-correction-artifact-symlink.md` and
is the seventh globally ordered correction, first for its failure signature.
The previously authorized correction-budget enforcement was then exercised by
the fresh reviewer, which identified a stale global three-correction cap in
checkpoint inspection. The correction replaces that global cap with the same
per-`failureSignature` accounting used by authorization, operation, and finding
validation. It is recorded in
`evidence/review-correction-checkpoint-correction-budget.md` and is the eighth
globally ordered correction, first for its failure signature.
The separately authorized `delivery-profile-gate-bypass` correction now
requires each high-impact SDD request profile to exactly match the supported
quality profile in durable resolved authorization, and selects the production
review gate from that durable value. It is recorded in
`evidence/review-correction-delivery-profile-gate.md` and is the tenth globally
ordered correction, first for its failure signature.
The separately authorized `caller-controlled-correction-counter` correction
binds objective correction to the authorized selected entry, derives total and
per-signature counts from the validated durable checkpoint, enforces the
resolved authorization budget, and rejects mismatched caller counters. It is
recorded in `evidence/review-correction-durable-correction-counter.md` and is
the eleventh globally ordered correction, first for its failure signature.
The owner then made the durable decision that finding severity describes
impact while disposition controls whether human judgment is required. High-
severity objective fixes proceed only when they are scoped, behavior-
preserving, evidence-backed, and inside budget; delivery still requires fresh
passing review. The `correction-budget-signature-renaming` correction binds
each failure signature to its exact durable review finding and rejects caller
renaming. It is recorded in
`evidence/review-correction-failure-signature-binding.md` and is the twelfth
globally ordered correction, first for its failure signature.
The `correction-chain-linkage-not-validated` correction anchors the chain and
validates each base, predecessor head/manifest, canonical commit and digest,
ordering, and budget through one shared validator. It is recorded in
`evidence/review-correction-chain-linkage.md` and is the thirteenth globally
ordered correction, first for its failure signature.
The `degraded-expiration-not-bounded-by-goal` correction requires degraded and
launcher expirations to remain no later than the enclosing goal and reuses the
same validator at preparation, host execution, and response acceptance. It is
recorded in `evidence/review-correction-goal-expiration-boundary.md` and is the
fourteenth globally ordered correction, first for its failure signature.
The `capability-ledger-omits-accepted-authenticity-limitations` correction
requires Codex and Claude results to place unauthenticated parent-launch
evidence and non-host-pinned executable identity in the ledger's `unavailable`
class. It is recorded in
`evidence/review-correction-capability-ledger-authenticity.md` and is the
fifteenth globally ordered correction, first for its failure signature.
The `finding-disposition-allows-unresolved-delivery` correction adds an exact
severity/disposition compatibility matrix and makes an in-budget objective-fix
disposition return `correction-required` rather than delivery-ready on the
reviewed head. It is recorded in
`evidence/review-correction-unresolved-disposition-gate.md` and is the
sixteenth globally ordered correction, first for its failure signature. The
corrected head requires affected verification and fresh strict-first review.
