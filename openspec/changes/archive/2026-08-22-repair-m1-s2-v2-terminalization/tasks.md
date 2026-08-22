## 1. Terminalization contract and persistence

- [x] 1.1 Add typed terminalization request, evidence, receipt, and exact
  identity validation to the v2 controller/local-store boundary. Evidence:
  focused positive and rejection tests.
- [x] 1.2 Implement immutable terminal-summary and claim-release records plus
  atomic archive/index convergence and idempotent archived-run inspection.
  Depends on: 1.1. Evidence: temporary-state lifecycle tests.

## 2. Declared runtime exposure

- [x] 2.1 Expose `terminalize-v2-run` as an enumerated controller subcommand
  and add it to the shared runtime manifest. Depends on: 1.2. Evidence:
  wrapper and runtime-dispatch tests reject undeclared or malformed requests.
- [x] 2.2 Update canonical lifecycle documentation and the blocker handoff with
  the supported terminalization/recovery boundary and plain-English operator
  guidance. Depends on: 2.1. Evidence: documentation review and link check.

## 3. Quality evidence and delivery readiness

- [x] 3.1 Add regression coverage for exact success, mismatched evidence,
  incomplete cleanup, duplicate retry, unrelated active claim, and subsequent
  v2 admission. Depends on: 2.1. Evidence: focused tests pass.
- [x] 3.2 Run the focused suites, full Node suite, runtime build/dispatch
  checks, strict OpenSpec validation, requirements mapping, security/secret,
  portability, and recovery review; record results in change-local evidence.
  Depends on: 3.1. Evidence: all checks current at the reviewed head.
- [x] 3.3 Perform a bounded same-session read-only local review and resolve any
  objective findings with fresh affected evidence. Depends on: 3.2. Evidence:
  current local-review record.

## 4. One-time repair execution

- [x] 4.1 After the repair change is delivered and its runtime installed,
  independently inspect the exact M1-S2 delivery/cleanup evidence and invoke
  terminalization only through the declared runtime. Depends on: 3.3.
  Evidence: `evidence/post-release-operational-evidence.md` records the exact
  terminal receipt, archived bundle, claim release, and rebuilt index.
- [x] 4.2 Prove M1-S3 v2 admission no longer sees the M1-S2 claim, update the
  blocker register with resolution evidence, and resume the first incomplete
  M1-S3 lifecycle step. Depends on: 4.1. Evidence: fresh admission result.
  Evidence: `evidence/post-release-operational-evidence.md` records M1-S3's
  subsequent admission, completed delivery, and terminal receipt.
