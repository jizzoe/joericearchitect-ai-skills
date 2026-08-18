import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { packageDigest } from "../../../scripts/sdd/independent-review-contract.mjs";
import { checkAdapterDrift } from "../../../scripts/sdd/check-adapter-drift.mjs";
import {
  authorizeVerificationOperation,
  evaluateCompletionConvergence,
  evaluateProductionReadiness,
  evaluateVerificationLoop,
  renderImplementationQualityMarkdown,
  selectVerificationChecks,
  sortReviewFindings,
  validateImplementationQualityResult as validateImplementationQualityResultRaw,
  validateTrustedCheckDefinitions,
  verificationStages
} from "../../../scripts/validation/lib/implementation-quality.mjs";

const root = path.resolve(new URL("../../..", import.meta.url).pathname);
const fixtures = path.join(root, "evals/skills/implementation-quality/fixtures");
const readJson = (name) => JSON.parse(fs.readFileSync(path.join(fixtures, name), "utf8"));
const clone = (value) => structuredClone(value);
const standardsSelectionRecord = {
  schemaVersion: 1,
  target: { path: "fixtures/second-workspace" },
  rules: [
    { id: "repository-style", classification: "repository-selected", source: "config/quality.md", scope: "repository" },
    { id: "official-rule", classification: "required", source: "https://example.com/official", scope: "src" },
    { id: "expo-rule", classification: "not-applicable", source: "https://example.com/expo", scope: "repository", reason: "target is not Expo" }
  ],
  overrides: [{ ruleId: "repository-style", scope: "src", reason: "repository convention", status: "resolved" }],
  expectedEvidence: ["lint"],
  gaps: []
};

function productionReviewAuthorization(head) {
  const baseCommit = "0".repeat(40);
  const reviewPackage = readJson("../../independent-review/fixtures/valid-package.json");
  reviewPackage.baseCommit = baseCommit;
  reviewPackage.headCommit = head;
  reviewPackage.validationEvidence = ["focused checks passed", "profile checks passed"];
  reviewPackage.manifestDigest = packageDigest(reviewPackage);
  const result = readJson("../../independent-review/fixtures/valid-result.json");
  result.baseCommit = baseCommit;
  result.headCommit = head;
  result.manifestDigest = reviewPackage.manifestDigest;
  result.startedAt = "2026-08-13T03:01:00.000Z";
  result.completedAt = "2026-08-13T03:02:00.000Z";
  const applyEvidence = {
    reference: "apply-current",
    current: true,
    headCommit: head,
    completedAt: "2026-08-13T03:00:00.000Z",
    validationEvidence: [...reviewPackage.validationEvidence]
  };
  const pr = { entry: "change", kind: "pr", id: "7", repository: "owner/repository", baseBranch: "main", headCommit: head, evidence: { reference: "pr", current: true, headCommit: head } };
  const issueRecord = { entry: "change", kind: "issue", id: "8", repository: "owner/repository", evidence: { reference: "issue", current: true } };
  const branch = { entry: "change", kind: "branch", id: "feature/change", repository: "owner/repository", baseBranch: "main", headCommit: head, evidence: { reference: "branch", current: true, headCommit: head } };
  const reviewRecord = { id: result.reviewRecordId, entry: "change", transition: "merge-pr", evidence: {}, reviewPackage, result, dispositions: [] };
  const steps = ["issue", "branch", "pr", "merge-pr", "sync-change", "archive-change", "delete-merged-topic-branch"]
    .map((id, index) => ({ id, status: index < 3 ? "complete" : "pending", evidence: index < 3 ? { present: true, current: true } : undefined }));
  return {
    authorization: { targets: ["workspace:reports"], allowedMutations: ["run-lifecycle-action"], qualityProfile: "production-rapid", derivedTargets: { queue: ["change"], selectedEntry: "change", repository: "owner/repository" } },
    runtime: { permittedOperations: ["run-lifecycle-action"] },
    config: { independentReviewer: { type: "fixture", identity: "fresh-reviewer", enabled: true, attestation: { ref: "fixture-attestation", nonInteractive: true, isolatedContext: true, readOnly: true } } },
    request: {
      profile: "sdd-delivery", operation: "run-lifecycle-action", lifecycleAction: "merge-pr", target: "pr:7", selectedEntry: "change", derivedRecord: pr,
      headCommit: head, baseCommit, evidenceCurrent: true, evidenceReference: "pr", evidenceHeadCommit: head, recovery: "re-read state",
      deliveryProfile: "production-rapid", implementerSession: "implementer", reviewer: { type: "fixture", identity: "fresh-reviewer" },
      checkpoint: { selectedEntry: { name: "change", records: [issueRecord, branch, pr], applyEvidenceRecords: [applyEvidence], reviewRecords: [reviewRecord] }, steps },
      applyEvidence, independentReviewPackage: reviewPackage, independentReviewResult: result, reviewDispositions: []
    }
  };
}

function localImplementationAuthorization(value) {
  const attempts = value?.details?.correctionAttempts ?? [];
  const sources = new Map();
  for (const attempt of attempts) {
    if (!sources.has(attempt.failureSignature)) {
      const index = sources.size + 1;
      sources.set(attempt.failureSignature, {
        kind: "verification",
        verificationRecordId: `verification-${index}`,
        failureSignature: attempt.failureSignature,
        evidence: `evidence/verification-${index}.json`,
        transition: "openspec-verify"
      });
    }
  }
  const correctionRecords = attempts.map((attempt, index) => ({
    id: `correction-${index + 1}`,
    change: "quality-change",
    attempt: index + 1,
    classification: attempt.kind,
    behaviorPreserving: true,
    current: true,
    ancestryVerified: true,
    failureSignature: attempt.failureSignature,
    failureSource: sources.get(attempt.failureSignature),
    evidenceReference: `evidence/correction-${index + 1}.json`,
    baseCommit: "0".repeat(40),
    previousHead: String(index + 1).repeat(40),
    headCommit: String(index + 2).repeat(40),
    previousManifestDigest: String(index + 3).repeat(64),
    manifestDigest: String(index + 4).repeat(64),
    verification: { result: attempt.result, evidenceIds: [...attempt.evidenceIds], binding: attempt.binding }
  }));
  return {
    authorization: {
      targets: ["workspace:src"],
      allowedMutations: ["objective-correction"],
      correctionBudgetPerFailureSignature: value.details.correctionBudget,
      target: { entries: ["quality-change"] }
    },
    runtime: { permittedOperations: ["objective-correction"] },
    config: {},
    request: { target: "workspace:src/widget.mjs", selectedEntry: "quality-change" },
    checkpoint: {
      selectedEntry: {
        name: "quality-change",
        records: [],
        verificationRecords: [...sources.values()].map((source) => ({ id: source.verificationRecordId, entry: "quality-change", transition: source.transition, current: true, failureSignature: source.failureSignature, evidence: source.evidence })),
        correctionAnchor: { baseCommit: "0".repeat(40), headCommit: "1".repeat(40), manifestDigest: "3".repeat(64) },
        correctionRecords
      },
      steps: []
    }
  };
}

