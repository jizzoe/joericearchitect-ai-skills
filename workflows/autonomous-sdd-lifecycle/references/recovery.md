# Recovery

Recovery starts from authoritative durable state.

## Durable State Precedence

Use these sources before transient logs or chat summaries:

1. Git commits, branches, diffs, and remotes
2. OpenSpec status, instructions, artifacts, and task checkboxes
3. GitHub issue state and dependency relationships
4. GitHub Project item state
5. Pull request state, checks, reviews, merge commit, and branch state
6. Living specs and archived change directories
7. Verification reports and eval output tied to current artifacts

If these sources conflict and precedence is not established by approved
policy, pause for human review.

## Resume Procedure

On resume:

1. reread selected change status and current instructions
2. inspect tasks and evidence before choosing a batch
3. compare local branch, remote branch, and pull request head
4. verify issue, Project, and PR targets before external mutation
5. rerun stale or affected checks
6. continue from the first incomplete evidenced step

## Partial External Mutation

When a prior run partially changed GitHub, Project, PR, branch, Sync, or
Archive state, reconcile by exact target identifier. If the intended target or
desired state cannot be proven without guessing, stop before mutating again.
