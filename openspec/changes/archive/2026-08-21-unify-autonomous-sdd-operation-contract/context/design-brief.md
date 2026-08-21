# M1-S2 — Operation, Profile, Gate, and Outcome Contract

Date: 2026-08-20
Status: Proposal-ready; owner answers for Q1-Q6 recorded; no OpenSpec artifacts exist.
Proposed change: `unify-autonomous-sdd-operation-contract`

## 1. Problem and desired outcome
Problem: Operations, profiles, gates, target kinds, and result classifications do not share one executable vocabulary.
Desired outcome: One typed operation graph deterministically maps every emitted outcome to continuation, correction, pause, or terminal behavior.

## 2. Evidence and key findings
- [Harness research](../../research/autonomous-agent-harness-landscape-2026/findings.md)
  supports deterministic control boundaries, least-authority workers,
  observable evidence, fault injection, and bounded recovery.
- The [main design](../autonomous-sdd-reliability-control-plane.md) supplies
  the shared architecture, invariants, role boundaries, and accepted sequencing
  that this slice must preserve.
- The [roadmap](../../plans/autonomous-sdd-reliability-control-plane-roadmap.md)
  is the authority for this slice's dependencies, readiness, execution order,
  and containing milestone exit evidence.

## 3. Options considered and tradeoffs

- Keep per-skill policy. This minimizes immediate migration work, but leaves
  competing operation names, profile semantics, and retry decisions in place.
  The controller would still have to interpret model- or skill-produced policy,
  so this does not solve the reliability problem.
- Centralize only error codes. This improves diagnostics, but target kinds,
  evidence freshness, authorization, correction, and terminal behavior can
  still disagree. An error registry without a transition registry is
  insufficient.
- Unify operations, profiles, gates, authorization, evidence, and outcomes.
  This requires adapter migration and compatibility fixtures, but gives the
  controller one enforceable policy surface. This is the recommended option.

## 4. Decisions, assumptions, and owner
- Owner: Initiative owner; profile and review-reuse policy require owner acceptance.
- Confirmed architectural direction: Operations, profiles, authorization,
  gates, evidence, and outcome disposition use one typed vocabulary; unknown
  production outcomes pause safely with retained evidence;
  `deliveryAuthorization` and `applyEligibility` are separate controls.
- Owner-provided answers recorded on 2026-08-20: use `same-session-local` for
  autonomous `prototype-rapid`; make `reviewPolicy` the
  canonical request field; permit exact-head review reuse only when the sealed
  package digest and associated review inputs remain current; enforce strict
  review readiness before Apply; use compact public lifecycle stages with
  typed internal operations; and add a canonical `agentPolicy` input whose
  default is `auto` for autonomous `prototype-rapid` and `multi-agent` for
  `production-rapid`, with explicit user overrides honored.
  These are recorded as owner answers; a formal confirmation receipt/digest is
  not yet captured.
- Approval evidence: The owner accepted the shared-control-plane direction and
  requested this brief. Owner answers for Q1-Q6 are recorded here; a formal
  confirmation receipt/digest is not yet captured.
- Owner direction for the completed refactor: one user-facing autonomous goal
  should be able to resolve an exact design brief, enter Propose, and continue
  through Apply, review, Verify, delivery, and closeout without routine phase
  prompts. The controller must still preserve Propose and Apply as separate
  internal authorization and evidence gates. A standalone Propose request
  remains planning-only.
- Assumptions: Existing lifecycle skills become fixed adapters rather than
  alternate policy owners.

## 5. Scope, non-goals, constraints, dependencies, and risks
- Scope: M1-S2 operation graph, profile semantics, gate predicates, correction paths, and outcome registry.
- Scope also includes the role-topology policy used to select separated or
  collapsed agent contexts for a run.
- Non-goals: Invoking adapters, redesigning review transport, or performing external mutations.
- Constraints: Every emitted outcome must have one machine-readable disposition;
  correction budgets and human-only decisions cannot be inferred by a model.
- Dependencies: M1-S1 contract boundaries. The M1-S2 profile and role-agent
  policy decisions are recorded; implementation still depends on M1-S1
  contract artifacts.
- Constraint: A future full-lifecycle goal may span multiple internal phases,
  but it must carry one explicit bounded grant while preserving each phase's
  typed authorization, eligibility, evidence, and recovery checks.
- Risks: A registry that is too broad becomes brittle, while gaps or competing
  vocabularies recreate unsafe conversational routing.

### Proposed contract

- One registry defines operation name, target/record kinds, allowed profiles,
  prerequisites, freshness, authorization, runtime permission, required claim,
  adapter, write-ahead behavior, evidence, and terminal disposition.