const validationOptions = (value) => ({
  localImplementationAuthorization: value?.skill === "base-verification-loop"
    ? localImplementationAuthorization(value)
    : undefined,
  productionReviewAuthorization: value?.skill === "base-verification-loop" &&
    value?.details?.profile === "production-rapid" &&
    value?.details?.readiness === "ready-for-openspec-verify"
    ? productionReviewAuthorization(value.details.productionGate?.head ?? "")
    : undefined
});
const validateResult = (value, options = {}) => validateImplementationQualityResultRaw(value, { ...validationOptions(value), ...options });
const renderResult = (value) => renderImplementationQualityMarkdown(value, validationOptions(value));

test("valid code-review result is findings-first and shared-contract compliant", () => {
  const result = readJson("valid-code-review.json");
  assert.deepEqual(validateResult(result), { valid: true, issues: [] });
  const markdown = renderImplementationQualityMarkdown(result);
  assert.ok(markdown.indexOf("## Findings") < markdown.indexOf("## Evidence Gaps"));
  assert.ok(markdown.indexOf("## Evidence Gaps") < markdown.indexOf("## Assumptions"));
  assert.ok(markdown.indexOf("## Assumptions") < markdown.indexOf("## Scope"));
  assert.ok(markdown.indexOf("## Scope") < markdown.indexOf("## Summary"));
  assert.match(markdown, /- The supplied changed path list is complete\./);
  assert.match(markdown, /HIGH finding-high-validation/);

  const selectedStandards = clone(result);
  selectedStandards.details.standardsSelection = {
    selectedRuleIds: ["repository-style", "official-rule"],
    scopedOverrides: [{ ruleId: "repository-style", scope: "src" }],
    notApplicableRuleIds: ["expo-rule"]
  };
  assert.deepEqual(validateResult(selectedStandards, { standardsSelectionRecord }), { valid: true, issues: [] });

  const unvalidatedStandards = clone(selectedStandards);
  unvalidatedStandards.details.standardsSelection.selectedRuleIds = ["made-up-rule"];
  assert.ok(validateResult(unvalidatedStandards, { standardsSelectionRecord }).issues.some((item) => item.code === "standards-selection-record-mismatch"));

  const emptyAssumptions = clone(result);
  emptyAssumptions.assumptions = [];
  assert.match(renderImplementationQualityMarkdown(emptyAssumptions), /## Assumptions\n\nNone\./);
});

test("review validator rejects malformed, duplicate, unsafe, unsupported, and misordered findings", () => {
  const misordered = validateResult(readJson("invalid-code-review-misordered.json"));
  assert.equal(misordered.valid, false);
  assert.ok(misordered.issues.some((item) => item.code === "findings-not-deterministically-ordered"));

  const cases = [
    ["duplicate", (value) => { value.details.findings[1].id = value.details.findings[0].id; }, "duplicate-finding-id"],
    ["unsafe path", (value) => { value.details.findings[0].subject = "../outside.mjs"; }, "unsafe-workspace-path"],
    ["unsupported severity", (value) => { value.details.findings[0].severity = "critical"; }, "invalid-finding-severity"],
    ["unsafe standards override scope", (value) => { value.details.standardsSelection.scopedOverrides = [{ ruleId: "repository-style", scope: "../outside" }]; }, "unsafe-workspace-path"],
    ["unknown details key", (value) => { value.details.extra = true; }, "unknown-key"],
    ["sensitive details", (value) => { value.details.scopeSummary = ["ghp_", "A".repeat(20)].join(""); }, "sensitive-value"],
    ["personal data field", (value) => { value.details.pii = "synthetic@example.invalid"; }, "sensitive-key"]
  ];
  for (const [name, mutate, code] of cases) {
    const value = readJson("valid-code-review.json");
    mutate(value);
    const result = validateResult(value);
    assert.equal(result.valid, false, name);
    assert.ok(result.issues.some((item) => item.code === code), `${name}: ${JSON.stringify(result.issues)}`);
  }
});

test("implementation-quality results reject sensitive values in every rendered top-level field", () => {
  const credential = ["ghp_", "A".repeat(20)].join("");
  const cases = [
    ["summary", (value) => { value.summary = credential; }],
    ["artifacts", (value) => { value.artifacts[0].subject = credential; }],
    ["evidence", (value) => { value.evidence[0].subject = credential; }],
    ["assumptions", (value) => { value.assumptions = [credential]; }],
    ["openQuestions", (value) => { value.openQuestions = [{ id: "sensitive-question", question: credential, blocking: true }]; }],
    ["nextAction", (value) => { value.nextAction.description = credential; }],
    ["details", (value) => { value.details.scopeSummary = credential; }]
  ];
  for (const [field, mutate] of cases) {
    const value = readJson("valid-code-review.json");
    mutate(value);
    const result = validateResult(value);
    assert.ok(result.issues.some((item) => item.code === "sensitive-value"), field);
  }
});

test("finding sort keeps severity and disposition independent", () => {
  const findings = readJson("invalid-code-review-misordered.json").details.findings;
  const sorted = sortReviewFindings(findings);
  assert.deepEqual(sorted.map((item) => item.severity), ["high", "low"]);
  assert.equal(sorted[0].disposition, "objective-fix");
  assert.equal(sorted[1].disposition, "warning");
});

test("trusted check definitions require structured argv and trusted sources", () => {
  const secondWorkspace = readJson("second-workspace.json");
  assert.deepEqual(validateTrustedCheckDefinitions(secondWorkspace.checks), { valid: true, issues: [] });

  const adversarial = readJson("adversarial-input.json");
  const result = validateTrustedCheckDefinitions(adversarial.checks);
  assert.equal(result.valid, false);
  assert.ok(result.issues.some((item) => item.code === "untrusted-check-source"));

  const moduleText = fs.readFileSync(path.join(root, "scripts/validation/lib/implementation-quality.mjs"), "utf8");
  assert.doesNotMatch(moduleText, /node:child_process|execFile|spawn\(/);
});

test("profile selection covers prototype, production, UI viewports, accessibility, and missing tools", () => {
  const prototype = selectVerificationChecks({ profile: "prototype-rapid", hasUi: false });
  assert.equal(prototype.status, "ready");
  assert.deepEqual(prototype.checks.map((item) => item.id), ["focused-unit-or-integration", "critical-flow", "local-review"]);

  const ui = selectVerificationChecks({ profile: "production-rapid", hasUi: true, layoutChanged: true, materiallyChangedUi: true, tools: { playwright: true, chromium: true, axeCore: true } });
  assert.equal(ui.status, "ready");
  for (const id of ["chromium-desktop-1440x900", "chromium-mobile-web-390x844", "critical-ui-interaction", "desktop-current-screenshot", "mobile-current-screenshot", "axe-core", "manual-keyboard-semantics", "exact-head-ci", "strict-independent-review"]) {
    assert.ok(ui.checks.some((item) => item.id === id), id);
  }

  const nonMaterialUi = selectVerificationChecks({ profile: "prototype-rapid", hasUi: true, tools: { playwright: true, chromium: true } });
  assert.equal(nonMaterialUi.status, "ready");
  assert.ok(!nonMaterialUi.checks.some((item) => item.id === "axe-core"));

  assert.equal(selectVerificationChecks({ profile: "prototype-rapid", hasUi: true, mode: "interactive" }).status, "needs-authorization");
  assert.equal(selectVerificationChecks({ profile: "prototype-rapid", hasUi: true, mode: "autonomous" }).status, "paused");
});

test("verification state machine is ordered, idempotent, current, and correction-bounded", () => {
  const initial = evaluateVerificationLoop({ currentBinding: "state-1" });
  assert.deepEqual(initial, { state: "in-progress", nextStage: "bind-inputs" });
  assert.deepEqual(evaluateVerificationLoop({ currentBinding: "state-1" }), initial);
  assert.deepEqual(evaluateVerificationLoop({ completedStages: verificationStages, currentBinding: "state-1", evidenceBindings: ["state-1"] }), { state: "complete", nextStage: null });
  assert.equal(evaluateVerificationLoop({ completedStages: ["select-checks"], currentBinding: "state-1" }).reason, "stages-out-of-order");
  assert.equal(evaluateVerificationLoop({ currentBinding: "state-2", evidenceBindings: ["state-1"] }).reason, "stale-evidence");
  assert.deepEqual(evaluateVerificationLoop({ currentBinding: "state-1", correctionStateByFailureSignature: { validation: { attempts: 3, latestResult: "failed" } } }), { state: "blocked", reason: "correction-limit-exhausted" });
  assert.deepEqual(evaluateVerificationLoop({ currentBinding: "state-1", correctionBudget: 1, correctionStateByFailureSignature: { validation: { attempts: 1, latestResult: "failed" } } }), { state: "blocked", reason: "correction-limit-exhausted" });
  assert.deepEqual(evaluateVerificationLoop({ currentBinding: "state-1", correctionStateByFailureSignature: { validation: { attempts: 3, latestResult: "passed" } } }), initial);
  assert.deepEqual(evaluateVerificationLoop({ currentBinding: "state-1", correctionStateByFailureSignature: { validation: { attempts: 3 } } }), { state: "paused", reason: "invalid-correction-state" });
});

test("autonomous prototype completion converges only on current final-bound passing evidence", () => {
  const finalBinding = { target: "change:quality-change", packageDigest: "a".repeat(64), workspace: "workspace-state-final", head: "b".repeat(40) };
  const expectedQualityActionIds = ["focused-tests", "critical-flow", "requirements-mapping", "local-review", "openspec-verify", "openspec-validate-all-strict", "lifecycle-reconciliation"];
  const expectedPredicateIds = ["final-target-bound", "no-unresolved-objective-findings", "delivery-sync-archive-current", "issue-project-cleanup-reconciled", "no-residual-owned-state"];
  const record = (id) => ({ id, status: "passed", evidenceIds: [`evidence-${id}`], binding: { ...finalBinding } });
  const baseline = {
    finalBinding,
    expectedQualityActionIds,
    expectedPredicateIds,
    requiredQualityActions: expectedQualityActionIds.map(record),
    completionEvidencePredicates: expectedPredicateIds.map(record),
    unresolvedObjectiveFindings: []
  };
  assert.equal(evaluateCompletionConvergence(baseline).converged, true);

  const cases = [
    ["failed", (value) => { value.requiredQualityActions[0].status = "failed"; }],
    ["missing", (value) => { value.requiredQualityActions.pop(); }],
    ["stale", (value) => { value.requiredQualityActions[0].status = "stale"; }],
    ["mismatched", (value) => { value.requiredQualityActions[0].binding.head = "c".repeat(40); }],
    ["skipped-required", (value) => { value.requiredQualityActions[0].status = "skipped-required"; }],
    ["attempted-only", (value) => { value.requiredQualityActions[0].status = "attempted-only"; }],
    ["unresolved-objective-finding", (value) => { value.unresolvedObjectiveFindings = ["finding-1"]; }]
  ];
  for (const [reason, mutate] of cases) {
    const value = clone(baseline);
    mutate(value);
    const result = evaluateCompletionConvergence(value);
    assert.equal(result.converged, false, reason);
    assert.equal(result.reason, reason);
  }

  const predicateMismatch = clone(baseline);
  predicateMismatch.completionEvidencePredicates[0].binding.workspace = "workspace-state-old";
  assert.deepEqual(
    evaluateCompletionConvergence(predicateMismatch),
    { converged: false, classification: "paused", reason: "mismatched", id: "final-target-bound", kind: "completion-evidence-predicate" }
  );
});

test("verification operations reuse exact local-implementation authorization", () => {
  const input = {
    authorization: { allowedMutations: ["local-edit", "run-test", "run-validation", "objective-correction"], targets: ["workspace:src"] },
    runtime: { permittedOperations: ["local-edit", "run-test", "run-validation", "objective-correction"] },
    config: {},
    operation: "local-edit",
    target: "workspace:src/widget.mjs"
  };
  assert.equal(authorizeVerificationOperation(input).allowed, true);
  assert.equal(authorizeVerificationOperation({ ...input, target: "workspace:outside/widget.mjs" }).issues[0].code, "unauthorized-target");
  assert.equal(authorizeVerificationOperation({ ...input, operation: "run-lifecycle-action" }).issues[0].code, "operation-not-in-profile");
  const failureSource = { kind: "verification", verificationRecordId: "verification-validation", failureSignature: "validation-failure", evidence: "evidence/validation-failure.json", transition: "openspec-verify" };
  const freshFailureSource = { kind: "verification", verificationRecordId: "verification-fresh", failureSignature: "fresh-failure", evidence: "evidence/fresh-failure.json", transition: "openspec-verify" };
  const verificationRecords = [failureSource, freshFailureSource].map((source) => ({ id: source.verificationRecordId, entry: "quality-change", transition: source.transition, current: true, failureSignature: source.failureSignature, evidence: source.evidence }));
  const correctionRecords = Array.from({ length: 3 }, (_, index) => ({
    id: `correction-${index + 1}`,
    change: "quality-change",
    attempt: index + 1,
    classification: "objective-fix",
    behaviorPreserving: true,
    current: true,
    ancestryVerified: true,
    failureSignature: "validation-failure",
    failureSource,
    evidenceReference: `evidence/correction-${index + 1}.json`,
    baseCommit: "1".repeat(40),
    previousHead: String(index + 2).repeat(40),
    headCommit: String(index + 3).repeat(40),
    previousManifestDigest: String(index + 4).repeat(64),
    manifestDigest: String(index + 5).repeat(64)
  }));
  const correctionAuthorization = {
    ...input.authorization,
    correctionBudgetPerFailureSignature: 3,
    target: { entries: ["quality-change"] }
  };
  const correction = authorizeVerificationOperation({
    ...input,
    authorization: correctionAuthorization,
    operation: "objective-correction",
    selectedEntry: "quality-change",
    failureSignature: "validation-failure",
    failureSource,
    correctionAttemptsForFailureSignature: 3,
    correctionAttempts: 3,
    checkpoint: { selectedEntry: { name: "quality-change", records: [], verificationRecords, correctionAnchor: { baseCommit: "1".repeat(40), headCommit: "2".repeat(40), manifestDigest: "4".repeat(64) }, correctionRecords }, steps: [] }
  });
  assert.equal(correction.issues[0].code, "correction-limit-exhausted");
  const forgedCount = authorizeVerificationOperation({
    ...input,
    authorization: correctionAuthorization,
    operation: "objective-correction",
    selectedEntry: "quality-change",
    failureSignature: "validation-failure",
    failureSource,
    correctionAttemptsForFailureSignature: 0,
    correctionAttempts: 3,
    checkpoint: { selectedEntry: { name: "quality-change", records: [], verificationRecords, correctionAnchor: { baseCommit: "1".repeat(40), headCommit: "2".repeat(40), manifestDigest: "4".repeat(64) }, correctionRecords }, steps: [] }
  });
  assert.equal(forgedCount.issues[0].code, "correction-attempt-count-mismatch");
  const freshSignature = authorizeVerificationOperation({
    ...input,
    authorization: correctionAuthorization,
    operation: "objective-correction",
    selectedEntry: "quality-change",
    failureSignature: "fresh-failure",
    failureSource: freshFailureSource,
    correctionAttemptsForFailureSignature: 0,
    correctionAttempts: 3,
    checkpoint: { selectedEntry: { name: "quality-change", records: [], verificationRecords, correctionAnchor: { baseCommit: "1".repeat(40), headCommit: "2".repeat(40), manifestDigest: "4".repeat(64) }, correctionRecords }, steps: [] }
  });
  assert.equal(freshSignature.allowed, true);
  const missingPerSignature = authorizeVerificationOperation({
    ...input,
    authorization: correctionAuthorization,
    operation: "objective-correction",
    selectedEntry: "quality-change",
    failureSignature: "fresh-failure",
    failureSource: freshFailureSource,
    correctionAttempts: 3,
    checkpoint: { selectedEntry: { name: "quality-change", records: [], verificationRecords, correctionAnchor: { baseCommit: "1".repeat(40), headCommit: "2".repeat(40), manifestDigest: "4".repeat(64) }, correctionRecords }, steps: [] }
  });
  assert.equal(missingPerSignature.allowed, true);
  const renamedSignature = authorizeVerificationOperation({
    ...input,
    authorization: correctionAuthorization,
    operation: "objective-correction",
    selectedEntry: "quality-change",
    failureSignature: "renamed-failure",
    failureSource,
    checkpoint: { selectedEntry: { name: "quality-change", records: [], verificationRecords, correctionAnchor: { baseCommit: "1".repeat(40), headCommit: "2".repeat(40), manifestDigest: "4".repeat(64) }, correctionRecords }, steps: [] }
  });
  assert.equal(renamedSignature.issues[0].code, "correction-failure-signature-mismatch");
  const forgedSource = authorizeVerificationOperation({
    ...input,
    authorization: correctionAuthorization,
    operation: "objective-correction",
    selectedEntry: "quality-change",
    failureSignature: "fresh-failure",
    failureSource: { ...freshFailureSource, evidence: "evidence/forged.json" },
    checkpoint: { selectedEntry: { name: "quality-change", records: [], verificationRecords, correctionAnchor: { baseCommit: "1".repeat(40), headCommit: "2".repeat(40), manifestDigest: "4".repeat(64) }, correctionRecords }, steps: [] }
  });
  assert.equal(forgedSource.issues[0].code, "correction-failure-source-not-durable");
  assert.equal(authorizeVerificationOperation({ ...input, runtime: { permissionGaps: ["local-edit"] } }).issues[0].code, "runtime-permission-gap");
});

test("prototype and strict production results validate without lifecycle overclaim", () => {
  for (const fixture of ["valid-verification-prototype.json", "valid-verification-production.json"]) {
    const value = readJson(fixture);
    assert.deepEqual(validateResult(value), { valid: true, issues: [] }, fixture);
    assert.match(renderResult(value), /ready-for-openspec-verify/);
    assert.doesNotMatch(value.summary, /merge|archive|delivery complete/i);
  }
});

test("verification results report and bind a supplied standards selection record", () => {
  const result = readJson("valid-verification-prototype.json");
  result.details.standardsSelection = {
    selectedRuleIds: ["repository-style", "official-rule"],
    scopedOverrides: [{ ruleId: "repository-style", scope: "src" }],
    notApplicableRuleIds: ["expo-rule"]
  };
  assert.deepEqual(validateResult(result, { standardsSelectionRecord }), { valid: true, issues: [] });

  result.details.standardsSelection.notApplicableRuleIds = ["official-rule"];
  const validation = validateResult(result, { standardsSelectionRecord });
  assert.equal(validation.valid, false);
  assert.ok(validation.issues.some((item) => item.code === "standards-selection-record-mismatch"));
});

test("verification result status and readiness remain consistent", () => {
  for (const status of ["paused", "blocked"]) {
    const value = readJson("valid-verification-prototype.json");
    value.status = status;
    assert.ok(validateResult(value).issues.some((item) => item.code === "status-readiness-mismatch"), status);
  }

  for (const readiness of ["paused", "blocked"]) {
    const value = readJson("valid-verification-prototype.json");
    value.details.readiness = readiness;
    assert.ok(validateResult(value).issues.some((item) => item.code === "status-readiness-mismatch"), readiness);
  }

  const needsImplementation = readJson("valid-verification-prototype.json");
  needsImplementation.details.readiness = "needs-implementation";
  assert.ok(!validateResult(needsImplementation).issues.some((item) => item.code === "status-readiness-mismatch"));

  const noOpReady = readJson("valid-verification-prototype.json");
  noOpReady.status = "no-op";
  assert.deepEqual(validateResult(noOpReady), { valid: true, issues: [] });

  noOpReady.details.readiness = "paused";
  assert.ok(validateResult(noOpReady).issues.some((item) => item.code === "status-readiness-mismatch"));
});

test("paused production result can preserve valid unavailable strict-review evidence", () => {
  const value = readJson("valid-verification-production.json");
  value.status = "paused";
  value.summary = "Production readiness paused because strict review is unavailable.";
  value.nextAction = { kind: "resume", description: "Retry the configured strict isolated reviewer." };
  value.details.readiness = "paused";
  value.details.productionGate.reviewStatus = "unavailable";
  value.evidence.find((item) => item.id === "strict-review").result = "failed";
  value.details.selectedChecks.find((item) => item.id === "strict-independent-review").result = "failed";
  assert.deepEqual(validateResult(value), { valid: true, issues: [] });
});

test("production gate is exact-head, strict, fresh, and independent", () => {
  const head = "1".repeat(40);
  const ciEvidence = { status: "passed", head };
  const gate = productionReviewAuthorization(head);
  assert.deepEqual(evaluateProductionReadiness({ currentHead: head, ciEvidence, productionReviewAuthorization: gate }), { ready: true, reason: "current-strict-evidence" });
  assert.equal(evaluateProductionReadiness({ currentHead: head, ciEvidence: { ...ciEvidence, head: "2".repeat(40) }, productionReviewAuthorization: gate }).reason, "ci-evidence-not-current");

  const wrongHead = clone(gate);
  wrongHead.request.headCommit = "2".repeat(40);
  assert.equal(evaluateProductionReadiness({ currentHead: head, ciEvidence, productionReviewAuthorization: wrongHead }).reason, "strict-review-wrong-head");

  const unavailable = clone(gate);
  unavailable.request.independentReviewResult.status = "unavailable";
  unavailable.request.independentReviewResult.unavailableCode = "independent-reviewer-runtime-unavailable";
  unavailable.request.independentReviewResult.attestation = { ...unavailable.request.independentReviewResult.attestation, nonInteractive: false, isolatedContext: false, freshContext: false, readOnly: false };
  unavailable.request.checkpoint.selectedEntry.reviewRecords[0].result = unavailable.request.independentReviewResult;
  assert.equal(evaluateProductionReadiness({ currentHead: head, ciEvidence, productionReviewAuthorization: unavailable }).reason, "strict-review-unavailable");

  const selfReview = clone(gate);
  selfReview.request.implementerSession = "fresh-reviewer";
  assert.equal(evaluateProductionReadiness({ currentHead: head, ciEvidence, productionReviewAuthorization: selfReview }).reason, "strict-review-not-independent");

  const fabricatedLabels = { request: { profile: "sdd-delivery", operation: "run-lifecycle-action", lifecycleAction: "merge-pr", deliveryProfile: "production-rapid", headCommit: head, status: "passed", assurance: "strict-isolated" } };
  assert.equal(evaluateProductionReadiness({ currentHead: head, ciEvidence, productionReviewAuthorization: fabricatedLabels }).reason, "strict-review-not-passed");

  const nondurable = clone(gate);
  nondurable.request.checkpoint.selectedEntry.reviewRecords = [];
  assert.equal(evaluateProductionReadiness({ currentHead: head, ciEvidence, productionReviewAuthorization: nondurable }).reason, "strict-review-not-passed");
});

test("production result CLI requires canonical review authorization evidence", () => {
  const resultPath = path.join(fixtures, "valid-verification-production.json");
  const validatorPath = path.join(root, "scripts/validation/validate-implementation-quality.mjs");
  assert.throws(() => execFileSync(process.execPath, [validatorPath, resultPath], { stdio: "pipe" }));
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), "implementation-quality-"));
  const authorizationPath = path.join(temporaryRoot, "production-review-authorization.json");
  try {
    fs.writeFileSync(authorizationPath, `${JSON.stringify(validationOptions(readJson("valid-verification-production.json")))}\n`, { mode: 0o600 });
    const output = JSON.parse(execFileSync(process.execPath, [validatorPath, resultPath, authorizationPath], { encoding: "utf8" }));
    assert.deepEqual(output, { valid: true, issues: [] });
  } finally {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }
});

