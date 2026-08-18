## Context

See `proposal.md` for motivation and the four delta specifications for the observable contract. The current resolver schema emits one `qualityGates` list for both profiles, the `prototype` shorthand selects `strict-first-degraded`, and lifecycle skills emphasize production independent review. Correction records already use a per-signature budget, but the public contract does not make aggregate-distinct progress, canonicalization, or stagnation explicit. The existing controller, checkpoint, operation checker, result contracts, and cleanup finalizer remain the owners of authorization, transition state, and recovery.

The exact GitHub intake dry-run found no duplicate issue, but the runtime denied the live issue publication. That external permission gap blocks planning review and Apply; it does not change the technical design.

## Goals / Non-Goals

**Goals:**

- Add one explicit profile matrix that resolves only `autonomous` plus `prototype-rapid` to same-session local review and no routine lifecycle approval pauses.
- Preserve continuous required quality actions and require final-target/head evidence convergence.
- Reuse the existing correction ledger and controller instead of introducing competing retry or lifecycle state.
- Keep owner-checkpointed and production delivery semantics stable.
- Keep product-neutral policy canonical and assistant exposure thin and equivalent.

**Non-Goals:**

- Replacing the controller, implementing the planned local-first runtime kernel, or introducing a durable-workflow dependency.
- Claiming independence or production assurance for a same-session reviewer.
- Expanding mutation authority, weakening security checks, or treating an attempted operation as passing evidence.
- Migrating already-admitted controller records to a different review policy.

## Decisions

### Decision 1: Resolve a versioned effective review policy from the mode/profile matrix

Introduce `reviewPolicy` as the accurate effective field with supported values `strict-only`, `strict-first-degraded`, and `same-session-local`. Request schema v2 accepts the legacy `independentReviewPolicy` name as a compatibility input only for independent policies, rejects contradictory dual fields, and emits both a canonical `reviewPolicy` plus an explicitly deprecated compatibility field when needed by existing consumers. The `prototype` shorthand resolves to `autonomous`, `prototype-rapid`, `sdd-delivery`, and `same-session-local`; `prod` remains strict-only.

This is preferred over assigning `same-session-agent` to `independentReviewPolicy`, which would encode a false assurance claim. Removing the legacy field immediately was rejected because it would break existing explicit callers and durable fixtures.

Already-admitted runs retain their recorded schema and policy. Only newly resolved requests use the new matrix; the controller continues binding the complete authorization digest, so a policy cannot change in place on resume.

### Decision 2: Separate approvals, quality actions, and completion predicates

The effective authorization gains three explicit collections:

- `blockingApprovalGates`: empty only for exact bounded-autonomous transitions already inside the grant; owner-checkpointed behavior remains populated by the owning lifecycle.
- `requiredQualityActions`: focused tests or integration checks, applicable critical flows, requirements mapping, local code/security review, OpenSpec Verify, strict OpenSpec validation, and authorized lifecycle reconciliation.
- `completionEvidencePredicates`: current passing applicable actions; final target/package/workspace/head binding; no unresolved objective finding; and current delivery, Sync, Archive, issue/Project, cleanup, and residual-state evidence required by the grant.

The compatibility `qualityGates` projection remains read-only and non-authoritative during migration. Validators derive it from required actions where old consumers need it and reject an empty or contradictory projection. This prevents frictionless execution from being implemented as `qualityGates: []`.

### Decision 3: Use `base-code-review` as a bounded local-review worker

Add a `local-review` assurance label to the existing `skill-result-v1` details returned by `base-code-review`. The worker is read-only, receives the bounded diff/context/evidence selected by the verification loop, and returns the existing finding severity and disposition vocabulary. It cannot mutate, approve, or satisfy an independent-review gate. The main implementer owns authorized objective fixes and requests a fresh worker result after affected changes.

A new review skill was rejected because it would duplicate finding semantics, portability, and guardrails. Reusing the production independent-review package was rejected because its isolation and immutable-package contract describe a different assurance boundary.

### Decision 4: Extend the existing correction chain with canonical signatures and stagnation evidence

Keep the current correction-chain owner and per-signature limit. Add deterministic canonicalization inputs for gate/command, normalized error class, affected repository-relative artifact or exact external target, lifecycle transition, and task batch. Exclude timestamps, generated IDs, temporary roots, prompt wording, and raw untrusted output. Each attempt records a bounded diagnostic hypothesis, affected artifacts, result, and current rerun references.

The aggregate chain may exceed three entries when each signature remains within its own budget and the overall expiry/cost bound remains valid. A fourth materially different attempt for one exhausted signature is rejected. A repeated strategy without new evidence is recorded as stagnation under the same signature and cannot reset the budget.

