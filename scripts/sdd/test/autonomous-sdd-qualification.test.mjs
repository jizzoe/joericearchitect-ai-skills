import assert from "node:assert/strict";
import test from "node:test";

import {
  classifyRealRun,
  consecutiveCompletions,
  evaluateMatrixRow,
  faultMatrixGate,
  releaseDecision,
  validateMatrixRowSchema
} from "../autonomous-sdd-qualification.mjs";

const completed = { status: "completed" };
const incomplete = { status: "incomplete" };

test("consecutiveCompletions counts trailing completed runs and resets on a break", () => {
  const ten = Array.from({ length: 10 }, () => completed);
  assert.equal(consecutiveCompletions({ runs: ten }).streak, 10);
  assert.equal(consecutiveCompletions({ runs: ten }).met, true);
  const broken = [...ten.slice(0, 5), incomplete, ...ten.slice(0, 3)];
  assert.equal(consecutiveCompletions({ runs: broken }).streak, 3);
  assert.equal(consecutiveCompletions({ runs: broken }).met, false);
  assert.equal(consecutiveCompletions({ runs: [] }).streak, 0);
});

test("classifyRealRun classifies count, break, and stale-prior-runs", () => {
  assert.equal(classifyRealRun({ status: "completed" }).effect, "count");
  assert.equal(classifyRealRun({ status: "incomplete" }).effect, "break");
  assert.equal(classifyRealRun({ status: "terminal" }).effect, "break");
  assert.equal(classifyRealRun({ status: "stale" }).effect, "break");
  assert.equal(classifyRealRun({ status: "completed", defectAffectsPriorRuns: true }).effect, "stale-prior-runs");
  assert.equal(classifyRealRun({ status: "weird" }).effect, "break");
});

const validRow = {
  scenario: "remote-success-local-receipt-loss",
  environment: "sdd-fixture",
  isolationProof: "scoped-token-403",
  injectionBoundary: "post-remote-pre-receipt",
  allowedMutations: ["issue"],
  expectedOutcome: "converge-no-duplicate",
  evidence: "receipt",
  cleanupContract: "fixture-teardown",
  bound: "one-transition",
  counterEffect: "fault-matrix-only"
};

test("validateMatrixRowSchema requires all fields and fault-matrix-only counter", () => {
  assert.equal(validateMatrixRowSchema({ row: validRow }).valid, true);
  const { row: { evidence, ...rest } } = { row: validRow };
  const missing = validateMatrixRowSchema({ row: rest });
  assert.equal(missing.valid, false);
  assert.deepEqual(missing.missing, ["evidence"]);
  const badCounter = validateMatrixRowSchema({ row: { ...validRow, counterEffect: "real-streak" } });
  assert.equal(badCounter.valid, false);
  assert.equal(badCounter.reason, "matrix-row-counter-effect-invalid");
});

test("evaluateMatrixRow passes only when actual equals expected", () => {
  assert.equal(evaluateMatrixRow({ row: { ...validRow, actualOutcome: "converge-no-duplicate" } }).pass, true);
  const mismatch = evaluateMatrixRow({ row: { ...validRow, actualOutcome: "duplicated" } });
  assert.equal(mismatch.pass, false);
  assert.equal(mismatch.reason, "matrix-row-outcome-mismatch");
  assert.equal(evaluateMatrixRow({ row: validRow }).reason, "matrix-row-incomplete");
});

test("faultMatrixGate passes only with no failed rows", () => {
  const rows = [
    evaluateMatrixRow({ row: { ...validRow, actualOutcome: "converge-no-duplicate" } }),
    evaluateMatrixRow({ row: { ...validRow, actualOutcome: "converge-no-duplicate" } })
  ];
  assert.equal(faultMatrixGate({ rows }).passed, true);
  const failed = [...rows, { pass: false, reason: "x" }];
  assert.equal(faultMatrixGate({ rows: failed }).passed, false);
});

test("releaseDecision requires both gates and names missing ones", () => {
  assert.equal(releaseDecision({ realGateMet: true, matrixGatePassed: true }).qualified, true);
  assert.equal(releaseDecision({ realGateMet: true, matrixGatePassed: true }).decision, "qualified-opt-in");
  const missing = releaseDecision({ realGateMet: true, matrixGatePassed: false });
  assert.equal(missing.qualified, false);
  assert.deepEqual(missing.missing, ["fault-matrix-gate"]);
  assert.deepEqual(releaseDecision({ realGateMet: false, matrixGatePassed: false }).missing, ["real-completion-gate", "fault-matrix-gate"]);
});
