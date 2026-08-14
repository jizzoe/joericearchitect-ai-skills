#!/usr/bin/env node
import { operationVocabulary } from "../validation/validate-base-skill-contracts.mjs";
import { inspectCheckpoint } from "./checkpoint.mjs";
import { canonicalFailureSignature } from "./correction-chain.mjs";
import { canonicalGitCommit, immutableReviewManifest, reviewInputMatchesGitDiff, validateIndependentReviewEvidence, validateIndependentReviewV1 } from "./independent-review.mjs";

export const profileOperations = {
  "research-read-only": new Set(["read-source", "write-findings", "write-sources", "write-result", "notify-state"]),
  "local-implementation": new Set(["read-workspace", "local-edit", "run-test", "run-validation", "objective-correction", "write-result", "notify-state"]),
  "tracker-maintenance": new Set(["read-tracker", "backup-tracker", "upsert-allowlisted-record", "write-reconciliation-report", "write-result", "notify-state"]),
  "sdd-delivery": new Set(["read-workspace", "run-test", "run-validation", "issue-create-or-update", "project-update", "draft-pr-create-or-update", "run-lifecycle-action", "write-result", "notify-state"])
};

export const highImpactLifecycleActions = new Set(["merge-pr", "archive-change", "delete-merged-topic-branch"]);
const deliveryProfiles = new Set(["production-rapid", "prototype-rapid"]);
const lifecycleActions = new Set(["sync-change", ...highImpactLifecycleActions]);
const lifecycleTargetPrefixes = {
  "merge-pr": "pr:",
  "archive-change": "change:",
  "delete-merged-topic-branch": "branch:",
  "sync-change": "sync:"
};
const lifecycleCheckpointSteps = {
  "merge-pr": "merge-pr",
  "sync-change": "sync-change",
  "archive-change": "archive-change",
  "delete-merged-topic-branch": "delete-merged-topic-branch"
};
const canonicalLifecycleSteps = ["issue", "branch", "pr", "merge-pr", "sync-change", "archive-change", "delete-merged-topic-branch"];
const prerequisiteRecordKinds = {
  "merge-pr": ["issue", "branch", "pr"],
  "sync-change": ["issue", "branch", "pr", "sync"],
  "archive-change": ["issue", "branch", "pr", "sync", "change"],
  "delete-merged-topic-branch": ["issue", "branch", "pr", "sync", "change", "branch"]
};

function nonEmpty(value) { return typeof value === "string" && value.trim().length > 0; }
function commitReference(value) { return typeof value === "string" && /^(?:[0-9a-f]{40}|[0-9a-f]{64})$/i.test(value); }
function fail(code, detail) { return { allowed: false, classification: "paused", issues: [{ code, ...(detail ? { detail } : {}) }] }; }

function targetMatches(authorized, requested) {
  if (authorized === requested) return true;
  if (typeof authorized !== "string" || typeof requested !== "string") return false;
  if (!authorized.startsWith("workspace:") || !requested.startsWith("workspace:")) return false;
  const root = authorized.slice("workspace:".length).replace(/\/$/, "");
  const target = requested.slice("workspace:".length);
  return root.length > 0 && (target === root || target.startsWith(`${root}/`));
}

function derivedTargetMatches(authorization, request) {
  const derived = authorization?.derivedTargets;
  const entry = request?.selectedEntry;
  const record = request?.derivedRecord;
  if (!derived || !nonEmpty(entry) || !record || typeof record !== "object") return false;
  if (!Array.isArray(derived.queue) || !derived.queue.includes(entry)) return false;
  if (derived.selectedEntry !== entry || !nonEmpty(derived.repository)) return false;
  if (!nonEmpty(record.kind) || !nonEmpty(record.id) || !nonEmpty(record.repository)) return false;
  if (record.repository !== derived.repository || record.entry !== entry) return false;
  if (request.target !== `${record.kind}:${record.id}`) return false;
  if (record.kind === "branch" || record.kind === "pr") {
    if (!nonEmpty(record.baseBranch) || !commitReference(record.headCommit)) return false;
    if (!commitReference(request.headCommit) || request.headCommit !== record.headCommit) return false;
  }
  if (request.lifecycleAction === "merge-pr" && record.kind !== "pr") return false;
  if (request.lifecycleAction === "archive-change" && record.kind !== "change") return false;
  if (request.lifecycleAction === "delete-merged-topic-branch" && record.kind !== "branch") return false;
  if (request.lifecycleAction === "sync-change" && record.kind !== "sync") return false;
  if (request.evidenceCurrent !== true && highImpactLifecycleActions.has(request.lifecycleAction)) return false;
  return true;
}

