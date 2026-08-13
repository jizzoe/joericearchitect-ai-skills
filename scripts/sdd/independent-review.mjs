#!/usr/bin/env node
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { canonicalJson } from "./independent-review-contract.mjs";
import { validateReviewPackage, validateReviewResult } from "./independent-review-contract.mjs";
import { validateFindingDispositions } from "./review-findings.mjs";
import { validateDegradedIndependentReviewAuthorization } from "./degraded-independent-review-authorization.mjs";
// Pure evaluator for an independently executed, read-only review channel.

function nonEmpty(value) { return typeof value === "string" && value.trim().length > 0; }
function commitReference(value) { return typeof value === "string" && /^(?:[0-9a-f]{40}|[0-9a-f]{64})$/.test(value); }
function fail(code, detail) { return { allowed: false, classification: "paused", issues: [{ code, ...(detail ? { detail } : {}) }] }; }
function validTimestamp(value) { return nonEmpty(value) && !Number.isNaN(Date.parse(value)); }

export function immutableReviewManifest(reviewInput) {
  const { baseCommit, headCommit, diff, openspecArtifacts, validationEvidence } = reviewInput ?? {};
  if (!commitReference(baseCommit) || !commitReference(headCommit) || !nonEmpty(diff) ||
      !Array.isArray(openspecArtifacts) || openspecArtifacts.length === 0 ||
      !Array.isArray(validationEvidence) || validationEvidence.length === 0) return null;
  return createHash("sha256").update(canonicalJson({ baseCommit, headCommit, diff, openspecArtifacts, validationEvidence })).digest("hex");
}

// The configured adapter supplies its repository path; this read-only check
// derives the only acceptable accumulated diff from immutable object IDs.
export function reviewInputMatchesGitDiff(reviewInput, repositoryPath) {
  if (!immutableReviewManifest(reviewInput) || !nonEmpty(repositoryPath)) return false;
  try {
    const diff = execFileSync("git", ["-C", repositoryPath, "diff", "--no-ext-diff", "--no-textconv", "--binary", reviewInput.baseCommit, reviewInput.headCommit], { encoding: "utf8" });
    return diff === reviewInput.diff;
  } catch {
    return false;
  }
}

