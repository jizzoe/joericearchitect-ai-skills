# Autonomous SDD: low-level blocking and pause design

- Status: current-state description
- As of: 2026-08-29
- Scope: every semantic condition that can stop or suspend the current
  autonomous `sdd-delivery` path, including shared runtime, controller,
  OpenSpec, review, delivery, reconciliation, cleanup, and terminalization
  controls

## Purpose and interpretation

This document answers four questions for every stop condition:

1. Where does it stop the workflow?
2. What observation triggers it?
3. Why does the control exist and what failure does it prevent?
4. How severe would bypassing it be?

The implementation uses several outward labels:

- `paused`: do not advance; a safe resume may be possible.
- `blocked`: do not advance; the same durable conflict or correction signature
  has reached a terminal policy boundary.
- `unavailable`: terminal evidence that a required capability did not run. For
  a required gate, this pauses the containing lifecycle.
- `in-doubt`, `conflict`, or `ineligible`: do not mutate or complete until the
  state is reconciled. These are pause-equivalent at the lifecycle level.
- `objective-correction`: continue automatically only while the fix is bounded,
  behavior-preserving, and below its per-signature budget.

The framework deliberately fails closed: unknown operations, outcomes,
diagnostics, or classifications become a pause. Therefore the final “unknown or
unclassified” row is part of the exhaustive behavior, not an escape hatch.

Unless a row says otherwise, it applies to both autonomous production review
policies. V16 is strict-only; V17-V22 are strict-first-degraded; P05 and
D03-D04 are interactive-only controls included so this document also explains
the interactive workflow in the high-level design. Those three interactive
rows do not pause an autonomous run.

## Severity model

Severity describes the consequence of bypassing a gate, not the time required
to recover and not the severity of a code-review finding.

| Severity | Bypass consequence | Typical examples |
| --- | --- | --- |
| Critical | Could authorize the wrong mutation, expose credentials, corrupt shared state, destroy data, or falsely claim independent assurance | Target/authorization mismatch, concurrent claim conflict, secret content, unsafe cleanup, self-review accepted as independent |
| High | Could deliver unverified or stale work, lose lifecycle integrity, or misstate completion | Wrong head, stale evidence, failed Verify, unresolved findings, phase/order conflict, incomplete Sync or Archive |
| Medium | Stops a required capability but normally preserves state and has a bounded recovery | Runtime missing, network/auth unavailable, adapter unavailable, persistence or inspection failure |
| Low | Expected coordination boundary with little integrity risk when honored | Missing initial request field, routine interactive confirmation |

Most current code serializes these outcomes with the same `paused` label. The
severity column below makes the differences explicit.

## Exhaustive condition catalog

### 1. Request, authorization, and runtime envelope

| ID | Workflow blocked | Trigger condition and code(s) | Why necessary / what it prevents | Severity |
| --- | --- | --- | --- | --- |
| R01 | Before selection | A required request field is absent: target, mode, quality profile, authorization profile, or expiration (`missing-delivery-request-input`). | Prevents the driver from inventing a risk-bearing authorization field. | Low |
| R02 | Before selection | Target, mode, profile, review policy, agent policy, expiration, or correction budget is malformed or unsupported (`invalid-delivery-request-input`, `invalid-delivery-request-correction-budget`, `agent-policy-invalid`). | Prevents ambiguous targets, impossible deadlines, and unsupported control combinations. | High |
| R03 | Before selection | New and legacy review-policy inputs contradict one another (`conflicting-delivery-request-input`). | Prevents a caller from obtaining a weaker review policy through conflicting fields. | High |
| R04 | Before selection | Mode, quality, and review policy violate the allowed matrix (`delivery-request-matrix-conflict`). | Prevents local review from satisfying production assurance or an unsupported autonomous profile. | High |
| R05 | Admission and every operation | Authorization is expired, has an invalid expiration, or has passed the goal deadline (`expired-authorization`, `authorization-expired`, `v2-admission-authorization-invalid-or-expired`, `deadline-passed`, `invalid-expiration`). | Enforces the bounded duration of the owner’s grant. | Critical |
| R06 | Before run or operation | Objective, target, work-selection rule, mutation boundary, stopping conditions, forbidden actions, or required evidence are missing (`missing-objective`, `missing-target`, `missing-work-selection`, `missing-mutation-boundary`, `missing-stopping-conditions`, `missing-forbidden-actions`, `missing-evidence`). | Prevents unbounded autonomous work. | Critical |
| R07 | Before operation | Requested profile or operation is unknown, outside the profile, outside `allowedMutations`, or unnamed/unsupported (`unknown-profile`, `unknown-operation`, `operation-not-in-profile`, `operation-not-authorized`, `unnamed-or-unsupported-lifecycle-action`). | Prevents authority from expanding through an invented helper name. | Critical |
| R08 | Before operation | Exact workspace, adapter, issue, PR, branch, change, or derived target is not authorized (`unauthorized-target`, `unauthorized-adapter`, `unexpected-external-target`, `derived-record-not-durable`). | Prevents mutation of lookalike or unrelated resources. | Critical |
| R09 | Before operation | Active sandbox/tool/credential permission is absent or narrower than authorization (`runtime-permission-gap`, `runtime-permission-unavailable`). | Keeps runtime permission separate from owner authorization and prevents self-escalation. | Critical |
| R10 | Before helper execution | Installed runtime is absent, incompatible, tampered, incomplete, or points at an invalid repository (`runtime-not-installed`, `runtime-contract-version-mismatch`, `required-contract-version-invalid`, `runtime-content-tampered`, `runtime-content-missing`, `runtime-content-unverified`, `target-repository-*`, `runtime-home-unavailable`). | Prevents fallback to mutable workspace scripts or execution against the wrong checkout. | High |
| R11 | Before helper execution | Helper/verb/request envelope is not declared or is malformed (`command-not-declared`, `helper-not-declared`, `verb-required`, `verb-not-declared`, `verb-not-supported`, `operation-not-declared`, `request-source-*`, `request-unreadable`, `request-not-json`, `unexpected-argument`). | Prevents arbitrary command dispatch and ambiguous payload ingestion. | High |
| R12 | Before lifecycle use | Runtime configuration is absent, invalid, conflicts across authorities, names an unsafe path, or binds the wrong repository (`runtime-configuration-unavailable`, `runtime-configuration-invalid`, `runtime-configuration-authority-conflict`, `runtime-configuration-unsafe-path`, `runtime-configuration-repository-invalid`). | Prevents silent use of a stale or attacker-selected control configuration. | Critical |
| R13 | Before adapter-backed work | Adapter is disabled, missing, lacks the operation, or disagrees with the durable selection (`adapter-unavailable`, `adapter-capability-mismatch`, `review-adapter-selection-*`, `review-adapter-implementation-missing`, `review-adapter-*-mismatch`). | Prevents capability claims from being inferred from caller flags. | High |
| R14 | Before high-impact action | Delivery profile differs from durable authorization, or the action is not eligible for that profile (`delivery-profile-authorization-mismatch`, `high-impact-action-profile-mismatch`, `delivery-preapproval-not-eligible`). | Prevents downgrading the quality profile at the merge/archive boundary. | Critical |
| R15 | Any external action | Action is a deployment, release, credential/scope change, external message, unrelated mutation, repository deletion, force push, hard reset, or security weakening without separate approval. | Preserves the explicit forbidden-action boundary. | Critical |

