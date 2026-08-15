## Why

The independent-review launcher currently attempts detached Git worktree
construction inside the managed implementation sandbox. That sandbox protects
source `.git` metadata, so a real worktree cannot register even when its
checkout destination is an owned temporary directory. The failure prevents the
reviewer from starting and is reported only as a generic unavailable condition.

Runtime diagnosis also proved a second boundary failure: a strict nested Codex
process can reach its in-process app-server initialization but macOS Seatbelt
returns `EPERM` because the implementation process is already sandboxed. The
same strict invocation succeeds outside that parent boundary with Codex's own
sealed read-only profile. Treating that host launch as degraded prevents an
available strict reviewer from satisfying the lifecycle.

The protocol needs a bounded, host-owned lifecycle capability that can create
and remove a sealed exact-head review worktree, while preserving the inner
reviewer's existing read-only and credential-scrubbed boundary and recording
safe, actionable unavailable diagnostics. No primary GitHub issue is currently
linked; this proposal is based on the approved repository design brief and does
not authorize GitHub tracking mutation.

## What Changes

- Define a request-bound, expiring outer worktree-lifecycle capability for the
  canonical repository and immutable review-package head when the selected
  review strategy requires a detached Git view.
- Add an adapter-owned creation and ownership-checked cleanup path that accepts
  only fixed Git worktree operations and runtime-generated temporary locations.
- Return canonical, schema-valid unavailable diagnostics that distinguish
  construction, verification, cleanup, and strict reviewer-process failure
  without retaining raw stderr, paths, review/package content, environment
  values, or credentials.
- Propagate one versioned safe diagnostic envelope through package construction,
  archive and worktree views, adapter preflight/execution/result handling,
  launcher host, parent transport, and recovery acceptance without a wrapper
  replacing a child failure's triage data.
- Reconcile launcher recovery and protocol documentation with proactive
  capability selection; do not use error-message matching, manual owner-run
  commands, or generic shell escalation as the authorization mechanism.
- Add a direct, fixed parent-runtime strict Codex transport that starts from a
  neutral directory, resolves the host-owned executable only from fixed
  platform install locations, authenticates it through the platform code-trust
  mechanism, binds its content hash and filesystem identity, isolates copied
  authentication from model-readable paths, retains the inner sealed read-only
  profile, accepts only a structured result artifact, and validates cleanup.
- Require Claude's declared read-only tool allowlist explicitly and classify
  its documented not-logged-in response as authentication unavailability.
- Add deterministic tests/evals for authorized creation, sandbox denial,
  post-authorization failure, verification mismatch, cleanup failure, request
  binding, expiration, and unchanged inner-reviewer restrictions.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `isolated-independent-review`: Require a bounded outer detached-worktree
  lifecycle and safe request-bound unavailable diagnostics while preserving a
  restricted, fail-closed inner reviewer.

## Impact

- Affects the independent-review protocol, launcher recovery/host adapters,
  detached-review-view helper, canonical result schemas, deterministic tests,
  and user-facing diagnostic guidance.
- Reuses the existing assistant-neutral independent-review assets under
  `skills/base/`; any Codex/Claude exposure remains thin and platform-specific
  runtime transport stays outside canonical policy.
- Does not grant the reviewer Git-write, workspace-write, network, credential,
  GitHub-mutation, deployment, release, external-send, or arbitrary-command
  authority. Archive-only views remain an explicit optional alternative, not a
  general replacement for Git-aware detached worktrees.