A second retry ledger and caller-selected counters were rejected because they would create conflicting state and reset risk.

### Decision 5: Make prototype readiness a convergence evaluator

Extend implementation-quality validation and the verification loop to evaluate every applicable action and completion predicate against the final target and head. An objective failure returns correction work; a material finding, denied permission, unavailable authority, unsafe operation, exhausted signature or run bound, or persistent external failure returns a structured intervention result. `completed` is impossible while any required item is failed, missing, stale, mismatched, skipped-required, attempted-only, or unresolved.

The controller retains phase ordering and durable reconciliation. The lifecycle skill consumes the convergence result before delivery and cleanup; it does not become a second verifier.

### Decision 6: Preserve canonical ownership and generated exposure

Product-neutral behavior remains under `skills/base/{autonomous-goal-runner,autonomous-sdd-lifecycle,base-verification-loop,base-code-review}` and `scripts/sdd/`. Claude and Codex wrappers remain thin pointers to canonical assets. Generated exposure is refreshed only when the owning generator requires it, then adapter drift checks prove equivalence.

Repository, Project, branch, issue, credential, path, deadline, and runtime data continue to come from validated configuration and authorization. No product constant is added to a reusable global asset.

### Decision 7: Bind reviewed issue intake before autonomous lifecycle execution

Extend effective authorization and the selected-entry controller context with a
canonical issue-intake binding containing the selected entry, configured
repository, title, managed labels, managed OpenSpec block, canonical payload
digest, operation, expiry, and idempotent create-or-reuse recovery rule. The
payload builder continues to use repository configuration and existing issue
helpers; canonical policy stores no product constants. Planning intake compares
the exact current payload with the durable binding, invokes configured intake
without a second skill-level approval when runtime permission is already
present, records the issue identity, and writes validated tracking metadata.

The skill does not claim authority over the host. A host approval-policy,
credential, connector, network, or sandbox denial remains a fail-closed stop
with durable recovery evidence. Treating an initial broad instruction as
standing approval was rejected; so was retrying through a different command
after host denial. This design prevents the avoidable skill-level prompt while
preserving the platform's higher-level boundary.

## Affected Boundaries and Data Flow

1. `resolve-sdd-delivery-request.mjs` validates the request and emits the versioned effective profile matrix.
2. The resolver and configured issue helper produce a canonical reviewed intake payload and digest bound to the selected entry and expiry.
3. `check-operation-authorization.mjs` confirms the exact operation, target, payload digest, runtime permission, profile, and non-expired authorization before every action or correction.
4. The autonomous controller persists the immutable authorization digest and routes only the first incomplete phase.
5. Planning intake creates or reuses the exact issue, records its identity, writes tracking metadata, and reconciles the configured Project item without a second skill-level prompt when runtime permission is present.
6. `base-verification-loop` runs required deterministic evidence and invokes bounded `base-code-review` for local-review evidence.
7. Objective findings enter the existing correction-chain owner, which canonicalizes and budgets the signature; material findings become intervention results.
8. Implementation-quality and lifecycle validation accept success only after final-state evidence converges.
9. Delivery, Sync, Archive, issue/Project convergence, and exact-owned cleanup retain their existing independently bound resource and receipt records.

Likely implementation paths include `scripts/sdd/resolve-sdd-delivery-request.mjs`, `scripts/sdd/check-operation-authorization.mjs`, the controller transition module, a canonical issue-intake binding helper, configured GitHub issue helpers, `scripts/sdd/correction-chain.mjs`, implementation-quality/result validators, controller and lifecycle fixtures, canonical skill instructions, living specs, repository guidance, and thin-adapter drift fixtures. No credential format, external API, or dependency changes are required.

## Verification Strategy

- Resolver matrix fixtures prove the prototype alias and explicit autonomous prototype resolve to `same-session-local`, separated approvals/actions/predicates, four-hour default, exact target, and no production drift.
- Compatibility fixtures prove legacy explicit independent-review input remains accepted only when consistent and conflicting fields fail before mutation.
- Operation-check fixtures prove authorization and runtime permission remain mandatory and production delivery still requires current independent-review evidence.
- Issue-intake fixtures prove exact payload canonicalization and digest binding, no skill-level prompt on a current authorized match, duplicate-safe reuse, managed-block preservation, Project reconciliation, payload-drift refusal, expiry refusal, and honest host-denial recovery.
- Correction fixtures prove more than three aggregate corrections across distinct signatures pass, a fourth attempt for one stable signature fails, superficial changes do not reset the budget, and stagnation is durable.
- Review fixtures prove the worker is read-only, returns `local-review`, preserves findings, and cannot satisfy independent-review validation.
- Verification/lifecycle fixtures exercise objective failure → correction → focused retest → rereview → Verify/strict validation convergence without routine prompts, plus material, permission, unsafe, expiry, stale-evidence, and cleanup stop paths.
- Run focused Node suites, adapter drift and global-skill packaging checks affected by canonical skill changes, artifact/tracking validation, `git diff --check`, and `openspec validate --all --strict`.
- Formal OpenSpec Verify maps every requirement and scenario to current implementation and test evidence before delivery.