### 2. Selection, admission, claims, and controller state

| ID | Workflow blocked | Trigger condition and code(s) | Why necessary / what it prevents | Severity |
| --- | --- | --- | --- | --- |
| A01 | Work selection | Dependency is unresolved or cyclic, ordering is ambiguous, or a shared resource conflicts (`dependency-ambiguity`, `unresolved-dependency`, `durable-state-conflict`). | Prevents selecting work whose prerequisites or ownership cannot be proven. | High |
| A02 | Admission | Repository identity is missing, noncanonical, wrong, or conflicts with durable identity (`repository-identity-conflict`, `wrong-repository`, `initializer-admission-context-invalid`). | Prevents one repository’s grant or controller state from being used in another. | Critical |
| A03 | Admission | Legacy inventory is ambiguous or an active legacy record remains authoritative (`legacy-inventory-ambiguous`, `legacy-authority-active`, `active-legacy`, `legacy-record-still-authoritative`). | Prevents two generations of controller state from both claiming authority. | Critical |
| A04 | Admission | More than one active v2 run exists or a foreign active identity is found (`v2-admission-ambiguous-active-runs`, `v2-admission-identity-inspection-unavailable`). | Prevents concurrent owners from mutating the same repository. | Critical |
| A05 | Admission | Existing run, work-unit, or claim record is unreadable, invalid, or immutable content conflicts (`v2-admission-record-unreadable`, `v2-admission-record-invalid`, `v2-admission-immutable-conflict`, `immutable-record-already-exists`). | Prevents corrupted or replaced records from becoming authority. | Critical |
| A06 | Admission | Admission cannot inspect or persist the exact durable records (`v2-admission-inspection-unavailable`, `v2-admission-persist-failed`, `controller-initialization-admission-unavailable`). | Prevents an in-memory-only run from mutating governed resources. | High |
| A07 | Claim acquisition or recovery | Claim is inactive, held elsewhere, stale, in doubt, generation-invalid, or conflicts with repository mutation (`claim-not-active`, `repository-mutation-claim-conflict`, `repository-mutation-claim-in-doubt`, `ownership-generation-stale`, `takeover-*-invalid`, `takeover-proof-inconclusive`). | Prevents split-brain execution and unsafe takeover. | Critical |
| A08 | Admission | Provider capabilities are invalid or weaker than those bound to the run (`claim-provider-capability-invalid`, `operation-contract-topology-invalid`). | Prevents resuming under a weaker persistence or ownership provider. | Critical |
| A09 | Controller load | Checkpoint path escapes, traverses a symlink, is unavailable, invalid, retired, legacy, or bound to another run (`controller-record-path-*`, `controller-record-unavailable`, `controller-record-invalid`, `controller-record-retired`, `controller-record-legacy`, `controller-record-run-conflict`). | Prevents path substitution and use of non-authoritative controller records. | Critical |
| A10 | Controller mutation | Lock cannot be acquired, expected digest is absent, or durable record changed since read (`controller-record-lock-unavailable`, `controller-record-expected-digest-required`, `controller-record-stale`, `controller-record-persist-failed`). | Provides optimistic concurrency and atomic checkpoint updates. | High |
| A11 | Phase advance | Requested phase is not the first incomplete phase, the chain is malformed, or evidence belongs to a different phase (`controller-phase-advance-out-of-order`, `controller-phase-chain-invalid`, `controller-operation-entry-mismatch`, `derived-transition-out-of-order`). | Prevents skipping lifecycle gates. | Critical |
| A12 | Phase advance | Current phase evidence is stale, missing, invalid, duplicated with different content, or conflicts with the persisted record (`controller-phase-stale`, `controller-phase-evidence-artifacts-invalid`, `controller-phase-advance-evidence-conflict`, `controller-phase-advance-record-conflict`, `completed-step-lacks-current-evidence`). | Prevents completion from stale or fabricated evidence. | High |
| A13 | Resource creation/selection | Implementation, Sync, Archive, issue-intake, or auth-context resource is unregistered, invalid, duplicated, or already bound differently (`controller-resource-registration-*`, `controller-issue-intake-registration-*`, `controller-auth-context-registration-invalid`). | Ensures every mutable resource has exact ownership and recovery identity before use. | Critical |
| A14 | Delivery binding | Resource delivery, issue delivery, or auth-context evidence is invalid or conflicts with its registration (`controller-resource-delivery-invalid`, `controller-issue-intake-delivery-invalid`, `controller-auth-context-evidence-invalid`). | Prevents later phases from borrowing another resource’s merge or identity evidence. | Critical |
| A15 | Resume | A prior transition attempt is unreconciled, conflicts with another attempt, or live state is in doubt (`attempt-unreconciled`, `transition-attempt-conflict`, `in-doubt`). | Prevents duplicate external mutation after an interrupted attempt. | Critical |
| A16 | Run continuation | Required controller transition is missing in the installed runtime (`required-controller-transition-unavailable`, `early-retirement-transition-available` when a retirement is improperly attempted). | Stops an older runtime from advancing a newer state contract; retirement requires separate signed owner authorization. | High |

