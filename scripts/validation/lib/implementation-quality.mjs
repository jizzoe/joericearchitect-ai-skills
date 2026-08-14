import path from "node:path";

import { checkOperationAuthorization } from "../../sdd/check-operation-authorization.mjs";
import { validateSkillResult } from "../validate-base-skill-contracts.mjs";

export const reviewSeverities = ["blocker", "high", "medium", "low"];
export const reviewDispositions = ["objective-fix", "human-decision", "warning", "false-positive"];
export const deliveryProfiles = ["prototype-rapid", "production-rapid"];
export const verificationStages = [
  "bind-inputs",
  "identify-critical-path",
  "select-checks",
  "implement-approved-scope",
  "run-focused-checks",
  "run-profile-checks",
  "run-local-review",
  "apply-objective-corrections",
  "emit-readiness"
];

const coverageStatuses = new Set(["reviewed", "gap", "not-applicable"]);
const checkResults = new Set(["passed", "failed", "not-applicable", "pending"]);
const readinessStates = new Set(["needs-implementation", "paused", "blocked", "ready-for-openspec-verify"]);
const resultStatusesByReadiness = {
  "needs-implementation": new Set(["completed"]),
  paused: new Set(["paused"]),
  blocked: new Set(["blocked"]),
  "ready-for-openspec-verify": new Set(["completed", "no-op"])
};
const checkCategories = new Set([
  "focused",
  "critical-flow",
  "regression",
  "browser",
  "device",
  "repeatability",
  "operational",
  "release",
  "accessibility",
  "review",
  "ci",
  "independent-review"
]);
const secretKey = /^(?:password|secret|token|credential|api[_-]?key|authorization|otp|mfa|private[_-]?key|pii|personal[_-]?data)$/i;
const secretValue = /(?:gh[pousr]_[A-Za-z0-9]{20,}|Bearer\s+\S+|AKIA[A-Z0-9]{16}|-----BEGIN [A-Z ]*PRIVATE KEY-----)/;

function issue(code, subject, detail) {
  return { code, subject, ...(detail === undefined ? {} : { detail }) };
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function nonEmpty(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function workspacePath(value) {
  return nonEmpty(value) && !path.isAbsolute(value) && !/^[A-Za-z]:[\\/]/.test(value) && !value.split(/[\\/]/).includes("..");
}

function exactKeys(value, allowed, subject, issues) {
  if (!isObject(value)) {
    issues.push(issue("invalid-object", subject));
    return false;
  }
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) issues.push(issue("unknown-key", `${subject}.${key}`));
  }
  return true;
}

function required(value, keys, subject, issues) {
  if (!isObject(value)) return;
  for (const key of keys) {
    if (!(key in value)) issues.push(issue("missing-required", `${subject}.${key}`));
  }
}

function validateStringArray(value, subject, issues, { paths = false, nonEmptyArray = false } = {}) {
  if (!Array.isArray(value)) {
    issues.push(issue("invalid-array", subject));
    return;
  }
  if (nonEmptyArray && value.length === 0) issues.push(issue("empty-array", subject));
  value.forEach((item, index) => {
    if (!nonEmpty(item)) issues.push(issue("invalid-string", `${subject}[${index}]`));
    else if (paths && !workspacePath(item)) issues.push(issue("unsafe-workspace-path", `${subject}[${index}]`));
  });
}

function scanSensitive(value, subject, issues, seen = new Set()) {
  if (value === null || typeof value !== "object") {
    if (typeof value === "string" && secretValue.test(value)) issues.push(issue("sensitive-value", subject));
    return;
  }
  if (seen.has(value)) return;
  seen.add(value);
  if (Array.isArray(value)) {
    value.forEach((item, index) => scanSensitive(item, `${subject}[${index}]`, issues, seen));
    return;
  }
  for (const [key, item] of Object.entries(value)) {
    if (secretKey.test(key)) issues.push(issue("sensitive-key", `${subject}.${key}`));
    scanSensitive(item, `${subject}.${key}`, issues, seen);
  }
}

function validateEvidenceReferences(ids, subject, evidenceById, issues, { nonEmptyArray = false } = {}) {
  validateStringArray(ids, subject, issues, { nonEmptyArray });
  if (!Array.isArray(ids)) return;
  const uniqueIds = new Set();
  for (const [index, id] of ids.entries()) {
    if (uniqueIds.has(id)) issues.push(issue("duplicate-evidence-reference", `${subject}[${index}]`, id));
    uniqueIds.add(id);
    if (nonEmpty(id) && !evidenceById.has(id)) issues.push(issue("unknown-evidence-reference", subject, id));
  }
}

function validateFinding(finding, index, evidenceById, issues, { subjectRoot = "result.details.findings", allowResolution = false } = {}) {
  const subject = `${subjectRoot}[${index}]`;
  const keys = new Set(["id", "severity", "disposition", "subject", "evidenceIds", "impact", "recommendation", ...(allowResolution ? ["resolution"] : [])]);
  if (!exactKeys(finding, keys, subject, issues)) return;
  required(finding, ["id", "severity", "disposition", "subject", "evidenceIds", "impact", "recommendation", ...(allowResolution ? ["resolution"] : [])], subject, issues);
  if (!nonEmpty(finding.id)) issues.push(issue("invalid-finding-id", `${subject}.id`));
  if (!reviewSeverities.includes(finding.severity)) issues.push(issue("invalid-finding-severity", `${subject}.severity`));
  if (!reviewDispositions.includes(finding.disposition)) issues.push(issue("invalid-finding-disposition", `${subject}.disposition`));
  if (!workspacePath(finding.subject)) issues.push(issue("unsafe-workspace-path", `${subject}.subject`));
  validateEvidenceReferences(finding.evidenceIds, `${subject}.evidenceIds`, evidenceById, issues, { nonEmptyArray: true });
  if (!nonEmpty(finding.impact)) issues.push(issue("invalid-finding-impact", `${subject}.impact`));
  if (!nonEmpty(finding.recommendation)) issues.push(issue("invalid-finding-recommendation", `${subject}.recommendation`));
}