test("result validator rejects readiness overclaim, stale production head, and self review", () => {
  const overclaim = readJson("valid-verification-prototype.json");
  overclaim.details.selectedChecks[0].result = "failed";
  overclaim.evidence.find((item) => item.id === "focused").result = "failed";
  assert.ok(validateResult(overclaim).issues.some((item) => item.code === "readiness-overclaim"));

  const selfAssertedReview = readJson("valid-verification-production.json");
  const selfAssertedResult = validateImplementationQualityResultRaw(selfAssertedReview);
  assert.ok(selfAssertedResult.issues.some((item) => item.code === "canonical-independent-review-not-validated"));
  assert.ok(selfAssertedResult.issues.some((item) => item.code === "readiness-overclaim"));

  const nondurableReview = productionReviewAuthorization(selfAssertedReview.details.productionGate.head);
  nondurableReview.request.checkpoint.selectedEntry.reviewRecords = [];
  const nondurableResult = validateImplementationQualityResultRaw(selfAssertedReview, { productionReviewAuthorization: nondurableReview });
  assert.ok(nondurableResult.issues.some((item) => item.code === "canonical-independent-review-not-validated"));

  const misleadingSummary = clone(selfAssertedReview);
  misleadingSummary.details.productionGate.reviewerSession = "different-reviewer";
  const misleadingResult = validateResult(misleadingSummary);
  assert.ok(misleadingResult.issues.some((item) => item.code === "production-review-summary-mismatch"));

  const wrongHead = readJson("valid-verification-production.json");
  wrongHead.details.productionGate.reviewHead = "2".repeat(40);
  assert.ok(validateResult(wrongHead).issues.some((item) => item.code === "production-head-mismatch"));

  const selfReview = readJson("valid-verification-production.json");
  selfReview.details.productionGate.reviewerSession = selfReview.details.productionGate.implementerSession;
  assert.ok(validateResult(selfReview).issues.some((item) => item.code === "reviewer-not-independent"));

  const skippedProductionGates = readJson("valid-verification-production.json");
  skippedProductionGates.details.selectedChecks.find((item) => item.id === "exact-head-ci").result = "not-applicable";
  skippedProductionGates.details.selectedChecks.find((item) => item.id === "strict-independent-review").result = "not-applicable";
  const skippedGateResult = validateResult(skippedProductionGates);
  assert.ok(skippedGateResult.issues.some((item) => item.code === "readiness-overclaim"));

  const missingProductionGateCheck = readJson("valid-verification-production.json");
  missingProductionGateCheck.details.selectedChecks = missingProductionGateCheck.details.selectedChecks.filter((item) => item.id !== "strict-independent-review");
  assert.ok(validateResult(missingProductionGateCheck).issues.some((item) => item.code === "missing-production-check"));

  const mismatchedProductionEvidence = readJson("valid-verification-production.json");
  mismatchedProductionEvidence.details.selectedChecks.find((item) => item.id === "exact-head-ci").evidenceId = "focused";
  const mismatchedEvidenceResult = validateResult(mismatchedProductionEvidence);
  assert.ok(mismatchedEvidenceResult.issues.some((item) => item.code === "production-check-evidence-mismatch"));
  assert.ok(mismatchedEvidenceResult.issues.some((item) => item.code === "readiness-overclaim"));

  const nonCiEvidence = readJson("valid-verification-production.json");
  nonCiEvidence.evidence.find((item) => item.id === "ci-current").type = "review";
  assert.ok(validateResult(nonCiEvidence).issues.some((item) => item.code === "ci-evidence-missing"));

  const staleCiHead = readJson("valid-verification-production.json");
  staleCiHead.details.productionGate.ciHead = "2".repeat(40);
  assert.ok(validateResult(staleCiHead).issues.some((item) => item.code === "ci-head-mismatch"));

  const invalidCiSource = readJson("valid-verification-production.json");
  invalidCiSource.details.productionGate.ciSource = "local-validation";
  assert.ok(validateResult(invalidCiSource).issues.some((item) => item.code === "invalid-ci-source"));

  const staleCorrection = readJson("valid-verification-production.json");
  staleCorrection.details.correctionAttempts.push({
    failureSignature: "review-finding",
    attempt: 1,
    kind: "objective-fix",
    result: "passed",
    evidenceIds: ["focused"],
    binding: "2".repeat(40)
  });
  const staleCorrectionResult = validateResult(staleCorrection);
  assert.ok(staleCorrectionResult.issues.some((item) => item.code === "stale-correction-binding"));
  assert.ok(staleCorrectionResult.issues.some((item) => item.code === "readiness-overclaim"));

  const malformedGate = readJson("valid-verification-production.json");
  malformedGate.details.productionGate = [];
  const malformedResult = validateResult(malformedGate);
  assert.equal(malformedResult.valid, false);
  assert.ok(malformedResult.issues.some((item) => item.code === "invalid-object"));

  const localFindings = readJson("valid-verification-prototype.json");
  localFindings.details.localReviewFindings = [
    { "id": "low", "severity": "low", "disposition": "warning", "subject": "src/widget.mjs", "evidenceIds": ["local-review"], "impact": "Limited issue.", "recommendation": "Review later.", "resolution": { "status": "accepted-warning", "correctionFailureSignature": null, "evidenceIds": ["local-review"] } },
    { "id": "high", "severity": "high", "disposition": "objective-fix", "subject": "src/widget.mjs", "evidenceIds": ["local-review"], "impact": "Material issue.", "recommendation": "Correct separately.", "resolution": { "status": "unresolved", "correctionFailureSignature": null, "evidenceIds": [] } }
  ];
  assert.ok(validateResult(localFindings).issues.some((item) => item.code === "findings-not-deterministically-ordered"));
});

