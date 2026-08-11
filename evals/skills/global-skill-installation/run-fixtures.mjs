#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../../..");
const skillName = "github-pr-linkage";
const args = process.argv.slice(2);
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "global-skill-installation-"));
const home = path.join(tempRoot, "fixture home");
const source = path.join(tempRoot, "second product source");
const env = { ...process.env, HOME: home, GH_CONFIG_DIR: path.join(home, ".config", "gh") };

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { cwd: repoRoot, encoding: "utf8", env, ...options });
  if (result.error) throw result.error;
  return result;
}

function expectSuccess(label, command, args) {
  const result = run(command, args);
  assert.equal(result.status, 0, `${label}\n${result.stdout}\n${result.stderr}`);
  return result;
}

function skillPath(agent) {
  return agent === "claude-code"
    ? path.join(home, ".claude", "skills", skillName, "SKILL.md")
    : path.join(home, ".codex", "skills", skillName, "SKILL.md");
}

function install(agent) {
  return expectSuccess(`install for ${agent}`, "gh", [
    "skill", "install", source, "--from-local", "--all", "--agent", agent, "--scope", "user"
  ]);
}

function list(agent) {
  const result = expectSuccess(`list for ${agent}`, "gh", [
    "skill", "list", "--agent", agent, "--scope", "user", "--json", "skillName,agentHosts,path,scope,sourceURL,version,pinned"
  ]);
  return JSON.parse(result.stdout);
}

function version(command) {
  const result = run(command, ["--version"]);
  return result.status === 0 ? result.stdout.trim() : `unavailable: ${result.stderr.trim()}`;
}

function option(name) {
  const index = args.indexOf(name);
  return index === -1 ? undefined : args[index + 1];
}

function authenticatedInvocation(agent, fixturePath) {
  const isClaude = agent === "claude-code";
  const installedSkill = isClaude
    ? path.join(fixturePath, "skills", skillName)
    : path.join(fixturePath, ".codex", "skills", skillName);
  assert.equal(fs.existsSync(installedSkill), false, `${agent} fixture home already contains ${skillName}`);

  const fixtureEnv = { ...process.env };
  // Use the platform trust store for agent calls, not a caller's custom CA bundle.
  delete fixtureEnv.SSL_CERT_FILE;
  delete fixtureEnv.SSL_CERT_DIR;
  Object.assign(fixtureEnv, {
    ...(isClaude
      ? { CLAUDE_CONFIG_DIR: fixturePath }
      : { HOME: fixturePath, CODEX_HOME: path.join(fixturePath, ".codex") })
  });
  const workspace = path.join(tempRoot, `${agent} invocation workspace`);
  fs.mkdirSync(workspace, { recursive: true });

  try {
    const auth = spawnSync(
      agent === "claude-code" ? "claude" : "codex",
      agent === "claude-code" ? ["auth", "status"] : ["login", "status"],
      { cwd: workspace, encoding: "utf8", env: fixtureEnv }
    );
    if (auth.status !== 0) {
      return { status: "blocked", reason: `${agent} disposable profile is not authenticated` };
    }

    const installArgs = isClaude
      ? ["skill", "install", source, "--from-local", "--all", "--dir", path.join(fixturePath, "skills")]
      : ["skill", "install", source, "--from-local", "--all", "--agent", agent, "--scope", "user"];
    const installResult = spawnSync("gh", installArgs, {
      cwd: workspace,
      encoding: "utf8",
      env: fixtureEnv
    });
    if (installResult.status !== 0) {
      return { status: "blocked", reason: `${agent} fixture installation failed` };
    }
    const listArgs = isClaude
      ? ["skill", "list", "--dir", path.join(fixturePath, "skills"), "--json", "skillName,path,scope,sourceURL,version,pinned"]
      : ["skill", "list", "--agent", agent, "--scope", "user", "--json", "skillName,path,scope,sourceURL,version,pinned"];
    const listed = spawnSync("gh", listArgs, { cwd: workspace, encoding: "utf8", env: fixtureEnv });
    if (listed.status !== 0 || !JSON.parse(listed.stdout).some((item) => item.skillName === skillName)) {
      return { status: "blocked", reason: `${agent} could not verify its installed skill with gh skill list` };
    }

    const invocation = agent === "claude-code"
      ? spawnSync("claude", [
          "-p", "/github-pr-linkage State in one sentence what this skill is for.",
          "--no-session-persistence", "--tools", ""
        ], { cwd: workspace, encoding: "utf8", env: fixtureEnv })
      : spawnSync("codex", [
          "exec", "--skip-git-repo-check", "--ephemeral", "--sandbox", "read-only",
          "-C", workspace, "$github-pr-linkage State in one sentence what this skill is for."
        ], { cwd: workspace, encoding: "utf8", env: fixtureEnv });
    if (invocation.status !== 0 || !invocation.stdout.trim()) {
      const transportFailure = /invalid peer certificate|stream disconnected|http\/request failed/i.test(invocation.stderr);
      return {
        status: "blocked",
        reason: transportFailure
          ? `${agent} could not reach its service because the configured TLS trust chain rejected the peer certificate`
          : `${agent} invocation failed; inspect the disposable-profile command output`
      };
    }

    return {
      status: "passed",
      output: invocation.stdout.trim().replaceAll(/\s+/g, " ").slice(0, 240)
    };
  } finally {
    fs.rmSync(installedSkill, { recursive: true, force: true });
  }
}

