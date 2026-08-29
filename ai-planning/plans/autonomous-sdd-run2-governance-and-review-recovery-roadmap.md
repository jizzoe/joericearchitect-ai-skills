# Autonomous SDD run #2, governance, and review recovery roadmap

Date: 2026-08-26

Status: Reviewable roadmap. The owner approved using a multi-step roadmap with
separate designs; the technical design gates below still require individual
approval. This document creates no OpenSpec artifacts or governance records and
authorizes no repository, runtime, controller, or GitHub mutation.

## 1. Objective

Recover from the interleaved Run #2 and Thread C work without losing valid
implementation, laundering failed review evidence, or letting unfinished review
machinery approve itself. The completed state must have:

- a clean primary worktree and a runtime built from a clean delivered commit;
- a working content-bound requirements-to-plan runtime path;
- Run #2 durably cancelled, released, non-counting, and logged;
- the owner-approved Explore-to-Propose guardrail delivered independently;
- review policy outside candidate control with clear severity semantics;
- durable per-signature correction history and a real sealed two-pass review;
- Thread A recovered under a fresh run and one complete delivery evidence chain;
- M4-S4 qualification restarted from an honest zero baseline.

Accepted requirements and the reconciled starting state are in
[`autonomous-sdd-run2-current-state-reconciliation.md`](../handoff-docs/autonomous-sdd-run2-current-state-reconciliation.md).
The historical handoff remains available at
[`autonomous-sdd-run2-and-governance-untangling-handoff.md`](../handoff-docs/autonomous-sdd-run2-and-governance-untangling-handoff.md).

## 2. Why this is a roadmap, not one implementation plan

One correction would cross six distinct authority and trust boundaries:
destructive workspace cleanup, runtime provenance, owner-governance policy,
independent-review policy, controller persistence/orchestration, and a feature
that can mutate Git remotes. It would also make review infrastructure judge its
own candidate implementation.

The recovery work is split into five independently reviewable designs, with one
small planning-runtime prerequisite discovered while validating this roadmap.
Each stage has one outcome, one mutation boundary, one evidence gate, and one
rollback story. No later stage may use an earlier stage's proposed behavior
until that behavior is delivered and active.

## 3. Design index and dependency order

| ID | Design | Outcome | Profile / operation | Depends on | Readiness |
|---|---|---|---|---|---|
| D1 | [Workspace and runtime stabilization](../design-briefs/autonomous-sdd-run2-recovery/workspace-and-runtime-stabilization.md) | Clean, provenance-bound baseline without losing branch or user-owned work | Bounded recovery operation; production safeguards | Program boundary | Inventory-ready; cleanup approval pending |
| D1R | [Repair requirements-to-plan runtime outcome validation](../design-briefs/autonomous-sdd-run2-recovery/repair-requirements-to-plan-runtime-outcome-validation.md) | Inject the canonical content-bound outcome validator required by the installed planning runtime | `production-rapid` | D1 | Defect reproduced; Explore-ready; outcome-format decision pending |
| D2 | [Owner-approved open-questions governance delivery](../design-briefs/autonomous-sdd-run2-recovery/owner-approved-open-questions-governance-delivery.md) | Deliver only the already approved Explore → Propose owner gate | `production-rapid` | D1R | Explore-ready; fresh-change boundary approval pending |
| D3 | [Trusted independent-review policy and severity](../design-briefs/autonomous-sdd-run2-recovery/trusted-independent-review-policy-and-severity.md) | Candidate-independent, digest-bound policy and unambiguous finding semantics | `production-rapid` | D1R, D2 delivery | Explore-ready; policy-location decisions pending |
| D4 | [Durable review correction and completeness orchestration](../design-briefs/autonomous-sdd-run2-recovery/durable-review-correction-and-completeness-orchestration.md) | Per-signature ledger plus one-package/two-pass/one-result orchestration | `production-rapid` | D3 delivery and activation | Explore-ready; signature/reviewer-binding decisions pending |
| D5 | [Generic Git cleanup recovery and requalification](../design-briefs/autonomous-sdd-run2-recovery/generic-git-repository-cleanup-recovery-and-requalification.md) | Recover `c669135` under a fresh run and restart M4-S4 qualification | `production-rapid`, strict-only qualification | D1, D1R, and D2–D4 delivered and active | Blocked by dependencies and exact review artifact |

Canonical sequence:

```text
D1 stabilize
  └──> D1R repair planning runtime
         └──> D2 governance-only
                └──> D3 trusted review policy
                       └──> D4 controller orchestration
                              └──> D5 Thread A recovery/requalification
```

D2 and D3 design work may be explored concurrently after D1R, but implementation is
serialized. Both can touch autonomous-runner references or the same living-spec
destination, so active-delta overlap must be checked before Propose and again
before Sync.

## 4. Bootstrap and trust sequence

