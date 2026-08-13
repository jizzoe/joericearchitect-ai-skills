import assert from "node:assert/strict";
import test from "node:test";
import { checkDeliveryPreapproval, checkOperationAuthorization, profileOperations } from "../../../scripts/sdd/check-operation-authorization.mjs";

const now = "2026-08-12T12:00:00.000Z";
function input(profile, operation, overrides = {}) {
  return {
    now,
    authorization: {
      targets: ["workspace:docs", "record:tracker-1", "adapter:fixture", "pr:42", "change:example", "branch:feature/example"],
      allowedMutations: [operation],
      qualityProfile: "prototype-rapid",
      expiresAt: "2026-08-13T12:00:00.000Z",
      ...overrides.authorization
    },
    runtime: { permittedOperations: [operation], adapterCapabilities: { fixture: [operation] }, ...overrides.runtime },
    config: { adapters: { fixture: { kind: "synthetic", enabled: true, operations: [operation] } }, ...overrides.config },
    request: { profile, operation, target: operation.includes("tracker") ? "record:tracker-1" : "workspace:docs/file.md", ...overrides.request }
  };
}
function code(result) { return result.issues[0]?.code; }
function failureSource(findingId = "new-signature", reviewRecordId = "review-current") {
  return { kind: "independent-review", reviewRecordId, findingId, severity: "high", evidence: "scripts/sdd/check-operation-authorization.mjs", transition: "merge-pr" };
}
function signature(source) { return `independent-review/${source.findingId}/${source.evidence}/${source.transition}`; }
function correctionRecord(attempt, source) {
  const commit = String(attempt).repeat(40);
  const previousCommit = String(Math.max(0, attempt - 1)).repeat(40);
  return { id: `correction-${attempt}`, change: "example", attempt, failureSignature: signature(source), failureSource: source, classification: "objective-fix", behaviorPreserving: true, current: true, ancestryVerified: true, evidenceReference: `evidence:${attempt}`, baseCommit: "a".repeat(40), previousHead: previousCommit, previousManifestDigest: `${attempt - 1}`.repeat(64), headCommit: commit, manifestDigest: `${attempt}`.repeat(64) };
}
function correction(overrides = {}) {
  const correctionRecords = overrides.correctionRecords ?? [];
  const source = overrides.request?.failureSource ?? failureSource();
  const finding = { id: source.findingId, severity: source.severity, evidence: source.evidence, recommendation: "correct deterministic gate" };
  const reviewRecord = { id: source.reviewRecordId, entry: "example", transition: source.transition, evidence: {}, findings: [finding] };
  return {
    authorization: { target: { kind: "change", entries: ["example"] }, correctionBudgetPerFailureSignature: 3, ...overrides.authorization },
    request: { selectedEntry: "example", failureSource: source, checkpoint: { selectedEntry: { name: "example", records: [], reviewRecords: [reviewRecord], correctionAnchor: { baseCommit: "a".repeat(40), headCommit: "0".repeat(40), manifestDigest: "0".repeat(64) }, correctionRecords }, steps: [] }, ...overrides.request }
  };
}

test("each profile permits its fixed operations with authorized workspace or record targets", () => {
  for (const [profile, operations] of Object.entries(profileOperations)) {
    for (const operation of operations) {
      const target = operation.includes("tracker") || operation === "upsert-allowlisted-record" || operation === "write-reconciliation-report" ? "record:tracker-1" : operation === "run-lifecycle-action" ? "change:example" : "workspace:docs/file.md";
      const request = operation === "run-lifecycle-action" ? { target, lifecycleAction: "sync-change" } : { target };
      const overrides = operation === "objective-correction" ? correction({ request }) : { request };
      const result = checkOperationAuthorization(input(profile, operation, overrides));
      assert.equal(result.allowed, true, `${profile}:${operation}:${JSON.stringify(result)}`);
    }
  }
});

test("operation checker pauses for profile, authorization, target, adapter, runtime, expiry, and correction failures", () => {
  assert.equal(code(checkOperationAuthorization(input("research-read-only", "local-edit"))), "operation-not-in-profile");
  assert.equal(code(checkOperationAuthorization(input("local-implementation", "local-edit", { authorization: { allowedMutations: [] } }))), "operation-not-authorized");
  assert.equal(code(checkOperationAuthorization(input("local-implementation", "local-edit", { request: { target: "workspace:outside/file.md" } }))), "unauthorized-target");
  assert.equal(code(checkOperationAuthorization(input("tracker-maintenance", "read-tracker", { request: { target: "record:tracker-1", adapter: "fixture" }, runtime: { adapterCapabilities: { fixture: [] } } }))), "adapter-capability-mismatch");
  assert.equal(code(checkOperationAuthorization(input("tracker-maintenance", "read-tracker", { request: { target: "record:tracker-1", adapter: "fixture" }, authorization: { targets: ["record:tracker-1"] } }))), "unauthorized-adapter");
  assert.equal(code(checkOperationAuthorization(input("local-implementation", "local-edit", { runtime: { permissionGaps: ["sandbox"] } }))), "runtime-permission-gap");
  assert.equal(code(checkOperationAuthorization(input("local-implementation", "local-edit", { authorization: { expiresAt: "2026-08-11T12:00:00.000Z" } }))), "expired-authorization");
  const exhaustedSource = failureSource();
  const exhaustedRecords = [1, 2, 3].map((attempt) => correctionRecord(attempt, exhaustedSource));
  assert.equal(code(checkOperationAuthorization(input("local-implementation", "objective-correction", correction({ correctionRecords: exhaustedRecords })))), "correction-limit-exhausted");
});

