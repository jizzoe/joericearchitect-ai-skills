## 1. Report Validation

- [ ] 1.1 Add report metadata fixture.
  - Depends on: none
  - Evidence: fixture includes required report name, date, and checksum fields.

- [ ] 1.2 Add local validation.
  - Depends on: 1.1
  - Evidence: validator reports missing metadata with a deterministic path.

## 2. Verification and Delivery

- [ ] 2.1 Run validation and review.
  - Depends on: 1.2
  - Evidence: validation, review, security, recovery, and portability checks pass.

- [ ] 2.2 Deliver the local artifact update.
  - Depends on: 2.1
  - Evidence: delivery PR contains validation evidence and linked issue context.
