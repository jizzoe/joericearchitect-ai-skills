## 1. Finalization contract

- [x] 1.1 Create `scripts/sdd/autonomous-sdd-finalization.mjs` with `terminalConvergencePredicate`
- [x] 1.2 Implement `claimReleaseOrder` (cleanup -> terminal -> issue/project)
- [x] 1.3 Implement `classifyResourceEligibility` (eligible vs typed ineligible reasons)
- [x] 1.4 Implement `partialCleanupBlocksRelease`

## 2. Tests

- [x] 2.1 Add focused tests: terminal predicate missing cases, claim-release ordering, resource eligibility (dirty/unrelated/primary/locked/divergent/legacy/remote/ownership-mismatch), partial cleanup blocks release

## 3. Verification

- [x] 3.1 Run the focused test file and the full `scripts/sdd/test` and `scripts/github/test` suites
- [x] 3.2 Run `openspec validate --all --strict` and confirm the new delta validates
