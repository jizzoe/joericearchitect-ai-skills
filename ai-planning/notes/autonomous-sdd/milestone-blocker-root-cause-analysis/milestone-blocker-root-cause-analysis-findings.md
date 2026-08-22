# Why M1 produced repeated autonomous-SDD blockers

Date: 2026-08-22 (initial evidence gathered 2026-08-21)
Status: Evidence-backed analysis note. This note does not authorize a repair, lifecycle mutation, or roadmap change.

## Executive finding

The large number of pauses has one dominant cause: **the project activated part of the new v2 control system before the minimum end-to-end lifecycle needed to operate it existed**.

In plain English, M1 installed the new rules for starting work and claiming the repository, while the matching abilities to initialize the controller, finish a run, release its claim, register cleanup resources, recover reliably, and execute the full GitHub lifecycle are planned for later milestones. The retained pre-v2 lifecycle then had to deliver changes for a partially active v2 system. That hybrid state created circular dependencies: a repair often needed the capability that the repair itself was meant to release.

The roadmap's long-term architecture is mostly sound and, in several places, correctly predicts these risks. The main failure is **release sequencing and activation policy**, not the overall target design. There are also two gaps that milestone completion will not necessarily fix without explicit design changes: authenticated host execution from the restricted runtime, and preflight detection of overlapping active OpenSpec requirements. Ordinary implementation and test defects remain possible at any maturity level.

The short answer is therefore:

- Most bootstrap and stranded-state blockers would not occur for new native runs after the full lifecycle is implemented, qualified, and cut over in the intended order.
- Simply finishing the currently written milestones is not enough. The plans need explicit corrections for the bootstrap delivery lane, activation dependencies, external execution boundary, active-delta overlap, and planning reconciliation.
- Some pauses are healthy safeguards and should remain. A mature controller should discover them earlier and report them as one precise action, not repeatedly interrupt the user.

## Evidence reviewed

This analysis covers the 21 recorded pauses in the [blocker register](../../../handoff-docs/autonomous-sdd-blocker-register-and-plain-english-handoff.md), the [master design](../../../design-briefs/autonomous-sdd-reliability-control-plane.md), the [roadmap](../../../plans/autonomous-sdd-reliability-control-plane-roadmap.md), the M1 through M6 slice briefs relevant to the failures, and all planned and repair changes created since M1-S1. Full source provenance is in [sources.md](sources.md).

The Git history contains 25 first-parent commits from the M1-S1 implementation through the M1-S1/M1-S2/M1-S3 delivery and subsequent repairs present on `origin/main` at the time of this review.

## What changed since M1-S1

Three planned M1 slices were delivered:

1. `establish-autonomous-sdd-run-v2-contract` — M1-S1
2. `unify-autonomous-sdd-operation-contract` — M1-S2
3. `establish-autonomous-sdd-runtime-config-provenance` — M1-S3

They were followed by six repair or cutover changes:

1. `reconcile-legacy-bootstrap-controller-records`
2. `repair-m1-s2-v2-terminalization`
3. `repair-m1-s3-bootstrap-terminalization-compatibility`
4. `repair-m1-s3-legacy-cleanup-attachment`
5. `repair-bootstrap-cleanup-fresh-inspection`
6. `repair-v2-controller-initialization`

That is three planned slices and six resulting repairs. It does **not** mean there were six unrelated architectural failures. Most of the repair chain is the downstream effect of one early activation decision:

```text
v2 admission and exclusive claim activated
  -> no complete initializer/finalizer/cleanup lifecycle yet
  -> bootstrap run cannot close normally
  -> later schema changes reject the older bootstrap record
  -> compatibility and migration attachments are needed
  -> cleanup exposes a normalization defect
  -> next run exposes the missing controller initializer
```

### Complete change inventory and causal role

