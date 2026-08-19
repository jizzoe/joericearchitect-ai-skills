import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { parseEntrypointArgs, readRequest, runHelperEntrypoint } from "../payload-wrapper.mjs";
import { createWorkspaceIo, workspaceIoFromEnvironment } from "../workspace-io.mjs";
import { loadManifest } from "../registry.mjs";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const temporaryDirectory = (prefix) => fs.mkdtempSync(path.join(os.tmpdir(), prefix));

function capture(options) {
  const written = [];
  const errors = [];
  const status = runHelperEntrypoint({
    ...options,
    io: { ...options.io, write: (line) => written.push(line), writeError: (line) => errors.push(line) }
  });
  const text = written.join("\n");
  let payload = null;
  try { payload = text ? JSON.parse(text) : null; } catch { payload = null; }
  return { status, written, errors, text, payload };
}

const operations = { "do-thing": (payload) => ({ echoed: payload }), "explode": () => { throw new Error("boom"); } };

test("a payload request reaches its declared operation and returns a JSON result", () => {
  const result = capture({
    helper: "example", invocation: "payload", argv: ["--stdin"], operations,
    io: { readFile: () => JSON.stringify({ operation: "do-thing", payload: { a: 1 } }) }
  });
  assert.equal(result.status, 0);
  assert.deepEqual(result.payload, { ok: true, helper: "example", operation: "do-thing", result: { echoed: { a: 1 } } });
});

test("a subcommand request takes its verb from the command line", () => {
  const result = capture({
    helper: "example", invocation: "subcommand", argv: ["do-thing", "--stdin"], operations,
    io: { readFile: () => JSON.stringify({ b: 2 }) }
  });
  assert.equal(result.status, 0);
  assert.deepEqual(result.payload.result, { echoed: { b: 2 } });
});

test("an undeclared operation or verb is refused", () => {
  const undeclaredOperation = capture({
    helper: "example", invocation: "payload", argv: ["--stdin"], operations,
    io: { readFile: () => JSON.stringify({ operation: "not-declared" }) }
  });
  assert.equal(undeclaredOperation.status, 2);
  assert.equal(undeclaredOperation.payload.error.code, "operation-not-declared");

  const undeclaredVerb = capture({
    helper: "example", invocation: "subcommand", argv: ["not-declared", "--stdin"], operations,
    io: { readFile: () => "{}" }
  });
  assert.equal(undeclaredVerb.payload.error.code, "operation-not-declared");
});

test("malformed invocations are usage failures, not crashes", () => {
  const noSource = capture({ helper: "example", invocation: "payload", argv: [], operations });
  assert.equal(noSource.status, 2);
  assert.equal(noSource.payload.error.code, "request-source-required");

  const ambiguous = capture({ helper: "example", invocation: "payload", argv: ["--stdin", "--input", "x.json"], operations });
  assert.equal(ambiguous.payload.error.code, "request-source-ambiguous");

  const unexpected = capture({ helper: "example", invocation: "payload", argv: ["--nope"], operations });
  assert.equal(unexpected.payload.error.code, "unexpected-argument");

  const unreadable = capture({
    helper: "example", invocation: "payload", argv: ["--input", "/does/not/exist.json"], operations
  });
  assert.equal(unreadable.payload.error.code, "request-unreadable");

  const notJson = capture({
    helper: "example", invocation: "payload", argv: ["--stdin"], operations, io: { readFile: () => "not json" }
  });
  assert.equal(notJson.payload.error.code, "request-not-json");
});

test("an operation failure is reported without leaking a stack trace", () => {
  const result = capture({
    helper: "example", invocation: "payload", argv: ["--stdin"], operations,
    io: { readFile: () => JSON.stringify({ operation: "explode" }) }
  });
  assert.equal(result.status, 1);
  assert.equal(result.payload.error.code, "operation-failed");
  assert.equal(result.payload.error.message, "boom");
  assert.doesNotMatch(result.written.join("\n"), /at .*payload-wrapper/);
});

test("help lists declared operations and exits successfully", () => {
  const result = capture({ helper: "example", invocation: "payload", argv: ["--help"], operations });
  assert.equal(result.status, 0);
  assert.match(result.written.join("\n"), /operations: do-thing, explode/);
  const verbs = capture({ helper: "example", invocation: "subcommand", argv: ["--help"], operations });
  assert.match(verbs.written.join("\n"), /verbs: do-thing, explode/);
});

test("argument parsing and request reading are independently correct", () => {
  assert.equal(parseEntrypointArgs(["--stdin"], { invocation: "subcommand" }).ok, false);
  assert.equal(parseEntrypointArgs(["verb", "--stdin"], { invocation: "subcommand" }).args.verb, "verb");
  assert.equal(parseEntrypointArgs(["--input"], { invocation: "payload" }).code, "input-path-required");
  const file = path.join(temporaryDirectory("payload-"), "request.json");
  fs.writeFileSync(file, JSON.stringify({ operation: "do-thing" }));
  assert.deepEqual(readRequest({ input: file }).request, { operation: "do-thing" });
});

test("workspace io confines reads and writes to the validated target", () => {
  const root = fs.realpathSync(temporaryDirectory("workspace-io-"));
  const io = createWorkspaceIo(root);

  const receipt = io.writeArtifactsAtomically([
    { path: "nested/findings.md", content: "# findings\n" },
    { path: "nested/sources.md", content: "# sources\n" }
  ]);
  assert.equal(receipt.committed, true);
  assert.equal(io.readArtifact("nested/findings.md"), "# findings\n");
  assert.equal(io.readArtifact("absent.md"), undefined);

  assert.throws(() => io.readArtifact("../escape.md"), /workspace-path-escape|workspace-path-invalid/);
  assert.throws(() => io.readArtifact("/etc/hosts"), /workspace-path-invalid/);
  assert.throws(() => io.writeArtifactsAtomically([{ path: "../escape.md", content: "x" }]), /workspace-path/);

  // A staging failure in a multi-file transaction leaves nothing behind.
  assert.throws(() => io.writeArtifactsAtomically([
    { path: "ok.md", content: "ok" }, { path: "bad.md", content: 42 }
  ]));
  assert.equal(fs.existsSync(path.join(root, "ok.md")), false);
  assert.equal(fs.readdirSync(root).filter((name) => name.endsWith(".tmp")).length, 0);

  assert.equal(workspaceIoFromEnvironment({}), null);
  assert.equal(workspaceIoFromEnvironment({ AI_SKILLS_TARGET_REPOSITORY: root }).root, root);
});

test("every declared payload and subcommand entrypoint answers --help", () => {
  const { manifest } = loadManifest(repositoryRoot);
  const wrapped = manifest.entrypoints.filter((entry) => entry.module.startsWith("scripts/runtime/bin/"));
  // Seven helpers that export functions but are not dispatchable as programs.
  assert.equal(wrapped.length, 7);
  for (const entry of wrapped) {
    const result = spawnSync(process.execPath, [path.join(repositoryRoot, entry.module), "--help"], { encoding: "utf8" });
    assert.equal(result.status, 0, `${entry.name} --help exited ${result.status}`);
    assert.match(result.stdout, /usage: /);
    // The help text names operations, never a filesystem module path.
    assert.doesNotMatch(result.stdout, /\.mjs/);
  }
});