test("selected-check results must agree with their referenced evidence", () => {
  for (const evidenceResult of ["failed", "informational"]) {
    const value = readJson("valid-verification-prototype.json");
    value.evidence.find((item) => item.id === "focused").result = evidenceResult;
    const result = validateResult(value);
    assert.ok(result.issues.some((item) => item.code === "check-evidence-result-mismatch"), evidenceResult);
  }
});

test("local findings require an evidence-backed nonblocking resolution", () => {
  const finding = {
    id: "local-high",
    severity: "high",
    disposition: "objective-fix",
    subject: "src/widget.mjs",
    evidenceIds: ["local-review"],
    impact: "The implementation can return the wrong value.",
    recommendation: "Apply and verify the bounded correction.",
    resolution: { status: "unresolved", correctionFailureSignature: null, evidenceIds: [] }
  };

  const unresolved = readJson("valid-verification-prototype.json");
  unresolved.details.localReviewFindings = [finding];
  assert.ok(validateResult(unresolved).issues.some((item) => item.code === "readiness-overclaim"));

  const corrected = readJson("valid-verification-prototype.json");
  corrected.details.localReviewFindings = [{
    ...finding,
    resolution: { status: "corrected", correctionFailureSignature: "local-high", evidenceIds: ["focused"] }
  }];
  corrected.details.correctionAttempts = [{
    failureSignature: "local-high",
    attempt: 1,
    kind: "objective-fix",
    result: "passed",
    evidenceIds: ["focused"],
    binding: "workspace-state-1"
  }];
  assert.deepEqual(validateResult(corrected), { valid: true, issues: [] });

  const overAuthorizedBudget = clone(corrected);
  overAuthorizedBudget.details.correctionAttempts.push({
    ...overAuthorizedBudget.details.correctionAttempts[0],
    attempt: 2
  });
  const narrowAuthorization = localImplementationAuthorization(overAuthorizedBudget);
  narrowAuthorization.authorization.correctionBudgetPerFailureSignature = 1;
  const overAuthorizedResult = validateImplementationQualityResultRaw(overAuthorizedBudget, { localImplementationAuthorization: narrowAuthorization });
  assert.ok(overAuthorizedResult.issues.some((item) => item.code === "correction-budget-authorization-mismatch"));
  assert.ok(overAuthorizedResult.issues.some((item) => item.code === "correction-attempt-not-authorized"));
  assert.ok(overAuthorizedResult.issues.some((item) => item.code === "readiness-overclaim"));

  const malformedDurableRecord = localImplementationAuthorization(corrected);
  malformedDurableRecord.checkpoint.selectedEntry.correctionRecords[0].current = false;
  const malformedDurableResult = validateImplementationQualityResultRaw(corrected, { localImplementationAuthorization: malformedDurableRecord });
  assert.ok(malformedDurableResult.issues.some((item) => item.code === "local-implementation-authorization-invalid"));

  const unrelatedDurableEvidence = localImplementationAuthorization(corrected);
  unrelatedDurableEvidence.checkpoint.selectedEntry.correctionRecords[0].verification.evidenceIds = ["local-review"];
  const unrelatedDurableResult = validateImplementationQualityResultRaw(corrected, { localImplementationAuthorization: unrelatedDurableEvidence });
  assert.ok(unrelatedDurableResult.issues.some((item) => item.code === "correction-history-not-durable"));

  const falsePassedCorrection = clone(corrected);
  falsePassedCorrection.evidence.find((item) => item.id === "focused").result = "failed";
  falsePassedCorrection.details.selectedChecks.find((item) => item.evidenceId === "focused").result = "failed";
  const falsePassedResult = validateResult(falsePassedCorrection);
  assert.ok(falsePassedResult.issues.some((item) => item.code === "correction-evidence-result-mismatch"));
  assert.ok(falsePassedResult.issues.some((item) => item.code === "finding-correction-not-passed"));
  assert.ok(falsePassedResult.issues.some((item) => item.code === "readiness-overclaim"));

  const unrelatedCorrectionEvidence = clone(corrected);
  unrelatedCorrectionEvidence.details.localReviewFindings[0].resolution.evidenceIds = ["local-review"];
  assert.ok(validateResult(unrelatedCorrectionEvidence).issues.some((item) => item.code === "finding-correction-evidence-mismatch"));

  const duplicateCorrectionEvidence = clone(corrected);
  duplicateCorrectionEvidence.details.localReviewFindings[0].resolution.evidenceIds = ["correction", "correction"];
  assert.ok(validateResult(duplicateCorrectionEvidence).issues.some((item) => item.code === "duplicate-evidence-reference"));
  assert.ok(validateResult(duplicateCorrectionEvidence).issues.some((item) => item.code === "finding-correction-evidence-mismatch"));

  const warning = readJson("valid-verification-prototype.json");
  warning.details.localReviewFindings = [{
    ...finding,
    id: "local-warning",
    severity: "low",
    disposition: "warning",
    resolution: { status: "accepted-warning", correctionFailureSignature: null, evidenceIds: ["local-review"] }
  }];
  assert.deepEqual(validateResult(warning), { valid: true, issues: [] });

  const highWarning = readJson("valid-verification-prototype.json");
  highWarning.details.localReviewFindings = [{
    ...finding,
    id: "high-warning",
    disposition: "warning",
    resolution: { status: "accepted-warning", correctionFailureSignature: null, evidenceIds: ["local-review"] }
  }];
  assert.ok(validateResult(highWarning).issues.some((item) => item.code === "readiness-overclaim"));

  const humanDecision = readJson("valid-verification-prototype.json");
  humanDecision.details.localReviewFindings = [{
    ...finding,
    id: "human-decision",
    disposition: "human-decision",
    resolution: { status: "corrected", correctionFailureSignature: "local-high", evidenceIds: ["focused"] }
  }];
  humanDecision.details.correctionAttempts = corrected.details.correctionAttempts;
  assert.ok(validateResult(humanDecision).issues.some((item) => item.code === "finding-resolution-disposition-mismatch"));
});