| Change | Kind and current evidence | Why it followed M1-S1 |
|---|---|---|
| `establish-autonomous-sdd-run-v2-contract` | Planned M1-S1; implementation, Sync, and Archive delivered | Introduced the portable records and safety model, but also activated real v2 admission and made it authoritative for new runs before the complete lifecycle existed. This is the causal starting point. |
| `reconcile-legacy-bootstrap-controller-records` | Unplanned cutover repair; delivered and archived | Interrupted pre-v2 planning left two records that the new no-dual-authority guard correctly treated as active. A receipt-based reconciliation path had not existed before cutover. |
| `unify-autonomous-sdd-operation-contract` | Planned M1-S2; implementation, Sync, and Archive delivered | Exercised the newly authoritative v2 admission path and completed its GitHub/OpenSpec delivery, but the active claim could not be terminalized by any released public operation. |
| `repair-m1-s2-v2-terminalization` | Unplanned repair; code and Sync delivered, OpenSpec change still active | Added the missing evidence-bound finalizer. Its own task design retained post-release operational work inside the releasing change, so the change remained active and later conflicted with another Sync. |
| `establish-autonomous-sdd-runtime-config-provenance` | Planned M1-S3; delivered and archived | Its run was admitted before the schema feature it introduced existed. The immutable old record therefore could not satisfy the new validator after release. |
| `repair-m1-s3-bootstrap-terminalization-compatibility` | Unplanned compatibility repair; delivered and archived | Added a narrowly bound terminalization path for that exact pre-snapshot bootstrap record without rewriting history. |
| `repair-m1-s3-legacy-cleanup-attachment` | Unplanned compatibility repair; delivered and archived | Added exact resource ownership and cleanup receipts that the older M1-S3 controller record could not have captured at creation time. |
| `repair-bootstrap-cleanup-fresh-inspection` | Unplanned implementation repair; delivered and archived | Fixed a concrete asymmetric comparison defect exposed only when the new receipt-backed cleanup path exercised fresh inspection. |
| `repair-v2-controller-initialization` | Unplanned lifecycle repair; implementation PR merged; Sync PR #183 paused | Adds the missing supported start operation that binds controller and admission identities. Its Sync exposed the separate active-delta coordination gap. |

The 25 first-parent commits in this interval are the implementation, Sync,
Archive, and follow-up deliveries for these nine changes; they are not 25
distinct root causes. The inventory shows a repeated pattern: one planned slice
activated incomplete real behavior, then the next real lifecycle transition
discovered the next absent half of that behavior.

## Classification of the 21 recorded pauses

The tally below assigns one primary cause to each register entry. Several entries have contributing causes, but counting each once makes the scale understandable.

| Primary cause | Count | Meaning |
|---|---:|---|
| Deliberate correctness or input gate | 4 | The system correctly refused unsafe, malformed, or unauthorized work. |
| Premature cutover or bootstrap lifecycle hole | 6 | New v2 authority was active before the matching lifecycle capability existed. |
| External or lifecycle coordination gap | 6 | GitHub, Project, tracking, or cross-change coordination was unavailable or underspecified. |
| Implementation or test defect | 5 | Delivered behavior did not fully match the already stated requirement. |
| **Total** | **21** | |

The raw total therefore overstates the number of independent architectural
problems:

- six bootstrap pauses trace to one premature-activation/cutover root cause;
- three GitHub 401 pauses trace to one missing authenticated-host execution
  protocol;
- four pauses are correct gates, not defects;
- three are distinct lifecycle-coordination omissions (Project convergence,
  reciprocal tracking, and active-delta overlap); and
- five are implementation or test defects that escaped earlier evidence.

This causal view explains why the interruptions felt repetitive: the register
records every safe stop, while a single missing system boundary can produce the
same stop in several later changes.

### Deliberate gates that should remain

These four stops were correct protections:

- trailing whitespace failed validation;
- a runtime payload was malformed;
- repository policy refused a merge commit;
- a required profile or expiry was not explicitly supplied.

These are not architectural defects. After all milestones, comparable gates should still stop unsafe work. The improvement is operational: validate inputs and repository policy before mutation, aggregate failures, and return one typed explanation with the exact correction.

