## 1. Planning and failing evidence

- [x] 1.1 Review proposal, delta requirements, design, issue/tracking
  linkage, bootstrap scope, security, recovery, portability, attribution, and
  task dependencies; record the planning result. Evidence: change-local
  planning-review report and strict change validation.
- [x] 1.2 Add failing focused regressions that reproduce non-controller JSON
  false positives, the initializer's exact schema-5 self-checkpoint ambiguity,
  genuine unknown-schema legacy ambiguity, and caller-selected exclusion
  rejection. Depends on: 1.1. Evidence: targeted tests fail for the intended
  pre-fix reasons.

## 2. Candidate and exclusion boundary

- [x] 2.1 Restrict directory discovery to actual `controller.json` candidates
  while preserving malformed and unknown-schema candidate classification and
  byte-for-byte read-only behavior. Depends on: 1.2. Evidence: focused legacy
  inventory tests pass.
- [x] 2.2 Add an exact contained internal exclusion for the initializer's
  derived pending checkpoint, and ensure the public raw-admission wrapper
  cannot accept caller-selected exclusions. Depends on: 2.1. Evidence:
  initializer/admission success, rejection, interruption, and retry tests pass.

## 3. Installed critical flow and operator guidance

- [x] 3.1 Add a staged-runtime integration test using a real temporary Git
  common directory that proves successful installed-wrapper initialization,
  matching controller/run/work-unit/claim identities, exact retry, and a
  fail-closed unrelated ambiguous controller. Depends on: 2.2. Evidence:
  focused runtime build/launcher critical-flow test passes.
- [x] 3.2 Update canonical lifecycle guidance and the blocker register with
  the typed candidate boundary, non-bypass rule, escaped-gate diagnosis, and
  safe runtime-install/resume procedure. Depends on: 3.1. Evidence:
  documentation and requirements mapping review.

## 4. Verification readiness

- [x] 4.1 Run focused SDD/runtime tests, full Node suites, runtime-completeness,
  strict OpenSpec validation, tracking/linkage, secret/security, portability,
  attribution, recovery, and diff checks; record exact results. Depends on:
  3.2. Evidence: change-local verification report tied to the current head.
- [x] 4.2 Perform bounded same-session read-only local review, correct any
  objective findings within budget, rerun affected checks, and record formal
  OpenSpec Verify with no critical findings. Depends on: 4.1. Evidence:
  current local-review and Verify reports.