function durableDerivedRecordMatches(request) {
  const entry = request.checkpoint?.selectedEntry;
  if (!entry || entry.name !== request.selectedEntry || !Array.isArray(entry.records)) return false;
  const record = request.derivedRecord;
  const matches = entry.records.filter((candidate) => candidate?.entry === record?.entry &&
    candidate.kind === record?.kind && candidate.id === record?.id &&
    candidate.repository === record?.repository && candidate.baseBranch === record?.baseBranch &&
    candidate.headCommit === record?.headCommit && candidate.evidence?.reference === record?.evidence?.reference &&
    candidate.evidence?.current === true && candidate.evidence?.headCommit === record?.evidence?.headCommit);
  const candidate = matches[0];
  if (matches.length !== 1 || !candidate || request.evidenceReference !== candidate.evidence.reference) return false;
  if (candidate.headCommit && (candidate.evidence.headCommit !== candidate.headCommit || request.evidenceHeadCommit !== candidate.headCommit)) return false;
  return true;
}

function publicSourceMatches(authorization, request) {
  if (request.operation !== "read-source" || !nonEmpty(request.target)) return false;
  if (request.requiresAuthentication === true || request.privateSource === true || request.executesSource === true) return false;
  const scopes = authorization?.publicSourceScopes;
  return Array.isArray(scopes) && scopes.some((scope) => nonEmpty(scope) && request.target.startsWith(scope));
}

function authorizationExpired(authorization, now) {
  const expiration = authorization?.expiresAt ?? authorization?.stoppingConditions?.expiresAt;
  if (!expiration) return false;
  const when = Date.parse(expiration);
  return Number.isNaN(when) || when <= Date.parse(now ?? new Date().toISOString());
}

function adapterAllows(config, runtime, adapterName, operation) {
  const adapter = config?.adapters?.[adapterName];
  if (!adapter?.enabled || !adapter.operations?.includes(operation)) return false;
  const capabilities = runtime?.adapterCapabilities?.[adapterName];
  return Array.isArray(capabilities) && capabilities.includes(operation);
}

function durableReviewMatches(request) {
  const entry = request.checkpoint?.selectedEntry;
  const records = entry?.reviewRecords?.filter((candidate) => candidate.id === request.reviewRecordId) ?? [];
  const record = records[0];
  if (records.length !== 1 || !record || entry.name !== request.selectedEntry || record.entry !== request.selectedEntry ||
      record.transition !== request.lifecycleAction || !record.evidence) return false;
  return JSON.stringify(record.evidence) === JSON.stringify(request.independentReviewEvidence);
}

function durableReviewV1Matches(request) {
  const entry = request.checkpoint?.selectedEntry;
  const records = entry?.reviewRecords?.filter((candidate) => candidate.id === request.independentReviewResult?.reviewRecordId) ?? [];
  const record = records[0];
  return records.length === 1 && record?.entry === request.selectedEntry && record.transition === request.lifecycleAction &&
    JSON.stringify(record.reviewPackage) === JSON.stringify(request.independentReviewPackage) &&
    JSON.stringify(record.result) === JSON.stringify(request.independentReviewResult) &&
    JSON.stringify(record.dispositions ?? []) === JSON.stringify(request.reviewDispositions ?? []) &&
    (request.independentReviewResult?.assuranceLevel !== "authorized-degraded" ||
      (JSON.stringify(record.strictUnavailable) === JSON.stringify(request.independentReviewResult.strictUnavailable) &&
       JSON.stringify(record.degradedAuthorization) === JSON.stringify(request.independentReviewResult.degradedAuthorization) &&
       JSON.stringify(record.capabilityLedger) === JSON.stringify(request.independentReviewResult.capabilityLedger)));
}