The exclusive-claim conflict guard was also behaving correctly. The defect was that earlier code could acquire the claim without a supported way to complete and release it.

### Premature-cutover and bootstrap holes

Six pauses came from the hybrid cutover:

- M1-S2's active v2 claim blocked M1-S3 because no supported finalizer existed.
- M1-S3 was admitted before the schema it introduced, so its own record lacked the new snapshot.
- the older M1-S3 record could not terminalize after validation became stricter;
- the M1-S3 run predated durable cleanup-resource registration;
- raw admission created a claim without the controller record required for continuation;
- the initializer repair itself needed the retained pre-v2 lifecycle to deliver it.

These are one causal family. They are not evidence that immutable records or fail-closed claims are bad ideas. Those controls correctly exposed the inconsistency instead of silently rewriting history. The defect was enabling the acquire/admit side of the lifecycle before enabling the initialize/finish/release/recover side.

### External and lifecycle coordination gaps

Six pauses involved boundaries outside the local contract code:

- GitHub authentication was unavailable from the installed restricted runtime on three occasions;
- a closed issue had not converged to Project `Done`;
- `tracking.yaml` was missing reciprocal linkage;
- Sync PR #183 introduced a living-spec scenario that an older active `MODIFIED` delta did not contain.

The repeated GitHub 401 responses are one recurring design gap, not three unrelated failures. The credential is intentionally absent from the restricted runtime, but the design does not yet define a safe broker that asks the authenticated host to perform one exact operation and returns a signed observation without exposing the token.

The current Sync overlap is also systematic. OpenSpec `MODIFIED` requirements are complete replacements. When one active change adds a scenario to a living requirement, another active change holding an older replacement becomes invalid. The existing M4-S2 brief discusses semantic conflicts and shared destinations, but it does not explicitly require an overlap graph across every active delta before opening a Sync PR.

### Implementation and test defects

Five pauses were ordinary delivery defects:

- the runtime-manifest wrapper did not expose a resolver added by the implementation;
- M1-S3 stored a digest but omitted the required sealed configuration snapshot and provenance;
- Windows drive-letter paths were accepted as safe on a non-Windows host;
- cleanup compared the stored and freshly observed `exists` field asymmetrically;
- a fixed-date authorization fixture expired when real time passed it.

The M1-S3 brief already required the full snapshot, runtime exposure, and unsafe-path rejection. Those failures were not missing product design; they were incomplete implementation and evidence. Completing later milestones cannot make this class of defect impossible. Stronger qualification can catch it before merge.

## Root-cause analysis

### 1. The implementation cut over earlier than the roadmap says it should

The roadmap places the complete real lifecycle at M4-S3, single-change qualification at M4-S4, and default cutover at M6-S3. M2-S1 owns the real durable backend, claims, and recovery; M2-S2 deliberately uses simulated adapters. Those boundaries imply that M1 should establish contracts without becoming the sole operational controller.

The M1-S1 brief also says legacy writers should retire only after v2 qualification, an inventory showing no active legacy records, and a tested rollback. But the delivered M1-S1 change made v2 admission authoritative for new runs and disabled legacy creation or advancement. It therefore treated **contract availability** as **operational enablement**.

Those are different events:

- **Contract availability** means the schemas and validation rules exist.
- **Operational enablement** means the new controller is allowed to own real work.
- **Default cutover** means normal entrypoints route to the new controller without a special opt-in.

The plans discuss these ideas, but the M1 acceptance tasks did not enforce them as separate gates. The implementation resolved that ambiguity toward early enablement.

### 2. No explicit controller was assigned to deliver the controller roadmap

Every slice is required to travel through implementation, Sync, Archive, and cleanup. Yet the roadmap never assigns one concrete controller/runtime to deliver M1 through M4 while v2 is incomplete.

That missing bootstrap lane led to repeated one-time exceptions. The correct rule should have existed before M1-S1:

