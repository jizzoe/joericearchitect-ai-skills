import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { publishCodexCaptureReceipt, publishCodexCaptureSuccess, publishExclusiveReviewArtifact, validateCodexCaptureReceipt } from "../codex-review-event-capture.mjs";

const receipt = (overrides = {}) => ({
  schemaVersion: 1,
  transportRevision: "codex-jsonl-final-agent-v1",
  executionId: "execution-fixture",
  requestDigest: "a".repeat(64),
  cliIdentitySha256: "b".repeat(64),
  cliVersionClassification: "supported",
  exitStatus: 0,
  eventBytes: 128,
  eventCount: 4,
  candidateCount: 1,
  toolEventCount: 0,
  terminalClassification: "completed",
  artifactReceiptState: "published",
  diagnosticCode: "codex-jsonl-final-agent-complete",
  ...overrides
});

const withTemporary = (fn) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "codex-event-capture-"));
  try { fn(root); } finally { fs.rmSync(root, { recursive: true, force: true }); }
};

test("capture receipt contract is metadata-only and exact", () => {
  assert.equal(validateCodexCaptureReceipt(receipt()), true);
  assert.equal(validateCodexCaptureReceipt({ ...receipt(), rawStdout: "secret" }), false);
  assert.equal(validateCodexCaptureReceipt(receipt({ requestDigest: "bad" })), false);
  assert.equal(validateCodexCaptureReceipt(receipt({ eventBytes: -1 })), false);
});

test("exclusive publication uses one no-clobber hard-link identity", () => withTemporary((root) => {
  const target = path.join(root, "result.json");
  const body = Buffer.from('{"schemaVersion":1,"findings":[],"status":"passed"}');
  const result = publishExclusiveReviewArtifact({ destinationPath: target, content: body });
  assert.equal(result.published, true, JSON.stringify(result));
  assert.deepEqual(fs.readFileSync(target), body);
  assert.equal(fs.lstatSync(target).isSymbolicLink(), false);
  if (process.platform !== "win32") assert.equal(fs.statSync(target).mode & 0o777, 0o600);
  assert.equal(fs.readdirSync(root).some((name) => name.endsWith(".tmp")), false);
}));

test("exclusive publication never overwrites an existing file or symlink", (t) => withTemporary((root) => {
  const file = path.join(root, "existing.json");
  fs.writeFileSync(file, "canary");
  assert.equal(publishExclusiveReviewArtifact({ destinationPath: file, content: "replacement" }).code, "review-artifact-publication-destination-exists");
  assert.equal(fs.readFileSync(file, "utf8"), "canary");

  const outside = path.join(root, "outside.json");
  const linked = path.join(root, "linked.json");
  fs.writeFileSync(outside, "outside-canary");
  try { fs.symlinkSync(outside, linked); } catch (error) {
    if (["EPERM", "EACCES"].includes(error?.code)) return t.skip("filesystem does not permit symlink fixtures");
    throw error;
  }
  assert.equal(publishExclusiveReviewArtifact({ destinationPath: linked, content: "replacement" }).code, "review-artifact-publication-destination-exists");
  assert.equal(fs.readFileSync(outside, "utf8"), "outside-canary");
}));

test("a concurrent destination creator wins without being modified", () => withTemporary((root) => {
  const target = path.join(root, "race.json");
  const fileSystem = Object.create(fs);
  fileSystem.linkSync = (source, destination) => {
    fs.writeFileSync(destination, "race-winner", { flag: "wx" });
    fs.linkSync(source, destination);
  };
  const result = publishExclusiveReviewArtifact({ destinationPath: target, content: "candidate" }, { fileSystem, nonce: () => "race" });
  assert.equal(result.published, false);
  assert.equal(result.code, "review-artifact-publication-destination-exists");
  assert.equal(fs.readFileSync(target, "utf8"), "race-winner");
  assert.equal(fs.readdirSync(root).some((name) => name.endsWith(".tmp")), false);
}));

test("unsupported hard-link publication fails closed and cleans its temporary file", () => withTemporary((root) => {
  const target = path.join(root, "unsupported.json");
  const fileSystem = Object.create(fs);
  fileSystem.linkSync = () => { throw Object.assign(new Error("unsupported"), { code: "ENOTSUP" }); };
  const result = publishExclusiveReviewArtifact({ destinationPath: target, content: "candidate" }, { fileSystem, nonce: () => "unsupported" });
  assert.equal(result.code, "review-artifact-publication-hard-link-unavailable");
  assert.equal(fs.existsSync(target), false);
  assert.deepEqual(fs.readdirSync(root), []);
}));