function durableStrictUnavailableRecord(request) {
  if (request.independentReviewResult?.assuranceLevel !== "authorized-degraded") return null;
  const summary = request.independentReviewResult.strictUnavailable;
  const records = request.checkpoint?.selectedEntry?.strictUnavailableRecords ?? [];
  const matching = records.filter((record) => record.id === summary?.reviewRecordId && record.entry === request.selectedEntry &&
    record.transition === request.lifecycleAction && record.current === true &&
    JSON.stringify(record.reviewPackage) === JSON.stringify(request.independentReviewPackage));
  return matching.length === 1 ? matching[0] : null;
}

function durableApplyEvidenceMatches(request) {
  const records = request.checkpoint?.selectedEntry?.applyEvidenceRecords;
  const supplied = request.applyEvidence;
  if (!Array.isArray(records) || !supplied || typeof supplied !== "object") return false;
  const matches = records.filter((candidate) => candidate?.reference === supplied.reference);
  return matches.length === 1 && JSON.stringify(matches[0]) === JSON.stringify(supplied) &&
    supplied.current === true && supplied.headCommit === request.headCommit;
}

function configuredReviewer(config, requested) {
  const reviewer = config?.independentReviewer;
  const attestation = reviewer?.attestation;
  if (!reviewer?.enabled || !nonEmpty(reviewer.type) || !nonEmpty(reviewer.identity) ||
      !nonEmpty(attestation?.ref) || attestation.nonInteractive !== true ||
      attestation.isolatedContext !== true || attestation.readOnly !== true ||
      requested?.type !== reviewer.type || requested?.identity !== reviewer.identity) return null;
  return { available: true, type: reviewer.type, identity: reviewer.identity,
    attestation: { ref: attestation.ref }, nonInteractive: true, isolatedContext: true, readOnly: true };
}

function configuredDegradedReviewer(config, requested) {
  const reviewer = config?.degradedIndependentReviewer;
  const attestation = reviewer?.attestation;
  if (!reviewer?.enabled || !nonEmpty(reviewer.type) || !nonEmpty(reviewer.identity) ||
      !nonEmpty(attestation?.ref) || attestation.nonInteractive !== true ||
      attestation.freshContext !== true || requested?.type !== reviewer.type ||
      requested?.identity !== reviewer.identity) return null;
  return { available: true, type: reviewer.type, identity: reviewer.identity,
    attestation: { ref: attestation.ref }, nonInteractive: true,
    isolatedContext: false, readOnly: false };
}

function canonicalLifecycleCheckpointMatches(request) {
  const entry = request.checkpoint?.selectedEntry;
  const steps = request.checkpoint?.steps;
  if (!entry || !Array.isArray(steps) || steps.length !== canonicalLifecycleSteps.length ||
      !steps.every((step, index) => step?.id === canonicalLifecycleSteps[index])) return false;
  const requiredKinds = prerequisiteRecordKinds[request.lifecycleAction] ?? [];
  const kinds = entry.records?.map((record) => record.kind) ?? [];
  return requiredKinds.every((kind) => kinds.filter((value) => value === kind).length >= (kind === "branch" && request.lifecycleAction === "delete-merged-topic-branch" ? 2 : 1));
}

