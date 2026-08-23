# Autonomous SDD emergency bootstrap recovery handoff

Date: 2026-08-22

## Purpose

This handoff lets a fresh session execute the owner's approved emergency
bootstrap-recovery delivery safely. It replaces an unsafe attempt to finish an
expiring controller as an ordinary delivery, then leaves M2-S1
`add-autonomous-sdd-local-execution-backend` Propose-ready without beginning
M2 implementation.

The authoritative authorization is reproduced in
[Approved owner authorization](#approved-owner-authorization). Do not infer
broader authority from this handoff.

## Read first

1. [SDD workflow](../../docs/sdd-workflow.md)
2. [SDD foundation operations](../../docs/sdd-foundation-operations.md)
3. [Autonomous SDD lifecycle skill](../../skills/base/autonomous-sdd-lifecycle/SKILL.md)
4. [Autonomous SDD delivery skill](../../skills/base/autonomous-sdd-delivery/SKILL.md)
5. [Stabilization and roadmap resumption handoff](autonomous-sdd-stabilization-and-roadmap-resumption-handoff.md)
6. [Reliability-control-plane roadmap](../plans/autonomous-sdd-reliability-control-plane-roadmap.md)
7. [M2-S1 brief](../design-briefs/autonomous-sdd-reliability-control-plane/m2-s1-local-durable-execution-backend.md)

Run `ai-skills-runtime doctor`, inspect Git/OpenSpec/GitHub/Project state, and
reread all durable state before any mutation. Do not rely on this document for
live state.

## What is already delivered

- M1-S1 run/work-unit contract, M1-S3 runtime configuration provenance, the
  v2 initializer repairs, and planning stabilization are delivered.
- Planning correctly identifies M2-S1 as the next dependency-valid milestone.
- M2-S1 remains planning-only until its substrate decisions are recorded; its
  implementation must not begin in this recovery delivery.

## Current blocked state at handoff

### Primary workspace

- Repository: `jizzoe/joericearchitect-ai-skills`
- Primary branch: `docs/autonomous-sdd-stabilization-planning`, behind
  `origin/main` by 11 commits.
- Preserve these user-owned primary-worktree changes exactly:

  ```text
   M ai-planning/handoff-docs/autonomous-sdd-blocker-register-and-plain-english-handoff.md
  ?? ai-planning/handoff-docs/autonomous-sdd-stabilization-and-roadmap-resumption-handoff.md
  ?? ai-planning/notes/
  ```

### Expiring controller that must not be treated as a completed delivery

The existing controller is still at `propose`; it has no Issue, Project, PR,
Sync, Archive, or cleanup completion evidence. Its immutable expiry is
`2026-08-23T00:00:00.000Z`.

| Field | Exact value |
| --- | --- |
| Controller | `controller-cf2ecbc380a3ee49a2fe23768951f7cf` |
| Selected entry | `repair-controller-cleanup-wrapper-and-ordering` |
| Parent run | `parent-cf2ecbc380a3ee49a2fe23768951f7cf` |
| Work unit | `workunit-cf2ecbc380a3ee49a2fe23768951f7cf` |
| Claim | `claim-cf2ecbc380a3ee49a2fe23768951f7cf` |
| Repository ID | `r1-1a26c8325157ad466a639887fd2a359513b45286a9f4f25b9860936eb18a17c2` |
| Provider | `native-claim` |
| Provider digest | `e5ff3ef11970b3fbd0096a3190bf6ff1e0f81fdf80414e653f3ff5bee6ba2ed0` |
| Controller file | `.git/sdd-delivery-runs/runs/controller-cf2ecbc380a3ee49a2fe23768951f7cf/controller.json` |

The pre-recovery runtime has terminalization but no canonical cancellation or
retirement operation for an unfinished, expired controller. Do not hand-edit
the controller, parent run, work unit, claim, or archive files. Do not call
`admit-v2-run` or initialize another v2 delivery while this claim is active.

### Existing registered resources

The expiring controller owns only the following local resources. They remain
ineligible for manual cleanup until the cancellation/retirement repair provides
the required durable outcome.

| Kind | Identity | Registered head |
| --- | --- | --- |
| Branch | `fix/repair-controller-cleanup-wrapper-and-ordering` | `3f9405b9d7d309626345fe21d0195cc9b8bbfeac` |
| Worktree | `/private/tmp/ai-skills-repair-controller-cleanup-wrapper-and-ordering` | `3f9405b9d7d309626345fe21d0195cc9b8bbfeac` |

The worktree currently contains uncommitted, scoped repair work:

```text
M scripts/github/create-or-find-issue.mjs
M scripts/github/test/github-intake.test.mjs
M scripts/runtime/bin/autonomous-sdd-controller.mjs
M scripts/sdd/autonomous-sdd-controller.mjs
M scripts/sdd/test/autonomous-sdd-controller.test.mjs
?? openspec/changes/repair-controller-cleanup-wrapper-and-ordering/
```

The prepared changes add the host-context CLI selector, wire local Git cleanup
operations into the installed wrapper, stage worktree cleanup before branch
cleanup, and add focused tests. They are useful evidence and may be incorporated
only if the new recovery change deliberately adopts, reviews, tests, and
delivers them. They are not delivered evidence and must not be described as
complete.

### Pending Issue binding

The old controller persists an exact, pending Issue binding:

| Field | Value |
| --- | --- |
| Title | `[Bug] Repair controller cleanup wrapper and ordering` |
| Labels | `sdd`, `type:bug` |
| Payload digest | `2a1b48e60def3e68b88a125616c0d11913c3d7e85225fcd868e45637374f8212` |
| Binding digest | `609f685c8bafa97e482510ceb1af0889dd909a970a5616ed6eb073b80cce493f` |
| Expiry | `2026-08-23T00:00:00.000Z` |

It also has delivered, non-secret auth-context evidence for this exact Issue
operation only. The evidence proves `credential-unavailable-in-restricted-runtime`
with host account `jizzoe`; it does not authorize any other target or operation.
After expiry, do not reuse it.

## Why ordinary closeout cannot continue

The previously installed runtime is valid but predates the repair:

```text
runtime root: /Users/joerice/.ai-skills/runtime/runtime-e0e9a50a042b
source revision: 138b2212f33af4dc97abaedff93d3d7e4558c61e
contract version: 1
digest: e0e9a50a042bae3ba43f842ced29799546860edf09464dc49557a3aed70c274a
```

Two distinct bootstrap facts matter:

1. The existing paired installer always installs global skills before it
   activates a runtime. It has no supported runtime-only installation mode.
   Using it would violate the owner boundary prohibiting global-skill changes.
2. `scripts/dev-link-runtime.sh` can build a manifest-verified temporary
   runtime and select it through `AI_SKILLS_RUNTIME_ROOT`. This is useful only
   for the bootstrap delivery's exact host-side operations. It is explicitly
   `mode: dev`; it does not install or activate the released runtime and cannot
   satisfy final installation by itself.

Also, the issue helper's `host` execution-context selector authorizes use of a
matching host-auth receipt. It does not move a child `gh` process out of the
restricted runtime. The actual Issue, Project, PR, merge, Sync, Archive, and
issue-close operations must run through the host permission boundary after
fresh exact target inspection and non-secret preflight evidence.

## Approved owner authorization

> I authorize one autonomous, emergency pre-v2 bootstrap recovery delivery
> named `recover-autonomous-sdd-bootstrap-runtime-and-controller-state`,
> expiring 2026-08-24T00:00:00Z.
>
> It may create and complete its Issue, Project item, OpenSpec artifacts,
> implementation/Sync/Archive PRs, Archive, exact cleanup, and a runtime-only
> installation lifecycle. It creates no v2 or legacy claim for itself.
>
> Its exact scope is limited to:
>
> 1. Add a supported runtime-only installation mode that builds, verifies,
> retains, activates, and rolls back the shared runtime without invoking or
> changing global skills. The existing paired installer remains the default.
> 2. Complete the already identified cleanup repair behavior: inject
> installed-wrapper Git cleanup operations; remove exact owned worktrees before
> evaluating attached local branches; retain remote branches; and add focused
> installed-wrapper integration coverage.
> 3. Complete the exact host-context issue-intake handoff: accept only current,
> matching, non-secret host-contrast evidence and add focused coverage.
> 4. Add a canonical, receipt-backed expired-controller cancellation/retirement
> operation. It may retire only the exact current controller
> `controller-cf2ecbc380a3ee49a2fe23768951f7cf`, its matching parent run
> `parent-cf2ecbc380a3ee49a2fe23768951f7cf`, work unit
> `workunit-cf2ecbc380a3ee49a2fe23768951f7cf`, and claim
> `claim-cf2ecbc380a3ee49a2fe23768951f7cf` after expiry. It must preserve
> immutable history, record that the run was cancelled rather than completed,
> release only that exact claim, and never infer authority over another run.
>
> For the bootstrap delivery only, I authorize use of the existing
> manifest-verified development-runtime override in a temporary directory,
> followed by the new runtime-only installer after Archive. The override may be
> used only for this delivery's exact, verified host-side GitHub operations.
> Host-side Issue, Project, PR, merge, Sync, Archive, and issue-close operations
> must each have current exact target verification, a non-secret preflight
> receipt, and durable recovery evidence.
>
> Retain remote branches; if GitHub auto-deletes a merged topic branch, restore
> only its exact recorded ref. Do not change global skills, credentials,
> credential scopes, deployments, unrelated repositories, unrelated GitHub
> records, or unrelated local files. Do not force-push or delete remote branches.
>
> After the bootstrap recovery is delivered and its released runtime is
> installed runtime-only, use its cancellation operation to retire the exact
> expired controller and release its claim. Then perform exact cleanup of only
> the cancelled controller's registered resources, retaining anything dirty,
> ambiguous, mismatched, or otherwise ineligible.
>
> Finally, run the already authorized planning-only M2-S1 readiness and
> OpenSpec Explore pass through 2026-08-24T00:00:00Z. Apply the owner decisions
> already given for native locking, explicit takeover, fail-closed filesystem
> admission, contract-only operation, and the 1,000–1,200 line tripwire. Create
> no M2 Issue, Project item, branch, PR, v2/legacy claim, controller, or
> implementation. Finish with the M2-S1 Propose-ready design, dependency
> evidence, and the one exact authorization needed to implement M2-S1.
>
> If any identity, receipt, test, review, authorization, capability, or
> external-state check fails, preserve evidence and stop without bypassing it
> or broadening scope.

## Required execution order

1. Reinspect live durable state and confirm this authorization remains current.
   If the old controller has not yet expired, do not retire it early.
2. Start only the named **pre-v2** recovery delivery. It must create no v2 or
   legacy claim and must not reuse the old controller as its own controller.
3. Propose, review, and apply the four named repair capabilities. The
   cancellation operation must distinguish cancelled/retired from delivered and
   terminalized; it must prove exact identity, expiry, active claim state, and
   receipt/archive consistency before releasing the claim.
4. Use the temporary development runtime only for the bootstrap delivery's
   exact host-bound lifecycle actions. Record its manifest digest and temporary
   location in non-secret evidence; remove the override after use.
5. Deliver implementation, Sync, and Archive through independently registered
   resources and evidence. Retain remote topic refs.
6. Use the new runtime-only installation mode from released `origin/main`.
   Verify its manifest, digest, contract, retained prior runtime, activation,
   and that no global skills changed.
7. Invoke the released cancellation operation only for the exact expired old
   controller identities listed above. Verify its immutable cancellation receipt
   and exact claim-release record.
8. Run exact owned-resource cleanup only after the cancellation evidence is
   current. Never delete a dirty, locked, primary, ambiguous, or mismatched
   resource. Remote refs remain out of scope.
9. Run planning-only M2-S1 Explore. Do not create M2 delivery records or start
   implementation.

## M2-S1 decisions already accepted

The readiness pass does not need a new owner decision for these boundaries:

1. Select the smallest audited Node 20.19 native-lock adapter that proves
   required POSIX and Windows native-lock behavior; never use PID, timeout, or
   `mkdir` locks.
2. No automatic stale-owner takeover. Takeover is explicit and operator
   invoked, with fresh lock, capability, claim, and generation checks. An old
   owner must fail subsequent writes.
3. Admit only local filesystems whose selected adapter proves native locking
   and durable-write capability. Reject network, removable, unknown, and
   unqualified filesystems fail-closed.
4. M2-S1 is contract-only/audit-only. It activates neither real lifecycle
   ownership nor external adapters.
5. An estimated core implementation beyond the established roughly
   1,000–1,200 production-line range is a hard build-versus-adopt stop.

## Required completion evidence

The fresh session must not claim recovery completion until all are current:

- strict `openspec validate --all --strict` passes;
- focused and installation tests pass, including no-global-skill runtime-only
  installation, rollback, host-context binding, installed cleanup wrapper,
  worktree-before-branch ordering, retained remote refs, and expired-run
  retirement isolation;
- same-session local review, requirements mapping, security/supply-chain,
  portability, attribution, and recovery reviews are current for the final
  head;
- implementation, Sync, and Archive have distinct merged PR and delivered-head
  evidence; the Issue is closed and Project is `Done`;
- the released runtime is installed runtime-only and its prior runtime is
  retained;
- the old controller has a cancellation/retirement receipt, not a fabricated
  delivery-terminalization receipt, and only its exact claim is released;
- exact cleanup receipts prove the disposition of each registered old resource;
- the M2-S1 Explore output contains the selected design, scope, dependencies,
  risks, and a single implementation authorization request.

## Known stop conditions

Stop rather than improvise if any of these occur:

- the old controller has a conflicting durable record or is not yet expired;
- an Issue, Project, PR, branch, or merge target differs from the exact
  inspected target;
- host preflight fails, credentials are unavailable, or a host permission
  boundary is denied;
- the runtime-only installer would change a global skill, lacks manifest or
  rollback evidence, or cannot retain the prior runtime;
- cancellation would touch any identity other than the exact old controller,
  run, work unit, and claim;
- a resource is dirty, locked, primary, delivery-mismatched, or ambiguous;
- M2 Explore finds a substrate choice that fails the accepted constraints or
  crosses the complexity tripwire.

## Fresh-session opening checklist

Start with this sequence, in order:

```text
1. Read this handoff and the listed workflow documents.
2. Run ai-skills-runtime doctor.
3. Inspect primary Git state without changing user-owned files.
4. Inspect the exact old controller and v2 active/archive state.
5. Inspect existing Issue/Project/PR targets before creation.
6. Confirm the old controller expiry against the live clock.
7. Begin the named pre-v2 recovery delivery only if every authorization and
   identity check passes.
```

Do not begin M2 implementation in this session. The expected endpoint is an
archived bootstrap recovery, a retired old controller with only its claim
released, exact cleanup evidence, a runtime-only released installation, and an
M2-S1 Propose-ready plan.
