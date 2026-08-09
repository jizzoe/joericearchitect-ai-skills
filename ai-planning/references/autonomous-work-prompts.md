# Autonomous Work Prompts

Date: 2026-08-09

This reference captures reusable owner prompts for bounded autonomous OpenSpec
SDD work. These prompts are authorization text, not a substitute for runtime
permissions, repository policy, validation evidence, or human-pause rules.

## M1-C2 Apply Authorization

Use after reviewing planning artifacts for
`enable-bounded-autonomous-sdd-execution`.

```text
I have reviewed the M1-C2 planning artifacts for
`enable-bounded-autonomous-sdd-execution` and authorize Apply.

Implement the approved tasks in dependency order, using the batch structure in
`openspec/changes/enable-bounded-autonomous-sdd-execution/tasks.md`.

Do not merge PR #9, Sync, Archive, or begin M2-M7. Keep PR #9 draft. Run the
required validation and review after each batch, fix objective defects, and
pause only for the human-pause boundaries defined in the handoff and design.
```

## Disposable Rehearsal Authorization

Use before the M1-C2 disposable end-to-end rehearsal.

```text
I authorize this Goal to create, update, close, and retain disposable
`[SDD test]` issues in `jizzoe/joericearchitect-ai-skills`; update their
Project fields; create and merge verified lifecycle PRs; and delete their
topic branches. This does not authorize repository deletion, secret
disclosure or rotation, force-pushing shared branches, weakening security
controls, modifying unrelated records, or inventing missing product
decisions.
```

## M1-C2 Delivery, Sync, And Archive Authorization

Use after accepting formal verification for
`enable-bounded-autonomous-sdd-execution`.

```text
I accept the M1-C2 verification for
`enable-bounded-autonomous-sdd-execution`.

I authorize delivery of PR #9 for issue #8 in
`jizzoe/joericearchitect-ai-skills`: update the PR body from `Related to #8`
to `Closes #8`, mark the PR ready, merge it after final validation, verify
issue and Project convergence, and delete the merged feature branch.

After delivery, I authorize separate Sync and Archive checkpoints for this
same OpenSpec change, including creating, pushing, opening, merging verified
PRs, and deleting their topic branches. Do not start M2-M7.
```

## M2-M7 Bounded Autonomous Execution Authorization

Use after M1-C2 is delivered, synced, archived, and the work queue should begin.

```text
I authorize bounded autonomous execution of the OpenSpec SDD foundation queue
from M2-C1 through M7-C1 in `jizzoe/joericearchitect-ai-skills`.

Allowed targets: this repository, roadmap issue #1, new milestone issues for
M2-C1 through M7-C1, Project `AI Skills Development`, OpenSpec changes, topic
branches, pull requests, living specs, archive records, and disposable
`[SDD test]` records needed for verification.

Allowed mutations: create/update/close milestone issues; update Project fields;
create OpenSpec proposal/design/spec/task artifacts; implement approved tasks;
create/push/delete topic branches; open/update/ready/merge verified PRs; sync
living specs; archive completed OpenSpec changes; and retain evidence.

Selection policy: process dependency-eligible changes in the approved dependency
order, starting with M2-C1, then M3-C1, M3-C2, M4-C1, M4-C2, M5-C1, M5-C2,
M6-C1, and M7-C1 unless a dependency or risk boundary requires a pause.

Stopping conditions: pause for material product, architecture, compatibility,
security, licensing, governance, credential, destructive-action, unexpected
external-target, unresolved dependency, durable-state conflict, persistent
environment, or exhausted correction-budget decisions.

Forbidden actions: repository deletion, secret disclosure or rotation,
force-pushing shared branches, hard reset, weakening security controls,
modifying unrelated repositories or records, and inventing missing product
decisions.
```

## Post-M1-C2 Goal Objective

Use only after M1-C2 has passed delivery, Sync, Archive, and rehearsal gates.

```text
/goal

Execute the remaining OpenSpec SDD foundation program from M2-C1 through
M7-C1 using the delivered bounded autonomous SDD runner.

Read
`ai-planning/handoff-docs/bounded-autonomous-sdd-execution-handoff.md`, the
foundation requirements, implementation plan, dependency plan, current living
specs, and the delivered autonomous-runner instructions. Reinspect durable
Git, GitHub, Project, and OpenSpec state before selecting work.

Build a deterministic dependency-eligible queue and process one OpenSpec
change at a time. For every change, execute the complete approved lifecycle:
intake, Propose with automated planning review, Apply in dependency-ordered
three-to-five-task batches, validation and independent review after every
batch, objective auto-correction with affected-check reruns, formal Verify,
delivery audit and merge, Sync, Archive, Project reconciliation, and durable
evidence capture.

Continue without routine approval when objective gates pass and actions remain
within existing authorization. Pause only for the material human-decision,
destructive-action, credential/security, irrecoverable external-state,
three-strategy correction-budget, or persistent-environment conditions defined
by the runner. Never weaken controls, expose or rotate secrets, force-push a
shared branch, delete a repository, invent missing product decisions, or
modify unrelated records.

On interruption, resume idempotently from authoritative durable state. At the
end, report every change, issue, PR, commit, living spec, archived change,
Project transition, verification result, warning, and remaining limitation.
```