test("profile readiness requires every common, production, and applicable UI check", () => {
  for (const fixture of ["valid-verification-prototype.json", "valid-verification-production.json"]) {
    const baseline = readJson(fixture);
    for (const check of baseline.details.selectedChecks) {
      const value = clone(baseline);
      value.details.selectedChecks = value.details.selectedChecks.filter((item) => item.id !== check.id);
      const result = validateResult(value);
      assert.ok(result.issues.some((item) => item.code === "missing-required-profile-check" && item.detail === check.id), `${fixture}: ${check.id}`);
    }
  }

  const ui = readJson("valid-verification-prototype.json");
  ui.details.uiScope = { kind: "web", layoutChanged: true, materiallyChanged: true };
  const requiredUi = [
    ["chromium-desktop-1440x900", "browser"],
    ["chromium-mobile-web-390x844", "device"],
    ["critical-ui-interaction", "browser"],
    ["desktop-current-screenshot", "browser"],
    ["mobile-current-screenshot", "browser"],
    ["axe-core", "accessibility"],
    ["manual-keyboard-semantics", "accessibility"]
  ];
  for (const [id, category] of requiredUi) {
    ui.evidence.push({ id, type: category === "accessibility" ? "accessibility" : "test", subject: id, result: "passed" });
    ui.details.selectedChecks.push({ id, category, required: true, result: "passed", evidenceId: id });
    ui.details.evidenceBindings.push({ evidenceId: id, binding: { kind: "workspace", value: "workspace-state-1" }, changedPaths: ["src/widget.mjs"] });
  }
  assert.deepEqual(validateResult(ui), { valid: true, issues: [] });
  for (const [id] of requiredUi) {
    const value = clone(ui);
    value.details.selectedChecks = value.details.selectedChecks.filter((item) => item.id !== id);
    const result = validateResult(value);
    assert.ok(result.issues.some((item) => item.code === "missing-required-profile-check" && item.detail === id), id);
  }

  const inapplicableUi = clone(ui);
  const uiCheck = inapplicableUi.details.selectedChecks.find((item) => item.id === "critical-ui-interaction");
  uiCheck.result = "not-applicable";
  uiCheck.applicabilityReason = "The interaction does not exist in this fixture.";
  inapplicableUi.evidence.find((item) => item.id === uiCheck.evidenceId).result = "not-applicable";
  const inapplicableUiResult = validateResult(inapplicableUi);
  assert.ok(inapplicableUiResult.issues.some((item) => item.code === "readiness-overclaim"));
});