export function sortReviewFindings(findings = []) {
  const rank = new Map(reviewSeverities.map((severity, index) => [severity, index]));
  return [...findings].sort((left, right) => {
    const severity = (rank.get(left.severity) ?? reviewSeverities.length) - (rank.get(right.severity) ?? reviewSeverities.length);
    if (severity !== 0) return severity;
    const subject = String(left.subject ?? "").localeCompare(String(right.subject ?? ""));
    return subject !== 0 ? subject : String(left.id ?? "").localeCompare(String(right.id ?? ""));
  });
}

function validateReviewDetails(result, issues) {
  const details = result.details;
  const subject = "result.details";
  const keys = new Set(["reviewedScope", "findings", "coverage", "evidenceGaps", "scopeSummary"]);
  if (!exactKeys(details, keys, subject, issues)) return;
  required(details, [...keys], subject, issues);
  const evidenceById = new Map((result.evidence ?? []).map((item) => [item.id, item]));

  if (exactKeys(details.reviewedScope, new Set(["targets", "contextPaths", "evidenceIds"]), `${subject}.reviewedScope`, issues)) {
    required(details.reviewedScope, ["targets", "contextPaths", "evidenceIds"], `${subject}.reviewedScope`, issues);
    validateStringArray(details.reviewedScope.targets, `${subject}.reviewedScope.targets`, issues, { paths: true, nonEmptyArray: true });
    validateStringArray(details.reviewedScope.contextPaths, `${subject}.reviewedScope.contextPaths`, issues, { paths: true });
    validateEvidenceReferences(details.reviewedScope.evidenceIds, `${subject}.reviewedScope.evidenceIds`, evidenceById, issues);
  }

  if (!Array.isArray(details.findings)) issues.push(issue("invalid-array", `${subject}.findings`));
  else {
    const ids = new Set();
    details.findings.forEach((finding, index) => {
      validateFinding(finding, index, evidenceById, issues);
      if (nonEmpty(finding?.id) && ids.has(finding.id)) issues.push(issue("duplicate-finding-id", `${subject}.findings[${index}].id`));
      ids.add(finding?.id);
    });
    const sorted = sortReviewFindings(details.findings);
    if (details.findings.some((finding, index) => finding !== sorted[index])) issues.push(issue("findings-not-deterministically-ordered", `${subject}.findings`));
  }

  if (!Array.isArray(details.coverage)) issues.push(issue("invalid-array", `${subject}.coverage`));
  else details.coverage.forEach((entry, index) => {
    const itemSubject = `${subject}.coverage[${index}]`;
    if (!exactKeys(entry, new Set(["area", "status", "evidenceIds"]), itemSubject, issues)) return;
    required(entry, ["area", "status", "evidenceIds"], itemSubject, issues);
    if (!nonEmpty(entry.area)) issues.push(issue("invalid-coverage-area", `${itemSubject}.area`));
    if (!coverageStatuses.has(entry.status)) issues.push(issue("invalid-coverage-status", `${itemSubject}.status`));
    validateEvidenceReferences(entry.evidenceIds, `${itemSubject}.evidenceIds`, evidenceById, issues);
  });

  if (!Array.isArray(details.evidenceGaps)) issues.push(issue("invalid-array", `${subject}.evidenceGaps`));
  else details.evidenceGaps.forEach((gap, index) => {
    const itemSubject = `${subject}.evidenceGaps[${index}]`;
    if (!exactKeys(gap, new Set(["id", "subject", "reason"]), itemSubject, issues)) return;
    required(gap, ["id", "subject", "reason"], itemSubject, issues);
    for (const key of ["id", "subject", "reason"]) if (!nonEmpty(gap[key])) issues.push(issue("invalid-evidence-gap", `${itemSubject}.${key}`));
  });
  if (!nonEmpty(details.scopeSummary)) issues.push(issue("invalid-scope-summary", `${subject}.scopeSummary`));
}

function validateCheck(check, index, evidenceById, issues) {
  const subject = `result.details.selectedChecks[${index}]`;
  if (!exactKeys(check, new Set(["id", "category", "required", "result", "evidenceId", "applicabilityReason"]), subject, issues)) return;
  required(check, ["id", "category", "required", "result"], subject, issues);
  if (!nonEmpty(check.id)) issues.push(issue("invalid-check-id", `${subject}.id`));
  if (!checkCategories.has(check.category)) issues.push(issue("invalid-check-category", `${subject}.category`));
  if (typeof check.required !== "boolean") issues.push(issue("invalid-check-required", `${subject}.required`));
  if (!checkResults.has(check.result)) issues.push(issue("invalid-check-result", `${subject}.result`));
  if (check.result === "not-applicable") {
    if (!nonEmpty(check.applicabilityReason)) issues.push(issue("missing-applicability-reason", `${subject}.applicabilityReason`));
  } else if ("applicabilityReason" in check) {
    issues.push(issue("unexpected-applicability-reason", `${subject}.applicabilityReason`));
  }
  if (check.result !== "pending") {
    if (!nonEmpty(check.evidenceId)) issues.push(issue("missing-check-evidence", `${subject}.evidenceId`));
    else if (!evidenceById.has(check.evidenceId)) issues.push(issue("unknown-evidence-reference", `${subject}.evidenceId`, check.evidenceId));
    else {
      const evidence = evidenceById.get(check.evidenceId);
      if (check.result !== evidence.result) issues.push(issue("check-evidence-result-mismatch", `${subject}.result`, check.evidenceId));
    }
  }
}

