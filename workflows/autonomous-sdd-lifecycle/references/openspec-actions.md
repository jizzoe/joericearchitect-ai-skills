# OpenSpec Actions

The autonomous SDD lifecycle delegates artifact behavior to OpenSpec. It does
not implement a second artifact generator.

## Status Inspection

Before each action, inspect:

- active change list
- selected change status
- current action instructions
- proposal, delta specs, design, and tasks
- task completion and evidence
- living specs and archive state when Sync or Archive is in scope

## Propose Gate

Generated Propose remains planning-only unless a delivered bounded runner and
active authorization explicitly allow the next transition.

Planning review must cover proposal scope, affected capabilities, scenarios,
design decisions, dependencies, security, recovery, attribution, portability,
task IDs, task dependencies, batch boundaries, and evidence requirements.

Objective planning defects may be corrected and revalidated. Material
ambiguity pauses before Apply.

## Apply Gate

Apply may continue only when:

- planning review passes
- Apply is authorized
- task dependencies are satisfied
- batch risk does not require a smaller batch or human pause
- required context files have been read from current instructions

Tasks are marked complete only after their stated evidence exists.

## Verify Gate

Formal Verify requires current evidence for every task, requirement, scenario,
design decision, security control, recovery path, portability claim, eval, and
known limitation.

## Sync Gate

Sync requires merged implementation delivery, reread deltas and living specs,
strict validation, exact delta-to-living-spec reflection, and repeat Sync no-op
evidence.

## Archive Gate

Archive requires implementation and Sync delivery, closed issue or accepted
no-code evidence, Project completion evidence, strict validation, available
archive target, and content-preserving movement of the change bundle.