### 3. OpenSpec planning and Apply

| ID | Workflow blocked | Trigger condition and code(s) | Why necessary / what it prevents | Severity |
| --- | --- | --- | --- | --- |
| P01 | Explore/Propose | Current OpenSpec status, instructions, or required artifacts cannot be determined. | Prevents generating or editing the wrong change phase. | High |
| P02 | Propose to planning review | Proposal scope, affected capabilities, scenarios, design, dependencies, security, recovery, attribution, portability, task IDs, or evidence requirements are materially ambiguous. | Prevents implementation from silently choosing product or governance behavior. | High |
| P03 | Design-brief provenance | Source path is invalid/unavailable/empty, capture fails, or provenance conflicts (`design-brief-source-*`, `design-brief-capture-*`, `design-brief-provenance-conflict`). | Prevents a fabricated or wrong decision source from governing the change. | High |
| P04 | Planning gate | Planning evidence is incomplete or not ready (`planning-not-ready`, `readiness-gap`, `design-brief-approval-required`, `owner-decision-required`, `owner-decision-evidence-required`). | Prevents Apply before decisions and evidence expectations are reviewable. | High |
| P05 | Plan to Apply | In interactive mode, owner confirmation is absent (`plan-to-apply-confirmation`). | Preserves the ordinary interactive planning boundary. It is intentionally absent in autonomous mode. | Low |
| P06 | Apply eligibility | Apply is not authorized, planning review failed, required current instructions were not read, or task prerequisites are not satisfied (`apply-not-ready`, `incomplete-lifecycle-evidence`). | Prevents implementation outside the approved plan or dependency order. | High |
| P07 | Apply batch | Batch risk requires a smaller batch or a human decision. | Limits blast radius and prevents autonomous bundling of material decisions. | High |
| P08 | Task completion | Stated task evidence does not exist or is not current. | Prevents checkbox completion from substituting for test or artifact evidence. | High |
| P09 | Quality checks | Formatting, lint, type, schema, deterministic tests, links, generated exposure, fixtures, documentation, security, supply-chain, requirements mapping, portability, attribution, recovery, regression, repeatability, operational, or exact-head CI evidence fails. | Prevents defective or insufficiently evidenced work from reaching review. | High |
| P10 | Objective correction | Failure source is not durable, does not match the selected entry/signature, counters disagree with durable history, or the fix would change behavior (`correction-context-incomplete`, `correction-entry-not-authorized`, `correction-failure-source-not-durable`, `correction-failure-signature-mismatch`, `correction-*-mismatch`, `invalid-objective-correction-*`). | Prevents retries from resetting the budget or smuggling in a product change. | Critical |
| P11 | Objective correction | Three materially different corrections for the same signature are exhausted (`correction-limit-exhausted`, `correction-budget-exhausted`, `correction-not-eligible`). | Stops infinite loops and repeated risky mutation without new information. | High |
| P12 | Any correction | Fix requires a new requirement, architecture/compatibility/data-ownership/security/license/governance decision, broader credential access, destructive action, or out-of-scope mutation. | Keeps material decisions with the owner. | Critical |