test("not-applicable checks require scope reasons and cannot bypass applicable minimums", () => {
  const unjustified = readJson("valid-verification-prototype.json");
  const focused = unjustified.details.selectedChecks.find((item) => item.id === "focused-unit-or-integration");
  focused.result = "not-applicable";
  unjustified.evidence.find((item) => item.id === focused.evidenceId).result = "not-applicable";
  const unjustifiedResult = validateResult(unjustified);
  assert.ok(unjustifiedResult.issues.some((item) => item.code === "missing-applicability-reason"));
  assert.ok(unjustifiedResult.issues.some((item) => item.code === "readiness-overclaim"));

  const scopedOut = readJson("valid-verification-prototype.json");
  scopedOut.evidence.push({ id: "browser-not-applicable", type: "test", subject: "browser evidence", result: "not-applicable" });
  scopedOut.details.selectedChecks.push({
    id: "browser-not-in-scope",
    category: "browser",
    required: true,
    result: "not-applicable",
    evidenceId: "browser-not-applicable",
    applicabilityReason: "The explicit UI scope is none."
  });
  scopedOut.details.evidenceBindings.push({
    evidenceId: "browser-not-applicable",
    binding: { kind: "workspace", value: "workspace-state-1" },
    changedPaths: ["src/widget.mjs"]
  });
  assert.deepEqual(validateResult(scopedOut), { valid: true, issues: [] });
});

