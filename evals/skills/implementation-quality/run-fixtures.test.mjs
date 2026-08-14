import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import { checkAdapterDrift } from "../../../scripts/sdd/check-adapter-drift.mjs";
import {
  authorizeVerificationOperation,
  evaluateProductionReadiness,
  evaluateVerificationLoop,
  renderImplementationQualityMarkdown,
  selectVerificationChecks,
  sortReviewFindings,
  validateImplementationQualityResult,
  validateTrustedCheckDefinitions,
  verificationStages
} from "../../../scripts/validation/lib/implementation-quality.mjs";

const root = path.resolve(new URL("../../..", import.meta.url).pathname);
const fixtures = path.join(root, "evals/skills/implementation-quality/fixtures");
const readJson = (name) => JSON.parse(fs.readFileSync(path.join(fixtures, name), "utf8"));
const clone = (value) => structuredClone(value);

test("valid code-review result is findings-first and shared-contract compliant", () => {
  const result = readJson("valid-code-review.json");
  assert.deepEqual(validateImplementationQualityResult(result), { valid: true, issues: [] });
  const markdown = renderImplementationQualityMarkdown(result);
  assert.ok(markdown.indexOf("## Findings") < markdown.indexOf("## Evidence Gaps"));
  assert.ok(markdown.indexOf("## Evidence Gaps") < markdown.indexOf("## Summary"));
  assert.match(markdown, /HIGH finding-high-validation/);
});

