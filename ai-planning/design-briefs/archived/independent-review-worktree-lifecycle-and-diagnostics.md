# Independent-Review Worktree Lifecycle and Diagnostics

Date: 2026-08-14

Status: Propose-ready design brief. This records owner decisions about review
view construction and safe failure reporting. It does not authorize an
implementation change, a delivery transition, or a waiver of independent
review for `add-base-skills-research-and-planning`.

## 1. Problem and Desired Outcome

Strict independent review constructs a disposable detached Git worktree at the
sealed review head. In the current managed Codex execution boundary, ordinary
workspace writes are allowed but source-repository `.git` is read-only. Git
therefore cannot register a new worktree under `.git/worktrees/`, despite the
review checkout itself being located in an owned temporary directory.

The desired outcome is to retain detached Git worktrees as a supported,
Git-aware review-view capability without giving the reviewer write authority or
requiring a growing catalogue of sandbox-failure patterns. A host-owned outer
lifecycle operation must construct and remove the worktree under a narrowly
authorized boundary, then launch the reviewer with the existing strict
read-only, no-network, no-credential constraints.

When view construction or cleanup cannot complete, the outer layer must receive
a safe structured diagnostic result that it can log and explain. It must not
mistake an unavailable setup for a reviewer result or a passing review.

## 2. Evidence and Key Findings

- `skills/base/independent-review/references/protocol.md` requires a detached,
  disposable Git view pinned to the exact head, with review-time Git writes,
  credential access, authenticated network access, and mutation capabilities
  denied.
- `scripts/sdd/detached-review-view.mjs` currently invokes `git worktree add
  --detach` directly and collapses any error into
  `independent-review-view-create-failed`; it emits no stage, category, or safe
  underlying diagnostic.
- Two one-time, unprivileged `git worktree add --detach` probes returned exit
  `128` with `could not create directory of '.git/worktrees/review': Operation
  not permitted`. The probes made no escalation request, registered no
  worktree, and removed their owned temporary directories.
- Local Codex session records show existing repository worktrees were created
  through explicitly escalated `git worktree add` operations. An ordinary
  sandboxed retry in the same historical workflow failed on a `.git` lock; the
  explicitly escalated operation succeeded.
- The result-transport brief at
  `ai-planning/design-briefs/archived/independent-review-result-transport-reliability.md`
  already establishes that review acceptance must consume only the owned final
  artifact and that durable diagnostics must retain safe metadata rather than
  raw reviewer content.

## 3. Options Considered and Tradeoffs

### Option A: Replace worktrees with archive-only review views

An archive can provide an exact source tree without source `.git` writes. It
is a useful fallback, but it removes ordinary Git semantics and can constrain
Git-aware inspection or validation. It would make the existing detached-view
protocol less generally capable.

Decision: retain as a compatible fallback, not the sole worktree policy.

### Option B: Retry ordinary worktree creation after matching known errors

The launcher could inspect `EPERM`, `EACCES`, and command-specific stderr then
request more authority. This is brittle: new protected Git paths or platform
messages would require more classifiers, while invalid commits, repository
corruption, disk exhaustion, and lock contention cannot be repaired with added
permission.

Decision: reject as the authorization decision mechanism.

### Option C: Request a bounded worktree-lifecycle capability up front

When the review protocol selects a Git worktree view, a dedicated host-owned
operation receives an exact repository, canonical sealed commit, generated
temporary destination, and cleanup obligation. It creates and later removes
one detached worktree under a separately authorized outer boundary. The
reviewer is launched only after successful construction and receives no part
of that capability.

Decision: owner-selected design.

## 4. Explicit Decisions and Ownership

The owner has decided:

1. Detached worktrees remain supported whenever a workflow intrinsically needs
   a Git-aware view; their creation must not be generally blocked by the
   managed sandbox's protected `.git` metadata.
2. Authorization is bounded by the **worktree-lifecycle capability and exact
   target**, not by a list of anticipated failure strings. The operation is
   requested up front when a worktree strategy is selected.
3. The added authority belongs only to a host-owned outer lifecycle helper. It
   does not give the strict or degraded reviewer Git-write authority, network,
   credentials, GitHub mutation, workspace mutation, or arbitrary shell access.
4. The outer helper returns structured safe diagnostic details in JSON for
   unavailable setup and cleanup outcomes. The outer controller may log and
   explain them; review acceptance remains fail-closed.