test("readiness requires current evidence bindings for prototype and production checks", () => {
  for (const evidenceId of ["focused", "local-review"]) {
    const value = readJson("valid-verification-prototype.json");
    value.details.evidenceBindings.find((item) => item.evidenceId === evidenceId).binding.value = "workspace-state-old";
    const result = validateResult(value);
    assert.ok(result.issues.some((item) => item.code === "stale-evidence-binding"), evidenceId);
    assert.ok(result.issues.some((item) => item.code === "readiness-overclaim"), evidenceId);
  }

  for (const evidenceId of ["regression", "ci-current", "strict-review"]) {
    const value = readJson("valid-verification-production.json");
    value.details.evidenceBindings.find((item) => item.evidenceId === evidenceId).changedPaths = ["src/old-widget.mjs"];
    const result = validateResult(value);
    assert.ok(result.issues.some((item) => item.code === "stale-evidence-binding"), evidenceId);
    assert.ok(result.issues.some((item) => item.code === "readiness-overclaim"), evidenceId);
  }
});

test("readiness requires complete unique review coverage of changed paths", () => {
  const empty = readJson("valid-verification-prototype.json");
  empty.details.reviewedPaths = [];
  const emptyResult = validateResult(empty);
  assert.ok(emptyResult.issues.some((item) => item.code === "incomplete-reviewed-path-coverage"));
  assert.ok(emptyResult.issues.some((item) => item.code === "readiness-overclaim"));

  const partial = readJson("valid-verification-prototype.json");
  partial.details.changedPaths.push("src/helper.mjs");
  for (const binding of partial.details.evidenceBindings) binding.changedPaths.push("src/helper.mjs");
  const partialResult = validateResult(partial);
  assert.ok(partialResult.issues.some((item) => item.code === "incomplete-reviewed-path-coverage"));

  const stale = readJson("valid-verification-prototype.json");
  stale.details.reviewedPaths = ["src/old-widget.mjs"];
  assert.ok(validateResult(stale).issues.some((item) => item.code === "incomplete-reviewed-path-coverage"));

  const duplicate = readJson("valid-verification-prototype.json");
  duplicate.details.reviewedPaths.push("src/widget.mjs");
  assert.ok(validateResult(duplicate).issues.some((item) => item.code === "duplicate-reviewed-path"));
});