function correctionEvidenceMatches(attempt, evidenceById) {
  const evidence = (attempt?.evidenceIds ?? []).map((evidenceId) => evidenceById.get(evidenceId)).filter(Boolean);
  if (evidence.length !== (attempt?.evidenceIds?.length ?? 0)) return false;
  return attempt?.result === "passed"
    ? evidence.every((item) => item.result === "passed")
    : attempt?.result === "failed" && evidence.some((item) => item.result === "failed");
}

function validateLocalFindingResolution(finding, index, correctionAttempts, evidenceById, issues) {
  const subject = `result.details.localReviewFindings[${index}].resolution`;
  const resolution = finding?.resolution;
  if (!exactKeys(resolution, new Set(["status", "correctionFailureSignature", "evidenceIds"]), subject, issues)) return { blocking: true };
  required(resolution, ["status", "correctionFailureSignature", "evidenceIds"], subject, issues);
  const statuses = new Set(["unresolved", "corrected", "accepted-warning", "false-positive"]);
  if (!statuses.has(resolution.status)) issues.push(issue("invalid-finding-resolution", `${subject}.status`));
  validateStringArray(resolution.evidenceIds, `${subject}.evidenceIds`, issues, { nonEmptyArray: resolution.status !== "unresolved" });
  if (Array.isArray(resolution.evidenceIds) && new Set(resolution.evidenceIds).size !== resolution.evidenceIds.length) {
    issues.push(issue("duplicate-evidence-reference", `${subject}.evidenceIds`));
  }

  if (resolution.status === "corrected") {
    if (!nonEmpty(resolution.correctionFailureSignature)) issues.push(issue("missing-finding-correction-signature", `${subject}.correctionFailureSignature`));
    const matching = correctionAttempts.filter((attempt) => attempt.failureSignature === resolution.correctionFailureSignature);
    const latest = matching.at(-1);
    if (!latest || latest.result !== "passed" || !correctionEvidenceMatches(latest, evidenceById)) issues.push(issue("finding-correction-not-passed", subject, finding?.id));
    else if (!sameStringSet(resolution.evidenceIds, latest.evidenceIds)) issues.push(issue("finding-correction-evidence-mismatch", `${subject}.evidenceIds`, finding?.id));
  } else if (resolution.correctionFailureSignature !== null) {
    issues.push(issue("unexpected-finding-correction-signature", `${subject}.correctionFailureSignature`));
  }

  const allowedByDisposition = {
    "objective-fix": new Set(["unresolved", "corrected"]),
    "human-decision": new Set(["unresolved"]),
    warning: new Set(["accepted-warning"]),
    "false-positive": new Set(["false-positive"])
  };
  if (!allowedByDisposition[finding?.disposition]?.has(resolution.status)) {
    issues.push(issue("finding-resolution-disposition-mismatch", `${subject}.status`, finding?.disposition));
  }
  const materiallySevere = new Set(["blocker", "high"]).has(finding?.severity);
  const blocking = resolution.status === "unresolved" || (materiallySevere && resolution.status !== "corrected" && resolution.status !== "false-positive");
  return { blocking };
}

function validateBinding(binding, subject, issues) {
  if (!exactKeys(binding, new Set(["kind", "value"]), subject, issues)) return;
  required(binding, ["kind", "value"], subject, issues);
  if (!new Set(["workspace", "commit"]).has(binding.kind)) issues.push(issue("invalid-binding-kind", `${subject}.kind`));
  if (!nonEmpty(binding.value)) issues.push(issue("invalid-binding-value", `${subject}.value`));
  if (binding.kind === "commit" && !/^(?:[0-9a-f]{40}|[0-9a-f]{64})$/.test(binding.value ?? "")) issues.push(issue("noncanonical-commit-binding", `${subject}.value`));
}

function sameStringArray(left, right) {
  return Array.isArray(left) && Array.isArray(right) && left.length === right.length && left.every((item, index) => item === right[index]);
}

function sameStringSet(left, right) {
  return Array.isArray(left) && Array.isArray(right)
    && new Set(left).size === left.length
    && new Set(right).size === right.length
    && left.length === right.length
    && left.every((item) => right.includes(item));
}

function validateUiScope(value, subject, issues) {
  if (!exactKeys(value, new Set(["kind", "layoutChanged", "materiallyChanged"]), subject, issues)) return;
  required(value, ["kind", "layoutChanged", "materiallyChanged"], subject, issues);
  if (!new Set(["none", "web"]).has(value.kind)) issues.push(issue("invalid-ui-scope-kind", `${subject}.kind`));
  if (typeof value.layoutChanged !== "boolean") issues.push(issue("invalid-ui-layout-change", `${subject}.layoutChanged`));
  if (typeof value.materiallyChanged !== "boolean") issues.push(issue("invalid-ui-material-change", `${subject}.materiallyChanged`));
  if (value.kind === "none" && (value.layoutChanged === true || value.materiallyChanged === true)) issues.push(issue("non-ui-scope-has-ui-changes", subject));
}