test("objective correction derives per-signature attempts from the durable checkpoint", () => {
  const oldSource = failureSource("old-signature", "review-old");
  const newSource = failureSource();
  const records = [correctionRecord(1, oldSource), correctionRecord(2, oldSource), correctionRecord(3, newSource)];
  const valid = correction({ correctionRecords: records, request: { failureSource: newSource, correctionAttempts: 3, correctionAttemptsForFailureSignature: 1 } });
  assert.equal(checkOperationAuthorization(input("local-implementation", "objective-correction", valid)).allowed, true);
  assert.equal(code(checkOperationAuthorization(input("local-implementation", "objective-correction", correction({ correctionRecords: records, request: { failureSource: newSource, correctionAttemptsForFailureSignature: 0 } })))), "correction-attempt-count-mismatch");
  assert.equal(code(checkOperationAuthorization(input("local-implementation", "objective-correction", correction({ correctionRecords: records, request: { failureSource: newSource, correctionAttempts: 1 } })))), "correction-chain-length-mismatch");
  assert.equal(code(checkOperationAuthorization(input("local-implementation", "objective-correction", { request: { failureSource: newSource } }))), "correction-budget-invalid");
  assert.equal(code(checkOperationAuthorization(input("local-implementation", "objective-correction", correction({ correctionRecords: records, request: { failureSource: newSource, failureSignature: "renamed-signature" } })))), "correction-failure-signature-mismatch");
  assert.equal(code(checkOperationAuthorization(input("local-implementation", "objective-correction", correction({ request: { checkpoint: { selectedEntry: { name: "other", records: [], correctionRecords: [] }, steps: [] } } })))), "correction-entry-not-authorized");
});

test("sdd high-impact transitions require exact evidence and recovery boundaries", () => {
  for (const lifecycleAction of ["merge-pr", "archive-change", "delete-merged-topic-branch"]) {
    const target = lifecycleAction === "archive-change" ? "change:example" : lifecycleAction === "delete-merged-topic-branch" ? "branch:feature/example" : "pr:42";
    const result = checkOperationAuthorization(input("sdd-delivery", "run-lifecycle-action", { request: { target, lifecycleAction, evidenceCurrent: true, recovery: "restore from durable records", deliveryProfile: "prototype-rapid" } }));
    assert.equal(result.allowed, true, lifecycleAction);
  }
  assert.equal(code(checkOperationAuthorization(input("local-implementation", "run-lifecycle-action", { request: { lifecycleAction: "merge-pr", evidenceCurrent: true, recovery: "recover" } }))), "operation-not-in-profile");
  assert.equal(code(checkOperationAuthorization(input("sdd-delivery", "run-lifecycle-action", { request: { target: "pr:42", lifecycleAction: "merge-pr", evidenceCurrent: false } }))), "missing-recovery");
  assert.equal(code(checkOperationAuthorization(input("sdd-delivery", "run-lifecycle-action"))), "unnamed-or-unsupported-lifecycle-action");
});

test("high-impact delivery derives its quality gate from durable authorization", () => {
  const request = { target: "pr:42", lifecycleAction: "merge-pr", evidenceCurrent: true, recovery: "re-read durable state" };
  assert.equal(code(checkOperationAuthorization(input("sdd-delivery", "run-lifecycle-action", { request }))), "delivery-profile-authorization-mismatch");
  assert.equal(code(checkOperationAuthorization(input("sdd-delivery", "run-lifecycle-action", { request: { ...request, deliveryProfile: "production-rapid" } }))), "delivery-profile-authorization-mismatch");
  assert.equal(code(checkOperationAuthorization(input("sdd-delivery", "run-lifecycle-action", { authorization: { qualityProfile: "production-rapid" }, request: { ...request, deliveryProfile: "prototype-rapid" } }))), "delivery-profile-authorization-mismatch");
  assert.equal(code(checkOperationAuthorization(input("sdd-delivery", "run-lifecycle-action", { authorization: { qualityProfile: "production-rapid" }, request: { ...request, deliveryProfile: "production-rapid" } }))), "independent-review-input-incomplete");
});

test("delivery preapproval preserves normal interactive prompts and permits only exact prototype exceptions", () => {
  const request = { lifecycleAction: "merge-pr", target: "pr:42" };
  assert.equal(code(checkDeliveryPreapproval({ now, executionMode: "interactive", deliveryProfile: "production-rapid", request })), "just-in-time-approval-required");
  const preapproval = { operation: "merge-pr", target: "pr:42", evidenceCurrent: true, recovery: "revert merge", expiresAt: "2026-08-13T12:00:00.000Z" };
  assert.equal(checkDeliveryPreapproval({ now, executionMode: "interactive", deliveryProfile: "prototype-rapid", request, preapproval, runtime: { permittedOperations: ["run-lifecycle-action"] } }).allowed, true);
  assert.equal(code(checkDeliveryPreapproval({ now, executionMode: "interactive", deliveryProfile: "prototype-rapid", request, preapproval: { ...preapproval, target: "pr:43" }, runtime: { permittedOperations: ["run-lifecycle-action"] } })), "preapproval-target-or-operation-mismatch");
});

test("operation checking remains portable for a second workspace", () => {
  const result = checkOperationAuthorization({
    now,
    authorization: { targets: ["workspace:second-product"], allowedMutations: ["local-edit"], expiresAt: "2026-08-13T12:00:00.000Z" },
    runtime: { permittedOperations: ["local-edit"] },
    request: { profile: "local-implementation", operation: "local-edit", target: "workspace:second-product/src/example.mjs" }
  });
  assert.equal(result.allowed, true, JSON.stringify(result));
});
