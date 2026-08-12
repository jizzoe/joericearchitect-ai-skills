#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../../..");
const utility = path.join(repoRoot, "scripts/skills/install-global-skill.mjs");
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "skill-install-utility-fixture-"));
const localSource = path.join(tempRoot, "second checkout with spaces");

function dryRun(args) {
  const result = spawnSync(process.execPath, [utility, ...args, "--dry-run"], { encoding: "utf8" });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  return JSON.parse(result.stdout);
}

try {
  fs.mkdirSync(localSource, { recursive: true });
  assert.deepEqual(dryRun(["--local", localSource, "--skill", "skills/base/github-pr-linkage", "--agent", "codex", "--force"]), {
    command: "gh",
    args: ["skill", "install", localSource, "skills/base/github-pr-linkage", "--from-local", "--agent", "codex", "--scope", "user", "--force"]
  });
  assert.deepEqual(dryRun(["--remote", "owner/repository", "--all", "--agent", "claude-code", "--pin", "abc123"]), {
    command: "gh",
    args: ["skill", "install", "owner/repository", "--all", "--agent", "claude-code", "--scope", "user", "--pin", "abc123"]
  });
  console.log(JSON.stringify({ localSource, result: "install utility dry-run fixtures passed" }, null, 2));
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}