function requiredProfileChecks(details) {
  const checks = [
    ["focused-unit-or-integration", "focused"],
    ["critical-flow", "critical-flow"],
    ["local-review", "review"]
  ];
  if (details.profile === "production-rapid") checks.push(
    ["regression-coverage", "regression"],
    ["repeatability", "repeatability"],
    ["operational-checks", "operational"],
    ["release-evidence", "release"],
    ["exact-head-ci", "ci"],
    ["strict-independent-review", "independent-review"]
  );
  if (details.uiScope?.kind === "web") {
    checks.push(
      ["chromium-desktop-1440x900", "browser"],
      ["chromium-mobile-web-390x844", "device"],
      ["critical-ui-interaction", "browser"]
    );
    if (details.uiScope.layoutChanged === true) checks.push(
      ["desktop-current-screenshot", "browser"],
      ["mobile-current-screenshot", "browser"]
    );
    if (details.uiScope.materiallyChanged === true) checks.push(
      ["axe-core", "accessibility"],
      ["manual-keyboard-semantics", "accessibility"]
    );
  }
  return checks;
}

function validateEvidenceBindings(entries, details, evidenceById, issues) {
  const subject = "result.details.evidenceBindings";
  const byId = new Map();
  if (!Array.isArray(entries)) {
    issues.push(issue("invalid-array", subject));
    return byId;
  }
  entries.forEach((entry, index) => {
    const itemSubject = `${subject}[${index}]`;
    if (!exactKeys(entry, new Set(["evidenceId", "binding", "changedPaths"]), itemSubject, issues)) return;
    required(entry, ["evidenceId", "binding", "changedPaths"], itemSubject, issues);
    if (!nonEmpty(entry.evidenceId) || !evidenceById.has(entry.evidenceId)) issues.push(issue("unknown-evidence-reference", `${itemSubject}.evidenceId`, entry.evidenceId));
    if (byId.has(entry.evidenceId)) issues.push(issue("duplicate-evidence-binding", `${itemSubject}.evidenceId`, entry.evidenceId));
    validateBinding(entry.binding, `${itemSubject}.binding`, issues);
    validateStringArray(entry.changedPaths, `${itemSubject}.changedPaths`, issues, { paths: true, nonEmptyArray: true });
    byId.set(entry.evidenceId, entry);
  });
  return byId;
}

function evidenceIsCurrent(evidenceId, bindings, details) {
  const record = bindings.get(evidenceId);
  return record?.binding?.kind === details.binding?.kind &&
    record.binding.value === details.binding?.value &&
    sameStringArray(record.changedPaths, details.changedPaths);
}

function validateProductionGate(gate, details, evidenceById, issues) {
  const subject = "result.details.productionGate";
  const keys = new Set(["head", "ciEvidenceId", "ciHead", "ciSource", "independentReviewEvidenceId", "reviewStatus", "reviewHead", "reviewerSession", "implementerSession", "source", "assurance"]);
  if (!exactKeys(gate, keys, subject, issues)) return { valid: false, ready: false };
  required(gate, [...keys], subject, issues);
  let valid = true;
  const fail = (code, field, detail) => { valid = false; issues.push(issue(code, `${subject}.${field}`, detail)); };
  if (!/^(?:[0-9a-f]{40}|[0-9a-f]{64})$/.test(gate.head ?? "")) fail("noncanonical-production-head", "head");
  if (gate.head !== details.binding?.value || gate.reviewHead !== gate.head) fail("production-head-mismatch", "reviewHead");
  if (!new Set(["passed", "failed", "unavailable"]).has(gate.reviewStatus)) fail("invalid-review-status", "reviewStatus");
  if (gate.source !== "isolated-independent-review") fail("invalid-review-source", "source");
  if (gate.assurance !== "strict-isolated") fail("strict-review-required", "assurance");
  if (!nonEmpty(gate.reviewerSession) || !nonEmpty(gate.implementerSession) || gate.reviewerSession === gate.implementerSession) fail("reviewer-not-independent", "reviewerSession");
  const ci = evidenceById.get(gate.ciEvidenceId);
  if (!ci || ci.type !== "validation") fail("ci-evidence-missing", "ciEvidenceId");
  if (gate.ciSource !== "exact-head-ci") fail("invalid-ci-source", "ciSource");
  if (gate.ciHead !== gate.head) fail("ci-head-mismatch", "ciHead");
  const review = evidenceById.get(gate.independentReviewEvidenceId);
  if (!review || review.type !== "review") fail("independent-review-evidence-missing", "independentReviewEvidenceId");
  return {
    valid,
    ready: valid && ci?.result === "passed" && review?.result === "passed" && gate.reviewStatus === "passed"
  };
}