The order deliberately avoids circular review evidence:

1. D1 installs the clean `origin/main` baseline runtime. It contains neither the
   undelivered Thread A helper nor Thread C's candidate-controlled checklist.
2. D1R repairs the planning launcher through the clean baseline runtime. Later
   plans can then use content-bound outcome validation rather than a manual
   fallback.
3. D2 changes governance only. It is reviewed by that clean baseline runtime and
   must contain no review adapter, checklist, severity, or controller diff.
4. D3 is the runtime N review-policy upgrade delivered by runtime N-1. The
   baseline reviewer remains independent because D3's candidate policy copy is
   not consumed as authority during its own review.
5. After D3 is merged and installed, D4 is reviewed by the trusted-policy
   runtime it depends on.
6. After D4 is merged and installed, D5 uses the complete policy and controller
   behavior in a fresh qualification run.

The combined Thread C branch at `62022cc` is never treated as an acceptance
source. It is preserved as design, test, and implementation salvage input only.

## 5. Stage plans

### D1 — Workspace and runtime stabilization

Outcome-oriented milestone: one clean trusted launch/review baseline with exact
ownership evidence for every mixed worktree copy.

First action: perform a read-only inventory and digest comparison across primary
`main`, `c669135`, `62022cc`, `origin/main`, the installed runtime manifest, and
controller terminal/claim state.

Implementation boundary:

- Phase D1-A is read-only and may run immediately: capture branch/worktree state,
  path ownership, digests, runtime provenance, and exact cleanup candidates.
- Phase D1-B requires explicit runtime-install authority: install from a clean
  delivered commit/worktree and verify helper inventory and digest.
- Phase D1-C requires explicit destructive-action approval for the exact path
  list. Preserve any path whose ownership is uncertain.

Acceptance evidence:

- before/after inventory and digest map;
- runtime source revision resolves to clean delivered `main`;
- no `generic-git-repository-cleanup` helper exists in the active runtime;
- primary `main` is clean;
- unrelated `.continue/` and research content is preserved in place if already
  tracked, or moved to an owner-approved recoverable branch/worktree/location
  before untracked primary copies are removed;
- both feature heads and historical cancelled-run records remain recoverable;
- `openspec validate --all --strict`, runtime reference checks, and `doctor`
  pass from the clean baseline.

Recovery: if runtime activation verification fails, reactivate the last known
clean delivered runtime. If any cleanup candidate is ambiguous, do not remove it.

Exit gate: owner accepts the inventory and post-stabilization evidence.

### D1R — Repair requirements-to-plan runtime outcome validation

Outcome-oriented milestone: the installed planning runtime can validate
observable outcomes from exact requirements content and write a reviewable plan
without trusting a caller-supplied receipt.

First action: OpenSpec Explore defines the versioned accepted-requirements
outcome format and backward-compatibility behavior.

Required design behavior:

- one trusted canonical validator parses the versioned format;
- validator output includes observable outcomes and the exact content SHA-256;
- the launcher injects it for `execute-sdd-requirements-to-plan`;
- the canonical helper independently verifies nonempty outcomes and digest;
- callers cannot override the validator;
- direct-helper and installed-wrapper tests exercise the production injection.

Acceptance evidence:

- the reconciliation requirements in this roadmap produce a plan when supplied
  with valid design-brief approval evidence;
- missing/vague/malformed/instruction-like outcomes fail without a write;
- stale or forged digest receipts fail;
- runtime build/install evidence shows the launcher injection is distributed;
- no OpenSpec or governance record is created by the planning operation.

Recovery: revert the bounded validator/launcher change and continue to fail
closed; never bypass outcome evidence as a fallback.

Exit gate: D1R is archived and installed before later implementation plans rely
on `sdd-requirements-to-plan`.

### D2 — Owner-approved open-questions governance delivery

Outcome-oriented milestone: Propose cannot start while Explore has unresolved
material questions, and owner resolution is durably recorded.

First action: after D1R, create or reuse a properly linked issue and run
OpenSpec Explore against the already approved source brief, with the
fresh-change scope locked to the four approved surfaces.

Scope:

- canonical `autonomous-sdd-lifecycle` Explore/Propose gate;
- human-decision classification pause rule;
- canonical open-question presentation and recording reference;
- living-spec requirement/scenarios and focused tests.

Explicit exclusions:

- `platform-review-adapters.mjs`;
- reviewer checklist or review-matrix changes;
- severity, disposition, completeness, correction-budget, or controller logic;
- Thread A implementation.

Acceptance evidence:

- owner recommendation approval and owner-supplied-answer scenarios;
- unresolved and runner-self-resolved questions both block Propose;
- prototype and production parity;
- change `design.md` and controller-reference recording behavior;
- thin-wrapper drift checks;
- issue + Project + tracking + exact-head strict review + PR + Sync + Archive
  reconciliation.

