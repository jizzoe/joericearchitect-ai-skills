# independent-review-configuration-provenance design brief

## 1. Problem and desired outcome
Problem: A delivery run incorrectly inferred that config/ai-skills.json was the source of strict independent-review configuration, then declared the reviewer absent despite the established sealed parent strict-review request carrying a configured Codex reviewer, distinct identity, and attestation.
Desired outcome: Review availability conclusions are provenance-based, deterministic, and fail closed: the runner identifies the authoritative strict-review source, records why it is usable or unavailable, and invokes the established parent transport before any unavailability conclusion.

## 2. Evidence and key findings
- [ai-planning/design-briefs/archived/independent-review-worktree-lifecycle-and-diagnostics.md](archived/independent-review-worktree-lifecycle-and-diagnostics.md): Existing decision record for bounded review-view construction and safe failure reporting.
- [ai-planning/design-briefs/archived/independent-review-result-transport-reliability.md](archived/independent-review-result-transport-reliability.md): Existing transport reliability decision record, including exact final-artifact and cleanup requirements.
- [ai-planning/design-briefs/independent-review-inspection-environment-fallback.md](independent-review-inspection-environment-fallback.md): Existing strict-first, fail-closed fallback analysis.
- [config/ai-skills.json](../../config/ai-skills.json): Contains only research, design-brief, and plan roots; it defines no strict-review loader or reviewer identity.
- [skills/base/independent-review/SKILL.md](../../skills/base/independent-review/SKILL.md) and [protocol](../../skills/base/independent-review/references/protocol.md): Require a configured distinct reviewer, attestation, and a direct parent strict request before durable strict unavailability.
- [scripts/sdd/check-operation-authorization.mjs](../../scripts/sdd/check-operation-authorization.mjs) and [scripts/sdd/platform-review-adapters.mjs](../../scripts/sdd/platform-review-adapters.mjs): Accept a reviewer as supplied runtime data and build the sealed parent transport; neither establishes `config/ai-skills.json` as an authoritative source.

## 3. Options considered and tradeoffs
- Keep the current implicit convention — no implementation cost, but recurring source-confusion risk and weak diagnosis.
- Make config/ai-skills.json the canonical strict-review source — centralizes configuration, but changes the established sealed-request boundary and risks coupling planning defaults to runtime credentials or identity policy.
- Add provenance-first review discovery and diagnostics — preserves the sealed runtime contract, makes source selection explicit, and adds targeted tests and evidence.
- Require an operator to supply reviewer data for every run — explicit but adds friction and can encourage manual workarounds.

## 4. Decisions, assumptions, and owner
- Owner: Not yet named
- Confirmed decisions: None; recommendation remains pending owner decision.
- Approval evidence: Not supplied.
- Assumptions: The existing direct parent strict request with Codex reviewer identity and attestation is the established runtime configuration mechanism; config/ai-skills.json currently contains only general planning defaults and no schema-defined strict-review loader; the most recent strict-review record and its exact immutable request are durable evidence that should be consulted before declaring the channel unavailable.

## 5. Scope, non-goals, constraints, dependencies, and risks
- Scope: Strict independent-review configuration discovery, source provenance records, fail-closed availability diagnostics, parent-transport preflight, and regression coverage for production-rapid SDD delivery.
- Non-goals: Changing assurance levels, weakening strict review, making planning defaults contain reviewer credentials, adding degraded-review authorization, or modifying the current in-flight change solely to retrofit this guardrail.
- Constraints: Preserve reviewer isolation, distinct identity, attestation binding, executable trust checks, and sealed package/result validation; do not expose credentials, raw runtime configuration, or reviewer artifacts in durable diagnostics; keep generic reusable assets free of product-specific constants and avoid source-controlled secrets.
- Dependencies: Canonical independent-review protocol and parent transport; operation authorization and delivery controller integration; existing diagnostic/result transport behavior and strict review fixture suite.
- Risks: A broad fallback source search could accept untrusted repository content or stale state; changing configuration precedence could silently bypass the exact sealed request; a diagnostic record that reveals raw paths, environment data, or attestation material could weaken the security boundary.

## 6. Open questions and blocking decisions
- Should the allowed source set be fixed solely to the delivery authorization and sealed parent request, or also permit a separately schema-validated product-owned runtime configuration file?
- Where should the durable safe discovery record live so that it is current-head bound without copying sensitive runtime details?
- Should the controller invoke discovery once per lifecycle transition or cache it only within a sealed exact-head review attempt?

## 7. Recommended next step
Recommendation pending owner confirmation: OpenSpec Propose a focused provenance-first independent-review discovery change: define allowed authoritative sources and precedence; reject configuration-source guessing; emit a safe discovery record; require parent strict-transport preparation before strict unavailability; and add regression tests for direct sealed reviewer configuration, planning-default non-authority, stale or malformed sources, and exact-head evidence.
Recommended workflow action: OpenSpec Propose. No OpenSpec artifacts were created.
