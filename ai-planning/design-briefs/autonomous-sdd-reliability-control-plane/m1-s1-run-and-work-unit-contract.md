# M1-S1 — Run and Isolated Work-Unit Contract

Date: 2026-08-20
Status: Delivered and archived. Issue #150; implementation, Sync, and Archive
PRs #151, #152, and #153.
Proposed change: `establish-autonomous-sdd-run-v2-contract`

## 1. Problem and desired outcome
Problem: Autonomous SDD has competing durable state shapes and unclear ownership boundaries.
Desired outcome: One backend-neutral run and isolated work-unit contract owns durable identity, history binding, claims, attempts, evidence, and cleanup.

## 2. Evidence and key findings
- [Harness research](../../research/autonomous-agent-harness-landscape-2026/findings.md)
  supports deterministic control boundaries, least-authority workers,
  observable evidence, fault injection, and bounded recovery.
- [Build-vs-buy research](../../research/reliability-engineering/durable-execution-build-vs-buy/durable-execution-build-vs-buy-findings.md)
  supports a small local first substrate, a portable domain contract, and
  later reevaluation of Temporal or another established backend.
- The [main design](../autonomous-sdd-reliability-control-plane.md) supplies
  the shared architecture, invariants, role boundaries, and accepted sequencing
  that this slice must preserve.
- The [roadmap](../../plans/autonomous-sdd-reliability-control-plane-roadmap.md)
  is the authority for this slice's dependencies, readiness, execution order,
  and containing milestone exit evidence.

## 3. Options considered and tradeoffs
- Keep existing records and translate at runtime. Rejected: their competing
  state shapes and location-dependent discovery retain multiple authorities.
- Adopt a vendor workflow schema as the domain model. Rejected for v1: it
  would make SDD semantics depend on a backend selected before local needs are
  qualified.
- Build a general local workflow engine. Rejected: v1 needs one local writer,
  no daemon, no scheduler, and no automatic restart.
- Use time-based stale-lock reclamation or a PID file. Rejected: neither can
  prove a delayed prior writer cannot act after takeover.
- Define a small SDD-owned portable contract with immutable local records and
  one native-handle lock. Selected: it satisfies the one-host threat model
  without making local storage a second workflow platform.

## 4. Decisions, assumptions, and owner
- Owner: Initiative owner; contract boundaries require owner acceptance before Propose.
- Confirmed decisions: The SDD domain contract stays backend-neutral; one
  authoritative history owns a run; single-change v1 admits one active mutating
  run per canonical repository; and a registry is a searchable projection, not
  an authority. State lives outside worktrees in
  `${XDG_STATE_HOME:-$HOME/.local/state}/ai-skills/autonomous-sdd/`.
- Repository identity: a repository ID is `r1-<sha256(canonical-remote-identity)>`,
  where the configured canonical remote has a normalized, credential-free fetch
  URL. The remote identity, not a worktree path, keeps the ID stable after a
  move, removal, or fresh clone. A mutating v1 admission without that identity,
  or after an unapproved identity change, pauses.
- Platform commitment: v1 supports native Windows from day one, as well as
  macOS/Linux. It uses the same lock and fencing semantics on every supported
  platform; WSL is not the Windows support boundary.
- Takeover: only an explicit operator takeover may replace an unclean owner.
  It never infers death from time. The old owner must be conclusively absent
  for its recorded host/boot instance and PID/start identity, the new runner
  must hold the repository lock, and all in-flight external attempts must be
  reconciled or remain `in-doubt` and block mutation.
- Archive retention/deletion policy remains intentionally deferred. Version one
  archives but does not automatically delete audit evidence.

## 5. Scope, non-goals, constraints, dependencies, and risks
- Scope: M1-S1 run, work-unit, transition-attempt, resource-claim, projection,
  archive, and migration contracts.
- Non-goals: Executing transitions, selecting a Temporal deployment, migrating
  ambiguous legacy state automatically, or deleting audit evidence automatically.
