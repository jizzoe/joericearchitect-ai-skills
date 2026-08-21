import crypto from "node:crypto";

const text = (value) => typeof value === "string" && value.trim().length > 0;
const object = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const digest = /^[0-9a-f]{64}$/i;
const supportedProfiles = new Set(["prototype-rapid", "production-rapid"]);
const supportedGates = new Set(["authorization", "claim", "planning", "apply-eligibility", "review-readiness", "evidence-freshness", "adapter", "runtime-permission"]);

export const compactLifecycleStages = Object.freeze(["admitted", "planned", "evidence-ready", "applied", "reviewed", "verified", "closing", "complete"]);
export const outcomeDispositions = Object.freeze(["continue", "objective-correction", "human-decision", "terminal-failure", "complete"]);

const registry = [
  ["plan-review", "admitted", ["change"], ["prototype-rapid", "production-rapid"], ["authorization", "claim", "planning"]],
  ["apply", "planned", ["change"], ["prototype-rapid", "production-rapid"], ["authorization", "claim", "apply-eligibility", "review-readiness"]],
  ["local-review", "applied", ["package"], ["prototype-rapid"], ["authorization", "claim", "evidence-freshness", "adapter", "runtime-permission"]],
  ["verify", "reviewed", ["change"], ["prototype-rapid", "production-rapid"], ["authorization", "claim", "evidence-freshness"]],
  ["implementation-delivery", "verified", ["pr"], ["prototype-rapid", "production-rapid"], ["authorization", "claim", "evidence-freshness", "adapter", "runtime-permission"]],
  ["sync", "closing", ["sync"], ["prototype-rapid", "production-rapid"], ["authorization", "claim", "evidence-freshness", "adapter", "runtime-permission"]],
  ["archive", "closing", ["change"], ["prototype-rapid", "production-rapid"], ["authorization", "claim", "evidence-freshness", "adapter", "runtime-permission"]],
  ["cleanup", "complete", ["branch", "worktree"], ["prototype-rapid", "production-rapid"], ["authorization", "claim", "evidence-freshness", "runtime-permission"]]
].map(([id, stage, targetKinds, profiles, gates]) => Object.freeze({ id, stage, targetKinds: Object.freeze(targetKinds), profiles: Object.freeze(profiles), gates: Object.freeze(gates), writeAhead: true, adapter: "configured", dispositions: outcomeDispositions }));

export const operationRegistry = Object.freeze(Object.fromEntries(registry.map((entry) => [entry.id, entry])));

export function digestOperationContract(value) {
  const canonical = (item) => Array.isArray(item) ? item.map(canonical) : object(item) ? Object.fromEntries(Object.keys(item).sort().map((key) => [key, canonical(item[key])])) : item;
  return crypto.createHash("sha256").update(JSON.stringify(canonical(value))).digest("hex");
}

export function normalizeAgentPolicy(value, signals) {
  const requested = value ?? "auto";
  if (!["auto", "single-agent", "multi-agent"].includes(requested)) return { valid: false, reason: "agent-policy-invalid" };
  if (requested !== "auto") return { valid: true, policy: requested, topology: requested, source: "explicit", classifier: null };
  const uncertain = !object(signals) || signals.ambiguous === true || signals.risk === "high" || signals.complexity === "high" || signals.hasExternalMutation === true;
  return { valid: true, policy: "auto", topology: uncertain ? "multi-agent" : "single-agent", source: value === undefined ? "profile-default" : "explicit-auto", classifier: Object.freeze({ version: 1, conservative: true, uncertain }) };
}

export function validateOperationRegistry(entries = Object.values(operationRegistry)) {
  if (!Array.isArray(entries) || !entries.length) return { valid: false, reason: "operation-registry-empty" };
  const seen = new Set();
  for (const entry of entries) {
    if (!object(entry) || !text(entry.id) || seen.has(entry.id) || !compactLifecycleStages.includes(entry.stage) || !Array.isArray(entry.targetKinds) || !entry.targetKinds.length || !Array.isArray(entry.profiles) || !entry.profiles.length || !entry.profiles.every((profile) => supportedProfiles.has(profile)) || !Array.isArray(entry.gates) || !entry.gates.length || !entry.gates.every((gate) => supportedGates.has(gate)) || new Set(entry.gates).size !== entry.gates.length || !Array.isArray(entry.dispositions) || entry.dispositions.length !== outcomeDispositions.length || outcomeDispositions.some((value) => !entry.dispositions.includes(value))) return { valid: false, reason: "operation-registry-entry-invalid", operation: entry?.id };
    seen.add(entry.id);
  }
  return { valid: true };
}

