# Autonomous Prototype Frictionless Quality Loop

Date: 2026-08-18
Status: Owner-confirmed, Propose-ready design brief. This brief is planning
input; it does not create an OpenSpec change, authorize Apply, or change the
currently implemented `prototype-rapid` behavior.

Portfolio role: this is the interim low-friction prototype profile within the
[SDD execution-mode standard](../standards-and-best-practices/sdd-execution-modes-and-gates.md).
It enables useful bounded-autonomous delivery while the local-first runtime
kernel and the complete `production-rapid` profile are developed. It does not
define another controller or weaken the future production assurance model.

## 1. Problem and desired outcome

The current `prototype-rapid` shorthand resolves to strict-first-degraded
independent review, carries lifecycle approval pauses, and stops after a fixed
correction signature exhausts its budget. The narrower
[same-session review brief](prototype-rapid-same-session-review.md) removes the
isolated reviewer but intentionally preserves the remaining lifecycle pauses.
Neither path provides the requested frictionless prototype loop.

The desired outcome is an explicitly authorized `bounded-autonomous` plus
`prototype-rapid` delivery that runs end to end without routine human approval
pauses. Required quality work still happens continuously: a bounded
same-session review worker returns structured findings, and the main
implementer diagnoses, corrects, tests, validates, and requests rereview for
every safe objective issue.

The run asks for a person only when a stopping condition requires judgment or
when an authority, permission, credential, external-service, safety, or run
boundary cannot be safely repaired. It never converts low friction into weak
quality: completion requires current passing evidence bound to the final
target and head.

## 2. Evidence and key findings

- The [SDD execution-mode standard](../standards-and-best-practices/sdd-execution-modes-and-gates.md)
  defines `bounded-autonomous` as no routine human confirmation while retaining
  authorization, permissions, safety controls, evidence predicates, truthful
  completion, objective correction, and durable stop reporting.
- The [Codex Goal autonomy prerequisites plan](../plans/codex-goal-autonomy-prerequisites-implementation-plan.md)
  demonstrates the same distinction at environment level: prerequisite work
  can run continuously, but the Goal setup is complete only after its final
  evidence set proves the profile, sandbox, credentials boundary, preflight,
  and rehearsal outcomes.
- The [same-session review brief](prototype-rapid-same-session-review.md)
  establishes that prototype review can be explicit local-review evidence
  without claiming independent, isolated, strict, or production assurance.
- The [durable-execution and work-unit brief](autonomous-sdd-durable-execution-and-isolated-work-units.md)
  recommends a local-first domain kernel with exhaustive outcomes, current
  evidence, and restart-by-reconciliation. This interim profile should use
  compatible concepts rather than create a competing runner.
- The current resolver, operation checker, correction chain, verification
  loop, and living specifications still implement stricter prototype behavior.
  The gap therefore requires an OpenSpec change; this brief alone does not
  alter runtime behavior.
- Removing all checks would reduce latency but make completion untruthful.
  Removing only human-pause gates while retaining continuous correction and
  mandatory completion evidence provides the intended balance.

## 3. Options considered and tradeoffs

1. **Implement an interim frictionless autonomous-prototype profile.** Use a
   same-session review worker, continuous quality actions, automatic objective
   correction, and mandatory completion evidence. This is recommended because
   it enables useful autonomous delivery now while remaining compatible with
   the future runtime architecture.
2. **Implement only same-session review.** This is smaller, but it leaves the
   other routine lifecycle pauses intact and does not meet the frictionless
   outcome.
3. **Wait for the complete runtime kernel and production profile.** This gives
   the cleanest eventual implementation, but prevents autonomous prototype
   work during a larger multi-milestone effort.
4. **Remove review, checks, or evidence enforcement.** This is fastest but
   rejected because attempted actions would be mistaken for passing quality
   and completion could hide regressions.
5. **Allow unbounded correction retries.** This avoids an arbitrary aggregate
   attempt count but is rejected because one stable failure could loop forever.
   The selected design allows continued progress across distinct failures while
   preserving a bounded budget for each canonical signature.

## 4. Decisions, assumptions, and owner

### Owner-confirmed decisions

Decision owner: Joe Rice

1. Apply this interim contract only when executionMode is bounded-autonomous
   and qualityProfile is prototype-rapid.
2. Keep owner-checkpointed delivery and production-rapid delivery behavior
   unchanged.
3. Remove routine human approval pauses from the authorized prototype
   lifecycle while retaining every authorization, permission, safety, scope,
   and evidence predicate.
4. Run focused tests, critical-flow checks, requirement mapping, local code and
   security review, OpenSpec Verify, strict OpenSpec validation, and authorized
   lifecycle reconciliation as continuous required quality actions.
5. Require current passing completion evidence bound to the final target and
   head before reporting success.
6. Use a bounded same-session review worker whose results are local-review
   evidence only and never independent, isolated, strict, or production
   assurance.
7. Route safe objective failures into automatic
   diagnose-correct-retest-rereview work.
