import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { advanceControllerRecord, authorizationDigest, createControllerRecord, inspectControllerRecord, persistControllerRecord } from "../autonomous-sdd-controller.mjs";
import { inspectCheckpoint } from "../checkpoint.mjs";
import { checkAdapterDrift } from "../check-adapter-drift.mjs";
import { resolveSddDeliveryRequest } from "../resolve-sdd-delivery-request.mjs";

const started = "2026-08-13T12:00:00.000Z";
const authorization = resolveSddDeliveryRequest({ target: "complete-delivery", mode: "autonomous", qualityProfile: "production-rapid", authorizationProfile: "sdd-delivery", independentReviewPolicy: "strict-only", expiration: "12h" }, { goalStartedAt: started }).effectiveAuthorization;
const created = createControllerRecord({ authorization, repository: "owner/repository", checkpointPath: "openspec/changes/complete-delivery/evidence/run.json" });

test("controller record starts at planning and resumes first incomplete phase", () => {
  assert.equal(created.valid, true);
  assert.deepEqual(inspectControllerRecord(created.record, { authorization, repository: "owner/repository", now: started }), { classification: "continue", reason: "controller-first-incomplete-phase", nextPhase: "propose" });
  const resumed = structuredClone(created.record);
  resumed.steps[0] = { id: "propose", status: "complete", evidence: { current: true } };
  resumed.steps[1] = { id: "planning-review", status: "complete", evidence: { current: true } };
  assert.equal(inspectControllerRecord(resumed, { authorization, repository: "owner/repository", now: started }).nextPhase, "apply");
});

test("controller rejects expired, stale, and conflicting context", () => {
  assert.equal(inspectControllerRecord(created.record, { authorization, repository: "other/repository", now: started }).reason, "controller-context-conflict");
  assert.equal(inspectControllerRecord(created.record, { authorization, repository: "owner/repository", now: "2026-08-14T01:00:00.000Z" }).reason, "controller-context-expired");
  const stale = structuredClone(created.record);
  stale.steps[0] = { id: "propose", status: "complete", evidence: { current: false } };
  assert.deepEqual(inspectControllerRecord(stale, { authorization, repository: "owner/repository", now: started }), { classification: "continue", reason: "controller-phase-stale", nextPhase: "propose" });
  const forgedSelection = structuredClone(created.record);
  forgedSelection.selectedEntry = "different-change";
  assert.equal(inspectControllerRecord(forgedSelection, { authorization, repository: "owner/repository", now: started }).reason, "controller-context-conflict");
  const differentTarget = structuredClone(authorization);
  differentTarget.target = { kind: "change", entries: ["different-change"] };
  assert.notEqual(authorizationDigest(authorization), authorizationDigest(differentTarget));
});

test("every lifecycle entry resumes only the first incomplete controller phase", () => {
  const phases = ["propose", "planning-review", "apply", "verify", "delivery", "sync", "archive", "cleanup"];
  for (let index = 0; index < phases.length; index += 1) {
    const record = structuredClone(created.record);
    for (let completed = 0; completed < index; completed += 1) {
      record.steps[completed] = { id: phases[completed], status: "complete", evidence: { current: true } };
    }
    assert.equal(inspectControllerRecord(record, { authorization, repository: "owner/repository", now: started }).nextPhase, phases[index]);
  }
});

test("controller persists only contained paths and advances ordered current evidence", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "controller-record-"));
  try {
    const persisted = persistControllerRecord({ repositoryPath: root, record: created.record });
    assert.equal(persisted.valid, true);
    assert.deepEqual(JSON.parse(fs.readFileSync(persisted.path, "utf8")).steps, created.record.steps);
    assert.equal(fs.readdirSync(path.dirname(persisted.path)).some((entry) => entry.endsWith(".tmp")), false);
    assert.equal(persistControllerRecord({ repositoryPath: root, record: { ...created.record, checkpointPath: "../escape.json" } }).reason, "controller-record-path-escape");
    const outside = fs.mkdtempSync(path.join(os.tmpdir(), "controller-outside-"));
    fs.symlinkSync(outside, path.join(root, "linked"));
    assert.equal(persistControllerRecord({ repositoryPath: root, record: { ...created.record, checkpointPath: "linked/record.json" } }).reason, "controller-record-path-symlink");
    assert.equal(fs.existsSync(path.join(outside, "record.json")), false);
    fs.rmSync(outside, { recursive: true, force: true });
    assert.equal(advanceControllerRecord(created.record, "planning-review", { current: true }).reason, "controller-phase-advance-out-of-order");
    const advanced = advanceControllerRecord(created.record, "propose", { current: true, reference: "proposal" });
    assert.equal(advanced.valid, true);
    assert.equal(advanced.record.currentPhase, "planning-review");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("checkpoint rejects malformed cleanup ownership records", () => {
  assert.equal(inspectCheckpoint({ selectedEntry: { name: "change", records: [], cleanupRecords: [{ entry: "other", kind: "branch", id: "feature", owned: true, deliveryCurrent: true }] }, steps: [] }).reason, "invalid-cleanup-record");
});

test("controller and cleanup adapters remain thin and point at canonical policy", () => {
  assert.deepEqual(checkAdapterDrift(process.cwd()), { valid: true, issues: [] });
});