Recovery: revert only D2's bounded governance surfaces; no review runtime state
or Thread A state is coupled to it.

Exit gate: D2 is archived, living specs are synchronized, and the clean runtime
containing D2 is installed and verified.

### D3 — Trusted independent-review policy and severity

Outcome-oriented milestone: a candidate cannot alter the policy used to review
it, and every finding field has one machine-enforced meaning.

First action: OpenSpec Explore must decide the trusted asset location, version
and digest contract, parity behavior, and compatibility/migration strategy.

Required design behavior:

- resolve policy before candidate exposure;
- seal policy ID/version/digest with review package evidence;
- feed identical trusted content to Codex and Claude adapters;
- treat repository policy files as untrusted parity data;
- separate reviewer severity, aggregate review status, and implementer
  disposition;
- fail closed on policy identity/digest mismatch.

Acceptance evidence:

- adversarial candidate modifies/removes/downranks checklist categories but
  cannot change the authoritative prompt;
- candidate prompt-injection text is treated as data;
- adapter parity and policy digest tests;
- schema/contract compatibility fixtures;
- strict isolated review launched exclusively by clean runtime N-1;
- delivery and installed-runtime provenance at exact merged head.

Recovery: retain the previous policy version and support explicit rollback by
version/digest; never silently fall back to a candidate repository copy.

Exit gate: D3 is archived and its clean delivered runtime is active before D4
review evidence is collected.

### D4 — Durable review correction and completeness orchestration

Outcome-oriented milestone: every strict/degraded material finding has durable
per-signature correction history, and an escalated round is one sealed two-pass
review rather than two unrelated prompts.

First action: OpenSpec Explore resolves canonical-signature versioning,
split/merge/migration rules, atomic persistence boundaries, and the portable
meaning of one bound reviewer identity.

Required design behavior:

- persist signature-specific attempts for ordinary strict and degraded reviews;
- bind each materially different correction to evidence and candidate head;
- pause after the third unsuccessful materially different fix per signature;
- trigger escalation after two consecutive material rounds;
- run both passes over one immutable package and trusted policy;
- have the reviewer report all current findings, including repeats;
- correlate/deduplicate in the controller, not in reviewer instructions;
- seal one aggregate result with both pass receipts;
- evidence implementer self-review without treating it as independent approval;
- recover idempotently from every partial-write/crash point.

Acceptance evidence:

- state-machine and persistence tests for strict/degraded symmetry;
- signature stability, collision, split, merge, disappearance, and reappearance;
- three-fix fail-closed behavior;
- same head/package/policy/reviewer binding across both passes;
- deterministic result union and repeated-finding retention;
- crash/retry/generation-fence tests;
- no dead production `completenessPass` hook or global-counter fallback.

Recovery: version records, preserve prior evidence read-only, and provide a
deterministic migration or explicit pause for incompatible active records.

Exit gate: D4 is archived, the controller/runtime containing it is active, and
both strict and degraded acceptance fixtures pass from clean installed code.

### D5 — Thread A recovery and M4-S4 requalification

Outcome-oriented milestone: one delivered generic Git cleanup capability whose
entire evidence chain comes from a fresh run, followed by qualification streak
state of exactly one.

First action: update the qualification record with the cancelled/non-counting
Run #2 and obtain the exact latest sealed Thread A findings artifact; then
reconcile issue #243 and Project state before creating a fresh run.

Salvage contract:

- branch `feat/add-generic-git-repository-cleanup` at `c669135` is input, not a
  resumable run or accepted head;
- old controller state remains terminal and its attempt history remains
  historical;
- fresh change/branch/run/ledger identities begin from delivered main;
- imported changes have a requirement-to-diff provenance map;
- all owner decisions are referenced through the delivered D2 gate;
- all material findings are corrected and independently re-reviewed through D3
  and D4 machinery.

Acceptance evidence:

- qualification log records failure, cancellation, release, and streak reset;
- issue #243, Project, tracking, change, run, branch, PR, review package, merge,
  Sync, Archive, and runtime all reconcile;
- tasks reflect actual work and tests rather than historical claims;
- focused/full tests and strict OpenSpec validation pass;
- strict independent review has zero unresolved material findings at exact head;
- remote-state/OID/receipt safeguards are exercised without exposing secrets;
- installed helper matches the delivered commit;
- qualification streak moves from zero to one only after all gates complete.

Recovery: a failed fresh attempt pauses without altering the cancelled Run #2
record or incrementing the qualification streak. Remote mutation recovery uses
observed state and immutable receipts, never assumptions.

Exit gate: D5 is archived and installed, workspace is clean, and the
qualification log/evidence agrees on streak count one.

## 6. Shared hazards and serialization rules