- The compact lifecycle remains admitted, planned, evidence-ready, applied,
  reviewed, verified, closing, and complete; helper steps are not new states.
- `deliveryAuthorization` seals conditional lifecycle authority at admission;
  deterministic `applyEligibility` evaluates post-planning readiness.
- Every emitted production outcome maps once to retry, objective correction,
  human decision, terminal failure, or completion. Unknown outcomes pause and
  cannot retry or mutate.

### Acceptance evidence

- Contract tests reject wrong target kinds, stale evidence, missing claims,
  expired authority, invalid profile combinations, and out-of-order operations.
- Every external operation has exactly one observe-before-retry path.
- Correction paths are reachable and bounded per canonical failure signature.
- Prototype and production profiles yield one documented quality/review policy,
  with zero routine prompts inside a valid autonomous grant.
- Agent-topology fixtures prove that omitted `agentPolicy` uses deterministic
  conservative classification, while explicit `multi-agent` or `single-agent`
  input is honored without running the trivial/non-trivial classifier. The
  selected topology is included in the effective-authorization digest and
  cannot weaken any quality, authorization, review, or safety gate.

## 6. Open questions and blocking decisions

The following decision records define the accepted direction for the slice.
They remain implementation inputs rather than OpenSpec artifacts.

### M1-S2-Q1 — What review policy does `prototype-rapid` mean?

| Action | Impact | Tradeoffs |
|---|---|---|
| Keep `strict-first-degraded` | Prototype runs attempt isolated review and may use the existing authorized degraded path. | Stronger assurance, but more latency and environment dependence; it preserves the original profile mismatch and makes “prototype” carry production review machinery. |
| Adopt `same-session-local` | Prototype runs require focused checks, critical-flow evidence, and implementer-session local review; they never emit independent-review evidence. | Faster and already aligned with the verification profile and archived resolver behavior, but it has correlated blind spots and cannot satisfy production assurance. |
| Make review optional for prototypes | Removes the profile conflict by dropping the review field or gate. | Lowest friction, but creates an implicit quality gap and makes completion depend on omission rather than evidence. |

Recommendation: adopt `same-session-local`. Keep strict isolated review and
authorized degraded review exclusive to production-compatible policies, and
reject incompatible profile/policy pairs before mutation.

Owner answer: Accepted. Autonomous `prototype-rapid` uses
`same-session-local`; this is a lower-assurance local review and never
satisfies a production independent-review gate.

### M1-S2-Q2 — What is the public request-field compatibility policy?

| Action | Impact | Tradeoffs |
|---|---|---|
| Keep `independentReviewPolicy` as the permanent public name | No caller migration. | The name is inaccurate for same-session review and invites downstream code to treat local review as independent. |
| Make `reviewPolicy` canonical and accept the old name temporarily | New records describe their actual assurance; existing strict callers can migrate. | Requires a compatibility projection and deprecation tests, but keeps the durable contract unambiguous. |
| Expose both fields as independent authorities | Existing and new callers remain superficially supported. | Creates contradictory inputs and a second authority; unsafe. |

Recommendation: make `reviewPolicy` canonical; accept the legacy field only for
`strict-only` and `strict-first-degraded`, reject contradictory dual inputs,
and never accept `same-session-local` under the legacy independent-review
name.

Owner answer: Accepted. `reviewPolicy` is canonical, with the bounded legacy
compatibility behavior described above.

### M1-S2-Q3 — When may a strict review be reused for closeout?

| Action | Impact | Tradeoffs |
|---|---|---|
| Require a fresh review for merge, Sync, Archive, and cleanup | Every high-impact transition has a new reviewer record. | Maximum freshness, but duplicates assurance for external-only actions and increases unavailable-review failure points. |
| Reuse a current exact-head review for external-only transitions | Merge, Sync, Archive, and cleanup can consume one durable review lineage when no review-relevant input changed. | Efficient and consistent with the architecture, but requires a precise invalidation predicate and durable digest checks. |
| Reuse any review from the same commit | Simple commit comparison. | Unsafe when OpenSpec artifacts, Apply evidence, or other review-relevant inputs changed without changing the selected commit. |

Recommendation: reuse only when the sealed package digest, exact tree/head,
review-relevant artifact manifest, Apply evidence, dispositions, and required
profile gates still match. Any code, review-relevant artifact, evidence, or
assurance-policy change invalidates the result and requires a fresh review.
Cleanup may reuse the result because it changes no reviewed content; every
external action still needs its own current state, authorization, and
reconciliation evidence.