try {
  fs.mkdirSync(path.join(source, "skills", "base"), { recursive: true });
  fs.cpSync(path.join(repoRoot, "skills", "base", skillName), path.join(source, "skills", "base", skillName), { recursive: true });

  const discoveryOnly = expectSuccess("local-source skill discovery", "gh", ["skill", "install", source, "--from-local"]);
  assert.match(discoveryOnly.stdout, new RegExp(skillName));
  assert.equal(fs.existsSync(path.join(home, ".claude")), false, "discovery must not mutate the fixture home");

  for (const agent of ["claude-code", "codex"]) {
    install(agent);
    assert.equal(fs.existsSync(skillPath(agent)), true, `${agent} destination should contain SKILL.md`);
    const installed = list(agent).find((item) => item.skillName === skillName);
    assert.ok(installed, `${agent} should list the installed skill`);
    assert.equal(installed.scope, "user");
    assert.equal(path.resolve(installed.path, "SKILL.md"), path.resolve(skillPath(agent)));

    const rerun = run("gh", ["skill", "install", source, "--from-local", "--all", "--agent", agent, "--scope", "user"]);
    assert.notEqual(rerun.status, 0, `${agent} rerun must not silently overwrite an existing skill`);

    const skillsDirectory = path.dirname(path.dirname(skillPath(agent)));
    const updateCheck = run("gh", ["skill", "update", "--dry-run", "--dir", skillsDirectory]);
    assert.equal(updateCheck.status, 0, `${agent} update dry run must not mutate or fail`);
    assert.equal(fs.existsSync(skillPath(agent)), true, `${agent} update dry run must preserve the installed skill`);
  }

  const conflictHome = path.join(tempRoot, "conflict home");
  fs.mkdirSync(path.join(conflictHome, ".claude", "skills", skillName), { recursive: true });
  fs.writeFileSync(path.join(conflictHome, ".claude", "skills", skillName, "SKILL.md"), "# User authored\n", "utf8");
  const conflict = spawnSync("gh", ["skill", "install", source, "--from-local", "--all", "--agent", "claude-code", "--scope", "user"], {
    cwd: repoRoot,
    encoding: "utf8",
    env: { ...env, HOME: conflictHome, GH_CONFIG_DIR: path.join(conflictHome, ".config", "gh") }
  });
  assert.notEqual(conflict.status, 0, "user-authored destination conflict must not be overwritten");
  assert.equal(fs.readFileSync(path.join(conflictHome, ".claude", "skills", skillName, "SKILL.md"), "utf8"), "# User authored\n");

  const claudeConfigDir = option("--authenticated-claude-config-dir");
  const codexHome = option("--authenticated-codex-home");
  const agentInvocation = {
    "claude-code": claudeConfigDir
      ? authenticatedInvocation("claude-code", path.resolve(claudeConfigDir))
      : "blocked: an authenticated macOS Claude Code account and disposable CLAUDE_CONFIG_DIR were not provided",
    codex: codexHome
      ? authenticatedInvocation("codex", path.resolve(codexHome))
      : "blocked: an authenticated disposable Codex profile was not provided"
  };

  console.log(JSON.stringify({
    gh: run("gh", ["--version"]).stdout.split("\n")[0],
    claudeCode: version("claude"),
    codex: version("codex"),
    fixtureHome: home,
    source,
    agents: ["claude-code", "codex"],
    agentInvocation,
    result: "install/list fixtures passed"
  }, null, 2));
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}