| Hazard | Rule |
|---|---|
| Dirty primary source contaminates runtime/review | D1 is mandatory; launch only from clean installed runtime afterward |
| Planning helper appears valid only in direct fixtures | D1R adds installed-wrapper coverage and production validator injection |
| Candidate defines its own review policy | Trusted policy resolved and sealed outside candidate; repository copy is data-only |
| Same living-spec destination in D2/D3/D4 | Preflight active-delta overlap before Propose and Sync; serialize implementation |
| Combined Thread C commits blur ownership | Use `62022cc` only as salvage reference; do not merge/cherry-pick wholesale |
| Old Run #2 identity reused | Prohibited; D5 creates fresh run and ledger identities |
| Stale global correction counter | Diagnostic only after D4; per-signature ledger is authoritative |
| Reviewer suppresses repeated findings | Prohibited; controller correlates and reviewers report current state |
| Two passes become two unrelated reviews | One package/policy/head/reviewer binding and one aggregate sealed result |
| Git remote changes race with observation | Re-observe immediately before mutation and bind expected state/OID into receipt |
| Runtime installed before merge | Prohibited except D1 rollback/restore from an already delivered commit |
| Historical evidence rewritten | Prohibited; append superseding status and preserve originals |
| Unrelated worktree/content deleted | Preserve by default; exact path approval required for destructive cleanup |

## 7. Evaluation and guardrail matrix

| Design | Minimum evaluations | Mandatory guardrails |
|---|---|---|
| D1 | Digest/ownership reconciliation; clean-main validation; runtime manifest and source provenance | Exact targets; two-gate approval; no broad reset/delete; rollback runtime |
| D1R | Valid/invalid outcome parsing; digest binding; direct/helper-wrapper parity; installed-runtime smoke | Trusted non-overridable validator; fail closed; no plan write on invalid evidence |
| D2 | Transition scenarios; prototype/production parity; durable-record mapping; wrapper drift | No review/controller scope; owner evidence required; tracked full lifecycle |
| D3 | Tampered-candidate policy; digest mismatch; adapter parity; schema compatibility | Candidate data-only; trusted policy fail-closed; no prompt authority from repo |
| D4 | State-machine properties; strict/degraded symmetry; crash recovery; two-pass aggregation | Per-signature budget; immutable package; all findings visible; atomic/generation-fenced writes |
| D5 | Requirement-to-test map; seven-finding regression suite; remote drift/OID/receipt tests; full delivery reconciliation | Fresh run; confirmation-gated external mutation; no secrets; zero material findings; honest streak accounting |

Every implementation change also requires:

- `openspec validate --all --strict`;
- focused and full relevant Node/eval suites;
- adapter/runtime-reference drift checks where applicable;
- local bounded review before independent review;
- exact-head independent-review evidence from clean trusted machinery;
- PR body with issue linkage and `OpenSpec change: <change-name>`;
- post-merge Sync, Archive, workspace cleanup, and installed-runtime provenance as
  required by the repository workflow.

## 8. Coherent end-state audit

The recovery program is complete only if all answers are yes:

1. Is primary `main` clean, with unrelated user content preserved or explicitly
   relocated by the owner?
2. Does the active runtime resolve to one clean delivered commit and match its
   helper manifest exactly?
3. Is Run #2 terminal, released, non-counting, and recorded as a streak reset?
4. Is the governance gate independently tracked, merged, synchronized, archived,
   and active?
5. Can candidate content alter any reviewer policy, severity, or acceptance
   instruction? The required answer is no.
6. Do strict and degraded paths enforce the same per-signature correction budget?
7. Does completeness escalation preserve all current findings and one sealed
   package/reviewer/result chain?
8. Can the installed planning runtime validate content-bound outcomes and create
   a plan without a caller-supplied validator?
9. Was Thread A delivered under a fresh identity with exact-head zero-material
   review, complete lifecycle evidence, and a verified installed helper?
10. Does the qualification log count only the fresh successful D5 delivery and
   show the restarted streak as one?
11. Are `c669135`, `62022cc`, old handoffs, and controller snapshots either
    retained as labeled history or disposed through separately evidenced exact
    cleanup—not silently erased or treated as current truth?

Any “no” leaves the program incomplete.

## 9. Owner gates and next action

This roadmap intentionally leaves the following owner gates open:

1. D1 exact cleanup target approval after read-only inventory.
2. D1R accepted-requirements outcome format and repair authorization.
3. D2 fresh governance-only delivery boundary.
4. D3 trusted policy location/version/parity decisions.
5. D4 signature migration and portable reviewer-binding decisions.
6. D5 salvage authorization, issue #243 reuse, and exact sealed-finding input.

Recommended next action: approve D1's read-only inventory phase. After its
evidence is presented, decide runtime restoration and exact cleanup separately.
Do not begin OpenSpec Propose for D1R–D5, resume Run #2, or install feature code
on the basis of this roadmap alone.