Owner answer: Accepted. Reuse is conditional on the sealed package digest and
the associated exact-head, artifact, Apply-evidence, disposition, and gate
bindings remaining current.

### M1-S2-Q4 — Where must strict-review readiness be enforced?

| Action | Impact | Tradeoffs |
|---|---|---|
| Preflight the mandatory assurance path before Apply | A strict-only run stops before implementation when the required reviewer path cannot work. | Avoids wasted mutation and makes the stop explainable; readiness can become stricter and must distinguish capability expectation from live permission. |
| Discover review availability only after Apply | Keeps admission lightweight. | Can produce an applied change with no eligible assurance path and violates the fail-closed production boundary. |
| Substitute local review when strict review is unavailable | Keeps the run moving. | Downgrades assurance without authorization and must be rejected. |

Recommendation: enforce readiness before Apply. `strict-only` requires a viable
strict path; `strict-first-degraded` may proceed only when its exact degraded
authorization and recovery prerequisites are already valid; no local review
can satisfy a production gate.

Owner answer: Accepted. Mandatory review readiness is enforced before Apply;
local prototype review cannot satisfy a production gate.

### M1-S2-Q5 — Should helper steps be public transitions?

| Action | Impact | Tradeoffs |
|---|---|---|
| Expose every helper as a workflow state | Maximum observability at the state level. | Creates a large graph, more recovery edges, and more opportunities for competing policy. |
| Keep compact lifecycle stages with typed internal operations | The controller owns a small deterministic graph while attempts and outcomes retain detailed evidence. | Requires good attempt records and projections, but matches the accepted behavioral spine and is easier to verify. |
| Keep free-form skill names and map them at runtime | Minimal migration. | Reintroduces location- and caller-dependent vocabulary and cannot guarantee one next transition. |

Recommendation: use compact public stages—admitted, planned, evidence-ready,
applied, reviewed, verified, closing, complete—with typed internal operations
and immutable attempts. Final operation names and outcome codes can be fixed in
the proposal from this decision matrix; a separate Explore phase is not needed
for vocabulary invention.

Owner answer: Accepted. The public lifecycle uses compact stages; helper work is
represented by typed internal operations and immutable attempts.

### M1-S2-Q6 — Who chooses the agent topology for a prototype?

| Action | Impact | Tradeoffs |
|---|---|---|
| Let the controller classify automatically | The controller uses deterministic signals and conservative escalation: clear simple work may use one context; complex, risky, or uncertain work uses separated role agents. | Avoids asking the user for another choice, but adds classification rules and may spend extra tokens on work that the user considers simple. |
| Let an LLM decide whether work is trivial | Flexible and easy to describe. | Non-deterministic across runs and models; the same change could receive different role topology. Not recommended. |
| Let the user choose a canonical topology at goal/prompt time | The user explicitly requests `multi-agent` or `single-agent`; the controller honors that choice without classifying triviality. | Gives the user direct control and predictable token cost, but the user accepts the associated context and cost tradeoff. It does not bypass authorization, evidence, review, or safety gates. |

Owner answer: Accepted. Add `agentPolicy` to the normalized request and durable
effective authorization with these values:

- `auto` — default; use deterministic classification with conservative
  escalation.
- `multi-agent` — use separate role-scoped agent contexts for applicable
  planning, test/evidence, implementation, and local-review work.
- `single-agent` — keep role work in one agent context; controller-owned test
  execution, validation, durable state, authorization, and external operations
  remain separate mechanical controls.

Profile defaults:

- Autonomous `prototype-rapid` defaults to `auto`.
- `production-rapid` defaults to `multi-agent`.
- An explicit user-supplied `agentPolicy` overrides the profile default.

The explicit override is recorded in the normalized authorization and is not
replaced by later complexity classification.

When the user explicitly supplies `multi-agent` or `single-agent` at goal time
or prompt time, the controller must not classify the change as trivial or
non-trivial for topology selection. It records the explicit source and honors
the selected policy. Natural-language input may be accepted at the boundary,
but it must normalize to the canonical field before admission. A topology
choice is immutable for the admitted run; changing it requires a new or
explicitly re-admitted run. The choice changes context separation and token
cost, not the required gates or mutation authority.

## 7. Recommended next step

Recommendation: run OpenSpec Propose for
`unify-autonomous-sdd-operation-contract`. The proposal should define the
profile matrix, `agentPolicy` normalization and classifier, compact stage
graph, review-reuse invalidation predicate, and one-to-one outcome disposition
table, then add failing-before/fixed-after fixtures for each blocking boundary.
No OpenSpec artifacts have been created.
