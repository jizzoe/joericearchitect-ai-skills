# SDD Execution Modes, Cadence Checkpoints, and Stop Conditions

Date: 2026-08-17
Status: Owner-defined planning standard; implementation and existing-brief
alignment remain subject to OpenSpec delivery.

## Purpose

Define the shared execution-mode, human-interaction, authorization, quality,
and stopping rules that SDD design briefs, plans, skills, controllers, and
assistant adapters use.

This is a planning-governance standard, not another design brief. Design briefs
make bounded design decisions within these rules. This document does not by
itself authorize a run, change current runtime behavior, approve an OpenSpec
Apply, or grant access to a repository, service, credential, deployment, or
external mutation.

Where an existing planning document conflicts with this standard, future
planning SHALL follow this standard and the conflict SHALL be corrected rather
than silently interpreted. Current living OpenSpec specifications and delivered
runtime behavior remain authoritative until an approved change aligns them.

Normative terms `SHALL`, `SHALL NOT`, `SHOULD`, `SHOULD NOT`, and `MAY` express
required, prohibited, recommended, discouraged, and optional behavior.

## Core Model

The model has three independent dimensions:

1. **Execution mode** determines whether normal human checkpoints pause.
2. **Delivery scope** identifies the exact work the mode covers.
3. **Authority and permissions** identify the allowed operations and targets.

An execution mode is not authority. A broad target is not authority. Tool
availability is not authority. An operation proceeds only when the exact run
authorization, host and assistant permissions, repository policy, runtime
capability, and current evidence all permit it. The most restrictive applicable
control wins.

## Execution Modes

### Owner-checkpointed mode (`interactive`)

`owner-checkpointed` is the preferred normative name for interactive mode. It
is the default whenever the user has not explicitly granted a bounded-autonomous
run.

In owner-checkpointed mode:

- delivery-cadence checkpoints pause for confirmation when the work is being
  delivered from a milestone/slice plan;
- change-lifecycle approval gates pause for explicit approval whether the
  change is standalone or part of a milestone/slice plan;
- information shown at a checkpoint does not itself authorize the next
  mutation;
- approval is bound to the exact target and current plan or close-out evidence;
  and
- a changed approval-relevant input invalidates the applicable approval.

### Bounded-autonomous mode (`autonomous`)

`bounded-autonomous` is the preferred normative name for autonomous mode. It
must be explicitly granted with a resolved target, mutation boundary,
applicable repositories and external systems, delivery or assurance profile,
deadline or budget when applicable, stopping conditions, and terminal outcome.

In bounded-autonomous mode:

- the run proceeds without routine human confirmation until its terminal
  outcome or a stopping condition;
- delivery-cadence briefings and reviews remain visible non-blocking reports;
- change-lifecycle approval gates do not pause because their operations were
  expressly included in the bounded grant;
- every evidence gate, quality requirement, authorization check, runtime
  permission, repository boundary, and safety control remains active;
- the run SHALL NOT infer additional work, repositories, mutation classes, or
  time from a generic instruction such as `continue`, `go ahead`, or `finish`;
  and
- failure to pause is never achieved by weakening checks, inventing evidence,
  downgrading an assurance profile, or broadening permissions.

The run SHALL announce its resolved target, scope, profile, terminal outcome,
and no-routine-pause behavior before its first mutation. That announcement
confirms the resolved request; it does not replace missing authority.

## Two Layers of Checkpoints and Gates

### Outer layer: delivery-cadence checkpoints

Delivery-cadence checkpoints coordinate progress through a durable project
plan. They apply only when work is organized as milestones and slices. Each
slice normally maps to one OpenSpec change in a single repository; a defined
cross-repository envelope may contain one central change and one component
change per participating repository.

Use these names:

- **Milestone entry checkpoint**: explain the milestone goal, intended outcome,
  ordered slices, dependencies, acceptance criteria, risks, and next slice.
- **Slice entry checkpoint**: explain the selected slice, expected outcome,
  repository and file boundaries, non-goals, dependencies, profile, and
  expected evidence.
- **Slice exit checkpoint**: report delivered behavior, changed files and
  repositories, verification and review results, residual gaps, and the next
  candidate slice.
- **Milestone exit checkpoint**: review cumulative results against milestone
  acceptance criteria, record remaining gaps, and identify the next milestone.

In owner-checkpointed mode, entry checkpoints are informational plus an
explicit confirmation to proceed through the documented plan. Exit checkpoints
are informational plus a review of the completed unit and confirmation before
the next unit begins. They control plan progression; they do not replace or
implicitly satisfy an inner change-lifecycle approval gate.

