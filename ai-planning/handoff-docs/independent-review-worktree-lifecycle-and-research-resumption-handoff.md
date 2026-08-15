# Independent-Review Worktree Lifecycle and Research Resumption Handoff

- Date: 2026-08-14
- Status: Ready for a new-session OpenSpec proposal and implementation of the
  worktree-lifecycle repair; then resume the research-and-planning change.
- Repository: `jizzoe/joericearchitect-ai-skills`
- Primary workspace:
  `/Users/joerice/git/joericearchitect/joericearchitect-ai-skills`
- Research worktree: `/private/tmp/ai-skills-research-planning-86`
- Primary design brief:
  `ai-planning/design-briefs/independent-review-worktree-lifecycle-and-diagnostics.md`

## 1. Purpose and Required Sequence

The next session should first turn the primary design brief into a focused
OpenSpec change, implement it, validate it, and deliver it through the normal
governed lifecycle. Only after that repair is delivered should it resume
`add-base-skills-research-and-planning` (#86) from current durable state.

Do not treat this handoff as standing authorization for a new autonomous run,
GitHub-visible mutation, implementation, merge, or human-review exception.
Re-derive state and obtain the required authorization at each lifecycle
boundary. If an autonomous delivery request lacks risk-bearing inputs, ask up
front for all of: `qualityProfile`, `independentReviewPolicy`, and a bounded
expiration. The prior run used `production-rapid`,
`strict-first-degraded`, and a 12-hour expiration; it is not reusable.

Recommended repair change name:
`harden-independent-review-worktree-lifecycle`.

## 2. Owner Decisions That Must Be Preserved

1. Retain detached Git worktrees as a supported, Git-aware review-view
   capability. Do not make archive-only views the general replacement.
2. When the review strategy requires a worktree, request a bounded
   worktree-lifecycle capability **up front**. Do not decide whether to request
   authority by matching a growing collection of failure messages.
3. Bound that capability to the canonical repository, sealed immutable commit,
   runtime-generated temporary destination, request digest, expiration, and
   ownership-checked create/remove lifecycle.
4. The added authority belongs only to a host-owned outer lifecycle helper.
   The inner strict or degraded reviewer remains read-only, no-network,
   credential-scrubbed, noninteractive, and unable to mutate Git/GitHub or run
   arbitrary shell commands.
5. Every unavailable view-construction, verification, or cleanup outcome must
   return request-bound, schema-valid JSON with safe structured diagnostics for
   outer logging and explanation.
6. Durable diagnostics must include stable stage, operation, code, category,
   subject, optional safe exit code, and safe human message. They must not
   retain raw stderr, full temporary paths, raw review/package content,
   environment values, credentials, or secrets.
7. Archive views remain a compatible optional fallback or future alternative;
   select them explicitly until their equivalence for Git-aware validation has
   been proven.
8. Do not expand privileges after arbitrary failures. Once the bounded outer
   capability has been authorized, report genuine failures such as an invalid
   SHA, Git absence, lock contention, or disk exhaustion normally.

This is intentionally additional authority for the **outer helper**: a real
Git worktree necessarily writes the source repository's `.git/worktrees/`
metadata. It is not a weakening of the reviewer boundary.

## 3. Exact Diagnosis

### What failed

The strict reviewer did not start. The outer review-view creator attempted:

```text
git -C <source-repository> worktree add --detach <temporary>/repository <head>
```

Git failed before any Codex/Claude reviewer or inner sandbox launched:

```text
fatal: could not create directory of
'/Users/joerice/git/joericearchitect/joericearchitect-ai-skills/.git/worktrees/repository':
Operation not permitted
```

The current `createDetachedReviewView()` in
`scripts/sdd/detached-review-view.mjs` catches this and returns the generic
`independent-review-view-create-failed` code. It currently does not distinguish
worktree creation, verification, or cleanup failure details.

### What did not fail

- Git itself was available: `git rev-parse` and Git archive probes succeeded.
- No inner strict reviewer was launched.
- No Codex adapter toolchain preflight was reached.
- No `gh` operation was attempted; `gh` is intentionally not a reviewer
  capability.
- The failure was not caused by a missing Xcode command-line tool. `xcrun`,
  `sed`, `PATH`, and inspection-tool readiness were observed later in a
  separate authorized-degraded review attempt.

### Why it happened

The managed sandbox for ordinary Codex commands permits writes in the workspace
and temporary roots but treats the source checkout's `.git` directory as
read-only. Git worktrees share object storage but must register every linked
checkout in `.git/worktrees/<name>/`, so a temporary destination alone does not
avoid a source-Git write.

`~/.codex/goal.config.toml` sets `sandbox_mode = "workspace-write"`, but a
no-profile comparison showed the same protected-`.git` behavior. The profile
was therefore not the root cause. In workspace-write mode, a managed runtime
may protect `.git` even though ordinary project files are writable.

Existing worktrees are not contradictory evidence. Codex session history shows
they were created through explicit `sandbox_permissions: "require_escalated"`
calls to `git worktree add`; an unprivileged historical attempt failed on a
`.git` lock and the escalated retry succeeded. An approved command prefix
permits an explicitly requested outer operation; it does not silently elevate
ordinary sandboxed shell commands.

### Reproduced disposable test

Two unprivileged, no-escalation test runs attempted to create a detached
worktree under `/private/tmp`. Both returned exit code `128` and:

```text
Preparing worktree (detached HEAD 49704a8)
fatal: could not create directory of '.git/worktrees/review': Operation not permitted
```

Neither test registered a worktree. Their temporary directories were removed
and no test artifacts remain.

## 4. Required Architecture

Introduce a dedicated, host-owned operation such as
`create-detached-review-worktree-v1`, paired with an ownership-checked removal
operation. Its request must be digest-bound and contain only validated,
non-model-controlled data. It constructs fixed Git argument vectors, for
example a detached checkout at the canonical sealed head, and uses a
runtime-generated temporary root.

The controller must request this capability when it chooses a worktree review
view. The outer runtime/adapter performs the separately authorized operation
and returns normalized, request-bound execution evidence. The controller then
launches the inner reviewer under its existing restricted policy. The reviewer
never receives the outer capability.

Do not implement a generic shell escape hatch, `danger-full-access`, arbitrary
Git arguments, caller-chosen destinations, branch creation, network access,
credential forwarding, or content mutation.

The repair must compose with—not replace—the result transport contract: only
the reviewer's owned final result artifact can satisfy the review gate.

### Diagnostic result shape

Use a canonical schema, but the minimum semantic content is:

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

This is outer-lifecycle status, not reviewer `passed`/`findings` output. The
gate remains fail-closed: unavailable setup is never accepted as a review.

## 5. Existing Related Work and Boundaries

### Result-transport repair

`harden-independent-review-result-transport` was completed separately under a
narrow, repair-only human-review bootstrap exception. That exception is not a
standing waiver. Its design brief is:

`ai-planning/design-briefs/independent-review-result-transport-reliability.md`.

It established the final-artifact-only gate and safe result diagnostics after a
review transcript displayed JSON `passed` while the owned final artifact was
missing or malformed. Do not regress that distinction.

### Inspection-environment fallback

`ai-planning/design-briefs/independent-review-inspection-environment-fallback.md`
addresses a different problem: after an authorized degraded reviewer starts,
its restricted environment lacked `sed`/expected command discovery and
macOS Git invoked `xcrun` without usable developer-tool state. Its intended
policy is restricted degraded review first, then one fresh,
security-preserving, launch-context-compatible inspection retry only for typed
inspection-environment unavailability.

The worktree-lifecycle repair does not solve that inner inspection issue.
After it is delivered, strict review may succeed directly. If strict review
later reaches the reviewer but fails on inspection-tool readiness, preserve its
durable evidence and use the separately designed fallback work; do not conflate
the two root causes.

### Existing protocol language

`skills/base/independent-review/references/protocol.md` already describes
outer-sandbox launcher recovery, but past evidence showed that its controller
could prepare a host request without a connected runtime adapter actually
issuing the escalated operation. Reconcile the protocol with the new explicit,
proactive capability contract. The earlier handoff
`ai-planning/handoff-docs/zero-touch-independent-review-redesign-handoff.md`
contains the deeper zero-operator-mediation history and should be read before
designing the adapter.

## 6. Acceptance Evidence for the Repair

The OpenSpec proposal and implementation should include deterministic tests or
rehearsals that prove:

1. The controller requests the bounded worktree capability before view
   construction when the worktree strategy is selected.
2. The host accepts only the canonical repository, exact sealed commit,
   generated temporary path, active request binding, and unexpired request.
3. The host creates a detached exact-head worktree and removes only an
   ownership-verified view.
4. Normal sandbox denial is classified into the safe unavailable result rather
   than becoming a reviewer pass or an opaque generic error.
5. A failure after authorization retains accurate stable diagnostics without
   raw stderr or secret-bearing context.
6. Verification mismatch and cleanup failure each fail closed with their own
   diagnostic stage/code.
7. The reviewer process has no Git-write, workspace-write, network,
   credential, GitHub-mutation, deployment, release, external-send, or
   arbitrary-command authority.
8. A changed head requires a fresh package, view, and independent review.
9. No production path tells the owner to execute a manual host/review command
   or copy a request/response between processes.

## 7. Research-and-Planning Change (#86) Resume State

- Worktree: `/private/tmp/ai-skills-research-planning-86`
- Branch: `feature/86-add-base-skills-research-and-planning`
- Snapshot head: `104cccceebeb0b7e60d813ffabd51860c1bc75db`
- All Apply implementation tasks (`1.1` through `4.1`) are marked complete.
- Task `4.2` remains incomplete: OpenSpec Verify and current exact-head
  independent review are still required for a `production-rapid` transition.
- Task `4.3` remains incomplete: GitHub issue/link/tracking work has not been
  authorized and must not be created merely from this handoff.
- Previous deterministic evidence was strong (focused fixtures and full suite),
  but it must be rerun or re-derived against the current head after the repair
  and any rebase.
- Do not merge, Sync, Archive, close the research claim, or waive its
  independent-review gate based on prior review results. Any changed head
  invalidates them.

When resuming #86:

1. Re-read its proposal, design, delta specs, tasks, and Verify context.
2. Rebase or otherwise move to the relevant repaired base using a safe,
   reviewable workflow; preserve unrelated worktrees and uncommitted files.
3. Rebuild current exact-head package and validation evidence.
4. Run strict review with the repaired worktree lifecycle.
5. If strict is unavailable, apply only a fresh, active exact authorization for
   the authorized-degraded route; do not reuse an expired prior authorization.
6. Complete formal Verify, then obtain separate authorization before any
   GitHub issue, PR, Sync, Archive, or merge transition.

## 8. Workspace and Safety Notes

The primary workspace is dirty and stale by design. At handoff creation it is
on `fix/harden-independent-review-result-transport` at `49704a81...`; it
contains user/concurrent modifications and untracked OpenSpec, skill, eval,
design-brief, and documentation assets. Preserve them. Do not reset, clean,
checkout over, or treat their presence as part of the new repair.

Registered related worktrees include:

- `/private/tmp/ai-skills-implementation-quality-85`
- `/private/tmp/ai-skills-implementation-quality-85-archive`
- `/private/tmp/ai-skills-implementation-quality-85-final`
- `/private/tmp/ai-skills-research-planning-86`
- `/private/tmp/ai-skills-review-transport`

Treat Git, OpenSpec, GitHub, and actual worktree state as authoritative over
this snapshot. Run read-only checks first. Do not remove any worktree without
explicit authorization and a verified owner/status.

`openspec validate --all --strict` passed 25/25 on 2026-08-14 after the new
design brief was written. Rerun it before delivery; it is not future evidence.

## 9. Suggested New-Session Prompt

```text
Read AGENTS.md, docs/sdd-workflow.md,
docs/sdd-foundation-operations.md, and
ai-planning/handoff-docs/independent-review-worktree-lifecycle-and-research-resumption-handoff.md.

Re-derive Git, OpenSpec, worktree, and relevant GitHub state without mutating
anything. Preserve all unrelated dirty work and registered worktrees.

Use ai-planning/design-briefs/independent-review-worktree-lifecycle-and-diagnostics.md
to Explore and Propose a focused change named
harden-independent-review-worktree-lifecycle, then stop for the required Apply
authorization. The repair must implement the owner-decided bounded outer
worktree-lifecycle capability, safe request-bound diagnostic JSON, and an
unchanged restricted inner reviewer. Do not use archive-only views as a general
replacement, generic error-matching escalation, a broad shell escape hatch,
danger-full-access, or a manual owner-run host command.

After that repair is delivered through its governed lifecycle, resume
add-base-skills-research-and-planning from durable state. Obtain a fresh,
up-front autonomous delivery request if one is needed; do not reuse the prior
12-hour authorization. Require current exact-head validation and independent
review before its production delivery; do not merge, Sync, Archive, or create
GitHub tracking without the relevant separate authorization.
```

## 10. LinkedIn Writing Insights (Not Delivery Evidence)

Use these as themes, not claims of a completed or flawless system. Remove
repository paths, issue numbers, internal command syntax, and sensitive
operational details from public writing.

- A sandbox policy is executable architecture, not deployment plumbing. A
  temporary checkout can still require a shared Git-metadata write.
- The useful authorization unit is a bounded capability—“create and clean one
  detached review worktree for this sealed commit”—not a list of error strings
  that keeps growing with every new failure.
- Good autonomy separates the outer helper that may perform a narrow lifecycle
  action from the inner reviewer that must remain restricted. “Same workflow”
  does not mean “same privileges.”
- Fail-closed systems need good explanations. A machine-readable unavailable
  result with safe diagnostics is more useful than a vague failure and safer
  than logging raw environment or review content.
- Independent review has two distinct contracts: setup/provenance of the
  review environment and acceptance of the reviewer's final owned result.
  A transcript that looks like `passed` is not evidence if the sealed artifact
  says otherwise.
- Strong engineering processes reveal their own defects. That is a feature of
  layered evidence gates, not proof that the process failed.
- The practical lesson is not “use more approvals.” It is “put the smallest
  necessary authority in the correct layer, bind it to immutable inputs, and
  make failures observable without weakening the control.”