export function canonicalGitCommit(commit, repositoryPath) {
  if (!commitReference(commit) || !nonEmpty(repositoryPath)) return null;
  try {
    const resolved = execFileSync("git", ["-C", repositoryPath, "rev-parse", "--verify", `${commit}^{commit}`], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
    return resolved === commit ? resolved : null;
  } catch {
    return null;
  }
}

function reviewerIsUsable(reviewer, implementerSession) {
  return reviewer && reviewer.available === true && reviewer.nonInteractive === true &&
    reviewer.isolatedContext === true && reviewer.readOnly === true &&
    nonEmpty(reviewer.type) && nonEmpty(reviewer.identity) &&
    reviewer.identity !== implementerSession;
}

// Validates the immutable input package before an adapter invokes its configured
// reviewer. Adapters own process isolation; this policy deliberately has no
// process, workspace, GitHub, or mutation capability.
export function prepareIndependentReview({ reviewer, implementerSession, reviewInput = {} }) {
  if (!reviewer?.available) return fail("independent-reviewer-unavailable");
  if (reviewer.identity === implementerSession) return fail("independent-review-self-review");
  if (!reviewerIsUsable(reviewer, implementerSession)) return fail("independent-reviewer-not-isolated-read-only");
  const { baseCommit, headCommit, diff, openspecArtifacts, validationEvidence } = reviewInput;
  const manifest = immutableReviewManifest(reviewInput);
  if (!manifest) {
    return fail("independent-review-input-incomplete");
  }
  return { allowed: true, classification: "ready", issues: [], reviewManifest: manifest, reviewInput: {
    baseCommit, headCommit, diff, openspecArtifacts, validationEvidence
  } };
}

// Accepts only evidence tied to the exact immutable review input. A review that
// has blocker or high objective-fix findings cannot certify the delivery gate.
export function validateIndependentReviewEvidence({ reviewer, implementerSession, expectedBase, expectedHead, expectedReviewManifest, applyEvidence, evidence }) {
  if (!reviewer?.available) return fail("independent-reviewer-unavailable");
  if (reviewer.identity === implementerSession || evidence?.reviewer?.identity === implementerSession) return fail("independent-review-self-review");
  if (!reviewerIsUsable(reviewer, implementerSession)) return fail("independent-reviewer-not-isolated-read-only");
  if (!commitReference(expectedBase) || !commitReference(expectedHead) || !nonEmpty(expectedReviewManifest)) return fail("independent-review-input-incomplete");
  if (!evidence || typeof evidence !== "object" || evidence.reviewer?.type !== reviewer.type ||
      evidence.reviewer?.identity !== reviewer.identity || !nonEmpty(evidence.executionRef) ||
      !nonEmpty(evidence.invocationRef) || !validTimestamp(evidence.timestamp) ||
      !Array.isArray(evidence.findings) || !Array.isArray(evidence.dispositions) ||
      !commitReference(evidence.reviewedBase) || !commitReference(evidence.reviewedHead) ||
      !nonEmpty(evidence.inputManifest) || !nonEmpty(evidence.applyEvidenceRef) || !nonEmpty(evidence.finalStatus)) {
    return fail("independent-review-evidence-malformed");
  }
  if (evidence.reviewedBase !== expectedBase || evidence.reviewedHead !== expectedHead) {
    return fail("independent-review-evidence-stale-head");
  }
  if (evidence.inputManifest !== expectedReviewManifest) return fail("independent-review-evidence-manifest-mismatch");
  if (!applyEvidence || applyEvidence.current !== true || applyEvidence.headCommit !== expectedHead ||
      !nonEmpty(applyEvidence.reference) || evidence.applyEvidenceRef !== applyEvidence.reference ||
      !validTimestamp(applyEvidence.completedAt) || Date.parse(evidence.timestamp) < Date.parse(applyEvidence.completedAt)) return fail("independent-review-apply-evidence-mismatch");
  const blocking = evidence.findings.find((finding) => finding?.severity === "blocker" ||
    (finding?.severity === "high" && finding?.classification === "objective-fix"));
  if (blocking || evidence.finalStatus !== "clear") return fail("independent-review-findings-unresolved", blocking?.id);
  return { allowed: true, classification: "authorized", issues: [] };
}

// V1 result records are additive during migration. The legacy evidence
// evaluator above remains available to existing checkpoints and callers.
export function strictSummaryMatchesResult(summary, result) {
  return summary?.reviewRecordId === result?.reviewRecordId && summary.executionId === result.executionId &&
    summary.adapter === result.reviewer?.adapter && summary.status === "unavailable" &&
    summary.unavailableCode === result.unavailableCode && summary.baseCommit === result.baseCommit &&
    summary.headCommit === result.headCommit && summary.manifestDigest === result.manifestDigest;
}

export function degradedAuthorizationMatchesResult(result, authorization) {
  return result?.change === authorization?.change && result.transition === authorization.transition &&
    result.expiresAt === authorization.expiresAt && result.riskReason === authorization.riskReason &&
    result.fallbackBoundary === authorization.fallbackBoundary;
}

export function validateIndependentReviewV1({ reviewer, degradedReviewer, authorization, selectedEntry, transition = "merge-pr", implementerSession, reviewPackage, reviewResult, strictUnavailableResult, applyEvidence, dispositions = [], correctionAttempts = 0, seenRecordIds = new Set(), derivedCorrection = false, correctionEvidence, now }) {
  if (!reviewer?.available) return fail("independent-reviewer-unavailable");
  const packageValidation = validateReviewPackage(reviewPackage);
  if (!packageValidation.valid) return fail(packageValidation.issues[0].code);
  if (!applyEvidence || applyEvidence.current !== true || applyEvidence.headCommit !== reviewPackage.headCommit ||
      JSON.stringify(applyEvidence.validationEvidence) !== JSON.stringify(reviewPackage.validationEvidence)) return fail("independent-review-apply-evidence-mismatch");
  const selectedReviewer = reviewResult?.assuranceLevel === "authorized-degraded" ? degradedReviewer : reviewer;
  if (!selectedReviewer?.available) return fail("degraded-independent-reviewer-not-configured");
  const resultValidation = validateReviewResult(reviewResult, {
    expectedPackage: reviewPackage,
    configuredReviewer: selectedReviewer,
    implementerSession,
    seenRecordIds
  });
  if (!resultValidation.valid) return fail(resultValidation.issues[0].code);
  if (reviewResult.status === "unavailable") return fail(reviewResult.unavailableCode);
  if (reviewResult.status !== "passed") return fail("independent-review-findings-unresolved");
  if (reviewResult.assuranceLevel === "authorized-degraded") {
    const strictValidation = validateReviewResult(strictUnavailableResult, {
      expectedPackage: reviewPackage, configuredReviewer: reviewer, implementerSession
    });
    if (!strictValidation.valid || strictUnavailableResult.status !== "unavailable" ||
        strictUnavailableResult.assuranceLevel !== "strict-isolated" ||
        !strictSummaryMatchesResult(reviewResult.strictUnavailable, strictUnavailableResult)) {
      return fail("independent-review-strict-unavailable-not-durable");
    }
    const authorizationCheck = validateDegradedIndependentReviewAuthorization({ authorization, selectedEntry, transition, reviewPackage,
      strictResult: strictUnavailableResult, correctionAttempts, derivedCorrection, correctionEvidence, now });
    if (!authorizationCheck.allowed) return authorizationCheck;
    if (!degradedAuthorizationMatchesResult(reviewResult.degradedAuthorization, authorizationCheck.authorization)) {
      return fail("independent-review-degraded-authorization-mismatch");
    }
  }
  const dispositionValidation = validateFindingDispositions({ findings: reviewResult.findings, dispositions, correctionAttempts });
  if (!dispositionValidation.allowed) return dispositionValidation;
  return { allowed: true, classification: "authorized", issues: [] };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.error("This module is imported by deterministic validators and tests.");
  process.exit(2);
}