test("publication rejects an unsafe or changed owned directory", (t) => withTemporary((root) => {
  if (process.platform === "win32") return t.skip("POSIX mode ownership fixture");
  const publicDirectory = path.join(root, "public");
  fs.mkdirSync(publicDirectory, { mode: 0o700 });
  fs.chmodSync(publicDirectory, 0o777);
  assert.equal(
    publishExclusiveReviewArtifact({ destinationPath: path.join(publicDirectory, "result.json"), content: "candidate" }).code,
    "review-artifact-publication-directory-unsafe"
  );

  const target = path.join(root, "changed-directory.json");
  const original = fs.lstatSync(root);
  const fileSystem = Object.create(fs);
  let directoryInspections = 0;
  fileSystem.lstatSync = (subject) => {
    if (subject === root && ++directoryInspections === 2) {
      return { isDirectory: () => true, isSymbolicLink: () => false, dev: original.dev + 1, ino: original.ino, uid: original.uid, mode: original.mode };
    }
    return fs.lstatSync(subject);
  };
  const changed = publishExclusiveReviewArtifact({ destinationPath: target, content: "candidate" }, { fileSystem, nonce: () => "changed" });
  assert.equal(changed.code, "review-artifact-publication-final-inspection-invalid");
  assert.equal(fs.existsSync(target), false);
  assert.equal(fs.readdirSync(root).some((name) => name.endsWith(".tmp")), false);
}));

test("a non-advancing write fails closed without spinning", () => withTemporary((root) => {
  const target = path.join(root, "short-write.json");
  const fileSystem = Object.create(fs);
  fileSystem.writeSync = () => 0;
  const result = publishExclusiveReviewArtifact({ destinationPath: target, content: "candidate" }, { fileSystem, nonce: () => "short-write" });
  assert.equal(result.code, "review-artifact-publication-failed");
  assert.equal(fs.existsSync(target), false);
  assert.deepEqual(fs.readdirSync(root), []);
}));

test("success publishes findings and receipt, while receipt loss removes only the owned result", () => withTemporary((root) => {
  const resultPath = path.join(root, "result.json");
  const receiptPath = path.join(root, "receipt.json");
  const candidateText = '{"schemaVersion":1,"findings":[],"status":"passed"}';
  const success = publishCodexCaptureSuccess({ resultPath, receiptPath, candidateText, receipt: receipt() });
  assert.equal(success.published, true, JSON.stringify(success));
  assert.equal(fs.readFileSync(resultPath, "utf8"), candidateText);
  assert.deepEqual(JSON.parse(fs.readFileSync(receiptPath, "utf8")), receipt());

  const secondResult = path.join(root, "second-result.json");
  const occupiedReceipt = path.join(root, "occupied-receipt.json");
  fs.writeFileSync(occupiedReceipt, "unowned-canary");
  const failed = publishCodexCaptureSuccess({ resultPath: secondResult, receiptPath: occupiedReceipt, candidateText, receipt: receipt() });
  assert.equal(failed.published, false);
  assert.equal(failed.code, "codex-capture-receipt-publication-failed");
  assert.equal(failed.cleanupComplete, true);
  assert.equal(fs.existsSync(secondResult), false);
  assert.equal(fs.readFileSync(occupiedReceipt, "utf8"), "unowned-canary");
}));

test("success publication revalidates the final candidate before creating either artifact", () => withTemporary((root) => {
  const resultPath = path.join(root, "invalid-result.json");
  const receiptPath = path.join(root, "invalid-receipt.json");
  const result = publishCodexCaptureSuccess({
    resultPath,
    receiptPath,
    candidateText: '{"schemaVersion":1,"findings":[],"status":"passed","extra":true}',
    receipt: receipt()
  });
  assert.equal(result.code, "codex-capture-success-payload-invalid");
  assert.equal(fs.existsSync(resultPath), false);
  assert.equal(fs.existsSync(receiptPath), false);
}));

test("an unavailable receipt can be atomically published without a findings artifact", () => withTemporary((root) => {
  const receiptPath = path.join(root, "unavailable-receipt.json");
  const unavailable = receipt({ exitStatus: 1, terminalClassification: "failed", artifactReceiptState: "absent", diagnosticCode: "codex-jsonl-turn-failed" });
  const result = publishCodexCaptureReceipt({ receiptPath, receipt: unavailable });
  assert.equal(result.published, true);
  assert.deepEqual(JSON.parse(fs.readFileSync(receiptPath, "utf8")), unavailable);
}));
