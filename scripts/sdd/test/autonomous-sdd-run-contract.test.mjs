import assert from "node:assert/strict";
import test from "node:test";

import {
  RECORD_KINDS, RUN_CONTRACT_VERSION, buildParentProjection, deriveRepositoryId, deserializeDomainRecord,
  normalizeCanonicalRemote, serializeDomainRecord, validateDomainRecord
} from "../autonomous-sdd-run-contract.mjs";

const hash = (value) => value.repeat(64).slice(0, 64);
const binding = (id) => ({ id, digest: hash("a") });
const summary = {
  workUnitId: "work-unit-001", ordinal: 1, approvedChangeId: "example-change", terminalStatus: "complete",
  terminalReason: "verified", startedAt: "2026-08-20T12:00:00.000Z", terminalAt: "2026-08-20T12:01:00.000Z",
  finalHead: "a".repeat(40), attemptCount: 1, correctionCount: 0, claimDisposition: "released",
  cleanupDisposition: "completed", childHistoryReference: "children/work-unit-001", childHistoryDigest: hash("b"), terminalSummaryDigest: hash("c")
};
const parent = {
  kind: "parent-run", schemaVersion: RUN_CONTRACT_VERSION, parentRunId: "parent-run-001", approvedIntentDigest: hash("d"),
  deadline: "2026-08-20T16:00:00.000Z", historyBinding: binding("local-history"), claimProviderBinding: binding("native-claim"), children: [summary]
};
const workUnit = {
  kind: "work-unit", schemaVersion: RUN_CONTRACT_VERSION, workUnitId: "work-unit-001", parentRunId: "parent-run-001",
  ordinal: 1, approvedChangeId: "example-change", authorizationDigest: hash("e"), configurationDigest: hash("f"),
  lifecycleState: "admitted", evidenceNamespace: "evidence-001", historyBinding: binding("local-history"), claimProviderBinding: binding("native-claim")
};

test("canonical remote identities ignore clone form and reject credentials", () => {
  assert.equal(normalizeCanonicalRemote("git@github.com:Owner/Repository.git"), "github.com/owner/repository");
  assert.equal(normalizeCanonicalRemote("https://github.com/Owner/Repository.git"), "github.com/owner/repository");
  assert.equal(deriveRepositoryId("git@github.com:Owner/Repository.git"), deriveRepositoryId("https://github.com/Owner/Repository.git"));
  assert.equal(normalizeCanonicalRemote("https://user:secret@github.com/owner/repository.git"), null);
  assert.equal(normalizeCanonicalRemote("/tmp/repository"), null);
});

test("parent summaries reject copied child-owned data and duplicate identities", () => {
  assert.equal(validateDomainRecord(parent).valid, true);
  const copied = structuredClone(parent);
  copied.children[0].authorizationDigest = hash("f");
  assert.equal(validateDomainRecord(copied).reason, "invalid-domain-record");
  const duplicate = structuredClone(parent);
  duplicate.children.push(structuredClone(summary));
  assert.equal(validateDomainRecord(duplicate).reason, "invalid-domain-record");
});

test("projection keeps only the terminal summary allowlist", () => {
  const result = buildParentProjection(parent, workUnit, summary);
  assert.equal(result.valid, true);
  assert.deepEqual(Object.keys(result.projection.children[0]).sort(), Object.keys(summary).sort());
  assert.equal("authorizationDigest" in result.projection.children[0], false);
});

test("portable serialization rejects unknown kinds and round-trips domain content", () => {
  const serialized = serializeDomainRecord(workUnit);
  assert.equal(serialized.valid, true);
  assert.equal(deserializeDomainRecord(serialized.content).valid, true);
  assert.equal(validateDomainRecord({ kind: "vendor-workflow", schemaVersion: RUN_CONTRACT_VERSION }).reason, "unknown-record-kind");
});

test("every declared v2 record kind has a strict portable fixture", () => {
  const records = [
    { kind: "repository", schemaVersion: RUN_CONTRACT_VERSION, repositoryId: `r1-${hash("1")}`, canonicalRemoteDigest: hash("2"), historyBinding: binding("local-history"), claimProviderBinding: binding("native-claim") },
    parent,
    workUnit,
    { kind: "transition-attempt", schemaVersion: RUN_CONTRACT_VERSION, attemptId: "attempt-001", workUnitId: "work-unit-001", idempotencyKey: "issue-1", preconditionDigest: hash("3"), targetDigest: hash("4"), ownershipGeneration: 1, state: "completed", receipt: {}, result: {} },
    { kind: "resource-claim", schemaVersion: RUN_CONTRACT_VERSION, claimId: "claim-001", repositoryId: `r1-${hash("1")}`, workUnitId: "work-unit-001", owner: { host: "fixture" }, ownershipGeneration: 1, providerBinding: binding("native-claim"), state: "active", acquiredAt: "2026-08-20T12:00:00.000Z", recoveryEvidence: {} },
    { kind: "evidence", schemaVersion: RUN_CONTRACT_VERSION, evidenceId: "evidence-001", workUnitId: "work-unit-001", subject: "focused test", contentDigest: hash("5"), createdAt: "2026-08-20T12:00:00.000Z" },
    buildParentProjection(parent, workUnit, summary).projection,
    { kind: "archive-manifest", schemaVersion: RUN_CONTRACT_VERSION, parentRunId: "parent-run-001", archivedAt: "2026-08-20T12:02:00.000Z", reason: "verified", projectionDigest: hash("6") },
    { kind: "legacy-classification", schemaVersion: RUN_CONTRACT_VERSION, reference: "runs/legacy/controller.json", classification: "ambiguous", reason: "schema-incomplete", recordDigest: hash("7") }
  ];
  assert.deepEqual(records.map((record) => record.kind).sort(), [...RECORD_KINDS].sort());
  for (const record of records) assert.equal(validateDomainRecord(record).valid, true, record.kind);
});
