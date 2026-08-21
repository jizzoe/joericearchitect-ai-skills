# Autonomous SDD blocker register and plain-English handoff

Date: 2026-08-21
Status: active operating handoff; it does not authorize a new change, repair,
GitHub write, or state mutation.

## Purpose

This handoff is the durable record for future sessions that run, review, or
recover autonomous SDD work in this repository. It has two jobs:

1. explain autonomous-run status in clear, plain English; and
2. keep one running, evidence-backed list of blockers, including whether each
   blocker is expected to disappear after the reliability-control-plane
   milestones are complete or needs a separate permanent repair.

Read this document before resuming a blocked autonomous delivery. The
repository, OpenSpec, GitHub, and runtime state remain authoritative; this
document is an explanation and index, not a substitute for current inspection.

## Plain-English communication rule

For every autonomous step that pauses, the operator must explain all of the
following before asking for a decision or reporting the pause:

- **What was being attempted:** name the exact run, lifecycle step, and target.
- **What stopped it:** quote the typed result or evidence reference, then say
  what it means in ordinary language.
- **Why the guard exists:** define the technical term in context. For example,
  a **repository claim** is the system's exclusive-work marker: it prevents two
  automated runs from changing the same repository at once.
- **Whether this is expected after the full roadmap:** choose one of the
  classifications below and explain the answer.
- **What fixes it:** list the smallest safe repair, the evidence it needs, and
  whether fresh owner authorization is required.
- **What remains untouched:** state any branches, files, issues, claims, or
  external records that were deliberately not changed.

Do not say merely “blocked by state,” “admission failed,” or “needs repair.”
Define those terms. Do not describe an attempted command as a completed step.

### Blocker classifications

| Classification | Plain-English meaning | Expected after all milestones? | Required response |
|---|---|---|---|
| Temporary roadmap gap | A planned capability is not built yet, so a current run cannot safely do something the finished system will support. | No, if the relevant milestone is implemented and qualified. | Name the milestone and preserve the state; do not bypass the guard. |
| Permanent repair | The system has a defect, missing transition, or inconsistent durable state that must be corrected even if later milestones are delivered. | It may still cause a pause until repaired. | Create a narrow, tested repair or a separately authorized reconciliation; do not edit durable records by hand. |
| Intentional safety stop | The system lacks current proof or permission, such as an active run, stale evidence, unavailable credentials, conflicting configuration, or a dirty resource. | Yes. A finished system should still stop safely in these conditions. | Explain the missing proof and give the exact safe resume path. |
| External/environment stop | A required service, credential, host permission, network, or tool is unavailable. | Yes. Milestones cannot guarantee an external service is available. | Preserve local evidence and retry only the exact affected operation when the dependency is restored. |
| Human decision | Continuing would choose product behavior, security posture, ownership, or an external target not already approved. | Yes. Human decisions remain deliberate. | Ask one concise, decision-specific question; do not guess. |

## Current blocker: M1-S2 claim was left active

### What was attempted

The authorized M1-S3 delivery
`establish-autonomous-sdd-runtime-config-provenance` was normalized as an
autonomous `prototype-rapid` run with same-session local review and a four-hour
expiry. Before it could create a proposal, branch, issue, or other lifecycle
resource, it attempted v2 admission for this repository.

### Evidence

The v2 controller returned `v2-admission-immutable-conflict`. Its current
state contains one active M1-S2 run:

- parent run: `m1-s2-20260821-131722-parent`
- work unit: `m1-s2-20260821-131722-workunit`
- claim: `m1-s2-20260821-131722-claim`
- selected change: `unify-autonomous-sdd-operation-contract`
- state root:
  `/Users/joerice/.local/state/ai-skills/autonomous-sdd/repositories/joericearchitect-ai-skills--1a26c8325157/active/`
- recorded deadline: `2026-08-21T17:17:22Z`

The M1-S2 OpenSpec/GitHub lifecycle itself is complete: implementation PR
#159, Sync PR #160, and Archive PR #161 were merged; its issue was closed and
the change was archived. That evidence is necessary, but it is not a v2
terminal record.

### Plain-English explanation

The **v2 admission** is the runtime's controlled start procedure. It checks
whether another automated run already owns the repository. The M1-S2
**repository claim** says, “this run is the only one allowed to make automated
changes here.” It was created correctly during the bootstrap delivery, but it
was never changed to “released” and never moved from the active area to the
completed-run archive.

M1-S3 therefore stopped before changing anything. Starting a second run while
the first claim says it is active could permit overlapping changes, so the stop
is the right immediate behavior.

No M1-S3 OpenSpec artifacts, branch, issue, pull request, GitHub mutation, or
runtime record were created. The uncommitted M1-S3 design-brief and roadmap
edits on `main` were also left untouched.