### 4. Production independent review

| ID | Workflow blocked | Trigger condition and code(s) | Why necessary / what it prevents | Severity |
| --- | --- | --- | --- | --- |
| V01 | Review readiness before Apply | Sealed package/request is malformed or deadline is inadequate (`review-admission-request-invalid`, `review-admission-deadline-inadequate`). | Prevents starting Apply when the required production review path cannot plausibly finish. | High |
| V02 | Review readiness | Configured adapter or executable identity is missing or fails required capabilities (`review-admission-adapter-missing`, `review-admission-attestation-invalid`). | Prevents caller assertions from masquerading as isolated reviewer capability. | Critical |
| V03 | Review readiness | Multi-step probe is absent/fails, artifact path is not genuine, parent transport is denied, or cleanup is not writable (`review-admission-inspection-unavailable`, `review-admission-artifact-path-invalid`, `review-admission-permission-denied`, `review-admission-cleanup-unwritable`). | Prevents entering Apply with a review path that cannot produce and safely clean durable evidence. | High |
| V04 | Review readiness or reuse | Admission/review evidence is expired, package/head/manifest changed, or reuse inputs no longer match (`review-admission-evidence-stale`, `review-reuse-invalidated`, `exact-head-review-invalidated`). | Prevents stale review evidence from following a changed implementation. | High |
| V05 | Package construction | Base/head are noncanonical, input/artifacts are missing, artifact is unsafe/nonregular, package build fails, or manifest digest mismatches (`independent-review-package-*`, `unsafe-artifact-path`). | Ensures the reviewer sees an immutable, complete, reproducible package. | Critical |
| V06 | Package construction | Diff, validation evidence, or artifact content matches secret-like material (`independent-review-package-sensitive-content`). | Prevents credentials or secrets from crossing the reviewer boundary. | Critical |
| V07 | Package capsule | Capsule bounds, chunks, paths, digests, reconstruction, identity, or publication fail (`independent-review-package-capsule-*`, `independent-review-package-legacy-exposure-present`). | Prevents truncation, substitution, path escape, and legacy package leakage. | Critical |
| V08 | Adapter dispatch | Durable adapter selection, implementation, reviewer, launcher, runtime receipt, or result binding is missing or mismatched (`review-adapter-selection-*`, `review-adapter-implementation-missing`, `review-adapter-*-mismatch`). | Prevents a different executable or reviewer from satisfying the configured review. | Critical |
| V09 | Strict reviewer launch | Request/receipt is invalid, launcher is unavailable, reviewer is lost, times out, crashes, or exits without terminal capture (`review-dispatch-*`, `strict-review-delivery-request-invalid`, `strict-review-transport-timeout`, `strict-review-process-crash`, `strict-review-artifact-missing`, `strict-review-transcript-only-rejected`). | Prevents an attempted reviewer process from being counted as a completed review. | High |
| V10 | Codex capture | Request authentication, identity, bounds, destination exclusivity, process start/stream/exit, receipt, artifact publication, payload, or cleanup fails (`codex-capture-*`). | Preserves parent-owned, bounded, directly captured evidence and safe temporary-resource cleanup. | Critical |
| V11 | Reviewer runtime | Executable, authentication, network, repository trust, app-server, sandbox, settings/schema, disk/resource, or output contract is unavailable (`independent-reviewer-*-runtime-unavailable`, `*-authentication-unavailable`, `*-network-unavailable`, `*-sandbox-unavailable`, `*-output-contract-invalid`, and diagnostic categories `runtime-unavailable`, `authentication-unavailable`, `network-unavailable`, `permission-denied`, `resource-unavailable`). | Distinguishes environmental failure from a passing review and avoids weakening the boundary. | High |
| V12 | Result validation | Result is malformed, unavailable without a code, claims impossible isolation, has bad chronology/findings/status, duplicates a record, or mismatches attestation (`independent-review-result-*`). | Prevents malformed or internally inconsistent model output from becoming evidence. | Critical |
| V13 | Independence | Reviewer identity equals implementer identity or required noninteractive, isolated, fresh, read-only capability is absent (`independent-review-self-review`, `independent-reviewer-not-isolated-read-only`). | Prevents self-review from being represented as independent production assurance. | Critical |
| V14 | Exact input | Review package/result base, head, manifest, Git diff, OpenSpec artifacts, Apply evidence, repository, or current head does not match (`independent-review-*-mismatch`, `independent-review-evidence-stale-head`, `independent-review-result-stale-input`, `independent-review-commit-not-canonical`, `independent-review-diff-provenance-mismatch`). | Prevents review of one revision from approving another. | Critical |
| V15 | Findings disposition | A blocker, high, or objective-fix finding is unresolved, or result status conflicts with findings (`independent-review-findings-unresolved`, `independent-review-objective-fix-required`, `independent-review-result-status-finding-inconsistent`). | Prevents delivery with known objective defects. Objective fixes loop; material findings pause. | High |
| V16 | Strict-only policy | Strict review returns any typed unavailable outcome. | Enforces the owner-selected strict assurance boundary; there is no fallback. | High |
| V17 | Strict-first-degraded entry | Strict unavailability is not yet durably recorded for the exact package (`strict-unavailable-evidence-not-durable`, `degraded-independent-review-strict-unavailable-missing`, `independent-review-strict-unavailable-not-durable`). | Prevents degraded review from being selected before strict was genuinely attempted. | Critical |
| V18 | Degraded authorization | Fallback is disabled, malformed, expired, exceeds goal expiry, or mismatches change, transition, package, or correction envelope (`degraded-independent-review-*`). | Ensures reduced assurance is a positive, exact, time-bounded owner choice. | Critical |
| V19 | Recovery launcher | Failure is not eligible, launcher boundary/capability/identity/scope/package/strict precursor is wrong, runtime permission is absent, or prepared request is invalid (`review-launcher-not-authorized`, `review-launcher-failure-not-recoverable`, `review-launcher-*-mismatch`, `review-launcher-capability-unavailable`, `review-launcher-runtime-permission-required`, `review-launcher-prepared-request-invalid`). | Prevents fallback from broadening into arbitrary host execution. | Critical |
| V20 | Recovery transport | Host invocation is missing, denied, timed out, failed, malformed, or lacks a valid bound receipt (`review-launcher-runtime-transport-*`, `review-launcher-host-*-invalid`, `review-launcher-external-host-required`, `review-launcher-runtime-receipt-invalid`). | Prevents owner-relayed commands or unverifiable host claims from replacing direct capture. | Critical |
| V21 | Detached review view | Repository/head/root/ownership/request/lifecycle binding is invalid, view creation or verification fails, or cleanup is unsafe/incomplete (`review-worktree-*`, `review-worktree-lifecycle-*`, `independent-review-view-cleanup-*`). | Prevents reviewing the wrong tree and prevents deletion of a view the lifecycle does not own. | Critical |
| V22 | Degraded result | Separate reviewer, capability ledger, assurance label, strict summary, degraded authorization, runtime receipt, or result validation is missing/mismatched (`degraded-independent-reviewer-*`, `independent-review-result-degraded-evidence-invalid`, `independent-review-degraded-authorization-mismatch`, `review-adapter-runtime-receipt-mismatch`). | Prevents reduced assurance from being mislabeled as strict or accepted without its known limitations. | Critical |
| V23 | Changed head after correction | Any behavior-preserving fix changes the head; previous review is invalidated and affected checks plus the full review path have not rerun (`correction-changed-head`, `rereview-required`). | Keeps review and validation bound to the delivered code. | High |