function durableCorrectionState(authorization, request) {
  const budget = authorization.correctionBudgetPerFailureSignature;
  if (!Number.isInteger(budget) || budget < 0 || budget > 3) return fail("correction-budget-invalid");
  const failureSignature = canonicalFailureSignature(request.failureSource);
  if (!nonEmpty(request.selectedEntry) || !failureSignature) return fail("correction-context-incomplete");
  const authorizedEntries = new Set([
    ...(Array.isArray(authorization.target?.entries) ? authorization.target.entries : []),
    ...(nonEmpty(authorization.derivedTargets?.selectedEntry) ? [authorization.derivedTargets.selectedEntry] : [])
  ]);
  if (!authorizedEntries.has(request.selectedEntry) || request.checkpoint?.selectedEntry?.name !== request.selectedEntry) {
    return fail("correction-entry-not-authorized", request.selectedEntry);
  }
  const checkpoint = inspectCheckpoint(request.checkpoint ?? {});
  if (checkpoint.classification === "human-decision" || checkpoint.classification === "stale-evidence") {
    return fail("correction-checkpoint-not-valid", checkpoint.reason);
  }
  const records = request.checkpoint?.selectedEntry?.correctionRecords;
  if (!Array.isArray(records)) return fail("correction-checkpoint-not-valid", "selected-entry-invalid-correction-records");
  let sourceDurable = false;
  if (request.failureSource.kind === "independent-review") {
    const reviewRecords = request.checkpoint?.selectedEntry?.reviewRecords ?? [];
    const sourceRecords = reviewRecords.filter((record) => record?.id === request.failureSource.reviewRecordId &&
      record.transition === request.failureSource.transition);
    const durableFindings = sourceRecords[0]?.result?.findings ?? sourceRecords[0]?.findings;
    const sourceFindings = durableFindings?.filter((finding) =>
      finding.id === request.failureSource.findingId && finding.severity === request.failureSource.severity &&
      finding.evidence === request.failureSource.evidence) ?? [];
    sourceDurable = sourceRecords.length === 1 && sourceFindings.length === 1;
  } else if (request.failureSource.kind === "verification") {
    const verificationRecords = request.checkpoint?.selectedEntry?.verificationRecords ?? [];
    const matches = verificationRecords.filter((record) =>
      record?.id === request.failureSource.verificationRecordId && record.entry === request.selectedEntry &&
      record.transition === request.failureSource.transition && record.current === true &&
      record.failureSignature === request.failureSource.failureSignature &&
      record.evidence === request.failureSource.evidence);
    sourceDurable = matches.length === 1;
  }
  if (!sourceDurable) return fail("correction-failure-source-not-durable", failureSignature);
  if (request.failureSignature !== undefined && request.failureSignature !== failureSignature) {
    return fail("correction-failure-signature-mismatch", failureSignature);
  }
  const attemptsForSignature = records.filter((record) => record.failureSignature === failureSignature).length;
  if (request.correctionAttemptsForFailureSignature !== undefined &&
      request.correctionAttemptsForFailureSignature !== attemptsForSignature) {
    return fail("correction-attempt-count-mismatch", failureSignature);
  }
  if (request.correctionAttempts !== undefined && request.correctionAttempts !== records.length) {
    return fail("correction-chain-length-mismatch", failureSignature);
  }
  if (attemptsForSignature >= budget) return fail("correction-limit-exhausted", failureSignature);
  return null;
}