test("failed and exhausted correction histories cannot report readiness", () => {
  const attempt = (number) => ({
    failureSignature: "focused-regression",
    attempt: number,
    kind: "objective-fix",
    result: "failed",
    evidenceIds: ["correction-failed"],
    binding: "workspace-state-1"
  });

  const failed = readJson("valid-verification-prototype.json");
  failed.evidence.push({ id: "correction-failed", type: "test", subject: "failed correction", result: "failed" });
  failed.details.evidenceBindings.push({ evidenceId: "correction-failed", binding: { kind: "workspace", value: "workspace-state-1" }, changedPaths: ["src/widget.mjs"] });
  failed.details.correctionAttempts = [attempt(1)];
  assert.ok(validateResult(failed).issues.some((item) => item.code === "readiness-overclaim"));

  const exhausted = readJson("valid-verification-prototype.json");
  exhausted.evidence.push({ id: "correction-failed", type: "test", subject: "failed correction", result: "failed" });
  exhausted.details.evidenceBindings.push({ evidenceId: "correction-failed", binding: { kind: "workspace", value: "workspace-state-1" }, changedPaths: ["src/widget.mjs"] });
  exhausted.details.correctionAttempts = [attempt(1), attempt(2), attempt(3)];
  const invalidExhausted = validateResult(exhausted);
  assert.ok(invalidExhausted.issues.some((item) => item.code === "exhausted-correction-requires-blocked-status"));
  assert.ok(invalidExhausted.issues.some((item) => item.code === "exhausted-correction-requires-blocked-readiness"));

  exhausted.status = "blocked";
  exhausted.summary = "Verification is blocked after the configured correction budget was exhausted.";
  exhausted.details.readiness = "blocked";
  exhausted.nextAction = { kind: "user-decision", description: "Resolve the exhausted correction failure before resuming." };
  assert.deepEqual(validateResult(exhausted), { valid: true, issues: [] });

  const narrowBudget = readJson("valid-verification-prototype.json");
  narrowBudget.evidence.push({ id: "correction-failed", type: "test", subject: "failed correction", result: "failed" });
  narrowBudget.details.evidenceBindings.push({ evidenceId: "correction-failed", binding: { kind: "workspace", value: "workspace-state-1" }, changedPaths: ["src/widget.mjs"] });
  narrowBudget.status = "blocked";
  narrowBudget.summary = "Verification is blocked after the configured correction budget was exhausted.";
  narrowBudget.details.readiness = "blocked";
  narrowBudget.details.correctionBudget = 1;
  narrowBudget.details.correctionAttempts = [attempt(1)];
  narrowBudget.nextAction = { kind: "user-decision", description: "Resolve the exhausted correction failure before resuming." };
  assert.deepEqual(validateResult(narrowBudget), { valid: true, issues: [] });
});

test("historical correction evidence retains its own binding while latest passed evidence is current", () => {
  const value = readJson("valid-verification-prototype.json");
  value.evidence.push(
    { id: "correction-old", type: "test", subject: "first correction attempt", result: "failed" },
    { id: "correction-current", type: "test", subject: "second correction attempt", result: "passed" }
  );
  value.details.evidenceBindings.push(
    { evidenceId: "correction-old", binding: { kind: "workspace", value: "workspace-state-old" }, changedPaths: ["src/widget.mjs"] },
    { evidenceId: "correction-current", binding: { kind: "workspace", value: "workspace-state-1" }, changedPaths: ["src/widget.mjs"] }
  );
  value.details.correctionAttempts = [
    { failureSignature: "focused-regression", attempt: 1, kind: "objective-fix", result: "failed", evidenceIds: ["correction-old"], binding: "workspace-state-old" },
    { failureSignature: "focused-regression", attempt: 2, kind: "objective-fix", result: "passed", evidenceIds: ["correction-current"], binding: "workspace-state-1" }
  ];
  assert.deepEqual(validateResult(value), { valid: true, issues: [] });

  const mismatchedHistory = clone(value);
  mismatchedHistory.details.correctionAttempts[0].binding = "workspace-state-unrelated";
  assert.ok(validateResult(mismatchedHistory).issues.some((item) => item.code === "correction-evidence-binding-mismatch"));
});

test("canonical skills expose read-only, correction, strict-review, recovery, and profile boundaries", () => {
  const review = fs.readFileSync(path.join(root, "skills/base/base-code-review/SKILL.md"), "utf8");
  assert.match(review, /Remain read-only in interactive and autonomous modes/);
  assert.match(review, /Do not refactor, apply a\s+finding, approve delivery/s);
  assert.match(review, /blocker.*high.*medium.*low/s);
  assert.match(review, /objective-fix.*human-decision.*warning.*false-positive/s);

  const verification = fs.readFileSync(path.join(root, "skills/base/base-verification-loop/SKILL.md"), "utf8");
  assert.match(verification, /local-implementation/);
  assert.match(verification, /structured argument arrays/);
  assert.match(verification, /strict isolated independent-review/);
  assert.match(verification, /do not duplicate its package, adapter, or delivery logic/);
  assert.match(verification, /never claim that OpenSpec Verify, CI delivery/);
});

test("Claude and Codex wrappers remain thin canonical pointers", () => {
  for (const skill of ["base-code-review", "base-verification-loop"]) {
    for (const platform of [".agents", ".claude"]) {
      const text = fs.readFileSync(path.join(root, platform, "skills", skill, "SKILL.md"), "utf8");
      assert.match(text, new RegExp(`canonical: \.\.\/\.\.\/\.\.\/skills\/base\/${skill}\/SKILL\\.md`));
      assert.match(text, /must not duplicate canonical/);
      assert.ok(text.length < 750, `${platform}/${skill} is not thin`);
    }
  }
  assert.deepEqual(checkAdapterDrift(root), { valid: true, issues: [] });
});

test("scenario inventory maps every delta-spec acceptance scenario", () => {
  const scenarioInventory = readJson("../scenarios.json").scenarios;
  const mapped = new Map();
  for (const item of scenarioInventory) mapped.set(item.scenario, (mapped.get(item.scenario) ?? 0) + 1);
  const activeSpecRoot = path.join(root, "openspec/changes/add-base-implementation-quality-skills/specs");
  const archiveRoot = path.join(root, "openspec/changes/archive");
  const archivedChanges = fs.existsSync(archiveRoot)
    ? fs.readdirSync(archiveRoot).filter((name) => name.endsWith("-add-base-implementation-quality-skills"))
    : [];
  const specRoot = fs.existsSync(activeSpecRoot)
    ? activeSpecRoot
    : archivedChanges.length === 1
      ? path.join(archiveRoot, archivedChanges[0], "specs")
      : null;
  assert.ok(specRoot, `expected one active or archived implementation-quality change, found ${archivedChanges.length}`);
  const specFiles = ["base-code-review/spec.md", "base-verification-loop/spec.md"];
  const scenarios = specFiles.flatMap((file) => [...fs.readFileSync(path.join(specRoot, file), "utf8").matchAll(/^#### Scenario: (.+)$/gm)].map((match) => match[1]));
  assert.equal(scenarios.length, 30);
  const required = new Map();
  for (const scenario of scenarios) required.set(scenario, (required.get(scenario) ?? 0) + 1);
  for (const [scenario, count] of required) assert.equal(mapped.get(scenario), count, `missing scenario mapping: ${scenario}`);
  assert.equal(scenarioInventory.length, scenarios.length);
});

test("second workspace uses portable paths and no product constants", () => {
  const second = readJson("second-workspace.json");
  assert.equal(second.workspace, "workspace-b");
  assert.deepEqual(validateTrustedCheckDefinitions(second.checks), { valid: true, issues: [] });
  const text = JSON.stringify(second);
  assert.doesNotMatch(text, /jizzoe|joericearchitect|github\.com|\/Users\//i);
});