function validateVerificationDetails(result, issues) {
  const details = result.details;
  const subject = "result.details";
  const keys = new Set(["profile", "uiScope", "intendedBehavior", "criticalPath", "changedPaths", "selectedChecks", "evidenceBindings", "correctionBudget", "correctionAttempts", "reviewedPaths", "localReviewFindings", "unresolvedGaps", "recoverySteps", "binding", "readiness", "productionGate"]);
  if (!exactKeys(details, keys, subject, issues)) return;
  required(details, ["profile", "uiScope", "intendedBehavior", "criticalPath", "changedPaths", "selectedChecks", "evidenceBindings", "correctionBudget", "correctionAttempts", "reviewedPaths", "localReviewFindings", "unresolvedGaps", "recoverySteps", "binding", "readiness"], subject, issues);
  const evidenceById = new Map((result.evidence ?? []).map((item) => [item.id, item]));
  if (!deliveryProfiles.includes(details.profile)) issues.push(issue("invalid-delivery-profile", `${subject}.profile`));
  validateUiScope(details.uiScope, `${subject}.uiScope`, issues);
  if (!nonEmpty(details.intendedBehavior)) issues.push(issue("invalid-intended-behavior", `${subject}.intendedBehavior`));
  if (!nonEmpty(details.criticalPath)) issues.push(issue("invalid-critical-path", `${subject}.criticalPath`));
  validateStringArray(details.changedPaths, `${subject}.changedPaths`, issues, { paths: true, nonEmptyArray: true });
  validateStringArray(details.reviewedPaths, `${subject}.reviewedPaths`, issues, { paths: true });
  if (Array.isArray(details.reviewedPaths) && new Set(details.reviewedPaths).size !== details.reviewedPaths.length) issues.push(issue("duplicate-reviewed-path", `${subject}.reviewedPaths`));
  const reviewedPathCoverage = Array.isArray(details.changedPaths) && Array.isArray(details.reviewedPaths)
    && details.changedPaths.every((changedPath) => details.reviewedPaths.includes(changedPath));
  if (details.readiness === "ready-for-openspec-verify" && !reviewedPathCoverage) issues.push(issue("incomplete-reviewed-path-coverage", `${subject}.reviewedPaths`));
  validateStringArray(details.unresolvedGaps, `${subject}.unresolvedGaps`, issues);
  validateStringArray(details.recoverySteps, `${subject}.recoverySteps`, issues, { nonEmptyArray: true });
  validateBinding(details.binding, `${subject}.binding`, issues);
  const evidenceBindings = validateEvidenceBindings(details.evidenceBindings, details, evidenceById, issues);
  if (!Number.isInteger(details.correctionBudget) || details.correctionBudget < 1 || details.correctionBudget > 3) issues.push(issue("invalid-correction-budget", `${subject}.correctionBudget`));
  if (!readinessStates.has(details.readiness)) issues.push(issue("invalid-readiness", `${subject}.readiness`));
  else if (!resultStatusesByReadiness[details.readiness].has(result.status)) issues.push(issue("status-readiness-mismatch", "result.status", details.readiness));

  let currentCheckEvidence = true;
  if (!Array.isArray(details.selectedChecks)) issues.push(issue("invalid-array", `${subject}.selectedChecks`));
  else {
    const ids = new Set();
    details.selectedChecks.forEach((check, index) => {
      validateCheck(check, index, evidenceById, issues);
      if (check?.result !== "pending" && nonEmpty(check?.evidenceId) && !evidenceIsCurrent(check.evidenceId, evidenceBindings, details)) {
        currentCheckEvidence = false;
        issues.push(issue("stale-evidence-binding", `${subject}.selectedChecks[${index}].evidenceId`, check.evidenceId));
      }
      if (nonEmpty(check?.id) && ids.has(check.id)) issues.push(issue("duplicate-check-id", `${subject}.selectedChecks[${index}].id`));
      ids.add(check?.id);
    });
    let broaderSeen = false;
    for (const [index, check] of details.selectedChecks.entries()) {
      if (check.category === "focused" && broaderSeen) issues.push(issue("focused-check-after-broader-check", `${subject}.selectedChecks[${index}]`));
      if (check.category !== "focused") broaderSeen = true;
    }
  }

  let blockingLocalFinding = false;
  if (!Array.isArray(details.localReviewFindings)) issues.push(issue("invalid-array", `${subject}.localReviewFindings`));
  else {
    const ids = new Set();
    details.localReviewFindings.forEach((finding, index) => {
      validateFinding(finding, index, evidenceById, issues, { subjectRoot: `${subject}.localReviewFindings`, allowResolution: true });
      for (const evidenceId of finding?.evidenceIds ?? []) {
        if (!evidenceIsCurrent(evidenceId, evidenceBindings, details)) {
          currentCheckEvidence = false;
          issues.push(issue("stale-evidence-binding", `${subject}.localReviewFindings[${index}].evidenceIds`, evidenceId));
        }
      }
      if (nonEmpty(finding?.id) && ids.has(finding.id)) issues.push(issue("duplicate-finding-id", `${subject}.localReviewFindings[${index}].id`));
      ids.add(finding?.id);
    });
    const sorted = sortReviewFindings(details.localReviewFindings);
    if (details.localReviewFindings.some((finding, index) => finding !== sorted[index])) issues.push(issue("findings-not-deterministically-ordered", `${subject}.localReviewFindings`));
  }

  let currentCorrectionEvidence = true;
  let failedCorrection = false;
  let exhaustedCorrection = false;
  if (!Array.isArray(details.correctionAttempts)) issues.push(issue("invalid-array", `${subject}.correctionAttempts`));
  else {
    const attemptsBySignature = new Map();
    const latestBySignature = new Map();
    details.correctionAttempts.forEach((attempt, index) => {
      const itemSubject = `${subject}.correctionAttempts[${index}]`;
      const keys = new Set(["failureSignature", "attempt", "kind", "result", "evidenceIds", "binding"]);
      if (!exactKeys(attempt, keys, itemSubject, issues)) return;
      required(attempt, [...keys], itemSubject, issues);
      if (!nonEmpty(attempt.failureSignature)) issues.push(issue("invalid-failure-signature", `${itemSubject}.failureSignature`));
      if (!Number.isInteger(attempt.attempt) || attempt.attempt < 1 || attempt.attempt > 3) issues.push(issue("invalid-correction-attempt", `${itemSubject}.attempt`));
      if (attempt.kind !== "objective-fix") issues.push(issue("invalid-correction-kind", `${itemSubject}.kind`));
      if (!new Set(["passed", "failed"]).has(attempt.result)) issues.push(issue("invalid-correction-result", `${itemSubject}.result`));
      validateEvidenceReferences(attempt.evidenceIds, `${itemSubject}.evidenceIds`, evidenceById, issues, { nonEmptyArray: true });
      if (!correctionEvidenceMatches(attempt, evidenceById)) {
        currentCorrectionEvidence = false;
        issues.push(issue("correction-evidence-result-mismatch", `${itemSubject}.evidenceIds`, attempt.result));
      }
      for (const evidenceId of attempt.evidenceIds ?? []) {
        const evidenceBinding = evidenceBindings.get(evidenceId);
        if (evidenceBinding?.binding?.value !== attempt.binding) issues.push(issue("correction-evidence-binding-mismatch", `${itemSubject}.evidenceIds`, evidenceId));
      }
      if (!nonEmpty(attempt.binding)) issues.push(issue("invalid-correction-binding", `${itemSubject}.binding`));
      const expected = (attemptsBySignature.get(attempt.failureSignature) ?? 0) + 1;
      if (attempt.attempt !== expected) issues.push(issue("nonsequential-correction-attempt", `${itemSubject}.attempt`, expected));
      if (Number.isInteger(details.correctionBudget) && attempt.attempt > details.correctionBudget) issues.push(issue("correction-budget-exceeded", `${itemSubject}.attempt`, details.correctionBudget));
      attemptsBySignature.set(attempt.failureSignature, expected);
      latestBySignature.set(attempt.failureSignature, attempt);
    });
    for (const attempt of latestBySignature.values()) {
      if (attempt.result === "failed") {
        failedCorrection = true;
        if (attempt.attempt >= details.correctionBudget) exhaustedCorrection = true;
        continue;
      }
      for (const evidenceId of attempt.evidenceIds ?? []) {
        if (!evidenceIsCurrent(evidenceId, evidenceBindings, details)) {
          currentCorrectionEvidence = false;
          issues.push(issue("stale-evidence-binding", `${subject}.correctionAttempts`, evidenceId));
        }
      }
      if (nonEmpty(attempt.binding) && attempt.binding !== details.binding?.value) {
        currentCorrectionEvidence = false;
        if (details.readiness === "ready-for-openspec-verify") issues.push(issue("stale-correction-binding", `${subject}.correctionAttempts`, details.binding?.value));
      }
    }
  }

  if (Array.isArray(details.localReviewFindings) && Array.isArray(details.correctionAttempts)) {
    details.localReviewFindings.forEach((finding, index) => {
      const resolution = validateLocalFindingResolution(finding, index, details.correctionAttempts, evidenceById, issues);
      if (resolution.blocking) blockingLocalFinding = true;
      for (const evidenceId of finding?.resolution?.evidenceIds ?? []) {
        if (!evidenceById.has(evidenceId)) issues.push(issue("unknown-evidence-reference", `${subject}.localReviewFindings[${index}].resolution.evidenceIds`, evidenceId));
        else if (!evidenceIsCurrent(evidenceId, evidenceBindings, details)) {
          currentCheckEvidence = false;
          issues.push(issue("stale-evidence-binding", `${subject}.localReviewFindings[${index}].resolution.evidenceIds`, evidenceId));
        }
      }
    });
  }

  if (exhaustedCorrection && result.status !== "blocked") issues.push(issue("exhausted-correction-requires-blocked-status", "result.status"));
  if (exhaustedCorrection && details.readiness !== "blocked") issues.push(issue("exhausted-correction-requires-blocked-readiness", `${subject}.readiness`));

  const requiredFailure = Array.isArray(details.selectedChecks) && details.selectedChecks.some((check) =>
    check.required && new Set(["failed", "pending"]).has(check.result));
  let missingProfileCheck = false;
  const selectedById = new Map((Array.isArray(details.selectedChecks) ? details.selectedChecks : []).map((check) => [check.id, check]));
  for (const [id, category] of requiredProfileChecks(details)) {
    const check = selectedById.get(id);
    if (!check || check.category !== category || check.required !== true) {
      missingProfileCheck = true;
      issues.push(issue("missing-required-profile-check", `${subject}.selectedChecks`, id));
    } else if (check.result !== "passed") {
      missingProfileCheck = true;
    }
  }
  const hasGaps = Array.isArray(details.unresolvedGaps) && details.unresolvedGaps.length > 0;
  let productionValid = true;
  let productionReady = true;
  if (details.profile === "production-rapid") {
    for (const [id, category, gateEvidenceField] of [["exact-head-ci", "ci", "ciEvidenceId"], ["strict-independent-review", "independent-review", "independentReviewEvidenceId"]]) {
      const check = selectedById.get(id);
      if (!check || check.category !== category || check.required !== true) {
        issues.push(issue("missing-production-check", `${subject}.selectedChecks`, id));
        productionValid = false;
        productionReady = false;
      } else if (details.productionGate && check.evidenceId !== details.productionGate[gateEvidenceField]) {
        issues.push(issue("production-check-evidence-mismatch", `${subject}.selectedChecks`, id));
        productionValid = false;
        productionReady = false;
      }
    }
    if (details.binding?.kind !== "commit") issues.push(issue("production-requires-commit-binding", `${subject}.binding`));
    if (!details.productionGate) {
      issues.push(issue("missing-production-gate", `${subject}.productionGate`));
      productionValid = false;
      productionReady = false;
    } else {
      const gate = validateProductionGate(details.productionGate, details, evidenceById, issues);
      productionValid = productionValid && gate.valid;
      productionReady = productionReady && gate.ready;
    }
  }
  if (details.readiness === "ready-for-openspec-verify" && (!reviewedPathCoverage || missingProfileCheck || requiredFailure || hasGaps || !currentCheckEvidence || !currentCorrectionEvidence || failedCorrection || blockingLocalFinding || !productionValid || !productionReady)) {
    issues.push(issue("readiness-overclaim", `${subject}.readiness`));
  }
}