8. Permit more than three corrections across a run when they belong to
   distinct canonical failure signatures, while retaining at most three
   materially different attempts for any one stable signature.
9. Pause only at the standard stopping conditions or when a stable failure
   signature exhausts its correction budget.
10. Treat this contract as an interim frictionless path that aligns with,
    rather than replaces, the planned local-first runtime kernel and future
    fully implemented production-rapid profile.

Approval evidence:

- Approved by: Joe Rice
- Approved at: `2026-08-18T17:23:55.000Z`
- Decision SHA-256: `043b0e2571e981d3bedeab21ac41f7e8f36657dfd78077b8ffdfedfcb9ca57a7`
- Digest input: the ordered decisions above and the recommendation in section
  7, bound to the decision owner.

Follow-up owner confirmation on 2026-08-18: the approved frictionless profile
must also prevent a second skill-level publication approval from blocking
future exact authorized issue intake. The selected design SHALL bind the
reviewed issue payload and create-or-reuse operation durably while preserving
host runtime permission as a separate fail-closed boundary; it SHALL NOT claim
that a skill can override host policy.

### Completion-evidence model

Human approval, quality execution, and successful completion are separate:

```text
blockingApprovalGates: []

requiredQualityActions:
  - focused tests or integration checks
  - critical-flow checks
  - requirement-to-evidence mapping
  - local code and security review
  - OpenSpec Verify
  - strict OpenSpec validation
  - authorized lifecycle reconciliation

completionEvidencePredicates:
  - every applicable required action has a current passing result
  - results bind to the final target, package, workspace, and head
  - no unresolved objective finding remains
  - lifecycle, external-state, cleanup, and residual-state evidence required by
    the exact grant is current and valid
```

A failed quality action does not create a routine human gate. It creates
correction work. The controller may report success only after all applicable
completion-evidence predicates converge. If convergence cannot be reached
safely, the run emits the standard durable intervention report instead of a
false pass.

### Correction and stagnation model

The canonical failure signature, not the aggregate run count, owns the
three-attempt correction budget. More than three total corrections are allowed
when evidence proves they address distinct signatures. A superficial message,
path, prompt, retry, or restatement does not create a new signature.

Each correction attempt must record a supported hypothesis, the observed
failure, the bounded change, and current rerun evidence. A signature is
exhausted after three materially different unsuccessful attempts. Repeating an
attempt without new diagnostic evidence is stagnation and does not reset the
budget. An exhausted signature is a stopping condition for the current run;
the controller preserves the blocked state, evidence, and recovery guidance
instead of skipping to other work or treating the failure as resolved.

### Assumptions

- The accepted delivery request still supplies the exact target, repository,
  lifecycle mutation authority, deadline or cost budget, terminal outcome, and
  stopping conditions.
- The same-session reviewer is a bounded worker using the `base-code-review`
  contract inside the parent run. The main implementer owns corrections; the
  worker cannot approve its own output or claim independent assurance.
- A material finding includes ambiguous product behavior, conflicting
  requirements, a destructive or scope-expanding correction, an unresolved
  security or privacy tradeoff, or an operation outside the grant.
- Credential, permission, and service failures receive bounded safe diagnosis
  first. Diagnosis cannot broaden access, retrieve secrets, weaken controls, or
  convert unavailability into success.
- In a milestone- or project-autonomous scope, milestone and slice entry/exit
  information remains visible as non-blocking cadence reports. This profile
  changes the inner prototype lifecycle only; it does not create additional
  planning authority.

## 5. Scope, non-goals, constraints, dependencies, and risks

### Scope

Implement one profile-specific interim contract:

- Resolve only the exact `bounded-autonomous` plus `prototype-rapid` matrix to
  the same-session local-review policy.
- Represent routine human approvals separately from required quality actions
  and completion-evidence predicates. Do not represent the profile simply as
  `qualityGates: []`.
- Run required quality actions continuously and route objective failures to
  the main implementer for bounded correction, affected-check reruns, and
  rereview.
- Retain the canonical per-signature correction records and three-attempt
  limit while allowing continued correction across distinct signatures within
  the overall authorized deadline or cost budget.
- Preserve current exact-target authorization, operation checking, evidence
  binding, lifecycle reconciliation, durable status, and stop reporting.
- Pre-bind reviewed issue-intake payloads so an exact authorized autonomous
  prototype run does not add a separate skill-level publication prompt, while
  rejecting payload drift and preserving host permission denial.
- Update the resolver, operation checker, correction-chain behavior,
  verification validation, lifecycle controller, canonical base skills, living
  specifications, thin adapters, guidance, and deterministic fixtures needed
  for the complete profile matrix.

Acceptance evidence must prove:

1. A bounded-autonomous prototype launches no independent reviewer and emits
   no routine Plan-to-Apply or Verified-to-Close prompt.
2. Focused tests, critical flows, requirement mapping, local review, OpenSpec
   Verify, and strict validation still execute when applicable.
3. An objective test or review failure is diagnosed, corrected, retested, and
   rereviewed without a routine human pause.