5. Archive views remain an optional fallback or future alternative, rather
   than the mechanism that removes worktree support.

This is additional authority for the outer helper because a real worktree must
write source Git metadata. It is not a relaxation of the reviewer security
boundary.

## 5. Proposed Capability and Result Contract

### Bounded outer operation

Define a dedicated operation such as `create-detached-review-worktree-v1` and
its paired ownership-checked cleanup operation. It accepts only:

- a canonical source repository selected by the active review transition;
- the immutable, canonical sealed head commit;
- a runtime-generated temporary destination beneath the configured review
  temporary root; and
- the immutable request digest and expiration used to bind the operation.

It may create and remove the single detached worktree registration and owned
temporary files required for that view. It must reject arbitrary Git arguments,
repository-controlled commands, caller-selected destinations, branch creation,
network access, credential forwarding, and content mutation. The host must
revalidate the request binding and expiration before creation and before
accepting cleanup evidence.

The helper must report actual construction errors after authorization; it must
not automatically broaden privileges or retry arbitrary failed operations.

### Structured diagnostics

Every unavailable setup or cleanup outcome returns a schema-valid, request-bound
outer-lifecycle JSON response. It includes stable fields equivalent to:

```json
{
  "status": "unavailable",
  "stage": "review-view-construction",
  "operation": "create-detached-worktree",
  "error": {
    "code": "review-worktree-create-failed",
    "category": "permission-denied",
    "subject": "source-git-metadata",
    "exitCode": 128,
    "safeMessage": "The review worktree could not be registered in the source repository."
  }
}
```

The exact schema may use different canonical names, but it must distinguish
creation, verification, and cleanup stages; express stable code/category;
preserve a request binding; and permit a safe human-facing explanation.

Do not retain raw stderr, full temporary paths, raw review/package content,
environment values, credentials, or secrets in durable results. Short-lived
local diagnostics may hold raw process output only under existing ownership and
cleanup controls.

## 6. Scope, Non-Goals, Constraints, Dependencies, and Risks

### In scope

- Strict and authorized-degraded review-view construction where a detached
  Git worktree is selected.
- A host-owned bounded outer authorization and request/response contract.
- Ownership-checked cleanup and structured safe diagnostics.
- Deterministic fixtures for normal sandbox denial, successful authorized
  creation, failure after authorization, verification mismatch, and cleanup
  failure.
- Canonical protocol, adapter, schema, and user-facing unavailable-state
  documentation updates required to describe the new boundary.

### Non-goals

- No broad `danger-full-access` mode or generic arbitrary-command escalation.
- No permission expansion for the reviewer itself.
- No use of transcript text as a review result, no result-gate waiver, and no
  change to strict versus authorized-degraded assurance labels.
- No attempt to solve unrelated toolchain/inspection-environment readiness;
  that remains covered by the inspection-environment fallback brief.

### Dependencies and risks

- The dedicated host operation needs a platform adapter capable of requesting
  and evidencing its separately authorized outer boundary.
- It must compose with the result-transport repair's final-artifact and safe
  diagnostic requirements, not replace them.
- A generic host shell wrapper would create an injection surface; use fixed
  argument vectors and runtime-generated destinations instead.
- Cleanup must remain safe after partial creation, denied creation, or process
  interruption; stale registrations need a separately authenticated recovery
  path rather than unchecked deletion.

## 7. Open Questions and Recommended Next Step

### Open questions

1. What canonical schema and stable error-code namespace should be shared by
   strict and authorized-degraded outer-lifecycle results?
2. Does the host expose a dedicated capability API, or must the first adapter
   implementation use a fixed `git worktree` command under its approval
   boundary? The latter must remain adapter-owned rather than model-controlled.
3. Should archive construction be automatically attempted only when a bounded
   worktree capability is unavailable, or selected explicitly by the review
   strategy? Recommendation: select explicitly until equivalence for every
   Git-aware validation requirement is proven.

Recommended next step: OpenSpec Explore, then Propose a focused change such as
`harden-independent-review-worktree-lifecycle`. It should incorporate the
owner decisions above, reconcile the existing protocol's outer-sandbox
recovery language, and coordinate only the relevant diagnostic requirements
with `harden-independent-review-result-transport`.