- Constraints: Preserve audit evidence, reject ambiguous migration, avoid
  backend-specific fields in the domain model, keep claim authority singular,
  and reject unsupported filesystem or lock-capability admission.
- Dependencies: None; this is the first roadmap slice, but its named ownership,
  threat-model, substrate, and claim-provider decisions block Propose.
- Risks: Redundant authority, over-generalized schema, or premature storage
  mechanics could make local recovery unsafe and Temporal portability costly.

### Proposed contract

- `parentRun` owns approved intent, global deadline, immutable backend/history
  and claim-provider bindings, and child terminal summaries. Single-change v1
  has exactly one child.
- `workUnit` owns one change, its authorization/configuration digests, role
  handoffs, lifecycle state, evidence namespace, derived resources, and cleanup.
- `transitionAttempt` owns a stable ID and idempotency key, precondition and
  target digests, ownership generation, write-ahead state, receipt, and result.
- `resourceClaim` owns canonical repository conflict scope, owner identity,
  stale-owner proof, acquisition, release, and recovery evidence.
- One authoritative backend history controls a run. Registries and status are
  rebuildable projections; claim authority remains separate and singular.
- Parent records may project only a child's `workUnitId`, ordinal,
  approved-change ID, terminal status/reason, start/terminal times, final head,
  attempt and correction counts, claim and cleanup dispositions, child-history
  reference/digest, and terminal-summary digest. They must not copy child
  authorization/configuration, detailed evidence, attempts, resources, tokens,
  or role handoffs.
- Per-repository state uses this shape, where records and evidence are
  write-once durable history and `projection`/`index` are rebuildable:

  ```text
  repositories/<readable-name>--<repository-id-prefix>/
    repository.json
    locks/mutation.lock
    active/<parent-run-id>/{parent,children/<work-unit-id>}/{manifest.json,records,evidence,projection.json}
    index/{repository-status.json,runs/<parent-run-id>.json}
    archive/YYYY/MM/DD/<parent-run-id>/{archive-manifest.json,parent,children}
  ```

- Local v1 uses one exclusive native-handle lock for the repository: Windows
  `LockFileEx`; POSIX advisory locking on macOS/Linux. M2-S1 must select and
  pin an audited Node 20.19 adapter that proves both implementations. It may
  not substitute a timeout-based mkdir lock, a PID file, or a platform-specific
  weaker mode. Every mutation also checks the current ownership generation,
  so an old process cannot write after takeover.
- Safe publication writes an immutable record to a unique temporary file,
  flushes it with the platform-supported durable-write primitive, atomically
  renames it in the same directory, and durably flushes directory metadata
  where that platform supports it. M2-S1 must prove the equivalent crash
  boundary on Windows rather than assuming POSIX directory `fsync`. New
  records, rather than in-place history edits, advance state.
- The active-run area contains only active, paused, or unreconciled runs. Once a
  run is terminal and has no unresolved claim, cleanup, or recovery work, its
  complete record moves into a date-partitioned immutable archive and the active
  area retains only a small status summary and archive reference. Archive
  compaction must preserve a manifest, record digests, and the reason and time
  of the move. Version one does not automatically delete archived evidence;
  archive-retention and deletion policy require a later explicit owner decision.
- Archive is permitted only while the repository lock is held; every child is
  terminal, no claim/cleanup/recovery or prepared/in-flight/in-doubt attempt
  remains, and a rebuilt projection matches history. The verified complete run
  bundle is renamed atomically to its date partition, then the index is rebuilt.
  A failed archive leaves or reconstructs one valid bundle; it never guesses.

### Existing-path disposition and safe cutover

