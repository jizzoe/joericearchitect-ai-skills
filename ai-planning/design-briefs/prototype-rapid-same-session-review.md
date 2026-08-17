# Prototype-Rapid Same-Session Review

## 1. Problem and desired outcome
Problem: The SDD delivery resolver requires a strict independent-review policy for every profile and maps the prototype alias to strict-first-degraded. That makes a prototype request for a same-session local review invalid even though the verification profile already limits strict independent review to production-rapid.
Desired outcome: A prototype-rapid delivery resolves a durable same-session-local review policy, requires focused checks, critical-flow evidence, and local review findings/resolutions in the implementer session, and never launches or accepts an isolated independent-review result. Production-rapid continues to require strict isolated review and may use only its existing strict or authorized-degraded policy.

## 2. Evidence and key findings
- [scripts/sdd/resolve-sdd-delivery-request.mjs](../../scripts/sdd/resolve-sdd-delivery-request.mjs): \#!/usr/bin/env node import fs from "node:fs"; const changeName = /^\[a-z0-9\]+\(?:-\[a-z0-9\]+\)\*$/; const modes = \["autonomous", "interactive"\]; const qualityProfiles = \["production-rapid", "prototype-rapid"\]; const authorizationProfiles = \["sdd-delivery"\]; const reviewPolicies = \["s…
- [scripts/sdd/check-operation-authorization.mjs](../../scripts/sdd/check-operation-authorization.mjs): \#!/usr/bin/env node import { operationVocabulary } from "../validation/validate-base-skill-contracts.mjs"; import { inspectCheckpoint } from "./checkpoint.mjs"; import { canonicalFailureSignature } from "./correction-chain.mjs"; import { canonicalGitCommit, immutableReviewManife…
- [skills/base/base-verification-loop/references/verification-profiles.md](../../skills/base/base-verification-loop/references/verification-profiles.md): \# Verification Profiles \#\# Common Minimum Both profiles retain shared guardrails, core data-integrity checks, the critical flow, focused deterministic evidence, local code and security review, explicit gaps, and bounded corrections. Every completed readiness check and local-revi…
- [skills/base/autonomous-goal-runner/references/sdd-delivery-request.md](../../skills/base/autonomous-goal-runner/references/sdd-delivery-request.md): \# Concise SDD Delivery Request Use this contract when a user asks the autonomous runner to deliver one named OpenSpec change or an ordered queue. Before work selection or mutation, normalize the request with \`scripts/sdd/resolve-sdd-delivery-request.mjs\` and report its effective…
- [workflows/autonomous-sdd-lifecycle/workflow.md](../../workflows/autonomous-sdd-lifecycle/workflow.md): \# Autonomous SDD Lifecycle This workflow composes the existing OpenSpec SDD actions with the bounded autonomous execution controls from \`skills/base/autonomous-goal-runner/\`. Use it only after a user provides explicit bounded authorization covering the selected change or determi…
- [openspec/specs/bounded-autonomous-execution/spec.md](../../openspec/specs/bounded-autonomous-execution/spec.md): \#\# Purpose Defines reusable bounded long-running work execution behavior for AI-assisted goals that may continue across multiple reviewable steps without routine human prompts while preserving explicit authorization, evidence gates, recovery, and human control over material or d…
- [openspec/specs/base-verification-loop/spec.md](../../openspec/specs/base-verification-loop/spec.md): \# Base Verification Loop Specification \#\# Purpose Defines a portable, bounded implementation verification loop that selects proportional checks, records reproducible evidence, and reports readiness without replacing lifecycle or independent-review gates. \#\# Requirements \#\#\# Requ…

## 3. Options considered and tradeoffs
- Keep independentReviewPolicy universal and instruct callers to use a strict value for prototype — no migration, but the authorization record misstates the intended review and can trigger incorrect orchestration.
- Add same-session-local as an allowed review policy and enforce a quality-profile/policy compatibility matrix — recommended; clear durable authorization and no production-gate downgrade.
- Make the review field optional for prototype — fewer fields, but produces different authorization shapes and leaves the review mechanism implicit.

## 4. Decisions, assumptions, and owner
- Owner: Not yet named
- Confirmed decisions: None; recommendation remains pending owner decision.
- Approval evidence: Not supplied.
- Assumptions: base-verification-loop local-review is the intended same-session review contract and is already mandatory for prototype-rapid.; Existing callers can update from the prototype alias automatically; explicit prototype requests with a strict policy should fail with a migration message rather than silently change behavior.

## 5. Scope, non-goals, constraints, dependencies, and risks
- Scope: Create one reusable policy change: update scripts/sdd/resolve-sdd-delivery-request.mjs to accept same-session-local, resolve ship-sdd prototype to it, derive local-review rather than independent-review quality gates, and reject prototype-plus-strict and production-plus-same-session combinations before mutation; update scripts/sdd/check-operation-authorization.mjs to prohibit independent-review evidence or strict-launch routing for prototype and retain the existing production-only strict gate; update autonomous-goal-runner request guidance, autonomous SDD lifecycle guidance, verification-profile guidance, and the bounded-autonomous-execution and base-verification-loop OpenSpec requirements; add resolver, operation-checker, verification-quality, and lifecycle regression fixtures proving the complete matrix.
- Non-goals: Changing the strict independent-review transport, accepting a self-review as production evidence, removing prototype local review, relaxing tests, security review, OpenSpec Verify, PR/merge, Sync, Archive, issue/Project, or cleanup gates, or changing deployment and credential authority.
- Constraints: Review policy and delivery profile must be both present in the authorization digest and mutually compatible.; same-session-local must never claim independence, isolation, freshness in a separate context, or strict assurance.; Production strict-review records and degraded recovery remain byte-for-byte compatible.; No prompt, transcript, or reviewer result can cause a policy change.
- Dependencies: scripts/sdd/resolve-sdd-delivery-request.mjs and its deterministic tests.; scripts/sdd/check-operation-authorization.mjs and implementation-quality validation fixtures.; The canonical autonomous-goal-runner, autonomous SDD lifecycle, and base-verification-loop assets and their living specs.
- Risks: Existing explicit prototype requests containing a strict policy will become invalid until migrated.; A partial change could let the resolver accept same-session-local while a downstream dispatcher still invokes strict review.; A misleading evidence label could cause a prototype local review to be treated as production independent-review evidence.

## 6. Open questions and blocking decisions
- Should the public field retain the backward-compatible name independentReviewPolicy with same-session-local as a third value, or be renamed reviewPolicy in a versioned request schema?
- Which compatibility period and error message should apply to explicit prototype-plus-strict requests?
- Should a no-independent-review prototype request be normalized from natural-language aliases only after the new review policy is implemented, or must callers send the exact same-session-local value?

## 7. Recommended next step
Recommendation pending owner confirmation: Propose a dedicated change named allow-prototype-same-session-review. Adopt same-session-local as a third review-policy value. The resolver must require it for prototype-rapid and reject it for production-rapid; strict-only and strict-first-degraded must be valid only for production-rapid. Prototype review evidence remains the existing local-review record tied to current changed paths and finding dispositions, never an independent-review result or strict assurance label.
Recommended workflow action: OpenSpec Propose. No OpenSpec artifacts were created.
