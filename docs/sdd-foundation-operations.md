# SDD Foundation Operations

## Setup

1. Install OpenSpec CLI 1.8.x.
2. Authenticate `gh` with `repo` and `project` scopes for the target
   repository owner.
3. Verify `config/sdd-github.json` points at the intended repository and
   Project.
4. Run `openspec validate --all --strict`.
5. Run the focused Node verification suite before delivery.

## Normal Operation

Use the lifecycle order:

1. Intake issue and OpenSpec change.
2. Propose and review.
3. Apply implementation tasks.
4. Verify locally.
5. Deliver implementation PR.
6. Sync living specs.
7. Archive the completed OpenSpec change.
8. Confirm issue closure and Project `Done` convergence.

## Recovery

- Re-read Git, GitHub issue/PR, Project, and OpenSpec state before resuming.
- Treat durable state as authoritative over chat memory.
- Rerun only affected checks after a narrow fix, then rerun strict OpenSpec
  validation before delivery.
- If a correction budget is exhausted or a dependency conflict is unresolved,
  record the blocked reason and pause.

## Token Rotation

- Rotate GitHub tokens outside the repository.
- Never commit token values or workflow secrets.
- After rotation, run `gh auth status -h github.com` and a read-only API probe.
- Re-run Project mutation only after confirming target repository and issue.

## OpenSpec Updates

- Active changes live under `openspec/changes/<change>/`.
- Living specs live under `openspec/specs/<capability>/spec.md`.
- Archive completed changes under `openspec/changes/archive/YYYY-MM-DD-<change>/`.
- Sync and Archive are separate PR checkpoints.