export function evaluateOperationGate({ operation, stage, targetKind, authorization, claimActive, evidenceCurrent = {}, adapterAvailable = true, runtimePermitted = true, now = new Date().toISOString() } = {}) {
  const entry = operationRegistry[operation];
  if (!entry) return { allowed: false, classification: "paused", reason: "operation-unknown", disposition: "human-decision" };
  if (!entry.profiles.includes(authorization?.qualityProfile) || entry.stage !== stage || !entry.targetKinds.includes(targetKind)) return { allowed: false, classification: "paused", reason: "operation-contract-mismatch", disposition: "human-decision" };
  if (!text(authorization?.expiresAt) || Date.parse(authorization.expiresAt) <= Date.parse(now)) return { allowed: false, classification: "paused", reason: "authorization-expired", disposition: "human-decision" };
  if (!claimActive) return { allowed: false, classification: "paused", reason: "claim-not-active", disposition: "human-decision" };
  for (const gate of entry.gates) {
    if (["authorization", "claim"].includes(gate)) continue;
    if (gate === "runtime-permission" && !runtimePermitted) return { allowed: false, classification: "paused", reason: "runtime-permission-unavailable", disposition: "human-decision" };
    if (gate === "adapter" && !adapterAvailable) return { allowed: false, classification: "paused", reason: "adapter-unavailable", disposition: "terminal-failure" };
    if (gate === "evidence-freshness" && evidenceCurrent.current !== true) return { allowed: false, classification: "paused", reason: "evidence-not-current", disposition: "human-decision" };
    if (gate === "planning" && evidenceCurrent.planning !== true) return { allowed: false, classification: "paused", reason: "planning-not-ready", disposition: "human-decision" };
    if (gate === "apply-eligibility" && evidenceCurrent.applyEligibility !== true) return { allowed: false, classification: "paused", reason: "apply-not-ready", disposition: "human-decision" };
    if (gate === "review-readiness" && authorization.qualityProfile === "production-rapid" && evidenceCurrent.reviewReady !== true) return { allowed: false, classification: "paused", reason: "review-not-ready", disposition: "human-decision" };
  }
  return { allowed: true, classification: "ready", operation: entry, gateDigest: digestOperationContract({ operation, stage, targetKind, authorizationDigest: digestOperationContract(authorization), evidenceCurrent }) };
}

export function routeOperationOutcome({ operation, outcome, failureSignature, correctionAttempts = 0, correctionBudget = 3 } = {}) {
  if (!operationRegistry[operation] || !text(outcome)) return { classification: "paused", disposition: "human-decision", reason: "outcome-unknown" };
  const dispositions = { succeeded: "continue", complete: "complete", "objective-failure": "objective-correction", "human-decision": "human-decision", "terminal-failure": "terminal-failure" };
  const disposition = dispositions[outcome];
  if (!disposition) return { classification: "paused", disposition: "human-decision", reason: "outcome-unknown" };
  if (disposition === "objective-correction" && (!text(failureSignature) || correctionAttempts >= correctionBudget)) return { classification: "paused", disposition: "human-decision", reason: "correction-not-eligible" };
  return { classification: disposition === "continue" || disposition === "complete" ? "completed" : disposition === "objective-correction" ? "correct" : "paused", disposition, ...(failureSignature ? { failureSignature } : {}) };
}

export function validateReviewReuse({ sealedPackageDigest, currentSealedPackageDigest, reviewedHead, currentHead, artifactManifestDigest, currentArtifactManifestDigest, applyEvidenceDigest, currentApplyEvidenceDigest, dispositionsDigest, currentDispositionsDigest, policyGateDigest, currentPolicyGateDigest } = {}) {
  if (![sealedPackageDigest, artifactManifestDigest, applyEvidenceDigest, dispositionsDigest, policyGateDigest].every((value) => digest.test(value ?? "")) || !text(reviewedHead) || !text(currentHead)) return { valid: false, reason: "review-reuse-input-invalid" };
  const matches = sealedPackageDigest === currentSealedPackageDigest && reviewedHead === currentHead && artifactManifestDigest === currentArtifactManifestDigest && applyEvidenceDigest === currentApplyEvidenceDigest && dispositionsDigest === currentDispositionsDigest && policyGateDigest === currentPolicyGateDigest;
  return matches ? { valid: true, reusable: true } : { valid: true, reusable: false, reason: "review-reuse-invalidated" };
}
