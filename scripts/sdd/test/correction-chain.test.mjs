import assert from "node:assert/strict";
import test from "node:test";

import { canonicalCorrectionSignature, canonicalFailureSignature, inspectCorrectionChain } from "../correction-chain.mjs";

const source = (findingId, evidence, transition = "merge-pr") => ({
  kind: "independent-review",
  reviewRecordId: "review-1",
  findingId,
  severity: "objective-fix",
  evidence,
  transition
});

test("failure signatures preserve existing durable path-valued signatures", () => {
  assert.equal(
    canonicalFailureSignature(source("finding-1", "scripts/sdd/correction-chain.mjs")),
    "independent-review/finding-1/scripts/sdd/correction-chain.mjs/merge-pr"
  );
});

test("failure signature boundaries cannot collide through slash or percent values", () => {
  assert.notEqual(
    canonicalFailureSignature(source("a/b", "c")),
    canonicalFailureSignature(source("a", "b/c"))
  );
  assert.notEqual(
    canonicalFailureSignature(source("a/b", "c")),
    canonicalFailureSignature(source("a%2Fb", "c"))
  );
  assert.notEqual(
    canonicalFailureSignature(source("a", "c/d", "e")),
    canonicalFailureSignature(source("a", "c", "d/e"))
  );
});

test("verification failure signatures come from their durable source field", () => {
  const verification = { kind: "verification", verificationRecordId: "verification-1", failureSignature: "focused-regression", evidence: "evidence/focused.json", transition: "openspec-verify" };
  assert.equal(canonicalFailureSignature(verification), "focused-regression");
  assert.equal(canonicalFailureSignature({ ...verification, verificationRecordId: "" }), null);
  assert.equal(canonicalFailureSignature({ ...verification, failureSignature: "" }), null);
});

const dimensions = (artifact = "scripts/sdd/correction-chain.mjs", errorClass = "assertion-failure") => ({
  gate: "focused-tests",
  errorClass,
  artifact,
  transition: "apply",
  taskBatch: "batch-2"
});

test("canonical v2 signatures ignore superficial output and distinguish stable dimensions", () => {
  const left = { ...dimensions(), rawOutput: "failed at 12:01 in /tmp/run-1", retryId: "one" };
  const right = { ...dimensions(), rawOutput: "different wording at 12:02 in /tmp/run-2", retryId: "two" };
  assert.equal(canonicalCorrectionSignature(left), canonicalCorrectionSignature(right));
  assert.notEqual(canonicalCorrectionSignature(left), canonicalCorrectionSignature(dimensions("scripts/sdd/other.mjs")));
  assert.equal(canonicalCorrectionSignature({ ...dimensions(), artifact: "/tmp/not-repository-relative" }), null);
});

function v2Record({ index, signatureDimensions, signatureAttempt, strategy, diagnostic, result = "passed", stagnation = false }) {
  const failureSource = {
    kind: "verification",
    signatureVersion: 2,
    verificationRecordId: `verification-${index}`,
    canonicalDimensions: signatureDimensions,
    evidence: `evidence/verification-${index}.json`
  };
  return {
    id: `correction-${index}`,
    change: "quality-change",
    attempt: index,
    signatureAttempt,
    signatureVersion: 2,
    classification: "objective-fix",
    behaviorPreserving: true,
    current: true,
    ancestryVerified: true,
    failureSignature: canonicalFailureSignature(failureSource),
    failureSource,
    evidenceReference: `evidence/correction-${index}.json`,
    baseCommit: "0".repeat(40),
    previousHead: String(index).repeat(40),
    headCommit: String(index + 1).repeat(40),
    previousManifestDigest: String(index + 2).repeat(64),
    manifestDigest: String(index + 3).repeat(64),
    diagnosticHypothesis: `bounded hypothesis ${index}`,
    affectedArtifacts: [signatureDimensions.artifact],
    strategyDigest: strategy.repeat(64),
    diagnosticEvidenceDigest: diagnostic.repeat(64),
    result,
    rerunEvidenceIds: [`rerun-${index}`],
    stagnation
  };
}

const anchor = { baseCommit: "0".repeat(40), headCommit: "1".repeat(40), manifestDigest: "3".repeat(64) };

test("distinct signatures may exceed three aggregate corrections and report distinct progress", () => {
  const records = [
    v2Record({ index: 1, signatureDimensions: dimensions("src/a.mjs"), signatureAttempt: 1, strategy: "a", diagnostic: "1" }),
    v2Record({ index: 2, signatureDimensions: dimensions("src/b.mjs"), signatureAttempt: 1, strategy: "b", diagnostic: "2" }),
    v2Record({ index: 3, signatureDimensions: dimensions("src/c.mjs"), signatureAttempt: 1, strategy: "c", diagnostic: "3" }),
    v2Record({ index: 4, signatureDimensions: dimensions("src/d.mjs"), signatureAttempt: 1, strategy: "d", diagnostic: "4" })
  ];
  const inspected = inspectCorrectionChain(records, { selectedEntry: "quality-change", anchor });
  assert.equal(inspected.valid, true);
  assert.equal(inspected.aggregateAttempts, 4);
  assert.equal(inspected.distinctFailureSignatures, 4);
  assert.equal(inspected.intervention, null);
});

test("repeated strategy is durable stagnation and an exhausted stable signature blocks", () => {
  const records = [
    v2Record({ index: 1, signatureDimensions: dimensions(), signatureAttempt: 1, strategy: "a", diagnostic: "1", result: "failed" }),
    v2Record({ index: 2, signatureDimensions: dimensions(), signatureAttempt: 2, strategy: "a", diagnostic: "1", result: "failed", stagnation: true }),
    v2Record({ index: 3, signatureDimensions: dimensions(), signatureAttempt: 3, strategy: "b", diagnostic: "2", result: "failed" })
  ];
  const inspected = inspectCorrectionChain(records, { selectedEntry: "quality-change", anchor });
  const signature = records[0].failureSignature;
  assert.equal(inspected.valid, true);
  assert.equal(inspected.stagnationByFailureSignature.get(signature), 1);
  assert.deepEqual(inspected.exhaustedFailureSignatures, [signature]);
  assert.equal(inspected.intervention.classification, "blocked");

  const fourth = v2Record({ index: 4, signatureDimensions: dimensions(), signatureAttempt: 4, strategy: "c", diagnostic: "3", result: "failed" });
  assert.equal(inspectCorrectionChain([...records, fourth], { selectedEntry: "quality-change", anchor }).reason, "selected-entry-invalid-correction-records");
  const forged = structuredClone(records);
  forged[1].stagnation = false;
  assert.equal(inspectCorrectionChain(forged, { selectedEntry: "quality-change", anchor }).reason, "invalid-objective-correction-record");
});
