import crypto from "node:crypto";

import {
  githubAuthProbeCommandKinds,
  validateGithubAuthProbeEvidence
} from "../github/lib/auth-context.mjs";

export const githubAuthContextClassifications = Object.freeze([
  "authenticated",
  "credential-unavailable-in-restricted-runtime",
  "credential-invalid-or-expired",
  "host-permission-denied",
  "auth-state-unknown"
]);

const text = (value) => typeof value === "string" && value.trim().length > 0;
const timestamp = (value) => text(value) && !Number.isNaN(Date.parse(value));
const repository = (value) => {
  if (typeof value !== "string" || !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(value)) return false;
  const [owner, name] = value.split("/");
  return owner !== "." && owner !== ".." && name !== "." && name !== "..";
};
const operation = (value) => typeof value === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
const digest = (value) => typeof value === "string" && /^[0-9a-f]{64}$/i.test(value);
const canonical = (value) => {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
  return value;
};
const clone = (value) => structuredClone(value);

export function authContextBindingDigest(binding) {
  return crypto.createHash("sha256").update(JSON.stringify(canonical(binding))).digest("hex");
}

export function validateGithubAuthContextBinding(binding) {
  if (!binding || binding.schemaVersion !== 1 || !text(binding.selectedEntry) || !operation(binding.operation) ||
      !repository(binding.repository) || !githubAuthProbeCommandKinds.includes(binding.commandKind) ||
      !timestamp(binding.expiresAt) || !text(binding.recoveryReference)) return false;
  if (binding.payloadDigest !== undefined && !digest(binding.payloadDigest)) return false;
  if (binding.commandKind === "repository-read" && binding.probeRepository !== binding.repository) return false;
  if (binding.commandKind === "github-api-user" && binding.probeRepository !== undefined) return false;
  return Object.keys(binding).every((key) => ["schemaVersion", "selectedEntry", "operation", "repository", "payloadDigest", "commandKind", "probeRepository", "expiresAt", "recoveryReference"].includes(key));
}

export function createGithubAuthContextBinding({ selectedEntry, operation: operationName, repository: targetRepository, payloadDigest,
  commandKind = "github-api-user", expiresAt, recoveryReference = "rerun the exact read-only probe through the active runtime permission boundary" } = {}) {
  const binding = {
    schemaVersion: 1,
    selectedEntry,
    operation: operationName,
    repository: targetRepository,
    ...(payloadDigest !== undefined ? { payloadDigest } : {}),
    commandKind,
    ...(commandKind === "repository-read" ? { probeRepository: targetRepository } : {}),
    expiresAt,
    recoveryReference
  };
  return validateGithubAuthContextBinding(binding)
    ? { valid: true, binding, bindingDigest: authContextBindingDigest(binding) }
    : { valid: false, reason: "github-auth-context-binding-invalid" };
}

function matchesBinding(probe, binding, contextType) {
  return validateGithubAuthProbeEvidence(probe) && probe.contextType === contextType && probe.commandKind === binding.commandKind &&
    (binding.commandKind !== "repository-read" || probe.repository === binding.repository);
}

function terminalEvidence({ binding, classification, restrictedProbe, hostProbe, observedAt = new Date().toISOString() } = {}) {
  if (!validateGithubAuthContextBinding(binding) || !githubAuthContextClassifications.includes(classification) ||
      !matchesBinding(restrictedProbe, binding, "restricted") || !timestamp(observedAt) ||
      (hostProbe !== undefined && !matchesBinding(hostProbe, binding, "host"))) {
    return { valid: false, reason: "github-auth-context-evidence-invalid" };
  }
  const evidence = {
    schemaVersion: 1,
    current: true,
    binding: clone(binding),
    bindingDigest: authContextBindingDigest(binding),
    classification,
    restrictedProbe: clone(restrictedProbe),
    ...(hostProbe ? { hostProbe: clone(hostProbe) } : {}),
    observedAt,
    recoveryReference: binding.recoveryReference
  };
  return validateGithubAuthContextEvidence(evidence)
    ? { valid: true, evidence }
    : { valid: false, reason: "github-auth-context-evidence-invalid" };
}

