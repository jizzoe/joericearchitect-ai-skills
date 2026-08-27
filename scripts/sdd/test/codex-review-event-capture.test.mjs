import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { EventEmitter } from "node:events";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { PassThrough } from "node:stream";
import { fileURLToPath } from "node:url";

import { buildCodexCaptureRequest, executeCodexCaptureRequest, inspectCodexCaptureReceiptArtifact, publishCodexCaptureReceipt, publishCodexCaptureSuccess, publishExclusiveReviewArtifact, validateCodexCaptureReceipt, writeCodexCaptureRequest } from "../codex-review-event-capture.mjs";

const receipt = (overrides = {}) => {
  const value = {
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
    artifactBytes: 51,
    artifactSha256: "f905fd0743a4e7fe15aa2b086a715bb2554f2d81df61528e09f44dbc5d92e06b",
    diagnosticCode: "codex-jsonl-final-agent-complete",
    attemptCount: 1,
    ...overrides
  };
  value.attempts = overrides.attempts ?? [{ attempt: 1, exitStatus: value.exitStatus, eventBytes: value.eventBytes, eventCount: value.eventCount,
    candidateCount: value.candidateCount, toolEventCount: value.toolEventCount, terminalClassification: value.terminalClassification,
    diagnosticCode: value.diagnosticCode }];
  return value;
};

const withTemporary = (fn) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "codex-event-capture-"));
  try { fn(root); } finally { fs.rmSync(root, { recursive: true, force: true }); }
};

const withTemporaryAsync = async (fn) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "codex-event-capture-"));
  try { await fn(root); } finally { fs.rmSync(root, { recursive: true, force: true }); }
};

const fileIdentity = (filePath) => {
  const realPath = fs.realpathSync(filePath);
  const entry = fs.statSync(realPath);
  return { realPath, device: entry.dev, inode: entry.ino, size: entry.size, modifiedMs: entry.mtimeMs,
    contentSha256: createHash("sha256").update(fs.readFileSync(realPath)).digest("hex"), managedMutationDenied: true };
};

const eventLine = (value) => `${JSON.stringify(value)}\n`;
const passedPayload = JSON.stringify({ schemaVersion: 1, findings: [], status: "passed" });

function childFixture(stdout, stderr = "discarded secret diagnostic", exitStatus = 0) {
  const child = new EventEmitter();
  child.stdout = new PassThrough();
  child.stderr = new PassThrough();
  child.kill = () => {};
  queueMicrotask(() => {
    child.stderr.write(stderr);
    child.stderr.end();
    child.stdout.write(stdout);
    child.stdout.end();
    child.emit("close", exitStatus);
  });
  return child;
}

function captureFixture(root, overrides = {}) {
  const capturePath = fileURLToPath(new URL("../codex-review-event-capture.mjs", import.meta.url));
  const eventContractPath = fileURLToPath(new URL("../codex-review-event-contract.mjs", import.meta.url));
  const nodeIdentity = fileIdentity(process.execPath);
  const requestPath = path.join(root, "request.json");
  const resultPath = path.join(root, "result.json");
  const receiptPath = path.join(root, "receipt.json");
  const workingDirectory = path.join(root, "review-session");
  const schemaPath = path.join(root, "schema.json");
  fs.mkdirSync(workingDirectory, { mode: 0o700 });
  fs.writeFileSync(schemaPath, "{}\n");
  const request = buildCodexCaptureRequest({
    executionId: "capture-fixture",
    mode: "strict",
    packageBinding: { baseCommit: "a".repeat(40), headCommit: "b".repeat(40), manifestDigest: "c".repeat(64) },
    expiresAt: "2099-01-01T00:00:00.000Z",
    requestPath,
    resultPath,
    receiptPath,
    workingDirectory,
    schemaPath,
    environment: { HOME: root, PATH: "/usr/bin", NO_COLOR: "1" },
    nodeIdentity,
    captureAdapterIdentity: fileIdentity(capturePath),
    eventContractIdentity: fileIdentity(eventContractPath),
    codexIdentity: nodeIdentity,
    ...overrides
  });
  assert.ok(request);
  const written = writeCodexCaptureRequest(request);
  assert.equal(written.written, true, JSON.stringify(written));
  return { request, written, capturePath, eventContractPath };
}

