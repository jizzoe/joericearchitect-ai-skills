import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { evaluateOperationGate, normalizeAgentPolicy, operationRegistry, routeOperationOutcome, validateOperationRegistry, validateReviewReuse } from "../autonomous-sdd-operation-contract.mjs";
import { checkOperationAuthorization } from "../check-operation-authorization.mjs";
import { validateCloseoutReviewReuse } from "../independent-review.mjs";

const authorization = { qualityProfile: "prototype-rapid", expiresAt: "2026-08-22T00:00:00.000Z" };
const sha = "a".repeat(64);
test("registry is complete and rejects unknown or mismatched operations", () => {
  assert.equal(validateOperationRegistry().valid, true);
  assert.equal(validateOperationRegistry([{ ...operationRegistry.apply, profiles: ["unsupported-profile"] }]).valid, false);
  assert.equal(validateOperationRegistry([{ ...operationRegistry.apply, gates: ["authorization", "authorization"] }]).valid, false);
  assert.equal(evaluateOperationGate({ operation: "missing", authorization }).reason, "operation-unknown");
  assert.equal(evaluateOperationGate({ operation: "apply", stage: "planned", targetKind: "change", authorization, claimActive: true, evidenceCurrent: { applyEligibility: true } }).allowed, true);
  assert.equal(evaluateOperationGate({ operation: "apply", stage: "admitted", targetKind: "change", authorization, claimActive: true, evidenceCurrent: { applyEligibility: true } }).reason, "operation-contract-mismatch");
  assert.equal(evaluateOperationGate({ operation: "local-review", stage: "applied", targetKind: "package", authorization, claimActive: true, evidenceCurrent: { current: true }, adapterAvailable: false }).reason, "adapter-unavailable");
  assert.ok(operationRegistry.apply.writeAhead);
});
test("topology is conservative and explicit override is preserved", () => {
  assert.deepEqual(normalizeAgentPolicy(undefined).topology, "multi-agent");
  assert.deepEqual(normalizeAgentPolicy("auto", { complexity: "low" }).topology, "single-agent");
  assert.deepEqual(normalizeAgentPolicy("single-agent", { complexity: "high" }).source, "explicit");
});
test("outcomes and review reuse remain bounded", () => {
  assert.equal(routeOperationOutcome({ operation: "apply", outcome: "objective-failure", failureSignature: "x", correctionAttempts: 0 }).disposition, "objective-correction");
  assert.equal(routeOperationOutcome({ operation: "apply", outcome: "unknown" }).classification, "paused");
  const reusable = { sealedPackageDigest: sha, currentSealedPackageDigest: sha, reviewedHead: "head", currentHead: "head", artifactManifestDigest: sha, currentArtifactManifestDigest: sha, applyEvidenceDigest: sha, currentApplyEvidenceDigest: sha, dispositionsDigest: sha, currentDispositionsDigest: sha, policyGateDigest: sha, currentPolicyGateDigest: sha };
  assert.equal(validateReviewReuse(reusable).reusable, true);
  for (const field of ["currentSealedPackageDigest", "currentHead", "currentArtifactManifestDigest", "currentApplyEvidenceDigest", "currentDispositionsDigest", "currentPolicyGateDigest"]) {
    assert.equal(validateReviewReuse({ ...reusable, [field]: `${reusable[field]}-changed` }).reusable, false, field);
  }
  assert.deepEqual(validateCloseoutReviewReuse(reusable), validateReviewReuse(reusable));
});
test("bounded execution consumes canonical gates and pauses unknown outcomes", () => {
  const permitted = checkOperationAuthorization({ authorization: { ...authorization, allowedMutations: ["read-workspace"], targets: ["workspace:change"] }, runtime: { permission: true }, request: { profile: "sdd-delivery", operation: "read-workspace", target: "workspace:change", operationContract: { operation: "apply", stage: "planned", targetKind: "change", claimActive: true, evidenceCurrent: { applyEligibility: true }, adapterAvailable: true } } });
  assert.equal(permitted.allowed, true);
  const paused = checkOperationAuthorization({ authorization: { ...authorization, allowedMutations: ["read-workspace"], targets: ["workspace:change"] }, runtime: { permission: true }, request: { profile: "sdd-delivery", operation: "read-workspace", target: "workspace:change", operationContract: { operation: "apply", stage: "planned", targetKind: "change", claimActive: true, evidenceCurrent: { applyEligibility: true }, adapterAvailable: true, outcome: "unknown" } } });
  assert.equal(paused.allowed, false);
  assert.match(paused.issues[0].code, /outcome-unknown/);
});
test("equivalent assistant requests and unrelated products use one portable policy", () => {
  const requests = ["claude", "codex"].map(() => ({
    topology: normalizeAgentPolicy("auto", { complexity: "low" }),
    gate: evaluateOperationGate({ operation: "apply", stage: "planned", targetKind: "change", authorization, claimActive: true, evidenceCurrent: { applyEligibility: true } }),
    outcome: routeOperationOutcome({ operation: "apply", outcome: "objective-failure", failureSignature: "fixture-failure" })
  }));
  assert.deepEqual(requests[0], requests[1]);
  const implementation = fs.readFileSync(new URL("../autonomous-sdd-operation-contract.mjs", import.meta.url), "utf8");
  assert.doesNotMatch(implementation, /jizzoe|joericearchitect|github\.com|second-product/);
});
