# Base Skill Contracts And Guardrails Proposal Handoff

Date: 2026-08-11
Status: Ready to begin OpenSpec Propose only

## Purpose

This handoff starts the first implementation change in the base-skill
foundation. The planning work is complete enough to propose the change. Do not
start Apply, create implementation code, or make GitHub lifecycle mutations
until the corresponding explicit authorization is received.

## Selected First Change

- OpenSpec change: `establish-base-skill-contracts-and-guardrails`
- Scope: shared base-skill result/configuration schemas, shared guardrail
  reference, guardrail-link migration for all canonical skills, deterministic
  enforcement/authorization helpers, and synthetic fixtures/evals.
- Delivery profile: `production-rapid` because it establishes reusable policy,
  validation, and autonomous-mutation boundaries for later skills.

## Read First

1. [Base skill contracts and guardrails](../design-briefs/base-skill-contracts-and-guardrails.md)
2. [First-pass base skills design](../research/first-pass-base-skills-design.md)
3. [Base skill authoring and guardrails](../design-briefs/base-skill-authoring-and-guardrails.md)
4. [Base skills research and planning](../design-briefs/base-skills-research-and-planning.md)
5. [Base implementation quality](../design-briefs/base-implementation-quality.md)
6. [SDD workflow](../../docs/sdd-workflow.md)
7. [SDD foundation operations](../../docs/sdd-foundation-operations.md)
8. `AGENTS.md`

## Accepted Design Decisions

- The first change migrates every existing `skills/base/*/SKILL.md`; there is
  no grandfathering or risk-based guardrail opt-out.
- One shared guardrail reference lives at
  `skills/base/_shared/guardrails.md`. Every canonical skill links to it and a
  deterministic validator enforces the link without allowing copied policy.
- The foundation owns `skill-result-v1` and optional `ai-skills-config-v1`
  schemas, including path rules, enums, unknown-key behavior, and versioning.
- Autonomous execution reuses the existing `autonomous-goal-runner`
  authorization object. The foundation adds deterministic profile/operation,
  target, adapter-capability, and runtime-permission checks.
- First-release profiles do not authorize external send, calendar updates,
  submissions, releases, or deployments. Merge, OpenSpec Archive, and
  merged-topic-branch deletion require a just-in-time approval by default;
  they may proceed without a routine prompt only for an exact,
  time-bounded, evidence-gated bounded-autonomous authorization or selected
  `prototype-rapid` one-change delivery preapproval.
- Existing autonomous correction policy remains: no more than three materially
  different behavior-preserving corrections per failure signature.

## Proposal Boundary

Run the OpenSpec Propose workflow for the named change. The proposal should
derive requirements, scenarios, design, and tasks from the accepted design
brief. It must preserve the following non-goals:

- Do not implement `base-skill-authoring`, research/planning skills, or quality
  skills in this change.
- Do not add product-specific constants, credentials, PII, connector scopes,
  or job-search behavior to reusable assets.
- Do not modify runtime sandbox/approval settings or create/rotate credentials.
- Do not start Apply after Propose. Stop for review of the generated artifacts.

## Dependency Order

1. `establish-base-skill-contracts-and-guardrails`
2. `add-base-skill-authoring`
3. `add-base-research-and-planning-skills`
4. `add-base-implementation-quality-skills`

The job-search and mobile/web domain skills remain subsequent work. Connector
selection, Excel/Google Sheets reconciliation, the first app slice, and any
higher-impact autonomous profile are deferred domain decisions.

## Current Verification State

Before the planning documentation commit, these checks passed:

```text
git diff --check
openspec validate --all --strict
# 16 passed, 0 failed
```

Re-check Git, OpenSpec, and validation state when the next session begins. The
worktree may contain user-authored changes after this handoff; preserve them and
do not use reset, blanket cleanup, or destructive recovery.

## Suggested Opening Prompt

```text
Read ai-planning/handoff-docs/base-skill-contracts-and-guardrails-proposal-handoff.md,
the linked design briefs, docs/sdd-workflow.md, docs/sdd-foundation-operations.md,
and AGENTS.md.

Inspect current Git and OpenSpec state. Preserve all existing worktree changes.
We are ready to Propose only the OpenSpec change
establish-base-skill-contracts-and-guardrails. Create the planning artifacts,
validate them strictly, and stop before Apply, GitHub mutations, or implementation.
```