export function checkOperationAuthorization(input) {
  const { authorization = {}, runtime = {}, config = {}, request = {} } = input;
  const profile = request.profile;
  const operation = request.operation;
  if (!profileOperations[profile]) return fail("unknown-profile", profile);
  if (!operationVocabulary.has(operation)) return fail("unknown-operation", operation);
  if (!profileOperations[profile].has(operation)) return fail("operation-not-in-profile", operation);
  if (!authorization.allowedMutations?.includes(operation)) return fail("operation-not-authorized", operation);
  const exactTarget = authorization.targets?.some((target) => targetMatches(target, request.target));
  const derivedTarget = derivedTargetMatches(authorization, request);
  const publicSource = publicSourceMatches(authorization, request);
  if (lifecycleActions.has(request.lifecycleAction) && authorization.derivedTargets) {
    const checkpoint = inspectCheckpoint(request.checkpoint ?? {});
    if (checkpoint.classification === "human-decision" || checkpoint.classification === "stale-evidence") return fail("derived-checkpoint-not-valid", checkpoint.reason);
    if (!canonicalLifecycleCheckpointMatches(request)) return fail("derived-checkpoint-schema-invalid");
    if (checkpoint.firstIncomplete !== lifecycleCheckpointSteps[request.lifecycleAction]) return fail("derived-transition-out-of-order", checkpoint.firstIncomplete);
  }
  if (lifecycleActions.has(request.lifecycleAction) && authorization.derivedTargets && !derivedTarget) return fail("derived-record-not-durable", request.target);
  if (!exactTarget && !derivedTarget && !publicSource) return fail("unauthorized-target", request.target);
  if (derivedTarget && !durableDerivedRecordMatches(request)) return fail("derived-record-not-durable", request.target);
  if (authorizationExpired(authorization, input.now)) return fail("expired-authorization");
  if (runtime.permissionGaps?.length || (Array.isArray(runtime.permittedOperations) && !runtime.permittedOperations.includes(operation))) return fail("runtime-permission-gap", operation);
  if (request.adapter && !authorization.targets?.includes(`adapter:${request.adapter}`)) return fail("unauthorized-adapter", request.adapter);
  if (request.adapter && !adapterAllows(config, runtime, request.adapter, operation)) return fail("adapter-capability-mismatch", request.adapter);
  if (operation === "objective-correction") {
    const correctionIssue = durableCorrectionState(authorization, request);
    if (correctionIssue) return correctionIssue;
  }
  if (operation === "run-lifecycle-action" && !lifecycleActions.has(request.lifecycleAction)) return fail("unnamed-or-unsupported-lifecycle-action");
  if (highImpactLifecycleActions.has(request.lifecycleAction)) {
    if (profile !== "sdd-delivery") return fail("high-impact-action-profile-mismatch", request.lifecycleAction);
    if (!request.target?.startsWith(lifecycleTargetPrefixes[request.lifecycleAction])) return fail("lifecycle-target-type-mismatch", request.lifecycleAction);
    if (!nonEmpty(request.recovery)) return fail("missing-recovery", request.lifecycleAction);
    if (request.evidenceCurrent !== true) return fail("incomplete-lifecycle-evidence", request.lifecycleAction);
    if (!deliveryProfiles.has(authorization.qualityProfile) ||
        !deliveryProfiles.has(request.deliveryProfile) ||
        request.deliveryProfile !== authorization.qualityProfile) {
      return fail("delivery-profile-authorization-mismatch", request.deliveryProfile);
    }
    if (authorization.qualityProfile === "production-rapid") {
      if (request.independentReviewPackage || request.independentReviewResult) {
        if (!request.independentReviewPackage || !request.independentReviewResult) return fail("independent-review-v1-input-incomplete");
        if (!durableApplyEvidenceMatches(request)) return fail("independent-review-apply-evidence-not-durable");
        if (!durableReviewV1Matches(request)) return fail("independent-review-evidence-not-durable");
        const strictUnavailableRecord = durableStrictUnavailableRecord(request);
        if (request.independentReviewResult.assuranceLevel === "authorized-degraded" && !strictUnavailableRecord) return fail("independent-review-strict-unavailable-not-durable");
        const reviewer = configuredReviewer(config, request.independentReviewResult.assuranceLevel === "authorized-degraded" ? request.strictReviewer : request.reviewer);
        if (!reviewer) return fail("independent-reviewer-not-configured");
        const degradedReviewer = request.independentReviewResult.assuranceLevel === "authorized-degraded"
          ? configuredDegradedReviewer(config, request.reviewer) : reviewer;
        if (!degradedReviewer) return fail("degraded-independent-reviewer-not-configured");
        return validateIndependentReviewV1({ reviewer, implementerSession: request.implementerSession, reviewPackage: request.independentReviewPackage,
          reviewResult: request.independentReviewResult, applyEvidence: request.applyEvidence, dispositions: request.reviewDispositions ?? [],
          strictUnavailableResult: strictUnavailableRecord?.result,
          correctionAttempts: request.correctionAttempts ?? 0, seenRecordIds: new Set(request.seenReviewRecordIds ?? []),
          degradedReviewer, authorization, selectedEntry: request.selectedEntry, transition: request.lifecycleAction,
          derivedCorrection: request.derivedCorrection === true,
          correctionEvidence: request.checkpoint?.selectedEntry?.correctionRecords?.at(-1), now: input.now });
      }
      const reviewInput = request.independentReviewInput;
      const manifest = immutableReviewManifest(reviewInput);
      if (!manifest || reviewInput.baseCommit !== request.baseCommit || reviewInput.headCommit !== request.headCommit) return fail("independent-review-input-incomplete");
      if (!durableApplyEvidenceMatches(request)) return fail("independent-review-apply-evidence-not-durable");
      if (JSON.stringify(reviewInput.openspecArtifacts) !== JSON.stringify(config.requiredOpenSpecArtifacts) ||
          JSON.stringify(reviewInput.validationEvidence) !== JSON.stringify(request.applyEvidence?.validationEvidence)) return fail("independent-review-input-evidence-mismatch");
      if (!nonEmpty(config.reviewRepositoryPath) || request.reviewRepositoryPath !== config.reviewRepositoryPath) return fail("independent-review-repository-mismatch");
      if (!canonicalGitCommit(request.baseCommit, request.reviewRepositoryPath) || !canonicalGitCommit(request.headCommit, request.reviewRepositoryPath)) return fail("independent-review-commit-not-canonical");
      if (!reviewInputMatchesGitDiff(reviewInput, request.reviewRepositoryPath)) return fail("independent-review-diff-provenance-mismatch");
      if (!durableReviewMatches(request)) return fail("independent-review-evidence-not-durable");
      const reviewer = configuredReviewer(config, request.reviewer);
      if (!reviewer) return fail("independent-reviewer-not-configured");
      const review = validateIndependentReviewEvidence({ reviewer, implementerSession: request.implementerSession, expectedBase: request.baseCommit, expectedHead: request.headCommit, expectedReviewManifest: manifest, applyEvidence: request.applyEvidence, evidence: request.independentReviewEvidence });
      if (!review.allowed) return review;
    }
  }
  return { allowed: true, classification: "authorized", issues: [] };
}

