# GitHub CLI authentication context observation — 2026-08-18

## Scope

This record preserves the non-secret evidence from an autonomous SDD delivery
attempt for `jizzoe/joericearchitect-ai-skills`. It does not contain a token,
keychain item, environment value, or credential configuration.

## Observation

At 20:51, 20:54, and 21:01 UTC, `gh auth status -h github.com` and
read-only GitHub API calls executed in the restricted Codex sandbox returned
an HTTP 401 and described the active token as invalid. The durable controller
correctly paused the issue-intake transition rather than attempting a GitHub
write without usable runtime permission.

At 21:01 UTC, the same GitHub CLI checks executed through the host-permission
boundary succeeded: `gh auth status` reported the active `jizzoe` account as
logged in through the macOS keyring with the required `repo` and `project`
scopes; `gh api user` returned `jizzoe`; and a repository read succeeded.
The subsequently authorized exact issue create-or-reuse created issue #130.

## Evidence-based interpretation

The token was valid. The contrasting results isolate the failure to credential
visibility between the restricted sandbox process and the host process that can
read the macOS keychain. GitHub CLI reports this visibility problem as an
authentication failure, so existing lifecycle logic cannot safely distinguish a
truly invalid credential from a sandbox-only keychain access boundary.

## Constraints

- A reusable fix must never print, read into logs, persist, relay, or ask a
  user to paste a token.
- It must not turn a sandbox 401 into assumed host authority; the actual host
  permission boundary remains authoritative for every GitHub command.
- It must preserve fail-closed behavior for genuinely invalid credentials,
  denied host permission, unavailable GitHub, and unavailable keychains.

## Primary context

- `docs/sdd-workflow.md`
- `docs/sdd-foundation-operations.md`
- `skills/base/autonomous-sdd-lifecycle/SKILL.md`
- `.git/sdd-delivery-runs/runs/bf700dbc-5512-440c-bf73-4fc2a66b5ec3/controller.json`
