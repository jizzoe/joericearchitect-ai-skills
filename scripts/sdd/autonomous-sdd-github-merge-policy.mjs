const text = (value) => typeof value === "string" && value.trim().length > 0;

export function preflightMergePolicy({ observedMergeStrategy, autoDeleteHeadBranches = false, requiresBranchRetention = false } = {}) {
  const strategy = text(observedMergeStrategy) ? observedMergeStrategy : "merge";
  if (requiresBranchRetention && autoDeleteHeadBranches === true) {
    return {
      ok: true,
      strategy,
      autoDeleteHeadBranches: true,
      retentionRequired: true,
      retention: "restore-exact-head"
    };
  }
  return {
    ok: true,
    strategy,
    autoDeleteHeadBranches: autoDeleteHeadBranches === true,
    retentionRequired: requiresBranchRetention,
    retention: requiresBranchRetention ? "verify-retained" : "none"
  };
}

export function planBranchRetentionRestoration({ expectedHead, observedRef, policy } = {}) {
  if (!text(expectedHead)) return { ok: false, error: "expected-head-required", classification: "rejected" };
  if (policy?.retention !== "restore-exact-head") {
    return { ok: true, action: "noop", operation: "branch-retention" };
  }
  if (observedRef) {
    if (observedRef.head === expectedHead) {
      return { ok: true, action: "noop", operation: "branch-retention", retained: true, head: expectedHead };
    }
    return { ok: false, error: "divergent-observed-ref", classification: "rejected", observedHead: observedRef.head, expectedHead };
  }
  return { ok: true, action: "restore", operation: "branch-retention", head: expectedHead, force: false };
}

export function validateBranchRetentionReceipt({ receipt, expectedHead } = {}) {
  if (!receipt || !text(expectedHead)) return { valid: false, reason: "branch-retention-receipt-invalid" };
  if (receipt.restoredHead !== expectedHead) return { valid: false, reason: "branch-retention-head-mismatch" };
  if (receipt.force === true) return { valid: false, reason: "branch-retention-force-forbidden" };
  if (!text(receipt.branch)) return { valid: false, reason: "branch-retention-branch-required" };
  return { valid: true };
}