export function checkDeliveryPreapproval(input) {
  const { executionMode, deliveryProfile, request = {}, preapproval, runtime = {} } = input;
  if (!highImpactLifecycleActions.has(request.lifecycleAction)) return { allowed: true, classification: "authorized", issues: [] };
  if (executionMode === "interactive" && deliveryProfile === "production-rapid") return fail("just-in-time-approval-required", request.lifecycleAction);
  if (executionMode !== "interactive" || deliveryProfile !== "prototype-rapid") return fail("delivery-preapproval-not-eligible", request.lifecycleAction);
  if (!preapproval || preapproval.operation !== request.lifecycleAction || preapproval.target !== request.target) return fail("preapproval-target-or-operation-mismatch");
  if (!request.target?.startsWith(lifecycleTargetPrefixes[request.lifecycleAction])) return fail("lifecycle-target-type-mismatch", request.lifecycleAction);
  if (!nonEmpty(preapproval.recovery) || preapproval.evidenceCurrent !== true) return fail("incomplete-delivery-preapproval");
  const expires = Date.parse(preapproval.expiresAt);
  if (Number.isNaN(expires) || expires <= Date.parse(input.now ?? new Date().toISOString())) return fail("expired-delivery-preapproval");
  if (runtime.permissionGaps?.length || (Array.isArray(runtime.permittedOperations) && !runtime.permittedOperations.includes("run-lifecycle-action"))) return fail("runtime-permission-gap", "run-lifecycle-action");
  return { allowed: true, classification: "authorized", issues: [] };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.error("This module is imported by deterministic validators and tests.");
  process.exit(2);
}