export function validateImplementationQualityResult(result) {
  const issues = [];
  const shared = validateSkillResult(result);
  issues.push(...shared.issues.map((item) => ({ ...item, code: `skill-result.${item.code}` })));
  if (!isObject(result)) return { valid: false, issues };
  scanSensitive(result, "result", issues);
  if (result.skill === "base-code-review") validateReviewDetails(result, issues);
  else if (result.skill === "base-verification-loop") validateVerificationDetails(result, issues);
  else issues.push(issue("unsupported-implementation-quality-skill", "result.skill", result.skill));
  return { valid: issues.length === 0, issues };
}

export function renderImplementationQualityMarkdown(result) {
  const validation = validateImplementationQualityResult(result);
  if (!validation.valid) throw new Error(`Cannot render invalid implementation-quality result: ${validation.issues.map((item) => item.code).join(", ")}`);
  const lines = [`# ${result.skill}`, ""];
  if (result.skill === "base-code-review") {
    lines.push("## Findings");
    if (!result.details.findings.length) lines.push("", "No findings.");
    for (const finding of result.details.findings) {
      lines.push("", `### ${finding.severity.toUpperCase()} ${finding.id}`, "", `${finding.subject}: ${finding.impact}`, "", `Disposition: ${finding.disposition}`, `Recommendation: ${finding.recommendation}`);
    }
    lines.push("", "## Evidence Gaps");
    if (!result.details.evidenceGaps.length) lines.push("", "None.");
    else for (const gap of result.details.evidenceGaps) lines.push("", `- ${gap.id}: ${gap.subject} — ${gap.reason}`);
    lines.push("", "## Assumptions");
    if (!result.assumptions.length) lines.push("", "None.");
    else for (const assumption of result.assumptions) lines.push("", `- ${assumption}`);
    lines.push("", "## Scope", "", result.details.scopeSummary);
  } else {
    lines.push("## Readiness", "", result.details.readiness, "", "## Selected Checks");
    for (const check of result.details.selectedChecks) lines.push("", `- ${check.id}: ${check.result}`);
    lines.push("", "## Unresolved Gaps", "", ...(result.details.unresolvedGaps.length ? result.details.unresolvedGaps.map((gap) => `- ${gap}`) : ["None."]));
  }
  lines.push("", "## Summary", "", result.summary, "", "## Next Action", "", `${result.nextAction.kind}: ${result.nextAction.description}`);
  return `${lines.join("\n")}\n`;
}