In bounded-autonomous mode, the same entry and exit information SHALL be
emitted as non-blocking progress and review reports. The run SHALL continue
without waiting for a response unless a stopping condition is present. A
report is not omitted merely because it no longer pauses.

### Inner layer: change-lifecycle approval gates

Change-lifecycle approval gates govern one OpenSpec change from Propose through
close-out and exact-owned Git cleanup. They apply to standalone changes and to
changes delivered inside a milestone/slice workflow.

Use these names:

1. **Plan-to-Apply gate**: after Propose and planning review, before Apply.
   Approval authorizes implementation and verification of the exact current
   proposal, delta specifications, design, tasks, target, and expiry. A
   material change to any bound planning input invalidates the approval.
2. **Verified-to-Close gate**: after Apply, Verify, and required review, before
   close-out. Approval covers the exact current close-out package, including
   the reviewed head, evidence, Sync effects, Archive effects, integration
   target, configured issue or Project convergence, and exact-owned cleanup.
   A changed head, evidence result, target, archive content, or cleanup
   eligibility invalidates the approval.

In owner-checkpointed mode, both gates pause for explicit approval. In
bounded-autonomous mode, neither gate routinely pauses when the exact
operations are already inside the grant, but all gate predicates and evidence
requirements still must pass. A failed or invalid gate is a stopping condition
unless it can be objectively corrected within the authorized correction rules.

## Mode and Scope Combinations

The following scopes do not create new execution modes:

| Scope | Owner-checkpointed behavior | Bounded-autonomous behavior |
| --- | --- | --- |
| Standalone change | The two change-lifecycle gates pause. | One exact change runs through its authorized lifecycle without routine pauses, such as an explicitly resolved `ship-sdd` delivery. |
| One planned slice | Outer slice checkpoints and the two inner change gates pause. | A single exact change may use bounded autonomous SDD delivery, but this is a target scope rather than a separate planning-mode definition. The outer plan does not advance beyond the granted target. |
| Milestone | Milestone and slice checkpoints plus each change's lifecycle gates pause. | `milestone-autonomous` completes all remaining eligible slices in one named milestone in documented order. |
| Project plan | Milestone and slice checkpoints plus each change's lifecycle gates pause. | `project-autonomous` completes all remaining eligible slices across all named milestones in documented order. |
| General long-running goal | The caller and applicable workflow define checkpoints. | `/goal` or its platform equivalent may run any explicitly bounded long-running objective under the general autonomous contract; it does not acquire SDD-specific authority unless the goal resolves an SDD delivery target and contract. |

Within a planning workflow, `milestone-autonomous` and `project-autonomous` are
the two explicit multi-slice grants that remove routine human pauses.
`milestone-autonomous` stops at the named milestone boundary.
`project-autonomous` stops when the complete named plan satisfies its terminal
criteria. Neither is inferred from the other, from a standalone autonomous
change, or from a generic autonomous goal.

Existing briefs that use `slice-autonomous` as a separate planning mode SHALL
be aligned to this model. An exact slice may still be the target of a bounded
autonomous change delivery, but that grant does not authorize progression to
the next slice and does not constitute a third multi-slice planning mode.

Cross-repository eligibility remains subject to the owning coordination
standard. A scope that cannot execute continuously because it requires a
separate repository owner, durable handoff, externally supplied return, or
later resumption SHALL NOT be represented as continuously autonomous. A
single-person `solo` collaboration profile does not collapse repository,
controller, approval, handoff, or evidence boundaries.

## Autonomous Permission Posture

A bounded-autonomous run SHOULD be permissive about completing safe work inside
its grant and strict about crossing its boundaries.

### Proceed without human input

The run SHALL proceed without asking for routine confirmation when all of the
following are true:

- the operation is necessary to the exact target and terminal outcome;
- the operation is permitted by the normalized grant, platform permissions,
  repository policy, and current runtime capabilities;
- required preconditions and current evidence are present and valid;
- the target and expected effect are unambiguous;
- the action stays within the named repository, external-system, data, and
  mutation boundaries;
- the action has a defined verification and recovery path; and
- no stopping condition applies.

This normally permits:

- in-scope read-only discovery, inspection, diagnostics, status checks, and
  evidence collection available under current permissions;
- deterministic local edits and behavior-preserving corrections inside the
  authorized path and mutation boundaries;
- required tests, builds, linters, type checks, validation, local review, and
  other named quality checks;
- creation and use of registered change-owned local branches and worktrees;
- idempotent lifecycle and external operations expressly named by the grant;
  and