> Runtime N-1 delivers and archives the change that releases runtime N. Runtime N is installed only afterward. Runtime N never evaluates or rewrites its own pre-N bootstrap record unless an explicit compatibility migration exists.

For this roadmap, the safest operating policy is for the retained pre-v2 lifecycle to remain the sole mutating delivery owner while v2 runs in contract, test, or audit-only mode. V2 should not hold an exclusive real-repository claim until initialization, deterministic advancement, terminalization, recovery, resource registration, receipt-backed cleanup, and rollback form one tested vertical slice.

### 3. The milestone split is horizontal where activation requires a vertical slice

The individual capabilities are sensibly separated for implementation, but the system enabled one horizontal layer—admission and claims—without its downstream layers. An exclusive claim is safe only if the same activated release can also initialize its controller, resume after interruption, reach a terminal state, and release the claim.

This is a dependency defect in the activation plan, not necessarily in the module boundaries. The modules may remain separate, but their real-world activation must be atomic behind one qualification gate.

This distinction matters when deciding whether a later milestone is merely
unfinished or the plan itself is wrong. Deferring transition execution to M2,
GitHub delivery to M4, and default cutover to M6 is reasonable **if M1 remains
contract-only**. Once M1 admission was allowed to own the real repository,
those deferred capabilities became runtime prerequisites. The missing work was
no longer safely deferred; it became an activation dependency that the plan did
not enforce.

### 4. Some repair changes contain self-referential completion tasks

The active `repair-m1-s2-v2-terminalization` task list includes using the released repair and resuming another change after delivery. This makes the repair's own completion depend on an operation that can only happen after the repair is released. The code can be delivered while the OpenSpec change remains active, which then creates overlap with later Sync work.

An OpenSpec change should be complete before its implementation and Archive lifecycle finishes. Post-release adoption, migration, or resumption belongs in a separate signed operational receipt, follow-up change, or handoff—not as an unchecked task inside the change that releases the capability.

### 5. Cross-boundary behavior is described but not fully executable

M4-S1 broadly owns GitHub issue, Project, pull-request, credential, and status behavior. M4-S2 owns Sync and Archive conflicts. That is the correct home, but two acceptance contracts need to be more explicit:

- **Authenticated host execution:** the restricted controller must be able to request one exact, authorized GitHub operation from an authenticated host without receiving the host's credential.
- **Active-delta preflight:** before Sync mutation or PR creation, the controller must detect all active changes that replace the same living requirement and reconcile or deliberately serialize them.

Without those additions, these two blockers can recur even after the existing milestone text is implemented.

### 6. Planning truth is fragmented across branches

The current mainline briefs and roadmap are not fully reconciled with delivered work:

- the M1-S1 and M1-S2 briefs still describe themselves as drafts with no implementation, although both changes are archived;
- the roadmap still describes M1-S2 as Explore-ready rather than delivered;
- accepted planning decisions exist on `origin/docs/inflight-autonomous-sdd-planning` but are not on main;
- the Jira linkage follow-up and ad hoc notes were committed as `e237061` on local branch `docs/ad-hoc-jira-linkage-notes`, but that commit is not contained in `origin/main`.

This did not directly cause most runtime failures, but it is a governance defect. A later session can read stale mainline planning, repeat a decision, miss Jira follow-up work, or choose the wrong next slice. Planning reconciliation must be part of slice closeout, not an optional later cleanup.

## Are the design briefs or plans defective?

The answer is mixed.