| Existing component | Contract outcome |
|---|---|
| `autonomous-sdd-controller.mjs` record/persistence | Replace; retain only a read-only legacy decoder. |
| Controller cleanup helpers and `sdd-workspace-cleanup.mjs` | Reuse behind child-owned v2 resource and cleanup records. |
| `checkpoint.mjs` | Retain only to read legacy records. |
| Delivery resolver, run-policy validator, and operation checker | Adapt behind M1-S2/M1-S3's unified authorization, operation, and configuration contracts. |
| Review contracts, adapters, launcher recovery, and worktree lifecycle | Reuse behind the new contract; M3 integrates them. |
| Current status/inspection | Replace with an index rebuilt from authoritative history. |
| OpenSpec Sync/Archive skills | Keep unchanged as lifecycle actions; they are distinct from run-history archive. |
| Lifecycle/delivery skills and generated wrappers | Adapt to thin v2 entrypoints; retire legacy write instructions only after cutover proof. |

Cutover first inventories every legacy record. It never auto-migrates or
rewrites an unclear record. Before v2 is enabled for a repository, no legacy
mutating run may be active; legacy creation/advance is disabled and remains
read-only. New v2 records are then the sole official record for new runs.
Legacy write paths retire only after v2 qualification, decoder fixtures,
entrypoint write-denial tests, a no-active-legacy inventory, and a tested
rollback that never makes two systems authoritative for one run.

### Retrospective activation clarification

This slice delivered the v2 schema, local state substrate, admission, and
repository-claim contracts. Their publication did not constitute safe
operational activation. The initial rollout nevertheless used v2 admission and
claims before the same released generation could initialize its controller,
recover, terminalize, release, converge external lifecycle state, clean up, and
roll back. The resulting bootstrap repairs are recorded in the blocker register.

The permanent correction is the
[bootstrap/cutover stabilization plan](../stabilize-autonomous-sdd-bootstrap-and-cutover-plan.md):
M1 contracts remain delivered, but new runtime generations stay contract-only
or audit/shadow until the complete vertical activation bundle passes the
applicable qualification gate. Exactly one generation owns mutation.

### Acceptance evidence

- Schema fixtures reject redundant parent/child state, cross-work-unit evidence,
  mutable backend bindings, duplicate identities, and unknown record kinds.
- Compatible v1 records migrate deterministically; ambiguous records remain
  immutable audit-only evidence with an actionable classification.
- Local and mock-Temporal serializers prove the domain schema does not depend
  on either runtime.
- Archive fixtures prove that only terminal, fully reconciled runs leave the
  active-run area; that their archive manifest and digests remain verifiable;
  and that active, paused, ambiguous, or cleanup-pending runs cannot be
  archived or deleted.
- Identity fixtures prove that moved/removed worktrees and fresh clones resolve
  to the same repository ID, while same-named repositories with different
  canonical remotes do not collide. Credential-bearing or changed remote
  identities pause admission.
- Parent/child fixtures reject every copied field outside the allowlist and
  prove that child history, evidence, resources, and cleanup remain isolated.
- Cross-platform fault fixtures on native Windows and macOS/Linux prove mutual
  exclusion, crash release, definite-liveness takeover, generation-fenced
  stale-writer rejection, and rejection of uncertain takeover. They also prove
  that no timeout-based stale-lock path exists.
- Cutover fixtures prove that legacy records remain readable but cannot advance,
  and that no run has both a legacy and v2 official record.
- The accepted threat model and local-backend complexity tripwire are recorded
  before M2-S1 can become Propose-ready.

## 6. Remaining decisions and implementation guardrails
- M2-S1 must select the pinned native Node lock adapter only after source,
  license, Node 20.19, Windows, macOS, and Linux compatibility evidence. A
  missing equivalent lock capability blocks implementation; it does not weaken
  one platform.
- Repository configuration must declare the canonical remote and the one
  local claim provider; changing either while a run or claim is active fails
  closed. Remote-less repositories are outside mutating v1 admission.
- Future archive retention must decide duration, legal/owner holds, quotas,
  backup/restore, redaction, deletion authority, secure erasure, and deletion
  evidence. It is not a v1 blocking decision.

## 7. Recommended next step

M1-S1 is complete. After the bootstrap/cutover planning change is archived,
resume with M2-S1 under a separate exact authorization while keeping real
operational ownership disabled until the full activation bundle is qualified.
