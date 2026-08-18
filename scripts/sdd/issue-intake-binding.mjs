import crypto from "node:crypto";

const text = (value) => typeof value === "string" && value.trim().length > 0;
const digest = (value) => typeof value === "string" && /^[0-9a-f]{64}$/.test(value);
const repository = (value) => typeof value === "string" && /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(value);
const timestamp = (value) => text(value) && !Number.isNaN(Date.parse(value));
const canonical = (value) => {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
  }
  return value;
};
const fail = (code, recoveryReference) => ({
  allowed: false,
  classification: "paused",
  promptRequired: false,
  issues: [{ code }],
  recoveryReference
});

function normalizedLabels(labels) {
  if (!Array.isArray(labels) || labels.some((label) => !text(label))) return null;
  return [...new Set(labels.map((label) => label.trim()))].sort();
}

export function canonicalIssueIntakePayload({ repository: targetRepository, title, body, labels = [], managedBlock } = {}) {
  const normalized = normalizedLabels(labels);
  if (!repository(targetRepository) || !text(title) || typeof body !== "string" || !text(managedBlock) ||
      !body.includes(managedBlock) || !normalized) return null;
  return Object.freeze({
    repository: targetRepository,
    title,
    body: body.replaceAll("\r\n", "\n"),
    labels: Object.freeze(normalized),
    managedBlock: managedBlock.replaceAll("\r\n", "\n")
  });
}

export function issueIntakePayloadDigest(payload) {
  const normalized = canonicalIssueIntakePayload(payload);
  if (!normalized) return null;
  return crypto.createHash("sha256").update(JSON.stringify(canonical(normalized))).digest("hex");
}

export function validateIssueIntakeBinding(binding) {
  if (!binding || binding.schemaVersion !== 1 || !text(binding.selectedEntry) ||
      !repository(binding.repository) || !text(binding.title) || !Array.isArray(binding.labels) ||
      !normalizedLabels(binding.labels) || JSON.stringify(binding.labels) !== JSON.stringify(normalizedLabels(binding.labels)) ||
      !text(binding.managedBlock) || !digest(binding.payloadDigest) ||
      binding.operation !== "issue-create-or-reuse" || !timestamp(binding.expiresAt) ||
      !text(binding.ownershipReference) || !text(binding.recoveryReference)) return false;
  return true;
}

export function createIssueIntakeBinding({ selectedEntry, payload, operation = "issue-create-or-reuse", expiresAt,
  ownershipReference = "selected-entry-controller", recoveryReference = "reconcile exact title before create-or-reuse" } = {}) {
  const normalized = canonicalIssueIntakePayload(payload);
  const payloadDigest = normalized && issueIntakePayloadDigest(normalized);
  const binding = normalized && {
    schemaVersion: 1,
    selectedEntry,
    repository: normalized.repository,
    title: normalized.title,
    labels: [...normalized.labels],
    managedBlock: normalized.managedBlock,
    payloadDigest,
    operation,
    expiresAt,
    ownershipReference,
    recoveryReference
  };
  return validateIssueIntakeBinding(binding)
    ? { valid: true, binding, payload: normalized }
    : { valid: false, reason: "issue-intake-binding-invalid" };
}

export function authorizeBoundIssueIntake({ binding, selectedEntry, payload, runtime = {}, now = new Date().toISOString() } = {}) {
  const recovery = binding?.recoveryReference ?? "rebuild and review the exact issue-intake binding";
  if (!validateIssueIntakeBinding(binding)) return fail("issue-intake-binding-invalid", recovery);
  if (binding.selectedEntry !== selectedEntry) return fail("issue-intake-selected-entry-mismatch", recovery);
  if (!timestamp(now)) return fail("issue-intake-clock-invalid", recovery);
  if (Date.parse(binding.expiresAt) <= Date.parse(now)) return fail("issue-intake-binding-expired", recovery);
  const normalized = canonicalIssueIntakePayload(payload);
  if (!normalized || binding.repository !== normalized.repository || binding.title !== normalized.title ||
      JSON.stringify(binding.labels) !== JSON.stringify(normalized.labels) || binding.managedBlock !== normalized.managedBlock ||
      binding.payloadDigest !== issueIntakePayloadDigest(normalized)) return fail("issue-intake-payload-mismatch", recovery);
  if (runtime.permissionGaps?.length || !runtime.permittedOperations?.includes("issue-create-or-update")) {
    return fail("runtime-permission-gap", recovery);
  }
  return {
    allowed: true,
    classification: "authorized",
    promptRequired: false,
    payloadDigest: binding.payloadDigest,
    recoveryReference: binding.recoveryReference,
    issues: []
  };
}

export function bindIssueIntakeEvidence(binding, issue, { observedAt = new Date().toISOString(), reference = "configured issue create-or-reuse" } = {}) {
  if (!validateIssueIntakeBinding(binding) || !Number.isInteger(issue?.number) || issue.number <= 0 ||
      !text(issue?.url) || !["OPEN", "CLOSED"].includes(issue?.state) || !timestamp(observedAt)) {
    return { valid: false, reason: "issue-intake-evidence-invalid" };
  }
  const labels = normalizedLabels(issue.labels ?? []);
  if (!labels) return { valid: false, reason: "issue-intake-evidence-invalid" };
  return {
    valid: true,
    evidence: {
      current: true,
      payloadDigest: binding.payloadDigest,
      number: issue.number,
      url: issue.url,
      state: issue.state,
      labels,
      observedAt,
      reference
    }
  };
}