### 5. Verify, GitHub delivery, and external state

| ID | Workflow blocked | Trigger condition and code(s) | Why necessary / what it prevents | Severity |
| --- | --- | --- | --- | --- |
| D01 | Formal Verify | Any task, requirement, scenario, design decision, security control, recovery path, portability claim, evaluation, or known limitation lacks current evidence. | Prevents “tests passed” from substituting for full specification conformance. | High |
| D02 | Formal Verify | OpenSpec Verify fails or `openspec validate --all --strict` fails. | Prevents malformed or incoherent governed artifacts from delivery. | High |
| D03 | Verified to close | Interactive owner confirmation is absent (`verified-to-close-confirmation`). | Preserves the ordinary interactive closure boundary; absent from autonomous mode. | Low |
| D04 | High-impact interactive action | Just-in-time approval is missing for `merge-pr`, `archive-change`, or `delete-merged-topic-branch` (`just-in-time-approval-required`). | Keeps irreversible/high-impact transitions owner-confirmed in interactive production. | High |
| D05 | GitHub operation preflight | Auth-context binding/evidence is invalid, expired, stale, mismatched, or tied to another host probe (`github-auth-context-*`). | Prevents credential state from one operation/repository/payload being reused for another. | Critical |
| D06 | GitHub operation preflight | Credentials are missing/invalid/expired, host permission is denied, or authentication/network/tool failure persists. | Stops mutation without proven access and separates host permission from operation authority. | High |
| D07 | Issue intake | Binding is invalid/expired, selected entry or payload digest differs, or evidence is invalid (`issue-intake-*`). | Prevents publishing a different issue body or linking the wrong change. | Critical |
| D08 | Pull request gate | Base branch, topic branch, current head, PR identity/body linkage, required checks, review state, or exact merged/delivered head is absent or mismatched. | Prevents merging stale, unrelated, or incorrectly linked work. | Critical |
| D09 | Pull request gate | Unrelated/destructive changes are present or branch cleanup target is not the exact merged topic branch. | Prevents scope creep and destructive cleanup. | Critical |
| D10 | Delivery evidence | OpenSpec Verify, production independent review, Apply evidence, or lifecycle prerequisite records are missing/stale/not durable (`incomplete-lifecycle-evidence`, `independent-review-*-not-durable`, `derived-checkpoint-not-valid`, `derived-checkpoint-schema-invalid`). | Prevents bypassing quality gates at the final mutation boundary. | Critical |
| D11 | External mutation | Envelope or receipt is invalid/expired/mismatched, host reports denial/failure, or outcome cannot be classified (`envelope-invalid-or-expired`, `receipt-mismatch`, `host-*`, `unclassifiable-advance`). | Prevents a forged or ambiguous host result from advancing state. | Critical |
| D12 | External mutation recovery | Live state is unobservable, diverges from the plan/receipt, or reports conflict (`unobservable-live-state`, `live-state-diverges`, `live-state-conflicts-receipt`, `host-reported-conflict`, `ambiguous-receipt`). | Prevents duplicate or contradictory GitHub mutations after partial failure. | Critical |
| D13 | Issue and Project reconciliation | Issue or Project item does not match the selected change, desired state is ambiguous, or existing human-authored content would be overwritten. | Prevents corrupting tracking state or erasing human decisions. | Critical |
| D14 | No-code exception | Repository content changed, or no human-authored completion reason exists. | Prevents documentation/spec/config changes from bypassing PR delivery. | High |
| D15 | Branch retention/deletion | Receipt is invalid, head mismatches, force is requested, branch is missing, default/protected/remote state is wrong, or merged status is unproven (`branch-retention-*`, cleanup branch/ref conditions). | Prevents deletion or rewriting of an unmerged, protected, or wrong branch. | Critical |

