## 1. Cleanup comparison repair

- [x] 1.1 Normalize `exists` symmetrically in the final fresh-resource comparison while retaining the explicit fresh existence gate. Evidence: an exact recorded resource with migration-time `exists: true` compares equal to its fresh eligible inspection.
- [x] 1.2 Preserve fail-closed comparison for every stable resource field and existing receipt-before-effect behavior. Evidence: a materially changed fresh inspection produces a blocked receipt and no cleanup operation.

## 2. Regression coverage

- [x] 2.1 Add focused cleanup-helper tests for the eligible legacy `exists` resume and a real mismatch rejection. Evidence: focused Node tests pass.
- [x] 2.2 Add an end-to-end bootstrap-attachment regression that resumes from the existing blocked-receipt shape without creating a run, claim, or remote deletion. Evidence: controller test proves only the exact cleanup operation is called and receipts are durable.

## 3. Durable explanation and verification

- [x] 3.1 Add the permanent cleanup-comparison defect, zero-deletion evidence, milestone assessment, and safe resume path to the blocker handoff.
- [x] 3.2 Run focused tests, the full Node suite, strict OpenSpec validation, runtime build/manifest verification, whitespace check, and same-session local review. Evidence: all checks pass with no unresolved objective finding.
