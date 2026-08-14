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
      correctionBudgetPerFailureSignature: 3,
      expiresAt: "2026-08-13T12:00:00.000Z",
      ...overrides.authorization
    },
    runtime: { permittedOperations: [operation], adapterCapabilities: { fixture: [operation] }, ...overrides.runtime },
    config: { adapters: { fixture: { kind: "synthetic", enabled: true, operations: [operation] } }, ...overrides.config },
    request: { profile, operation, target: operation.includes("tracker") ? "record:tracker-1" : "workspace:docs/file.md", ...overrides.request }
  };
}
function code(result) { return result.issues[0]?.code; }

test("each profile permits its fixed operations with authorized workspace or record targets", () => {
  for (const [profile, operations] of Object.entries(profileOperations)) {
    for (const operation of operations) {
      const target = operation.includes("tracker") || operation === "upsert-allowlisted-record" || operation === "write-reconciliation-report" ? "record:tracker-1" : operation === "run-lifecycle-action" ? "change:example" : "workspace:docs/file.md";
      const request = operation === "run-lifecycle-action"
        ? { target, lifecycleAction: "sync-change" }
        : operation === "objective-correction"
          ? { target, failureSignature: "focused-check", correctionAttemptsForFailureSignature: 0, correctionAttempts: 0 }
          : { target };
      const result = checkOperationAuthorization(input(profile, operation, { request }));
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
  assert.equal(code(checkOperationAuthorization(input("local-implementation", "objective-correction", { request: { failureSignature: "failed-check", correctionAttemptsForFailureSignature: 3, correctionAttempts: 3 } }))), "correction-limit-exhausted");
  assert.equal(code(checkOperationAuthorization(input("local-implementation", "objective-correction", { request: { failureSignature: "fresh-check", correctionAttempts: 3 } }))), "invalid-correction-attempt-count");
  assert.equal(checkOperationAuthorization(input("local-implementation", "objective-correction", { request: { failureSignature: "fresh-check", correctionAttemptsForFailureSignature: 0, correctionAttempts: 3 } })).allowed, true);
  assert.equal(code(checkOperationAuthorization(input("local-implementation", "objective-correction", { request: { failureSignature: "failed-check", correctionAttemptsForFailureSignature: 2, correctionAttempts: 1 } }))), "inconsistent-correction-attempt-count");
  assert.equal(code(checkOperationAuthorization(input("local-implementation", "objective-correction", { authorization: { correctionBudgetPerFailureSignature: 1 }, request: { failureSignature: "failed-check", correctionAttemptsForFailureSignature: 1, correctionAttempts: 1 } }))), "correction-limit-exhausted");
  assert.equal(code(checkOperationAuthorization(input("local-implementation", "objective-correction", { authorization: { correctionBudgetPerFailureSignature: 2 }, request: { failureSignature: "failed-check", correctionAttemptsForFailureSignature: 2, correctionAttempts: 4 } }))), "correction-limit-exhausted");
  assert.equal(code(checkOperationAuthorization(input("local-implementation", "objective-correction", { authorization: { correctionBudgetPerFailureSignature: 0 }, request: { failureSignature: "failed-check", correctionAttemptsForFailureSignature: 0, correctionAttempts: 0 } }))), "invalid-correction-budget");
});

test("sdd high-impact transitions require exact evidence and recovery boundaries", () => {
  for (const lifecycleAction of ["merge-pr", "archive-change", "delete-merged-topic-branch"]) {
    const target = lifecycleAction === "archive-change" ? "change:example" : lifecycleAction === "delete-merged-topic-branch" ? "branch:feature/example" : "pr:42";
    const result = checkOperationAuthorization(input("sdd-delivery", "run-lifecycle-action", { request: { target, lifecycleAction, evidenceCurrent: true, recovery: "restore from durable records" } }));
    assert.equal(result.allowed, true, lifecycleAction);
  }
  assert.equal(code(checkOperationAuthorization(input("local-implementation", "run-lifecycle-action", { request: { lifecycleAction: "merge-pr", evidenceCurrent: true, recovery: "recover" } }))), "operation-not-in-profile");
  assert.equal(code(checkOperationAuthorization(input("sdd-delivery", "run-lifecycle-action", { request: { target: "pr:42", lifecycleAction: "merge-pr", evidenceCurrent: false } }))), "missing-recovery");
  assert.equal(code(checkOperationAuthorization(input("sdd-delivery", "run-lifecycle-action"))), "unnamed-or-unsupported-lifecycle-action");
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
