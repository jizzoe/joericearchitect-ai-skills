import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { buildInstallArguments, installResult, parseArguments, redactArguments, run } from "../install-global-skill.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const utility = path.resolve(__dirname, "../install-global-skill.mjs");

function parse(args) {
  return parseArguments(args);
}

function expectInvalid(args, message) {
  assert.throws(() => parse(args), new RegExp(message));
}

function withStubbedGh(callback) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "skill-install-utility-"));
  const bin = path.join(root, "bin");
  const record = path.join(root, "gh-args.json");
  fs.mkdirSync(bin);
  const stub = path.join(bin, "gh");
  fs.writeFileSync(stub, "#!/usr/bin/env node\nconst fs = require('node:fs');\nfs.writeFileSync(process.env.GH_STUB_RECORD, JSON.stringify(process.argv.slice(2)));\nprocess.exit(Number(process.env.GH_STUB_STATUS || 0));\n", "utf8");
  fs.chmodSync(stub, 0o755);
  try {
    callback({
      record,
      run(args, environment = {}) {
        return spawnSync(process.execPath, [utility, ...args], {
          encoding: "utf8",
          env: {
            ...process.env,
            ...environment,
            GH_STUB_RECORD: record,
            PATH: `${bin}${path.delimiter}${process.env.PATH}`
          }
        });
      }
    });
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

test("builds a local user-scope command without shell interpolation", () => {
  const options = parse(["--local", "/tmp/source with spaces", "--skill", "skills/base/example", "--agent", "codex", "--force"]);
  assert.deepEqual(buildInstallArguments(options), [
    "skill", "install", "/tmp/source with spaces", "skills/base/example", "--from-local", "--agent", "codex", "--scope", "user", "--force"
  ]);
});

test("builds a pinned remote all-skills command", () => {
  const options = parse(["--remote", "owner/repository", "--all", "--agent", "claude-code", "--pin", "abc123"]);
  assert.deepEqual(buildInstallArguments(options), [
    "skill", "install", "owner/repository", "--all", "--agent", "claude-code", "--scope", "user", "--pin", "abc123"
  ]);
});

for (const [name, args, message] of [
  ["missing source", ["--all", "--agent", "codex"], "exactly one"],
  ["both sources", ["--local", ".", "--remote", "owner/repo", "--all", "--agent", "codex"], "exactly one"],
  ["missing selector", ["--local", ".", "--agent", "codex"], "exactly one"],
  ["both selectors", ["--local", ".", "--skill", "skills/base/example", "--all", "--agent", "codex"], "exactly one"],
  ["invalid remote source", ["--remote", "https://owner/repository", "--all", "--agent", "codex"], "owner/repository"],
  ["missing agent", ["--local", ".", "--all"], "--agent is required"],
  ["local pin", ["--local", ".", "--all", "--agent", "codex", "--pin", "abc123"], "only with --remote"],
  ["unknown option", ["--local", ".", "--all", "--agent", "codex", "--unexpected"], "unknown option"]
]) {
  test(`rejects ${name}`, () => expectInvalid(args, message));
}

test("redacts credentials from rendered arguments", () => {
  assert.deepEqual(redactArguments(["https://secret@example.com/repository"]), ["https://<redacted>@example.com/repository"]);
});

test("dry run renders arguments and does not invoke gh", () => {
  withStubbedGh(({ record, run }) => {
    const result = run(["--local", "/tmp/source with spaces", "--all", "--agent", "codex", "--dry-run"]);
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(JSON.parse(result.stdout), {
      command: "gh",
      args: ["skill", "install", "/tmp/source with spaces", "--from-local", "--all", "--agent", "codex", "--scope", "user"]
    });
    assert.equal(fs.existsSync(record), false);
  });
});

test("executes gh with the exact remote argument array", () => {
  withStubbedGh(({ record, run }) => {
    const result = run(["--remote", "owner/repository", "--skill", "skills/base/example", "--agent", "claude-code", "--pin", "abc123", "--force"]);
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(JSON.parse(fs.readFileSync(record, "utf8")), [
      "skill", "install", "owner/repository", "skills/base/example", "--agent", "claude-code", "--scope", "user", "--force", "--pin", "abc123"
    ]);
  });
});

test("preserves a nonzero gh exit status", () => {
  withStubbedGh(({ run }) => {
    const result = run(["--remote", "owner/repository", "--all", "--agent", "codex"], { GH_STUB_STATUS: "7" });
    assert.equal(result.status, 7);
    assert.match(result.stderr, /unpinned/);
  });
});

test("prints help without requiring install arguments", () => {
  const result = spawnSync(process.execPath, [utility, "--help"], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Usage:/);
});

test("the machine-readable result states the phase, redacted command, and outcome", () => {
  const written = [];
  const status = run(
    { local: "/reviewed/checkout", all: true, agent: "claude", result: true, dryRun: true },
    { write: (line) => written.push(line), writeError: () => {} }
  );
  const receipt = JSON.parse(written.join("\n"));
  assert.equal(status, 0);
  assert.equal(receipt.ok, true);
  assert.equal(receipt.phase, "dry-run");
  assert.equal(receipt.source, "local");
  assert.equal(receipt.agent, "claude");
  assert.equal(receipt.command.executable, "gh");
  assert.equal(receipt.dryRun, true);
});

test("a failed invocation reports its phase and recovery code without scraping output", () => {
  const written = [];
  const status = run(
    { remote: "owner/repo", pin: "v1.0.0", all: true, agent: "codex", result: true },
    {
      spawn: () => ({ status: 3 }),
      write: (line) => written.push(line),
      writeError: () => {}
    }
  );
  const receipt = JSON.parse(written.join("\n"));
  assert.equal(status, 3);
  assert.equal(receipt.ok, false);
  assert.equal(receipt.phase, "invoke");
  assert.equal(receipt.code, "gh-skill-install-failed");
  assert.equal(receipt.pin, "v1.0.0");

  const unavailable = [];
  run(
    { local: "/reviewed/checkout", all: true, agent: "claude", result: true },
    { spawn: () => ({ error: new Error("spawn gh ENOENT") }), write: (line) => unavailable.push(line), writeError: () => {} }
  );
  assert.equal(JSON.parse(unavailable.join("\n")).code, "gh-unavailable");
});

test("a credential embedded in a remote source is redacted in the result", () => {
  const written = [];
  run(
    { remote: "https://user:secret-token@example.invalid/owner/repo", pin: "v1.0.0", all: true, agent: "claude", result: true, dryRun: true },
    { write: (line) => written.push(line), writeError: () => {} }
  );
  const serialized = written.join("\n");
  assert.doesNotMatch(serialized, /secret-token/);
  assert.match(serialized, /<redacted>@/);
});