test("capture receipt contract is metadata-only and exact", () => {
  assert.equal(validateCodexCaptureReceipt(receipt()), true);
  assert.equal(validateCodexCaptureReceipt({ ...receipt(), rawStdout: "secret" }), false);
  assert.equal(validateCodexCaptureReceipt(receipt({ requestDigest: "bad" })), false);
  assert.equal(validateCodexCaptureReceipt(receipt({ eventBytes: -1 })), false);
  assert.equal(validateCodexCaptureReceipt(receipt({ artifactReceiptState: "absent", artifactBytes: 0, artifactSha256: "" })), false);
  assert.equal(validateCodexCaptureReceipt(receipt({ exitStatus: 1 })), false);
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
  const unavailable = receipt({ exitStatus: 1, terminalClassification: "unavailable", artifactReceiptState: "absent", artifactBytes: 0, artifactSha256: "", diagnosticCode: "codex-jsonl-turn-failed" });
  const result = publishCodexCaptureReceipt({ receiptPath, receipt: unavailable });
  assert.equal(result.published, true);
  assert.deepEqual(JSON.parse(fs.readFileSync(receiptPath, "utf8")), unavailable);
}));

test("capture authenticates raw request bytes before parsing or child launch", async () => withTemporaryAsync(async (root) => {
  const fixture = captureFixture(root);
  fs.chmodSync(fixture.request.requestPath, 0o600);
  fs.writeFileSync(fixture.request.requestPath, '{"attackerExecutable":"/tmp/attacker"}\n');
  let launches = 0;
  const outcome = await executeCodexCaptureRequest(fixture.request.requestPath, fixture.written.requestDigest, {
    spawnChild: () => { launches += 1; return childFixture(""); },
    modulePath: fixture.capturePath
  });
  assert.equal(outcome.code, "codex-capture-request-digest-mismatch");
  assert.equal(launches, 0);
  assert.equal(fs.existsSync(fixture.request.resultPath), false);
  assert.equal(fs.existsSync(fixture.request.receiptPath), false);
}));

test("capture launches only sealed JSONL argv, separates stderr, and publishes the host artifact", async () => withTemporaryAsync(async (root) => {
  const fixture = captureFixture(root);
  const stream = eventLine({ type: "thread.started", thread_id: "thread" }) +
    eventLine({ type: "turn.started" }) +
    eventLine({ type: "item.completed", item: { id: "first", type: "agent_message", text: passedPayload } }) +
    eventLine({ type: "item.completed", item: { id: "tool", type: "command_execution", command: "secret command" } }) +
    eventLine({ type: "item.completed", item: { id: "final", type: "agent_message", text: passedPayload } }) +
    eventLine({ type: "turn.completed" });
  let launch;
  const outcome = await executeCodexCaptureRequest(fixture.request.requestPath, fixture.written.requestDigest, {
    spawnChild: (executable, args, options) => {
      launch = { executable, args, options };
      return childFixture(stream, "credential=/private/secret");
    },
    modulePath: fixture.capturePath
  });
  assert.equal(outcome.completed, true, JSON.stringify(outcome));
  assert.equal(launch.executable, fixture.request.identities.codex.realPath);
  assert.deepEqual(launch.args, fixture.request.childArguments);
  assert.equal(launch.args.includes("--json"), true);
  assert.equal(launch.args.includes("--output-last-message"), false);
  assert.deepEqual(JSON.parse(fs.readFileSync(fixture.request.resultPath, "utf8")), JSON.parse(passedPayload));
  const inspected = inspectCodexCaptureReceiptArtifact(fixture.request.receiptPath);
  assert.equal(inspected.available, true, JSON.stringify(inspected));
  assert.equal(inspected.receipt.attemptCount, 1);
  assert.equal(inspected.receipt.candidateCount, 2);
  assert.equal(inspected.receipt.toolEventCount, 1);
  assert.equal(JSON.stringify(inspected).includes("credential"), false);
  assert.equal(JSON.stringify(inspected).includes("secret command"), false);
}));

test("capture preserves one incomplete attempt and permits exactly one fresh transport retry", async () => withTemporaryAsync(async (root) => {
  const fixture = captureFixture(root);
  const incomplete = eventLine({ type: "thread.started", thread_id: "thread" }) + eventLine({ type: "turn.started" });
  const complete = eventLine({ type: "thread.started", thread_id: "thread-2" }) + eventLine({ type: "turn.started" }) +
    eventLine({ type: "item.completed", item: { id: "final", type: "agent_message", text: passedPayload } }) + eventLine({ type: "turn.completed" });
  let launches = 0;
  const outcome = await executeCodexCaptureRequest(fixture.request.requestPath, fixture.written.requestDigest, {
    spawnChild: () => childFixture(launches++ === 0 ? incomplete : complete),
    modulePath: fixture.capturePath
  });
  assert.equal(outcome.completed, true, JSON.stringify(outcome));
  assert.equal(launches, 2);
  const inspected = inspectCodexCaptureReceiptArtifact(fixture.request.receiptPath);
  assert.equal(inspected.receipt.attemptCount, 2);
  assert.equal(inspected.receipt.attempts[0].diagnosticCode, "codex-jsonl-turn-completed-missing");
  assert.equal(inspected.receipt.attempts[1].diagnosticCode, "codex-jsonl-final-agent-complete");
}));