### Would this have happened after all milestones were complete?

**Not in this unresolved form.** A complete control plane should still pause
when it genuinely sees another active run; that is an intentional safety stop.
But it should also have a supported, evidence-backed way to recognize a
finished run, record its terminal summary, release its claim, archive its run
history, and resume the next eligible run.

The roadmap assigns the missing pieces across these slices:

- **M2-S1** provides authoritative local history, ownership, claim handling,
  and safe recovery/takeover.
- **M2-S2** provides the executable, deterministic transition that records and
  commits one legal lifecycle step.
- **M2-S3** provides a truthful status and recovery view, including an exact
  reason a run cannot resume or release a claim.
- **M4-S3** requires terminal convergence: delivery, archive, run terminal
  state, claim release, and exact-owned cleanup must agree before “complete.”
- **M4-S4** and later qualification milestones test real end-to-end completion
  and fault recovery so this kind of leaked terminal state is detected.

In other words, the completed system would preserve the protective pause if
evidence were genuinely incomplete, but it would not leave a successfully
delivered run permanently blocking the next one without a typed recovery path.

### Classification and repair

| Item | Classification | Why | Required repair or next action |
|---|---|---|---|
| Refusal to start M1-S3 while M1-S2 has an active claim | Intentional safety stop | One active mutating run per repository prevents overlapping automation. | Keep the refusal. Do not weaken or bypass it. |
| M1-S2 has completed OpenSpec/GitHub delivery but no supported v2 terminalization | Permanent repair and temporary roadmap gap | The current runtime can admit a v2 run but has no exposed, evidence-checked operation to finalize this bootstrap run. The later M2/M4 milestones design the durable version. | Deliver a narrow, separately authorized bootstrap terminalization repair before M1-S3. It must not hand-edit or delete the active record. |
| Current M1-S3 admission pause | Temporary until the exact M1-S2 repair converges | M1-S3 has no defect shown; its safety check is working. | Re-run admission only after current state proves the M1-S2 claim is released/archived and no active run remains. |

### Required one-time repair boundary

The repair must be a distinct, exact-authorized action, not an informal
override. It should:

1. bind only the named M1-S2 parent run, work unit, claim, repository identity,
   and completed PR/issue/archive evidence above;
2. validate that the delivered state really is terminal before writing;
3. create the required terminal summary and claim-release evidence through a
   tested controller operation;
4. atomically move the verified run from active state to its immutable archive
   and rebuild the repository index;
5. prove a fresh M1-S3 admission sees no active M1-S2 run; and
6. forbid new runs, unrelated repository/GitHub changes, broad cleanup, manual
   state edits, credential changes, and deletion of audit evidence.

The internal `archiveTerminalRun` helper is not an acceptable workaround by
itself. It is not exposed as an installed controller lifecycle operation and
the current active M1-S2 record does not yet contain the terminal summary and
released-claim evidence that it requires.

### Repair status (2026-08-21)

The owner authorized the exact one-time repair. The isolated repair change is
`repair-m1-s2-v2-terminalization` on
`fix/m1-s2-v2-terminalization-repair`. Its proposed behavior is a declared,
structured controller operation named `terminalize-v2-run`; it is not a manual
state-file edit and it is not yet evidence that M1-S2 has been terminalized.

