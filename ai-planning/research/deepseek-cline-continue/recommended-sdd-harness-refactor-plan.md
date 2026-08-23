# Recommended SDD Harness Refactor Plan

Date: 2026-08-23  
Status: Recommendation for owner review; not an approved design brief, delivery
plan, authorization, or implementation instruction.

## Decision

Create a new, dedicated SDD-harness repository now. Do not finish the current
autonomous-control-plane roadmap before doing so.

Preserve the current repository as the home for reusable global skills and as
an evidence-rich reference implementation. Stabilize and freeze its live
autonomous-controller state, but do not begin M2 or later control-plane
milestones in the existing architecture.

The new repository starts with a small vertical slice that proves the intended
product: a complete OpenSpec/GitHub-traceable change can run under one of two
explicit policies, using narrow agent roles and an independent review/fix
loop. It must not begin by recreating a general workflow engine.

## Why refactor now

The current repository is at a natural boundary:

- Its three M1 contract slices are delivered and archived.
- There are no active OpenSpec changes in this checkout.
- M2-S1 is the next planned slice, but it begins a local durable execution
  backend with locking, claims, takeover, history, filesystem admission, and
  a stated build-versus-adopt complexity tripwire.
- The roadmap reaches qualified single-change autonomous ownership only after
  M4-S4, and default control-plane routing only after M6-S3.

The current root-cause analysis found that three planned M1 slices produced a
chain of repair work because a partial controller became operational before a
complete lifecycle could initialize, finish, release, clean up, and recover a
run. That is a release-sequencing failure worth preserving as a test corpus,
not a reason to continue expanding the same controller before the intended
product has been validated.

Source inputs:

- [Autonomous reliability-control-plane roadmap](../../plans/autonomous-sdd-reliability-control-plane-roadmap.md)
- [M2-S1 local-backend brief](../../design-briefs/autonomous-sdd-reliability-control-plane/m2-s1-local-durable-execution-backend.md)
- [Blocker root-cause analysis](../../notes/autonomous-sdd/milestone-blocker-root-cause-analysis/milestone-blocker-root-cause-analysis-findings.md)
- [Cline and multi-model workflow draft](sdd-workflow-with-deepseek-and-cline.md)

## Target repository boundaries

```text
global AI-skills repository
  - portable skills and thin platform wrappers
  - no canonical autonomous-controller implementation
  - may publish adapters that invoke a versioned harness interface

SDD-harness repository
  - lifecycle state model and policy evaluator
  - role/context manifests, evidence and reviewer-finding contracts
  - deterministic command runner and GitHub/OpenSpec adapters
  - fixture projects, contract tests, and end-to-end evaluations

application repository (mobile, React, Spring Boot, etc.)
  - application architecture, tests, OpenSpec changes, and product context
  - project-owned GitHub configuration and credentials/authentication setup
  - a pinned SDD-harness version and minimal integration configuration
```

The harness must never hard-code an application repository, GitHub Project,
branch convention, label, credential, or framework. The application owns
those values through supported configuration and its own repository policy.

## Shared lifecycle and profiles

Both policies use the same observable lifecycle and traceability:

```text
Issue / Project item
  -> proposal, delta spec, design, tasks
  -> implementation
  -> verification and independent review
  -> pull request and delivery
  -> Sync
  -> Archive
```

They differ in authority, not in whether evidence exists.

| Concern | `production` | `prototype` |
| --- | --- | --- |
| Planning | Human approval before implementation | Explicit preauthorization permits progression |
| Implementation and quality | Agents assist; humans approve declared gates | Agents progress through declared automatic gates |
| Review | Independent review plus required human decisions | Independent review blocks on unresolved findings; no routine human prompt |
| GitHub traceability | Issue, Project, PR, Sync, Archive | Same records and lifecycle states |
| External mutation | Just-in-time human authorization | Exact, expiring, scoped preauthorization |
| Completion | Human-approved delivery policy | Automatic only when all deterministic and review gates converge |

Prototype mode is not unrestricted "YOLO" execution. It must have an exact
change target, permitted GitHub actions, expiration, correction budget, spend
or duration limit, and stop conditions. A profile name alone is never
authority to merge, delete branches, close issues, or archive a change.

## Minimal agent harness

The first implementation should use roles with deliberately scoped context:

```text
planner
  requirements + selected product context
    -> proposal/spec/design/tasks

implementer
  approved plan + affected source/test context
    -> patch and command evidence

verification worker
  declared deterministic checks + repository commands
    -> normalized test/lint/typecheck/spec-validation results

independent reviewer (read-only, fresh session)
  sealed requirements + relevant source + diff + verification evidence
    -> typed findings and disposition requirements

controller
  state, authorization, digests, and allowed transitions only
    -> next legal action or typed stop
```

Reviewer independence means a separate agent/session and a sealed immutable
review package. The reviewer may inspect requirements, relevant code, the
diff, and test evidence, but does not receive the implementer's hidden
reasoning or modify code. It returns structured findings rather than fixes.
After a material change, rerun affected deterministic checks and obtain fresh
review evidence. Reuse of a review is allowed only for the identical sealed
package and code head.

Run specialized security or architecture review when a declared risk rule
selects it. Do not mandate multiple specialist agents for a low-risk
documentation change merely to make the harness look comprehensive.

## Migration rules

Migrate requirements, evidence, and focused tests—not the old controller's
implementation by default.

| Preserve and adapt | Do not copy into v1 |
| --- | --- |
| Two policy modes and the common lifecycle | Legacy-controller record compatibility paths |
| Explicit authorization and pause semantics | Bootstrap terminalization/migration mechanics |
| Sealed independent-review inputs | Multi-generation activation and cutover machinery |
| Structured evidence and fresh-review-on-change rule | Queue, child-slice composition, and Temporal support |
| Regression cases for stale heads, stranded claims, auth boundaries, and overlapping specs | Controller-specific cleanup and inventory code |
| Thin global-skill exposure pattern | Framework/product-specific constants |

The existing repair worktrees and unpublished controller fixes remain
quarantined evidence until explicitly evaluated by a new harness change. They
are not a code-migration source.

## Phased refactor plan

### Phase 0 — Stabilize and freeze the legacy controller

Outcome: the existing repository is safe to preserve as a reference, without
starting another generation of its autonomous-control-plane roadmap.

Scope:

- Inventory current branches, worktrees, controller records, claims, runtime
  installations, active OpenSpec state, and uncommitted repair work.
- Resolve or explicitly retire only existing live controller/claim state using
  a bounded, evidence-backed recovery. Do not hand-edit durable records or
  delete uncertain resources.
- Preserve the roadmap, decisions, root-cause analysis, failure evidence, and
  relevant test fixtures in a clearly named legacy/reference area.
- Declare M2 through M7 not selected for further implementation in this
  repository.

Non-goals:

- Finishing M2-S1 or later milestones.
- Porting controller code while closing legacy state.
- Rewriting global skills.

Acceptance evidence:

- No ambiguous active controller or claim remains silently blocking future
  work; anything unresolved has an explicit recorded stop condition and owner
  action.
- User-owned dirty worktrees are preserved and classified, not cleaned by
  inference.
- The legacy/reference boundary and source inventory are reviewable.

Profile: `production`; this phase can affect existing local and GitHub
delivery state and therefore requires human approval for each external or
destructive action.

### Phase 1 — Establish the new harness contract

Outcome: a small harness repository defines one lifecycle state model, the two
policy profiles, role/context manifests, structured evidence, and a stable
adapter boundary.

Scope:

- Define lifecycle states and the allowed transition table.
- Define per-transition authorization and evidence requirements for
  `production` and `prototype`.
- Define sealed review-package, finding, verification-result, and terminal
  receipt schemas.
- Define product configuration boundaries and a versioned adapter interface
  for global skill wrappers.
- Create fixtures and tests for invalid transitions, expired authorization,
  stale review, and unknown outcomes.

Non-goals:

- GitHub mutation, auto-merge, queues, durable multi-host orchestration,
  generalized retries, or any runtime replacement for a workflow engine.

Acceptance evidence:

- A state-transition test suite proves every allowed and rejected transition.
- A profile matrix demonstrates the same lifecycle facts with different human
  approval requirements.
- The harness accepts no product-specific constants in its canonical code.

Recommended first proposed OpenSpec change:
`establish-minimal-sdd-harness-contract`.

Profile: `production`; it establishes a reusable governance/runtime contract.

### Phase 2 — Prove one local end-to-end vertical slice

Outcome: a fixture repository completes the full lifecycle without GitHub
mutation: artifacts, implementation patch, deterministic verification,
independent review/fix loop, Sync simulation, and Archive simulation.

Scope:

- Execute one bounded change through the state machine.
- Use a separate reviewer session with a sealed package and typed findings.
- Prove a material fix invalidates the old review and triggers a fresh review.
- Make controller output limited to explicit legal next actions and typed stop
  reasons.

Non-goals:

- Running multiple changes concurrently.
- Autonomous cleanup, worktree ownership, or durable background workers.

Acceptance evidence:

- A successful path and a failing-review/recovery path both converge exactly
  as expected.
- Context manifests show each role received only its declared inputs.
- Tests prove review cannot be marked current for a changed head.

Profile: `prototype` for a disposable fixture only; all mutation stays inside
the fixture workspace and predefined test environment.

### Phase 3 — Add production GitHub integration and human gates

Outcome: one real low-risk application change uses the harness to create or
reuse its Issue/Project item, create a PR, and proceed only through explicit
human approvals.

Scope:

- Implement project-owned configuration for GitHub identifiers and policies.
- Implement exact operation receipts and non-secret authentication preflight.
- Add named human approval states for plan, delivery/merge, and closeout.
- Preserve OpenSpec Sync and Archive as separate evidence-bearing stages.

Non-goals:

- Prototype auto-merge.
- Reusable storage or credentials outside the project-owned integration.

Acceptance evidence:

- One low-risk application change has complete issue, Project, PR, Sync, and
  Archive linkage.
- Attempts to cross a human gate without its recorded approval stop safely.
- Authentication evidence never exposes a credential and is operation-bound.

Profile: `production`.

### Phase 4 — Qualify prototype autonomy on low-risk real changes

Outcome: a small set of explicitly preauthorized, low-stakes application
changes completes without routine human intervention while retaining the same
traceability and independent quality gates.

Scope:

- Add exact prototype authorization: change, allowed actions, expiration,
  correction budget, cost/time budget, and recovery behavior.
- Permit automatic Issue/Project/PR progression only where explicitly
  authorized.
- Run the independent code review for every qualifying change and add
  risk-selected security/architecture review.
- Define the policy for merge, issue close, Sync, Archive, and topic-branch
  retention separately; do not infer that they are automatically authorized.

Non-goals:

- Default autonomy for all repositories.
- Multi-change queues, parallel implementation, or self-healing cleanup.

Acceptance evidence:

- Several representative low-risk changes complete with no unresolved
  findings, stale evidence, or unexpected external mutation.
- Injected failures exhaust the correction budget or yield a typed pause;
  they never cause a hidden bypass.
- Every automatic GitHub action has a current, exact authorization receipt.

Profile: `prototype`, but each execution requires a separate bounded grant.

### Phase 5 — Publish adapters and broaden only from measured need

Outcome: applications can pin a harness release, and the global skills
repository exposes thin adapters without duplicating lifecycle behavior.

Scope:

- Version and publish the stable harness interface.
- Update global-skill wrappers to delegate to the installed harness.
- Add reference integrations for React, mobile, and Spring Boot repositories.
- Measure cycle time, human intervention, reviewer findings, false stops, and
  recovery outcomes before proposing advanced features.

Non-goals:

- Reintroducing the old M2–M7 roadmap wholesale.
- Adding a queue, distributed backend, or parallelism without evidence that a
  validated v1 cannot meet the need.

Acceptance evidence:

- Each reference integration pins a version and keeps product-specific values
  outside the harness.
- A global wrapper is demonstrably thin and invokes only the published
  contract.
- Any proposed advanced feature is tied to a measured limitation and a new
  accepted design brief.

## Decisions required before implementation

The following decisions are necessary before Phase 1 or later implementation;
this document does not make them:

1. Whether prototype mode may auto-merge, close issues, Sync, Archive, or
   delete merged branches—or must stop with a ready-for-human-closeout state.
2. The exact risk classifier that selects security and architecture review.
3. The supported execution hosts and identity/authentication broker boundary
   for GitHub mutation.
4. The minimum number and type of real prototype pilots required before
   broader adoption.
5. Ownership, release process, and compatibility policy for the new harness
   repository and its global-skill adapters.

## Recommended next action

Approve or revise this direction first. If accepted, create the new harness
repository and begin an OpenSpec Explore for the proposed
`establish-minimal-sdd-harness-contract` change. That exploration should read
this document, the current root-cause analysis, the two relevant M1 contracts,
and the intended application-integration requirements before a proposal is
created.

No implementation, repository creation, GitHub write, migration, or cleanup
is authorized by this recommendation.
