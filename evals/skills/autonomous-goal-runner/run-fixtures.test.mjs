import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { classifyResult } from "../../../scripts/sdd/classify-result.mjs";
import { inspectCheckpoint } from "../../../scripts/sdd/checkpoint.mjs";
import { validateRunPolicy } from "../../../scripts/sdd/validate-run-policy.mjs";

const fixtureDir = new URL("./fixtures/", import.meta.url);

function fixture(name) {
  return JSON.parse(fs.readFileSync(new URL(name, fixtureDir), "utf8"));
}

test("run policy accepts sufficient authorization", () => {
  const result = validateRunPolicy(fixture("run-policy-valid.json"));
  assert.equal(result.valid, true);
  assert.equal(result.classification, "authorized");
});

test("run policy rejects missing material boundary", () => {
  const result = validateRunPolicy(fixture("run-policy-missing-target.json"));
  assert.equal(result.valid, false);
  assert.equal(result.issues.some((issue) => issue.code === "missing-target"), true);
});

test("run policy rejects forbidden allowed action", () => {
  const result = validateRunPolicy(fixture("run-policy-forbidden-action.json"));
  assert.equal(result.valid, false);
  assert.equal(result.issues.some((issue) => issue.code === "forbidden-action-allowed"), true);
});

test("run policy rejects expired authorization", () => {
  const result = validateRunPolicy(fixture("run-policy-expired.json"));
  assert.equal(result.valid, false);
  assert.equal(result.issues.some((issue) => issue.code === "expired-authorization"), true);
});

test("run policy applies deterministic operation checks when an action is supplied", () => {
  const input = fixture("run-policy-valid.json");
  input.authorization.targets = ["workspace:docs"];
  input.authorization.allowedMutations = ["local-edit"];
  input.runtime.permittedOperations = ["local-edit"];
  input.operationRequest = {
    profile: "research-read-only",
    operation: "local-edit",
    target: "workspace:docs/result.md"
  };
  const result = validateRunPolicy(input);
  assert.equal(result.valid, false);
  assert.equal(result.issues.some((issue) => issue.code === "operation-operation-not-in-profile"), true);
});

test("run policy rejects configured product constants in canonical text", () => {
  const result = validateRunPolicy(fixture("run-policy-product-constant.json"));
  assert.equal(result.valid, false);
  assert.equal(
    result.issues.some((issue) => issue.code === "product-constant-in-canonical-asset"),
    true
  );
});

test("result classification covers objective fixes", () => {
  const result = classifyResult(fixture("result-objective-fix.json"));
  assert.equal(result.classification, "objective-fix");
  assert.equal(result.shouldPause, false);
});

test("result classification covers human decisions", () => {
  const result = classifyResult(fixture("result-human-decision.json"));
  assert.equal(result.classification, "human-decision");
  assert.equal(result.shouldPause, true);
});

test("result classification covers warnings", () => {
  const result = classifyResult(fixture("result-warning.json"));
  assert.equal(result.classification, "warning");
  assert.equal(result.shouldPause, false);
});

test("result classification covers false positives", () => {
  const result = classifyResult(fixture("result-false-positive.json"));
  assert.equal(result.classification, "false-positive");
  assert.equal(result.shouldPause, false);
});

test("result classification covers credential issues", () => {
  const result = classifyResult(fixture("result-credential.json"));
  assert.equal(result.classification, "human-decision");
  assert.equal(result.shouldPause, true);
});

test("result classification covers repeated failures", () => {
  const result = classifyResult(fixture("result-repeated-failure.json"));
  assert.equal(result.classification, "blocked");
  assert.equal(result.shouldPause, true);
});

test("result classification covers environment impasse", () => {
  const result = classifyResult(fixture("result-environment-impasse.json"));
  assert.equal(result.classification, "environment-impasse");
  assert.equal(result.shouldPause, true);
});