### 6. Sync and Archive

| ID | Workflow blocked | Trigger condition and code(s) | Why necessary / what it prevents | Severity |
| --- | --- | --- | --- | --- |
| S01 | Sync start | Implementation delivery is not merged and bound to its own exact resource. | Prevents living specs from claiming behavior not yet delivered. | High |
| S02 | Sync | Delta requirements or living specs cannot be reread/currently validated. | Prevents Sync based on stale generated context. | High |
| S03 | Sync | Added requirement conflicts with living specs, modified requirement is absent, scenarios would be dropped, or shared requirement overlaps (`added-requirement-conflicts-with-living`, `modified-requirement-missing-in-living`, `modified-requirement-drops-scenario`, `shared-requirement-overlap`). | Prevents semantic data loss and silent precedence decisions. | Critical |
| S04 | Sync completion | Delta operations are not reflected exactly, strict validation fails, or repeat Sync is not a no-op. | Prevents partial or non-idempotent living-spec updates. | High |
| S05 | Sync delivery | Sync resource was not pre-registered or its own PR/merged/delivered head is not bound. | Prevents implementation delivery evidence from being reused for Sync. | Critical |
| S06 | Archive start | Implementation or Sync delivery is incomplete; issue closure/accepted no-code evidence or Project completion evidence is absent. | Prevents premature archival of active or undelivered work. | High |
| S07 | Archive | Strict validation fails, archive target is unavailable, or destination already contains conflicting content (`archive-destination-conflict`). | Prevents overwriting a prior archive or hiding invalid state. | Critical |
| S08 | Archive | Move is not content-preserving or archived bundle cannot be reconstructed. | Prevents loss or mutation of the governed change history. | Critical |
| S09 | Archive delivery | Archive resource was not pre-registered or its own delivery binding is missing/stale. | Prevents a prior merge from being treated as proof of archive delivery. | Critical |

### 7. Cleanup, finalization, retirement, and terminalization