4. More than three aggregate corrections across distinct canonical signatures
   can complete within the overall run bound.
5. A fourth materially different attempt for one unchanged exhausted signature
   is refused and produces a durable intervention report.
6. A superficial signature change cannot reset the correction budget.
7. Success is impossible until every applicable completion-evidence predicate
   is current, passing, and bound to the final target and head.
8. A material finding, unavailable required authority, denied permission,
   unsafe action, or exhausted run bound stops with preserved state and an
   actionable report.
9. Failed, missing, stale, or mismatched evidence is never relabeled as passed.
10. `production-rapid` and `owner-checkpointed` behavior remain unchanged.
11. Milestone/project entry and exit reports remain visible but non-blocking
    when the encompassing planning scope is autonomous.
12. Exact bound issue intake creates or reuses the configured issue without a
    second skill-level approval prompt when runtime permission is present, and
    payload drift or host denial fails closed with durable recovery evidence.

### Non-goals

- Implementing the complete runtime-kernel, isolated-work-unit, distributed
  scheduler, or strict-review transport designs.
- Weakening `production-rapid`, changing owner-checkpointed prototype behavior,
  or treating local review as independent assurance.
- Removing tests, security review, requirement verification, OpenSpec
  validation, completion evidence, audit evidence, or truthful failure status.
- Allowing scope expansion, destructive workarounds, credential or permission
  bypass, secret exposure, fabricated evidence, or completion with unresolved
  objective failures.
- Adding product-specific constants to reusable global assets.

### Constraints and dependencies

- The current living specifications and runtime remain authoritative until an
  approved OpenSpec change is applied and verified.
- No prompt, transcript, finding, or repository content may switch the
  effective mode or profile. Resolution comes only from validated request and
  durable authorization state.
- High-impact operations remain limited to exact targets and mutation classes
  already authorized by the delivery request and allowed by higher-level
  policy.
- Canonical behavior remains under `skills/base`; Claude and Codex wrappers
  remain thin.
- Governed changes must pass `openspec validate --all --strict` and the focused
  resolver, authorization, correction, validation, and lifecycle matrices.
- Primary implementation dependencies are
  `scripts/sdd/resolve-sdd-delivery-request.mjs`,
  `scripts/sdd/check-operation-authorization.mjs`, correction-chain and
  implementation-quality validation, lifecycle controller fixtures,
  `base-verification-loop`, `base-code-review`, `autonomous-goal-runner`, and
  the bounded-autonomous and SDD lifecycle living specifications.

### Risks

- **No-pause may be misread as no-quality.** Separate blocking human approvals,
  required quality actions, and completion evidence in both schema and tests.
- **Same-session review has correlated blind spots.** Carry the `local-review`
  label end to end and keep production on strict independent assurance.
- **Failure signatures may be manipulated to evade the budget.** Use the
  canonical deterministic signature and retain complete correction lineage.
- **Continued correction may consume excessive time.** Enforce the overall
  grant deadline or cost budget and stop on exhausted signatures or
  unsupported repetition.
- **Objective-fix classification may hide a product decision.** Use
  conservative material-judgment classification and fixtures that force a
  stop.
- **A partial implementation may clear prompts but fail later.** Exercise the
  complete resolver-to-cleanup matrix, including failure and restart paths.
- **The interim design may diverge from the future kernel.** Reuse its
  run/evidence/outcome/status vocabulary and treat later migration as a
  versioned compatibility change rather than creating a parallel controller.

## 6. Open questions and blocking decisions

No product decision blocks Propose. The following are implementation design
details that Propose must make explicit without changing the selected behavior:

- Select final schema names for blocking human approvals, required quality
  actions, and completion-evidence predicates. The semantic separation is
  fixed even if the field names differ.
- Decide whether the existing `independentReviewPolicy` field temporarily
  accepts `same-session-agent` or a versioned request schema introduces the
  more accurate `reviewPolicy` name immediately.
- Define the deterministic canonical-signature and stagnation fixtures using
  the existing correction-chain owner; do not introduce a second retry ledger.
- Define the migration trigger from this interim profile to the completed
  runtime kernel and fully implemented production profile. Migration must not
  silently upgrade, downgrade, or reinterpret an already admitted run.

Any proposal that removes completion evidence, expands the correction budget
for one stable signature, changes owner-checkpointed or production behavior, or
creates another controller must return to the owner.

## 7. Recommended next step

Owner-confirmed recommendation: Propose
simplify-autonomous-prototype-quality-loop as an interim bounded-autonomous
prototype profile that removes routine human pauses, continuously corrects
objective failures, requires final completion evidence, preserves the standard
per-signature safety bound, and leaves owner-checkpointed and production-rapid
behavior unchanged.

The proposal should treat
[prototype-rapid-same-session-review.md](prototype-rapid-same-session-review.md)
as partially superseded after acceptance and should align with the execution
standard, Goal prerequisites, and local-first runtime direction. The next
workflow action is OpenSpec Propose. No OpenSpec artifacts were created.