| Area | Assessment | Why |
|---|---|---|
| Target architecture | Mostly sound | Immutable history, fail-closed claims, deterministic transitions, exact cleanup, and late default cutover are appropriate controls. |
| Roadmap sequencing | Contains a material hole | It predicts that full lifecycle arrives later but does not define who safely delivers the earlier slices. |
| M1-S1 activation contract | Internally ambiguous and implemented unsafely | It says legacy retirement waits for qualification while delivered tasks make v2 authoritative immediately. |
| Activation dependencies | Incomplete | Admission/claim can activate before initializer, finalizer, recovery, cleanup, and rollback. |
| M4-S1 external execution | Underspecified | Credential revalidation exists, but no explicit restricted-runtime-to-authenticated-host operation protocol exists. |
| M4-S2 conflict handling | Underspecified | It does not explicitly preflight overlapping active complete-replacement deltas. |
| M1-S3 requirements | Adequate for the observed feature defects | Snapshot, provenance, runtime exposure, and path safety were already required; implementation evidence missed them. |
| Repair task design | Defective in M1-S2 repair | Post-release use was embedded as a prerequisite for completing the releasing change. |
| Planning governance | Incomplete | Delivered status, accepted decisions, repairs, and deferred Jira work are not reliably reconciled to main. |

The most precise answer is:

- The **target architecture is not fundamentally defective**. Its immutable
  history, singular claim, deterministic transition, exact cleanup, staged
  qualification, and rollback principles are the reason the inconsistencies
  were detected rather than hidden.
- The **activation plan is defective**. It lacks an enforceable rule separating
  “the contract exists” from “this implementation may own a real run.”
- The **bootstrap delivery plan has a hole**. It never names which old runtime
  safely delivers each new controller release.
- M4-S1 and M4-S2 have **specific remaining design holes** for authenticated
  host execution and overlapping active deltas.
- Several other pauses are **unfinished planned capabilities**, not missing
  briefs. They became urgent only because activation happened early.
- The M1-S3 feature brief was sufficiently explicit; its observed snapshot,
  manifest, and path defects were implementation/evidence failures.

## Would these blockers happen after all milestones are complete?

| Blocker family | After all milestones as currently written? | Required response |
|---|---|---|
| Early bootstrap/schema incompatibility | Normally no for new native runs, if cutover waits for qualification | Add the missing activation policy and two-version bootstrap rule so this outcome is guaranteed. |
| Stranded claim from missing initializer/finalizer | Normally no | Treat init, advance, recover, terminalize, release, and cleanup as one minimum activation set. |
| Expected input, validation, or policy stop | Yes, by design | Keep the guard; preflight and explain it earlier and in one message. |
| GitHub authentication boundary | **Yes, potentially** | Amend M4-S1 with an exact host-execution broker and receipt contract. |
| Project and reciprocal tracking convergence | Intended to be handled by M4-S1 | Add explicit negative-path tests for missing Project item and missing `tracking.yaml`. |
| Active OpenSpec delta overlap | **Yes, potentially** | Amend M4-S2 with repository-wide active-delta overlap detection before Sync. |
| Implementation/test defect | Yes, defects remain possible | Strengthen required evidence and qualification; do not classify these as temporary roadmap gaps. |
| Planning drift across branches | **Yes** | Add mainline planning reconciliation to every slice and repair closeout. |

So the correct answer is not “all blockers disappear when all milestones are done.” The temporary bootstrap failures should disappear, but only if the cutover rules are repaired. Deliberate safety gates remain. External execution, active-delta conflicts, code defects, and planning drift require specific permanent controls.

## Tradeoffs and maturity signals

The strongest positive maturity signal is that the system failed closed: it
did not rewrite immutable history, ignore an exclusive claim, infer cleanup
ownership, or merge incompatible specifications. The strongest negative signal
is that those protections are still discovering predictable integration gaps
during live delivery instead of a disposable end-to-end qualification run.

There is a real tradeoff in the recommended correction. Keeping runtime N-1 in
control longer slows adoption of new controller behavior and requires a
carefully maintained bootstrap lane. Activating runtime N capability by
capability appears faster, but the M1 experience shows that it transfers the
integration cost into live repairs and repeated owner approvals. For a control
plane that owns claims, external mutations, and cleanup, the slower vertical
activation gate is the safer and ultimately cheaper choice.

## Implementation patterns and risks

