## Why

The completed M1-S1 bootstrap delivery left two pre-v2 controller records with
pending phase markers. V2 correctly treats those records as active legacy
authority and refuses a new admission, even though independently verifiable
Git and GitHub evidence shows the linked implementation, Sync, and Archive
pull requests were merged and its owned local branches were cleaned up.

This change adds a deliberately narrow, evidence-led reconciliation path so
that a stranded bootstrap record can be retired without editing, deleting, or
promoting it into a v2 run. It unblocks future v2 admissions while preserving
the original records as audit evidence.

## What Changes

- Add a one-way legacy-bootstrap reconciliation contract that applies only to
  explicitly owner-authorized record identities and exact selected changes.
- Require fresh, independently inspected issue, implementation, Sync, Archive,
  and exact-owned cleanup evidence before recording a terminal reconciliation
  result outside the legacy record.
- Make v2 admission consume a valid terminal-reconciliation receipt when
  classifying the referenced legacy record; retain the existing pause for all
  other active, ambiguous, stale, or mismatched legacy records.
- Preserve the legacy record byte-for-byte, deny legacy writes, prevent v2 run
  creation or native-claim fabrication during reconciliation, and make reruns
  idempotent.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `autonomous-sdd-run-contract`: Permit only an exact, immutable,
  independently-evidenced terminal reconciliation receipt to retire a known
  legacy bootstrap record for v2 admission while retaining legacy audit
  evidence and single-authority guarantees.
- `autonomous-sdd-continuation`: Require a controller-routed reconciliation
  checkpoint to bind its exact legacy record, selected change, evidence, and
  recovery result before any later v2 lifecycle selection.

## Impact

- Affected assets: assistant-neutral v2 admission and legacy-inventory code,
  controller/runtime entrypoints, deterministic fixtures, and thin lifecycle
  guidance.
- No legacy controller file is edited or deleted; no existing run is migrated,
  resumed, or converted into a v2 run.
- The first authorized use is restricted to the two recorded bootstrap
  identities for `establish-autonomous-sdd-run-v2-contract`; reusable code
  accepts future values only through explicit owner authorization and verified
  configuration, never embedded product constants.
- A GitHub issue will be created or reused only during the later authorized
  delivery lifecycle, not by this planning proposal.
