#!/usr/bin/env node
import { createHash } from "node:crypto";
// Pure evaluator for an independently executed, read-only review channel.

function nonEmpty(value) { return typeof value === "string" && value.trim().length > 0; }
function commitReference(value) { return typeof value === "string" && /^[0-9a-f]{7,64}$/i.test(value); }
function fail(code, detail) { return { allowed: false, classification: "paused", issues: [{ code, ...(detail ? { detail } : {}) }] }; }
function validTimestamp(value) { return nonEmpty(value) && !Number.isNaN(Date.parse(value)); }

export function immutableReviewManifest(reviewInput) {
  const { baseCommit, headCommit, diff, openspecArtifacts, validationEvidence } = reviewInput ?? {};
  if (!commitReference(baseCommit) || !commitReference(headCommit) || !nonEmpty(diff) ||
      !Array.isArray(openspecArtifacts) || openspecArtifacts.length === 0 ||
      !Array.isArray(validationEvidence) || validationEvidence.length === 0) return null;
  return createHash("sha256").update(JSON.stringify({ baseCommit, headCommit, diff, openspecArtifacts, validationEvidence })).digest("hex");
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
export function validateIndependentReviewEvidence({ reviewer, implementerSession, expectedBase, expectedHead, expectedReviewManifest, evidence }) {
  if (!reviewer?.available) return fail("independent-reviewer-unavailable");
  if (reviewer.identity === implementerSession || evidence?.reviewer?.identity === implementerSession) return fail("independent-review-self-review");
  if (!reviewerIsUsable(reviewer, implementerSession)) return fail("independent-reviewer-not-isolated-read-only");
  if (!commitReference(expectedBase) || !commitReference(expectedHead) || !nonEmpty(expectedReviewManifest)) return fail("independent-review-input-incomplete");
  if (!evidence || typeof evidence !== "object" || evidence.reviewer?.type !== reviewer.type ||
      evidence.reviewer?.identity !== reviewer.identity || !nonEmpty(evidence.executionRef) ||
      !nonEmpty(evidence.invocationRef) || !validTimestamp(evidence.timestamp) ||
      !Array.isArray(evidence.findings) || !Array.isArray(evidence.dispositions) ||
      !commitReference(evidence.reviewedBase) || !commitReference(evidence.reviewedHead) ||
      !nonEmpty(evidence.inputManifest) || !nonEmpty(evidence.finalStatus)) {
    return fail("independent-review-evidence-malformed");
  }
  if (evidence.reviewedBase !== expectedBase || evidence.reviewedHead !== expectedHead) {
    return fail("independent-review-evidence-stale-head");
  }
  if (evidence.inputManifest !== expectedReviewManifest) return fail("independent-review-evidence-manifest-mismatch");
  const blocking = evidence.findings.find((finding) => finding?.severity === "blocker" ||
    (finding?.severity === "high" && finding?.classification === "objective-fix"));
  if (blocking || evidence.finalStatus !== "clear") return fail("independent-review-findings-unresolved", blocking?.id);
  return { allowed: true, classification: "authorized", issues: [] };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.error("This module is imported by deterministic validators and tests.");
  process.exit(2);
}