export function evaluateGithubAuthContextContrast({ binding, restrictedProbe, hostProbe, hostPermission = "not-requested", observedAt } = {}) {
  if (!validateGithubAuthContextBinding(binding) || !matchesBinding(restrictedProbe, binding, "restricted")) {
    return { valid: false, reason: "github-auth-context-contrast-input-invalid" };
  }
  if (Date.parse(binding.expiresAt) <= Date.parse(observedAt ?? new Date().toISOString())) {
    return { valid: false, reason: "github-auth-context-binding-expired" };
  }
  if (restrictedProbe.state === "success") {
    return terminalEvidence({ binding, classification: "authenticated", restrictedProbe, observedAt });
  }
  if (restrictedProbe.state !== "authentication-shaped") {
    return terminalEvidence({ binding, classification: "auth-state-unknown", restrictedProbe, observedAt });
  }
  if (hostPermission === "denied") {
    return terminalEvidence({ binding, classification: "host-permission-denied", restrictedProbe, observedAt });
  }
  if (hostPermission !== "granted") {
    return {
      valid: true,
      classification: "host-retry-required",
      hostRetry: { binding: clone(binding), bindingDigest: authContextBindingDigest(binding), commandKind: binding.commandKind, recoveryReference: binding.recoveryReference }
    };
  }
  if (!matchesBinding(hostProbe, binding, "host")) return { valid: false, reason: "github-auth-context-host-probe-mismatch" };
  if (hostProbe.state === "success") {
    return terminalEvidence({ binding, classification: "credential-unavailable-in-restricted-runtime", restrictedProbe, hostProbe, observedAt });
  }
  if (hostProbe.state === "authentication-shaped") {
    return terminalEvidence({ binding, classification: "credential-invalid-or-expired", restrictedProbe, hostProbe, observedAt });
  }
  return terminalEvidence({ binding, classification: "auth-state-unknown", restrictedProbe, hostProbe, observedAt });
}

export function validateGithubAuthContextEvidence(evidence) {
  if (!evidence || evidence.schemaVersion !== 1 || evidence.current !== true || !validateGithubAuthContextBinding(evidence.binding) ||
      evidence.bindingDigest !== authContextBindingDigest(evidence.binding) || !githubAuthContextClassifications.includes(evidence.classification) ||
      !matchesBinding(evidence.restrictedProbe, evidence.binding, "restricted") || !timestamp(evidence.observedAt) ||
      evidence.recoveryReference !== evidence.binding.recoveryReference) return false;
  if (evidence.hostProbe !== undefined && !matchesBinding(evidence.hostProbe, evidence.binding, "host")) return false;
  if (evidence.classification === "authenticated" && evidence.restrictedProbe.state !== "success") return false;
  if (evidence.classification === "credential-unavailable-in-restricted-runtime" &&
      !(evidence.restrictedProbe.state === "authentication-shaped" && evidence.hostProbe?.state === "success")) return false;
  if (evidence.classification === "credential-invalid-or-expired" &&
      !(evidence.restrictedProbe.state === "authentication-shaped" && evidence.hostProbe?.state === "authentication-shaped")) return false;
  if (evidence.classification === "host-permission-denied" && evidence.restrictedProbe.state !== "authentication-shaped") return false;
  return Object.keys(evidence).every((key) => ["schemaVersion", "current", "binding", "bindingDigest", "classification", "restrictedProbe", "hostProbe", "observedAt", "recoveryReference"].includes(key));
}

export function authorizeGithubAuthContextEvidence({ evidence, selectedEntry, operation: operationName, repository: targetRepository, payloadDigest,
  executionContext = "restricted", now = new Date().toISOString() } = {}) {
  if (!validateGithubAuthContextEvidence(evidence) || !timestamp(now) || Date.parse(evidence.binding.expiresAt) <= Date.parse(now)) {
    return { allowed: false, classification: "paused", reason: "github-auth-context-evidence-invalid-or-expired" };
  }
  const binding = evidence.binding;
  if (binding.selectedEntry !== selectedEntry || binding.operation !== operationName || binding.repository !== targetRepository ||
      binding.payloadDigest !== payloadDigest) {
    return { allowed: false, classification: "paused", reason: "github-auth-context-evidence-mismatch" };
  }
  const currentAuthenticated = evidence.classification === "authenticated" && executionContext === "restricted";
  const hostContrastAuthenticated = evidence.classification === "credential-unavailable-in-restricted-runtime" &&
    executionContext === "host" && evidence.hostProbe?.state === "success";
  if (!currentAuthenticated && !hostContrastAuthenticated) {
    return { allowed: false, classification: "paused", reason: `github-auth-context-${evidence.classification}` };
  }
  return { allowed: true, classification: "authorized", bindingDigest: evidence.bindingDigest, recoveryReference: evidence.recoveryReference };
}