test("capture never retries malformed or ambiguous transport", async () => withTemporaryAsync(async (root) => {
  const fixture = captureFixture(root);
  let launches = 0;
  const outcome = await executeCodexCaptureRequest(fixture.request.requestPath, fixture.written.requestDigest, {
    spawnChild: () => { launches += 1; return childFixture("not-json\n"); },
    modulePath: fixture.capturePath
  });
  assert.equal(outcome.completed, false);
  assert.equal(outcome.code, "codex-jsonl-line-malformed");
  assert.equal(launches, 1);
  const inspected = inspectCodexCaptureReceiptArtifact(fixture.request.receiptPath);
  assert.equal(inspected.available, true);
  assert.equal(inspected.receipt.attemptCount, 1);
  assert.equal(inspected.receipt.artifactReceiptState, "absent");
}));

test("capture preserves typed event failures but classifies an empty nonzero child exit", async () => {
  await withTemporaryAsync(async (root) => {
    const fixture = captureFixture(root);
    const malformed = await executeCodexCaptureRequest(fixture.request.requestPath, fixture.written.requestDigest, {
      spawnChild: () => childFixture("not-json\n", "discarded", 1),
      modulePath: fixture.capturePath,
      eventContractPath: fixture.eventContractPath
    });
    assert.equal(malformed.code, "codex-jsonl-line-malformed");
    assert.equal(malformed.attempts, 1);
  });
  await withTemporaryAsync(async (root) => {
    const fixture = captureFixture(root);
    const empty = await executeCodexCaptureRequest(fixture.request.requestPath, fixture.written.requestDigest, {
      spawnChild: () => childFixture("", "discarded", 1),
      modulePath: fixture.capturePath,
      eventContractPath: fixture.eventContractPath
    });
    assert.equal(empty.code, "codex-capture-child-exit-nonzero");
    assert.equal(empty.attempts, 1);
  });
  await withTemporaryAsync(async (root) => {
    const fixture = captureFixture(root);
    const complete = eventLine({ type: "thread.started", thread_id: "thread" }) + eventLine({ type: "turn.started" }) +
      eventLine({ type: "item.completed", item: { id: "final", type: "agent_message", text: passedPayload } }) +
      eventLine({ type: "turn.completed" });
    const failedExit = await executeCodexCaptureRequest(fixture.request.requestPath, fixture.written.requestDigest, {
      spawnChild: () => childFixture(complete, "discarded", 1),
      modulePath: fixture.capturePath,
      eventContractPath: fixture.eventContractPath
    });
    assert.equal(failedExit.code, "codex-capture-child-exit-nonzero");
    assert.equal(failedExit.attempts, 1);
    const inspected = inspectCodexCaptureReceiptArtifact(fixture.request.receiptPath);
    assert.equal(inspected.available, true, JSON.stringify(inspected));
    assert.equal(inspected.receipt.terminalClassification, "unavailable");
    assert.equal(inspected.receipt.artifactReceiptState, "absent");
  });
});

test("capture waits for confirmed child exit and force-terminates an uncooperative rejected stream", async () => withTemporaryAsync(async (root) => {
  const fixture = captureFixture(root);
  const child = new EventEmitter();
  child.pid = 12345;
  child.stdout = new PassThrough();
  child.stderr = new PassThrough();
  const signals = [];
  let closed = false;
  child.kill = (signal) => {
    signals.push(signal);
    if (signal === "SIGKILL") {
      queueMicrotask(() => {
        closed = true;
        child.stdout.end();
        child.stderr.end();
        child.emit("close", null, "SIGKILL");
      });
    }
    return true;
  };
  queueMicrotask(() => child.stdout.write("not-json\n"));

  const outcome = await executeCodexCaptureRequest(fixture.request.requestPath, fixture.written.requestDigest, {
    spawnChild: () => child,
    modulePath: fixture.capturePath,
    eventContractPath: fixture.eventContractPath,
    terminationGraceMs: 1
  });
  assert.equal(closed, true, "capture settles only after child close");
  assert.deepEqual(signals, ["SIGTERM", "SIGKILL"]);
  assert.equal(outcome.code, "codex-jsonl-line-malformed");
  assert.equal(inspectCodexCaptureReceiptArtifact(fixture.request.receiptPath).available, true);
}));
