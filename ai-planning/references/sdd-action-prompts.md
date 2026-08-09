# SDD Action Prompt Reference

Date created: 2026-08-09
Status: Living reference

## Purpose

Keep the prompts used to operate this repository's specification-driven
development process, along with concise notes explaining why each action and
checkpoint exists.

Add each recommended action prompt to this document before using it. Preserve
the prompt that was actually used when later refinements are made so the record
shows how the process evolved.

This document is a learning and operational reference. The requirements,
OpenSpec artifacts, implementation plan, dependency plan, GitHub issues, and
pull requests remain the authoritative sources for product and delivery state.

## Entry Format

Each new entry should contain:

1. The action and its intended outcome.
2. Preconditions or required context.
3. The exact prompt to issue.
4. Expected stopping point.
5. Notes explaining the relevant SDD concepts.
6. Observations recorded after the action, including gaps or process changes.

## 1. Start M1-C1: Bootstrap OpenSpec Foundation

### Intended Outcome

Create and review the planning package for OpenSpec change
`bootstrap-openspec-foundation`, including its GitHub work records, without
starting implementation.

### Preconditions

- The foundation requirements, implementation plan, dependency plan, and
  implementation handoff have been reviewed.
- OpenSpec is initialized for Claude and Codex.
- GitHub CLI has local access to repository `jizzoe/joericearchitect-ai-skills`
  and user Project `1`.
- The repository owner's token, live-test, and required-check decisions have
  been recorded.
- Existing uncommitted work will be preserved.

### Prompt

```text
We are starting M1-C1, OpenSpec change `bootstrap-openspec-foundation`.

Use the `openspec-propose` skill and follow the requirements, implementation
plan, dependency plan, and implementation handoff already reviewed.

This is a learning session. Explain each SDD stage and why it is required as
we reach it. I will ask questions and evaluate the workflow along the way.
Capture material decisions, problems, and process observations in the
appropriate planning or handoff document without duplicating authoritative
requirements.

Work in these checkpoints:

1. Reinspect the repository, OpenSpec configuration, GitHub CLI access, and
   GitHub Project state. Preserve all existing uncommitted work. Report any
   discrepancy and do not mutate anything yet.

2. Draft and preview:
   - The roadmap issue: `Establish OpenSpec SDD foundation`
   - The feature issue:
     `[M1-C1] Bootstrap OpenSpec for Claude and Codex`
   - Their relationship and intended Project placement

   Stop and obtain my approval before creating or modifying GitHub records.

3. After approval, create the issues, establish the available relationships,
   and add them to GitHub Project 1. Report the resulting URLs and state.

4. Add the separate OpenSpec `verify` workflow while retaining only the
   streamlined workflows: explore, propose, apply, verify, sync, and archive.
   Do not enable incremental artifact workflows.

5. Invoke `$openspec-propose` for `bootstrap-openspec-foundation`.
   The proposal must reference:
   - `ai-planning/requirements/openspec-sdd-foundation.md`
   - `ai-planning/plans/openspec-sdd-foundation-implementation-plan.md`
   - `ai-planning/plans/openspec-sdd-foundation-dependency-plan.md`

   It must include the GitHub issue reference, a Reuse Plan, stable task IDs,
   dependency annotations, verification evidence, recovery considerations,
   and Claude/Codex portability.

6. Generate planning artifacts only. Do not invoke apply and do not implement
   the proposed change in this session step.

7. Review the generated proposal, delta specs, design, and tasks against the
   M1-C1 requirements. Explain any gaps or corrections and stop for my review
   before proceeding further.
```

### Expected Stopping Point

The proposal, delta specifications, design, and task plan exist and have been
reviewed for gaps. No apply action or implementation work has started.

### Learning Notes

- The sequence is readiness, GitHub issue approval, bootstrap setup, OpenSpec
  proposal, artifact review, and only then a later apply action.
- That separation is central to SDD: we agree on the intended behavior and
  implementation plan before changing the product.
- The GitHub issue owns the problem discussion and lifecycle state. OpenSpec
  owns the durable behavioral requirements, technical design, and detailed
  implementation tasks.
- A proposal is not authorization to implement. Reviewing the planning package
  is a deliberate gate between deciding what should change and changing it.
- Previewing GitHub mutations protects external state and lets the repository
  owner review issue content and relationships before they become public work
  records.
- Objective exit evidence matters. Completing a command is not proof that the
  generated artifacts are correct, linked, portable, or ready to implement.

### Observations

Complete this section after the action. Record what worked, what was confusing,
what required correction, and whether the prompt or SDD process should change.