| ID | Workflow blocked | Trigger condition and code(s) | Why necessary / what it prevents | Severity |
| --- | --- | --- | --- | --- |
| C01 | Cleanup planning | Selected entry, resource records, delivery evidence, fresh inspection, persistence callback, or actionable plan is missing (`cleanup-selected-entry-missing`, `cleanup-resource-record-invalid`, `cleanup-delivery-evidence-incomplete`, `cleanup-fresh-inspection-or-persistence-missing`, `cleanup-plan-not-actionable`). | Prevents cleanup from guessing ownership or eligibility. | Critical |
| C02 | Resource cleanup | Resource kind is unknown, unowned/unrelated, lacks an ownership token, is primary/remote/locked/dirty, or has no canonical head (`unknown-resource-kind`, `unrelated-or-unowned`, `ownership-token-missing`, `primary-resource`, `remote-resource`, `locked-resource`, `dirty-resource`, `head-missing`). | Prevents deleting shared, user-owned, active, or uncommitted resources. | Critical |
| C03 | Resource cleanup | Delivery evidence is stale, head diverges, branch still has references, remote merge is unproven, or worktree dependency remains (`delivery-evidence-stale`, `divergent-head`, `cleanup-branch-*`, `remote-counterpart-not-merged`, `dependency-worktree-still-present`). | Prevents deleting work that is not safely delivered. | Critical |
| C04 | Cleanup execution | Fresh inspection differs from the plan or resource became ineligible (`fresh-resource-mismatch`, `fresh-inspection-drift`, `controller-cleanup-resource-ineligible`, `cleanup-worktree-ineligible`). | Closes the time-of-check/time-of-use gap before deletion. | Critical |
| C05 | Cleanup receipt | Receipt input/path is invalid, lies inside the target worktree, cannot be persisted, or outcome persistence fails (`receipt-*-invalid`, `receipt-path-inside-worktree`, `receipt-write-failed`, `outcome-persist-failed`, `controller-cleanup-receipt-*`). | Ensures proof survives removal of the resource it describes. | Critical |
| C06 | Cleanup completion | Any registered resource lacks a terminal or already-completed receipt (`controller-cleanup-incomplete`, `controller-cleanup-resources-missing`, `cleanup-controller-checkpoint-retention-incomplete`). | Prevents an empty action list or partial cleanup from being called complete. | High |
| C07 | Legacy cleanup migration | Resource is legacy/unmigrated or migration authorization/signature/inspection mismatches (`legacy-unmigrated`, `cleanup-legacy-migration-*`). | Prevents inferred ownership of stranded historical resources. | Critical |
| C08 | Bootstrap cleanup | Attachment, binding, resource, dependency, migration freshness, inspection, or retention record is invalid, absent, duplicated, or conflicting (`bootstrap-cleanup-*`). | Protects the special compatibility cleanup path from cross-run or stale-resource deletion. | Critical |
| C09 | Claim release | Archive, issue, Project, delivery, or cleanup completion predicate is missing (`claim-release-blocked`). | Keeps the repository claim active until every owned obligation is reconciled. | High |
| C10 | Terminalization | Input, active record, identity/claim, completion evidence, bootstrap attachment, receipt, or record is invalid/conflicting (`terminalization-*-invalid`, `terminalization-*-mismatch`, `terminalization-record-conflict`). | Prevents a nonterminal or different run from being archived as complete. | Critical |
| C11 | Terminalization | Archive identity/request conflicts, archive inspection fails, or post-archive verification disagrees (`terminalization-archive-*`, `terminalization-post-archive-verification-failed`). | Prevents losing the authoritative run during active-to-archive movement. | Critical |
| C12 | Cancellation | Run is delivered, not expired, identity/claim differs, archive conflicts, projection is invalid, or cleanup disagrees (`cancellation-*`). | Prevents cancellation from becoming a shortcut to completion or claim release. | Critical |
| C13 | Early retirement | Exact signed owner authorization is absent/expired, blocking reason differs, progress evidence exists, or required transition is actually available (`early-retirement-*`, `controller-retirement-*`). | Limits retirement to genuinely stranded undelivered runs and records it as cancellation, not success. | Critical |
| C14 | State archive/index | Archive bundle, claim, projection, reconciliation, move, or index rebuild fails (`archive-*`, `index-rebuild-*`, `projection-rebuild-failed`). | Preserves discoverability and authoritative durable history. | High |

### 8. Universal human-decision and environment boundaries

| ID | Workflow blocked | Trigger condition and code(s) | Why necessary / what it prevents | Severity |
| --- | --- | --- | --- | --- |
| U01 | Any phase | Missing/conflicting requirement, observable behavior, compatibility rule, architecture choice, data ownership, license, security posture, or governance decision (`material-requirement`, `compatibility-change`, `architecture-choice`, `data-ownership`, `license-obligation`, `governance`). | Prevents the model from making owner-level product or governance decisions. | High |
| U02 | Any phase | Credential creation, rotation, disclosure, storage, or scope broadening is required (`credential`). | Prevents secret exposure and unauthorized privilege expansion. | Critical |
| U03 | Any phase | Destructive action is required outside the approved recovery plan (`destructive-action`). | Prevents irreversible loss. | Critical |
| U04 | Any phase | Durable sources conflict and approved precedence cannot resolve them (`durable-state-conflict`, `controller-context-conflict`). | Prevents guessing which history is authoritative. | Critical |
| U05 | Any phase | Persistent environment, authentication, network, rate-limit, disk, tool, or external-service failure prevents safe progress (`environment-impasse`, `retryable-infrastructure`, review diagnostic availability categories). | Stops repeated mutation or evidence claims when the environment is not trustworthy. | Medium, rising to High if state is in doubt |
| U06 | Any phase | Correction budget is exhausted for one stable failure signature (`correction-budget-exhausted`, `correction-limit-exhausted`). | Prevents infinite or progressively riskier autonomous correction. | High |
| U07 | Any phase | Untrusted issue, PR, web, document, model output, or review transcript would need to be executed as shell input. | Prevents prompt injection and arbitrary code execution. | Critical |
| U08 | Any phase | Result, outcome, operation, reason, or live state is unknown/unclassified (`outcome-unknown`, `operation-unknown`, `unclassified-runtime-failure`, `unknown-run-status`, `unobservable-live-state`). | Makes the system fail closed when new or malformed states are encountered. | High |

## Conditions that do not pause by themselves

These conditions may look severe but are intentionally routed without an
immediate human pause when current evidence supports a bounded correction:

| Condition | Behavior |
| --- | --- |
| Formatting, lint, type, schema, deterministic test, link, generated exposure, or stale fixture failure | Record an objective failure, correct within scope, and rerun affected checks. |
| Missing evidence that can be generated without changing approved behavior | Generate the evidence and re-evaluate the same gate. |
| Blocker/high review finding with a clear behavior-preserving fix | Enter the objective correction loop; severity remains impact, not automatic human-decision classification. |
| Warning accepted by the approved plan or formal evidence | Record it and continue. |
| False positive disproved by cited current evidence | Record the disposition and continue. |
| Changed head after an objective correction | Invalidate prior evidence and rerun affected validation and the complete review path; pause only if the new path cannot pass. |