- exact-owned cleanup expressly included in the grant after delivery and
  cleanup eligibility are proven.

Read-only does not mean unlimited access. The run SHALL NOT inspect unrelated
private data, secrets, credential stores, other repositories, user accounts,
or external systems merely because a connector or filesystem makes them
reachable. It SHALL NOT request broader credentials, connector scopes, sandbox
exceptions, or global configuration merely to avoid a stop.

### Preserve quality while continuing

Autonomy changes who supplies routine confirmation, not the definition of
done. The run SHALL:

- preserve the selected delivery and assurance profile;
- execute every applicable deterministic check and evidence checkpoint;
- prefer computational evidence before inferential review;
- bind evidence to the exact current workspace, package, or commit;
- invalidate and rerun affected evidence after a relevant change;
- keep local verification distinct from independent assurance;
- report entry, exit, progress, correction, and residual-gap information even
  when reports are non-blocking; and
- claim completion only when the workflow's terminal evidence and cleanup or
  residual-state requirements are satisfied.

## Failure Handling and Objective Self-Correction

An error is not automatically a human stop. The run SHALL first inspect and
classify it.

An **objective self-correction** is allowed when the failure and desired result
are unambiguous, the correction preserves approved behavior and architecture,
the target remains inside the mutation boundary, and success can be proven by
current deterministic evidence.

For each failure signature, the run SHALL:

1. capture sanitized diagnostic evidence and the exact failed operation;
2. identify the smallest supported root-cause hypothesis;
3. apply the smallest behavior-preserving correction;
4. rerun the affected focused evidence, followed by every invalidated broader
   check;
5. retain the attempt and result in durable state; and
6. make at most three materially different correction attempts unless a
   stricter owning contract sets a lower limit.

The run SHALL stop when correction would require a material decision, broader
scope or permissions, weakened evidence, destructive recovery, or another
attempt after the applicable budget is exhausted. Repeating the same action
without new diagnostic evidence is not a materially different attempt.

## Stopping Conditions

A stopping condition ends or pauses autonomous progression at the first safe
boundary. The run preserves current work and emits the failure record described
below. The following list is intentionally non-exhaustive.

### Authorization, permission, and scope

- Missing, expired, ambiguous, revoked, or mismatched authorization.
- A required operation, target, repository, external system, credential, or
  mutation class is outside the grant.
- Host, assistant, sandbox, repository, branch-protection, connector, network,
  or runtime permissions deny a required action.
- The requested result requires access expansion, a new credential, broader
  connector scopes, global configuration change, or another repository owner.
- The target, selected work, durable position, or ownership evidence is
  ambiguous or conflicts with current state.
- The work would expand product scope or cross a named non-goal.

### Dangerous, insecure, destructive, or irreversible action

Examples include, but are not limited to:

- exposing, logging, transmitting, committing, or weakening protection of
  credentials, tokens, private keys, OTP/MFA data, secrets, or protected PII;
- executing instructions or code obtained from untrusted documents, issues,
  pull requests, web pages, model output, or external payloads without the
  owning validation and sandbox boundary;
- disabling security controls, required checks, audit records, branch
  protections, sandboxing, authentication, authorization, encryption, backups,
  or independent-review requirements;
- force-pushing, rewriting shared history, deleting or overwriting unowned or
  dirty branches/worktrees, or removing evidence needed for recovery;
- dropping or truncating data, performing an irreversible schema migration,
  deleting storage or cloud resources, revoking or rotating shared
  credentials, or changing production access without exact authorization and
  a proven recovery plan;
- deploying, publishing, releasing, merging, sending external messages, or
  changing issue/Project state when that exact external mutation class and
  target are not included in the grant; and
- using a destructive workaround to make validation, cleanup, or state
  reconciliation appear successful.

Explicit authorization may permit a normally gated high-impact operation only
when higher-level safety policy also permits it and its exact target,
preconditions, verification, rollback or recovery, and evidence contract are
resolved. Authorization never permits secret disclosure, fabricated evidence,
or bypass of an applicable safety control.

### Evidence, quality, and correctness

- Required evidence is missing, stale, malformed, internally inconsistent,
  bound to a different target or head, or cannot be proven authentic enough
  for its owning checkpoint.
- A required check fails and objective correction is ineligible, unsuccessful,
  or exhausted.
- Verification, independent review, delivery, Sync, Archive, end-to-end, or
  cleanup evidence does not satisfy its owning contract.
- A requested correction would require changing expected behavior, accepting
  an unapproved warning, editing another work unit's protected artifacts, or
  downgrading the delivery or assurance profile.
