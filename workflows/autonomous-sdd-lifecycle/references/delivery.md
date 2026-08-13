# Delivery

Delivery is an external mutation boundary. Proceed only when the active
authorization covers the exact repository, branch, pull request, issue,
Project, merge behavior, and branch cleanup target.

## Pull Request Gate

Before marking a pull request ready or merging, verify:

- approved base branch
- current head commit matches the verified commit
- required checks or documented substitutes are current
- OpenSpec Verify evidence is accepted
- review state is acceptable for the authorization
- the PR body uses a closing keyword only when merge means completion
- no unrelated or destructive changes are included
- branch cleanup is authorized and targets the merged topic branch only
- for `production-rapid`, `independent-review-result-v1` binds a distinct
  non-interactive isolated read-only reviewer to a sealed current package and
  exact base/head; package, result, and dispositions are retained in the named
  transition's unique durable review record. The v1 validator rejects stale,
  unavailable, malformed, self-review, mutable, blocker, high, or unresolved
  objective-fix outcomes before delivery.

## Issue and Project Gate

Verify that the issue and Project item match the selected change. The lifecycle
may reconcile status only when the mutation is authorized and the desired state
is unambiguous from durable records.

## No-Code Exception

Use no-code delivery only when repository content is unchanged and the approved
tracking metadata or issue discussion contains a human-authored completion
reason. Documentation, specs, skills, workflows, scripts, and configuration are
repository content and require pull-request delivery.

## Idempotent Rerun

If delivery is rerun after interruption, inspect the existing pull request,
merge state, issue state, Project state, and branch state. Converge to the
intended state without duplicate pull requests, duplicate comments, or loss of
human-authored content. Pause if target identity or precedence is ambiguous.