The repair is linked to GitHub issue
[#162](https://github.com/jizzoe/joericearchitect-ai-skills/issues/162). The
issue is deliberately a repair record, not an M1-S3 record. It is open while
the repair code is reviewed and delivered.

Before the operation is used on the real record, the repair must be delivered,
the released runtime must be installed, M1-S2's delivery and cleanup evidence
must be reread, and the exact request must pass its validation. If any of those
steps pauses, append a new blocker row with the exact missing proof rather than
changing the target or weakening the claim guard.

## Running blocker register

Append every future pause here using the same fields. Keep old rows; update a
row only to add dated evidence or a resolution link.

| Date | Run/change and step | Typed result | Plain-English cause | Classification | Would it still block after all milestones? | Repair / safe resume | Resolution evidence |
|---|---|---|---|---|---|---|---|
| 2026-08-21 | M1-S3 `establish-autonomous-sdd-runtime-config-provenance`, v2 admission | `v2-admission-immutable-conflict` | A completed M1-S2 delivery still owns the repository because its v2 claim was not finalized. | Intentional safety stop; underlying permanent repair and temporary roadmap gap | A real active run would still stop; a completed run should have a supported terminalization route. | Exact M1-S2 bootstrap terminalization repair, then fresh M1-S3 admission. | Pending. |
| 2026-08-21 | M1-S2 repair, GitHub issue binding | Restricted runtime could not itself use the host GitHub login; host evidence showed account `jizzoe`. | A **restricted runtime** is the isolated program environment used to avoid giving reusable automation direct access to personal credentials. It correctly had no GitHub login, but the current issue helper could not carry the already approved host-authentication context into its protected call. | Intentional credential boundary plus permanent helper-integration repair | The isolated runtime should still lack personal credentials. A finished system should, however, accept a non-secret, exact host-authentication receipt for an authorized external action instead of needing a one-time bridge. | Keep credentials outside the runtime. Extend the issue helper and operation contract to consume a verified host-authentication receipt, then test the restricted/host handoff. The one-time repair used its exact bootstrap binding and verified issue #162. | Bootstrap record `bootstrap-repair-m1-s2-v2-terminalization-20260821`; issue #162 is open with labels `sdd`, `type:bug`. |
| 2026-08-21 | M1-S2 repair, commit preparation | `git diff --cached --check` reported trailing whitespace in two Markdown lines. | A **format gate** checks mechanically that a proposed commit contains no known whitespace errors. It stopped the commit before Git recorded anything. | Intentional quality stop | Yes. Finished milestones should continue to reject malformed commit content. | Remove the trailing spaces, rerun the check, and stage only the same reviewed files. | Corrected before commit; recheck pending. |
| 2026-08-21 | M1-S2 repair, PR authentication preflight | The runtime returned `unexpected-argument` because the helper received a verb where its payload protocol requires an operation field inside JSON. | A **payload protocol** is the exact JSON shape a helper accepts. The launcher rejected an ambiguous command before it could run a GitHub operation. | Intentional interface-validation stop | Yes. A completed system should keep rejecting malformed commands before they reach external services. | Send the declared JSON request shape, then rerun the same read-only authentication probe. | Corrected; the exact PR preflight binding and host-authentication evidence were produced. |
| 2026-08-21 | M1-S2 repair, PR merge | GitHub rejected a merge-commit request: merge commits are disabled for this repository. | A **merge strategy** is the approved way GitHub adds a PR to the main branch. This repository requires squash or rebase history, so it refused an unapproved history shape before changing `main`. | Intentional repository-policy stop | Yes. Finished milestones should keep enforcing the repository's chosen merge strategy. | Use the configured squash merge after all checks pass; retain the PR and issue linkage. | Pending squash merge. |
| 2026-08-21 | M1-S3 runtime-configuration-provenance, implementation admission | M1-S3 was admitted before the feature that seals its configuration snapshot exists. | An **immutable admission record** is a write-once record of what a run was allowed to use. Its current configuration digest represents the old resolver inputs, so rewriting it would falsify the new feature's evidence. | Intentional safety stop plus bootstrap sequencing defect | A finished system should still reject attempts to rewrite a run's admitted configuration. The sequencing defect is temporary: a mature planner must either admit after the feature is available or use a recorded bootstrap bridge. | Do not edit the record. Obtain an exact owner-approved bridge that permits this M1-S3 delivery to retain its pre-feature admission only through Archive, then terminalize it with the released M1-S3 runtime and start future runs with the new snapshot. | Pending owner decision. |
| 2026-08-21 | M1-S3 runtime-configuration-provenance, follow-up implementation verification | Runtime inventory test expected ten declared wrappers but found nine; the resolver existed in source but was not yet declared in the installable runtime manifest. | A **runtime manifest** is the checked list of helpers a released runtime is allowed to expose. Without its wrapper and manifest entry, an installed runtime cannot call the resolver even though the source file exists. | Permanent implementation repair; intentional quality stop | The manifest test should still stop this mistake after all milestones. The missing exposure itself is a repair, not a roadmap gap. | Add the thin runtime wrapper and manifest entry, preserve the existing source boundary, rerun the runtime inventory and full suite, then review and merge the follow-up PR. | Resolved locally: runtime wrapper/manifest inventory passes; final full suite passed 364/364 and strict OpenSpec validation passed 39/39. |
| 2026-08-21 | M1-S3 runtime-configuration-provenance, follow-up record review | The work-unit record retained only a configuration digest, not the required redacted snapshot and source provenance. | A **digest** is a short mathematical fingerprint. It can prove that two values match, but it cannot show a later reviewer what safe settings and source were approved. | Permanent implementation repair; intentional quality stop | A completed system should keep rejecting a record that lacks its required admission evidence. This is not expected to disappear merely by finishing later milestones. | Persist the canonical redacted snapshot alongside its digest, validate that the two match, prove resumed runs keep the original snapshot after the config file changes, then rerun review and full verification. | Resolved locally: record contract now requires snapshot/digest agreement and the no-reread regression passes; final full suite passed 364/364 and strict OpenSpec validation passed 39/39. |
| 2026-08-21 | M1-S3 runtime-configuration-provenance, same-session portability review | A Windows drive path (`C:\\…`) could be mistaken for a relative path when validation ran on a non-Windows host. | A **portable validator** must give the same accept-or-reject answer on every supported operating system. Otherwise a configuration approved on one computer can mean something different on another. | Permanent implementation repair; intentional quality stop | Yes. A finished system must continue to reject any absolute or machine-specific path, regardless of which operating system validates it. | Reject Windows drive and network path forms explicitly in both resolver and immutable-record validation; retain a regression test. | Resolved locally: both validators reject drive/network absolute forms; focused, full (364/364), and strict OpenSpec (39/39) evidence passed. |
| 2026-08-21 | M1-S3 runtime-configuration-provenance, Archive Project convergence | Issue #165 was closed but had no item in the configured Project, so it could not yet have the required `Done` status. | A **Project item** is the board entry that records work status separately from the issue’s open/closed state. Closing an issue does not automatically prove it was added to a board or moved to its final column. | Permanent lifecycle-integration repair; intentional Archive gate | A finished system should still refuse Archive when issue and Project evidence disagree. The missing automatic add-and-transition is a repair that later lifecycle work must make reliable and test end to end. | Add only issue #165 to Project 1, set its configured Status field to `Done`, reread the item, and then continue Archive. Future lifecycle transition code needs an idempotent issue-to-Project reconciliation test that covers a closed issue missing a Project item. | Resolved: Project item `PVTI_lAHOADpDHM4Bfzvdzg3g8Yo` is present with status `Done`; it links PRs #166 and #168. |
| 2026-08-21 | M1-S3 post-Archive terminalization | `terminalization-active-record-invalid` | M1-S3 began before its own configuration-snapshot field existed. The released validator correctly rejects that old record, but lacked a way to finish this exact bootstrap run without rewriting its history. | Temporary bootstrap sequencing gap plus permanent compatibility repair | New completed-system runs will have snapshots and will not hit this shape. Recovery must still refuse unbound old records, but needs a tested exact compatibility path for an already authorized historical bootstrap record. | Deliver `repair-m1-s3-bootstrap-terminalization-compatibility`; require an exact expiry-bound identity/archive binding, preserve original bytes, and keep all ordinary old records blocked. | Focused compatibility fixture passes locally; full verification and delivery pending. |
| 2026-08-21 | M1-S3 compatibility repair, implementation PR linkage | `openspec.tracking_exists` | The repair PR named its OpenSpec change and issue, but the change directory lacked the reciprocal `tracking.yaml` record that lets automated checks prove those names refer to the same work item. | Permanent lifecycle-integration repair; intentional quality stop | Yes. A completed system should keep rejecting a PR whose issue and OpenSpec change cannot be matched by durable metadata. | Add issue #170 and Project 1 metadata plus the exact changed-path scope to `tracking.yaml`, rerun linkage, and retain the repair PR. | Corrected locally; CI rerun pending. |

## Future-session procedure

1. Read this handoff, the relevant design brief, and the current roadmap.
2. Inspect current Git, OpenSpec, GitHub, Project, controller, and runtime
   state. Do not rely on the date or status in this document alone.
3. If a step pauses, classify it with the table above and add a row before
   proposing a workaround.
4. Say whether the stop is an intentional finished-system safeguard, a
   temporary missing milestone, an external dependency, a human decision, or
   a permanent defect. It may be more than one.
5. For a repair, keep the target exact and prove that it cannot modify
   unrelated runs or resources. Obtain new owner authorization when the repair
   crosses a lifecycle, GitHub, or durable-state mutation boundary.
6. After a repair, add the evidence link and retain the original blocker row.
   Then resume only the first incomplete evidenced lifecycle step.

## Authoritative references

- [M1-S1 run contract](../design-briefs/autonomous-sdd-reliability-control-plane/m1-s1-run-and-work-unit-contract.md)
- [M1-S3 configuration-provenance brief](../design-briefs/autonomous-sdd-reliability-control-plane/m1-s3-runtime-configuration-provenance.md)
- [M2-S1 local durable backend brief](../design-briefs/autonomous-sdd-reliability-control-plane/m2-s1-local-durable-execution-backend.md)
- [M2-S2 transition engine brief](../design-briefs/autonomous-sdd-reliability-control-plane/m2-s2-deterministic-transition-engine.md)
- [M2-S3 status and recovery brief](../design-briefs/autonomous-sdd-reliability-control-plane/m2-s3-run-status-and-recovery.md)
- [M4-S3 finalization and cleanup brief](../design-briefs/autonomous-sdd-reliability-control-plane/m4-s3-finalization-and-cleanup.md)
- [control-plane roadmap](../plans/autonomous-sdd-reliability-control-plane-roadmap.md)
