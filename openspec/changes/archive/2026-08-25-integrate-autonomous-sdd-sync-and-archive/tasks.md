## 1. Sync contract

- [x] 1.1 Create `scripts/sdd/autonomous-sdd-sync-contract.mjs` with `parseDeltaRequirements` and `parseLivingRequirements`
- [x] 1.2 Implement `applyDeltaToLiving` (ADDED/MODIFIED/REMOVED; invented/dropped/duplicated/corrupted detection)
- [x] 1.3 Implement `detectRequirementConflict` and `buildOverlapGraph` (capability -> requirement -> operation)
- [x] 1.4 Implement `proveRepeatSyncNoOp` and `exactRequirementText`

## 2. Archive contract

- [x] 2.1 Create `scripts/sdd/autonomous-sdd-archive-contract.mjs` with `planArchiveDestination` (archive/already-archived/conflict)
- [x] 2.2 Implement `validateArchiveContentPreservation` and `isArchiveIdempotent`

## 3. Tests

- [x] 3.1 Add focused tests: exact delta-to-living comparison, repeat no-op, two MODIFIED replacements conflict, disjoint capabilities, invented/dropped/duplicated/corrupted rejection, fail-closed before mutation, archive content preservation + idempotency + destination conflict

## 4. Verification

- [x] 4.1 Run the focused test file and the full `scripts/sdd/test` and `scripts/github/test` suites
- [x] 4.2 Run `openspec validate --all --strict` and confirm the new delta validates
