export const realRunStatuses = Object.freeze(["completed", "incomplete", "terminal", "stale"]);
export const matrixRowFields = Object.freeze([
  "scenario", "environment", "isolationProof", "injectionBoundary", "allowedMutations",
  "expectedOutcome", "evidence", "cleanupContract", "bound", "counterEffect"
]);

export function consecutiveCompletions({ runs = [], threshold = 10 } = {}) {
  let streak = 0;
  for (let index = runs.length - 1; index >= 0; index--) {
    if (runs[index]?.status === "completed") streak++;
    else break;
  }
  return { streak, threshold, met: streak >= threshold };
}

export function classifyRealRun({ status, defectAffectsPriorRuns = false } = {}) {
  if (defectAffectsPriorRuns) return { effect: "stale-prior-runs", reason: "defect-affects-prior-runs" };
  if (status === "completed") return { effect: "count", reason: "completed" };
  if (status === "incomplete" || status === "terminal") return { effect: "break", reason: "terminal-or-incomplete-run" };
  if (status === "stale") return { effect: "break", reason: "stale-run" };
  return { effect: "break", reason: "unknown-run-status" };
}

export function validateMatrixRowSchema({ row } = {}) {
  const missing = matrixRowFields.filter((field) => row?.[field] === undefined);
  if (missing.length) return { valid: false, reason: "matrix-row-missing-fields", missing };
  if (row.counterEffect !== "fault-matrix-only") {
    return { valid: false, reason: "matrix-row-counter-effect-invalid" };
  }
  return { valid: true };
}

export function evaluateMatrixRow({ row } = {}) {
  if (row?.expectedOutcome === undefined || row?.actualOutcome === undefined) {
    return { pass: false, reason: "matrix-row-incomplete" };
  }
  if (row.actualOutcome !== row.expectedOutcome) {
    return { pass: false, reason: "matrix-row-outcome-mismatch", expectedOutcome: row.expectedOutcome, actualOutcome: row.actualOutcome };
  }
  return { pass: true };
}

export function faultMatrixGate({ rows = [] } = {}) {
  const failed = rows.filter((row) => row.pass !== true);
  return { passed: failed.length === 0, failed };
}

export function releaseDecision({ realGateMet = false, matrixGatePassed = false } = {}) {
  const missing = [];
  if (!realGateMet) missing.push("real-completion-gate");
  if (!matrixGatePassed) missing.push("fault-matrix-gate");
  const qualified = missing.length === 0;
  return { qualified, decision: qualified ? "qualified-opt-in" : "not-qualified", missing };
}