The recurring safe pattern is “prepare immutable intent, execute one exact
operation, persist its receipt, reread authoritative state, then advance.” It
should be applied consistently to controller initialization, authenticated host
operations, GitHub/Project convergence, Sync overlap resolution, terminalization,
and cleanup.

The main risks if the plans remain unchanged are:

- another partial capability becomes operational before its recovery or
  terminal path exists;
- bootstrap exceptions become a shadow control plane with weaker, inconsistent
  evidence;
- repeated host-auth bridges normalize bypassing the intended credential
  boundary;
- active OpenSpec changes continue to invalidate each other late in CI; and
- stale branch-only planning causes future sessions to repeat decisions or
  select work from an obsolete dependency picture.

## Recommended plan corrections

### Priority 1 — stabilize activation before M2-S1

Add a cross-cutting **Bootstrap and cutover control lane** to the master design and roadmap without renumbering the existing milestones. It should define:

1. operating modes: contract-only, audit/shadow, bootstrap hybrid, qualified opt-in, and default;
2. exactly one mutating controller/runtime owner in each mode;
3. the runtime N-1 to runtime N delivery and installation rule;
4. a minimum safe activation set: initialize, claim, advance, recover, terminalize, release, resource-register, clean up, and rollback;
5. a migration contract for historical records without rewriting their bytes;
6. an explicit gate that prevents canonical routing from changing merely because a schema exists.

M1-S1 should receive a retrospective correction clarifying that publishing the v2 contract did not itself qualify v2 as the operational owner.

The roadmap should also state the activation dependency as one vertical bundle:

```text
resolve authorization
  -> initialize controller and admission together
  -> acquire/fence ownership
  -> select and persist transitions
  -> recover interrupted attempts
  -> terminalize and release the claim
  -> reconcile external delivery
  -> clean exact-owned resources
  -> prove rollback
```

The capabilities may still ship in separate changes, but canonical real-run
routing must remain on runtime N-1 until the complete bundle passes its
qualification gate.

### Priority 2 — close the two permanent design gaps

Amend M4-S1 to specify a non-secret host-operation envelope containing the exact repository, operation, resource identity, expected current state, expiry, and idempotency key. The authenticated host executes only that bounded operation and returns an observation receipt. Durable records must never contain the credential.

Amend M4-S2 to build an overlap graph across living-spec destinations and every active delta. If two changes contain complete `MODIFIED` replacements for the same requirement, the controller must reconcile under explicit ownership or serialize them before opening the Sync PR.

### Priority 3 — prevent self-referential repairs

Add a planning rule:

> A change may verify the capability it releases, but its completion tasks may not require installing that release and using it to finish the same change. Post-release adoption is a separate operational receipt or follow-up change.

Apply that rule when reconciling `repair-m1-s2-v2-terminalization`.

### Priority 4 — strengthen per-slice verification

Add required evidence for:

- installed runtime-manifest dispatch, not only direct module tests;
- serialized record completeness mapped field-by-field to the spec;
- a platform-independent path corpus containing POSIX, Windows drive, UNC, traversal, and symlink cases;
- an injected clock or safely distant fixture times instead of calendar-sensitive authorization tests;
- symmetry/property tests for stored-versus-observed cleanup normalization;
- a requirement-to-test map reviewed during local review and Verify.

### Priority 5 — reconcile the planning source of truth

Create one reviewed planning-only change from current main that:

- marks M1-S1, M1-S2, and M1-S3 with their actual delivery state;
- records every resulting repair and its causal parent;
- recovers accepted decisions from the inflight planning branch;
- recovers the deferred Jira-linkage roadmap item and ad hoc follow-up from commit `e237061` after checking it against current main;
- makes roadmap/brief reconciliation a required closeout receipt for future slices.

Do not blindly merge or cherry-pick the stale branches; recover the accepted planning hunks deliberately because those branches may contain unrelated or superseded changes.

### Priority 6 — make the blocker register causal, not merely chronological

Keep the current register, but add these fields to future entries:

- `rootCauseId` — links repeated symptoms such as the three GitHub 401s;
- `expectedStop` — distinguishes a correct safeguard from a defect;
- `temporaryUntil` — names the exact milestone and acceptance test that removes a temporary limitation;
- `permanentRepair` — names the design or implementation change required;
- `escapedGate` — identifies which earlier test or preflight should have caught it.

That will prevent the raw pause count from overstating independent defects while still preserving every interruption.

## Immediate implication for the current work

At the time of this analysis, `repair-v2-controller-initialization` has its implementation merged, while Sync PR #183 is blocked by the active M1-S2 repair's overlapping `MODIFIED` requirement. That pause is not proof that the initializer design is wrong. It is evidence that active-delta coordination must happen before Sync and that the unfinished M1-S2 repair should not have remained active because of post-release tasks.

The safe next move is a narrow, explicitly authorized reconciliation of that active delta, followed by the already defined Sync, Archive, runtime installation, and receipt-backed closeout sequence. This note does not grant that authorization.

Installing `repair-v2-controller-initialization` will close the controller/
admission pairing defect, but it will not make the unfinished M2 and M4 control
plane complete. New runs will start from a consistent identity; they can still
encounter missing authoritative transition history, takeover/recovery, external
host execution, cross-change Sync coordination, or final convergence until the
corresponding milestones and the activation corrections above are delivered.

## What is working and should be preserved

The safeguards prevented silent damage:

- exclusive claims stopped concurrent repository ownership;
- immutable history prevented retroactive rewriting of bootstrap evidence;
- exact cleanup refused to delete resources when fresh inspection differed;
- separate implementation, Sync, and Archive evidence preserved lifecycle auditability;
- repair changes made exceptional compatibility behavior explicit and reviewable.

The goal is not to relax those protections. It is to ensure the controller reaches them with complete prerequisites, detects predictable conflicts before mutation, and explains a necessary stop once in clear language.

## Source quality notes, research classification, and remaining unknowns

Verified facts in this note come from repository files and Git history listed in [sources.md](sources.md). The causal grouping, conclusions about activation sequencing, and recommended corrections are analysis derived from those facts.

One important unknown remains: the current review establishes what the briefs require, but it does not execute a complete future M4/M6 implementation or prove that later code will satisfy those contracts. The recommended qualification tests are therefore necessary evidence, not assumptions.

All blocker, design, change, and Git-history claims use primary repository
sources. The causal grouping and plan recommendations are assistant inferences,
not previously approved roadmap changes. No material repository-source conflict
was found; the important discrepancy is between the higher-level staged-cutover
intent and the M1-S1 OpenSpec change's immediate operational cutover.

Model guidance provenance from the research workflow: `highest-quality` role;
lookup date 2026-08-22; Codex model `gpt-5.6-sol`. Current official OpenAI
documentation describes GPT-5.6 Sol as its flagship model for complex reasoning
and coding: <https://developers.openai.com/api/docs/models>. The model choice did
not affect the evidence or conclusions, and the active session was not changed.

## 2026-08-22 stabilization addendum

This note's 21-pause, 25-commit, and six-repair counts are an evidence snapshot
at the time of analysis and remain intentionally unchanged. Subsequent
execution added two initializer repairs:

- `repair-v2-initializer-self-inventory`, which stopped the installed wrapper
  from classifying its own schema-5 checkpoint and non-controller JSON as
  legacy state; and
- `repair-v2-initializer-terminal-controller-inventory`, which recognizes a
  prior schema-5 controller only when matching immutable terminalization,
  claim-release, archive, repository, and change evidence proves it terminal.

These repairs reinforce rather than alter the causal conclusion: horizontally
activating admission/claims before the complete vertical lifecycle created
bootstrap dependencies. The accepted planning correction is recorded in
[Stabilize Autonomous SDD Bootstrap and Cutover Plan](../../../design-briefs/stabilize-autonomous-sdd-bootstrap-and-cutover-plan.md).
