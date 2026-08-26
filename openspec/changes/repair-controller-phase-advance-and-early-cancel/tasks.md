## 1. Durable phase advancement

- [x] 1.1 Add a canonical, first-incomplete-only phase-evidence transition that validates exact controller context and persists the updated checkpoint.
- [x] 1.2 Expose that transition through the declared installed controller helper without adding a generic record writer or assistant-specific behavior. Depends on 1.1.
- [x] 1.3 Add direct and installed-wrapper tests for success, idempotent retry, stale evidence, skipped phase, expiry, context mismatch, and real Git-common persistence. Depends on 1.2.

## 2. Early blocked-run retirement

- [x] 2.1 Define and implement the exact owner-authorization binding and cancellation receipt for a blocked, undelivered admitted run before expiry.
- [x] 2.2 Reuse the immutable archival and claim-release backend; ensure terminal inventory recognizes the retired controller without treating it as delivered. Depends on 2.1.
- [x] 2.3 Add focused tests for exact success, retry, missing/expired/mismatched authority, delivered-run rejection, available-transition rejection, and exact-claim isolation. Depends on 2.2.

## 3. Evidence and recovery

- [x] 3.1 Update canonical lifecycle guidance to name the executable phase transition and constrained early-retirement recovery path; confirm wrappers stay thin.
- [ ] 3.2 Run focused controller, cancellation, admission, and runtime suites; run the runtime build/install distribution check and `openspec validate --all --strict`. Depends on 1.3, 2.3, 3.1.
- [ ] 3.3 Perform bounded local security/recovery review, resolve objective findings, and record portability and attribution evidence before delivery. Depends on 3.2.
- [ ] 3.4 Deliver this repair only through a separately authorized bootstrap flow, then install its runtime and resume the existing exact controller run through the new phase-evidence transition; do not create a competing claim or edit its checkpoint directly. Depends on 3.3.
