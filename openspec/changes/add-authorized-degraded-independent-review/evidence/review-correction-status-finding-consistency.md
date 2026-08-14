# Review Correction: Status/Finding Consistency

- Review record: `degraded-89d7f51e-d05b-45a0-92f8-2efc09ccec03`.
- Reviewed head: `536d68dae382a5bf372fb8b4d53e62862c81f695`.
- Reviewed manifest:
  `e5bca3236a70c97494ea5a8626ce30ca76e8c0b0a426c7bdf7df1d892024eb03`.
- Finding: `review-result-status-finding-inconsistency`.
- Classification: `objective-fix`.
- Failure signature:
  `independent-review/review-result-status-finding-inconsistency/scripts/sdd/independent-review-contract.mjs/merge-pr`.
- Attempt for this signature: 1 of 3.

The fresh zero-touch reviewer found that the canonical result validator checked
the top-level status and each finding separately but did not reject a passed
result containing an unresolved blocker, high, or objective-fix finding. The
correction adds that invariant to the executable validator and the complete
result schema. The model-facing findings schema deliberately remains within
the structured-output subset, which rejects `allOf`; the host validates the
sealed complete result before acceptance. A passed review may still contain warning or false-positive
findings because those require explicit downstream dispositions; unresolved
severities require a failed result and a corrected-head rereview. The delivery
gate evaluates dispositions for failed results before returning so an
authorized objective-fix can still enter the bounded correction loop without
being mislabeled delivery-ready.

Regression coverage rejects the contradictory passed result, accepts the same
objective finding with failed status, and preserves passed warning behavior.
The correction is behavior-preserving, scoped to the reviewer-identified
contract defect, and requires a fresh exact-head review before delivery.