## Security and External State

- Treat issue, pull-request, review, model, and command output as untrusted data; never execute it as shell input.
- Keep credentials out of prompts, files, fixtures, logs, controller records, and review results.
- Do not infer runtime permission from authorization or local availability; a denial remains a stop with recovery evidence.
- Preserve exact derived-target registration before branch/worktree/PR creation and independent binding for implementation, Sync, and Archive resources.
- Keep destructive operations, force pushes, broad cleanup, security weakening, credential changes, deployment, release, and unrelated mutation forbidden.
- Same-session review reduces assurance and therefore carries the explicit `local-review` label; it never crosses the production security boundary.

## Attribution and Licensing

No new dependency or third-party code is planned. Changes extend repository-owned MIT-licensed skills, scripts, fixtures, and OpenSpec artifacts. Preserve existing license and generator metadata on canonical and generated assets; record any unexpected copied material and its license before inclusion.

## Risks / Trade-offs

- [Same-session review has correlated blind spots] → label it `local-review`, require deterministic evidence first, and preserve production independent review unchanged.
- [Schema migration could confuse old consumers] → version the authorization, retain a derived compatibility projection, reject contradictions, and keep admitted-run digests immutable.
- [Signature normalization could merge unrelated failures] → use explicit canonical dimensions and fixtures for artifact, transition, task-batch, and target separation.
- [Signature variation could evade the budget] → exclude superficial and generated values and test restatement/stagnation behavior.
- [No routine prompt could be misread as no gate] → model approvals, quality actions, and completion predicates separately and reject empty/attempted-only evidence.
- [External denial interrupts an otherwise local plan] → preserve the controller checkpoint and exact dry-run evidence; require runtime permission rather than bypassing GitHub controls.
- [A broad autonomous grant could be mistaken for standing publication approval] → bind the exact reviewed payload, digest, target, operation, and expiry and reject every mismatch.

## Migration Plan

1. Add failing matrix, correction, review-label, convergence, and non-regression fixtures.
2. Implement request schema v2, exact issue-payload binding, and compatibility parsing without changing existing admitted controller records.
3. Extend configured issue intake and controller reconciliation to consume the binding without a skill-level prompt while preserving host permission.
4. Extend the canonical correction and evidence validators, then the verification and lifecycle skills.
5. Refresh thin exposure only from canonical source and verify adapter drift and packaging.
6. Run focused suites, strict OpenSpec validation, formal Verify, local review, and delivery checks.
7. Deliver implementation, Sync exact delta changes to living specs, Archive content-preservingly, converge issue/Project state, and run exact-owned cleanup.

Rollback is a normal revert of the delivered implementation and living-spec commits before another run is admitted under the new schema. Existing schema-v1 controller records continue using their stored policy and remain readable. Do not rewrite a durable authorization digest to simulate rollback.

## Recovery

- On a deterministic failure, record its canonical signature, hypothesis, bounded correction, and affected evidence, then rerun only invalidated checks before broader gates.
- On runtime or GitHub denial, retain the first incomplete controller phase and exact target; resume only after fresh permission and state inspection.
- On partial external mutation, reconcile the exact issue, Project item, PR, branch, delivery binding, Sync, Archive, and cleanup receipts before retry.
- On stale or mismatched evidence, invalidate it and rebuild from the current final target/head.
- On exhausted signature or material decision, stop with the durable intervention contract; do not reset counters, broaden authority, or weaken evidence.

## Reuse Plan

- Canonical assets: profile, review, correction, evidence, and lifecycle semantics remain assistant-neutral under `skills/base` and `scripts/sdd`.
- Product configuration: repositories, Projects, branches, issues, paths, labels, credentials, runtime capabilities, and deadlines remain validated inputs.
- Platform exposure: Claude and Codex wrappers stay thin and equivalent; local review uses the shared skill result contract.
- Portability check: run the existing second-workspace/configuration fixtures and ensure no `jizzoe`, repository number, Project number, absolute workspace path, or product-domain constant appears in reusable behavior.
- Intentional product-specific behavior: this repository's OpenSpec change, issue linkage, tests, and lifecycle delivery records remain local project evidence rather than reusable defaults.