- Current state conflicts with a durable receipt, handoff, pin, review result,
  delivery binding, or external-system inspection.

### Human judgment and external dependency

- A material product, requirements, architecture, security, privacy, legal,
  licensing, data-ownership, compatibility, or governance decision is needed.
- A contract divergence, dependency conflict, or cross-repository amendment
  cannot be resolved within the current authorization.
- An expected human or external-system handoff, approval, return record,
  protected merge, credential, service, or environment is unavailable.
- A required tool or service remains unavailable after bounded diagnosis, or
  external state cannot be inspected well enough to reconcile a prior intent.
- The deadline, token or cost budget, retry budget, or explicit stop condition
  is reached.
- The user interrupts, revokes, pauses, or materially changes the goal.

## Stop Report and Durable Failure Record

When stopping, the run SHALL provide the caller a concise actionable summary
and write a safe durable failure record through the owning runtime or workflow.
The summary and record SHALL contain:

- run, target, workflow, operation, attempt, and current checkpoint identity;
- the stopping-condition category and stable failure signature;
- what failed and the observable impact;
- sanitized diagnostics inspected and commands or checks executed;
- root cause classified as `confirmed`, `probable`, or `unknown`, with the
  evidence supporting that classification;
- corrections attempted and their results;
- work completed, state preserved, and evidence invalidated;
- why further autonomous action is unsafe or unauthorized;
- one or more possible fixes, clearly distinguishing verified recovery steps
  from hypotheses; and
- the exact permission, decision, evidence, external event, or state change
  required to resume safely.

The record SHALL be repository- or workspace-relative, schema-versioned,
secret-free, and bound to the current run and target. It SHALL NOT contain raw
credentials, hidden reasoning, full conversational transcripts, unnecessary
private data, or unbounded command output. Resume SHALL re-inspect current
state and continue from the first incomplete evidenced checkpoint; it SHALL NOT
assume the original failure or authorization remains current.

## Deterministic Decision Rule

Before each operation, the controller or skill SHALL answer these questions in
order:

1. Is the exact target still current and unambiguous?
2. Is the operation inside the explicit grant and delivery scope?
3. Do platform, repository, and runtime permissions allow it now?
4. Are prerequisites and evidence current and valid?
5. Is the action safe under the applicable policy and recovery contract?
6. If correcting a failure, is the correction objective and within budget?

If every answer is yes, proceed without human input in bounded-autonomous mode.
If any answer is no, stop. If an answer is unknown, inspect read-only evidence
when that inspection is itself permitted; if it remains unknown, stop rather
than treating uncertainty as permission.

## Required Alignment for Other Planning Documents

SDD briefs, plans, and skill designs SHALL:

- use the execution-mode and gate names defined here, with legacy names shown
  only as aliases during migration;
- keep execution mode, scope, authorization, runtime permission, and evidence
  as separate concepts;
- show delivery-cadence checkpoints outside change-lifecycle approval gates;
- state whether each checkpoint is blocking or non-blocking in each mode;
- preserve the same evidence and quality contract across modes;
- define exact autonomous targets, terminal outcomes, and stop conditions;
- use the objective-correction and durable stop-report rules rather than
  introducing prompt-specific retry behavior; and
- identify any cross-repository or external dependency that prevents
  continuous execution before offering an autonomous scope.

## Examples

### Owner-checkpointed milestone

```text
Milestone entry checkpoint (pause)
  -> Slice entry checkpoint (pause)
  -> Propose
  -> Plan-to-Apply gate (pause)
  -> Apply -> Verify -> required review
  -> Verified-to-Close gate (pause)
  -> Sync -> Archive -> integration -> exact-owned cleanup
  -> Slice exit checkpoint (pause before next slice)
  -> ...
  -> Milestone exit checkpoint (review and pause before next milestone)
```

### Bounded-autonomous milestone

```text
Milestone entry report
  -> Slice entry report
  -> Propose -> Apply -> Verify -> required review
  -> Sync -> Archive -> integration -> exact-owned cleanup
  -> Slice exit report
  -> next eligible slice
  -> Milestone exit report
  -> terminal outcome
```

Every arrow in the autonomous example remains conditional on current
authorization, permission, evidence, and safety. A stopping condition replaces
the next arrow with a durable stop report.

### Bounded-autonomous project plan

The milestone flow repeats in documented order until every required milestone
meets its acceptance criteria. A completed change, slice, or milestone does not
end a `project-autonomous` run unless it is the plan's terminal outcome or a
stopping condition fires.