export function validateTrustedCheckDefinitions(definitions) {
  const issues = [];
  if (!Array.isArray(definitions) || definitions.length === 0) return { valid: false, issues: [issue("invalid-check-definitions", "checks")] };
  const ids = new Set();
  definitions.forEach((definition, index) => {
    const subject = `checks[${index}]`;
    if (!exactKeys(definition, new Set(["id", "argv", "source", "targets"]), subject, issues)) return;
    required(definition, ["id", "argv", "source", "targets"], subject, issues);
    if (!nonEmpty(definition.id)) issues.push(issue("invalid-check-id", `${subject}.id`));
    else if (ids.has(definition.id)) issues.push(issue("duplicate-check-id", `${subject}.id`));
    ids.add(definition.id);
    if (!new Set(["invocation", "product-config"]).has(definition.source)) issues.push(issue("untrusted-check-source", `${subject}.source`));
    if (!Array.isArray(definition.argv) || definition.argv.length === 0 || !definition.argv.every(nonEmpty)) issues.push(issue("invalid-structured-argv", `${subject}.argv`));
    validateStringArray(definition.targets, `${subject}.targets`, issues, { paths: true, nonEmptyArray: true });
    scanSensitive(definition, subject, issues);
  });
  return { valid: issues.length === 0, issues };
}