## Code-family coverage and default behavior

The tables intentionally group mechanically equivalent validation codes. The
following generated families all map to the condition named by their suffix:

- `operation-contract-${reason}` wraps operation-contract gate reasons such as
  `authorization-expired`, `claim-not-active`, `evidence-not-current`,
  `planning-not-ready`, `apply-not-ready`, `review-not-ready`,
  `adapter-unavailable`, `runtime-permission-unavailable`,
  `operation-contract-mismatch`, and `outcome-unknown`.
- `github-auth-context-${classification}` preserves the auth probe’s terminal
  class; unknown, denied, stale, invalid/expired, and mismatched forms pause.
- `host-${outcome}` preserves denied, failed, timed-out, conflict, or unknown
  host outcomes; none can be promoted to success by a wrapper.
- `independent-reviewer-${adapter}-*`, `review-launcher-${adapter}-*`,
  `codex-capture-*`, `review-worktree-*`, and
  `independent-review-package-capsule-*` preserve the typed review diagnostic
  category. Every non-success terminal record pauses a required review gate.
- `controller-*`, `v2-admission-*`, `terminalization-*`, `cancellation-*`,
  `bootstrap-cleanup-*`, and `cleanup-*` are fail-closed. A code not explicitly
  called out above still maps to A09-A16 or C01-C14 according to its stage.

This grouping includes malformed input, missing artifact, mismatched identity,
expired binding, unsafe path, unavailable resource, permission denial,
execution failure, output-contract failure, cleanup failure, duplicate/conflict,
and persistence failure variants. Success/no-op codes such as `*-complete`,
`*-ready`, `already-converged`, `already-completed`, and
`exact-owned-clean-delivered` are not blockers.

## Why the blocker set feels complex

The controls are enforcing five different risk classes through one visible
“pause” mechanism:

1. owner decisions and routine approvals;
2. authorization and security boundaries;
3. durable-state and concurrency integrity;
4. quality and evidence completeness;
5. environmental capability or transport availability.

Those classes have very different severity and recovery behavior, but the
top-level status often collapses them to `paused`. The code’s safety posture is
mostly consistent; its operator model is not. A future simplification should
preserve the gates while exposing at least `decision-required`,
`authorization-denied`, `state-conflict`, `quality-failed`, and
`capability-unavailable` as distinct first-class pause categories.

## Source coverage

This catalog was cross-checked against the current non-test control-plane
sources and canonical policy references:

- [Request resolver](../../../scripts/sdd/resolve-sdd-delivery-request.mjs)
- [Runtime launcher](../../../scripts/runtime/launcher.mjs)
- [Run-policy validator](../../../scripts/sdd/validate-run-policy.mjs)
- [Operation authorization](../../../scripts/sdd/check-operation-authorization.mjs)
- [Operation contract](../../../scripts/sdd/autonomous-sdd-operation-contract.mjs)
- [Admission](../../../scripts/sdd/autonomous-sdd-admission.mjs)
- [Controller](../../../scripts/sdd/autonomous-sdd-controller.mjs)
- [Checkpoint classification](../../../scripts/sdd/checkpoint.mjs)
- [Local durable store](../../../scripts/sdd/autonomous-sdd-local-store.mjs)
- [Result classification](../../../scripts/sdd/classify-result.mjs)
- [Correction chain](../../../scripts/sdd/correction-chain.mjs)
- [Review admission](../../../scripts/sdd/autonomous-sdd-review-admission.mjs)
- [Review dispatcher](../../../scripts/sdd/autonomous-sdd-review-dispatcher.mjs)
- [Review executor](../../../scripts/sdd/execute-independent-review.mjs)
- [Review contract](../../../scripts/sdd/independent-review-contract.mjs)
- [Review launcher recovery](../../../scripts/sdd/review-launcher-recovery.mjs)
- [GitHub envelope and transitions](../../../scripts/sdd/autonomous-sdd-github-envelope.mjs)
- [Sync contract](../../../scripts/sdd/autonomous-sdd-sync-contract.mjs)
- [Workspace cleanup](../../../scripts/sdd/sdd-workspace-cleanup.mjs)
- [Finalization](../../../scripts/sdd/autonomous-sdd-finalization.mjs)
- [Autonomous lifecycle policy](../../../skills/base/autonomous-sdd-lifecycle/SKILL.md)
- [Authorization policy](../../../skills/base/autonomous-goal-runner/references/authorization-policy.md)
- [Human-decision classification](../../../skills/base/autonomous-goal-runner/references/human-decision-classification.md)
- [OpenSpec action gates](../../../skills/base/autonomous-sdd-lifecycle/references/openspec-actions.md)
- [Delivery gates](../../../skills/base/autonomous-sdd-lifecycle/references/delivery.md)
- [Recovery precedence](../../../skills/base/autonomous-sdd-lifecycle/references/recovery.md)
- [External mutation boundaries](../../../skills/base/autonomous-sdd-lifecycle/references/external-mutations.md)