test("checkpoint inspection finds first incomplete step", () => {
  const result = inspectCheckpoint(fixture("checkpoint-first-incomplete.json"));
  assert.equal(result.classification, "continue");
  assert.equal(result.firstIncomplete, "apply");
});

test("checkpoint inspection reports no-op completed transition", () => {
  const result = inspectCheckpoint(fixture("checkpoint-no-op.json"));
  assert.equal(result.classification, "no-op");
  assert.equal(result.firstIncomplete, null);
});

test("checkpoint inspection detects stale evidence", () => {
  const result = inspectCheckpoint(fixture("checkpoint-stale-evidence.json"));
  assert.equal(result.classification, "stale-evidence");
  assert.equal(result.firstIncomplete, "verify");
});

test("checkpoint inspection detects durable-state conflict", () => {
  const result = inspectCheckpoint(fixture("checkpoint-conflict.json"));
  assert.equal(result.classification, "human-decision");
  assert.equal(result.reason, "durable-state-conflict");
});

test("checkpoint correction limits apply per failure signature rather than globally", () => {
  const correctionRecords = ["signature-a", "signature-a", "signature-a", "signature-b"].map((findingId, index) => ({
    id: `correction-${index + 1}`,
    change: "change",
    attempt: index + 1,
    failureSource: { kind: "independent-review", reviewRecordId: `review-${index + 1}`, findingId, severity: "high", evidence: "scripts/sdd/checkpoint.mjs", transition: "merge-pr" },
    failureSignature: `independent-review/${findingId}/scripts/sdd/checkpoint.mjs/merge-pr`,
    classification: "objective-fix",
    behaviorPreserving: true,
    current: true,
    ancestryVerified: true,
    evidenceReference: `evidence:correction-${index + 1}`,
    baseCommit: "1".repeat(40),
    previousHead: String(index + 2).repeat(40),
    previousManifestDigest: String(index + 2).repeat(64),
    headCommit: String(index + 3).repeat(40),
    manifestDigest: String(index + 3).repeat(64)
  }));
  const checkpoint = { selectedEntry: { name: "change", records: [], correctionRecords }, steps: [{ id: "apply", status: "pending" }] };
  assert.equal(inspectCheckpoint(checkpoint).classification, "continue");
  const exhausted = { ...checkpoint, selectedEntry: { ...checkpoint.selectedEntry, correctionRecords: correctionRecords.map((record, index) => index === 3 ? { ...record, failureSource: { ...record.failureSource, findingId: "signature-a" }, failureSignature: "independent-review/signature-a/scripts/sdd/checkpoint.mjs/merge-pr" } : record) } };
  assert.equal(inspectCheckpoint(exhausted).reason, "selected-entry-invalid-correction-records");
});

test("generic runner scenarios cover required behavior groups", () => {
  const scenarios = JSON.parse(
    fs.readFileSync(new URL("./scenarios.json", import.meta.url), "utf8")
  ).scenarios;
  const kinds = new Set(scenarios.map((scenario) => scenario.kind));
  for (const kind of ["positive", "negative", "retry", "no-op", "stop", "portability"]) {
    assert.equal(kinds.has(kind), true, `missing ${kind} scenario`);
  }
  for (const id of ["concise-delivery-request-complete", "concise-delivery-request-missing-inputs"]) {
    assert.equal(scenarios.some((scenario) => scenario.id === id), true, `missing ${id} scenario`);
  }
});

test("second repository portability fixture uses configured repository values", () => {
  const input = fixture("portability-second-repo.json");
  const result = validateRunPolicy(input);
  assert.equal(result.valid, true);
  assert.equal(input.repository.owner, "second-owner");
  assert.equal(input.repository.defaultBranch, "trunk");
});

test("non-OpenSpec generic-work fixture supplies adapter-owned work contract", () => {
  const input = fixture("portability-generic-work.json");
  assert.equal(input.adapter.type, "generic-work");
  assert.deepEqual(input.adapter.transitions, ["select", "apply", "verify"]);
  assert.equal(input.expect.includes("does not require OpenSpec-specific artifacts"), true);
});
