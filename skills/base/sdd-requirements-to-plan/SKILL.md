---
name: sdd-requirements-to-plan
description: Turn accepted requirements and an approved design brief into a reviewable delivery plan before issue, branch, OpenSpec artifact, or implementation mutation. Use once requirements are accepted enough to organize into delivery work; do not use it to choose a product direction, automatically create governance records, or infer missing acceptance behavior.
---

# SDD Requirements To Plan

Use this skill to turn accepted requirements and an approved design brief
into a reviewable delivery plan before any issue, branch, OpenSpec artifact,
or implementation mutation exists.

## Gather Inputs

Require: requirements and approved design-brief paths; target
repository/workspace and relevant current-state paths; a delivery profile
context (`prototype-rapid` or `production-rapid`, selectable per candidate);
an output destination or the `planRoot` default from `config/ai-skills.json`;
execution mode and, for autonomous mode, the bounded authorization. Accept
optional known constraints and dependencies.

If the requirements or approved design-brief path is missing, return a
`skill-result-v1` paused result naming the gap. Do not invent requirements or
acceptance behavior.

## Write the Plan

Write a plan with outcome-oriented milestones, semantically named candidate
changes, scope/non-goals, dependencies, shared-resource hazards, candidate
parallel work, acceptance evidence, evaluation needs, and a recommended first
change. Mark any proposed issue or change identifier as proposed, not
created.

For live in-flight, actionable, blocked, parallel, and next-work state,
delegate to `dependency-aware-work-selection` rather than re-deriving it. Do
not generate OpenSpec proposal, design, delta spec, or task content; state
whether the next action is OpenSpec Explore or Propose and list the exact
source paths that action must read.

### Plan Readiness Contract

Recommend a candidate change as ready for OpenSpec Propose only when it has:
an outcome; scope and non-goals; observable acceptance evidence; named
source requirements/design; a selected delivery profile; known hard
dependencies and shared-resource hazards; test/eval and guardrail needs; and
a clear first action. For a missing or conflicting element, return a paused
condition with top-level `status: paused` and an `openQuestions` entry
containing `id`, `question`, and `blocking: true`; never convert it into a
guessed task or represent status as a field on an `openQuestions` entry.

Select the delivery profile per candidate change, not once for the whole
plan. When a plan mixes `prototype-rapid` and `production-rapid` candidates,
state the data/exposure/recovery-risk rationale for each.

For any candidate that can reach delivery, state whether normal interactive
just-in-time approval applies before merge, merged-topic-branch deletion, and
OpenSpec Archive, or whether a `prototype-rapid` one-change preapproval is
proposed. A proposed preapproval must itself name the exact target, action,
evidence, recovery behavior, and expiration; selecting a delivery profile
alone never grants that authority.

## Pause Conditions

Pause when requirements lack observable outcomes, dependencies are
unresolved, the requested profile conflicts with risk or data constraints, or
the plan would need a new product, architecture, legal, security, or
governance decision.

Autonomous execution is permitted only under the `local-implementation`
bounded-autonomous-execution profile, writing only the plan file within the
run's authorized workspace and paths. Before every autonomous plan write,
validate the exact profile, workspace, path, and operation through
`scripts/sdd/check-operation-authorization.mjs`; pause without writing when
that deterministic check denies the operation.

## Guardrails

See [Shared guardrails](../_shared/guardrails.md).