test("review validator rejects malformed, duplicate, unsafe, unsupported, and misordered findings", () => {
  const misordered = validateImplementationQualityResult(readJson("invalid-code-review-misordered.json"));
  assert.equal(misordered.valid, false);
  assert.ok(misordered.issues.some((item) => item.code === "findings-not-deterministically-ordered"));

  const cases = [
    ["duplicate", (value) => { value.details.findings[1].id = value.details.findings[0].id; }, "duplicate-finding-id"],
    ["unsafe path", (value) => { value.details.findings[0].subject = "../outside.mjs"; }, "unsafe-workspace-path"],
    ["unsupported severity", (value) => { value.details.findings[0].severity = "critical"; }, "invalid-finding-severity"],
    ["unknown details key", (value) => { value.details.extra = true; }, "unknown-key"],
    ["sensitive details", (value) => { value.details.scopeSummary = ["ghp_", "A".repeat(20)].join(""); }, "sensitive-value"],
    ["personal data field", (value) => { value.details.pii = "synthetic@example.invalid"; }, "sensitive-key"]
  ];
  for (const [name, mutate, code] of cases) {
    const value = readJson("valid-code-review.json");
    mutate(value);
    const result = validateImplementationQualityResult(value);
    assert.equal(result.valid, false, name);
    assert.ok(result.issues.some((item) => item.code === code), `${name}: ${JSON.stringify(result.issues)}`);
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
  const correctionRecords = Array.from({ length: 3 }, (_, index) => ({
    id: `correction-${index + 1}`,
    change: "quality-change",
    attempt: index + 1,
    classification: "objective-fix",
    behaviorPreserving: true,
    current: true,
    ancestryVerified: true,
    failureSignature: "validation-failure",
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
    correctionAttemptsForFailureSignature: 3,
    correctionAttempts: 3,
    checkpoint: { selectedEntry: { name: "quality-change", records: [], correctionRecords }, steps: [] }
  });
  assert.equal(correction.issues[0].code, "correction-limit-exhausted");
  const freshSignature = authorizeVerificationOperation({
    ...input,
    authorization: correctionAuthorization,
    operation: "objective-correction",
    selectedEntry: "quality-change",
    failureSignature: "fresh-failure",
    correctionAttemptsForFailureSignature: 0,
    correctionAttempts: 3,
    checkpoint: { selectedEntry: { name: "quality-change", records: [], correctionRecords }, steps: [] }
  });
  assert.equal(freshSignature.allowed, true);
  const missingPerSignature = authorizeVerificationOperation({
    ...input,
    authorization: correctionAuthorization,
    operation: "objective-correction",
    selectedEntry: "quality-change",
    failureSignature: "fresh-failure",
    correctionAttempts: 3,
    checkpoint: { selectedEntry: { name: "quality-change", records: [], correctionRecords }, steps: [] }
  });
  assert.equal(missingPerSignature.issues[0].code, "invalid-correction-attempt-count");
  assert.equal(authorizeVerificationOperation({ ...input, runtime: { permissionGaps: ["local-edit"] } }).issues[0].code, "runtime-permission-gap");
});

test("prototype and strict production results validate without lifecycle overclaim", () => {
  for (const fixture of ["valid-verification-prototype.json", "valid-verification-production.json"]) {
    const value = readJson(fixture);
    assert.deepEqual(validateImplementationQualityResult(value), { valid: true, issues: [] }, fixture);
    assert.match(renderImplementationQualityMarkdown(value), /ready-for-openspec-verify/);
    assert.doesNotMatch(value.summary, /merge|archive|delivery complete/i);
  }
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
  assert.deepEqual(validateImplementationQualityResult(value), { valid: true, issues: [] });
});

test("production gate is exact-head, strict, fresh, and independent", () => {
  const head = "1".repeat(40);
  const ciEvidence = { status: "passed", head };
  const gate = { source: "isolated-independent-review", assurance: "strict-isolated", status: "passed", head, reviewerSession: "reviewer-1", implementerSession: "implementer-1", evidenceId: "review-1" };
  assert.deepEqual(evaluateProductionReadiness({ currentHead: head, ciEvidence, independentReviewGate: gate }), { ready: true, reason: "current-strict-evidence" });
  assert.equal(evaluateProductionReadiness({ currentHead: head, ciEvidence: { ...ciEvidence, head: "2".repeat(40) }, independentReviewGate: gate }).reason, "ci-evidence-not-current");
  assert.equal(evaluateProductionReadiness({ currentHead: head, ciEvidence, independentReviewGate: { ...gate, head: "2".repeat(40) } }).reason, "strict-review-wrong-head");
  assert.equal(evaluateProductionReadiness({ currentHead: head, ciEvidence, independentReviewGate: { ...gate, status: "unavailable" } }).reason, "strict-review-unavailable");
  assert.equal(evaluateProductionReadiness({ currentHead: head, ciEvidence, independentReviewGate: { ...gate, reviewerSession: "implementer-1" } }).reason, "strict-review-not-independent");
  assert.equal(evaluateProductionReadiness({ currentHead: head, ciEvidence, independentReviewGate: { ...gate, assurance: "unverified" } }).reason, "strict-review-required");
});

test("result validator rejects readiness overclaim, stale production head, and self review", () => {
  const overclaim = readJson("valid-verification-prototype.json");
  overclaim.details.selectedChecks[0].result = "failed";
  overclaim.evidence.find((item) => item.id === "focused").result = "failed";
  assert.ok(validateImplementationQualityResult(overclaim).issues.some((item) => item.code === "readiness-overclaim"));

  const wrongHead = readJson("valid-verification-production.json");
  wrongHead.details.productionGate.reviewHead = "2".repeat(40);
  assert.ok(validateImplementationQualityResult(wrongHead).issues.some((item) => item.code === "production-head-mismatch"));

  const selfReview = readJson("valid-verification-production.json");
  selfReview.details.productionGate.reviewerSession = selfReview.details.productionGate.implementerSession;
  assert.ok(validateImplementationQualityResult(selfReview).issues.some((item) => item.code === "reviewer-not-independent"));

  const skippedProductionGates = readJson("valid-verification-production.json");
  skippedProductionGates.details.selectedChecks.find((item) => item.id === "exact-head-ci").result = "not-applicable";
  skippedProductionGates.details.selectedChecks.find((item) => item.id === "strict-independent-review").result = "not-applicable";
  const skippedGateResult = validateImplementationQualityResult(skippedProductionGates);
  assert.ok(skippedGateResult.issues.some((item) => item.code === "readiness-overclaim"));

  const missingProductionGateCheck = readJson("valid-verification-production.json");
  missingProductionGateCheck.details.selectedChecks = missingProductionGateCheck.details.selectedChecks.filter((item) => item.id !== "strict-independent-review");
  assert.ok(validateImplementationQualityResult(missingProductionGateCheck).issues.some((item) => item.code === "missing-production-check"));

  const mismatchedProductionEvidence = readJson("valid-verification-production.json");
  mismatchedProductionEvidence.details.selectedChecks.find((item) => item.id === "exact-head-ci").evidenceId = "focused";
  const mismatchedEvidenceResult = validateImplementationQualityResult(mismatchedProductionEvidence);
  assert.ok(mismatchedEvidenceResult.issues.some((item) => item.code === "production-check-evidence-mismatch"));
  assert.ok(mismatchedEvidenceResult.issues.some((item) => item.code === "readiness-overclaim"));

  const nonCiEvidence = readJson("valid-verification-production.json");
  nonCiEvidence.evidence.find((item) => item.id === "ci-current").type = "review";
  assert.ok(validateImplementationQualityResult(nonCiEvidence).issues.some((item) => item.code === "ci-evidence-missing"));

  const staleCiHead = readJson("valid-verification-production.json");
  staleCiHead.details.productionGate.ciHead = "2".repeat(40);
  assert.ok(validateImplementationQualityResult(staleCiHead).issues.some((item) => item.code === "ci-head-mismatch"));

  const invalidCiSource = readJson("valid-verification-production.json");
  invalidCiSource.details.productionGate.ciSource = "local-validation";
  assert.ok(validateImplementationQualityResult(invalidCiSource).issues.some((item) => item.code === "invalid-ci-source"));

  const staleCorrection = readJson("valid-verification-production.json");
  staleCorrection.details.correctionAttempts.push({
    failureSignature: "review-finding",
    attempt: 1,
    kind: "objective-fix",
    result: "passed",
    evidenceIds: ["focused"],
    binding: "2".repeat(40)
  });
  const staleCorrectionResult = validateImplementationQualityResult(staleCorrection);
  assert.ok(staleCorrectionResult.issues.some((item) => item.code === "stale-correction-binding"));
  assert.ok(staleCorrectionResult.issues.some((item) => item.code === "readiness-overclaim"));

  const malformedGate = readJson("valid-verification-production.json");
  malformedGate.details.productionGate = [];
  const malformedResult = validateImplementationQualityResult(malformedGate);
  assert.equal(malformedResult.valid, false);
  assert.ok(malformedResult.issues.some((item) => item.code === "invalid-object"));

  const localFindings = readJson("valid-verification-prototype.json");
  localFindings.details.localReviewFindings = [
    { "id": "low", "severity": "low", "disposition": "warning", "subject": "src/widget.mjs", "evidenceIds": ["local-review"], "impact": "Limited issue.", "recommendation": "Review later.", "resolution": { "status": "accepted-warning", "correctionFailureSignature": null, "evidenceIds": ["local-review"] } },
    { "id": "high", "severity": "high", "disposition": "objective-fix", "subject": "src/widget.mjs", "evidenceIds": ["local-review"], "impact": "Material issue.", "recommendation": "Correct separately.", "resolution": { "status": "unresolved", "correctionFailureSignature": null, "evidenceIds": [] } }
  ];
  assert.ok(validateImplementationQualityResult(localFindings).issues.some((item) => item.code === "findings-not-deterministically-ordered"));
});

test("selected-check results must agree with their referenced evidence", () => {
  for (const evidenceResult of ["failed", "informational"]) {
    const value = readJson("valid-verification-prototype.json");
    value.evidence.find((item) => item.id === "focused").result = evidenceResult;
    const result = validateImplementationQualityResult(value);
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
  assert.ok(validateImplementationQualityResult(unresolved).issues.some((item) => item.code === "readiness-overclaim"));

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
  assert.deepEqual(validateImplementationQualityResult(corrected), { valid: true, issues: [] });

  const unrelatedCorrectionEvidence = clone(corrected);
  unrelatedCorrectionEvidence.details.localReviewFindings[0].resolution.evidenceIds = ["local-review"];
  assert.ok(validateImplementationQualityResult(unrelatedCorrectionEvidence).issues.some((item) => item.code === "finding-correction-evidence-mismatch"));

  const duplicateCorrectionEvidence = clone(corrected);
  duplicateCorrectionEvidence.details.localReviewFindings[0].resolution.evidenceIds = ["correction", "correction"];
  assert.ok(validateImplementationQualityResult(duplicateCorrectionEvidence).issues.some((item) => item.code === "duplicate-evidence-reference"));
  assert.ok(validateImplementationQualityResult(duplicateCorrectionEvidence).issues.some((item) => item.code === "finding-correction-evidence-mismatch"));

  const warning = readJson("valid-verification-prototype.json");
  warning.details.localReviewFindings = [{
    ...finding,
    id: "local-warning",
    severity: "low",
    disposition: "warning",
    resolution: { status: "accepted-warning", correctionFailureSignature: null, evidenceIds: ["local-review"] }
  }];
  assert.deepEqual(validateImplementationQualityResult(warning), { valid: true, issues: [] });

  const highWarning = readJson("valid-verification-prototype.json");
  highWarning.details.localReviewFindings = [{
    ...finding,
    id: "high-warning",
    disposition: "warning",
    resolution: { status: "accepted-warning", correctionFailureSignature: null, evidenceIds: ["local-review"] }
  }];
  assert.ok(validateImplementationQualityResult(highWarning).issues.some((item) => item.code === "readiness-overclaim"));

  const humanDecision = readJson("valid-verification-prototype.json");
  humanDecision.details.localReviewFindings = [{
    ...finding,
    id: "human-decision",
    disposition: "human-decision",
    resolution: { status: "corrected", correctionFailureSignature: "local-high", evidenceIds: ["focused"] }
  }];
  humanDecision.details.correctionAttempts = corrected.details.correctionAttempts;
  assert.ok(validateImplementationQualityResult(humanDecision).issues.some((item) => item.code === "finding-resolution-disposition-mismatch"));
});

test("profile readiness requires every common, production, and applicable UI check", () => {
  for (const fixture of ["valid-verification-prototype.json", "valid-verification-production.json"]) {
    const baseline = readJson(fixture);
    for (const check of baseline.details.selectedChecks) {
      const value = clone(baseline);
      value.details.selectedChecks = value.details.selectedChecks.filter((item) => item.id !== check.id);
      const result = validateImplementationQualityResult(value);
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
  assert.deepEqual(validateImplementationQualityResult(ui), { valid: true, issues: [] });
  for (const [id] of requiredUi) {
    const value = clone(ui);
    value.details.selectedChecks = value.details.selectedChecks.filter((item) => item.id !== id);
    const result = validateImplementationQualityResult(value);
    assert.ok(result.issues.some((item) => item.code === "missing-required-profile-check" && item.detail === id), id);
  }

  const inapplicableUi = clone(ui);
  const uiCheck = inapplicableUi.details.selectedChecks.find((item) => item.id === "critical-ui-interaction");
  uiCheck.result = "not-applicable";
  uiCheck.applicabilityReason = "The interaction does not exist in this fixture.";
  inapplicableUi.evidence.find((item) => item.id === uiCheck.evidenceId).result = "not-applicable";
  const inapplicableUiResult = validateImplementationQualityResult(inapplicableUi);
  assert.ok(inapplicableUiResult.issues.some((item) => item.code === "readiness-overclaim"));
});

test("not-applicable checks require scope reasons and cannot bypass applicable minimums", () => {
  const unjustified = readJson("valid-verification-prototype.json");
  const focused = unjustified.details.selectedChecks.find((item) => item.id === "focused-unit-or-integration");
  focused.result = "not-applicable";
  unjustified.evidence.find((item) => item.id === focused.evidenceId).result = "not-applicable";
  const unjustifiedResult = validateImplementationQualityResult(unjustified);
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
  assert.deepEqual(validateImplementationQualityResult(scopedOut), { valid: true, issues: [] });
});

test("readiness requires current evidence bindings for prototype and production checks", () => {
  for (const evidenceId of ["focused", "local-review"]) {
    const value = readJson("valid-verification-prototype.json");
    value.details.evidenceBindings.find((item) => item.evidenceId === evidenceId).binding.value = "workspace-state-old";
    const result = validateImplementationQualityResult(value);
    assert.ok(result.issues.some((item) => item.code === "stale-evidence-binding"), evidenceId);
    assert.ok(result.issues.some((item) => item.code === "readiness-overclaim"), evidenceId);
  }

  for (const evidenceId of ["regression", "ci-current", "strict-review"]) {
    const value = readJson("valid-verification-production.json");
    value.details.evidenceBindings.find((item) => item.evidenceId === evidenceId).changedPaths = ["src/old-widget.mjs"];
    const result = validateImplementationQualityResult(value);
    assert.ok(result.issues.some((item) => item.code === "stale-evidence-binding"), evidenceId);
    assert.ok(result.issues.some((item) => item.code === "readiness-overclaim"), evidenceId);
  }
});

test("readiness requires complete unique review coverage of changed paths", () => {
  const empty = readJson("valid-verification-prototype.json");
  empty.details.reviewedPaths = [];
  const emptyResult = validateImplementationQualityResult(empty);
  assert.ok(emptyResult.issues.some((item) => item.code === "incomplete-reviewed-path-coverage"));
  assert.ok(emptyResult.issues.some((item) => item.code === "readiness-overclaim"));

  const partial = readJson("valid-verification-prototype.json");
  partial.details.changedPaths.push("src/helper.mjs");
  for (const binding of partial.details.evidenceBindings) binding.changedPaths.push("src/helper.mjs");
  const partialResult = validateImplementationQualityResult(partial);
  assert.ok(partialResult.issues.some((item) => item.code === "incomplete-reviewed-path-coverage"));

  const stale = readJson("valid-verification-prototype.json");
  stale.details.reviewedPaths = ["src/old-widget.mjs"];
  assert.ok(validateImplementationQualityResult(stale).issues.some((item) => item.code === "incomplete-reviewed-path-coverage"));

  const duplicate = readJson("valid-verification-prototype.json");
  duplicate.details.reviewedPaths.push("src/widget.mjs");
  assert.ok(validateImplementationQualityResult(duplicate).issues.some((item) => item.code === "duplicate-reviewed-path"));
});

test("failed and exhausted correction histories cannot report readiness", () => {
  const attempt = (number) => ({
    failureSignature: "focused-regression",
    attempt: number,
    kind: "objective-fix",
    result: "failed",
    evidenceIds: ["focused"],
    binding: "workspace-state-1"
  });

  const failed = readJson("valid-verification-prototype.json");
  failed.details.correctionAttempts = [attempt(1)];
  assert.ok(validateImplementationQualityResult(failed).issues.some((item) => item.code === "readiness-overclaim"));

  const exhausted = readJson("valid-verification-prototype.json");
  exhausted.details.correctionAttempts = [attempt(1), attempt(2), attempt(3)];
  const invalidExhausted = validateImplementationQualityResult(exhausted);
  assert.ok(invalidExhausted.issues.some((item) => item.code === "exhausted-correction-requires-blocked-status"));
  assert.ok(invalidExhausted.issues.some((item) => item.code === "exhausted-correction-requires-blocked-readiness"));

  exhausted.status = "blocked";
  exhausted.summary = "Verification is blocked after the configured correction budget was exhausted.";
  exhausted.details.readiness = "blocked";
  exhausted.nextAction = { kind: "user-decision", description: "Resolve the exhausted correction failure before resuming." };
  assert.deepEqual(validateImplementationQualityResult(exhausted), { valid: true, issues: [] });

  const narrowBudget = readJson("valid-verification-prototype.json");
  narrowBudget.status = "blocked";
  narrowBudget.summary = "Verification is blocked after the configured correction budget was exhausted.";
  narrowBudget.details.readiness = "blocked";
  narrowBudget.details.correctionBudget = 1;
  narrowBudget.details.correctionAttempts = [attempt(1)];
  narrowBudget.nextAction = { kind: "user-decision", description: "Resolve the exhausted correction failure before resuming." };
  assert.deepEqual(validateImplementationQualityResult(narrowBudget), { valid: true, issues: [] });
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
  assert.deepEqual(validateImplementationQualityResult(value), { valid: true, issues: [] });

  const mismatchedHistory = clone(value);
  mismatchedHistory.details.correctionAttempts[0].binding = "workspace-state-unrelated";
  assert.ok(validateImplementationQualityResult(mismatchedHistory).issues.some((item) => item.code === "correction-evidence-binding-mismatch"));
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
  const specRoot = path.join(root, "openspec/changes/add-base-implementation-quality-skills/specs");
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