export function selectVerificationChecks({ profile, hasUi = false, layoutChanged = false, materiallyChangedUi = false, mode = "interactive", tools = {} } = {}) {
  if (!deliveryProfiles.includes(profile)) return { status: "paused", checks: [], issues: [issue("invalid-delivery-profile", "profile")] };
  if (!new Set(["interactive", "autonomous"]).has(mode)) return { status: "paused", checks: [], issues: [issue("invalid-mode", "mode")] };
  const checks = [
    { id: "focused-unit-or-integration", category: "focused", required: true },
    { id: "critical-flow", category: "critical-flow", required: true },
    { id: "local-review", category: "review", required: true }
  ];
  if (profile === "production-rapid") {
    checks.push(
      { id: "regression-coverage", category: "regression", required: true },
      { id: "repeatability", category: "repeatability", required: true },
      { id: "operational-checks", category: "operational", required: true },
      { id: "release-evidence", category: "release", required: true },
      { id: "exact-head-ci", category: "ci", required: true },
      { id: "strict-independent-review", category: "independent-review", required: true }
    );
  }
  if (hasUi) {
    checks.push(
      { id: "chromium-desktop-1440x900", category: "browser", required: true },
      { id: "chromium-mobile-web-390x844", category: "device", required: true },
      { id: "critical-ui-interaction", category: "browser", required: true }
    );
    if (layoutChanged) checks.push(
      { id: "desktop-current-screenshot", category: "browser", required: true },
      { id: "mobile-current-screenshot", category: "browser", required: true }
    );
    if (materiallyChangedUi) checks.push(
      { id: "axe-core", category: "accessibility", required: true },
      { id: "manual-keyboard-semantics", category: "accessibility", required: true }
    );
  }
  const uiPrerequisites = hasUi ? ["playwright", "chromium", ...(materiallyChangedUi ? ["axeCore"] : [])] : [];
  const missing = uiPrerequisites.filter((tool) => tools[tool] !== true);
  if (missing.length) {
    return {
      status: mode === "autonomous" ? "paused" : "needs-authorization",
      checks,
      issues: missing.map((tool) => issue("missing-ui-prerequisite", `tools.${tool}`))
    };
  }
  return { status: "ready", checks, issues: [] };
}

export function evaluateVerificationLoop({ completedStages = [], currentBinding, evidenceBindings = [], correctionStateByFailureSignature = {}, correctionBudget = 3 } = {}) {
  if (!Number.isInteger(correctionBudget) || correctionBudget < 1 || correctionBudget > 3) return { state: "paused", reason: "invalid-correction-budget" };
  if (!nonEmpty(currentBinding)) return { state: "paused", reason: "missing-current-binding" };
  if (!Array.isArray(completedStages) || completedStages.some((stage, index) => stage !== verificationStages[index])) return { state: "paused", reason: "stages-out-of-order" };
  if (!Array.isArray(evidenceBindings) || evidenceBindings.some((binding) => binding !== currentBinding)) return { state: "paused", reason: "stale-evidence" };
  for (const state of Object.values(correctionStateByFailureSignature)) {
    if (!isObject(state) || !Number.isInteger(state.attempts) || state.attempts < 0 || !new Set(["passed", "failed", null]).has(state.latestResult) || (state.attempts === 0) !== (state.latestResult === null)) {
      return { state: "paused", reason: "invalid-correction-state" };
    }
    if (state.attempts > correctionBudget || (state.attempts === correctionBudget && state.latestResult === "failed")) {
      return { state: "blocked", reason: "correction-limit-exhausted" };
    }
  }
  const nextStage = verificationStages[completedStages.length] ?? null;
  return nextStage ? { state: "in-progress", nextStage } : { state: "complete", nextStage: null };
}

export function authorizeVerificationOperation({ authorization, runtime, config, operation, target, now, correctionAttemptsForFailureSignature, correctionAttempts, selectedEntry, failureSignature, checkpoint } = {}) {
  return checkOperationAuthorization({
    authorization,
    runtime,
    config,
    now,
    request: {
      profile: "local-implementation",
      operation,
      target,
      correctionAttemptsForFailureSignature,
      correctionAttempts,
      selectedEntry,
      failureSignature,
      checkpoint
    }
  });
}

export function evaluateProductionReadiness({ currentHead, ciEvidence, productionReviewAuthorization } = {}) {
  if (!/^(?:[0-9a-f]{40}|[0-9a-f]{64})$/.test(currentHead ?? "")) return { ready: false, reason: "noncanonical-current-head" };
  if (!ciEvidence || ciEvidence.status !== "passed" || ciEvidence.head !== currentHead) return { ready: false, reason: "ci-evidence-not-current" };
  const request = productionReviewAuthorization?.request;
  if (!isObject(productionReviewAuthorization) || !isObject(request)) return { ready: false, reason: "strict-review-gate-malformed" };
  if (request.profile !== "sdd-delivery" || request.operation !== "run-lifecycle-action" ||
      request.lifecycleAction !== "merge-pr" || request.deliveryProfile !== "production-rapid") {
    return { ready: false, reason: "strict-review-required" };
  }
  if (request.headCommit !== currentHead) return { ready: false, reason: "strict-review-wrong-head" };
  const gate = checkOperationAuthorization(productionReviewAuthorization);
  if (!gate.allowed) {
    const code = gate.issues?.[0]?.code;
    if (code === "independent-reviewer-unavailable" || code === "independent-reviewer-runtime-unavailable") {
      return { ready: false, reason: "strict-review-unavailable" };
    }
    if (code === "independent-review-self-review") return { ready: false, reason: "strict-review-not-independent" };
    if (["independent-review-result-stale-input", "independent-review-input-incomplete"].includes(code)) {
      return { ready: false, reason: "strict-review-wrong-head" };
    }
    return { ready: false, reason: "strict-review-not-passed" };
  }
  return { ready: true, reason: "current-strict-evidence" };
}
