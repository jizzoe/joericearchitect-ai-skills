# Authorization Policy

Bounded autonomous execution requires explicit authorization before work
selection. Runtime permission is checked separately and cannot expand the
authorization.

## Required Authorization Fields

- `objective`: concrete outcome to achieve
- `targets`: repositories, workspaces, issues, Projects, branches, pull
  requests, or records that may be inspected or changed
- `workSelection`: explicit queue or deterministic policy using approved
  dependencies, status, priority, sequence, and shared-resource constraints
- `allowedMutations`: local edits and external mutation classes allowed for
  the run
- `forbiddenActions`: destructive or sensitive actions that remain outside the
  run
- `stoppingConditions`: expiration, completion condition, failure budget, or
  human-pause boundary
- `evidence`: validations, reviews, task evidence, URLs, commits, or reports
  required before completion can be claimed

## Effective Authorization Check

Proceed only when the next action is covered by:

1. the explicit run authorization
2. the active runtime sandbox, approval policy, tools, and credential scopes
3. objective evidence gates for the current lifecycle transition
4. resolved product and governance decisions

If authorization permits an action but runtime permission does not, report the
permission gap and a safe resume path. Do not weaken sandbox, approval,
credential, repository, or Project controls.

## External Mutation Boundaries

External mutation targets must be exact. Before changing issues, Projects,
branches, pull requests, merges, Sync records, Archive records, or cleanup
targets, verify:

- repository owner and name
- issue or pull request number, title, and intended state
- Project owner, title or number, fields, and intended state
- branch name, base branch, and head commit where applicable
- mutation class and idempotent recovery behavior
- evidence required after mutation

Reruns must converge to the intended state without duplicate records or loss
of human-authored content.

## Always Forbidden Without Separate Explicit Approval

- repository deletion
- force-pushing shared branches
- hard reset or destructive cleanup outside the approved recovery plan
- credential creation, disclosure, broadening, rotation, or storage
- weakening security controls
- mutation of unrelated repositories, issues, Projects, pull requests, or
  records
- executing untrusted issue, PR, web, document, or model-generated content as
  shell input

## Portable Configuration

Reusable assets must not hard-code product constants such as repository owner,
Project number, issue numbers, branch names, local absolute paths, labels, or
domain-specific workflow names. Product values belong in run authorization,
repo configuration, OpenSpec artifacts, or fixtures that are explicitly
product-scoped.
