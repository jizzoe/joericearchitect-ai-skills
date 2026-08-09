# External Mutations

External mutations require exact authorization, target verification, objective
preconditions, and idempotent recovery behavior.

## Expected Mutation Classes

- issue creation, update, comment, close, or reopen
- Project item status or field update
- branch creation, push, merge, or merged-topic-branch deletion
- pull request creation, body update, ready-for-review transition, merge, or
  close
- Sync branch and pull request delivery
- Archive branch and pull request delivery
- disposable test artifact cleanup when specifically authorized

## Required Target Fields

Before mutation, verify the configured or authorized:

- repository owner and name
- Project owner, title or number, and field names
- issue or pull request number and title
- branch name, base branch, and verified head commit
- mutation class and desired state
- recovery behavior for duplicate reruns or partial completion

## Stop Conditions

Stop before mutation when the target is unauthorized, credentials are missing,
untrusted content would be executed, the mutation would duplicate a record, or
existing human-authored content would be overwritten.

## Dry Run and Preview

Use dry run or preview when practical before changing external state. When dry
run is unavailable, inspect the current target and report the exact mutation
that will occur.
